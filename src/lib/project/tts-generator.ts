/**
 * TTS 생성기
 * OpenAI TTS API를 사용하여 내레이션 음성 생성
 */

import OpenAI from 'openai';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 음성 타입
export type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface TTSResult {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
}

/**
 * OpenAI TTS로 음성 생성
 * @param text 내레이션 텍스트
 * @param voice 음성 타입
 * @returns 오디오 URL 및 길이
 */
export async function generateTTS(
  text: string,
  voice: VoiceType = 'nova'
): Promise<TTSResult> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('텍스트가 비어있습니다.');
    }

    // TTS 생성
    const response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice,
      input: text,
      response_format: 'mp3',
      speed: 1.0,
    });

    // ArrayBuffer로 변환
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 오디오 길이 추정 (MP3 비트레이트 기준)
    // TTS-1-HD는 약 192kbps, 1초 = 약 24KB
    const estimatedDuration = buffer.length / 24000;

    // Firebase Storage에 업로드
    const audioUrl = await uploadTTSToStorage(buffer);

    return {
      success: true,
      audioUrl,
      duration: Math.round(estimatedDuration * 10) / 10, // 소수점 1자리
    };
  } catch (error: any) {
    console.error('TTS 생성 오류:', error);
    return {
      success: false,
      error: error.message || 'TTS 생성 실패',
    };
  }
}

/**
 * Firebase Storage에 TTS 오디오 업로드
 */
async function uploadTTSToStorage(buffer: Buffer): Promise<string> {
  try {
    // 서버 사이드에서는 firebase-admin 사용
    const admin = await import('firebase-admin');
    
    if (!admin.apps.length) {
      // 이미 초기화되어 있을 것으로 예상
      console.warn('Firebase Admin이 초기화되지 않았습니다.');
    }

    const bucket = admin.storage().bucket();
    const fileName = `tts/${uuidv4()}.mp3`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: 'audio/mpeg',
      },
    });

    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error: any) {
    console.error('Storage 업로드 오류:', error);
    
    // 폴백: Base64 Data URL 반환 (개발/테스트용)
    const base64 = buffer.toString('base64');
    return `data:audio/mpeg;base64,${base64}`;
  }
}

/**
 * 여러 씬의 TTS 병렬 생성
 */
export async function generateTTSForScenes(
  scenes: Array<{ sceneId: string; narration: string }>,
  voice: VoiceType = 'nova'
): Promise<Array<{ sceneId: string; result: TTSResult }>> {
  const promises = scenes.map(async (scene) => {
    const result = await generateTTS(scene.narration, voice);
    return { sceneId: scene.sceneId, result };
  });

  return Promise.all(promises);
}

/**
 * 텍스트 기반 예상 오디오 길이 계산
 * @param text 텍스트
 * @param language 언어
 * @returns 예상 길이 (초)
 */
export function estimateAudioDuration(
  text: string,
  language: 'ko' | 'en' = 'ko'
): number {
  if (language === 'ko') {
    // 한국어: 초당 약 3-4음절 (평균 3.5)
    const syllables = text.replace(/[^\uAC00-\uD7A3]/g, '').length;
    const otherChars = text.replace(/[\uAC00-\uD7A3]/g, '').replace(/\s/g, '').length;
    return (syllables / 3.5) + (otherChars / 10);
  } else {
    // 영어: 초당 약 2-3단어 (평균 2.5)
    const words = text.split(/\s+/).length;
    return words / 2.5;
  }
}

/**
 * 음성 옵션 정보
 */
export const VOICE_OPTIONS: Record<VoiceType, {
  label: string;
  description: string;
  gender: 'neutral' | 'male' | 'female';
}> = {
  alloy: {
    label: 'Alloy',
    description: '중성적이고 균형잡힌 목소리',
    gender: 'neutral',
  },
  echo: {
    label: 'Echo',
    description: '남성적이고 깊은 목소리',
    gender: 'male',
  },
  fable: {
    label: 'Fable',
    description: '영국식 억양의 목소리',
    gender: 'neutral',
  },
  onyx: {
    label: 'Onyx',
    description: '남성적이고 권위있는 목소리',
    gender: 'male',
  },
  nova: {
    label: 'Nova',
    description: '여성적이고 부드러운 목소리',
    gender: 'female',
  },
  shimmer: {
    label: 'Shimmer',
    description: '여성적이고 따뜻한 목소리',
    gender: 'female',
  },
};
