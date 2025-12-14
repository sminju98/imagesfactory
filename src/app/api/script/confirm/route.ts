/**
 * Step 3: 스크립트/씬 확인 API
 * POST /api/script/confirm
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { ConfirmScriptRequest } from '@/types/project.types';
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

    const body: ConfirmScriptRequest = await request.json();
    const { projectId, scriptFinal, scenesFinal } = body;

    if (!projectId || !scriptFinal || !scenesFinal || scenesFinal.length === 0) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID, 스크립트, 씬이 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 상태 확인
    const validation = await validateProjectState(projectId, 3);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 씬 승인 처리
    const approvedScenes = scenesFinal.map(scene => ({
      ...scene,
      approved: true,
    }));

    // 확인된 스크립트/씬 저장
    await updateProject(projectId, {
      scriptFinal,
      scenesFinal: approvedScenes,
      status: 'script',
      currentStep: 3,
    });

    return NextResponse.json({
      success: true,
      message: '스크립트와 씬이 확인되었습니다.',
    });
  } catch (error: any) {
    console.error('스크립트 확인 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '스크립트 확인 실패' },
      { status: 500 }
    );
  }
}
