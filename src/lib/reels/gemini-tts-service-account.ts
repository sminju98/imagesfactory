/**
 * Gemini-TTS (Text-to-Speech) 유틸리티 (서비스 계정 인증)
 * Reels Factory Step5: 음성 합성
 * 문서: https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
 */

import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import * as path from 'path';

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

// Text-to-Speech 클라이언트 초기화
function getTTSClient(): TextToSpeechClient {
  // 서비스 계정 JSON 파일 경로 확인
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                         path.join(process.cwd(), 'imagefactory-5ccc6-ef0b85c83dfe.json');
  
  // 프로젝트 ID
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'imagefactory-5ccc6';
  
  return new TextToSpeechClient({
    keyFilename: credentialsPath,
    projectId,
  });
}

/**
 * Gemini-TTS로 음성 생성 (서비스 계정 인증)
 * @param params TTS 파라미터
 * @returns 음성 파일 URL 및 길이
 */
export async function generateTTSWithGemini(
  params: GeminiTTSParams
): Promise<GeminiTTSResponse> {
  const languageCode = params.languageCode || 'ko-KR';
  const voiceName = params.voice || 'ko-KR-Neural2-A';
  const speakingRate = params.speed || 1.0;
  const pitch = params.pitch || 0.0;

  try {
    const client = getTTSClient();

    // Gemini TTS 모델 사용
    // 모델: gemini-2.5-flash-tts
    const request: any = {
      input: {
        text: params.text,
      },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate,
        pitch,
      },
      // Gemini TTS 모델 지정
      model: 'gemini-2.5-flash-tts',
    };

    const [response] = await client.synthesizeSpeech(request);
    
    if (!response.audioContent) {
      throw new Error('Gemini-TTS 응답에 audioContent가 없습니다.');
    }

    const audioContent = Buffer.from(response.audioContent).toString('base64');
    const audioUrl = `data:audio/mp3;base64,${audioContent}`;
    const duration = estimateDuration(params.text);

    return {
      audioUrl,
      duration,
      audioContent,
    };
  } catch (error: any) {
    console.error('Gemini-TTS 오류:', error);
    throw error;
  }
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


