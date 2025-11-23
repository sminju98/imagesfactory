import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getWelcomeEmailHTML } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, displayName, points } = await request.json();

    if (!email || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 환영 이메일 발송
    await sendEmail({
      to: email,
      subject: '🎉 imagesfactory에 오신 것을 환영합니다!',
      html: getWelcomeEmailHTML({
        displayName,
        points: points || 1000,
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

