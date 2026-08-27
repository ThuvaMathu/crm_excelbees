/**
 * Centralized APP_ENVIRONMENT config.
 *
 * Server/Edge code (Server Components, Route Handlers, Server Actions,
 * middleware) can read `process.env.APP_ENVIRONMENT` directly and should
 * import `appEnvironment` / `isDev` / `isPrd` / `isMaintenance` from here.
 *
 * Client Components cannot read non-NEXT_PUBLIC_ vars at runtime, so
 * `NEXT_PUBLIC_APP_ENVIRONMENT` must be set to the same value in every env
 * file — `isDevClient` / `isMaintenanceClient` read that mirror.
 */

export type AppEnvironment = "dev" | "prd" | "maintenance";

function parseAppEnvironment(raw: string | undefined): AppEnvironment {
  if (raw === "dev" || raw === "prd" || raw === "maintenance") return raw;
  // Fail-safe default: an unset/invalid value must never silently look like
  // production — dev mode is loud (banner) and safe (noindex).
  return "dev";
}

export const appEnvironment: AppEnvironment = parseAppEnvironment(process.env.APP_ENVIRONMENT);
export const isDev = appEnvironment === "dev";
export const isPrd = appEnvironment === "prd";
export const isMaintenance = appEnvironment === "maintenance";

export const appEnvironmentClient: AppEnvironment = parseAppEnvironment(
  process.env.NEXT_PUBLIC_APP_ENVIRONMENT
);
export const isDevClient = appEnvironmentClient === "dev";
export const isMaintenanceClient = appEnvironmentClient === "maintenance";
