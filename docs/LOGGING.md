# Logging

Centralized, environment-aware logging for CRM ExcelBees. One API, two
transports (server + client), structured output ready for a future monitoring
provider.

## Where it lives

| Module | Runtime | Transport |
|--------|---------|-----------|
| `lib/logger/index.ts` | Server (route handlers, server actions, server utils) | pino — pretty in dev, JSON in prod |
| `lib/logger/client.ts` | Browser / client components | `console` — detailed in dev, warn/error only in prod |
| `lib/logger/levels.ts` | Shared | Level parsing/resolution |
| `lib/logger/sanitize.ts` | Shared | Sensitive-data redaction |
| `lib/logger/serialize.ts` | Shared | Error serialization |
| `lib/logger/request-id.ts` | Server | Correlation ID helpers |

> ⚠️ Server logger (`@/lib/logger`) pulls in pino + pino-pretty. Never import it
> from client components — it breaks the client bundle. Client code must use
> `@/lib/logger/client`.

## Usage

```ts
import { logger } from "@/lib/logger";        // server code
import { logger } from "@/lib/logger/client"; // browser code

logger.debug("Fetching leads", {
  module: "leads",
  action: "fetch",
});

logger.info("Lead created", {
  module: "leads",
  action: "create",
  leadId,
  userId,
});

logger.warn("Permission denied", {
  module: "permissions",
  action: "update",
  userId,
});

logger.error("Failed to update lead", {
  module: "leads",
  action: "update",
  leadId,
  userId,
  error, // any caught value — Error, string, unknown, object
});
```

`logger.child({ requestId, userId })` returns a child logger that attaches
those fields to every subsequent call (useful to thread a correlation ID
through a request).

## Log levels

`debug` → `info` → `warn` → `error`

- **Development** — default `debug`. Detailed terminal/browser output, stack
  traces preserved.
- **Production** — server default `info` (debug off), client default `warn`
  (avoids noisy browser consoles). Server logs are structured JSON to stdout.

### Environment variables

| Variable | Scope | Default |
|----------|-------|---------|
| `LOG_LEVEL` | server | `debug` (dev) / `info` (prod) |
| `NEXT_PUBLIC_LOG_LEVEL` | client | `debug` (dev) / `warn` (prod) |

Example: `LOG_LEVEL=error` silences everything below error on the server.

## Structure

Every log includes `level`, `message`, `timestamp`, `environment`, `app`.
Optional fields: `module`, `action`, `userId`, `organizationId`, `requestId`,
`error`, `metadata`. Prefer IDs (`leadId`, `contactId`, `organizationId`) over
whole objects in `metadata`.

## Errors

Pass the caught value as the `error` context field — it is serialized safely:

```ts
try {
  await createLead(...);
} catch (error) {
  logger.error("Failed to create lead", {
    module: "leads",
    action: "create",
    userId,
    error, // Error | unknown | string | object — all handled
  });
}
```

`Error` instances keep `name`, `message`, `stack`, `code`, `cause`. Non-errors
are normalized (`string` → message, objects → name/message/code, primitives →
stringified, `null`/`undefined` → "Unknown error"). Never send the raw error
text to the user — log it, return a generic message.

## Privacy / never log

This is a CRM — the logger redacts known-sensitive keys
(`password`, `pass`, `token`, `apiKey`, `authorization`, `cookie`,
`smtpPass`, `privateKey`, `cvv`, `cvc`, `cardNumber`, …) in `metadata`, and
pino has a second `redact` layer on the server.

Still, never pass these to the logger:

- Passwords, refresh/ID tokens, API keys, Firebase credentials
- Cookies, authorization headers
- Payment credentials
- Full customer records, full Firestore documents, full form state
- Entire request bodies that may contain sensitive data

Prefer `userId`, `leadId`, `contactId`, `organizationId`, `recordId`,
`action`, `module`.

Sanitization caps nesting depth, array length and string length, and breaks
circular references, so accidental huge/cyclic payloads can't crash a log.

## Request / correlation IDs

`middleware.ts` mints/propagates an `x-request-id` header. Server code reads it
with:

```ts
import { getRequestId } from "@/lib/logger";
const requestId = await getRequestId();
```

Or wrap a handler so every log call carries it:

```ts
import { logger, getRequestId } from "@/lib/logger";

const requestId = await getRequestId();
const log = requestId ? logger.child({ requestId }) : logger;
log.error("Failed to X", { module: "...", action: "...", error });
```

This lets you trace `Request → API/Server Action → Firebase op → Error` with a
single ID. Don't force request IDs where they aren't available (e.g. some
background jobs).

## Audit logs vs application logs

Application logs (this logger) answer *what happened technically*.
Audit logs (`lib/firestore/audit-logs.ts`, admin actions writing to
`audit_logs` in Firestore) answer *what a user did*. They stay separate — do
not create an audit record for every `logger.*` call. The logger architecture
makes it easy to add audit-log records for meaningful user actions (login,
lead create/update/delete, permission changes, exports) without coupling them
to debug/error logs.

## Adding a monitoring provider later (Sentry / Better Stack / Axiom / Datadog)

The app only ever calls the `logger.*` API — providers are a *transport*
concern:

1. **Server**: create a transport (e.g. a pino transport/stream, or forward
   `LogEntry` objects from `lib/logger/server.ts`). pino already emits
   structured JSON on stdout, so most platforms (Datadog, Axiom, Better Stack)
   can ingest the existing output directly with no code change. For Sentry,
   add a hook in the `error` path of `server.ts` that calls
   `Sentry.captureException`.
2. **Client**: `lib/logger/client.ts` already emits structured JSON for
   `warn`/`error` in production — wire those to a provider (e.g. Sentry
   `captureMessage`) instead of `console`, or hook the log call site.
3. No rewriting of the CRM's logging code is required — only the transport.

## Tests

`tests/e2e/logger/logger.spec.ts` covers level resolution, filtering,
sanitization, error serialization and client behavior:

```bash
npx playwright test tests/e2e/logger/logger.spec.ts
```
