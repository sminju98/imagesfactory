/**
 * Step 6: 자막 생성 API
 * POST /api/subtitle/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { GenerateSubtitleRequest, GenerateSubtitleResponse } from '@/types/project.types';
import { validateProjectState, getProject } from '@/lib/project/project-state-manager';
import { generateSubtitles, convertToSRT, convertToASS } from '@/lib/project/subtitle-engine';
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

    // 프로젝트 언어 확인
    const project = await getProject(projectId);
    const language = project?.language || 'ko';

    // 자막 생성 (TTS 길이 기반)
    const subtitleData = await generateSubtitles(narration, sceneId, {
      language,
      audioDuration: audioDuration || 8,
    });

    // SRT 및 ASS 형식으로 변환
    const srtContent = convertToSRT(subtitleData);
    const assContent = convertToASS(subtitleData);

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
