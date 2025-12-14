/**
 * Step 6: 자막 확인 API
 * POST /api/subtitle/confirm
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { ConfirmSubtitleRequest } from '@/types/project.types';
import { updateProject, validateProjectState } from '@/lib/project/project-state-manager';

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
    await auth.verifyIdToken(token);

    const body: ConfirmSubtitleRequest = await request.json();
    const { projectId, subtitlesFinal } = body;

    if (!projectId || !subtitlesFinal || subtitlesFinal.length === 0) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID와 자막이 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인
    const validation = await validateProjectState(projectId, 6);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 확인된 자막 저장
    await updateProject(projectId, {
      subtitlesFinal,
      currentStep: 6,
    });

    return NextResponse.json({
      success: true,
      message: '자막이 확인되었습니다.',
    });
  } catch (error: any) {
    console.error('자막 확인 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '자막 확인 실패' },
      { status: 500 }
    );
  }
}
