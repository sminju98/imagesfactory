/**
 * 이메일 발송 유틸리티
 */

import * as nodemailer from 'nodemailer';

// SendGrid SMTP 트랜스포터
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
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
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️ SENDGRID_API_KEY is not set. Skipping email sending.');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@imagefactory.co.kr',
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

interface GenerationCompleteEmailParams {
  displayName: string;
  totalImages: number;
  successImages: number;
  failedImages: number;
  prompt: string;
  resultPageUrl: string;
  imageUrls: string[];
  zipUrl?: string;
}

/**
 * 이미지 생성 완료 이메일 HTML 생성
 */
export function getGenerationCompleteEmailHTML({
  displayName,
  totalImages,
  successImages,
  failedImages,
  prompt,
  resultPageUrl,
  imageUrls,
  zipUrl,
}: GenerationCompleteEmailParams): string {
  // 미리보기 이미지 (최대 6개)
  const previewImagesHtml = imageUrls.slice(0, 6).map(url => `
    <img 
      src="${url}" 
      alt="Generated Image" 
      style="width: 120px; height: 120px; object-fit: cover; margin: 4px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
    >
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎨 ImageFactory</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">이미지 생성 완료!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
            안녕하세요, <strong>${displayName}</strong>님!
          </p>
          
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
            요청하신 이미지 생성이 완료되었습니다.
          </p>
          
          <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">프롬프트</p>
            <p style="margin: 0; font-size: 14px; color: #333; font-style: italic;">"${prompt}"</p>
          </div>
          
          <div style="display: flex; gap: 16px; margin: 0 0 20px 0;">
            <div style="flex: 1; background: #EEF2FF; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #6366F1;">${successImages}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">생성 완료</p>
            </div>
            ${failedImages > 0 ? `
            <div style="flex: 1; background: #FEF2F2; border-radius: 8px; padding: 16px; text-align: center;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #EF4444;">${failedImages}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">실패 (환불됨)</p>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 0 0 20px 0;">
            ${previewImagesHtml}
            ${imageUrls.length > 6 ? `<p style="color: #666; font-size: 12px; margin: 8px 0 0 0;">외 ${imageUrls.length - 6}장...</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a 
              href="${resultPageUrl}" 
              style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;"
            >
              결과 페이지에서 보기
            </a>
          </div>
          
          ${zipUrl ? `
          <div style="text-align: center; margin: 16px 0;">
            <a 
              href="${zipUrl}" 
              style="display: inline-block; background: #F3F4F6; color: #374151; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;"
            >
              📦 ZIP 파일 다운로드
            </a>
          </div>
          ` : ''}
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 0;">
            이 메일은 ImageFactory에서 발송되었습니다.<br>
            문의: support@imagefactory.co.kr
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 이미지 생성 실패 이메일 HTML 생성
 */
export function getGenerationFailedEmailHTML({
  displayName,
  prompt,
  reason,
  refundedPoints,
}: {
  displayName: string;
  prompt: string;
  reason?: string;
  refundedPoints: number;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎨 ImageFactory</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">이미지 생성 실패 안내</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
            안녕하세요, <strong>${displayName}</strong>님.
          </p>
          
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
            죄송합니다. 요청하신 이미지 생성에 실패했습니다.
          </p>
          
          <div style="background: #FEF2F2; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #DC2626; font-weight: bold;">실패 사유</p>
            <p style="margin: 0; font-size: 14px; color: #333;">${reason || '서버 오류가 발생했습니다.'}</p>
          </div>
          
          <div style="background: #F0FDF4; border-radius: 8px; padding: 16px; margin: 0 0 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #16A34A; font-weight: bold;">💰 포인트 환불 완료</p>
            <p style="margin: 0; font-size: 14px; color: #333;">${refundedPoints.toLocaleString()} 포인트가 환불되었습니다.</p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin: 0 0 20px 0;">
            다시 시도해 주시거나, 문제가 지속되면 고객센터로 문의해 주세요.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 0;">
            이 메일은 ImageFactory에서 발송되었습니다.<br>
            문의: support@imagefactory.co.kr
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

