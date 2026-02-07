import { Redis } from "@upstash/redis";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Upstash Redis credentials not configured");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Queue keys
export const QUEUE_KEYS = {
  emailJobs: "email:jobs",
  processing: "email:processing",
  failed: "email:failed",
  completed: "email:completed",
  scheduled: "email:scheduled",
};

/**
 * Add email job to queue
 */
export async function addEmailJob(job: {
  campaignId: string;
  contactId: string;
  contactEmail: string;
  subject: string;
  html: string;
  plainText?: string;
}) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const emailJob = {
    id: jobId,
    ...job,
    status: "pending",
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date().toISOString(),
  };

  await redis.lpush(QUEUE_KEYS.emailJobs, JSON.stringify(emailJob));
  return jobId;
}

/**
 * Add scheduled job to queue
 */
export async function addScheduledJob(job: {
  campaignId: string;
  userId: string;
  scheduledFor: Date;
}) {
  const jobId = `scheduled_${job.campaignId}_${job.scheduledFor.getTime()}`;

  const scheduledJob = {
    id: jobId,
    campaignId: job.campaignId,
    userId: job.userId,
    scheduledFor: job.scheduledFor.toISOString(),
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };

  // Store in sorted set with score as scheduled timestamp
  await redis.zadd(
    QUEUE_KEYS.scheduled,
    { score: job.scheduledFor.getTime(), member: JSON.stringify(scheduledJob) }
  );

  // Also store in Firestore for persistence and querying
  await adminDb
    .collection("marketing/email-campaigns/scheduled")
    .doc(job.campaignId)
    .set({
      ...scheduledJob,
      scheduledFor: Timestamp.fromDate(job.scheduledFor),
    });

  return jobId;
}

/**
 * Get due scheduled jobs (scheduled time has passed)
 */
export async function getDueScheduledJobs(): Promise<Array<{
  id: string;
  campaignId: string;
  userId: string;
  scheduledFor: string;
}>> {
  const now = Date.now();

  // Get all jobs with score <= now (due to run)
  // Upstash Redis uses zrange with min/max
  const members = await redis.zrange(QUEUE_KEYS.scheduled, 0, now, {
    withScores: false,
  });

  const jobs: Array<{
    id: string;
    campaignId: string;
    userId: string;
    scheduledFor: string;
  }> = [];

  for (const member of members) {
    try {
      const job = JSON.parse(member as string);
      jobs.push(job);
    } catch {
      // Skip invalid JSON
    }
  }

  return jobs;
}

/**
 * Remove scheduled job from queue
 */
export async function removeScheduledJob(campaignId: string): Promise<void> {
  // Get all scheduled jobs
  const members = await redis.zrange(QUEUE_KEYS.scheduled, 0, -1);

  // Find and remove the matching job
  for (const member of members) {
    try {
      const job = JSON.parse(member as string);
      if (job.campaignId === campaignId) {
        await redis.zrem(QUEUE_KEYS.scheduled, member);

        // Also remove from Firestore
        await adminDb
          .collection("marketing/email-campaigns/scheduled")
          .doc(campaignId)
          .delete();

        return;
      }
    } catch {
      // Skip invalid JSON
    }
  }
}

/**
 * Get next job from queue
 */
export async function getNextJob() {
  const jobStr = await redis.rpop(QUEUE_KEYS.emailJobs);
  if (!jobStr) return null;

  const job = JSON.parse(jobStr as string);
  
  // Move to processing
  await redis.lpush(QUEUE_KEYS.processing, JSON.stringify(job));
  
  return job;
}

/**
 * Mark job as completed
 */
export async function completeJob(jobId: string) {
  // Remove from processing
  const processingJobs = await redis.lrange<string>(QUEUE_KEYS.processing, 0, -1);
  const filtered = processingJobs.filter((j) => {
    const job = JSON.parse(j);
    return job.id !== jobId;
  });

  await redis.del(QUEUE_KEYS.processing);
  if (filtered.length > 0) {
    await redis.lpush(QUEUE_KEYS.processing, ...filtered);
  }

  // Add to completed
  await redis.lpush(QUEUE_KEYS.completed, jobId);
}

/**
 * Mark job as failed
 */
export async function failJob(jobId: string, error: string) {
  // Remove from processing
  const processingJobs = await redis.lrange<string>(QUEUE_KEYS.processing, 0, -1);
  const jobStr = processingJobs.find((j) => {
    const parsed = JSON.parse(j);
    return parsed.id === jobId;
  });

  if (jobStr) {
    const parsed = JSON.parse(jobStr);
    parsed.attempts += 1;
    parsed.error = error;

    // Remove from processing
    const filtered = processingJobs.filter((j) => {
      const p = JSON.parse(j);
      return p.id !== jobId;
    });

    await redis.del(QUEUE_KEYS.processing);
    if (filtered.length > 0) {
      await redis.lpush(QUEUE_KEYS.processing, ...filtered);
    }

    // Retry or fail permanently
    if (parsed.attempts < parsed.maxAttempts) {
      // Re-queue for retry
      await redis.lpush(QUEUE_KEYS.emailJobs, JSON.stringify(parsed));
    } else {
      // Permanent failure
      await redis.lpush(QUEUE_KEYS.failed, JSON.stringify(parsed));
    }
  }
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  const [pending, processing, failed, completed] = await Promise.all([
    redis.llen(QUEUE_KEYS.emailJobs),
    redis.llen(QUEUE_KEYS.processing),
    redis.llen(QUEUE_KEYS.failed),
    redis.llen(QUEUE_KEYS.completed),
  ]);

  return {
    pending,
    processing,
    failed,
    completed,
  };
}
