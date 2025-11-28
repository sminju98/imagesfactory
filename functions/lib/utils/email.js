"use strict";
/**
 * 이메일 발송 유틸리티 (Google SMTP)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.getGenerationCompleteEmailHTML = getGenerationCompleteEmailHTML;
exports.getGenerationFailedEmailHTML = getGenerationFailedEmailHTML;
const nodemailer = __importStar(require("nodemailer"));
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
/**
 * 이메일 발송
 */
async function sendEmail({ to, subject, html }) {
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
    }
    catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error);
        throw error;
    }
}
/**
 * 이미지 생성 완료 이메일 HTML
 */
function getGenerationCompleteEmailHTML({ displayName, totalImages, successImages, failedImages, prompt, resultPageUrl, zipUrl, }) {
    const failedHtml = failedImages > 0
        ? `<p style="color: #f59e0b; font-weight: bold;">⚠️ ${failedImages}장은 생성에 실패하여 포인트가 환불되었습니다.</p>`
        : '';
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>이미지 생성 완료</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #6366f1; margin-bottom: 24px;">🎨 이미지 생성 완료!</h1>
        
        <p style="color: #374151; font-size: 16px;">안녕하세요, <strong>${displayName}</strong>님!</p>
        
        <p style="color: #374151; font-size: 16px;">요청하신 이미지 중 <strong>${successImages}장</strong>이 성공적으로 생성되었습니다.</p>
        
        ${failedHtml}
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">프롬프트:</p>
          <p style="color: #374151; font-size: 14px; margin: 8px 0 0 0;">${prompt.substring(0, 200)}${prompt.length > 200 ? '...' : ''}</p>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          ${zipUrl ? `<a href="${zipUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 8px;">
            📥 ZIP 다운로드
          </a>` : ''}
          <a href="${resultPageUrl}" style="display: inline-block; background: ${zipUrl ? '#374151' : '#6366f1'}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            🖼️ 결과 보기
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          이 메일은 ImageFactory에서 발송되었습니다.
        </p>
      </div>
    </body>
    </html>
  `;
}
/**
 * 이미지 생성 실패 이메일 HTML
 */
function getGenerationFailedEmailHTML({ displayName, prompt, reason, refundedPoints, }) {
    const refundHtml = refundedPoints && refundedPoints > 0
        ? `<p style="color: #22c55e; font-weight: bold;">💰 ${refundedPoints} 포인트가 자동 환불되었습니다.</p>`
        : '';
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>이미지 생성 실패</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #ef4444; margin-bottom: 24px;">😢 이미지 생성 실패</h1>
        
        <p style="color: #374151; font-size: 16px;">안녕하세요, <strong>${displayName}</strong>님!</p>
        
        <p style="color: #374151; font-size: 16px;">죄송합니다. 요청하신 이미지 생성에 실패하였습니다.</p>
        
        ${refundHtml}
        
        <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #991b1b; font-size: 14px; margin: 0;">실패 사유:</p>
          <p style="color: #374151; font-size: 14px; margin: 8px 0 0 0;">${reason}</p>
        </div>
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">프롬프트:</p>
          <p style="color: #374151; font-size: 14px; margin: 8px 0 0 0;">${prompt.substring(0, 200)}${prompt.length > 200 ? '...' : ''}</p>
        </div>
        
        <p style="color: #374151; font-size: 14px;">
          문제가 지속되면 고객센터로 문의해 주세요.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          이 메일은 ImageFactory에서 발송되었습니다.
        </p>
      </div>
    </body>
    </html>
  `;
}
//# sourceMappingURL=email.js.map