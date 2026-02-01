'use server';

import { redis } from "@/lib/redis";
import { getLeads } from "@/lib/firestore/leads";
import { getDeals } from "@/lib/firestore/deals";
import { getCompanies } from "@/lib/firestore/companies";
import { getProjects } from "@/lib/firestore/projects";
import { getTasks } from "@/lib/firestore/tasks";
import { getInvoiceStats } from "@/lib/firestore/invoices";

const CACHE_TTL = 300; // 5 minutes in seconds

export async function getCachedDashboardStats(userId: string) {
    if (!userId) return null;

    const cacheKey = `dashboard:stats:${userId}`;

    try {
        // 1. Try to get from Redis
        const cachedData = await redis.get(cacheKey);
        
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

        const upcomingTasks = tasksResult.tasks
            .filter((t) => t.status !== "Done")
            .sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.toMillis() - b.dueDate.toMillis();
            })
            .slice(0, 5)
            .map(t => ({
                ...t,
                // Check if dueDate is a Firestore Timestamp and convert to ISO string or null
                dueDate: t.dueDate && typeof t.dueDate.toDate === 'function' 
                    ? t.dueDate.toDate().toISOString() 
                    : t.dueDate,
                 // Ensure createdAt/updatedAt are also handled if needed, or just stripped
                 createdAt: t.createdAt && typeof t.createdAt.toDate === 'function' ? t.createdAt.toDate().toISOString() : t.createdAt,
                 updatedAt: t.updatedAt && typeof t.updatedAt.toDate === 'function' ? t.updatedAt.toDate().toISOString() : t.updatedAt,
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
