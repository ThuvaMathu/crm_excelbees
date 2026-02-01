import { Redis } from "@upstash/redis";

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
