import nodemailer from "nodemailer";
import {
  getWelcomeEmailTemplate,
  getPasswordChangedEmailTemplate,
  getPasswordResetEmailTemplate,
} from "./templates/auth-templates";
import { getAppUrl } from "../environment";
import { adminDb } from "../firebase-admin";
import { decrypt } from "../crypto";
import { logger } from "@/lib/logger";

// ============================================================================
// TRANSPORTER CACHING PATTERN FOR LAMBDA COMPATIBILITY
// ============================================================================

interface ResolvedTransporter {
  transporter: nodemailer.Transporter;
  /** The mailbox actually authenticated with this transporter — the "From"
   *  header MUST match this (see getResolvedTransporter's doc comment). */
  fromEmail: string;
  source: "org" | "env-fallback";
  cachedAt: number;
}

// Cached transporters are only safe for a bounded time: without a TTL, an
// org's very first send caches a transporter for the *entire lifetime of
// the Node process* — if the admin later fixes a typo'd password, switches
// providers, or (as tested) deliberately breaks the password, every send
// after that first one keeps silently reusing the stale, already-working
// transporter and never re-reads Firestore. clearTransporterCache() (called
// from the SMTP settings POST route on every save) handles the common case
// immediately; this TTL is a safety net for any path that updates
// smtpConfig without going through that route.
const TRANSPORTER_TTL_MS = 5 * 60 * 1000;

const transporters = new Map<string, ResolvedTransporter>();
let defaultTransporter: ResolvedTransporter | null = null;

/** Mask a password/secret for logging: keep length + first/last char only. */
function maskSecret(value: string | undefined | null): string {
  if (!value) return "(empty)";
  if (value.length <= 2) return "*".repeat(value.length);
  return `${value[0]}${"*".repeat(value.length - 2)}${value[value.length - 1]} (len ${value.length})`;
}

/** Invalidate the cached transporter for an org so the next send re-reads
 *  Firestore instead of reusing stale credentials. Call this any time
 *  smtpConfig is written (see app/api/org/[orgId]/integrations/smtp/route.ts). */
export function clearTransporterCache(orgId: string): void {
  const had = transporters.delete(orgId);
  logger.info("Transporter cache cleared", { module: "email", action: "clear-transporter-cache", organizationId: orgId, metadata: { hadEntry: had } });
}

/**
 * Get or create email transporter, along with the mailbox address it's
 * actually authenticated as. Most SMTP providers (Gmail, Zoho, Outlook)
 * reject or spam-bucket mail whose "From" header doesn't match the
 * authenticated account — sendMail() can still return a message ID (the
 * provider *accepted* it for processing) even when it's about to bounce or
 * get silently dropped downstream for exactly this mismatch. Callers must
 * use the returned fromEmail, not a separately-configured default, or an
 * org with its own SMTP account will see "sent successfully" in the logs
 * and nothing ever arrive.
 */
export async function getResolvedTransporter(orgId?: string): Promise<ResolvedTransporter> {
  logger.debug("Resolving transporter", { module: "email", action: "resolve-transporter", organizationId: orgId, metadata: { hasOrg: Boolean(orgId) } });

  if (orgId) {
    const cached = transporters.get(orgId);
    if (cached) {
      const age = Date.now() - cached.cachedAt;
      if (age < TRANSPORTER_TTL_MS) {
        logger.debug("Using cached transporter", { module: "email", action: "resolve-transporter", organizationId: orgId, metadata: { source: cached.source, ageSeconds: Math.round(age / 1000), fromEmail: cached.fromEmail } });
        return cached;
      }
      logger.debug("Cached transporter expired, refetching config", { module: "email", action: "resolve-transporter", organizationId: orgId, metadata: { ageSeconds: Math.round(age / 1000) } });
      transporters.delete(orgId);
    }

    let smtpConfig: any;
    try {
      logger.debug("Fetching SMTP configuration from Firestore", { module: "email", action: "resolve-transporter", organizationId: orgId });
      const orgDoc = await adminDb.collection("organizations").doc(orgId).get();
      smtpConfig = orgDoc.data()?.smtpConfig;
    } catch (error) {
      // Infra-level failure to even read the org doc — falling back to the
      // env default here is reasonable resilience, not a hidden misconfig.
      logger.error("Failed to read SMTP config from Firestore, falling back to env default", { module: "email", action: "resolve-transporter", organizationId: orgId, error });
      smtpConfig = undefined;
    }

    if (smtpConfig && smtpConfig.user && smtpConfig.host) {
      logger.info(
        "Org SMTP config found",
        { module: "email", action: "resolve-transporter", organizationId: orgId, metadata: { host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure, fromEmail: smtpConfig.user, hasEncryptedPassword: Boolean(smtpConfig.pass) } }
      );

      let pass = smtpConfig.pass;
      if (pass && pass !== "********") {
         pass = decrypt(pass);
      }
      logger.debug(`Resolved password for org ${orgId}: ${maskSecret(pass)}`, { module: "email", action: "resolve-transporter", organizationId: orgId });

      const orgTransporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.user,
          pass: pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify credentials up front, before caching. This is what actually
      // catches a wrong/expired password — without it, createTransport()
      // succeeds unconditionally (it's lazy, no network call), and a badly
      // configured org would only find out days later when a real send
      // silently vanished. A verified-bad org config is NOT allowed to
      // fall through to the env default: that would send real mail from
      // the wrong mailbox while reporting "success", hiding the org's
      // actual misconfiguration (this is exactly the bug behind
      // "I deliberately set a wrong password and it still said successful").
      try {
        logger.debug("Verifying SMTP credentials", { module: "email", action: "verify-smtp", organizationId: orgId, metadata: { host: smtpConfig.host, port: smtpConfig.port } });
        await orgTransporter.verify();
        logger.info("SMTP credentials verified", { module: "email", action: "verify-smtp", organizationId: orgId, metadata: { fromEmail: smtpConfig.user } });
      } catch (verifyError: any) {
        logger.error("SMTP credentials failed verification", { module: "email", action: "verify-smtp", organizationId: orgId, metadata: { host: smtpConfig.host, fromEmail: smtpConfig.user }, error: verifyError });
        throw new Error(`This organization's SMTP configuration is invalid: ${verifyError.message}`);
      }

      const resolved: ResolvedTransporter = {
        transporter: orgTransporter,
        fromEmail: smtpConfig.user,
        source: "org",
        cachedAt: Date.now(),
      };
      transporters.set(orgId, resolved);
      logger.info("Built and cached org transporter", { module: "email", action: "resolve-transporter", organizationId: orgId, metadata: { fromEmail: smtpConfig.user, host: smtpConfig.host } });
      return resolved;
    }

    logger.warn("No usable org SMTP config, falling back to env default", { module: "email", action: "resolve-transporter", organizationId: orgId, metadata: { configPresent: Boolean(smtpConfig) } });
  }

  if (defaultTransporter) {
    logger.debug("Using cached env-fallback transporter", { module: "email", action: "resolve-transporter", metadata: { fromEmail: defaultTransporter.fromEmail } });
    return defaultTransporter;
  }

  const fallbackFromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  if (!fallbackFromEmail) {
    throw new Error("Sender email not configured");
  }

  logger.info("Building env-fallback transporter", { module: "email", action: "resolve-transporter", metadata: { host: process.env.SMTP_HOST || "smtppro.zoho.com.au", fromEmail: fallbackFromEmail } });

  defaultTransporter = {
    transporter: nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtppro.zoho.com.au",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // Use SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates for development
      }
    }),
    fromEmail: fallbackFromEmail,
    source: "env-fallback",
    cachedAt: Date.now(),
  };

  return defaultTransporter;
}

/** @deprecated kept for any external callers — prefer getResolvedTransporter() so the From header stays in sync with the authenticated mailbox. */
export async function getTransporter(orgId?: string): Promise<nodemailer.Transporter> {
  return (await getResolvedTransporter(orgId)).transporter;
}

// Verify transporter configuration
export async function verifyEmailConfig(orgId?: string): Promise<boolean> {
  try {
    const transporter = await getTransporter(orgId);
    await transporter.verify();
    logger.info("Email server is ready to send messages", { module: "email", action: "verify-config", organizationId: orgId });
    return true;
  } catch (error) {
    logger.error("Email server verification failed", { module: "email", action: "verify-config", organizationId: orgId, error });
    return false;
  }
}

// Generic email sender
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  from?: string,
  attachments?: Array<{ filename: string; path?: string; content?: string | Buffer }>,
  cc?: string | string[],
  bcc?: string | string[],
  replyTo?: string,
  fromDisplayName?: string,
  orgId?: string
): Promise<{ success: boolean; error: string | null }> {
  const toList = Array.isArray(to) ? to.join(", ") : to;
  const recipientCount = Array.isArray(to) ? to.length : 1;
  try {
    logger.info("sendEmail called", { module: "email", action: "send", organizationId: orgId, metadata: { recipientCount, subject } });
    const { transporter, fromEmail: authenticatedFromEmail, source, cachedAt } = await getResolvedTransporter(orgId);
    // The "From" header must match whichever mailbox this transporter is
    // actually authenticated as — an org-specific SMTP account (Gmail,
    // Zoho, etc.) will reject or spam-bucket mail claiming to be from a
    // different address, even though sendMail() still returns a message ID
    // (see getResolvedTransporter's doc comment for why that's misleading).
    const fromEmail = from || authenticatedFromEmail;
    const fromName = fromDisplayName || process.env.FROM_EMAIL_NAME || "Excel Bees CRM";
    logger.debug("Using transporter", { module: "email", action: "send", organizationId: orgId, metadata: { source, cachedAgeSeconds: Math.round((Date.now() - cachedAt) / 1000), fromName, fromEmail } });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: replyTo || undefined,
      to: toList,
      cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : undefined,
      subject,
      html,
      attachments,
    });

    logger.info("Email accepted by SMTP server", { module: "email", action: "send", organizationId: orgId, metadata: { source, messageId: info.messageId, acceptedCount: info.accepted.length, rejectedCount: info.rejected.length } });
    return { success: true, error: null };
  } catch (error: any) {
    logger.error("Failed to send email", { module: "email", action: "send", organizationId: orgId, metadata: { recipientCount }, error });
    return { success: false, error: error.message };
  }
}

// Send invoice email
export async function sendInvoiceEmail(
  recipientEmail: string,
  invoiceNumber: string,
  companyName: string,
  total: number,
  dueDate: string
): Promise<{ success: boolean; error: string | null }> {
  const subject = `Invoice ${invoiceNumber} from Excel Bees`;
  const appUrl = getAppUrl();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: 600; color: #6b7280; }
        .detail-value { color: #111827; }
        .total { font-size: 24px; font-weight: bold; color: #f59e0b; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Invoice Received</h1>
          <p style="margin: 10px 0 0 0;">Thank you for your business!</p>
        </div>
        <div class="content">
          <p>Dear ${companyName},</p>
          <p>Please find your invoice details below:</p>
          
          <div class="invoice-details">
            <div class="detail-row">
              <span class="detail-label">Invoice Number:</span>
              <span class="detail-value">${invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Due Date:</span>
              <span class="detail-value">${dueDate}</span>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Total Amount:</span>
              <span class="total">$${total.toLocaleString()}</span>
            </div>
          </div>

          <p>Please ensure payment is made by the due date to avoid any late fees.</p>
          
          <center>
            <a href="${appUrl}/invoices" class="button">
              View Invoice
            </a>
          </center>

          <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br><strong>Excel Bees Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Excel Bees. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(recipientEmail, subject, html);
}

// Send welcome email
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<{ success: boolean; error: string | null }> {
  const subject = "Welcome to Excel Bees CRM!";
  const appUrl = getAppUrl();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #f59e0b; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 32px;">Welcome to Excel Bees! 🎉</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Your CRM journey starts here</p>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Welcome aboard! We're thrilled to have you join Excel Bees CRM.</p>
          
          <p><strong>Here's what you can do with your new CRM:</strong></p>
          
          <div class="feature">
            <strong>📊 Manage Leads & Contacts</strong><br>
            Keep track of all your prospects and customers in one place.
          </div>
          
          <div class="feature">
            <strong>💼 Track Deals</strong><br>
            Visualize your sales pipeline with our intuitive Kanban board.
          </div>
          
          <div class="feature">
            <strong>📁 Organize Projects</strong><br>
            Manage projects and tasks efficiently with progress tracking.
          </div>
          
          <div class="feature">
            <strong>💰 Create Invoices</strong><br>
            Generate professional invoices and track payments.
          </div>

          <center>
            <a href="${appUrl}/dashboard" class="button">
              Go to Dashboard
            </a>
          </center>

          <p style="margin-top: 30px;">Need help getting started? Check out our documentation or contact our support team.</p>
          
          <p>Happy CRM-ing!<br><strong>The Excel Bees Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Excel Bees. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(userEmail, subject, html);
}

// Send password reset email
export async function sendPasswordResetEmail(
  userEmail: string,
  resetLink: string
): Promise<{ success: boolean; error: string | null }> {
  const subject = "Reset Your Password - Excel Bees CRM";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password for your Excel Bees CRM account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <center>
            <a href="${resetLink}" class="button">
              Reset Password
            </a>
          </center>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </div>

          <p style="margin-top: 30px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #3b82f6;">${resetLink}</p>
          
          <p>Best regards,<br><strong>Excel Bees Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Excel Bees. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(userEmail, subject, html);
}

// Send task reminder email
export async function sendTaskReminderEmail(
  userEmail: string,
  userName: string,
  taskTitle: string,
  dueDate: string,
  taskId: string
): Promise<{ success: boolean; error: string | null }> {
  const subject = `Reminder: Task "${taskTitle}" is due soon`;
  const appUrl = getAppUrl();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .task-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 20px 0; }
        .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⏰ Task Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>This is a friendly reminder about your upcoming task:</p>
          
          <div class="task-card">
            <h2 style="margin: 0 0 10px 0; color: #8b5cf6;">${taskTitle}</h2>
            <p style="margin: 0; color: #6b7280;">Due: <strong>${dueDate}</strong></p>
          </div>

          <center>
            <a href="${appUrl}/tasks" class="button">
              View Task
            </a>
          </center>

          <p style="margin-top: 30px;">Stay on top of your tasks and keep your projects moving forward!</p>
          
          <p>Best regards,<br><strong>Excel Bees Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Excel Bees. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(userEmail, subject, html);
}

// ============================================================================
// AUTHENTICATION EMAILS (Admin-Only User Management)
// ============================================================================

/**
 * Send welcome email to newly created user with temporary password
 */
export async function sendAdminCreatedUserEmail(
  data: {
    email: string;
    userName: string;
    tempPassword: string;
    role: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;
  
  const template = getWelcomeEmailTemplate({
    userName: data.userName,
    email: data.email,
    tempPassword: data.tempPassword,
    role: data.role,
    loginUrl,
  });

  return sendEmail(data.email, template.subject, template.html);
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedConfirmation(
  data: {
    email: string;
    userName: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;
  
  const template = getPasswordChangedEmailTemplate({
    userName: data.userName,
    loginUrl,
  });

  return sendEmail(data.email, template.subject, template.html);
}

/**
 * Send password reset email with new temporary password (Admin reset)
 */
export async function sendAdminPasswordResetEmail(
  data: {
    email: string;
    userName: string;
    tempPassword: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  const appUrl = getAppUrl();
  const loginUrl = `${appUrl}/login`;
  
  const template = getPasswordResetEmailTemplate({
    userName: data.userName,
    tempPassword: data.tempPassword,
    loginUrl,
  });

  return sendEmail(data.email, template.subject, template.html);
}
