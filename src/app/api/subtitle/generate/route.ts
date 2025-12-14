/**
 * Step 6: 자막 생성 API
 * POST /api/subtitle/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { GenerateSubtitleRequest, GenerateSubtitleResponse } from '@/types/project.types';
import { validateProjectState, getProject } from '@/lib/project/project-state-manager';
import { generateSmartSubtitles, convertToSRT, convertToASS } from '@/lib/project/subtitle-engine';
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

    const body: GenerateSubtitleRequest = await request.json();
    const { projectId, sceneId, narration, audioDuration } = body;

    if (!projectId || !sceneId || !narration) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID, 씬 ID, 내레이션이 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인 (Step 6)
    const validation = await validateProjectState(projectId, 6);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 프로젝트 언어, TTS 오디오 URL, 자막 스타일 확인
    const project = await getProject(projectId);
    const language = project?.language || 'ko';
    
    // 해당 씬의 TTS 오디오 URL 가져오기 (Whisper용)
    const ttsAudio = project?.ttsAudios?.find((t: any) => t.sceneId === sceneId);
    const audioUrl = ttsAudio?.audioUrl;

    // GPT가 생성한 자막 스타일 가져오기
    const subtitleStyle = project?.subtitleStyle;
    if (subtitleStyle) {
      console.log(`✅ 자막 스타일 적용: ${subtitleStyle.styleName} (${subtitleStyle.mood})`);
    }

    // 스마트 자막 생성 (Whisper 우선, GPT 폴백)
    const subtitleData = await generateSmartSubtitles({
      sceneId,
      narration,
      audioUrl,
      audioDuration: audioDuration || ttsAudio?.duration || 8,
      language,
    });

    // SRT 형식으로 변환
    const srtContent = convertToSRT(subtitleData);
    
    // ASS 형식으로 변환 (GPT가 생성한 스타일 적용)
    const assContent = convertToASS(subtitleData, subtitleStyle || undefined);

    // 자막 저장
    const projectRef = db.collection('aiContentProjects').doc(projectId);
    const projectDoc = await projectRef.get();
    const projectData = projectDoc.data();

    const existingSubtitles = projectData?.subtitles || [];
    const subtitleIndex = existingSubtitles.findIndex((s: any) => s.sceneId === sceneId);

    const newSubtitle = {
      sceneId,
      entries: subtitleData.entries,
      srtContent,
      assContent,
      totalDuration: subtitleData.totalDuration,
    };

    if (subtitleIndex >= 0) {
      existingSubtitles[subtitleIndex] = newSubtitle;
    } else {
      existingSubtitles.push(newSubtitle);
    }

    await projectRef.update({
      subtitles: existingSubtitles,
      status: 'subtitle',
      currentStep: 6,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<GenerateSubtitleResponse>({
      success: true,
      subtitles: newSubtitle,
      srtContent,
    });
  } catch (error: any) {
    console.error('자막 생성 오류:', error);
    return NextResponse.json<GenerateSubtitleResponse>(
      { success: false, error: error.message || '자막 생성 실패' },
      { status: 500 }
    );
  }
}
