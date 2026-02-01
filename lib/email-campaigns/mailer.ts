import nodemailer from "nodemailer";
import { BrandSettings } from "@/types/email-campaigns";

/**
 * Create nodemailer transporter from SMTP settings
 */
export function createTransporter(smtp: BrandSettings["smtp"]) {
  if (!smtp) {
    throw new Error("SMTP settings not configured");
  }

  return nodemailer.createTransporter({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.auth.user,
      pass: smtp.auth.pass,
    },
  });
}

/**
 * Send email using nodemailer
 */
export async function sendEmail(params: {
  from: { name: string; email: string };
  to: string;
  subject: string;
  html: string;
  plainText?: string;
  replyTo?: string;
  smtp: BrandSettings["smtp"];
}) {
  const transporter = createTransporter(params.smtp);

  const info = await transporter.sendMail({
    from: `"${params.from.name}" <${params.from.email}>`,
    to: params.to,
    subject: params.subject,
    text: params.plainText,
    html: params.html,
    replyTo: params.replyTo || params.from.email,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(smtp: BrandSettings["smtp"]): Promise<boolean> {
  try {
    const transporter = createTransporter(smtp);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("SMTP verification failed:", error);
    return false;
  }
}

/**
 * Add unsubscribe link to email HTML
 */
export function addUnsubscribeLink(html: string, campaignId: string, contactId: string): string {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?c=${campaignId}&ct=${contactId}`;
  
  const unsubscribeFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
      <p>
        Don't want to receive these emails? 
        <a href="${unsubscribeUrl}" style="color: #3b82f6; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  `;

  // Try to inject before closing body tag
  if (html.includes("</body>")) {
    return html.replace("</body>", `${unsubscribeFooter}</body>`);
  }

  // Otherwise append to end
  return html + unsubscribeFooter;
}
