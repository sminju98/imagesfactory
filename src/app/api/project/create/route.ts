/**
 * 프로젝트 생성 API
 * POST /api/project/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { createProject } from '@/lib/project/project-state-manager';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 요청 본문
    const body = await request.json().catch(() => ({}));
    const language = body.language || 'ko';

    // 프로젝트 생성
    const projectId = await createProject(userId, language);

    return NextResponse.json({
      success: true,
      projectId,
      message: '프로젝트가 생성되었습니다.',
    });
  } catch (error: any) {
    console.error('프로젝트 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '프로젝트 생성 실패' },
      { status: 500 }
    );
  }
}
