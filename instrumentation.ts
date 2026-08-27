/**
 * Next.js Instrumentation Hook — runs ONCE when the server process starts.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Performs live connectivity checks for every external service and prints
 * a single ✅ / ❌ checklist to the server log so startup issues are obvious.
 */
export async function register() {
  // Only run in the Node.js runtime — not in the Edge layer / middleware bundle.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { logger } = await import("@/lib/logger");
  const { appEnvironment } = await import("@/lib/env");

  // ─── Result collector ─────────────────────────────────────────────────────
  type CheckResult = { label: string; ok: boolean; detail: string };
  const results: CheckResult[] = [];

  function pass(label: string, detail: string) {
    results.push({ label, ok: true, detail });
  }
  function fail(label: string, detail: string) {
    results.push({ label, ok: false, detail });
  }

  logger.info("┌─ Server startup — running service health checks…", {
    module: "instrumentation",
    action: "startup",
    metadata: {
      nodeEnv: process.env.NODE_ENV,
      appEnvironment,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeVersion: process.version,
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Firebase Client SDK — env vars (build-time injection, no network call)
  // ─────────────────────────────────────────────────────────────────────────
  const clientVars: Record<string, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const missingClient = Object.entries(clientVars).filter(([, v]) => !v).map(([k]) => k);
  if (missingClient.length === 0) {
    pass(
      "Firebase Client SDK (env vars)",
      `project=${clientVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`
    );
  } else {
    fail("Firebase Client SDK (env vars)", `missing: ${missingClient.join(", ")}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Firebase Admin SDK — init + live Auth API probe
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const { getAdminApp, getAdminAuth } = await import("@/lib/firebase-admin");
    const adminApp = getAdminApp(); // throws on bad private key / missing vars

    const projectId = process.env.FIREBASE_PROJECT_ID ?? "";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? "";
    const maskedEmail = clientEmail.replace(/^(.{6})([^@]+)(@.+)$/, "$1...$3");

    // Live Auth API probe — proves key is valid and network can reach Google
    const auth = getAdminAuth();
    try {
      await auth.getUser("__startup_probe__");
      pass("Firebase Admin SDK", `project=${projectId} sa=${maskedEmail}`);
    } catch (probeErr: any) {
      if (probeErr?.code === "auth/user-not-found") {
        // Expected — means credentials are valid and API responded
        pass("Firebase Admin SDK", `project=${projectId} sa=${maskedEmail} (Auth API ✓)`);
      } else if (probeErr?.code === "auth/invalid-credential" || probeErr?.errorInfo?.code === "auth/invalid-credential") {
        fail(
          "Firebase Admin SDK",
          `Credential rejected — check FIREBASE_PRIVATE_KEY newline format. code=${probeErr?.code}`
        );
      } else {
        fail("Firebase Admin SDK", `Auth probe error: ${probeErr?.code ?? probeErr?.message ?? String(probeErr)}`);
      }
    }
  } catch (err: any) {
    const hint =
      String(err?.message ?? "").includes("PEM") ||
      String(err?.message ?? "").includes("private key")
        ? " — FIREBASE_PRIVATE_KEY may have wrong newline format (Netlify: paste raw PEM)"
        : "";
    fail("Firebase Admin SDK", `Init failed${hint}: ${err?.message ?? String(err)}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Upstash Redis — live PING
  // ─────────────────────────────────────────────────────────────────────────
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      fail("Upstash Redis", "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing");
    } else {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const pong = await redis.ping();
      if (pong === "PONG") {
        pass("Upstash Redis", `PING → PONG (url=${process.env.UPSTASH_REDIS_REST_URL})`);
      } else {
        fail("Upstash Redis", `Unexpected PING response: ${pong}`);
      }
    }
  } catch (err: any) {
    fail("Upstash Redis", `Connection failed: ${err?.message ?? String(err)}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. SMTP / Email — nodemailer transporter.verify()
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const smtpRequired = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "FROM_EMAIL"];
    const missingSmtp = smtpRequired.filter((k) => !process.env[k]);
    if (missingSmtp.length > 0) {
      fail("SMTP / Email", `Missing vars: ${missingSmtp.join(", ")}`);
    } else {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? "465"),
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls: { rejectUnauthorized: false },
      });
      await transporter.verify();
      pass(
        "SMTP / Email",
        `host=${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? "465"} user=${process.env.SMTP_USER} from=${process.env.FROM_EMAIL}`
      );
    }
  } catch (err: any) {
    fail("SMTP / Email", `verify() failed: ${err?.message ?? String(err)}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Gemini AI — env var presence (no API call to avoid quota burn)
  // ─────────────────────────────────────────────────────────────────────────
  if (process.env.GEMINI_API_KEY) {
    pass("Gemini AI API key", "GEMINI_API_KEY present (server-only ✓)");
  } else {
    fail("Gemini AI API key", "GEMINI_API_KEY missing — AI features will fail");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Encryption key
  // ─────────────────────────────────────────────────────────────────────────
  const encKey = process.env.ENCRYPTION_KEY ?? "";
  if (encKey.length === 64 && /^[0-9a-f]+$/i.test(encKey)) {
    pass("Encryption key", "ENCRYPTION_KEY present, correct length (64 hex chars)");
  } else if (encKey.length > 0) {
    fail("Encryption key", `ENCRYPTION_KEY present but wrong format — expected 64 hex chars, got ${encKey.length}`);
  } else {
    fail("Encryption key", "ENCRYPTION_KEY missing — stored SMTP passwords cannot be decrypted");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Admin sync secret
  // ─────────────────────────────────────────────────────────────────────────
  const syncSecret = process.env.ADMIN_SYNC_SECRET ?? "";
  if (!syncSecret) {
    fail("Admin sync secret", "ADMIN_SYNC_SECRET missing — /api/admin/sync-claims is unprotected");
  } else if (syncSecret === "excelbees-admin-sync-2026") {
    // Still the default — warn but don't fail (it works, just weak)
    results.push({
      label: "Admin sync secret",
      ok: true,
      detail: "⚠ Using default value — change before going live in production",
    });
  } else {
    pass("Admin sync secret", "ADMIN_SYNC_SECRET set (non-default)");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. App URL
  // ─────────────────────────────────────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (appUrl.startsWith("https://")) {
    pass("App URL", `NEXT_PUBLIC_APP_URL=${appUrl}`);
  } else if (appUrl.startsWith("http://")) {
    results.push({ label: "App URL", ok: true, detail: `⚠ HTTP (non-HTTPS) — ok for local dev only: ${appUrl}` });
  } else {
    fail("App URL", `NEXT_PUBLIC_APP_URL missing or invalid: "${appUrl}"`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHECKLIST SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  const allOk = results.every((r) => r.ok);
  const failCount = results.filter((r) => !r.ok).length;

  const lines = results.map(
    (r) => `  ${r.ok ? "✅" : "❌"} ${r.label.padEnd(38)} ${r.detail}`
  );

  const banner = allOk
    ? "✅ All services OK"
    : `❌ ${failCount} service(s) failed — check details above`;

  logger.info(
    [
      "┌──────────────────────────────────────────────────────────────",
      "│  SERVICE HEALTH CHECKLIST",
      "├──────────────────────────────────────────────────────────────",
      ...lines.map((l) => `│${l}`),
      "├──────────────────────────────────────────────────────────────",
      `│  ${banner}`,
      "└──────────────────────────────────────────────────────────────",
    ].join("\n"),
    { module: "instrumentation", action: "health-summary" }
  );

  // Also emit individual structured log entries so each check is queryable
  for (const r of results) {
    if (r.ok) {
      logger.info(`[startup] ${r.label}`, {
        module: "instrumentation",
        action: "health-check",
        metadata: { service: r.label, status: "ok", detail: r.detail },
      });
    } else {
      logger.error(`[startup] ${r.label} FAILED`, {
        module: "instrumentation",
        action: "health-check",
        metadata: { service: r.label, status: "fail", detail: r.detail },
      });
    }
  }
}
