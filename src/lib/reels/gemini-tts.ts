/**
 * Gemini-TTS (Text-to-Speech) 유틸리티
 * Reels Factory Step5: 음성 합성
 * 문서: https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
 */

interface GeminiTTSParams {
  text: string;
  voice?: string; // 음성 옵션 (기본: ko-KR-Neural2-A)
  speed?: number; // 속도 (0.25 ~ 4.0, 기본: 1.0)
  pitch?: number; // 음높이 (-20.0 ~ 20.0, 기본: 0.0)
  languageCode?: string; // 언어 코드 (기본: 'ko-KR')
}

interface GeminiTTSResponse {
  audioUrl: string;
  duration: number; // 초 단위
  audioContent?: string; // Base64 인코딩된 오디오 데이터
}

/**
 * Gemini-TTS로 음성 생성
 * @param params TTS 파라미터
 * @returns 음성 파일 URL 및 길이
 */
export async function generateTTSWithGemini(
  params: GeminiTTSParams
): Promise<GeminiTTSResponse> {
  // Vertex AI API 키 우선 사용, 없으면 일반 Google AI API 키 사용
  const apiKey = process.env.GOOGLE_VERTEX_AI_API_KEY || 
                 process.env.GOOGLE_AI_API_KEY || 
                 process.env.GOOGLE_CLOUD_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_VERTEX_AI_API_KEY, GOOGLE_AI_API_KEY 또는 GOOGLE_CLOUD_API_KEY가 설정되지 않았습니다.');
  }

  // 프로젝트 ID 확인 (Vertex AI 사용 시 필수)
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'imagefactory-5ccc6';

  const languageCode = params.languageCode || 'ko-KR';
  const voiceName = params.voice || 'ko-KR-Neural2-A';
  const speakingRate = params.speed || 1.0;
  const pitch = params.pitch || 0.0;

  try {
    // Gemini-TTS는 Vertex AI를 통해 사용
    // 모델: gemini-2.5-flash-tts
    // 문서: https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
    // Vertex AI 엔드포인트 사용 (프로젝트 ID와 리전 필요)
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    // Vertex AI 엔드포인트 사용
    const apiUrl = projectId
      ? `https://${location}-texttospeech.googleapis.com/v1/projects/${projectId}/locations/${location}:synthesizeSpeech`
      : `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Vertex AI 사용 시 Authorization 헤더 필요
    if (projectId) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const requestBody: any = {
      input: {
        text: params.text,
      },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate,
        pitch,
      },
    };
    
    // Vertex AI 사용 시 모델 지정 가능
    if (projectId) {
      requestBody.model = 'gemini-2.5-flash-tts';
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini-TTS API 오류:', response.status, errorText);
      // 폴백: 일반 Google TTS 사용
      return await generateTTSWithGoogleFallback(params);
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      throw new Error('Gemini-TTS 응답에 audioContent가 없습니다.');
    }

    const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
    const duration = estimateDuration(params.text);

    return {
      audioUrl,
      duration,
      audioContent: data.audioContent,
    };
  } catch (error: any) {
    console.error('Gemini-TTS 오류:', error);
    // 폴백: 일반 Google TTS 사용
    return await generateTTSWithGoogleFallback(params);
  }
}

/**
 * 일반 Google Cloud TTS로 폴백
 */
async function generateTTSWithGoogleFallback(
  params: GeminiTTSParams
): Promise<GeminiTTSResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.');
  }

  const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        text: params.text,
      },
      voice: {
        languageCode: params.languageCode || 'ko-KR',
        name: params.voice || 'ko-KR-Neural2-A',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: params.speed || 1.0,
        pitch: params.pitch || 0.0,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS API 오류: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.audioContent) {
    throw new Error('Google TTS 응답에 audioContent가 없습니다.');
  }

  const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
  const duration = estimateDuration(params.text);

  return {
    audioUrl,
    duration,
    audioContent: data.audioContent,
  };
}

/**
 * 텍스트 길이로 음성 길이 추정 (초)
 */
function estimateDuration(text: string): number {
  const charCount = text.replace(/\s/g, '').length;
  return Math.ceil(charCount / 3.5);
}

/**
 * 여러 텍스트를 순차적으로 음성 생성
 */
export async function generateMultipleTTS(
  texts: string[],
  options?: { voice?: string; speed?: number; pitch?: number }
): Promise<Array<{ text: string; audioUrl: string; duration: number }>> {
  const results = [];
  
  for (const text of texts) {
    const result = await generateTTSWithGemini({
      text,
      ...options,
    });
    results.push({
      text,
      audioUrl: result.audioUrl,
      duration: result.duration,
    });
    
    // API Rate Limit 방지를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

