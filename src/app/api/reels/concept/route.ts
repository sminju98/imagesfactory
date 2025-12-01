/**
 * Step2: GPT 콘셉트 기획 API
 * POST /api/reels/concept
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { generateConceptsWithGPT } from '@/lib/reels/gpt';
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

    const { projectId, refinedPrompt, selectedInsights, options } = await request.json();

    if (!projectId || !refinedPrompt) {
      return NextResponse.json(
        { success: false, error: 'projectId와 refinedPrompt가 필요합니다.' },
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

    // 포인트 차감 (Step 2)
    const pointsResult = await deductReelsPoints(user.uid, projectId, 2);
    if (!pointsResult.success) {
      return NextResponse.json(
        { success: false, error: pointsResult.error },
        { status: 400 }
      );
    }

    try {
      // GPT로 콘셉트 생성
      const concepts = await generateConceptsWithGPT(
        refinedPrompt,
        selectedInsights || [],
        options || { target: '', tone: '', purpose: '' }
      );

      // 프로젝트 업데이트
      const projectData = projectDoc.data();
      await db.collection('reelsProjects').doc(projectId).update({
        concepts,
        currentStep: 3,
        stepResults: {
          ...projectData?.stepResults,
          step2: {
            concepts,
            pointsUsed: pointsResult.pointsDeducted,
            completedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        data: {
          concepts,
          pointsDeducted: pointsResult.pointsDeducted,
          newBalance: pointsResult.newBalance,
        },
      });
    } catch (error: any) {
      await refundReelsPoints(user.uid, projectId, 2);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        concepts,
      },
    });
  } catch (error: any) {
    console.error('콘셉트 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '콘셉트 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

