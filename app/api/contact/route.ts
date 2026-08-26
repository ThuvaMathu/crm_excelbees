import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/email-service";
import { logger } from "@/lib/logger";
import { Redis } from "@upstash/redis";
import * as z from "zod";

// ─── Validation ────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  businessType: z.string().min(1).max(100),
  message: z.string().min(10).max(4000),
});

// ─── Redis-backed rate limit (5 submissions per IP per 15 min) ───────────────
// Works correctly across all serverless instances on Netlify (unlike in-memory Maps).

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const RATE_LIMIT = 5;
const RATE_WINDOW_SEC = 15 * 60; // 15 minutes

async function isRateLimited(ip: string): Promise<boolean> {
  try {
    const key = `ratelimit:contact:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) {
      // First request — set TTL so the window resets automatically
      await redis.expire(key, RATE_WINDOW_SEC);
    }
    return count > RATE_LIMIT;
  } catch {
    // If Redis is unavailable, fail open (allow the request) so the form
    // still works during a Redis outage.
    logger.warn("Redis unavailable for contact rate limit — allowing request", {
      module: "api",
      action: "contact-rate-limit",
    });
    return false;
  }
}

// ─── POST /api/contact ─────────────────────────────────────────────────────────
// Public endpoint — no Firebase auth required.
// Uses env SMTP (SMTP_HOST / SMTP_USER / SMTP_PASS) to forward contact form
// submissions to the ExcelBees inbox (info@excelbees.com.au).

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (await isRateLimited(ip)) {
    logger.warn("Contact form rate limited", {
      module: "api",
      action: "contact-submit",
      metadata: { ip },
    });
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait 15 minutes and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." },
      { status: 400 }
    );
  }

  const { name, email, businessType, message } = parsed.data;

  // Destination — always the ExcelBees inbox regardless of org SMTP config
  const to = process.env.CONTACT_FORM_TO || "info@excelbees.com.au";
  const subject = `Demo Request from ${name} — ${businessType}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#F59E0B;margin-bottom:4px">New Demo Request — RCRM</h2>
      <p style="color:#888;font-size:12px;margin-top:0">Submitted from the RCRM landing page contact form</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 12px;font-weight:bold;color:#555;width:140px;vertical-align:top">Name</td>
          <td style="padding:8px 12px;color:#222">${name}</td>
        </tr>
        <tr style="background:#fafafa">
          <td style="padding:8px 12px;font-weight:bold;color:#555;vertical-align:top">Email</td>
          <td style="padding:8px 12px;color:#222">
            <a href="mailto:${email}" style="color:#F59E0B">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:bold;color:#555;vertical-align:top">Business Type</td>
          <td style="padding:8px 12px;color:#222">${businessType}</td>
        </tr>
        <tr style="background:#fafafa">
          <td style="padding:8px 12px;font-weight:bold;color:#555;vertical-align:top">Message</td>
          <td style="padding:8px 12px;color:#222;white-space:pre-wrap">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <p style="color:#aaa;font-size:11px">Sent from rcrm.excelbees.com.au · Reply directly to the sender's email above</p>
    </div>
  `;

  logger.info("Processing contact form submission", {
    module: "api",
    action: "contact-submit",
    metadata: { businessType, ip },
  });

  const result = await sendEmail(
    to,
    subject,
    html,
    undefined, // use env FROM_EMAIL / SMTP_USER
    undefined,
    undefined,
    undefined,
    email, // replyTo sender's email so you can reply directly
    "RCRM Contact Form",
    undefined // no orgId — use env SMTP fallback
  );

  if (!result.success) {
    logger.error("Contact form email failed to send", {
      module: "api",
      action: "contact-submit",
      metadata: { ip },
      error: result.error,
    });
    return NextResponse.json(
      { success: false, error: "Failed to send your message. Please email us directly at info@excelbees.com.au" },
      { status: 500 }
    );
  }

  logger.info("Contact form email sent successfully", {
    module: "api",
    action: "contact-submit",
    metadata: { ip },
  });

  return NextResponse.json({ success: true });
}
