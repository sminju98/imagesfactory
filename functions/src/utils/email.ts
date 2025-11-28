/**
 * 이메일 발송 유틸리티 (Google SMTP)
 */

import * as nodemailer from 'nodemailer';

// Google SMTP 설정
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * 이메일 발송
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️ GMAIL_USER or GMAIL_APP_PASSWORD is not set. Skipping email sending.');
    return;
  }

  try {
    await transporter.sendMail({
      from: `ImageFactory <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}
