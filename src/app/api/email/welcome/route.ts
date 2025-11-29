import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getWelcomeEmailHTML } from '@/lib/email';
import { detectLanguage, getEmailTranslation, SupportedLanguage } from '@/lib/server-i18n';

export async function POST(request: NextRequest) {
  try {
    const { email, displayName, points, language } = await request.json();

    if (!email || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 언어 감지 (요청 본문 > Accept-Language 헤더 > 기본값 영어)
    const acceptLanguage = request.headers.get('accept-language');
    const detectedLang: SupportedLanguage = language || detectLanguage(acceptLanguage);
    const t = getEmailTranslation(detectedLang);

    // 환영 이메일 발송
    await sendEmail({
      to: email,
      subject: t.welcome.subject,
      html: getWelcomeEmailHTML({
        displayName,
        points: points || 1000,
        language: detectedLang,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent',
    });
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
