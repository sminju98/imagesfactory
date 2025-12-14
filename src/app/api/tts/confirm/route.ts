/**
 * Step 5: TTS 확인 API
 * POST /api/tts/confirm
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { ConfirmTTSRequest } from '@/types/project.types';
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

    const body: ConfirmTTSRequest = await request.json();
    const { projectId, ttsAudios } = body;

    if (!projectId || !ttsAudios || ttsAudios.length === 0) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID와 TTS 오디오가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인
    const validation = await validateProjectState(projectId, 5);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // TTS 오디오 확인 저장
    await updateProject(projectId, {
      ttsAudios,
      currentStep: 5,
    });

    return NextResponse.json({
      success: true,
      message: 'TTS 오디오가 확인되었습니다.',
    });
  } catch (error: any) {
    console.error('TTS 확인 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'TTS 확인 실패' },
      { status: 500 }
    );
  }
}
