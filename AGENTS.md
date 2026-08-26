# CRM ExcelBees — Working Notes

Next.js 16 (App Router) + React 19 + TypeScript (strict) CRM. Backend is Firebase
(client SDK + Firebase Admin on the server): Firestore, Auth, Storage. Also uses
Upstash Redis (rate limiting), Gemini API (AI features), Nodemailer/SMTP (email).

## Commands

- `npm run dev` — Next dev server. `npm run build` / `npm run start` (note `start` uses port 3001).
- Typecheck: `npx tsc --noEmit` (there is no dedicated typecheck script; `npm run build` also checks types).
- E2E tests (Playwright): `npm run test` auto-starts the Next dev server. Full workflow in `TESTING.md`.
  - Run a single spec: `npx playwright test tests/e2e/auth/login.spec.ts`
  - Port is `PLAYWRIGHT_TEST_PORT` (default 3000). 3000 is unreliable on dev's machine, so set it explicitly.
  - **Locally Playwright runs with 1 worker** deliberately — Next lazily compiles routes and parallel workers cause spurious "login form never appeared" timeouts. Don't "fix" this.

## Multi-tenant structures (everything is org-scoped)

- All CRM routes live under `/org/[orgId]/...` (e.g. `/org/{orgId}/leads`). `middleware.ts` redirects legacy flat routes (`/dashboard`, `/leads`, ...) and home to `/org`; don't add new flat routes.
- Every domain entity has an `organizationId` field; all `lib/firestore/<entity>.ts` functions take an `organizationId` argument. Watch for a legacy flat route/path being left unscoped.
- Org/membership: `lib/firestore/organizations.ts`. Member doc id is `${orgId}_${userId}` for O(1) lookup. Auth per-org role lives in `currentMember` of the zustand store `store/org.ts` — **not** global `user.role`.
- Firestore rules (see `firestore.rules`) gate everything behind helper funcs `isMemberOf(orgId)`, `isOrgAdmin`, `belongsToOrg`. Keep `organizationId` immutable.

## Code layout conventions

- Server Actions live in `app/actions/` (incl. `app/actions/ai/*`). The top-level `actions/` dir is empty — ignore it.
- Zod validation schemas in `lib/validations/` (match per-entity names). Server Actions validate with these; don't inline ad-hoc validation.
- Path alias `@/*` → repo root. UI primitives are shadcn/ui in `components/ui/` (Radix + Tailwind).
- RBAC helpers in `lib/permissions/`; client gating via `components/auth/AuthGate.tsx` / `RBACGuard.tsx`.
- Auth: cookie session set via Firebase Admin; middleware only redirects unauthenticated — the real authorization is server-side in Action/Route handlers. Never trust client-side role alone.

## Logging (see `docs/LOGGING.md`)

- One API everywhere: `logger.debug/info/warn/error(message, { module, action, userId, organizationId, error, metadata })`.
- **Server code** imports `@/lib/logger` (pino). **Browser/client code** must import `@/lib/logger/client` — the server logger pulls pino into the client bundle and breaks builds. Client = components, `app/org/**`, `lib/firestore/*`, `lib/storage/*`, `lib/auth/permission-utils.ts`, `lib/analytics.ts`.
- Levels: `LOG_LEVEL` (server, default debug/info), `NEXT_PUBLIC_LOG_LEVEL` (client, default debug/warn).
- Never log passwords, tokens, cookies, auth headers, SMTP creds, payment data, or full customer docs. Pass caught errors as the `error` field (serialized safely); use IDs, not whole objects.
- `middleware.ts` sets `x-request-id`; read it server-side via `getRequestId()` from `@/lib/logger`.
- Audit logs (Firestore `audit_logs`) stay separate from application logs — don't write an audit record per `logger.*` call.

## Env & secrets

- `.env.local` for local dev/server secrets. `.env.test` loaded by Playwright config for test credentials.
- **Gemini key (`GEMINI_API_KEY`) is server-only — never expose with `NEXT_PUBLIC_` prefix.** Same principle for Firebase Admin/SMTP/Upstash secrets.
- `.env.test` is gitignored; provide real values locally (see `.env.example`).

## Tests

- E2E specs in `tests/e2e/<module>/`. Role-authenticated fixtures (`adminPage`, `managerPage`, `teamPage`, `scannerPage`) come from `tests/fixtures/auth.ts`; specs use `getOrgId(page)` from the URL.
- Requires seeded Firebase users (test.*@excelbees.com) — see `scripts/seed-playwright-test-users.ts` and `TESTING.md`. Tests hit the real Firebase project, not an emulator.
- `tests/generated/` holds AI-generated specs from `humanlike-test-case.md`; follow the same fixture/pageobject/helper conventions.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
