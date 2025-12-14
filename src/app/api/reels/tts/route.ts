/**
 * Step5: TTS + 자막 생성 API
 * POST /api/reels/tts
 * 
 * 병렬 처리 + 실시간 업데이트 + 2분 타임아웃
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { generateMultipleTTS } from '@/lib/reels/gemini-tts-service-account';
import { generateSubtitlesWithGPT, convertToSRT, convertToWebVTT } from '@/lib/reels/subtitle';
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

    const { projectId, videoScripts, videoClips } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId가 필요합니다.' },
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

    // videoScripts 사용 (전달받거나 프로젝트에서 가져옴)
    const scripts = videoScripts || projectData.videoScripts || [];
    const clips = videoClips || projectData.videoClips || [];
    
    if (scripts.length === 0) {
      return NextResponse.json(
        { success: false, error: '대본이 없습니다.' },
        { status: 400 }
      );
    }

    // 승인된 스크립트만 필터링
    const approvedScripts = scripts.filter((s: any) => s.approved);
    if (approvedScripts.length === 0) {
      return NextResponse.json(
        { success: false, error: '승인된 대본이 없습니다.' },
        { status: 400 }
      );
    }

    // 즉시 응답 반환 (백그라운드에서 처리)
    const response = NextResponse.json({
      success: true,
      message: `${approvedScripts.length}개 TTS 생성을 시작합니다.`,
      data: {
        totalClips: approvedScripts.length,
        status: 'processing',
      },
    });

    // 프로젝트 상태 업데이트 (처리 중)
    await db.collection('reelsProjects').doc(projectId).update({
      status: 'processing',
      'stepStatus.step5': 'processing',
      finalClips: approvedScripts.map((_: any, index: number) => ({
        videoIndex: index,
        url: clips[index]?.url || '',
        audioUrl: '',
        subtitleUrl: '',
        status: 'pending',
      })),
      updatedAt: new Date(),
    });

    // 백그라운드에서 TTS 생성 (비동기)
    processTTSInBackground(projectId, approvedScripts, clips, projectData, user.uid).catch((error) => {
      console.error('백그라운드 TTS 생성 오류:', error);
    });

    return response;
  } catch (error: any) {
    console.error('TTS API 오류:', error);
    return NextResponse.json(
      { success: false, error: 'TTS 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 백그라운드에서 TTS를 병렬로 생성
 * - 완료되는 순서대로 실시간 업데이트
 * - 2분 타임아웃 적용
 */
async function processTTSInBackground(
  projectId: string,
  approvedScripts: any[],
  videoClips: any[],
  projectData: any,
  userId: string
) {
  console.log(`🎙️ ${approvedScripts.length}개 TTS 병렬 생성 시작...`);

  // 모든 TTS에 대해 포인트 먼저 차감
  const totalPoints = approvedScripts.length;
  const pointsResult = await deductReelsPoints(userId, projectId, 5, totalPoints);
  
  if (!pointsResult.success) {
    console.error('포인트 차감 실패:', pointsResult.error);
    await db.collection('reelsProjects').doc(projectId).update({
      status: 'failed',
      'stepStatus.step5': 'failed',
      errorMessage: pointsResult.error,
      updatedAt: new Date(),
    });
    return;
  }

  let completedCount = 0;
  let failedCount = 0;

  // 2분 타임아웃 래퍼
  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, index: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`TTS ${index + 1} 생성 시간 초과 (2분)`)), timeoutMs)
      )
    ]);
  };

  // 개별 TTS 생성 및 실시간 업데이트
  const generateAndUpdate = async (script: any, index: number) => {
    try {
      console.log(`🎙️ TTS ${index + 1} 생성 중...`);

      // processing 상태로 업데이트
      await updateFinalClipStatus(projectId, index, {
        videoIndex: index,
        url: videoClips[index]?.url || '',
        audioUrl: '',
        status: 'processing',
      });

      // 2분 타임아웃 적용
      const [ttsResult, subtitleData] = await withTimeout(
        Promise.all([
          // TTS 생성
          generateMultipleTTS([script.narration], {
            voice: 'ko-KR-Neural2-A',
            speed: 1.0,
          }),
          // 자막 생성
          generateSubtitlesWithGPT(script.narration, script.duration),
        ]),
        2 * 60 * 1000, // 2분
        index
      );

      // SRT 및 WebVTT 변환
      const srtContent = convertToSRT(subtitleData);
      const vttContent = convertToWebVTT(subtitleData);

      completedCount++;
      console.log(`✅ TTS ${index + 1} 완료! (${completedCount}/${approvedScripts.length})`);

      // 즉시 DB 업데이트 (실시간 반영) - 트랜잭션 사용
      await updateFinalClipStatus(projectId, index, {
        videoIndex: index,
        url: videoClips[index]?.url || '',
        audioUrl: ttsResult[0].audioUrl,
        audioDuration: ttsResult[0].duration,
        subtitle: { srt: srtContent, vtt: vttContent },
        status: 'completed',
      });

      return {
        videoIndex: index,
        audioUrl: ttsResult[0].audioUrl,
        subtitle: { srt: srtContent, vtt: vttContent },
        status: 'completed',
      };
    } catch (error: any) {
      failedCount++;
      console.error(`❌ TTS ${index + 1} 실패:`, error.message);

      // 실패 즉시 DB 업데이트 - 트랜잭션 사용
      await updateFinalClipStatus(projectId, index, {
        videoIndex: index,
        url: videoClips[index]?.url || '',
        audioUrl: '',
        status: 'failed',
        error: error.message || 'TTS 생성 실패',
      });

      return { videoIndex: index, status: 'failed', error: error.message };
    }
  };

  // 병렬로 모든 TTS 생성 (완료되는 대로 업데이트)
  const results = await Promise.all(
    approvedScripts.map((script, index) => generateAndUpdate(script, index))
  );

  // 실패한 TTS에 대해 포인트 환불
  if (failedCount > 0) {
    await refundReelsPoints(userId, projectId, 5, failedCount);
    console.log(`💸 ${failedCount}개 TTS 실패로 포인트 환불`);
  }

  // 최종 상태 업데이트
  const allFailed = failedCount === approvedScripts.length;
  const allCompleted = results.every(r => r.status === 'completed');

  await db.collection('reelsProjects').doc(projectId).update({
    status: allFailed ? 'failed' : (allCompleted ? 'draft' : 'processing'),
    'stepStatus.step5': allFailed ? 'failed' : (allCompleted ? 'completed' : 'processing'),
    currentStep: allFailed ? 5 : 6,
    'stepResults.step5': {
      totalClips: approvedScripts.length,
      completedClips: completedCount,
      failedClips: failedCount,
      completedAt: allCompleted ? new Date() : null,
    },
    updatedAt: new Date(),
  });

  console.log(`🎙️ TTS 생성 완료: ${completedCount}/${approvedScripts.length} 성공`);
}

/**
 * 특정 인덱스의 finalClip 상태를 안전하게 업데이트
 * Firestore는 배열 인덱스 직접 업데이트가 안 되므로 트랜잭션 사용
 */
async function updateFinalClipStatus(projectId: string, index: number, clipData: any) {
  try {
    const projectRef = db.collection('reelsProjects').doc(projectId);
    
    // 트랜잭션으로 안전하게 업데이트
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(projectRef);
      if (!doc.exists) return;
      
      const data = doc.data();
      const finalClips = data?.finalClips || [];
      
      // 배열 확장 (필요한 경우)
      while (finalClips.length <= index) {
        finalClips.push({ status: 'pending', videoIndex: finalClips.length });
      }
      
      // 해당 인덱스 업데이트
      finalClips[index] = { ...finalClips[index], ...clipData };
      
      transaction.update(projectRef, {
        finalClips,
        updatedAt: new Date(),
      });
    });
    
    console.log(`📝 TTS ${index + 1} 상태 업데이트: ${clipData.status}`);
  } catch (error) {
    console.error(`TTS ${index + 1} 상태 업데이트 실패:`, error);
  }
}
