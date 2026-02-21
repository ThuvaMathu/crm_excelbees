'use server';

import { redis } from "@/lib/redis";
import { getLeads } from "@/lib/firestore/leads";
import { getDeals } from "@/lib/firestore/deals";
import { getCompanies } from "@/lib/firestore/companies";
import { getProjects } from "@/lib/firestore/projects";
import { getTasks } from "@/lib/firestore/tasks";
import { getInvoiceStats } from "@/lib/firestore/invoices";

const CACHE_TTL = 300; // 5 minutes in seconds

export interface DashboardStats {
    totalLeads: number;
    activeDeals: number;
    totalCompanies: number;
    totalRevenue: number;
    activeProjects: number;
    pendingTasks: number;
    upcomingTasks: any[];
}

export async function getCachedDashboardStats(userId: string): Promise<DashboardStats | null> {
    if (!userId) return null;

    const cacheKey = `dashboard:stats:${userId}`;

    try {
        // 1. Try to get from Redis
        const cachedData = await redis.get<DashboardStats>(cacheKey);

        if (cachedData) {
            console.log("⚡ HIT: Dashboard stats served from Redis cache");
            return cachedData;
        }

        console.log("🐢 MISS: Fetching dashboard stats from Firestore");

        // 2. Fetch from Firestore (Parallel)
        const [
            leadsResult,
            dealsResult,
            companiesResult,
            projectsResult,
            tasksResult,
            invoiceStatsResult,
        ] = await Promise.all([
            getLeads(),
            getDeals(),
            getCompanies(),
            getProjects(),
            getTasks({ assigneeId: userId }),
            getInvoiceStats(),
        ]);

        // 3. Process Data
        const activeDeals = dealsResult.deals.filter(
            (d) => d.stage !== "Won" && d.stage !== "Lost"
        );

        const activeProjects = projectsResult.projects.filter(
            (p) => p.status === "Active"
        );

        const pendingTasks = tasksResult.tasks.filter(
            (t) => t.status !== "Done"
        );

        // Get upcoming tasks (next 5, not done)
        // Serialize dates to strings for JSON compatibility if needed, 
        // but typically client components need serializable data anyway.
        // We need to be careful with Firestore Timestamps. `redis` stores JSON string.
        // We should map tasks to a simple format.

        // Helper to safely get millis from Timestamp or plain {seconds, nanoseconds} object
        const toMillis = (ts: any): number => {
            if (!ts) return Infinity;
            if (typeof ts.toMillis === 'function') return ts.toMillis();
            if (typeof ts.seconds === 'number') return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
            if (ts instanceof Date) return ts.getTime();
            if (typeof ts === 'string') return new Date(ts).getTime();
            return Infinity;
        };

        // Helper to safely convert any timestamp-like value to ISO string
        const toISO = (ts: any): string | null => {
            if (!ts) return null;
            if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
            if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000).toISOString();
            if (ts instanceof Date) return ts.toISOString();
            if (typeof ts === 'string') return ts;
            return null;
        };

        const upcomingTasks = tasksResult.tasks
            .filter((t) => t.status !== "Done")
            .sort((a, b) => {
                return toMillis(a.dueDate) - toMillis(b.dueDate);
            })
            .slice(0, 5)
            .map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                type: t.type,
                projectId: t.projectId,
                projectName: t.projectName,
                assigneeId: t.assigneeId,
                assigneeName: t.assigneeName,
                tags: t.tags,
                dueDate: toISO(t.dueDate),
                startDate: toISO(t.startDate),
                createdAt: toISO(t.createdAt),
                updatedAt: toISO(t.updatedAt),
                completedAt: toISO(t.completedAt),
            }));

        const stats = {
            totalLeads: leadsResult.leads.length,
            activeDeals: activeDeals.length,
            totalCompanies: companiesResult.companies.length,
            totalRevenue: invoiceStatsResult.stats?.totalRevenue || 0,
            activeProjects: activeProjects.length,
            pendingTasks: pendingTasks.length,
            upcomingTasks: upcomingTasks
        };

        // 4. Save to Redis
        await redis.set(cacheKey, stats, { ex: CACHE_TTL });

        return stats;

    } catch (error) {
        console.error("Redis Cache Error:", error);
        // Fallback: Return null or throw, likely just return null to let client handle or retry
        throw error;
    }
}
