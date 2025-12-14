/**
 * Step 2: 프롬프트 교정 API (GPT-5.1)
 * POST /api/prompt/correct
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { CorrectPromptRequest, CorrectPromptResponse } from '@/types/project.types';
import { validateProjectState, updateProject, getProject } from '@/lib/project/project-state-manager';
import { correctPromptWithGPT } from '@/lib/project/gpt-prompt-corrector';

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

    const body: CorrectPromptRequest = await request.json();
    const { projectId, rawPrompt } = body;

    if (!projectId || !rawPrompt) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID와 프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인 (Step 2)
    const validation = await validateProjectState(projectId, 2);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 프로젝트 언어 확인
    const project = await getProject(projectId);
    const language = project?.language || 'ko';

    // GPT로 프롬프트 교정
    const result = await correctPromptWithGPT(rawPrompt, language);

    // 교정된 프롬프트 저장
    await updateProject(projectId, {
      correctedPrompt: result.correctedPrompt,
      status: 'prompt',
      currentStep: 2,
    });

    return NextResponse.json<CorrectPromptResponse>({
      success: true,
      correctedPrompt: result.correctedPrompt,
    });
  } catch (error: any) {
    console.error('프롬프트 교정 오류:', error);
    return NextResponse.json<CorrectPromptResponse>(
      { success: false, error: error.message || '프롬프트 교정 실패' },
      { status: 500 }
    );
  }
}
