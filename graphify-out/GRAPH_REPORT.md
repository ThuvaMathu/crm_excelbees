# Graph Report - crm_excelbees  (2026-08-26)

## Corpus Check
- 83 files · ~34,817 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 514 nodes · 1063 edges · 29 communities (23 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `84d662ce`
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 43 edges
2. `useAuth()` - 32 edges
3. `Button` - 22 edges
4. `AI-Enhanced CRM: Advanced Features Plan` - 17 edges
5. `compilerOptions` - 16 edges
6. `LoadingSpinner()` - 16 edges
7. `Input` - 13 edges
8. `Card` - 12 edges
9. `Core Collections` - 10 edges
10. `4. A-Z Implementation Roadmap` - 10 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  lib/utils.ts → package.json
- `ProfilePage()` --calls--> `useAuth()`  [EXTRACTED]
  app/(dashboard)/profile/page.tsx → hooks/useAuth.ts
- `DealStageBadge()` --calls--> `cn()`  [EXTRACTED]
  components/deals/DealStageBadge.tsx → lib/utils.ts
- `CommandShortcut()` --calls--> `cn()`  [EXTRACTED]
  components/ui/command.tsx → lib/utils.ts
- `LoginPage()` --calls--> `useAuth()`  [EXTRACTED]
  app/(auth)/login/page.tsx → hooks/useAuth.ts

## Communities (29 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (56): signOut(), CreateCompanyDialog(), CompaniesPage(), CreateContactDialog(), ContactsPage(), DashboardLayout(), DashboardPage(), useAuth() (+48 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (39): onAuthStateChanged(), signInWithEmail(), signInWithGoogle(), signUpWithEmail(), quickActions, quickStats, analytics, EventData (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (37): CreateCompanyDialogProps, CreateContactDialogProps, CreateDealDialogProps, DEAL_STAGES, CreateLeadDialogProps, DialogContent, DialogDescription, DialogFooter() (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (47): 10.1 Smart Lead Scoring, 10.2 Intelligent Lead Routing, 11.1 Email Intelligence, 11.2 Meeting Intelligence, 12.1 CRM Copilot (Chat Interface), 12.2 Smart Search & Discovery, 13.1 Deal Intelligence, 13.2 Performance Insights (+39 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (33): dependencies, class-variance-authority, clsx, cmdk, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+25 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (32): 1. Project Overview & Vision, 2. Tech Stack & Architecture, 3. Data Model (Schema Design), 4. A-Z Implementation Roadmap, 5. UI/UX Design System Reference, `activities` (The "Timeline"), Anatomy of a Page, Backend & Data (+24 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (24): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (15): createUserProfile(), getUserProfile(), updateLastLogin(), updateUserProfile(), UserDocument, UserProfile, UserRole, UserStatus (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (13): createLead(), deleteLead(), getLead(), getLeads(), Activity, ActivityType, CompanySize, Lead (+5 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (10): CreateDealDialog(), stageColors, STAGES, createDeal(), getDeals(), getDealsByStage(), updateDealStage(), Deal (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, postcss, tailwindcss, tailwindcss-animate, @types/node, @types/papaparse (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (6): createCompany(), getCompanies(), Address, Company, CompanyFilters, CompanyInput

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (6): createContact(), getContacts(), importContacts(), Contact, ContactFilters, ContactInput

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 17 - "Community 17"
Cohesion: 0.32
Nodes (4): inter, metadata, AuthProvider(), ThemeProvider()

### Community 18 - "Community 18"
Cohesion: 0.38
Nodes (4): auth, db, firebaseConfig, missingConfig

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): DealStageBadge(), DealStageBadgeProps, stageConfig, DealStage

### Community 20 - "Community 20"
Cohesion: 0.50
Nodes (3): dependencies, @kilocode/plugin, @opencode-ai/plugin

## Knowledge Gaps
- **221 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+216 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 14`, `Community 19`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 4` to `Community 16`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `clsx` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.057902973395931145 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09771825396825397 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0963265306122449 - nodes in this community are weakly interconnected._