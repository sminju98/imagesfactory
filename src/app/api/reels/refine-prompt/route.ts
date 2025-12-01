/**
 * Step0: GPT 프롬프트 교정 API
 * POST /api/reels/refine-prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { refinePromptWithGPT } from '@/lib/reels/gpt';
import { deductReelsPoints, refundReelsPoints } from '@/lib/reels/points';

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
    let user;
    try {
      const decodedToken = await auth.verifyIdToken(token);
      user = decodedToken;
    } catch {
      return NextResponse.json(
        { success: false, error: '인증 토큰이 유효하지 않습니다.' },
        { status: 401 }
      );
    }

    const { projectId, prompt } = await request.json();

    if (!projectId || !prompt) {
      return NextResponse.json(
        { success: false, error: 'projectId와 prompt가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 소유권 확인
    const projectDoc = await db.collection('reelsProjects').doc(projectId).get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();
    if (projectData?.userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 포인트 차감 (Step 0)
    const pointsResult = await deductReelsPoints(user.uid, projectId, 0);
    if (!pointsResult.success) {
      return NextResponse.json(
        { success: false, error: pointsResult.error },
        { status: 400 }
      );
    }

    try {
      // GPT로 프롬프트 교정
      const result = await refinePromptWithGPT(prompt);

      // 프로젝트 업데이트
      await db.collection('reelsProjects').doc(projectId).update({
        refinedPrompt: result.refinedPrompt,
        currentStep: 1,
        stepResults: {
          step0: {
            refinedPrompt: result.refinedPrompt,
            improvements: result.improvements,
            pointsUsed: pointsResult.pointsDeducted,
            completedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        data: {
          refinedPrompt: result.refinedPrompt,
          improvements: result.improvements,
          pointsDeducted: pointsResult.pointsDeducted,
          newBalance: pointsResult.newBalance,
        },
      });
    } catch (error: any) {
      // 실패 시 포인트 환불
      await refundReelsPoints(user.uid, projectId, 0);
      throw error;
    }
  } catch (error: any) {
    console.error('프롬프트 교정 오류:', error);
    return NextResponse.json(
      { success: false, error: '프롬프트 교정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

