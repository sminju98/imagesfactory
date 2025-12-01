/**
 * Google Cloud Text-to-Speech (TTS) 유틸리티
 * Reels Factory Step5: 음성 합성
 * 문서: https://cloud.google.com/text-to-speech/docs
 */

interface GoogleTTSParams {
  text: string;
  voice?: string; // 음성 종류 (기본: 한국어 여성)
  // 한국어 음성 옵션:
  // - 'ko-KR-Standard-A': 한국어 여성 음성 (Standard)
  // - 'ko-KR-Standard-B': 한국어 남성 음성 (Standard)
  // - 'ko-KR-Standard-C': 한국어 여성 음성 2 (Standard)
  // - 'ko-KR-Standard-D': 한국어 남성 음성 2 (Standard)
  // - 'ko-KR-Wavenet-A': 한국어 여성 음성 (Wavenet, 고품질)
  // - 'ko-KR-Wavenet-B': 한국어 남성 음성 (Wavenet, 고품질)
  // - 'ko-KR-Wavenet-C': 한국어 여성 음성 2 (Wavenet, 고품질)
  // - 'ko-KR-Wavenet-D': 한국어 남성 음성 2 (Wavenet, 고품질)
  // - 'ko-KR-Neural2-A': 한국어 여성 음성 (Neural2, 최신)
  // - 'ko-KR-Neural2-B': 한국어 남성 음성 (Neural2, 최신)
  // - 'ko-KR-Neural2-C': 한국어 여성 음성 2 (Neural2, 최신)
  speed?: number; // 속도 (0.25 ~ 4.0, 기본: 1.0)
  pitch?: number; // 음높이 (-20.0 ~ 20.0, 기본: 0.0)
  languageCode?: string; // 언어 코드 (기본: 'ko-KR')
}

interface GoogleTTSResponse {
  audioUrl: string;
  duration: number; // 초 단위
  audioContent?: string; // Base64 인코딩된 오디오 데이터
}

/**
 * Google Cloud TTS로 음성 생성
 * @param params TTS 파라미터
 * @returns 음성 파일 URL 및 길이
 */
export async function generateTTSWithGoogle(
  params: GoogleTTSParams
): Promise<GoogleTTSResponse> {
  // TTS 전용 OAuth2 토큰 우선 사용, 없으면 일반 Google AI API 키 사용
  const oauthToken = process.env.GOOGLE_TTS_API_KEY;
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;
  
  if (!oauthToken && !apiKey) {
    throw new Error('GOOGLE_TTS_API_KEY (OAuth2 토큰) 또는 GOOGLE_AI_API_KEY가 설정되지 않았습니다.');
  }

  const languageCode = params.languageCode || 'ko-KR';
  const voiceName = params.voice || 'ko-KR-Neural2-A'; // 최신 Neural2 모델 사용
  const speakingRate = params.speed || 1.0;
  const pitch = params.pitch || 0.0;

  try {
    // OAuth2 토큰이 있으면 Bearer 토큰으로 사용, 없으면 API 키 사용
    const apiUrl = oauthToken 
      ? `https://texttospeech.googleapis.com/v1/text:synthesize`
      : `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // OAuth2 토큰이 있으면 Authorization 헤더에 추가
    if (oauthToken) {
      headers['Authorization'] = `Bearer ${oauthToken}`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
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

    // Base64 디코딩된 오디오 데이터를 Firebase Storage에 업로드
    // 일단 임시로 Base64 데이터 URL 반환 (실제로는 Storage에 업로드 필요)
    const audioContent = data.audioContent;
    const audioUrl = `data:audio/mp3;base64,${audioContent}`;
    
    // 오디오 길이 추정 (실제로는 오디오 파일을 파싱하여 정확한 길이 계산 필요)
    const duration = estimateDuration(params.text);

    return {
      audioUrl,
      duration,
      audioContent,
    };
  } catch (error: any) {
    console.error('Google TTS 오류:', error);
    throw error;
  }
}

/**
 * 텍스트 길이로 음성 길이 추정 (초)
 * 한국어 기준: 1초에 약 3-4음절
 */
function estimateDuration(text: string): number {
  // 간단한 추정: 공백 제거 후 글자 수 / 3.5
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
    const result = await generateTTSWithGoogle({
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

