"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable, aiAccessDenied } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, SearchIntent } from "@/types/gemini";
import { getLeads } from "@/lib/firestore/leads";
import { getContacts } from "@/lib/firestore/contacts";
import { getCompanies } from "@/lib/firestore/companies";
import { getDeals } from "@/lib/firestore/deals";
import { getProjects } from "@/lib/firestore/projects";
import { getTasks } from "@/lib/firestore/tasks";
import { getInvoices } from "@/lib/firestore/invoices";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  url: string;
}

export async function parseSearchIntent(query: string): Promise<AIResult<SearchIntent>> {
  const guard = aiUnavailable<SearchIntent>({} as SearchIntent);
  if (guard) return guard;
  const accessDenied = await aiAccessDenied<SearchIntent>({} as SearchIntent);
  if (accessDenied) return accessDenied;

  const start = Date.now();

  try {
    const result = await generateText({
      prompt: PROMPTS.searchIntent(query),
      temperature: GEMINI_CONFIG.searchIntent.temperature,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to parse search", data: null };
    }

    const parsed = extractJSON<SearchIntent>(result);
    if (!parsed || !parsed.collection) {
      return { success: false, error: "Could not understand query", data: null };
    }

    logAI("search", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed, error: null };
  } catch (error) {
    logAI("search", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Search failed", data: null };
  }
}

export async function smartSearch(query: string, organizationId: string): Promise<AIResult<SearchResult[]>> {
  const intentResult = await parseSearchIntent(query);
  if (!intentResult.success || !intentResult.data) {
    return { success: false, error: intentResult.error, data: [] };
  }

  const intent = intentResult.data;

  try {
    let results: SearchResult[] = [];

    switch (intent.collection) {
      case "leads": {
        const { leads = [] } = await getLeads(organizationId, {});
        results = leads.map((l: any) => ({
          id: l.id,
          title: `${l.firstName} ${l.lastName}`,
          subtitle: `${l.companyName || ""} • ${l.status}`,
          type: "lead",
          url: `/org/${organizationId}/leads/${l.id}`,
        }));
        break;
      }
      case "contacts": {
        const { contacts = [] } = await getContacts(organizationId, {});
        results = contacts.map((c: any) => ({
          id: c.id,
          title: `${c.firstName} ${c.lastName}`,
          subtitle: `${c.companyName || c.jobTitle || ""} • ${c.email}`,
          type: "contact",
          url: `/org/${organizationId}/contacts/${c.id}`,
        }));
        break;
      }
      case "companies": {
        const { companies = [] } = await getCompanies(organizationId, {});
        results = companies.map((c: any) => ({
          id: c.id,
          title: c.name,
          subtitle: `${c.industry || ""} • ${c.size || ""}`,
          type: "company",
          url: `/org/${organizationId}/companies/${c.id}`,
        }));
        break;
      }
      case "deals": {
        const { deals = [] } = await getDeals(organizationId, {});
        const filtered = (intent.filters as any).stage
          ? deals.filter((d: any) => d.stage === (intent.filters as any).stage)
          : deals;
        results = filtered.map((d: any) => ({
          id: d.id,
          title: d.title,
          subtitle: `${d.companyName || ""} • $${d.value?.toLocaleString() || 0} • ${d.stage}`,
          type: "deal",
          url: `/org/${organizationId}/deals/${d.id}`,
        }));
        break;
      }
      case "projects": {
        const { projects = [] } = await getProjects(organizationId, {});
        results = projects.map((p: any) => ({
          id: p.id,
          title: p.name,
          subtitle: `${p.status} • ${p.priority}`,
          type: "project",
          url: `/org/${organizationId}/projects/${p.id}`,
        }));
        break;
      }
      case "tasks": {
        const { tasks = [] } = await getTasks(organizationId, {});
        results = tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          subtitle: `${t.status} • ${t.priority}`,
          type: "task",
          url: `/org/${organizationId}/tasks/${t.id}`,
        }));
        break;
      }
      case "invoices": {
        const { invoices = [] } = await getInvoices(organizationId, {});
        results = invoices.map((i: any) => ({
          id: i.id,
          title: i.invoiceNumber,
          subtitle: `${i.companyName || ""} • $${i.total?.toLocaleString() || 0} • ${i.status}`,
          type: "invoice",
          url: `/org/${organizationId}/invoices/${i.id}`,
        }));
        break;
      }
    }

    const queryStr = (intent.filters as any)?.["*"] as string | undefined;
    if (queryStr && queryStr.length > 0) {
      const q = queryStr.toLowerCase();
      results = results.filter(
        (r) => r.title.toLowerCase().includes(q) || r.subtitle?.toLowerCase().includes(q)
      );
    }

    return { success: true, data: results.slice(0, 20), error: null };
  } catch (error) {
    return { success: false, error: "Failed to fetch results", data: [] };
  }
}
