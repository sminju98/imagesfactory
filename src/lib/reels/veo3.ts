/**
 * Veo3 영상 생성 유틸리티
 * Google GenAI SDK 사용
 * 문서: https://ai.google.dev/gemini-api/docs/video
 */

import { GoogleGenAI } from '@google/genai';

interface Veo3GenerateParams {
  prompt: string;
  referenceImages?: string[]; // 최대 3개 이미지 URL
  aspectRatio?: '16:9' | '9:16' | '1:1';
  duration?: number; // 초 단위 (기본 8초)
}

interface Veo3Operation {
  done: boolean;
  response?: {
    generatedVideos: Array<{
      video: {
        uri: string;
      };
    }>;
  };
  error?: {
    message: string;
  };
}

// GoogleGenAI 인스턴스 생성
function getGoogleGenAI() {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_VEO3_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY 또는 GOOGLE_VEO3_API_KEY가 설정되지 않았습니다.');
  }

  return new GoogleGenAI({
    apiKey,
  });
}

/**
 * Veo3로 영상 생성 시작 (비동기 작업)
 * @param params 생성 파라미터
 * @returns operation 객체
 */
export async function generateVideoWithVeo3(
  params: Veo3GenerateParams
): Promise<{ operationId: string; operation: any }> {
  const ai = getGoogleGenAI();

  try {
    // Veo 3.1 모델 사용
    const generateParams: any = {
      model: 'veo-3.1-generate-preview',
      prompt: params.prompt,
    };

    // 참조 이미지가 있으면 추가 (최대 3개)
    // Veo3는 referenceImages를 직접 URL로 받을 수 있음
    if (params.referenceImages && params.referenceImages.length > 0) {
      generateParams.referenceImages = params.referenceImages.slice(0, 3);
    }

    // 비율 설정 (릴스는 9:16)
    if (params.aspectRatio) {
      generateParams.aspectRatio = params.aspectRatio;
    }

    // 길이 설정 (기본 8초)
    if (params.duration) {
      generateParams.duration = params.duration;
    }

    const operation = await ai.models.generateVideos(generateParams);
    
    // operation 객체에서 ID 추출
    // 형식: models/veo-3.1-generate-preview/operations/xxxxx
    const operationId = (operation as any).name || 
                        (operation as any).operationId || 
                        `operation_${Date.now()}`;
    
    return {
      operationId,
      operation,
    };
  } catch (error: any) {
    console.error('Veo3 영상 생성 오류:', error);
    throw error;
  }
}

/**
 * Veo3 작업 상태 확인
 * @param operation 작업 객체 또는 operation ID
 * @returns 작업 상태 및 결과
 */
export async function checkVeo3Operation(
  operation: any
): Promise<{ done: boolean; videoUrl?: string; error?: string }> {
  const ai = getGoogleGenAI();

  try {
    // operation 객체가 이미 done 속성을 가지고 있는지 확인
    if (operation.done !== undefined) {
      if (operation.done) {
        if (operation.error) {
          return {
            done: true,
            error: operation.error.message || '영상 생성 실패',
          };
        }
        
        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
          return {
            done: true,
            videoUrl: operation.response.generatedVideos[0].video.uri,
          };
        }
        
        return {
          done: true,
          error: '영상 URL을 찾을 수 없습니다.',
        };
      }
      
      return { done: false };
    }

    // operation 객체로 상태 조회
    const updatedOperation = await ai.operations.getVideosOperation({
      operation,
    });

    if (updatedOperation.done) {
      if ((updatedOperation as any).error) {
        return {
          done: true,
          error: (updatedOperation as any).error.message || '영상 생성 실패',
        };
      }
      
      if ((updatedOperation as any).response?.generatedVideos?.[0]?.video?.uri) {
        return {
          done: true,
          videoUrl: (updatedOperation as any).response.generatedVideos[0].video.uri,
        };
      }
      
      return {
        done: true,
        error: '영상 URL을 찾을 수 없습니다.',
      };
    }

    return { done: false };
  } catch (error: any) {
    console.error('Veo3 작업 확인 오류:', error);
    return {
      done: true,
      error: error.message || '작업 확인 실패',
    };
  }
}

/**
 * Veo3 영상 생성 (동기식, 폴링 포함)
 * @param params 생성 파라미터
 * @param maxWaitTime 최대 대기 시간 (밀리초, 기본 5분)
 * @returns 생성된 영상 URL
 */
export async function generateVideoWithVeo3Sync(
  params: Veo3GenerateParams,
  maxWaitTime: number = 5 * 60 * 1000
): Promise<string> {
  const { operation } = await generateVideoWithVeo3(params);
  
  const startTime = Date.now();
  const pollInterval = 10000; // 10초마다 확인

  let currentOperation = operation;

  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkVeo3Operation(currentOperation);
    
    if (status.done) {
      if (status.videoUrl) {
        return status.videoUrl;
      }
      throw new Error(status.error || '영상 생성 실패');
    }

    // 대기 후 다시 확인
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    // operation 업데이트
    const ai = getGoogleGenAI();
    currentOperation = await ai.operations.getVideosOperation({
      operation: currentOperation,
    });
  }

  throw new Error('영상 생성 시간 초과');
}
