# APP_ENVIRONMENT — Design Spec

Date: 2026-08-27

## Problem

The app currently gates production behavior behind a single boolean, `IS_PRODUCTION`, read ad hoc in `lib/environment.ts` and `instrumentation.ts`. There is no way to represent a "dev/beta" mode (visibly labeled, non-indexable) or a "maintenance" mode (auth disabled, everything else working) without more booleans multiplying across the codebase.

## Goal

Replace `IS_PRODUCTION` with a single, strictly-typed `APP_ENVIRONMENT` variable with three values: `dev | prd | maintenance`. Centralize all environment-dependent behavior (SEO indexing, banners, auth availability) behind one config module so no file re-implements the check.

## Non-goals

- Rearchitecting authentication to run through our own backend. Auth stays client-side Firebase Auth (`lib/auth/auth-service.ts`, `createUserWithEmailAndPassword`/`signInWithEmailAndPassword`/`signInWithPopup` called directly from the browser).
- Changing behavior for already-authenticated sessions during maintenance. Only *new* session creation (login, signup, Google sign-in) is blocked.

## Central config: `lib/env.ts` (new)

```ts
export type AppEnvironment = "dev" | "prd" | "maintenance";

function parseAppEnvironment(raw: string | undefined): AppEnvironment {
  if (raw === "dev" || raw === "prd" || raw === "maintenance") return raw;
  // Fail-safe default: never silently look like production to a crawler
  // or a user if misconfigured — dev mode is loud (banner) and safe (noindex).
  return "dev";
}

export const appEnvironment = parseAppEnvironment(process.env.APP_ENVIRONMENT);
export const isDev = appEnvironment === "dev";
export const isPrd = appEnvironment === "prd";
export const isMaintenance = appEnvironment === "maintenance";
```

This module is importable from Server Components, Route Handlers, Server Actions, and Middleware (all have direct `process.env` access, no `NEXT_PUBLIC_` prefix needed).

`lib/environment.ts` keeps its existing helpers (`getAppUrl`, `requireEnvVar`, etc.) but its `isProduction` export is redefined as `appEnvironment !== "dev"` (true for both `prd` and `maintenance`) — this preserves today's behavior of `getAppUrl()` throwing on a missing URL in anything that isn't plain dev.

### Client-side mirror

The login/signup pages are `"use client"` and run in the browser, so they cannot read `process.env.APP_ENVIRONMENT` at runtime — only `NEXT_PUBLIC_`-prefixed vars get inlined at build time. We set `NEXT_PUBLIC_APP_ENVIRONMENT` to the same value in every env file, and add a tiny client-safe export (`lib/env.ts` also exports a version derived from `process.env.NEXT_PUBLIC_APP_ENVIRONMENT` guarded so it's tree-shakeable into client bundles: `isMaintenanceClient`, `isDevClient`).

Both vars must be kept in sync per deploy; this is a one-time documentation note in `.env.example`, not a runtime dependency.

## SEO — `app/robots.ts` (new) + `app/layout.tsx`

- `dev`: `app/robots.ts` returns `{ rules: { userAgent: "*", disallow: "/" } }`. `app/layout.tsx` metadata sets `robots: { index: false, follow: false, googleBot: { index: false, follow: false } }`.
- `prd` and `maintenance`: `app/robots.ts` returns `{ rules: { userAgent: "*", allow: "/" }, sitemap }`. `layout.tsx` metadata keeps today's `index: true, follow: true`.

Rationale for treating `maintenance` as indexable: the spec describes maintenance as visually/functionally prod-like, and only calls out `dev` for noindex. Deindexing the live site during a maintenance window would be a worse outcome than briefly showing the maintenance banner to a crawler.

## Banner — `components/system/EnvironmentBanner.tsx` (new)

A Server Component rendered as the very first child inside `<body>` in `app/layout.tsx`, so it appears on every route including `/`. `position: sticky; top: 0; z-index: 9999` (reads as pinned to the top without needing manual body-padding math that `fixed` would require).

- `dev` → yellow banner: "🚧 BETA — Development Environment. Not for production use."
- `maintenance` → amber/red banner: "🛠️ Maintenance in progress — sign-in and sign-up are temporarily unavailable."
- `prd` → renders `null`.

## Maintenance auth block

Given Firebase Auth is called directly from the browser, there is no single server chokepoint that sees every auth attempt. We block at every chokepoint that does exist:

1. **New server action** `app/actions/check-auth-availability.ts`: `checkAuthAvailability(): Promise<{ allowed: boolean; message?: string }>`. Returns `allowed: false` with a user-facing message when `isMaintenance`.
2. **`app/actions/login-rate-limit.ts`**: `checkLoginRateLimit` checks `isMaintenance` first and returns blocked (short-circuiting before touching Upstash), so a direct call to this action is also blocked, not just the UI path.
3. **Login page** (`app/(auth)/login/page.tsx`) and **signup page** (`app/(auth)/signup/page.tsx`): use `isMaintenanceClient` to hide/disable the email form and the Google button, replacing them with a message. Both pages still call the server action defensively before invoking any Firebase function, so even a modified/replayed client request hits a server-side no.
4. **Google sign-in** (`signInWithGoogle` in `lib/auth/auth-service.ts`): gated the same way at both call sites (login, signup) since it's a popup flow with no server round-trip until after Firebase has already authenticated the user.

**Documented residual gap:** a client that calls the Firebase Auth SDK directly (bypassing our pages and server actions entirely — e.g. a hand-crafted script using the public Firebase client config) cannot be blocked server-side without proxying auth through our own backend, which is out of scope here. This is a property of using Firebase Auth as a client SDK, not a gap introduced by this change.

Existing sessions are unaffected: `lib/auth/server-auth.ts#auth()` (used to verify already-issued tokens for protected server actions/routes) is not modified, since the requirement only restricts *creating new* sessions, and "existing public pages should remain accessible."

## Middleware

No behavioral change needed. `middleware.ts` already redirects unauthenticated users away from protected routes and doesn't intercept Firebase Auth traffic (which never touches our server). It is not part of the auth-blocking chokepoint list above because it can't see Firebase Auth calls.

## Files touched

| File | Change |
|---|---|
| `lib/env.ts` | new — central `APP_ENVIRONMENT` config |
| `lib/environment.ts` | `isProduction` redefined in terms of `appEnvironment` |
| `app/robots.ts` | new — dynamic robots.txt |
| `app/layout.tsx` | dynamic `metadata.robots`; render `EnvironmentBanner` |
| `components/system/EnvironmentBanner.tsx` | new |
| `app/actions/check-auth-availability.ts` | new server action |
| `app/actions/login-rate-limit.ts` | maintenance short-circuit |
| `app/(auth)/login/page.tsx` | maintenance UI gate |
| `app/(auth)/signup/page.tsx` | maintenance UI gate |
| `instrumentation.ts` | log `appEnvironment` instead of `IS_PRODUCTION` |
| `.env.local`, `.env.example` | `APP_ENVIRONMENT` + `NEXT_PUBLIC_APP_ENVIRONMENT` replace `IS_PRODUCTION` |
| `ship-to-prd.md` | update documented env var |
| `scripts/verify-robots.js` | update to three-mode logic |

## Testing

- Unit-style manual check: set `APP_ENVIRONMENT=dev` / `prd` / `maintenance` / unset / garbage in `.env.local`, restart dev server, verify: banner text/color, `/robots.txt` output, page `<meta name="robots">`, and that login/signup forms are disabled only in `maintenance`.
- Confirm an already-logged-in session still reaches `/org` when `APP_ENVIRONMENT=maintenance` is set (existing sessions unaffected).
