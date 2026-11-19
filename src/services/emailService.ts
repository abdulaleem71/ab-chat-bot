import nodemailer from 'nodemailer';
import { getDb } from '../db/index';
import { newId } from '../lib/ids';

export type TransactionalEmailType =
  | 'verification'
  | 'password_reset'
  | 'team_invite'
  | 'contact_sales'
  | 'newsletter'
  | 'billing_receipt'
  | 'data_export';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  token?: string;
  type: TransactionalEmailType;
}

export function isSmtpConfigured(): boolean {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  return Boolean(smtpHost && smtpUser && smtpPass && !smtpHost.startsWith('your_'));
}

export async function sendTransactionalEmail({ to, subject, html, text, token, type }: SendEmailParams): Promise<{ success: boolean; deliveredViaSmtp: boolean; previewLink?: string }> {
  const db = getDb();
  const now = new Date().toISOString();
  const emailId = newId('email');

  try {
    await db.execute({
      sql: `INSERT INTO transactional_emails (id, to_email, subject, body, token, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [emailId, to, subject, text || html, token || null, type, now],
    });
  } catch (err) {
    console.warn('Failed to store transactional email in db outbox:', err);
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim() || 'NomadsChat <support@nomadschat.com>';

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
      return { success: true, deliveredViaSmtp: true };
    } catch (err) {
      console.error('SMTP sendMail error, recorded in persistent outbox:', err);
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`[TRANSACTIONAL EMAIL OUTBOX - ${type.toUpperCase()}] To: ${to} | Subject: ${subject}`);
  }

  return {
    success: true,
    deliveredViaSmtp: false,
    previewLink: token && type === 'verification' ? `/api/auth/verify-email?token=${token}` : undefined,
  };
}
