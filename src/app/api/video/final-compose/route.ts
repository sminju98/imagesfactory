/**
 * Step 7: 최종 비디오 합성 API (FFmpeg)
 * POST /api/video/final-compose
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { FinalComposeRequest, FinalComposeResponse } from '@/types/project.types';
import { validateProjectState, getProject, markProjectDone, markProjectFailed, updateProjectStatus } from '@/lib/project/project-state-manager';
import { composeFinalVideo } from '@/lib/project/final-video-composer';

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

    const body: FinalComposeRequest = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인 (Step 7)
    const validation = await validateProjectState(projectId, 7);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 프로젝트 데이터 조회
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 상태 업데이트: 합성 중
    await updateProjectStatus(projectId, 'composing', 7);

    // 비디오 클립, TTS 오디오, 자막 준비
    const videoClips = project.videoClips
      .filter(v => v.status === 'completed' && v.videoUrl)
      .map(v => v.videoUrl!);

    const ttsAudios = project.ttsAudios
      .filter(t => t.status === 'completed' && t.audioUrl)
      .map(t => ({
        sceneId: t.sceneId,
        audioUrl: t.audioUrl!,
        duration: t.duration,
      }));

    const subtitles = project.subtitlesFinal;

    if (videoClips.length === 0) {
      await markProjectFailed(projectId, '완료된 비디오 클립이 없습니다.');
      return NextResponse.json(
        { success: false, error: '완료된 비디오 클립이 없습니다.' },
        { status: 400 }
      );
    }

    // 최종 비디오 합성
    const result = await composeFinalVideo({
      projectId,
      videoClips,
      ttsAudios,
      subtitles,
      language: project.language,
    });

    if (!result.success || !result.finalVideoUrl) {
      await markProjectFailed(projectId, result.error || '비디오 합성 실패');
      return NextResponse.json<FinalComposeResponse>(
        { success: false, error: result.error || '비디오 합성 실패' },
        { status: 500 }
      );
    }

    // 프로젝트 완료 처리
    const totalPointsUsed = project.pointsUsed || 335; // 기본값
    await markProjectDone(projectId, result.finalVideoUrl, totalPointsUsed);

    return NextResponse.json<FinalComposeResponse>({
      success: true,
      finalVideoUrl: result.finalVideoUrl,
    });
  } catch (error: any) {
    console.error('비디오 합성 오류:', error);
    return NextResponse.json<FinalComposeResponse>(
      { success: false, error: error.message || '비디오 합성 실패' },
      { status: 500 }
    );
  }
}
