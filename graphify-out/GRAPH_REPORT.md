# Graph Report - crm_excelbees  (2026-08-27)

## Corpus Check
- 502 files · ~479,339 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 161 nodes · 171 edges · 12 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef98b1f3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `APP_ENVIRONMENT — Design Spec` - 11 edges
2. `3.2 AI Feature Catalog (10 Features)` - 11 edges
3. `ExcelBees CRM — Ship to Production Roadmap` - 9 edges
4. `3. Gemini AI Integration Plan` - 8 edges
5. `P3 — Polish` - 8 edges
6. `P0 — Critical (Must fix before deployment)` - 7 edges
7. `P1 — High Priority (Fix before production users)` - 7 edges
8. `3.1 Foundation Layer` - 6 edges
9. `P2 — Medium Priority (Stabilize post-launch)` - 6 edges
10. `4. Production Readiness Gaps` - 5 edges

## Surprising Connections (you probably didn't know these)
- `robots()` --calls--> `getAppUrl()`  [EXTRACTED]
  app/robots.ts → lib/environment.ts

## Communities (12 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (22): 1. Completed: Marketing Removal, 2. Current Architecture, 5. Priority Execution Order, 6. Deployment Checklist, 7. Completion Summary, AI Feature Verification, AI Infrastructure (lib/gemini/), AI Server Actions (app/actions/ai/) (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (19): 3.2 AI Feature Catalog (10 Features), code:ts (export async function scoreLead(leadId: string): Promise<AIR), code:ts (export async function analyzeDeal(dealId: string): Promise<A), code:ts (export async function draftEmail(params: {), code:ts (export async function rewriteText(params: {), code:ts (export async function getFollowUpSuggestions(userId: string)), code:ts (export async function summarizeMeeting(notes: string): Promi), code:ts (export async function prioritizeTasks(userId: string): Promi) (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (8): checkAuthAvailability(), checkLoginRateLimit(), signInWithEmail(), signInWithGoogle(), FEATURES, HIGHLIGHTS, SignupFormData, signupSchema

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (9): inter, metadata, viewport, robots(), register(), AppEnvironment, appEnvironmentClient, getAppUrl() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (18): 4.10 Database Indexing, 4.11 Security Headers, 4.12 Error Handling Standardization, 4.18 Landing Page for CRM, 4.19 `AITextarea` Naming, 4.20 AI Fields on Lead Type, 4.21 Reports Page AI Terminology, 4.22 Email Notification Templates (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (14): 3.1.1 Re-add Dependency, 3.1.2 Gemini Client — `lib/gemini/client.ts` (new), 3.1.3 Environment Variable, 3.1.4 Types — `types/gemini.ts` (new), 3.1.5 AI Permission Toggle, 3.1 Foundation Layer, code:bash (npm install @google/generative-ai react-markdown), code:block2 (lib/gemini/) (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (13): APP_ENVIRONMENT — Design Spec, Banner — `components/system/EnvironmentBanner.tsx` (new), Central config: `lib/env.ts` (new), Client-side mirror, code:ts (export type AppEnvironment = "dev" | "prd" | "maintenance";), Files touched, Goal, Maintenance auth block (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (8): 4.1 Firestore Rules Cleanup, 4.2 Middleware → Proxy Migration, 4.3 Edge Auth Enforcement, 4.4 `.env.example` Creation, 4.5 Secret Exposure in `next.config.ts`, 4.6 Re-add `GEMINI_API_KEY` Securely, code:env (# App), P0 — Critical (Must fix before deployment)

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (7): 3.0 Design Principles, 3.3 AI Feature Summary Matrix, 3.4 AI Architecture Diagram, 3.5 AI Feature Gating, 3.6 Caching Strategy for AI, 3. Gemini AI Integration Plan, code:block19 (┌──────────────────────────────────────────────────────┐)

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (4): AboutSection, BlogSection, metadata, TestimonialsSection

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (6): 4.13 Error Reporting Integration, 4.14 Health Check Endpoint, 4.15 Cleanup Stale Documents, 4.16 Performance Optimization, 4.17 Gemini Error Resilience, P2 — Medium Priority (Stabilize post-launch)

## Knowledge Gaps
- **85 isolated node(s):** `FEATURES`, `signupSchema`, `SignupFormData`, `HIGHLIGHTS`, `inter` (+80 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ExcelBees CRM — Ship to Production Roadmap` connect `Community 0` to `Community 8`, `Community 4`?**
  _High betweenness centrality (0.249) - this node is a cross-community bridge._
- **Why does `3. Gemini AI Integration Plan` connect `Community 8` to `Community 0`, `Community 1`, `Community 5`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Why does `4. Production Readiness Gaps` connect `Community 4` to `Community 0`, `Community 10`, `Community 7`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **What connects `FEATURES`, `signupSchema`, `SignupFormData` to the rest of the system?**
  _85 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12857142857142856 - nodes in this community are weakly interconnected._