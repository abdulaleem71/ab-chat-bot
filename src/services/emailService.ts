import nodemailer from 'nodemailer';
import { getDb } from '../db/index';
import { newId } from '../lib/ids';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  token?: string;
  type: 'verification' | 'password_reset';
}

export async function sendTransactionalEmail({ to, subject, html, text, token, type }: SendEmailParams): Promise<{ success: boolean; previewLink?: string }> {
  const db = getDb();
  const now = new Date().toISOString();
  const emailId = newId('email');

  // Store in simulated/development transactional email outbox table
  try {
    await db.execute({
      sql: `INSERT INTO transactional_emails (id, to_email, subject, body, token, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [emailId, to, subject, text || html, token || null, type, now],
    });
  } catch (err) {
    console.warn('Failed to store transactional email in db outbox:', err);
  }

  // Console log for easy local development testing
  console.log('========================================');
  console.log(`[TRANSACTIONAL EMAIL - ${type.toUpperCase()}]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  if (token) {
    console.log(`Token: ${token}`);
  }
  console.log('========================================');

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'support@nomadschat.com';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject,
        text: text || html.replace(/<[^>]*>?/gm, ''),
        html,
      });
      return { success: true };
    } catch (err) {
      console.error('SMTP sendMail error, fallback to simulated outbox:', err);
    }
  }

  return {
    success: true,
    previewLink: token ? `/api/auth/verify-email?token=${token}` : undefined,
  };
}
