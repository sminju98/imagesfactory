// Gmail SMTP를 이용한 이메일 발송
import nodemailer from 'nodemailer';
import { SupportedLanguage, getEmailTranslation } from './server-i18n';

// Gmail SMTP 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

/**
 * 이메일 발송
 */
export async function sendEmail(params: SendEmailParams) {
  const { to, subject, html, attachments } = params;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'imagesfactory <noreply@imagesfactory.com>',
      to,
      subject,
      html,
      attachments,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

/**
 * 이미지 생성 완료 이메일 템플릿 (다국어 지원)
 */
export function getGenerationCompleteEmailHTML(data: {
  displayName: string;
  totalImages: number;
  prompt: string;
  downloadUrl: string;
  imageUrls?: string[];
  zipUrl?: string;
  language?: SupportedLanguage;
}) {
  const lang = data.language || 'en';
  const t = getEmailTranslation(lang);
  
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.generation.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Pretendard', -apple-system, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">${t.generation.title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #111827;">
                ${t.generation.greeting(data.displayName)}
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #4B5563; line-height: 1.6;">
                ${t.generation.completedMessage(data.totalImages)}
              </p>
              
              <!-- Stats Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">${t.generation.promptLabel}</p>
                    <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 500;">${data.prompt}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Image Links -->
              ${data.imageUrls && data.imageUrls.length > 0 ? `
              <div style="margin: 30px 0;">
                <p style="margin: 0 0 15px 0; font-size: 16px; color: #111827; font-weight: bold;">
                  ${t.generation.imageLinksLabel}
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 12px; padding: 20px;">
                  ${data.imageUrls.slice(0, 10).map((url, index) => `
                  <tr>
                    <td style="padding: 8px 0;">
                      <a href="${url}" style="color: #6366F1; text-decoration: none; font-size: 14px; word-break: break-all;" target="_blank">
                        📷 Image ${index + 1}: ${url.split('/').pop()?.substring(0, 30)}...
                      </a>
                    </td>
                  </tr>
                  `).join('')}
                </table>
              </div>
              ` : ''}
              
              <!-- Download Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold;">
                      ${t.generation.viewResultButton}
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; font-size: 14px; color: #6B7280; line-height: 1.6;">
                ${t.generation.validityNote}<br>
                ${t.generation.checkWebsite}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; font-size: 16px; color: #111827; font-weight: bold;">ImageFactory</p>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #6B7280;">by ${t.common.companyName}</p>
              <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                ${t.common.footer}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 회원가입 환영 이메일 (다국어 지원)
 */
export function getWelcomeEmailHTML(data: {
  displayName: string;
  points: number;
  language?: SupportedLanguage;
}) {
  const lang = data.language || 'en';
  const t = getEmailTranslation(lang);
  const freeImageCount = Math.floor(data.points / 100);
  
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Pretendard', -apple-system, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">${t.welcome.title}</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #111827;">
                ${t.welcome.greeting(data.displayName)}
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #4B5563; line-height: 1.6;">
                ${t.welcome.bonusMessage(data.points)}<br>
                ${t.welcome.freeImages(freeImageCount)}
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://imagesfactory.com" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold;">
                      ${t.welcome.startButton}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; font-size: 16px; color: #111827; font-weight: bold;">ImageFactory</p>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #6B7280;">by ${t.common.companyName}</p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">support@imagesfactory.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
