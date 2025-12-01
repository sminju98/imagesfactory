/**
 * Step5: Pixazo TTS + 자막 생성 API
 * POST /api/reels/tts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { generateMultipleTTS } from '@/lib/reels/pixazo';
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

    const { projectId, videoIndex } = await request.json();

    if (!projectId || videoIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'projectId와 videoIndex가 필요합니다.' },
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

    const videoScript = projectData.videoScripts?.[videoIndex];
    if (!videoScript) {
      return NextResponse.json(
        { success: false, error: '대본을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 포인트 차감 (Step 5 - TTS 1개당)
    const pointsResult = await deductReelsPoints(user.uid, projectId, 5, 1);
    if (!pointsResult.success) {
      return NextResponse.json(
        { success: false, error: pointsResult.error },
        { status: 400 }
      );
    }

    try {
      // TTS 생성
      const ttsResult = await generateMultipleTTS([videoScript.narration], {
        voice: 'ko-female-1',
        speed: 1.0,
      });

      // 자막 생성
      const subtitleData = await generateSubtitlesWithGPT(
        videoScript.narration,
        videoScript.duration
      );

      // SRT 및 WebVTT 생성
      const srtContent = convertToSRT(subtitleData);
      const vttContent = convertToWebVTT(subtitleData);

      // Firebase Storage에 저장 (실제 구현 필요)
      // const srtUrl = await uploadToStorage(srtContent, 'srt');
      // const vttUrl = await uploadToStorage(vttContent, 'vtt');

      // finalClips 업데이트
      const finalClips = projectData.finalClips || [];
      finalClips[videoIndex] = {
        videoIndex,
        url: projectData.videoClips?.[videoIndex]?.url || '',
        audioUrl: ttsResult[0].audioUrl,
        subtitleUrl: '', // 실제 URL로 교체 필요
        duration: videoScript.duration,
        pointsUsed: pointsResult.pointsDeducted,
      };

      await db.collection('reelsProjects').doc(projectId).update({
        finalClips,
        currentStep: videoIndex === 4 ? 6 : 5, // 마지막 영상이면 Step6로
        stepResults: {
          ...projectData.stepResults,
          [`step5_video${videoIndex}`]: {
            audioUrl: ttsResult[0].audioUrl,
            subtitle: {
              srt: srtContent,
              vtt: vttContent,
            },
            pointsUsed: pointsResult.pointsDeducted,
            completedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        data: {
          audioUrl: ttsResult[0].audioUrl,
          duration: ttsResult[0].duration,
          subtitle: {
            srt: srtContent,
            vtt: vttContent,
          },
          pointsDeducted: pointsResult.pointsDeducted,
          newBalance: pointsResult.newBalance,
        },
      });
    } catch (error: any) {
      await refundReelsPoints(user.uid, projectId, 5, 1);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        audioUrl: ttsResult[0].audioUrl,
        duration: ttsResult[0].duration,
        subtitle: {
          srt: srtContent,
          vtt: vttContent,
        },
      },
    });
  } catch (error: any) {
    console.error('TTS 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: 'TTS 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

