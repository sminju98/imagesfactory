/**
 * Veo3 비디오 생성기
 * Google Gemini Veo3 API를 사용하여 8초 비디오 클립 생성
 */

import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY || '' });

interface VideoGenerationResult {
  success: boolean;
  operationId?: string;
  error?: string;
}

interface VideoStatusResult {
  done: boolean;
  videoUrl?: string;
  error?: string;
}

/**
 * Veo3로 비디오 생성 시작
 * @param prompt 영어 비주얼 프롬프트
 * @returns operation ID (폴링용)
 */
export async function generateVideoWithVeo3(
  prompt: string
): Promise<VideoGenerationResult> {
  try {
    // 프롬프트 검증: 한국어/텍스트 관련 단어 제거
    const cleanedPrompt = cleanPrompt(prompt);
    
    const operation = await genai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: cleanedPrompt,
      config: {
        personGeneration: 'allow_adult',
        aspectRatio: '9:16', // 세로 영상 (릴스/쇼츠)
        numberOfVideos: 1,
      },
    });

    if (!operation || !operation.name) {
      throw new Error('비디오 생성 요청 실패: operation이 없습니다.');
    }

    return {
      success: true,
      operationId: operation.name,
    };
  } catch (error: any) {
    console.error('Veo3 비디오 생성 오류:', error);
    return {
      success: false,
      error: error.message || '비디오 생성 요청 실패',
    };
  }
}

/**
 * 비디오 생성 상태 확인
 * @param operationId operation ID
 * @returns 상태 및 비디오 URL
 */
export async function checkVeoVideoStatus(
  operationId: string
): Promise<VideoStatusResult> {
  try {
    const operation = await genai.operations.getVideosOperation({
      operation: operationId,
    });

    if (!operation) {
      return { done: false, error: 'Operation not found' };
    }

    // 완료 확인
    if (operation.done) {
      // 비디오 URL 추출
      const videoUrl = extractVideoUrl(operation);
      
      if (videoUrl) {
        return { done: true, videoUrl };
      } else if (operation.error) {
        return { done: true, error: operation.error.message || 'Video generation failed' };
      } else {
        return { done: true, error: 'Video URL not found in response' };
      }
    }

    return { done: false };
  } catch (error: any) {
    console.error('Veo 상태 확인 오류:', error);
    return { done: false, error: error.message };
  }
}

/**
 * 응답에서 비디오 URL 추출
 */
function extractVideoUrl(operation: any): string | null {
  try {
    // 다양한 응답 구조 지원
    const paths = [
      operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri,
      operation.response?.generatedSamples?.[0]?.video?.uri,
      operation.result?.videos?.[0]?.uri,
      operation.metadata?.generatedSamples?.[0]?.video?.uri,
    ];

    for (const path of paths) {
      if (path) return path;
    }

    console.log('비디오 URL 추출 실패, operation:', JSON.stringify(operation, null, 2));
    return null;
  } catch (e) {
    console.error('비디오 URL 추출 오류:', e);
    return null;
  }
}

/**
 * 프롬프트 정리 (한국어/텍스트 관련 제거)
 */
function cleanPrompt(prompt: string): string {
  // 한국어 관련 단어 제거
  const bannedPatterns = [
    /korean\s*(text|label|subtitle|caption|character|word)/gi,
    /hangul/gi,
    /한국어/g,
    /한글/g,
    /텍스트/g,
    /자막/g,
    /with\s+text/gi,
    /text\s+overlay/gi,
    /showing\s+text/gi,
  ];

  let cleaned = prompt;
  for (const pattern of bannedPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 중복 공백 제거
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * 비디오 생성 완료까지 대기 (폴링)
 * @param operationId operation ID
 * @param maxWaitMs 최대 대기 시간 (기본 10분)
 * @param intervalMs 폴링 간격 (기본 5초)
 */
export async function waitForVideoCompletion(
  operationId: string,
  maxWaitMs: number = 600000,
  intervalMs: number = 5000
): Promise<VideoStatusResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await checkVeoVideoStatus(operationId);

    if (status.done) {
      return status;
    }

    if (status.error) {
      return status;
    }

    // 대기
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return { done: false, error: '비디오 생성 시간 초과 (10분)' };
}

/**
 * 재시도 로직이 포함된 비디오 생성
 */
export async function generateVideoWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
  const retryDelays = [30000, 60000, 90000]; // 30초, 60초, 90초

  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      // 1. 생성 요청
      const genResult = await generateVideoWithVeo3(prompt);
      if (!genResult.success || !genResult.operationId) {
        throw new Error(genResult.error || '생성 요청 실패');
      }

      // 2. 완료 대기
      const status = await waitForVideoCompletion(genResult.operationId);
      
      if (status.videoUrl) {
        return { success: true, videoUrl: status.videoUrl };
      }

      if (status.error) {
        throw new Error(status.error);
      }
    } catch (error: any) {
      console.error(`비디오 생성 시도 ${retry + 1}/${maxRetries + 1} 실패:`, error.message);

      // 재시도 가능한 에러인지 확인
      const isRetryable = 
        error.message?.includes('429') ||
        error.message?.includes('503') ||
        error.message?.includes('timeout') ||
        error.message?.includes('fetch failed');

      if (retry < maxRetries && isRetryable) {
        console.log(`${retryDelays[retry] / 1000}초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, retryDelays[retry]));
        continue;
      }

      return { success: false, error: error.message };
    }
  }

  return { success: false, error: '최대 재시도 횟수 초과' };
}
