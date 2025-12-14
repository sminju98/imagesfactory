/**
 * 최종 비디오 합성 모듈
 * 비디오 클립, TTS 오디오, 자막을 결합하여 최종 비디오를 생성합니다.
 * ffmpeg 또는 외부 합성 서비스를 사용합니다.
 */

import { Subtitle, TTSAudio } from '@/types/project.types';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

interface ComposeVideoParams {
  videoClips: string[];        // 비디오 클립 URL 배열
  ttsAudios: TTSAudio[];       // TTS 오디오 배열
  subtitles: Subtitle[];       // 자막 배열
  outputFormat?: 'mp4' | 'mov';
  resolution?: { width: number; height: number };
}

interface ComposeVideoResult {
  finalVideoUrl: string;
  duration: number;            // 초 단위
}

/**
 * 최종 비디오를 합성합니다.
 * @param params 합성 파라미터
 * @returns 합성된 비디오 URL
 */
/**
 * 파일 다운로드 헬퍼
 */
async function downloadFile(url: string, filePath: string): Promise<void> {
  try {
    // data URL 처리
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(filePath, buffer);
      return;
    }

    // HTTP URL 다운로드
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_VEO3_API_KEY;
    let downloadUrl = url;
    
    // Google API URL에 key 추가
    if (url.includes('generativelanguage.googleapis.com') && !url.includes('key=') && apiKey) {
      const separator = url.includes('?') ? '&' : '?';
      downloadUrl = `${url}${separator}key=${apiKey}`;
    }
    
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
  } catch (error: any) {
    throw new Error(`파일 다운로드 실패 (${url}): ${error.message}`);
  }
}

/**
 * 자막을 SRT 파일로 생성
 */
function createSRTFile(subtitles: Subtitle[], outputPath: string): string {
  let srtContent = '';
  subtitles.forEach((sub, idx) => {
    const start = formatSRTTime(sub.startTime);
    const end = formatSRTTime(sub.endTime);
    srtContent += `${idx + 1}\n${start} --> ${end}\n${sub.text}\n\n`;
  });
  
  // 동기적으로 파일 작성
  fsSync.writeFileSync(outputPath, srtContent);
  return outputPath;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

/**
 * 씬별로 자막을 분리하여 SRT 파일 생성
 */
function createSceneSRTFiles(
  subtitles: Subtitle[],
  scenes: Array<{ id: string; index: number }>,
  tempDir: string
): Map<string, string> {
  const sceneSRTs = new Map<string, string>();
  
  scenes.forEach((scene, idx) => {
    // 해당 씬의 자막 찾기
    const sceneSubtitles = subtitles.filter(sub => sub.sceneId === scene.id);
    if (sceneSubtitles.length > 0) {
      // 시작 시간을 0부터로 조정
      const adjustedSubtitles = sceneSubtitles.map(sub => ({
        ...sub,
        startTime: sub.startTime - (sceneSubtitles[0].startTime || 0),
        endTime: sub.endTime - (sceneSubtitles[0].startTime || 0),
      }));
      
      const srtPath = path.join(tempDir, `subtitle-${idx}.srt`);
      createSRTFile(adjustedSubtitles, srtPath);
      sceneSRTs.set(scene.id, srtPath);
    }
  });
  
  return sceneSRTs;
}

export async function composeFinalVideo(
  params: ComposeVideoParams
): Promise<ComposeVideoResult> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-compose-'));
  
  try {
    const { videoClips, ttsAudios, subtitles } = params;

    if (videoClips.length === 0) {
      throw new Error('비디오 클립이 없습니다.');
    }
    if (videoClips.length !== ttsAudios.length) {
      throw new Error(`비디오 클립(${videoClips.length})과 TTS 오디오(${ttsAudios.length}) 개수가 일치하지 않습니다.`);
    }

    console.log(`🎬 비디오 합성 시작: ${videoClips.length}개 클립`);

    // 1. 비디오 클립 다운로드
    console.log('📥 비디오 클립 다운로드 중...');
    const videoPaths: string[] = [];
    for (let i = 0; i < videoClips.length; i++) {
      const videoPath = path.join(tempDir, `video-${i}.mp4`);
      await downloadFile(videoClips[i], videoPath);
      videoPaths.push(videoPath);
      console.log(`   ✓ 비디오 ${i + 1}/${videoClips.length} 다운로드 완료`);
    }

    // 2. TTS 오디오 다운로드
    console.log('📥 TTS 오디오 다운로드 중...');
    const audioPaths: string[] = [];
    for (let i = 0; i < ttsAudios.length; i++) {
      const audioPath = path.join(tempDir, `audio-${i}.mp3`);
      await downloadFile(ttsAudios[i].audioUrl, audioPath);
      audioPaths.push(audioPath);
      console.log(`   ✓ 오디오 ${i + 1}/${ttsAudios.length} 다운로드 완료`);
    }

    // 3. 자막 SRT 파일 생성 (씬별로)
    console.log('📝 자막 파일 생성 중...');
    const scenes = ttsAudios.map((audio, idx) => ({ id: audio.sceneId, index: idx }));
    const sceneSRTs = createSceneSRTFiles(subtitles, scenes, tempDir);
    console.log(`   ✓ ${sceneSRTs.size}개 씬 자막 생성 완료`);

    // 4. 각 비디오에 오디오와 자막 합성
    console.log('🔗 비디오 합성 중...');
    const mergedVideoPaths: string[] = [];
    for (let i = 0; i < videoPaths.length; i++) {
      const outputPath = path.join(tempDir, `merged-${i}.mp4`);
      const scene = scenes[i];
      const subtitlePath = sceneSRTs.get(scene.id);
      
      // 명시적으로 스트림 매핑: 비디오는 첫 번째 입력에서, 오디오는 두 번째 입력(TTS)에서
      let ffmpegCmd = `ffmpeg -i "${videoPaths[i]}" -i "${audioPaths[i]}" `;
      
      if (subtitlePath) {
        // 자막 오버레이 (노토산스 폰트 사용)
        // 자막이 있으면 비디오 재인코딩 필요
        ffmpegCmd += `-map 0:v:0 -map 1:a:0 `;
        // 노토산스 폰트 지정 (macOS에서 libass가 폰트를 찾을 수 있도록)
        // force_style에서 FontName만 지정하면 시스템이 자동으로 찾음
        // macOS: Noto Sans CJK KR 또는 AppleSDGothicNeo
        const fontName = process.platform === 'darwin' 
          ? 'AppleSDGothicNeo-Regular'  // macOS 기본 한글 폰트
          : 'Noto Sans CJK KR';  // Linux/Windows
        
        ffmpegCmd += `-vf "subtitles='${subtitlePath.replace(/'/g, "\\'")}':force_style='FontName=${fontName},FontSize=32,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=3,Shadow=2,Alignment=2,MarginV=60,Bold=0'" `;
        // -shortest 제거: 비디오 전체 길이를 유지하도록 (TTS가 짧아도 비디오는 잘리지 않음)
        // TTS가 짧으면 조용한 부분이 생길 수 있지만 비디오는 전체 길이 유지
        ffmpegCmd += `-c:v libx264 -c:a aac -b:a 192k -y "${outputPath}"`;
      } else {
        // 자막이 없으면 비디오는 복사, TTS 오디오만 사용
        // -shortest 제거: 비디오 전체 길이 유지
        ffmpegCmd += `-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -y "${outputPath}"`;
      }
      
      try {
        await execAsync(ffmpegCmd);
        mergedVideoPaths.push(outputPath);
        console.log(`   ✓ 비디오 ${i + 1}/${videoPaths.length} 합성 완료`);
      } catch (error: any) {
        console.error(`   ❌ 비디오 ${i + 1} 합성 실패:`, error.message);
        throw new Error(`비디오 ${i + 1} 합성 실패: ${error.message}`);
      }
    }

    // 5. 모든 비디오를 순서대로 연결
    console.log('🔗 최종 비디오 연결 중...');
    const concatListPath = path.join(tempDir, 'concat-list.txt');
    const concatList = mergedVideoPaths
      .map((p) => `file '${p.replace(/'/g, "\\'")}'`)
      .join('\n');
    await fs.writeFile(concatListPath, concatList);

    const finalOutputPath = path.join(tempDir, 'final-video.mp4');
    
    // FFmpeg concat 명령어
    const concatCmd = `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c copy -y "${finalOutputPath}"`;
    
    try {
      await execAsync(concatCmd);
      console.log('   ✓ 최종 비디오 연결 완료');
    } catch (error: any) {
      // concat 실패 시 re-encode 시도
      console.log('   ⚠️  concat 실패, 재인코딩 시도...');
      const concatCmd2 = `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -c:a aac -y "${finalOutputPath}"`;
      await execAsync(concatCmd2);
      console.log('   ✓ 재인코딩 완료');
    }

    // 6. 최종 비디오를 Firebase Storage에 업로드
    const { storage } = await import('@/lib/firebase-admin');
    const bucket = storage.bucket();
    const timestamp = Date.now();
    const fileName = `ai-content/final-videos/${timestamp}.mp4`;
    const file = bucket.file(fileName);
    
    await file.save(await fs.readFile(finalOutputPath), {
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          createdAt: new Date().toISOString(),
        },
      },
    });
    
    // 파일을 공개로 설정
    await file.makePublic();
    const finalVideoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    const totalDuration = calculateTotalDuration(ttsAudios);

    const fileStats = await fs.stat(finalOutputPath);
    console.log(`✅ 비디오 합성 완료! (${(fileStats.size / 1024 / 1024).toFixed(2)}MB, ${totalDuration}초)`);
    console.log(`   📤 Storage 업로드 완료: ${finalVideoUrl}`);

    return {
      finalVideoUrl,
      duration: totalDuration,
    };
  } catch (error: any) {
    console.error('비디오 합성 오류:', error);
    throw new Error(`비디오 합성 실패: ${error.message}`);
  } finally {
    // 임시 파일 정리 (선택적)
    // await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`📁 임시 파일 디렉토리: ${tempDir} (수동 정리 가능)`);
  }
}

/**
 * 비디오 클립들을 순서대로 연결
 */
export function concatenateVideoClips(videoClips: string[]): string {
  // ffmpeg 명령어 생성 (예시)
  // 실제로는 Firebase Functions나 서버에서 실행
  return videoClips.join('|'); // 임시
}

/**
 * TTS 오디오를 비디오에 오버레이
 */
export function overlayTTSAudio(
  videoUrl: string,
  audioUrl: string,
  startTime: number
): string {
  // ffmpeg 명령어 생성 (예시)
  return `${videoUrl}+${audioUrl}@${startTime}`;
}

/**
 * 자막을 비디오에 오버레이
 */
export function overlaySubtitles(
  videoUrl: string,
  subtitles: Subtitle[]
): string {
  // ffmpeg 명령어로 자막 오버레이
  return `${videoUrl}+subtitles`;
}

/**
 * 총 비디오 길이 계산
 */
export function calculateTotalDuration(ttsAudios: TTSAudio[]): number {
  return ttsAudios.reduce((total, audio) => total + audio.duration, 0);
}

