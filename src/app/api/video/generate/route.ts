/**
 * Step 4: 비디오 생성 API (Veo3)
 * POST /api/video/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { GenerateVideoRequest, GenerateVideoResponse } from '@/types/project.types';
import { validateProjectState } from '@/lib/project/project-state-manager';
import { generateVideoWithVeo3 } from '@/lib/project/veo-video-generator';
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

    const body: GenerateVideoRequest = await request.json();
    const { projectId, sceneId, prompt } = body;

    if (!projectId || !sceneId || !prompt) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID, 씬 ID, 프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인 (Step 4)
    const validation = await validateProjectState(projectId, 4);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Veo3로 비디오 생성 시작
    const result = await generateVideoWithVeo3(prompt);

    if (!result.success || !result.operationId) {
      return NextResponse.json<GenerateVideoResponse>(
        { success: false, error: result.error || '비디오 생성 요청 실패' },
        { status: 500 }
      );
    }

    // 비디오 클립 상태 업데이트
    const projectRef = db.collection('aiContentProjects').doc(projectId);
    const projectDoc = await projectRef.get();
    const project = projectDoc.data();

    const existingClips = project?.videoClips || [];
    const clipIndex = existingClips.findIndex((c: any) => c.sceneId === sceneId);

    const newClip = {
      sceneId,
      operationId: result.operationId,
      status: 'processing',
    };

    if (clipIndex >= 0) {
      existingClips[clipIndex] = newClip;
    } else {
      existingClips.push(newClip);
    }

    await projectRef.update({
      videoClips: existingClips,
      status: 'video',
      currentStep: 4,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<GenerateVideoResponse>({
      success: true,
      operationId: result.operationId,
    });
  } catch (error: any) {
    console.error('비디오 생성 오류:', error);
    return NextResponse.json<GenerateVideoResponse>(
      { success: false, error: error.message || '비디오 생성 실패' },
      { status: 500 }
    );
  }
}
