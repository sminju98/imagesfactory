/**
 * Step 2: 프롬프트 확인 API
 * POST /api/prompt/confirm
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { ConfirmPromptRequest } from '@/types/project.types';
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

    const body: ConfirmPromptRequest = await request.json();
    const { projectId, confirmedPrompt } = body;

    if (!projectId || !confirmedPrompt) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID와 확인된 프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인
    const validation = await validateProjectState(projectId, 2);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 확인된 프롬프트 저장
    await updateProject(projectId, {
      confirmedPrompt,
      currentStep: 2,
    });

    return NextResponse.json({
      success: true,
      message: '프롬프트가 확인되었습니다.',
    });
  } catch (error: any) {
    console.error('프롬프트 확인 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '프롬프트 확인 실패' },
      { status: 500 }
    );
  }
}
