/**
 * Veo3 영상 생성 유틸리티
 * Google Gemini API의 Veo3 모델 사용
 * 문서: https://ai.google.dev/gemini-api/docs/video
 */

interface Veo3GenerateParams {
  prompt: string;
  referenceImages?: string[]; // 최대 3개 이미지 URL
  aspectRatio?: '16:9' | '9:16' | '1:1';
  duration?: number; // 초 단위 (기본 8초)
}

interface Veo3Operation {
  name: string;
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

/**
 * Veo3로 영상 생성 시작 (비동기 작업)
 * @param params 생성 파라미터
 * @returns operation ID
 */
export async function generateVideoWithVeo3(
  params: Veo3GenerateParams
): Promise<{ operationId: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.');
  }

  // Veo 3.1 모델 사용 (최신 버전)
  const model = 'veo-3.1-generate-preview';
  
  // 요청 본문 구성
  const requestBody: any = {
    prompt: params.prompt,
  };

  // 참조 이미지가 있으면 추가 (최대 3개)
  if (params.referenceImages && params.referenceImages.length > 0) {
    requestBody.reference_images = params.referenceImages.slice(0, 3).map(url => ({
      uri: url,
    }));
  }

  // 비율 설정 (릴스는 9:16)
  if (params.aspectRatio) {
    requestBody.aspect_ratio = params.aspectRatio;
  }

  // 길이 설정 (기본 8초)
  if (params.duration) {
    requestBody.duration_seconds = params.duration;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateVideos?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Veo3 API 오류:', response.status, errorText);
      throw new Error(`Veo3 API 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 비동기 작업이므로 operation name 반환
    // Google API는 operation 객체를 반환하거나 name 필드를 가질 수 있음
    const operationId = data.name || data.operation?.name || data.operationId || data.id;
    
    if (!operationId) {
      throw new Error('Operation ID를 받지 못했습니다.');
    }
    
    return {
      operationId,
    };
  } catch (error: any) {
    console.error('Veo3 영상 생성 오류:', error);
    throw error;
  }
}

/**
 * Veo3 작업 상태 확인
 * @param operationId 작업 ID
 * @returns 작업 상태 및 결과
 */
export async function checkVeo3Operation(
  operationId: string
): Promise<{ done: boolean; videoUrl?: string; error?: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.');
  }

  try {
    // operation ID에서 모델명 추출
    // 형식: operations/veo-3.1-generate-preview/...
    const operationPath = operationId.startsWith('operations/') 
      ? operationId 
      : `operations/${operationId}`;

    // Google API의 operation 조회 엔드포인트
    // 형식: operations/{operationId} 또는 models/{model}/operations/{operationId}
    let operationUrl: string;
    if (operationPath.includes('/')) {
      // 이미 전체 경로인 경우
      operationUrl = `https://generativelanguage.googleapis.com/v1beta/${operationPath}?key=${apiKey}`;
    } else {
      // 모델명 포함 경로 시도
      operationUrl = `https://generativelanguage.googleapis.com/v1beta/operations/veo-3.1-generate-preview/${operationPath}?key=${apiKey}`;
    }

    const response = await fetch(operationUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        done: true,
        error: `작업 조회 실패: ${response.status} - ${errorText}`,
      };
    }

    const data: Veo3Operation = await response.json();
    
    if (data.done) {
      if (data.error) {
        return {
          done: true,
          error: data.error.message || '영상 생성 실패',
        };
      }
      
      if (data.response?.generatedVideos?.[0]?.video?.uri) {
        return {
          done: true,
          videoUrl: data.response.generatedVideos[0].video.uri,
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
  const { operationId } = await generateVideoWithVeo3(params);
  
  const startTime = Date.now();
  const pollInterval = 10000; // 10초마다 확인

  while (Date.now() - startTime < maxWaitTime) {
    const status = await checkVeo3Operation(operationId);
    
    if (status.done) {
      if (status.videoUrl) {
        return status.videoUrl;
      }
      throw new Error(status.error || '영상 생성 실패');
    }

    // 대기 후 다시 확인
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('영상 생성 시간 초과');
}

