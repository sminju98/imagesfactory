/**
 * Google AI Studio Veo 3.1 영상 생성 API 클라이언트
 * 
 * 문서: https://ai.google.dev/gemini-api/docs/video
 * SDK: @google/genai
 * 
 * Veo 3.1 특징:
 * - Text to Video: 텍스트만으로 영상 생성
 * - Image to Video: 이미지를 첫 프레임으로 사용
 * - 8초 영상 생성 (720p/1080p)
 * - 네이티브 오디오 옵션 제공
 */

import { GoogleGenAI } from '@google/genai';

// Google AI 클라이언트 초기화
const getClient = () => {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENAI_API_KEY가 설정되지 않았습니다.');
  }
  return new GoogleGenAI({ apiKey });
};

interface VideoGenerationOptions {
  prompt: string;
  referenceImages?: string[]; // base64 이미지 또는 URL
  aspectRatio?: '9:16' | '16:9' | '1:1';
  duration?: 4 | 6 | 8; // Veo 3.1은 4, 6, 8초 지원
  negativePrompt?: string;
}

interface VideoGenerationResult {
  operationId: string;
  videoUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Google AI Studio Veo 3.1로 영상 생성
 */
export async function generateVideoWithVeo3(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  const { 
    prompt, 
    referenceImages, 
    aspectRatio = '9:16',
    negativePrompt = 'low quality, blurry, distorted, watermark'
  } = options;

  const ai = getClient();
  const hasImage = referenceImages && referenceImages.length > 0;

  console.log(`🎬 Google Veo 3.1 영상 생성 요청:`, {
    prompt: prompt.substring(0, 100) + '...',
    hasReferenceImages: hasImage,
    aspectRatio,
  });

  try {
    let operation: any;

    if (hasImage) {
      // Image to Video
      const imageData = referenceImages[0];
      
      // URL인지 base64인지 확인
      let imageBytes: string;
      let mimeType = 'image/png';
      
      if (imageData.startsWith('http')) {
        // URL에서 이미지 다운로드
        const response = await fetch(imageData);
        const buffer = await response.arrayBuffer();
        imageBytes = Buffer.from(buffer).toString('base64');
        mimeType = response.headers.get('content-type') || 'image/png';
      } else if (imageData.startsWith('data:')) {
        // data URL에서 추출
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          imageBytes = matches[2];
        } else {
          imageBytes = imageData;
        }
      } else {
        imageBytes = imageData;
      }

      // Image to Video 생성
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: prompt,
        image: {
          imageBytes,
          mimeType: mimeType as 'image/png' | 'image/jpeg' | 'image/webp',
        },
        config: {
          aspectRatio,
          negativePrompt,
        },
      });
    } else {
      // Text to Video 생성
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: prompt,
        config: {
          aspectRatio,
          negativePrompt,
        },
      });
    }

    console.log('📹 Veo 3.1 작업 생성됨');

    // 작업 완료까지 폴링 (최대 5분)
    const result = await pollForCompletion(ai, operation);
    
    return result;
  } catch (error: any) {
    console.error('❌ Veo 3.1 영상 생성 오류:', error);
    
    // 에러 메시지 상세 출력
    if (error.response) {
      console.error('응답 에러:', error.response.data || error.response);
    }
    
    throw new Error(`영상 생성 실패: ${error.message}`);
  }
}

/**
 * 작업 완료까지 폴링 (최대 5분)
 */
async function pollForCompletion(
  ai: GoogleGenAI,
  operation: any
): Promise<VideoGenerationResult> {
  const maxAttempts = 60; // 최대 5분 (5초 간격)
  let attempts = 0;
  let currentOperation = operation;

  while (attempts < maxAttempts) {
    attempts++;
    
    console.log(`🔄 Veo 3.1 작업 상태 [${attempts}/${maxAttempts}]:`, 
      currentOperation.done ? 'done' : 'processing');

    if (currentOperation.done) {
      const generatedVideos = currentOperation.response?.generatedVideos;
      
      if (generatedVideos && generatedVideos.length > 0) {
        const video = generatedVideos[0];
        
        try {
          // 비디오 파일 다운로드 및 Storage 업로드
          const videoFile = video.video;
          
          // 파일 다운로드
          await ai.files.download({
            file: videoFile,
            downloadPath: `/tmp/veo_${Date.now()}.mp4`,
          });
          
          // video URI 또는 다운로드된 bytes로 URL 생성
          if (videoFile?.uri) {
            console.log('✅ Veo 3.1 영상 생성 완료:', videoFile.uri);
            
            return {
              operationId: `veo_${Date.now()}`,
              videoUrl: videoFile.uri,
              status: 'completed',
            };
          }
          
          // URI가 없으면 bytes를 Firebase Storage에 업로드
          if (videoFile?.videoBytes) {
            const videoUrl = await uploadVideoToStorage(videoFile.videoBytes);
            console.log('✅ Veo 3.1 영상 Storage 업로드 완료:', videoUrl);
            
            return {
              operationId: `veo_${Date.now()}`,
              videoUrl,
              status: 'completed',
            };
          }
        } catch (downloadError: any) {
          console.error('비디오 처리 오류:', downloadError.message);
          
          // 다운로드 실패해도 URI가 있으면 사용
          if (video.video?.uri) {
            return {
              operationId: `veo_${Date.now()}`,
              videoUrl: video.video.uri,
              status: 'completed',
            };
          }
        }
      }

      // 비디오가 없으면 실패
      return {
        operationId: `veo_${Date.now()}`,
        status: 'failed',
        error: '영상 생성 결과가 없습니다.',
      };
    }

    // 아직 처리 중 - 5초 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 작업 상태 업데이트
    try {
      currentOperation = await ai.operations.getVideosOperation({
        operation: currentOperation,
      });
    } catch (pollError: any) {
      console.error('폴링 오류:', pollError.message);
      // 폴링 오류는 무시하고 계속 시도
    }
  }

  return {
    operationId: `veo_${Date.now()}`,
    status: 'failed',
    error: '영상 생성 시간 초과 (5분)',
  };
}

/**
 * Firebase Storage에 비디오 업로드
 */
async function uploadVideoToStorage(videoBytes: Uint8Array | string): Promise<string> {
  const { storage } = await import('@/lib/firebase-admin');
  
  const bucket = storage.bucket();
  const fileName = `ai-content/reels-videos/${Date.now()}_veo.mp4`;
  const file = bucket.file(fileName);
  
  const buffer = typeof videoBytes === 'string' 
    ? Buffer.from(videoBytes, 'base64')
    : Buffer.from(videoBytes);
  
  await file.save(buffer, {
    contentType: 'video/mp4',
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  
  await file.makePublic();
  
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

/**
 * 영상 생성 작업 상태 확인 (외부에서 호출용)
 */
export async function checkVideoOperationStatus(operationId: string): Promise<{
  done: boolean;
  videoUrl?: string;
  error?: string;
}> {
  // Google AI의 경우 operation ID로 직접 조회가 어려움
  // 폴링 완료 후 결과를 DB에 저장하고 여기서 읽어옴
  return { done: false };
}

/**
 * 영상 생성 작업 취소
 */
export async function cancelVideoOperation(operationId: string): Promise<boolean> {
  console.log('⚠️ Google Veo 3.1은 작업 취소를 지원하지 않습니다.');
  return false;
}
