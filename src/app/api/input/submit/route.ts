/**
 * Step 1: 입력 저장 API
 * POST /api/input/submit
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { SubmitInputRequest, SubmitInputResponse } from '@/types/project.types';
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

    const body: SubmitInputRequest = await request.json();
    const { projectId, rawPrompt, referenceImageUrl, language } = body;

    if (!projectId || !rawPrompt) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID와 프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인 (Step 1)
    const validation = await validateProjectState(projectId, 1);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 입력 저장
    await updateProject(projectId, {
      rawPrompt,
      referenceImageUrl,
      language: language || 'ko',
      currentStep: 1,
    });

    return NextResponse.json<SubmitInputResponse>({
      success: true,
      projectId,
    });
  } catch (error: any) {
    console.error('입력 저장 오류:', error);
    return NextResponse.json<SubmitInputResponse>(
      { success: false, error: error.message || '입력 저장 실패' },
      { status: 500 }
    );
  }
}
