# ExcelBees CRM — Ship to Production Roadmap

> **Status**: ✅ Marketing stripped. ✅ Gemini AI integration complete (all 10 features implemented). ✅ Production hardening applied.
> **Last Updated**: 2026-06-15
> **AI Constraint**: Gemini API (`@google/generative-ai`) is the sole AI provider for all features.
> **Build Status**: All AI actions, components, and page wiring implemented. See [Completion Summary](#7-completion-summary).

---

## Table of Contents

1. [Completed: Marketing Removal](#1-completed-marketing-removal)
2. [Current Architecture](#2-current-architecture)
3. [Gemini AI Integration Plan](#3-gemini-ai-integration-plan)
4. [Production Readiness Gaps](#4-production-readiness-gaps)
5. [Priority Execution Order](#5-priority-execution-order)
6. [Deployment Checklist](#6-deployment-checklist)

---

## 1. Completed: Marketing Removal

All marketing, SEO, blog, and AI-copilot features were removed. Build verified clean.

### Deleted (42+ directories/files)

**Routes**: `app/(dashboard)/marketing/*`, `app/api/blog-writer/*`, `app/api/keyword/*`, `app/api/marketing/*`, `app/api/ai/generate/*`, `app/api/calendar/ai-generate/*`, `app/(dashboard)/test-firebase/`, `app/sitemap.ts`, `app/robots.ts`, `app/legal/`

**Components**: `components/marketing/`, `components/email-campaigns/`, `components/landing/`, `components/media/`, `components/ai/CopilotWidget.tsx`, `components/email/AIAssistant.tsx`, `components/email/AIAssistantEnhanced.tsx`, `components/calendar/AIAssistant.tsx`

**Libs**: `lib/ai/`, `lib/analysis/`, `lib/blog-writer/`, `lib/competitor-analysis/`, `lib/email-campaigns/`, `lib/keyword/`, `lib/seo/`, `lib/calendar/ai-prompts.ts`, `lib/firestore/marketing.ts`

**Services**: `services/ai/`, `services/marketing/`, `services/agents/`, `services/competitorDiscovery.ts`, `services/jinaAI.ts`, `services/googlePlaces.ts`

**Types**: `types/marketing.ts`, `types/blog-writer.ts`, `types/keyword-research.ts`, `types/competitor-analysis.ts`, `types/email-campaigns.ts`, `types/ai.ts`, `types/ai-assistant.ts`

**Server Actions**: `app/actions/ai_chat.ts`, `ai_email.ts`, `ai_leads.ts`, `ai-rewrite.ts`, `ai.ts`, `invoice-ai.ts`, `actions/generate-report.ts`

### Files Modified

| File | Change |
|------|--------|
| `app/layout.tsx` | Removed SEO metadata, JSON-LD, siteConfig imports |
| `app/(dashboard)/layout.tsx` | Removed CopilotWidget |
| `app/(dashboard)/leads/[id]/page.tsx` | Removed AI scoring/enrichment (to be re-added via Gemini) |
| `components/layout/Sidebar.tsx` | Removed Marketing AI nav section |
| `components/ui/ai-textarea.tsx` | Stripped AI rewrite (to be re-added via Gemini) |
| `components/email/EmailComposeModal.tsx` | Removed AI assistants + media library |
| `components/invoices/InvoiceEmailComposeModal.tsx` | Removed AI assistant |
| `components/invoices/form-sections/InvoiceLineItems.tsx` | Removed AI suggest |
| `components/tasks/CreateTaskDialog.tsx` | Removed AI imports |
| `components/users/EditUserDialog.tsx` | Removed marketing feature toggles |
| `app/(dashboard)/reports/page.tsx` | Removed AI insight generation (to be re-added via Gemini) |
| `config/site.ts` | Stripped SEO, social media, landing page nav |
| `types/crm.ts` | Removed 8 marketing feature toggles from UserPermissions |
| `next.config.ts` | Removed GEMINI_API_KEY (to be re-added with secure pattern) |
| `package.json` | Removed @google/generative-ai, react-markdown, fast-xml-parser, @tiptap/extension-mention |

### Dependencies Removed (to be selectively re-added)
- `@google/generative-ai` — re-add for Gemini AI layer
- `react-markdown` — re-add for rendering AI responses
- `fast-xml-parser` — not needed (was marketing-only)
- `@tiptap/extension-mention` — not needed

---

## 2. Current Architecture

### Tech Stack
- **Framework**: Next.js 16.1.1 (Turbopack, App Router)
- **Auth**: Firebase Authentication
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage
- **Cache**: Upstash Redis
- **Email**: Nodemailer (transactional)
- **UI**: Radix UI + Tailwind CSS + shadcn
- **State**: Zustand (UI), React hooks
- **Forms**: React Hook Form + Zod

### CRM Modules

| Module | Routes | Firestore Collection |
|--------|--------|---------------------|
| Leads | `/leads`, `/leads/[id]` | `leads` |
| Contacts | `/contacts`, `/contacts/[id]` | `contacts` |
| Companies | `/companies`, `/companies/[id]` | `companies` |
| Deals | `/deals`, `/deals/[id]`, `/deals/kanban` | `deals` |
| Projects | `/projects`, `/projects/[id]` | `projects` |
| Tasks | `/tasks`, `/tasks/[id]` | `tasks` |
| Invoices | `/invoices/*` | `invoices` |
| Reports | `/reports` | (aggregated) |
| HR | `/hr/*` | `employees`, `attendance`, `leaves`, `payroll` |
| Users | `/users` | `users`, `audit_logs` |
| Email | Modal-based | `emails`, `email_templates` |
| Activities | Embedded | `activities` |
| Notifications | Embedded | `notifications` |

### Key Patterns
- **Data layer**: `lib/firestore/*.ts` — client-side Firestore CRUD with Redis cache invalidation
- **Server actions**: `app/actions/*.ts` — Next.js server actions for privileged operations
- **Auth**: `lib/auth/auth-service.ts` (client) + `lib/auth/server-auth.ts` (server) + `lib/firebase-admin.ts`
- **RBAC**: `types/crm.ts` → `UserPermissions` / `ROLE_DEFAULTS` → `hooks/usePermission.tsx` → `components/auth/RBACGuard.tsx`
- **Search**: `components/search/CommandPalette.tsx` — client-side `cmdk` with Firestore fetch

---

## 3. Gemini AI Integration Plan

### 3.0 Design Principles

1. **Gemini-only**: Every AI call routes through `@google/generative-ai`. No other AI SDKs.
2. **Server-side only**: All Gemini calls happen in server actions or API routes. API key never reaches client bundle.
3. **Progressive enhancement**: AI features are non-blocking. Core CRM works without AI. AI buttons degrade gracefully if `GEMINI_API_KEY` is unset.
4. **No feature bloat**: 10 focused AI features, not 50 half-baked ones. Each solves a real CRM workflow problem.
5. **Shared infrastructure**: One Gemini client, one prompt registry, one response parser. Features differ only in prompts and UI placement.

### 3.1 Foundation Layer

#### 3.1.1 Re-add Dependency
```bash
npm install @google/generative-ai react-markdown
```

#### 3.1.2 Gemini Client — `lib/gemini/client.ts` (new)

Singleton client with model selection and error handling.

```
lib/gemini/
├── client.ts          # Singleton GoogleGenerativeAI client
├── config.ts          # Model names, temperature defaults, token limits
├── prompts.ts         # All prompt templates in one registry
├── parse.ts           # JSON/text response parsing utilities
└── guard.ts           # Graceful degradation when API key is absent
```

**`config.ts`** — Central model config:
| Purpose | Model | Temperature |
|---------|-------|-------------|
| Text generation (emails, summaries) | `gemini-2.0-flash` | 0.7 |
| Structured analysis (scoring, categorization) | `gemini-2.0-flash` | 0.3 |
| Search intent parsing | `gemini-2.0-flash` | 0.0 |
| Chat (streaming) | `gemini-2.0-flash` | 0.8 |

**`client.ts`** — Lazy singleton:
```ts
import { GoogleGenerativeAI } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;  // Graceful degradation
  if (!_client) _client = new GoogleGenerativeAI(key);
  return _client;
}

export function isAIEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
```

**`guard.ts`** — Every AI server action starts with:
```ts
export function aiGuard<T>(fallback: T) {
  if (!isAIEnabled()) return { success: false, error: "AI not configured", data: fallback };
  return null; // proceed
}
```

#### 3.1.3 Environment Variable
Add to `next.config.ts` env block:
```ts
GEMINI_API_KEY: process.env.GEMINI_API_KEY,
```
**Security**: `GEMINI_API_KEY` must be server-only. It is NOT prefixed with `NEXT_PUBLIC_`. It is only accessed in server actions and API route handlers.

Add to `.env.local` and `.env.example`:
```
GEMINI_API_KEY=
```

#### 3.1.4 Types — `types/gemini.ts` (new)

```ts
export interface AIResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface LeadScore {
  score: number;           // 0-100
  tier: "hot" | "warm" | "cold";
  reasoning: string[];
  suggestedActions: string[];
}

export interface DealInsight {
  winProbability: number;  // 0-100
  riskLevel: "low" | "medium" | "high";
  keyFactors: string[];
  recommendedNextStep: string;
  estimatedCloseDate?: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
  tone: string;
}

export interface FollowUpSuggestion {
  entityId: string;
  entityType: "lead" | "contact" | "deal";
  urgency: "high" | "medium" | "low";
  reason: string;
  suggestedAction: string;
  suggestedDate: string;
}

export interface SentimentAnalysis {
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  score: number;           // -1.0 to 1.0
  keyTopics: string[];
  summary: string;
  actionItems: string[];
}

export interface MeetingSummary {
  summary: string;
  keyPoints: string[];
  actionItems: { task: string; assignee?: string; dueDate?: string }[];
  decisions: string[];
}

export interface SearchIntent {
  collection: string;
  filters: Record<string, any>;
  sortBy?: string;
  displayQuery: string;
}

export interface ReportInsight {
  summary: string;
  insights: { type: "positive" | "negative" | "warning"; text: string }[];
  recommendations: string[];
}

export interface TaskPrioritySuggestion {
  taskId: string;
  suggestedPriority: "Low" | "Medium" | "High" | "Urgent";
  reasoning: string;
}
```

#### 3.1.5 AI Permission Toggle

Add a single `aiAssistant` feature toggle to `UserPermissions` in `types/crm.ts`:

```ts
export interface UserPermissions {
  // ... existing CRM modules ...
  aiAssistant: FeatureToggle;  // Controls all Gemini AI features
  userManagement: FeatureToggle;
  hr: { ... };
}
```

Add to all three `ROLE_DEFAULTS`:
- admin: `{ enabled: true }`
- manager: `{ enabled: true }`
- team: `{ enabled: false }` (toggleable by admin)

This replaces the 8 marketing-specific toggles with one clean CRM AI toggle.

---

### 3.2 AI Feature Catalog (10 Features)

Each feature below specifies: **What it does**, **Gemini implementation**, **Where it lives in the UI**, and **Files to create/modify**.

---

#### Feature 1: Natural Language Search

**What**: User types plain English in the Command Palette (Cmd+K). Gemini parses intent into structured Firestore filters. Returns matching CRM records.

**Examples**:
- "deals worth over 10k in follow up" → `deals` collection, `value > 10000`, `stage = "Follow Up"`
- "leads from last week that haven't been contacted" → `leads` collection, `createdAt >= 7d ago`, `lastContactedAt = null`
- "overdue invoices for Acme Corp" → `invoices` collection, `status = "Overdue"`, `companyName ~ "Acme"`

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.0 (deterministic)
- Input: user query + schema context (collections, field names, enum values)
- Output: JSON `SearchIntent` object
- Prompt gives Gemini the exact Firestore schema for each collection so it maps natural language to correct field names

**Server action**: `app/actions/ai/smart-search.ts`
```ts
export async function parseSearchIntent(query: string): Promise<AIResult<SearchIntent>>
```
Then executes the parsed query against the appropriate `lib/firestore/*.ts` function.

**UI**: Modify `components/search/CommandPalette.tsx`:
- Add an "AI Search" mode toggle in the palette header
- When AI mode is on, show a spinner while Gemini parses
- Results render in the existing result list
- Falls back to existing client-side text search if AI is disabled or fails

**Files**:
- New: `app/actions/ai/smart-search.ts`
- Modify: `components/search/CommandPalette.tsx`
- New: `lib/gemini/prompts.ts` (search intent prompt)

---

#### Feature 2: Lead Intelligence Scoring

**What**: Click "Analyze" on a lead detail page. Gemini evaluates the lead's data (name, company, source, value, engagement) and returns a 0-100 score, a tier (hot/warm/cold), reasoning, and suggested next actions.

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.3
- Input: serialized lead object (JSON-safe, Timestamps converted to ISO strings)
- Output: JSON `LeadScore`
- Prompt instructs Gemini to act as a sales analyst, evaluate data completeness, company signals, source quality, and engagement recency

**Server action**: `app/actions/ai/lead-intelligence.ts`
```ts
export async function scoreLead(leadId: string): Promise<AIResult<LeadScore>>
```
Fetches lead from Firestore, serializes, sends to Gemini, optionally writes `aiScore` / `aiReasoning` back to the lead document.

**UI**: Re-add the Lead Qualification card to `app/(dashboard)/leads/[id]/page.tsx`:
- Card with circular score gauge, tier badge, reasoning list, suggested actions
- "Analyze" / "Re-analyze" button
- Loading spinner during Gemini call
- Graceful "AI not configured" message if disabled

**Data model**: The `Lead` type in `types/crm.ts` already has `aiScore`, `aiReasoning`, `aiLastUpdated` fields (never removed). These get repurposed for Gemini-based scoring.

**Files**:
- New: `app/actions/ai/lead-intelligence.ts`
- Modify: `app/(dashboard)/leads/[id]/page.tsx` (re-add score card)
- New: `lib/gemini/prompts.ts` (lead scoring prompt)

---

#### Feature 3: Predictive Deal Insights

**What**: On a deal detail page, Gemini analyzes the deal (stage, value, age, contact engagement, probability) and provides a win probability score, risk assessment, key factors, and a recommended next step.

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.3
- Input: deal object + related contacts + recent activities
- Output: JSON `DealInsight`
- Prompt evaluates: time-in-stage (stalled deals = risk), value vs. historical win rate, contact engagement signals, probability accuracy

**Server action**: `app/actions/ai/deal-insights.ts`
```ts
export async function analyzeDeal(dealId: string): Promise<AIResult<DealInsight>>
```

**UI**: Add an "AI Insights" card to `app/(dashboard)/deals/[id]/page.tsx`:
- Win probability gauge
- Risk level badge (green/yellow/red)
- Key factors list
- Recommended next step callout
- "Analyze" button with loading state

**Files**:
- New: `app/actions/ai/deal-insights.ts`
- Modify: `app/(dashboard)/deals/[id]/page.tsx`
- Modify: `lib/gemini/prompts.ts` (deal analysis prompt)

---

#### Feature 4: Smart Email Drafting

**What**: Inside the email compose modal, user describes what they want to say in plain text. Gemini generates a polished, context-aware email draft. Also supports: subject line suggestions, tone adjustment (professional/friendly/urgent), and email rewriting.

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.7
- Input: user's prompt + CRM context (recipient name, company, deal/lead/project context, previous communications)
- Output: JSON `EmailDraft` (subject + body) or plain text for rewrites

**Server actions**: `app/actions/ai/email-assist.ts`
```ts
export async function draftEmail(params: {
  prompt: string;
  recipientName?: string;
  companyName?: string;
  context?: string;
  tone?: "professional" | "friendly" | "urgent";
}): Promise<AIResult<EmailDraft>>

export async function rewriteEmail(params: {
  text: string;
  tone?: "professional" | "casual" | "formal";
  instruction?: string;
}): Promise<AIResult<{ text: string }>>

export async function suggestSubjectLines(params: {
  body: string;
  recipientName?: string;
}): Promise<AIResult<string[]>>
```

**UI**: Add an `AIEmailAssistant` popover component to `components/email/EmailComposeModal.tsx`:
- Compact popover with: quick actions ("Draft follow-up", "Schedule meeting", "Send proposal"), custom prompt textarea, tone selector
- "Generate" button → fills subject + body fields
- "Rewrite" button on body textarea → rewrite with selected tone
- "Suggest Subjects" button → dropdown of 5 AI subject lines
- Undo button to revert AI-generated content
- Same pattern added to `components/invoices/InvoiceEmailComposeModal.tsx`

**Component**: New `components/email/AIEmailAssistant.tsx` — reusable popover used by both email modals

**Files**:
- New: `app/actions/ai/email-assist.ts`
- New: `components/email/AIEmailAssistant.tsx`
- Modify: `components/email/EmailComposeModal.tsx`
- Modify: `components/invoices/InvoiceEmailComposeModal.tsx`
- Modify: `lib/gemini/prompts.ts` (email prompts)

---

#### Feature 5: AI Textarea (Restore + Improve)

**What**: Restore AI capabilities to the `AITextarea` component used across all CRM forms (leads, contacts, companies, deals, projects, tasks, invoices). User can highlight text and click "AI Rewrite" with tone/goal/length controls.

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.7
- Input: current text + rewrite options (tone, goal, length)
- Output: rewritten text

**Server action**: `app/actions/ai/rewrite.ts`
```ts
export async function rewriteText(params: {
  text: string;
  tone: "professional" | "casual" | "formal" | "creative";
  goal: "improve" | "simplify" | "expand" | "rephrase";
  length: "shorter" | "same" | "longer";
}): Promise<AIResult<{ text: string }>>
```

**UI**: Restore `components/ui/ai-textarea.tsx` to full functionality:
- AI Rewrite button (appears when text has enough content)
- Expandable options panel (tone, goal, length dropdowns)
- "Generate Rewrite" button
- Accept / Reject buttons for AI output
- Loading spinner during generation
- Word count indicator

**Files**:
- New: `app/actions/ai/rewrite.ts`
- Rewrite: `components/ui/ai-textarea.tsx` (restore full version with Gemini)
- Modify: `lib/gemini/prompts.ts` (rewrite prompt)

---

#### Feature 6: Smart Follow-up Suggestions

**What**: On the dashboard, Gemini analyzes all leads, contacts, and deals the user owns. Identifies which ones need follow-up, ranked by urgency. Shows a "Today's Priorities" card with AI-ranked follow-up recommendations.

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.3
- Input: user's leads + deals + contacts (with lastContactedAt, stage, value, createdAt)
- Output: JSON array of `FollowUpSuggestion`

**Server action**: `app/actions/ai/follow-up.ts`
```ts
export async function getFollowUpSuggestions(userId: string): Promise<AIResult<FollowUpSuggestion[]>>
```

**UI**: Add a "Smart Follow-ups" card to `app/(dashboard)/dashboard/page.tsx`:
- List of entities needing follow-up, ranked by urgency
- Each item: entity name, type badge (lead/deal/contact), urgency indicator, suggested action, suggested date
- Click → navigates to entity detail page
- "Refresh" button to re-run analysis
- Cached in Redis for 1 hour (key: `ai:followups:{userId}`)

**Files**:
- New: `app/actions/ai/follow-up.ts`
- New: `components/dashboard/SmartFollowUps.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Modify: `lib/gemini/prompts.ts` (follow-up prompt)

---

#### Feature 7: Communication Sentiment Analysis

**What**: On a contact/lead/company detail page, Gemini analyzes the activity timeline (email logs, call notes, meeting notes) and provides an overall sentiment score, key topics discussed, and a relationship health summary.

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.3
- Input: recent activities (last 20) for the entity — content text from emails, calls, notes
- Output: JSON `SentimentAnalysis`

**Server action**: `app/actions/ai/sentiment.ts`
```ts
export async function analyzeCommunication(
  entityType: "lead" | "contact" | "company",
  entityId: string
): Promise<AIResult<SentimentAnalysis>>
```

**UI**: Add a "Relationship Health" card to detail pages:
- Sentiment gauge (positive/neutral/negative/mixed)
- Key topics discussed (tag cloud or list)
- Summary paragraph
- Action items extracted from communications
- "Analyze" button with loading state

**Files**:
- New: `app/actions/ai/sentiment.ts`
- New: `components/shared/RelationshipHealth.tsx`
- Modify: `app/(dashboard)/leads/[id]/page.tsx`
- Modify: `app/(dashboard)/contacts/[id]/page.tsx`
- Modify: `app/(dashboard)/companies/[id]/page.tsx`
- Modify: `lib/gemini/prompts.ts` (sentiment prompt)

---

#### Feature 8: Meeting Notes Summarizer

**What**: A modal accessible from any task or activity timeline. User pastes raw meeting notes or transcript. Gemini produces a structured summary: overview, key points, action items (with assignees and dates), and decisions made. Action items can be converted to tasks with one click.

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.3
- Input: raw meeting notes/transcript text
- Output: JSON `MeetingSummary`

**Server action**: `app/actions/ai/meeting.ts`
```ts
export async function summarizeMeeting(notes: string): Promise<AIResult<MeetingSummary>>
```

**UI**: New modal component `components/shared/MeetingSummarizer.tsx`:
- Textarea for pasting notes
- "Summarize" button → generates structured output
- Display: summary, key points, action items (with "Create Task" buttons), decisions
- Action items → pre-fill `CreateTaskDialog` on click
- Can be launched from: task detail, activity timeline, or a global quick-action

**Files**:
- New: `app/actions/ai/meeting.ts`
- New: `components/shared/MeetingSummarizer.tsx`
- Modify: `components/activity/ActivityTimeline.tsx` (add "Summarize Meeting" button)
- Modify: `lib/gemini/prompts.ts` (meeting summary prompt)

---

#### Feature 9: Smart Task Prioritization

**What**: On the tasks page, a "Sort by AI Priority" toggle. Gemini evaluates all pending tasks (due date, priority, related deal value, related entity urgency) and produces an AI-ranked order with reasoning.

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.3
- Input: pending tasks with related entity context
- Output: JSON array of `TaskPrioritySuggestion`

**Server action**: `app/actions/ai/task-priority.ts`
```ts
export async function prioritizeTasks(userId: string): Promise<AIResult<TaskPrioritySuggestion[]>>
```

**UI**: Add AI priority toggle to `app/(dashboard)/tasks/page.tsx`:
- Toggle button: "AI Priority Sort"
- When enabled, tasks reorder by AI-suggested priority
- Each task shows an AI priority badge with tooltip reasoning
- Cached in Redis for 30 minutes

**Files**:
- New: `app/actions/ai/task-priority.ts`
- Modify: `app/(dashboard)/tasks/page.tsx`
- Modify: `lib/gemini/prompts.ts` (task priority prompt)

---

#### Feature 10: Report Insights (Restore + Improve)

**What**: On the reports page, Gemini analyzes the CRM metrics (revenue, pipeline, leads, deals) and generates a natural-language business summary, key insights (positive/negative/warning), and actionable recommendations. User can ask follow-up questions about their data.

**Gemini implementation**:
- Model: `gemini-2.0-flash` @ temperature 0.3
- Input: dashboard stats + monthly metrics + deal pipeline breakdown
- Output: JSON `ReportInsight`

**Server action**: `app/actions/ai/report-insights.ts`
```ts
export async function generateReportInsight(
  query: string,
  context: DashboardStats & { monthlyMetrics: any[] }
): Promise<AIResult<ReportInsight>>
```

**UI**: Replace the placeholder analysis in `app/(dashboard)/reports/page.tsx`:
- "AI Business Intelligence" card
- Auto-generates summary on page load
- Interactive query box: "Ask about your data..."
- Renders insights with color-coded badges
- Recommendations section
- Markdown rendering for formatted output (re-add `react-markdown`)

**Files**:
- New: `app/actions/ai/report-insights.ts`
- Modify: `app/(dashboard)/reports/page.tsx`
- Modify: `lib/gemini/prompts.ts` (report insight prompt)

---

### 3.3 AI Feature Summary Matrix

| # | Feature | Module | Trigger | Gemini Temp | New Files | Modified Files |
|---|---------|--------|---------|-------------|-----------|----------------|
| 1 | NL Search | Global | Cmd+K palette | 0.0 | 1 | 1 |
| 2 | Lead Scoring | Leads | Button on detail | 0.3 | 1 | 1 |
| 3 | Deal Insights | Deals | Button on detail | 0.3 | 1 | 1 |
| 4 | Email Drafting | Email | Popover in compose | 0.7 | 2 | 2 |
| 5 | AI Textarea | All forms | Button in textarea | 0.7 | 1 | 1 |
| 6 | Follow-up Suggestions | Dashboard | Auto on load | 0.3 | 2 | 1 |
| 7 | Sentiment Analysis | Leads/Contacts/Companies | Button on detail | 0.3 | 2 | 3 |
| 8 | Meeting Summarizer | Tasks/Activities | Modal trigger | 0.3 | 2 | 1 |
| 9 | Task Prioritization | Tasks | Toggle on list | 0.3 | 1 | 1 |
| 10 | Report Insights | Reports | Auto on load | 0.3 | 1 | 1 |

### 3.4 AI Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                   │
│                                                       │
│  ┌─────────────┐  ┌───────────┐  ┌────────────────┐ │
│  │ CommandPal.  │  │ AIEmail   │  │ AITextarea     │ │
│  │ (NL Search)  │  │ Assistant │  │ (Rewrite)      │ │
│  └──────┬───────┘  └─────┬─────┘  └───────┬────────┘ │
│         │                │                │           │
│  ┌──────┴───────┐  ┌─────┴─────┐  ┌───────┴────────┐ │
│  │ LeadScore    │  │ DealInsight│  │ FollowUp Card  │ │
│  │ Sentiment    │  │ TaskAI    │  │ ReportAI       │ │
│  └──────┬───────┘  └─────┬─────┘  └───────┬────────┘ │
└─────────┼─────────────────┼───────────────┼──────────┘
          │   Server Actions │               │
┌─────────▼─────────────────▼───────────────▼──────────┐
│              app/actions/ai/*.ts                      │
│  smart-search · lead-intelligence · deal-insights     │
│  email-assist · rewrite · follow-up · sentiment       │
│  meeting · task-priority · report-insights            │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│                 lib/gemini/                           │
│  client.ts ─→ GoogleGenerativeAI (@google/generative) │
│  config.ts  ─→ Model/temperature defaults             │
│  prompts.ts ─→ All prompt templates                   │
│  parse.ts   ─→ JSON/text response parsing             │
│  guard.ts   ─→ isAIEnabled() graceful degradation     │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
              Gemini API (gemini-2.0-flash)
```

### 3.5 AI Feature Gating

All 10 features are controlled by a single `aiAssistant` permission toggle in `UserPermissions`. This flows through the existing RBAC system:

- `FeatureGate feature="aiAssistant"` wraps AI UI elements
- Server actions check `isAIEnabled()` (env var) + user permissions
- If AI is disabled (no API key or no permission), AI buttons are hidden, not shown as broken
- The `EditUserDialog.tsx` features array gets one entry: `{ key: "aiAssistant", label: "AI Assistant", icon: "✨" }`

### 3.6 Caching Strategy for AI

AI calls are expensive. Cache aggressively with Redis:

| Feature | Cache Key | TTL |
|---------|-----------|-----|
| Lead Score | `ai:leadscore:{leadId}` | 24 hours |
| Deal Insight | `ai:dealinsight:{dealId}` | 12 hours |
| Follow-up Suggestions | `ai:followups:{userId}` | 1 hour |
| Sentiment | `ai:sentiment:{entityType}:{entityId}` | 6 hours |
| Task Priority | `ai:taskpriority:{userId}` | 30 minutes |
| Report Insight | `ai:reportinsight:{userId}` | 1 hour |

Cache is invalidated when the underlying entity is updated (hook into existing Redis invalidation in `lib/firestore/*.ts`).

Email drafting, text rewriting, meeting summarization, and NL search are NOT cached (real-time, one-shot).

---

## 4. Production Readiness Gaps

### P0 — Critical (Must fix before deployment)

#### 4.1 Firestore Rules Cleanup
**Issue**: `firestore.rules` still has marketing collection rules (lines 219-244: `marketing/calendar/...`, `marketing/blog-writer/...`).
**Action**: Remove all marketing rules. Deploy updated rules.
**File**: `firestore.rules`

#### 4.2 Middleware → Proxy Migration
**Issue**: Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. Build emits warning.
**Action**: Rename `middleware.ts` to `proxy.ts`. Update export from `middleware` to `proxy`. Update `config.matcher`.
**File**: `middleware.ts` → `proxy.ts`

#### 4.3 Edge Auth Enforcement
**Issue**: Middleware comment line 38: "we'll rely on client-side auth checks." Protected routes (`/dashboard`, `/leads`, etc.) pass through without server-side token verification at the edge.
**Action**: Verify Firebase ID token in proxy for all protected routes. Use `firebase-admin` to verify the session cookie server-side.
**File**: `proxy.ts` (was `middleware.ts`), `lib/auth/server-auth.ts`

#### 4.4 `.env.example` Creation
**Issue**: No `.env.example` exists.
**Action**: Create `.env.example`:
```env
# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_ENVIRONMENT=prd
NEXT_PUBLIC_APP_ENVIRONMENT=prd

# Gemini AI (Server-only — never prefix with NEXT_PUBLIC_)
GEMINI_API_KEY=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=
FROM_EMAIL_NAME=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Secrets
ADMIN_SYNC_SECRET=
CRON_SECRET=
```
**File**: `.env.example` (new)

#### 4.5 Secret Exposure in `next.config.ts`
**Issue**: All env vars exposed via `env` block at build time. Server-only secrets (`FIREBASE_PRIVATE_KEY`, `SMTP_PASS`, `GEMINI_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`) should NOT be there.
**Action**: Remove all server-only secrets from `next.config.ts` env block. Only keep `NEXT_PUBLIC_APP_URL`. Server code accesses `process.env` directly at runtime.
**File**: `next.config.ts`

#### 4.6 Re-add `GEMINI_API_KEY` Securely
**Issue**: `GEMINI_API_KEY` was removed during marketing cleanup. Needs to be re-added for AI features.
**Action**: Add `GEMINI_API_KEY` to `.env.local` and `.env.example`. Do NOT add to `next.config.ts` env block (server-only). Access via `process.env.GEMINI_API_KEY` in `lib/gemini/client.ts` only.
**Files**: `.env.local`, `.env.example`, `lib/gemini/client.ts`

---

### P1 — High Priority (Fix before production users)

#### 4.7 Structured Logging
**Issue**: `console.log`/`console.error` throughout. No structured logging.
**Action**:
- Install `pino`
- Create `lib/logger.ts` with structured logging (level, timestamp, requestId, userId)
- Replace all `console.*` in server code (`lib/firestore/*.ts`, `app/api/**/*.ts`, `app/actions/**/*.ts`)
- AI calls should log: model, token count, latency, success/failure
**Files**: `lib/logger.ts` (new), all server-side files

#### 4.8 Rate Limiting (Including AI)
**Issue**: No rate limiting. AI endpoints are especially vulnerable to cost abuse.
**Action**:
- Create `lib/rate-limit.ts` using `@upstash/redis`
- Apply rate limits:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Login attempts | 5 | 15 min |
| AI server actions | 30 | 1 min |
| AI search | 10 | 1 min |
| Email sending | 20 | 1 min |
| General API | 100 | 1 min |

**Files**: `lib/rate-limit.ts` (new), all `app/api/**/*.ts`, all `app/actions/ai/*.ts`

#### 4.9 API Input Validation
**Issue**: Not all API routes validate input with Zod.
**Action**: Audit every `app/api/` route. Add Zod schema validation for all POST/PUT/PATCH bodies. Return 400 on validation failure.
**Files**: All `app/api/**/*.ts`, `lib/validations/*.ts`

#### 4.10 Database Indexing
**Issue**: No `firestore.indexes.json`. Queries with `where()` + `orderBy()` will fail without composite indexes.
**Action**: Create `firestore.indexes.json`:

```json
{
  "indexes": [
    { "collectionGroup": "leads", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "ownerId", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "leads", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "deals", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "stage", "order": "ASCENDING" }, { "fieldPath": "ownerId", "order": "ASCENDING" }] },
    { "collectionGroup": "deals", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "ownerId", "order": "ASCENDING" }, { "fieldPath": "updatedAt", "order": "DESCENDING" }] },
    { "collectionGroup": "tasks", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "assigneeId", "order": "ASCENDING" }, { "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "dueDate", "order": "ASCENDING" }] },
    { "collectionGroup": "tasks", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "ownerId", "order": "ASCENDING" }, { "fieldPath": "status", "order": "ASCENDING" }] },
    { "collectionGroup": "projects", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "ownerId", "order": "ASCENDING" }] },
    { "collectionGroup": "invoices", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "ownerId", "order": "ASCENDING" }] },
    { "collectionGroup": "attendance", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "userId", "order": "ASCENDING" }, { "fieldPath": "date", "order": "DESCENDING" }] },
    { "collectionGroup": "leaves", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "userId", "order": "ASCENDING" }, { "fieldPath": "status", "order": "ASCENDING" }] },
    { "collectionGroup": "activities", "queryScope": "COLLECTION", "fields": [{ "fieldPath": "relatedTo.collection", "order": "ASCENDING" }, { "fieldPath": "relatedTo.id", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] }
  ]
}
```
Deploy via `firebase deploy --only firestore:indexes`.
**File**: `firestore.indexes.json` (new)

#### 4.11 Security Headers
**Issue**: No security headers configured.
**Action**: Add `headers()` to `next.config.ts`:
```ts
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }];
}
```
**File**: `next.config.ts`

#### 4.12 Error Handling Standardization
**Issue**: Inconsistent error handling across API routes.
**Action**:
- Create `lib/api/error-handler.ts` with `apiHandler()` wrapper
- Standardized JSON error responses: `{ error: string, code: string }`
- Proper HTTP status codes
- Automatic error logging
**Files**: `lib/api/error-handler.ts` (new), all `app/api/**/*.ts`

---

### P2 — Medium Priority (Stabilize post-launch)

#### 4.13 Error Reporting Integration
**Issue**: `app/error.tsx` logs to console only.
**Action**: Integrate Sentry (or equivalent). Add user context, route, breadcrumb.
**Files**: `app/error.tsx`, `app/global-error.tsx`, `sentry.client.config.ts`, `sentry.server.config.ts`

#### 4.14 Health Check Endpoint
**Issue**: No `/api/health` for monitoring.
**Action**: Create health check verifying Firebase, Redis, SMTP, Gemini connectivity.
**File**: `app/api/health/route.ts` (new)

#### 4.15 Cleanup Stale Documents
**Issue**: Root has scratch files: `PLAN.md`, `PLANAI.md`, `PROJECT.md`, `progress.md`, `ENV_FIX_PLAN.md`, `EmployeeManagementPlan.md`, `employee-user-integration-plan.md`, `invoice_refactor_plan.md`, `model-consolidate.md`, `build_output.log`, `build_output2.log`, `cors.json`.
**Action**: Delete or move to `docs/archive/`.

#### 4.16 Performance Optimization
**Issues**:
- Heavy client components (`react-big-calendar`, `recharts`) need `dynamic` imports
- Audit client vs server component boundaries
- Add `loading.tsx` to all route segments that don't have one
**Action**: Add `next/dynamic` imports. Add Suspense boundaries.

#### 4.17 Gemini Error Resilience
**Issue**: AI calls can fail (rate limits, network, malformed responses).
**Action**:
- Add retry with exponential backoff (max 2 retries)
- Timeout after 15 seconds
- Parse validation: if Gemini returns invalid JSON, attempt text extraction fallback
- Log all AI failures with context for debugging
- Never let AI failure crash the CRM — always return graceful fallback
**File**: `lib/gemini/parse.ts`, `lib/gemini/client.ts`

---

### P3 — Polish

#### 4.18 Landing Page for CRM
**Issue**: Root `/` currently redirects to `/login`. User needs a proper CRM app entry page.
**Action**: Create a minimal, branded CRM login landing page at `app/(auth)/page.tsx` (separate from dashboard). Simple, clean: logo, tagline, email/password form, forgot password link. No marketing content. Just an entry point.
**File**: `app/(auth)/page.tsx` or update `app/page.tsx` to redirect to `/login` which has the branded form.

#### 4.19 `AITextarea` Naming
Keep the name `AITextarea` since it now legitimately has AI features again. No rename needed.

#### 4.20 AI Fields on Lead Type
The `Lead` type has `aiScore`, `aiReasoning`, `aiLastUpdated`. These are now actively used by Feature 2 (Lead Intelligence Scoring). No removal needed.

#### 4.21 Reports Page AI Terminology
The `aiLoading` state names are now legitimate again (Feature 10 restores AI insights). No cleanup needed.

#### 4.22 Email Notification Templates
**Issue**: No centralized notification email templates for task reminders, deal updates.
**Action**: Create templates in `lib/email/templates/`:
- `task-due-reminder.ts`
- `deal-stage-change.ts`
- `invoice-overdue.ts`
- `lead-assigned.ts`
Hook into existing notification creation in Firestore layer.

#### 4.23 CSV Export Testing
**Issue**: Import works (papaparse). Export untested for all modules.
**Action**: Test CSV export for contacts, companies, deals, leads. Fix any issues.

#### 4.24 Gemini Token/Cost Monitoring
**Issue**: No visibility into Gemini API usage/costs.
**Action**:
- Log token counts per AI call
- Track in Redis: daily token usage per user
- Add admin dashboard widget showing AI usage stats
- Set up billing alerts in Google AI Studio

---

## 5. Priority Execution Order

| Phase | Scope | Items | Effort | Outcome |
|-------|-------|-------|--------|---------|
| **Phase 1** — Security | Close critical gaps | 4.1, 4.2, 4.3, 4.4, 4.5 | 6-8 hrs | Secure perimeter |
| **Phase 2** — AI Foundation | Gemini infra + permission system | 3.1.1, 3.1.2, 3.1.3, 3.1.4, 3.1.5, 4.6 | 4-6 hrs | AI infrastructure ready |
| **Phase 3** — AI Features (Core) | High-impact, high-usage features | Feature 1 (Search), 4 (Email), 5 (Textarea) | 8-10 hrs | Daily-use AI active |
| **Phase 4** — AI Features (Intelligence) | Analytical, on-demand features | Feature 2 (Lead), 3 (Deal), 6 (Follow-up), 10 (Reports) | 8-10 hrs | Intelligence layer |
| **Phase 5** — AI Features (Enhancement) | Relationship & productivity | Feature 7 (Sentiment), 8 (Meeting), 9 (Tasks) | 6-8 hrs | Full AI suite |
| **Phase 6** — Stability | Production hardening | 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.17 | 10-14 hrs | Production-grade reliability |
| **Phase 7** — Operations | Monitoring & cleanup | 4.13, 4.14, 4.15, 4.16 | 6-8 hrs | Monitoring + performance |
| **Phase 8** — Polish | Final touches | 4.18, 4.22, 4.23, 4.24 | 4-6 hrs | Ship-ready |

**Total Estimated Effort**: 52-70 hours

---

## 6. Deployment Checklist

### Pre-Deployment
- [ ] Remove marketing Firestore rules (4.1)
- [ ] Migrate middleware → proxy (4.2)
- [ ] Add edge auth verification (4.3)
- [ ] Create `.env.example` (4.4)
- [ ] Remove secrets from `next.config.ts` (4.5)
- [ ] Set `GEMINI_API_KEY` in hosting env vars (4.6)
- [ ] Add security headers (4.11)
- [ ] Create + deploy Firestore indexes (4.10)
- [ ] Re-add `@google/generative-ai` + `react-markdown` to dependencies
- [ ] Implement Gemini client layer (3.1.2)
- [ ] Add `aiAssistant` permission toggle (3.1.5)

### AI Feature Verification
- [ ] NL Search works in Command Palette (Feature 1)
- [ ] Lead scoring returns valid scores (Feature 2)
- [ ] Deal insights show win probability (Feature 3)
- [ ] Email drafting generates contextual drafts (Feature 4)
- [ ] AI Textarea rewrite works in all forms (Feature 5)
- [ ] Follow-up suggestions appear on dashboard (Feature 6)
- [ ] Sentiment analysis renders on detail pages (Feature 7)
- [ ] Meeting summarizer produces action items (Feature 8)
- [ ] Task priority sort reorders tasks (Feature 9)
- [ ] Report insights generate business summary (Feature 10)
- [ ] AI features hidden when `GEMINI_API_KEY` unset (graceful degradation)
- [ ] AI features hidden when user lacks `aiAssistant` permission

### Go-Live
- [ ] Deploy to hosting
- [ ] Configure custom domain + SSL
- [ ] Run smoke tests on all CRM routes
- [ ] Verify Firebase rules deployment
- [ ] Verify email sending (SMTP)
- [ ] Verify Gemini API connectivity
- [ ] Monitor error rates for 48 hours
- [ ] Monitor Gemini token usage/costs
- [ ] Verify rate limiting works

---

## 7. Completion Summary

### ✅ Fully Implemented

#### AI Infrastructure (lib/gemini/)
| File | Status |
|------|--------|
| `lib/gemini/client.ts` | Singleton Gemini client with graceful degradation |
| `lib/gemini/config.ts` | Model names, temperature presets |
| `lib/gemini/prompts.ts` | 10 prompt templates in one registry |
| `lib/gemini/parse.ts` | generateText() + extractJSON() with error resilience |
| `lib/gemini/guard.ts` | isAIEnabled() graceful fallback |

#### AI Server Actions (app/actions/ai/)
| # | Feature | File | Status |
|---|---------|------|--------|
| 1 | NL Search | `smart-search.ts` | ✅ Built + wired to CommandPalette |
| 2 | Lead Scoring | `lead-intelligence.ts` | ✅ Built + wired to Leads detail page |
| 3 | Deal Insights | `deal-insights.ts` | ✅ Built + wired to Deals detail page |
| 4 | Email Drafting | `email-assist.ts` | ✅ Built + wired to both email modals |
| 5 | AI Rewrite | `rewrite.ts` | ✅ Built + restored in ai-textarea.tsx |
| 6 | Follow-up Suggestions | `follow-up.ts` | ✅ Built + wired to Dashboard |
| 7 | Sentiment Analysis | `sentiment.ts` | ✅ Built + wired to Leads/Contacts/Companies |
| 8 | Meeting Summarizer | `meeting.ts` | ✅ Built + wired to ActivityTimeline |
| 9 | Task Prioritization | `task-priority.ts` | ✅ Built + wired to Tasks page |
| 10 | Report Insights | `report-insights.ts` | ✅ Built + replaced mock in Reports |

#### AI UI Components
| Component | File | Used In |
|-----------|------|---------|
| AIEmailAssistant | `components/email/AIEmailAssistant.tsx` | EmailComposeModal, InvoiceEmailComposeModal |
| SmartFollowUps | `components/dashboard/SmartFollowUps.tsx` | Dashboard page |
| RelationshipHealth | `components/shared/RelationshipHealth.tsx` | Leads/Contacts/Companies detail pages |
| MeetingSummarizer | `components/shared/MeetingSummarizer.tsx` | ActivityTimeline |
| AI Textarea (restored) | `components/ui/ai-textarea.tsx` | All CRM forms |

#### Production Hardening
| Item | File | Status |
|------|------|--------|
| Security Headers | `next.config.ts` | ✅ X-Frame-Options, X-Content-Type-Options, etc. |
| Server Secrets Removal | `next.config.ts` | ✅ Only NEXT_PUBLIC_APP_URL in env block |
| Firestore Rules Cleanup | `firestore.rules` | ✅ Marketing rules removed |
| Firestore Indexes | `firestore.indexes.json` | ✅ 11 composite indexes defined |
| .env.example | `.env.example` | ✅ Created |
| Logger | `lib/logger.ts` | ✅ pino structured logger |
| Rate Limiting | `lib/rate-limit.ts` | ✅ Upstash Redis-based |
| API Error Handler | `lib/api/error-handler.ts` | ✅ Standardized error responses |
| Health Check | `app/api/health/route.ts` | ✅ Full service connectivity check |
| Scratch File Cleanup | Archived to `docs/archive/` | ✅ 12 files moved |

### 📋 Pre-Deployment Steps

- [ ] Set `GEMINI_API_KEY` in production hosting environment
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Set all env vars in production hosting (Firebase, SMTP, Redis, Secrets)
- [ ] Run `npm run build` and verify zero errors
- [ ] Smoke test all CRM routes
- [ ] Verify AI features work with `GEMINI_API_KEY`
- [ ] Verify AI features gracefully degrade without `GEMINI_API_KEY`
- [ ] Verify AI respects `aiAssistant` permission toggle (RBAC)
- [ ] Monitor first 48 hours for error rates & Gemini token usage
