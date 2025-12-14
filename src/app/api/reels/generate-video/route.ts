/**
 * Step4: Veo3 영상 생성 API
 * POST /api/reels/generate-video
 * 
 * 두 가지 호출 방식 지원:
 * 1. videoScripts (배열) - 전체 대본을 받아서 순차 처리
 * 2. videoIndex + videoScript - 단일 영상 생성
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

    const { projectId, videoIndex, videoScript, videoScripts } = await request.json();

    // videoScripts 배열로 호출된 경우 - 전체 처리
    if (projectId && videoScripts && Array.isArray(videoScripts) && videoScripts.length > 0) {
      return await processAllVideos(projectId, videoScripts, user.uid);
    }

    // 단일 영상 생성 (기존 로직)
    if (!projectId || videoIndex === undefined || !videoScript) {
      return NextResponse.json(
        { success: false, error: 'projectId와 videoScripts 또는 (videoIndex, videoScript)가 필요합니다.' },
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
      // Google Veo로 영상 생성
      const result = await generateVideoWithVeo3({
        prompt: combinedPrompt,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        aspectRatio: '9:16', // 릴스 세로 비율
        duration: 6, // 6초 영상
      });

      if (result.status !== 'completed' || !result.videoUrl) {
        throw new Error(result.error || '영상 생성 실패');
      }

      // 비디오 클립 상태 업데이트
      const videoClips = projectData.videoClips || [];
      // 배열이 충분히 크지 않으면 확장
      while (videoClips.length <= videoIndex) {
        videoClips.push(null);
      }
      videoClips[videoIndex] = {
        videoIndex,
        url: result.videoUrl,
        thumbnailUrl: '',
        duration: 6, // 6초
        status: 'completed',
        operationId: result.operationId,
        pointsUsed: pointsResult.pointsDeducted,
      };

      await db.collection('reelsProjects').doc(projectId).update({
        videoClips,
        stepResults: {
          ...projectData.stepResults,
          [`step4_video${videoIndex}`]: {
            operationId: result.operationId,
            videoUrl: result.videoUrl,
            pointsUsed: pointsResult.pointsDeducted,
            completedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        data: {
          operationId: result.operationId,
          videoUrl: result.videoUrl,
          videoIndex,
          pointsDeducted: pointsResult.pointsDeducted,
          newBalance: pointsResult.newBalance,
        },
      });
    } catch (error: any) {
      await refundReelsPoints(user.uid, projectId, 4, 1);
      throw error;
    }
  } catch (error: any) {
    console.error('영상 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '영상 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 모든 영상을 순차적으로 생성 (백그라운드 처리)
 */
async function processAllVideos(projectId: string, videoScripts: any[], userId: string) {
  try {
    // 프로젝트 소유권 확인
    const projectDoc = await db.collection('reelsProjects').doc(projectId).get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();
    if (projectData?.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 승인된 스크립트만 필터링
    const approvedScripts = videoScripts.filter((script: any) => script.approved);
    if (approvedScripts.length === 0) {
      return NextResponse.json(
        { success: false, error: '승인된 대본이 없습니다. 대본을 승인해주세요.' },
        { status: 400 }
      );
    }

    // 즉시 응답 반환 (백그라운드에서 처리)
    const response = NextResponse.json({
      success: true,
      message: `${approvedScripts.length}개 영상 생성을 시작합니다.`,
      data: {
        totalVideos: approvedScripts.length,
        status: 'processing',
      },
    });

    // 프로젝트 상태 업데이트 (처리 중)
    await db.collection('reelsProjects').doc(projectId).update({
      status: 'processing',
      'stepStatus.step4': 'processing',
      videoClips: approvedScripts.map((_, index) => ({
        videoIndex: index,
        url: '',
        thumbnailUrl: '',
        duration: 6,
        status: 'pending',
      })),
      updatedAt: new Date(),
    });

    // 백그라운드에서 영상 생성 (비동기)
    processVideosInBackground(projectId, approvedScripts, projectData, userId).catch((error) => {
      console.error('백그라운드 영상 생성 오류:', error);
    });

    return response;
  } catch (error: any) {
    console.error('영상 생성 시작 오류:', error);
    return NextResponse.json(
      { success: false, error: '영상 생성 시작에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 백그라운드에서 영상을 병렬로 생성
 * - 완료되는 순서대로 실시간 업데이트
 * - 5분 타임아웃 적용
 */
async function processVideosInBackground(
  projectId: string,
  approvedScripts: any[],
  projectData: any,
  userId: string
) {
  console.log(`🚀 ${approvedScripts.length}개 영상 병렬 생성 시작...`);

  // 모든 영상에 대해 포인트 먼저 차감
  const totalPoints = approvedScripts.length;
  const pointsResult = await deductReelsPoints(userId, projectId, 4, totalPoints);
  
  if (!pointsResult.success) {
    console.error('포인트 차감 실패:', pointsResult.error);
    await db.collection('reelsProjects').doc(projectId).update({
      status: 'failed',
      'stepStatus.step4': 'failed',
      errorMessage: pointsResult.error,
      updatedAt: new Date(),
    });
    return;
  }

  const totalPointsUsed = pointsResult.pointsDeducted || 0;
  let completedCount = 0;
  let failedCount = 0;

  // 5분 타임아웃 래퍼
  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, index: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`영상 ${index + 1} 생성 시간 초과 (5분)`)), timeoutMs)
      )
    ]);
  };

  // 개별 영상 생성 및 실시간 업데이트
  const generateAndUpdate = async (script: any, index: number) => {
    try {
      // 샷들을 하나의 프롬프트로 결합
      const combinedPrompt = script.shots
        ?.map((shot: any) => shot.visualPrompt)
        ?.join('. Then ') || script.narration;

      // 참조 이미지 추출
      const referenceImages = script.shots
        ?.filter((shot: any) => shot.useUploadedImage)
        ?.map((shot: any) => {
          const uploadedImage = projectData.uploadedImages?.find(
            (img: any) => img.id === shot.useUploadedImage
          );
          return uploadedImage?.url;
        })
        ?.filter(Boolean) || [];

      console.log(`🎬 영상 ${index + 1} 생성 요청 중...`);

      // processing 상태로 업데이트
      await updateVideoClipStatus(projectId, index, {
        videoIndex: index,
        url: '',
        thumbnailUrl: '',
        duration: 6,
        status: 'processing',
      });

      // 5분 타임아웃 적용
      const result = await withTimeout(
        generateVideoWithVeo3({
          prompt: combinedPrompt,
          referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
          aspectRatio: '9:16',
          duration: 6, // 6초 영상
        }),
        5 * 60 * 1000, // 5분
        index
      );

      if (result.status === 'completed' && result.videoUrl) {
        completedCount++;
        console.log(`✅ 영상 ${index + 1} 생성 완료! (${completedCount}/${approvedScripts.length})`);
        
        // 즉시 DB 업데이트 (실시간 반영) - 전체 배열을 읽어서 업데이트
        await updateVideoClipStatus(projectId, index, {
          videoIndex: index,
          url: result.videoUrl,
          thumbnailUrl: '',
          duration: 6,
          status: 'completed',
          operationId: result.operationId,
        });

        return { videoIndex: index, url: result.videoUrl, status: 'completed' };
      } else {
        throw new Error(result.error || '영상 생성 실패');
      }
    } catch (error: any) {
      failedCount++;
      console.error(`❌ 영상 ${index + 1} 실패:`, error.message);
      
      // 실패 즉시 DB 업데이트 - 전체 배열을 읽어서 업데이트
      await updateVideoClipStatus(projectId, index, {
        videoIndex: index,
        url: '',
        status: 'failed',
        error: error.message || '영상 생성 실패',
      });

      return { videoIndex: index, url: '', status: 'failed', error: error.message };
    }
  };

  // 병렬로 모든 영상 생성 (완료되는 대로 업데이트)
  const results = await Promise.all(
    approvedScripts.map((script, index) => generateAndUpdate(script, index))
  );

  // 실패한 영상에 대해 포인트 환불
  if (failedCount > 0) {
    await refundReelsPoints(userId, projectId, 4, failedCount);
    console.log(`💸 ${failedCount}개 영상 실패로 포인트 환불`);
  }

  // 인덱스 순서대로 정렬
  const videoClips = results.sort((a, b) => a.videoIndex - b.videoIndex);

  // 최종 상태 업데이트
  const allFailed = failedCount === approvedScripts.length;
  const allCompleted = videoClips.every(v => v.status === 'completed');

  await db.collection('reelsProjects').doc(projectId).update({
    videoClips,
    status: allFailed ? 'failed' : (allCompleted ? 'draft' : 'processing'),
    'stepStatus.step4': allFailed ? 'failed' : (allCompleted ? 'completed' : 'processing'),
    currentStep: allFailed ? 4 : 5, // 일부라도 성공하면 다음 단계로
    'stepResults.step4': {
      totalVideos: approvedScripts.length,
      processedVideos: videoClips.length,
      failedVideos: failedCount,
      totalPointsUsed,
      completedAt: allCompleted ? new Date() : null,
      startedAt: new Date(),
    },
    updatedAt: new Date(),
  });

  console.log(`🎬 영상 생성 완료: ${approvedScripts.length - failedCount}/${approvedScripts.length} 성공`);
}

/**
 * 특정 인덱스의 videoClip 상태를 안전하게 업데이트
 * Firestore는 배열 인덱스 직접 업데이트가 안 되므로 전체 배열을 읽어서 수정 후 저장
 */
async function updateVideoClipStatus(projectId: string, index: number, clipData: any) {
  try {
    const projectRef = db.collection('reelsProjects').doc(projectId);
    
    // 트랜잭션으로 안전하게 업데이트
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(projectRef);
      if (!doc.exists) return;
      
      const data = doc.data();
      const videoClips = data?.videoClips || [];
      
      // 배열 확장 (필요한 경우)
      while (videoClips.length <= index) {
        videoClips.push({ status: 'pending', videoIndex: videoClips.length });
      }
      
      // 해당 인덱스 업데이트
      videoClips[index] = { ...videoClips[index], ...clipData };
      
      transaction.update(projectRef, {
        videoClips,
        updatedAt: new Date(),
      });
    });
    
    console.log(`📝 영상 ${index + 1} 상태 업데이트: ${clipData.status}`);
  } catch (error) {
    console.error(`영상 ${index + 1} 상태 업데이트 실패:`, error);
  }
}

