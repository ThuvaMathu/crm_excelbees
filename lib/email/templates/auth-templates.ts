/**
 * Email template for welcoming new users created by admin
 */
export function getWelcomeEmailTemplate(data: {
  userName: string;
  email: string;
  tempPassword: string;
  role: string;
  loginUrl: string;
}) {
  return {
    subject: "Welcome to CRM - Your Account is Ready",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CRM</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CRM</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${data.userName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your account has been created by an administrator and is ready to use.
    </p>
    
    <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #667eea;">Login Credentials</h3>
      <p style="margin: 10px 0;"><strong>Email:</strong> ${data.email}</p>
      <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.tempPassword}</code></p>
      <p style="margin: 10px 0;"><strong>Your Role:</strong> ${data.role.charAt(0).toUpperCase() + data.role.slice(1)}</p>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ Important:</strong> You must change your password on first login for security reasons.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Login to Your Account
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you have any questions, please contact your administrator.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Welcome to CRM

Hi ${data.userName},

Your account has been created by an administrator and is ready to use.

Login Credentials:
Email: ${data.email}
Temporary Password: ${data.tempPassword}
Your Role: ${data.role.charAt(0).toUpperCase() + data.role.slice(1)}

IMPORTANT: You must change your password on first login for security reasons.

Login URL: ${data.loginUrl}

If you have any questions, please contact your administrator.
    `.trim(),
  };
}

/**
 * Email template for password change confirmation
 */
export function getPasswordChangedEmailTemplate(data: {
  userName: string;
  loginUrl: string;
}) {
  return {
    subject: "Password Changed Successfully",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Password Changed</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${data.userName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your password has been changed successfully.
    </p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ Security Notice:</strong> If you did not make this change, please contact your administrator immediately.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Login to Your Account
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Password Changed Successfully

Hi ${data.userName},

Your password has been changed successfully.

Security Notice: If you did not make this change, please contact your administrator immediately.

Login URL: ${data.loginUrl}
    `.trim(),
  };
}

/**
 * Email template for password reset by admin
 */
export function getPasswordResetEmailTemplate(data: {
  userName: string;
  tempPassword: string;
  loginUrl: string;
}) {
  return {
    subject: "Your Password Has Been Reset",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${data.userName}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your password has been reset by an administrator.
    </p>
    
    <div style="background: #f9fafb; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #f59e0b;">New Temporary Password</h3>
      <p style="margin: 10px 0;"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px;">${data.tempPassword}</code></p>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ Important:</strong> You must change this password on your next login for security reasons.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Login to Your Account
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you did not request this password reset, please contact your administrator immediately.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Your Password Has Been Reset

Hi ${data.userName},

Your password has been reset by an administrator.

New Temporary Password: ${data.tempPassword}

IMPORTANT: You must change this password on your next login for security reasons.

Login URL: ${data.loginUrl}

If you did not request this password reset, please contact your administrator immediately.
    `.trim(),
  };
}
