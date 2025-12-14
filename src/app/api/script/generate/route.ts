/**
 * Step 3: 스크립트 및 씬 생성 API (Grok)
 * POST /api/script/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { GenerateScriptRequest, GenerateScriptResponse } from '@/types/project.types';
import { validateProjectState } from '@/lib/project/project-state-manager';
import { generateScriptScenesWithGPT } from '@/lib/project/gpt-script-scene-generator';
import { v4 as uuidv4 } from 'uuid';

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

    const body: GenerateScriptRequest = await request.json();
    const { projectId, confirmedPrompt } = body;

    if (!projectId || !confirmedPrompt) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID와 확인된 프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인 (Step 3)
    const validation = await validateProjectState(projectId, 3);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // GPT-5.2를 사용하여 스크립트와 씬 생성 (제안서 권장: 한국어 문장 품질 최고)
    const result = await generateScriptScenesWithGPT(confirmedPrompt);

    // 씬에 ID 추가
    const scenes = result.scenes.map((scene, index) => ({
      id: uuidv4(),
      index: scene.index ?? index,
      prompt: scene.prompt,
      narration: scene.narration,
      duration: scene.duration || 8,
      approved: false,
    }));

    return NextResponse.json<GenerateScriptResponse>({
      success: true,
      script: result.script,
      scenes,
    });
  } catch (error: any) {
    console.error('스크립트 생성 오류:', error);
    return NextResponse.json<GenerateScriptResponse>(
      { success: false, error: error.message || '스크립트 생성 실패' },
      { status: 500 }
    );
  }
}
