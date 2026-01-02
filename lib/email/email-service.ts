import nodemailer from "nodemailer";
import {
  getWelcomeEmailTemplate,
  getPasswordChangedEmailTemplate,
  getPasswordResetEmailTemplate,
} from "./templates/auth-templates";

// Zoho AU SMTP Configuration
const transporter = nodemailer.createTransport({
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
});

// Verify transporter configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("✅ Email server is ready to send messages");
    return true;
  } catch (error) {
    console.error("❌ Email server verification failed:", error);
    return false;
  }
}

// Generic email sender
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  from?: string,
  attachments?: Array<{ filename: string; path?: string; content?: string | Buffer }>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const fromEmail = from || process.env.FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.FROM_EMAIL_NAME || "Excel Bees CRM";
    
    if (!fromEmail) {
      throw new Error("Sender email not configured");
    }

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      attachments,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, error: null };
  } catch (error: any) {
    console.error("❌ Failed to send email:", error.message);
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices" class="button">
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks" class="button">
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
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;
  
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
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;
  
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
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;
  
  const template = getPasswordResetEmailTemplate({
    userName: data.userName,
    tempPassword: data.tempPassword,
    loginUrl,
  });

  return sendEmail(data.email, template.subject, template.html);
}
