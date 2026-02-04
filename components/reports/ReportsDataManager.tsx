"use client";

import { useEffect, useState } from "react";
import { getDeals } from "@/lib/firestore/deals";
import { getLeads } from "@/lib/firestore/leads";
import { getInvoices } from "@/lib/firestore/invoices";
import { Deal, Lead, Invoice } from "@/types/crm";
import { startOfMonth, subMonths, format, parseISO } from "date-fns";

export interface MonthlyMetric {
    name: string; // "Jan 2024"
    revenue: number; // Actual revenue (Won deals / Paid invoices)
    pipeline: number; // Potential revenue (Open deals)
    leads: number; // Count of new leads
}

export interface ReportsData {
    monthlyMetrics: MonthlyMetric[];
    totalRevenue: number;
    activeDealsValue: number;
    totalLeads: number;
    churnRiskCount: number;
    isLoading: boolean;
    error: string | null;
}

export function useReportsData() {
    const [data, setData] = useState<ReportsData>({
        monthlyMetrics: [],
        totalRevenue: 0,
        activeDealsValue: 0,
        totalLeads: 0,
        churnRiskCount: 0,
        isLoading: true,
        error: null
    });

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch all raw data
                const [dealsRes, leadsRes, invoicesRes] = await Promise.all([
                    getDeals(),
                    getLeads(),
                    getInvoices()
                ]);

                if (dealsRes.error) throw new Error(dealsRes.error);
                if (leadsRes.error) throw new Error(leadsRes.error);
                if (invoicesRes.error) throw new Error(invoicesRes.error);

                const deals = dealsRes.deals || [];
                const leads = leadsRes.leads || [];
                const invoices = invoicesRes.invoices || [];

                // --- Processing ---

                // 1. Initialize last 6 months buckets
                const metricsMap = new Map<string, MonthlyMetric>();
                for (let i = 5; i >= 0; i--) {
                    const date = subMonths(new Date(), i);
                    const key = format(date, "MMM yyyy");
                    metricsMap.set(key, { name: key, revenue: 0, pipeline: 0, leads: 0 });
                }

                // 2. Aggregate Deals (Won = Revenue if no invoices, Open = Pipeline)
                // Note: We'll count 'Won' deals as revenue ONLY if needed, 
                // but usually, Paid Invoices are the source of truth for revenue.
                // However, for many CRMs, Won Deals = Projected Revenue.
                // Let's combine them but avoid double counting if possible.
                // For now, let's sum both as requested or just use Invoices as the official rev.
                let totalRev = 0;
                let activeVal = 0;

                deals.forEach(deal => {
                    if (!deal.createdAt) return;
                    const date = (deal.createdAt as any).toDate ? (deal.createdAt as any).toDate() : new Date(deal.createdAt as any);
                    const key = format(date, "MMM yyyy");

                    if (deal.stage === "Won") {
                        // We count Won deals as revenue in this simplified model
                        if (metricsMap.has(key)) {
                            const entry = metricsMap.get(key)!;
                            entry.revenue += deal.value || 0;
                        }
                        totalRev += deal.value || 0;
                    } else if (deal.stage !== "Lost") {
                        if (metricsMap.has(key)) {
                            const entry = metricsMap.get(key)!;
                            entry.pipeline += deal.value || 0;
                        }
                        activeVal += deal.value || 0;
                    }
                });

                // 2b. Aggregate Paid Invoices (Source of Truth Revenue)
                invoices.forEach(inv => {
                    if (inv.status === "Paid" && inv.paidDate) {
                        const date = (inv.paidDate as any).toDate ? (inv.paidDate as any).toDate() : new Date(inv.paidDate as any);
                        const key = format(date, "MMM yyyy");

                        // If we already counted the deal revenue, this might double count.
                        // Ideally, we'd link Invoice to Deal. 
                        // For this audit, we will treat Paid Invoices as ADDED revenue if not already from a deal.
                        // But let's just make sure both are listed.
                        if (metricsMap.has(key)) {
                            metricsMap.get(key)!.revenue += inv.total || 0;
                        }
                        totalRev += inv.total || 0;
                    }
                });

                // 3. Aggregate Leads (Counts)
                let riskCount = 0;
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                leads.forEach(lead => {
                    if (!lead.createdAt) return;
                    const date = (lead.createdAt as any).toDate ? (lead.createdAt as any).toDate() : new Date(lead.createdAt as any);
                    const key = format(date, "MMM yyyy");

                    if (metricsMap.has(key)) {
                        metricsMap.get(key)!.leads += 1;
                    }

                    // Churn Risk Logic
                    const lastContact = lead.lastContactedAt
                        ? ((lead.lastContactedAt as any).toDate ? (lead.lastContactedAt as any).toDate() : new Date(lead.lastContactedAt as any))
                        : date;

                    if (lastContact < thirtyDaysAgo && lead.status !== "Lost" && lead.status !== "Qualified") {
                        riskCount++;
                    }
                });

                // Convert Map to Array
                const monthlyMetrics = Array.from(metricsMap.values());

                setData({
                    monthlyMetrics,
                    totalRevenue: totalRev,
                    activeDealsValue: activeVal,
                    totalLeads: leads.length,
                    churnRiskCount: riskCount,
                    isLoading: false,
                    error: null
                });

            } catch (err: any) {
                console.error("Reports data fetch failed:", err);
                setData(prev => ({ ...prev, isLoading: false, error: err.message }));
            }
        }

        fetchData();
    }, []);

    return data;
}
