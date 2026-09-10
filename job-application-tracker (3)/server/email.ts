import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
let lastTransporterConfig: string = '';

/**
 * Initializes or retrieves the cached Nodemailer SMTP transporter.
 */
export function getEmailTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const service = process.env.SMTP_SERVICE || (host.includes('gmail.com') ? 'gmail' : undefined);

  const configSignature = `${service || ''}:${host}:${port}:${user}:${secure}`;

  if (transporter && lastTransporterConfig === configSignature) {
    return transporter;
  }

  if (user && pass) {
    try {
      if (service === 'gmail') {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user,
            pass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 15000,
        });
      } else {
        transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 15000,
        });
      }

      lastTransporterConfig = configSignature;
      console.log(`[Email Service] Configured SMTP transporter for user: ${user} (${service || host}:${port})`);
      return transporter;
    } catch (err: any) {
      console.error('[Email Service] Failed to create Nodemailer transport:', err.message);
      return null;
    }
  }

  return null;
}

/**
 * Sends an OTP verification email to the user.
 * Tries direct HTTPS API (Resend) first if configured, then Nodemailer SMTP.
 */
export async function sendOtpEmail(
  toEmail: string,
  studentName: string,
  otp: string
): Promise<{ success: boolean; provider: string; error?: string; messageId?: string }> {
  const normalizedEmail = toEmail.trim().toLowerCase();

  // 1. Try Resend HTTP API (Fast HTTPS delivery without SMTP firewall constraints)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log(`[Email Service] Attempting delivery via Resend API to ${normalizedEmail}...`);
      const from = process.env.SMTP_FROM || 'Placement Tracker <onboarding@resend.dev>';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [normalizedEmail],
          subject: `${otp} is your Student Verification Code - Placement Tracker`,
          html: buildOtpHtml(studentName, otp),
        }),
      });

      const data = (await response.json()) as any;
      if (response.ok) {
        console.log(`[Email Service] Successfully sent OTP to ${normalizedEmail} via Resend. ID: ${data.id}`);
        return { success: true, provider: 'resend', messageId: data.id };
      } else {
        console.warn(`[Email Service] Resend API error (${response.status}):`, data);
      }
    } catch (err: any) {
      console.error('[Email Service] Resend delivery failed:', err.message);
    }
  }

  // 2. Try Nodemailer SMTP
  const mailTransporter = getEmailTransporter();
  if (mailTransporter) {
    try {
      console.log(`[Email Service] Sending OTP to ${normalizedEmail} via Nodemailer SMTP...`);
      const fromUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@placementtracker.edu';
      const fromAddress = process.env.SMTP_FROM || `"Placement Application Tracker" <${fromUser}>`;

      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to: normalizedEmail,
        subject: `${otp} is your Student Verification Code - Placement Tracker`,
        html: buildOtpHtml(studentName, otp),
        text: `Hello ${studentName || 'Student'},\n\nYour 6-digit verification code is: ${otp}\n\nThis code is valid for 10 minutes. Please do not share it with anyone.`,
      });

      console.log(`[Email Service] OTP successfully delivered to ${normalizedEmail}. Message ID: ${info.messageId}`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      console.error(`[Email Service] SMTP delivery failed for ${normalizedEmail}:`, err.message);
      return { success: false, provider: 'smtp', error: err.message };
    }
  }

  // 3. If no email provider credentials configured in environment:
  console.log(`\n======================================================`);
  console.log(`[EMAIL DISPATCH NOTICE] No SMTP or Resend credentials found in environment variables.`);
  console.log(`[EMAIL DISPATCH NOTICE] 📧 Target Student Email: ${normalizedEmail}`);
  console.log(`[EMAIL DISPATCH NOTICE] 🔑 Verification OTP Code: [ ${otp} ]`);
  console.log(`[EMAIL DISPATCH NOTICE] To send real emails, define SMTP_USER & SMTP_PASS or RESEND_API_KEY in settings.`);
  console.log(`======================================================\n`);

  return {
    success: false,
    provider: 'none',
    error: 'No email service credentials configured. Set SMTP_USER & SMTP_PASS or RESEND_API_KEY in environment.',
  };
}

/**
 * Sends a Password Reset OTP verification email to the user.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  studentName: string,
  otp: string
): Promise<{ success: boolean; provider: string; error?: string; messageId?: string }> {
  const normalizedEmail = toEmail.trim().toLowerCase();

  // 1. Try Resend HTTP API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log(`[Email Service] Attempting password reset email via Resend API to ${normalizedEmail}...`);
      const from = process.env.SMTP_FROM || 'Placement Tracker <onboarding@resend.dev>';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [normalizedEmail],
          subject: `${otp} is your Password Reset Code - Placement Tracker`,
          html: buildPasswordResetHtml(studentName, otp),
        }),
      });

      const data = (await response.json()) as any;
      if (response.ok) {
        console.log(`[Email Service] Password reset email delivered to ${normalizedEmail} via Resend. ID: ${data.id}`);
        return { success: true, provider: 'resend', messageId: data.id };
      } else {
        console.warn(`[Email Service] Resend API error for reset (${response.status}):`, data);
      }
    } catch (err: any) {
      console.error('[Email Service] Resend reset email failed:', err.message);
    }
  }

  // 2. Try Nodemailer SMTP
  const mailTransporter = getEmailTransporter();
  if (mailTransporter) {
    try {
      console.log(`[Email Service] Sending password reset email to ${normalizedEmail} via Nodemailer SMTP...`);
      const fromUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@placementtracker.edu';
      const fromAddress = process.env.SMTP_FROM || `"Placement Application Tracker" <${fromUser}>`;

      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to: normalizedEmail,
        subject: `${otp} is your Password Reset Code - Placement Tracker`,
        html: buildPasswordResetHtml(studentName, otp),
        text: `Hello ${studentName || 'Student'},\n\nWe received a request to reset your Placement Tracker password.\n\nYour 6-digit password reset code is: ${otp}\n\nThis code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email.`,
      });

      console.log(`[Email Service] Password reset OTP delivered to ${normalizedEmail}. Message ID: ${info.messageId}`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      console.error(`[Email Service] SMTP reset delivery failed for ${normalizedEmail}:`, err.message);
      return { success: false, provider: 'smtp', error: err.message };
    }
  }

  // 3. Fallback notice
  console.log(`\n======================================================`);
  console.log(`[EMAIL DISPATCH NOTICE] Password Reset Code Generated`);
  console.log(`[EMAIL DISPATCH NOTICE] 📧 Target Student Email: ${normalizedEmail}`);
  console.log(`[EMAIL DISPATCH NOTICE] 🔐 Password Reset OTP: [ ${otp} ]`);
  console.log(`[EMAIL DISPATCH NOTICE] Valid for 10 minutes.`);
  console.log(`======================================================\n`);

  return {
    success: false,
    provider: 'none',
    error: 'No email service credentials configured. Set SMTP_USER & SMTP_PASS or RESEND_API_KEY in environment.',
  };
}

function buildOtpHtml(studentName: string, otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .badge { display: inline-block; background: #18181b; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
        .title { font-size: 22px; font-weight: 700; color: #09090b; margin: 0 0 6px 0; }
        .subtitle { font-size: 13px; color: #71717a; margin: 0 0 24px 0; }
        .greeting { font-size: 14px; margin-bottom: 16px; color: #27272a; line-height: 1.6; }
        .otp-container { background: #fafafa; border: 2px dashed #d4d4d8; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #09090b; }
        .validity { font-size: 12px; color: #71717a; margin-top: 10px; }
        .footer { font-size: 11px; color: #a1a1aa; text-align: center; margin-top: 28px; border-top: 1px solid #f4f4f5; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">Placement Tracker</div>
        <h1 class="title">Verify Your Student Email</h1>
        <p class="subtitle">Placement Application Tracking Journal</p>
        <p class="greeting">Hello <strong>${studentName || 'Student'}</strong>,</p>
        <p class="greeting">Use the 6-digit authorization code below to verify your email address and activate your placement tracking journal:</p>
        
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
          <div class="validity">⏱️ Valid for 10 minutes • Do not share this code</div>
        </div>

        <p class="greeting">If you did not request this verification code, please ignore this email.</p>
        
        <div class="footer">
          © Placement Application Tracker • Campus Placement & Interview Tracking
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildPasswordResetHtml(studentName: string, otp: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .badge { display: inline-block; background: #dc2626; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
        .title { font-size: 22px; font-weight: 700; color: #09090b; margin: 0 0 6px 0; }
        .subtitle { font-size: 13px; color: #71717a; margin: 0 0 24px 0; }
        .greeting { font-size: 14px; margin-bottom: 16px; color: #27272a; line-height: 1.6; }
        .otp-container { background: #fef2f2; border: 2px dashed #f87171; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #991b1b; }
        .validity { font-size: 12px; color: #991b1b; margin-top: 10px; font-weight: 500; }
        .warning { font-size: 12px; color: #6b7280; background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0; line-height: 1.5; }
        .footer { font-size: 11px; color: #a1a1aa; text-align: center; margin-top: 28px; border-top: 1px solid #f4f4f5; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">Security Notice</div>
        <h1 class="title">Reset Your Password</h1>
        <p class="subtitle">Placement Application Tracking Journal</p>
        <p class="greeting">Hello <strong>${studentName || 'Student'}</strong>,</p>
        <p class="greeting">We received a request to reset the password for your Placement Application Tracker student account.</p>
        <p class="greeting">Use the 6-digit security code below to complete your password reset:</p>
        
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
          <div class="validity">⏱️ Valid for 10 minutes • Never share this code</div>
        </div>

        <div class="warning">
          <strong>Security Advisory:</strong> If you did not request a password reset, please ignore this message. Your account password remains unchanged.
        </div>
        
        <div class="footer">
          © Placement Application Tracker • Campus Placement & Career Tracking
        </div>
      </div>
    </body>
    </html>
  `;
}
