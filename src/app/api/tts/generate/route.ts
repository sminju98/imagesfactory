/**
 * Step 5: TTS 생성 API (OpenAI TTS)
 * POST /api/tts/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { GenerateTTSRequest, GenerateTTSResponse } from '@/types/project.types';
import { validateProjectState } from '@/lib/project/project-state-manager';
import { generateTTS, VoiceType } from '@/lib/project/tts-generator';
import { FieldValue } from 'firebase-admin/firestore';

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

    const body: GenerateTTSRequest = await request.json();
    const { projectId, sceneId, text, voice = 'nova' } = body;

    if (!projectId || !sceneId || !text) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID, 씬 ID, 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인 (Step 5)
    const validation = await validateProjectState(projectId, 5);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // TTS 생성
    const result = await generateTTS(text, voice as VoiceType);

    if (!result.success) {
      return NextResponse.json<GenerateTTSResponse>(
        { success: false, error: result.error || 'TTS 생성 실패' },
        { status: 500 }
      );
    }

    // TTS 오디오 상태 업데이트
    const projectRef = db.collection('aiContentProjects').doc(projectId);
    const projectDoc = await projectRef.get();
    const project = projectDoc.data();

    const existingAudios = project?.ttsAudios || [];
    const audioIndex = existingAudios.findIndex((a: any) => a.sceneId === sceneId);

    const newAudio = {
      sceneId,
      audioUrl: result.audioUrl,
      duration: result.duration,
      voice,
      text,
      status: 'completed',
    };

    if (audioIndex >= 0) {
      existingAudios[audioIndex] = newAudio;
    } else {
      existingAudios.push(newAudio);
    }

    await projectRef.update({
      ttsAudios: existingAudios,
      status: 'tts',
      currentStep: 5,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<GenerateTTSResponse>({
      success: true,
      audioUrl: result.audioUrl,
      duration: result.duration,
    });
  } catch (error: any) {
    console.error('TTS 생성 오류:', error);
    return NextResponse.json<GenerateTTSResponse>(
      { success: false, error: error.message || 'TTS 생성 실패' },
      { status: 500 }
    );
  }
}
