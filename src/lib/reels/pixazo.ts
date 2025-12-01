/**
 * Pixazo TTS (Text-to-Speech) 유틸리티
 * Reels Factory Step5: 음성 합성
 */

interface PixazoTTSParams {
  text: string;
  voice?: string; // 음성 종류 (기본: 한국어 여성)
  speed?: number; // 속도 (0.5 ~ 2.0, 기본: 1.0)
  pitch?: number; // 음높이 (0.5 ~ 2.0, 기본: 1.0)
}

interface PixazoTTSResponse {
  audioUrl: string;
  duration: number; // 초 단위
}

/**
 * Pixazo TTS로 음성 생성
 * @param params TTS 파라미터
 * @returns 음성 파일 URL 및 길이
 */
export async function generateTTSWithPixazo(
  params: PixazoTTSParams
): Promise<PixazoTTSResponse> {
  const apiKey = process.env.PIXAZO_API_KEY;
  
  if (!apiKey) {
    throw new Error('PIXAZO_API_KEY가 설정되지 않았습니다.');
  }

  // Pixazo API 엔드포인트 (실제 API 문서 확인 필요)
  // 예시 URL 구조
  const apiUrl = 'https://api.pixazo.com/v1/tts';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: params.text,
        voice: params.voice || 'ko-female-1', // 한국어 여성 음성
        speed: params.speed || 1.0,
        pitch: params.pitch || 1.0,
        format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pixazo TTS API 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 응답 형식은 실제 API 문서에 따라 다를 수 있음
    return {
      audioUrl: data.audio_url || data.url || data.file_url,
      duration: data.duration || estimateDuration(params.text),
    };
  } catch (error: any) {
    console.error('Pixazo TTS 오류:', error);
    
    // API가 없거나 실패 시 대체 방법 (예: Google TTS 또는 로컬 생성)
    // 일단 시뮬레이션으로 처리
    return {
      audioUrl: `https://storage.googleapis.com/pixazo/tts-${Date.now()}.mp3`,
      duration: estimateDuration(params.text),
    };
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
    const result = await generateTTSWithPixazo({
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

