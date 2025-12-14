/**
 * Step 4: 비디오 선택 API
 * POST /api/video/select
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { SelectVideoRequest } from '@/types/project.types';
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

    const body: SelectVideoRequest = await request.json();
    const { projectId, selectedVideoClips } = body;

    if (!projectId || !selectedVideoClips || selectedVideoClips.length === 0) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID와 선택된 비디오가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인
    const validation = await validateProjectState(projectId, 4);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 선택된 비디오 저장
    await updateProject(projectId, {
      selectedVideoClips,
      currentStep: 4,
    });

    return NextResponse.json({
      success: true,
      message: '비디오가 선택되었습니다.',
    });
  } catch (error: any) {
    console.error('비디오 선택 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '비디오 선택 실패' },
      { status: 500 }
    );
  }
}
