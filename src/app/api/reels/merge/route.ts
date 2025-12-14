/**
 * Step6: FFmpeg 영상 결합 API
 * POST /api/reels/merge
 * 
 * 서버 내에서 직접 처리:
 * 1. URL에서 영상/오디오 다운로드
 * 2. FFmpeg로 결합
 * 3. Firebase Storage에 업로드
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { deductReelsPoints, refundReelsPoints } from '@/lib/reels/points';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * URL에서 파일 다운로드
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  console.log(`📥 다운로드: ${url.substring(0, 50)}...`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`다운로드 실패: ${response.status}`);
  }
  
  const buffer = await response.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(buffer));
  
  console.log(`✅ 저장됨: ${destPath}`);
}

/**
 * Firebase Storage에 파일 업로드
 */
async function uploadToStorage(filePath: string, destName: string): Promise<string> {
  const bucket = storage.bucket();
  const destination = `ai-content/final-reels/${destName}`;
  
  await bucket.upload(filePath, {
    destination,
    metadata: {
      contentType: 'video/mp4',
      cacheControl: 'public, max-age=31536000',
    },
  });
  
  const file = bucket.file(destination);
  await file.makePublic();
  
  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

/**
 * FFmpeg로 영상 결합
 */
async function mergeVideosWithFFmpeg(
  finalClips: any[],
  projectId: string
): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reels-merge-'));
  
  console.log(`📁 임시 디렉토리: ${tempDir}`);
  
  try {
    const mergedVideoPaths: string[] = [];
    
    // 각 클립에 대해 영상 + 오디오 결합
    for (let i = 0; i < finalClips.length; i++) {
      const clip = finalClips[i];
      
      if (!clip.url) {
        console.log(`⚠️ 클립 ${i + 1}: 영상 URL 없음, 스킵`);
        continue;
      }
      
      console.log(`🎬 클립 ${i + 1}/${finalClips.length} 처리 중...`);
      
      const videoPath = path.join(tempDir, `video-${i}.mp4`);
      const audioPath = path.join(tempDir, `audio-${i}.mp3`);
      const outputPath = path.join(tempDir, `merged-${i}.mp4`);
      
      // 1. 영상 다운로드
      await downloadFile(clip.url, videoPath);
      
      // 2. 오디오가 있으면 다운로드 후 결합, 없으면 영상만 사용
      if (clip.audioUrl) {
        await downloadFile(clip.audioUrl, audioPath);
        
        // FFmpeg: 영상 + 오디오 결합 (영상의 원본 오디오 제거 후 새 오디오 추가)
        const ffmpegCmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`;
        
        console.log(`🔧 FFmpeg 실행 중...`);
        try {
          await execAsync(ffmpegCmd);
          mergedVideoPaths.push(outputPath);
        } catch (ffmpegError: any) {
          console.error(`FFmpeg 오류 (클립 ${i + 1}):`, ffmpegError.stderr || ffmpegError.message);
          // 오디오 결합 실패 시 원본 영상만 사용
          mergedVideoPaths.push(videoPath);
        }
      } else {
        // 오디오 없이 영상만 사용
        mergedVideoPaths.push(videoPath);
      }
    }
    
    if (mergedVideoPaths.length === 0) {
      throw new Error('결합할 영상이 없습니다.');
    }
    
    // 3. 모든 영상을 순서대로 결합
    console.log(`📹 ${mergedVideoPaths.length}개 영상 결합 중...`);
    
    const concatListPath = path.join(tempDir, 'concat-list.txt');
    const concatList = mergedVideoPaths
      .map((p) => `file '${p}'`)
      .join('\n');
    await fs.writeFile(concatListPath, concatList);
    
    const finalOutputPath = path.join(tempDir, 'final-reel.mp4');
    
    // FFmpeg concat (코덱 재인코딩으로 호환성 확보)
    const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${finalOutputPath}"`;
    
    console.log(`🔧 최종 결합 중...`);
    await execAsync(concatCmd);
    
    // 4. Firebase Storage에 업로드
    console.log(`☁️ Storage 업로드 중...`);
    const finalUrl = await uploadToStorage(
      finalOutputPath, 
      `${projectId}-${Date.now()}.mp4`
    );
    
    console.log(`✅ 최종 릴스 완성: ${finalUrl}`);
    
    return finalUrl;
  } finally {
    // 임시 파일 정리
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`🧹 임시 파일 정리 완료`);
    } catch (cleanupError) {
      console.error('임시 파일 정리 실패:', cleanupError);
    }
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
    const completedClips = finalClips.filter((c: any) => c.status === 'completed' && c.url);
    
    if (completedClips.length === 0) {
      return NextResponse.json(
        { success: false, error: '완료된 영상이 없습니다. TTS 생성을 먼저 완료해주세요.' },
        { status: 400 }
      );
    }

    // 포인트 차감 (Step 6)
    const pointsResult = await deductReelsPoints(user.uid, projectId, 6);
    if (!pointsResult.success) {
      return NextResponse.json(
        { success: false, error: pointsResult.error },
        { status: 400 }
      );
    }

    // 프로젝트 상태 업데이트 (처리 중)
    await db.collection('reelsProjects').doc(projectId).update({
      status: 'processing',
      'stepStatus.step6': 'processing',
      updatedAt: new Date(),
    });

    try {
      // FFmpeg로 결합
      console.log(`🎬 FFmpeg 영상 결합 시작 (${completedClips.length}개 클립)...`);
      const finalReelUrl = await mergeVideosWithFFmpeg(completedClips, projectId);

      // 영상 길이 계산 (6초 x 클립 수)
      const totalDuration = completedClips.length * 6;

      // 프로젝트 업데이트
      await db.collection('reelsProjects').doc(projectId).update({
        finalReelUrl,
        status: 'completed',
        'stepStatus.step6': 'completed',
        currentStep: 7, // 완료
        stepResults: {
          ...projectData.stepResults,
          step6: {
            finalReelUrl,
            duration: totalDuration,
            clipCount: completedClips.length,
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
          duration: totalDuration,
          clipCount: completedClips.length,
          pointsDeducted: pointsResult.pointsDeducted,
          newBalance: pointsResult.newBalance,
        },
      });
    } catch (error: any) {
      console.error('영상 결합 실패:', error);
      
      // 포인트 환불
      await refundReelsPoints(user.uid, projectId, 6);
      
      // 프로젝트 상태 업데이트 (실패)
      await db.collection('reelsProjects').doc(projectId).update({
        status: 'failed',
        'stepStatus.step6': 'failed',
        'stepError.step6': error.message || '영상 결합 실패',
        updatedAt: new Date(),
      });
      
      throw error;
    }
  } catch (error: any) {
    console.error('영상 결합 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '영상 결합에 실패했습니다.' },
      { status: 500 }
    );
  }
}
