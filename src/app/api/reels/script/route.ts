/**
 * Step3: Grok 대본 생성 API
 * POST /api/reels/script
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { generateScriptsWithGrok } from '@/lib/reels/grok';
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

    const { projectId, chosenConcept } = await request.json();

    if (!projectId || !chosenConcept) {
      return NextResponse.json(
        { success: false, error: 'projectId와 chosenConcept가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 소유권 확인 및 데이터 가져오기
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

    // 포인트 차감 (Step 3)
    const pointsResult = await deductReelsPoints(user.uid, projectId, 3);
    if (!pointsResult.success) {
      return NextResponse.json(
        { success: false, error: pointsResult.error },
        { status: 400 }
      );
    }

    try {
      // Grok로 대본 생성
      let videoScripts = await generateScriptsWithGrok({
        concept: chosenConcept,
        uploadedImages: projectData.uploadedImages || [],
        refinedPrompt: projectData.refinedPrompt || '',
      });

      // 모든 대본 자동 승인
      videoScripts = videoScripts.map((script: any) => ({
        ...script,
        approved: true,
      }));

      // 프로젝트 업데이트 (대본 자동 승인)
      await db.collection('reelsProjects').doc(projectId).update({
        chosenConcept,
        videoScripts,
        currentStep: 4,
        stepResults: {
          ...projectData.stepResults,
          step3: {
            videoScripts,
            chosenConcept,
            pointsUsed: pointsResult.pointsDeducted,
            completedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        data: {
          videoScripts,
          pointsDeducted: pointsResult.pointsDeducted,
          newBalance: pointsResult.newBalance,
        },
      });
    } catch (error: any) {
      await refundReelsPoints(user.uid, projectId, 3);
      throw error;
    }
  } catch (error: any) {
    console.error('대본 생성 오류:', error);
    const errorMessage = error?.message || error?.toString() || '알 수 없는 오류';
    console.error('상세 에러:', errorMessage);
    return NextResponse.json(
      { success: false, error: `대본 생성에 실패했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}

