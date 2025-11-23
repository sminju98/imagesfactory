// Gmail SMTP를 이용한 이메일 발송
import nodemailer from 'nodemailer';

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
 * 이미지 생성 완료 이메일 템플릿
 */
export function getGenerationCompleteEmailHTML(data: {
  displayName: string;
  totalImages: number;
  prompt: string;
  downloadUrl: string;
  imageUrls?: string[];
  zipUrl?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>이미지 생성 완료</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Pretendard', -apple-system, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">🎉 이미지 생성 완료!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #111827;">
                안녕하세요, <strong>${data.displayName}</strong>님!
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #4B5563; line-height: 1.6;">
                요청하신 이미지 <strong>${data.totalImages}장</strong>이 성공적으로 생성되었습니다.
              </p>
              
              <!-- Stats Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">프롬프트:</p>
                    <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 500;">${data.prompt}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Image Links -->
              ${data.imageUrls && data.imageUrls.length > 0 ? `
              <div style="margin: 30px 0;">
                <p style="margin: 0 0 15px 0; font-size: 16px; color: #111827; font-weight: bold;">
                  🖼️ 생성된 이미지 링크
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 12px; padding: 20px;">
                  ${data.imageUrls.map((url, index) => `
                  <tr>
                    <td style="padding: 8px 0;">
                      <a href="${url}" style="color: #6366F1; text-decoration: none; font-size: 14px; word-break: break-all;" target="_blank">
                        📷 이미지 ${index + 1}: ${url.split('/').pop()?.substring(0, 30)}...
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
                      📥 결과 페이지 보기
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; font-size: 14px; color: #6B7280; line-height: 1.6;">
                💡 이미지 링크는 30일간 유효합니다.<br>
                웹사이트에서도 언제든지 확인하실 수 있습니다.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; font-size: 16px; color: #111827; font-weight: bold;">imagesfactory</p>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #6B7280;">by 엠제이스튜디오</p>
              <p style="margin: 0 0 15px 0; font-size: 12px; color: #9CA3AF;">
                서울특별시 강남구 봉은사로30길 68, 6층-S42호
              </p>
              <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                © 2025 엠제이스튜디오. All rights reserved.
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
 * 회원가입 환영 이메일
 */
export function getWelcomeEmailHTML(data: {
  displayName: string;
  points: number;
}) {
  return `
<!DOCTYPE html>
<html lang="ko">
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
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">🎉 환영합니다!</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #111827;">
                <strong>${data.displayName}</strong>님, imagesfactory에 오신 것을 환영합니다!
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #4B5563; line-height: 1.6;">
                가입 축하 보너스로 <strong style="color: #6366F1;">${data.points.toLocaleString()} 포인트</strong>를 드렸습니다! 🎁<br>
                지금 바로 약 ${Math.floor(data.points / 100)}장의 이미지를 무료로 생성해보세요.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://imagesfactory.com" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: bold;">
                      🚀 지금 시작하기
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px 0; font-size: 16px; color: #111827; font-weight: bold;">imagesfactory</p>
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #6B7280;">by 엠제이스튜디오</p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">문의: 010-4882-9820 | support@imagesfactory.com</p>
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

