/**
 * Step4: Veo3 영상 생성 API
 * POST /api/reels/generate-video
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { generateVideoWithVeo3 } from '@/lib/reels/veo3';
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

    const { projectId, videoIndex, videoScript } = await request.json();

    if (!projectId || videoIndex === undefined || !videoScript) {
      return NextResponse.json(
        { success: false, error: 'projectId, videoIndex, videoScript가 필요합니다.' },
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

    // 샷들을 하나의 프롬프트로 결합
    const combinedPrompt = videoScript.shots
      .map((shot: any) => shot.visualPrompt)
      .join('. Then ');

    // 참조 이미지 추출
    const referenceImages = videoScript.shots
      .filter((shot: any) => shot.useUploadedImage)
      .map((shot: any) => {
        const uploadedImage = projectData.uploadedImages?.find(
          (img: any) => img.id === shot.useUploadedImage
        );
        return uploadedImage?.url;
      })
      .filter(Boolean);

    // 포인트 차감 (Step 4 - 영상 1개당)
    const pointsResult = await deductReelsPoints(user.uid, projectId, 4, 1);
    if (!pointsResult.success) {
      return NextResponse.json(
        { success: false, error: pointsResult.error },
        { status: 400 }
      );
    }

    try {
      // Veo3로 영상 생성 시작
      const { operationId } = await generateVideoWithVeo3({
        prompt: combinedPrompt,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        aspectRatio: '9:16', // 릴스 세로 비율
        duration: 8,
      });

      // 비디오 클립 상태 업데이트
      const videoClips = projectData.videoClips || [];
      // 배열이 충분히 크지 않으면 확장
      while (videoClips.length <= videoIndex) {
        videoClips.push(null);
      }
      videoClips[videoIndex] = {
        videoIndex,
        url: '',
        thumbnailUrl: '',
        duration: 8,
        status: 'processing',
        operationId, // 작업 ID 저장
        pointsUsed: pointsResult.pointsDeducted,
      };

      await db.collection('reelsProjects').doc(projectId).update({
        videoClips,
        stepResults: {
          ...projectData.stepResults,
          [`step4_video${videoIndex}`]: {
            operationId,
            pointsUsed: pointsResult.pointsDeducted,
            startedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        data: {
          operationId,
          videoIndex,
          pointsDeducted: pointsResult.pointsDeducted,
          newBalance: pointsResult.newBalance,
        },
      });
    } catch (error: any) {
      await refundReelsPoints(user.uid, projectId, 4, 1);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        operationId,
        videoIndex,
      },
    });
  } catch (error: any) {
    console.error('영상 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '영상 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

