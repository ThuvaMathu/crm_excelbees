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
                // const invoices = invoicesRes.invoices || [];

                // --- Processing ---

                // 1. Initialize last 6 months buckets
                const metricsMap = new Map<string, MonthlyMetric>();
                for (let i = 5; i >= 0; i--) {
                    const date = subMonths(new Date(), i);
                    const key = format(date, "MMM yyyy");
                    metricsMap.set(key, { name: key, revenue: 0, pipeline: 0, leads: 0 });
                }

                // 2. Aggregate Deals (Won = Revenue, Open = Pipeline)
                let totalRev = 0;
                let activeVal = 0;

                deals.forEach(deal => {
                    if (!deal.createdAt) return;
                    // Handle Timestamp or Date objects or strings safely
                    // Assuming deal.createdAt is a Firestore Timestamp with .toDate() or similar mechanism
                    const date = (deal.createdAt as any).toDate ? (deal.createdAt as any).toDate() : new Date(deal.createdAt as any);
                    const key = format(date, "MMM yyyy");

                    if (deal.stage === "Won") {
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
                    // If Last Contacted > 30 days ago AND Status is NOT Lost/Qualified
                    const lastContact = lead.lastContactedAt
                        ? ((lead.lastContactedAt as any).toDate ? (lead.lastContactedAt as any).toDate() : new Date(lead.lastContactedAt as any))
                        : date; // Default to createdAt if never contacted

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
