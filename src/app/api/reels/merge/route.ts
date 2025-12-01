/**
 * Step6: FFmpeg 영상 결합 API
 * POST /api/reels/merge
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { deductReelsPoints, refundReelsPoints } from '@/lib/reels/points';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * FFmpeg로 영상 결합
 * 실제 환경에서는 Cloud Functions나 Cloud Run에서 실행
 */
async function mergeVideosWithFFmpeg(
  videoUrls: string[],
  audioUrls: string[],
  subtitleUrls: string[]
): Promise<string> {
  // 임시 디렉토리 생성
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reels-'));
  
  try {
    // 1. 영상 다운로드 (실제로는 Storage에서 직접 처리)
    const videoPaths: string[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const videoPath = path.join(tempDir, `video-${i}.mp4`);
      // 실제로는 Storage에서 다운로드
      // await downloadFromStorage(videoUrls[i], videoPath);
      videoPaths.push(videoPath);
    }

    // 2. 음성 다운로드
    const audioPaths: string[] = [];
    for (let i = 0; i < audioUrls.length; i++) {
      const audioPath = path.join(tempDir, `audio-${i}.mp3`);
      // await downloadFromStorage(audioUrls[i], audioPath);
      audioPaths.push(audioPath);
    }

    // 3. 각 영상에 음성 합성
    const mergedVideoPaths: string[] = [];
    for (let i = 0; i < videoPaths.length; i++) {
      const outputPath = path.join(tempDir, `merged-${i}.mp4`);
      
      // FFmpeg 명령어: 영상 + 음성 합성
      // 자막이 있으면 자막도 추가
      let ffmpegCmd = `ffmpeg -i "${videoPaths[i]}" -i "${audioPaths[i]}" `;
      
      if (subtitleUrls[i]) {
        const subtitlePath = path.join(tempDir, `subtitle-${i}.srt`);
        // await downloadFromStorage(subtitleUrls[i], subtitlePath);
        ffmpegCmd += `-vf "subtitles='${subtitlePath}'" `;
      }
      
      ffmpegCmd += `-c:v libx264 -c:a aac -shortest "${outputPath}"`;
      
      await execAsync(ffmpegCmd);
      mergedVideoPaths.push(outputPath);
    }

    // 4. 5개 영상을 순서대로 결합
    const concatListPath = path.join(tempDir, 'concat-list.txt');
    const concatList = mergedVideoPaths
      .map((p) => `file '${p}'`)
      .join('\n');
    await fs.writeFile(concatListPath, concatList);

    const finalOutputPath = path.join(tempDir, 'final-reel.mp4');
    
    // FFmpeg concat 명령어
    const concatCmd = `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c copy "${finalOutputPath}"`;
    await execAsync(concatCmd);

    // 5. 최종 영상을 Storage에 업로드
    // const finalUrl = await uploadToStorage(finalOutputPath);
    
    // 시뮬레이션
    const finalUrl = `https://storage.googleapis.com/reels/final-${Date.now()}.mp4`;
    
    return finalUrl;
  } finally {
    // 임시 파일 정리
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

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

    const { projectId } = await request.json();

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

    const finalClips = projectData.finalClips || [];
    if (finalClips.length !== 5) {
      return NextResponse.json(
        { success: false, error: '모든 영상의 TTS가 완료되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 영상 URL, 음성 URL, 자막 URL 추출
    const videoUrls = finalClips.map((clip: any) => clip.url);
    const audioUrls = finalClips.map((clip: any) => clip.audioUrl);
    const subtitleUrls = finalClips.map((clip: any) => clip.subtitleUrl);

    // 포인트 차감 (Step 6)
    const pointsResult = await deductReelsPoints(user.uid, projectId, 6);
    if (!pointsResult.success) {
      return NextResponse.json(
        { success: false, error: pointsResult.error },
        { status: 400 }
      );
    }

    try {
      // FFmpeg로 결합
      console.log('FFmpeg로 영상 결합 시작...');
      const finalReelUrl = await mergeVideosWithFFmpeg(videoUrls, audioUrls, subtitleUrls);

      // 프로젝트 업데이트
      await db.collection('reelsProjects').doc(projectId).update({
        finalReelUrl,
        status: 'completed',
        currentStep: 6,
        stepResults: {
          ...projectData.stepResults,
          step6: {
            finalReelUrl,
            duration: 40,
            pointsUsed: pointsResult.pointsDeducted,
            completedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        data: {
          finalReelUrl,
          duration: 40,
          pointsDeducted: pointsResult.pointsDeducted,
          newBalance: pointsResult.newBalance,
        },
      });
    } catch (error: any) {
      await refundReelsPoints(user.uid, projectId, 6);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        finalReelUrl,
        duration: 40, // 8초 × 5개
      },
    });
  } catch (error: any) {
    console.error('영상 결합 오류:', error);
    return NextResponse.json(
      { success: false, error: '영상 결합에 실패했습니다.' },
      { status: 500 }
    );
  }
}

