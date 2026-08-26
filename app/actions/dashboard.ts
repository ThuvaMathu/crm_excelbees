'use server';

import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { getLeads } from "@/lib/firestore/leads";
import { getDeals } from "@/lib/firestore/deals";
import { getCompanies } from "@/lib/firestore/companies";
import { getProjects } from "@/lib/firestore/projects";
import { getTasks } from "@/lib/firestore/tasks";
import { getInvoiceStats } from "@/lib/firestore/invoices";
import { auth } from "@/lib/auth/server-auth";
import { getOrganizationMember } from "@/lib/firestore/organizations";

const CACHE_TTL = 300;

export interface DashboardStats {
    totalLeads: number;
    activeDeals: number;
    totalCompanies: number;
    totalRevenue: number;
    activeProjects: number;
    pendingTasks: number;
    upcomingTasks: any[];
}

const toMillis = (ts: any): number => {
    if (!ts) return Infinity;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.seconds === 'number') return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts === 'string') return new Date(ts).getTime();
    return Infinity;
};

const toISO = (ts: any): string | null => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
    if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000).toISOString();
    if (ts instanceof Date) return ts.toISOString();
    if (typeof ts === 'string') return ts;
    return null;
};

export async function getCachedDashboardStats(userId: string, organizationId?: string): Promise<DashboardStats | null> {
    if (!userId) return null;

    // Verify the caller's session matches the requested user, and that the
    // caller is an active member of the requested organization, before
    // trusting the client-supplied userId/organizationId.
    const session = await auth();
    if (!session || session.user.uid !== userId) return null;

    if (organizationId) {
        const { member } = await getOrganizationMember(organizationId, userId);
        if (!member || member.status !== "active") return null;
    }

    const cacheKey = organizationId ? `dashboard:stats:${organizationId}:${userId}` : `dashboard:stats:${userId}`;

    try {
        const cachedData = await redis.get<DashboardStats>(cacheKey);
        if (cachedData) {
            logger.debug("Dashboard stats served from Redis cache", {
                module: "dashboard",
                action: "get-stats",
                userId,
                organizationId,
                metadata: { cache: "hit" },
            });
            return cachedData;
        }

        logger.debug("Dashboard stats cache miss — fetching from Firestore", {
            module: "dashboard",
            action: "get-stats",
            userId,
            organizationId,
            metadata: { cache: "miss" },
        });

        const [
            leadsResult, dealsResult, companiesResult, projectsResult, tasksResult, invoiceStatsResult,
        ] = await Promise.all([
            getLeads(organizationId),
            getDeals(organizationId),
            getCompanies(organizationId),
            getProjects(organizationId),
            getTasks(organizationId, { userId, userRole: "associated" }),
            getInvoiceStats(organizationId),
        ]);

        const activeDeals = dealsResult.deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
        const activeProjects = projectsResult.projects.filter((p) => p.status === "Active");
        const pendingTasks = tasksResult.tasks.filter((t) => t.status !== "Done");

        const upcomingTasks = tasksResult.tasks
            .filter((t) => t.status !== "Done")
            .sort((a, b) => toMillis(a.dueDate) - toMillis(b.dueDate))
            .slice(0, 5)
            .map(t => ({
                id: t.id, title: t.title, description: t.description, status: t.status,
                priority: t.priority, type: t.type, projectId: t.projectId, projectName: t.projectName,
                assigneeId: t.assigneeId, assigneeName: t.assigneeName, tags: t.tags,
                dueDate: toISO(t.dueDate), startDate: toISO(t.startDate),
                createdAt: toISO(t.createdAt), updatedAt: toISO(t.updatedAt), completedAt: toISO(t.completedAt),
            }));

        const stats = {
            totalLeads: leadsResult.leads.length,
            activeDeals: activeDeals.length,
            totalCompanies: companiesResult.companies.length,
            totalRevenue: invoiceStatsResult.stats?.totalRevenue || 0,
            activeProjects: activeProjects.length,
            pendingTasks: pendingTasks.length,
            upcomingTasks,
        };

        await redis.set(cacheKey, stats, { ex: CACHE_TTL });
        return stats;
    } catch (error) {
        logger.error("Failed to get cached dashboard stats", {
            module: "dashboard",
            action: "get-stats",
            userId,
            organizationId,
            error,
        });
        return null;
    }
}
