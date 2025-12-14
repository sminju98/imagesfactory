/**
 * 개선된 자막 생성 엔진
 * - TTS 오디오 길이 기반 타이밍
 * - ASS/SRT 형식 지원
 * - 한국어/영어 문장 분할 최적화
 * - 스타일 커스터마이징
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============ 타입 정의 ============

export interface SubtitleEntry {
  index: number;
  startTime: number; // 초
  endTime: number;   // 초
  text: string;
}

export interface SubtitleData {
  sceneId: string;
  entries: SubtitleEntry[];
  totalDuration: number;
}

export interface SubtitleStyle {
  fontName: string;
  fontSize: number;
  primaryColor: string;    // &HBBGGRR (ASS 형식)
  outlineColor: string;
  backColor: string;
  bold: boolean;
  outline: number;
  shadow: number;
  marginV: number;         // 하단 여백
  alignment: 2 | 5 | 8;    // 2: 하단중앙, 5: 중앙, 8: 상단중앙
}

export interface GenerateSubtitleOptions {
  language: 'ko' | 'en';
  audioDuration: number;   // TTS 오디오 실제 길이 (초)
  videoDuration?: number;  // 비디오 길이 (초, 기본 8초)
  style?: Partial<SubtitleStyle>;
}

// ============ 기본 스타일 ============

const DEFAULT_STYLE: SubtitleStyle = {
  fontName: 'AppleSDGothicNeo-Bold',
  fontSize: 48,
  primaryColor: '&H00FFFFFF',  // 흰색
  outlineColor: '&H00000000',  // 검정 테두리
  backColor: '&H80000000',     // 반투명 검정 배경
  bold: true,
  outline: 3,
  shadow: 1,
  marginV: 40,
  alignment: 2,
};

// 플랫폼별 폰트 설정
const FONT_FALLBACKS = {
  ko: ['AppleSDGothicNeo-Bold', 'Noto Sans CJK KR', 'NanumGothic', 'Malgun Gothic'],
  en: ['Inter', 'Helvetica Neue', 'Arial'],
};

// ============ 핵심 함수 ============

/**
 * GPT를 사용하여 자막 생성 (TTS 길이 기반)
 */
export async function generateSubtitles(
  narration: string,
  sceneId: string,
  options: GenerateSubtitleOptions
): Promise<SubtitleData> {
  const { language, audioDuration, videoDuration = 8 } = options;
  
  // 실제 사용할 duration은 TTS 오디오 길이 기준
  const targetDuration = audioDuration || videoDuration;
  
  const systemPrompt = `당신은 전문 자막 제작자입니다.
주어진 내레이션을 ${targetDuration.toFixed(1)}초 길이에 맞게 자막으로 분할해주세요.

규칙:
1. 각 자막은 자연스러운 구간에서 끊어야 합니다
2. ${language === 'ko' ? '한국어는 초당 약 3-4음절' : '영어는 초당 약 2-3단어'} 속도로 계산
3. 각 자막은 최소 1.5초, 최대 4초 길이
4. 전체 자막이 ${targetDuration.toFixed(1)}초를 초과하지 않도록 조정
5. 문장이 길면 의미 단위로 분할
6. 쉼표, 마침표 등 구두점에서 자연스럽게 분할

JSON 형식으로 응답:
{
  "entries": [
    {
      "index": 1,
      "startTime": 0.0,
      "endTime": 2.5,
      "text": "첫 번째 자막"
    },
    {
      "index": 2,
      "startTime": 2.5,
      "endTime": 5.0,
      "text": "두 번째 자막"
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini', // 빠른 응답을 위해 GPT-5-mini 사용
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `내레이션: "${narration}"\n오디오 길이: ${targetDuration.toFixed(1)}초` },
      ],
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('GPT 응답이 비어있습니다.');
    }

    const result = JSON.parse(content);
    
    // 타이밍 검증 및 조정
    const entries = validateAndAdjustTimings(result.entries || [], targetDuration);
    
    return {
      sceneId,
      entries,
      totalDuration: targetDuration,
    };
  } catch (error: any) {
    console.error('자막 생성 오류:', error);
    
    // 폴백: 단순 분할
    return fallbackSubtitleGeneration(narration, sceneId, targetDuration, language);
  }
}

/**
 * 타이밍 검증 및 조정
 */
function validateAndAdjustTimings(
  entries: SubtitleEntry[],
  totalDuration: number
): SubtitleEntry[] {
  if (entries.length === 0) return [];
  
  const adjusted: SubtitleEntry[] = [];
  let currentTime = 0;
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const duration = entry.endTime - entry.startTime;
    
    // 최소/최대 duration 제한
    const adjustedDuration = Math.max(1.5, Math.min(4, duration));
    
    adjusted.push({
      index: i + 1,
      startTime: currentTime,
      endTime: Math.min(currentTime + adjustedDuration, totalDuration),
      text: entry.text,
    });
    
    currentTime += adjustedDuration;
    
    // 전체 duration 초과 시 중단
    if (currentTime >= totalDuration) break;
  }
  
  // 마지막 자막이 전체 duration을 채우도록 조정
  if (adjusted.length > 0) {
    const last = adjusted[adjusted.length - 1];
    if (last.endTime < totalDuration - 0.5) {
      last.endTime = totalDuration;
    }
  }
  
  return adjusted;
}

/**
 * 폴백 자막 생성 (GPT 실패 시)
 */
function fallbackSubtitleGeneration(
  narration: string,
  sceneId: string,
  totalDuration: number,
  language: 'ko' | 'en'
): SubtitleData {
  const sentences = splitIntoSentences(narration, language);
  const entries: SubtitleEntry[] = [];
  
  const durationPerSentence = totalDuration / sentences.length;
  let currentTime = 0;
  
  sentences.forEach((sentence, index) => {
    const duration = Math.max(1.5, Math.min(4, durationPerSentence));
    entries.push({
      index: index + 1,
      startTime: currentTime,
      endTime: Math.min(currentTime + duration, totalDuration),
      text: sentence.trim(),
    });
    currentTime += duration;
  });
  
  return {
    sceneId,
    entries,
    totalDuration,
  };
}

/**
 * 문장 분할 (한국어/영어)
 */
function splitIntoSentences(text: string, language: 'ko' | 'en'): string[] {
  if (language === 'ko') {
    // 한국어: 마침표, 물음표, 느낌표, 쉼표+띄어쓰기로 분할
    const sentences = text.split(/(?<=[.?!])\s+|(?<=,)\s+(?=\S{10,})/);
    return sentences.filter(s => s.trim().length > 0);
  } else {
    // 영어: 마침표, 물음표, 느낌표로 분할
    const sentences = text.split(/(?<=[.?!])\s+/);
    return sentences.filter(s => s.trim().length > 0);
  }
}

// ============ SRT 형식 ============

/**
 * SRT 형식으로 변환
 */
export function convertToSRT(subtitleData: SubtitleData): string {
  return subtitleData.entries
    .map((entry) => {
      const startTime = formatSRTTime(entry.startTime);
      const endTime = formatSRTTime(entry.endTime);
      return `${entry.index}\n${startTime} --> ${endTime}\n${entry.text}\n`;
    })
    .join('\n');
}

/**
 * SRT 시간 형식 (00:00:00,000)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(milliseconds, 3)}`;
}

// ============ ASS 형식 ============

/**
 * ASS 형식으로 변환 (고급 스타일링)
 */
export function convertToASS(
  subtitleData: SubtitleData,
  customStyle?: Partial<SubtitleStyle>,
  videoWidth: number = 1080,
  videoHeight: number = 1920
): string {
  const style = { ...DEFAULT_STYLE, ...customStyle };
  
  const header = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontName},${style.fontSize},${style.primaryColor},${style.primaryColor},${style.outlineColor},${style.backColor},${style.bold ? -1 : 0},0,0,0,100,100,0,0,1,${style.outline},${style.shadow},${style.alignment},20,20,${style.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const dialogues = subtitleData.entries
    .map((entry) => {
      const startTime = formatASSTime(entry.startTime);
      const endTime = formatASSTime(entry.endTime);
      // ASS에서 줄바꿈은 \N 사용
      const text = entry.text.replace(/\n/g, '\\N');
      return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}`;
    })
    .join('\n');

  return header + dialogues;
}

/**
 * ASS 시간 형식 (0:00:00.00)
 */
function formatASSTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours}:${pad(minutes)}:${secs.toFixed(2).padStart(5, '0')}`;
}

// ============ WebVTT 형식 ============

/**
 * WebVTT 형식으로 변환
 */
export function convertToWebVTT(subtitleData: SubtitleData): string {
  const header = 'WEBVTT\n\n';
  const body = subtitleData.entries
    .map((entry) => {
      const startTime = formatVTTTime(entry.startTime);
      const endTime = formatVTTTime(entry.endTime);
      return `${startTime} --> ${endTime}\n${entry.text}\n`;
    })
    .join('\n');
  return header + body;
}

/**
 * WebVTT 시간 형식 (00:00:00.000)
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(milliseconds, 3)}`;
}

// ============ 유틸리티 ============

function pad(num: number, size: number = 2): string {
  return String(num).padStart(size, '0');
}

/**
 * 플랫폼에 맞는 폰트 선택
 */
export function getSystemFont(language: 'ko' | 'en', platform: 'macos' | 'linux' | 'windows'): string {
  const fonts = FONT_FALLBACKS[language];
  
  switch (platform) {
    case 'macos':
      return language === 'ko' ? 'AppleSDGothicNeo-Bold' : 'Helvetica Neue';
    case 'linux':
      return language === 'ko' ? 'Noto Sans CJK KR' : 'DejaVu Sans';
    case 'windows':
      return language === 'ko' ? 'Malgun Gothic' : 'Segoe UI';
    default:
      return fonts[0];
  }
}

/**
 * 자막 스타일 프리셋
 */
export const SUBTITLE_PRESETS = {
  // 기본 스타일
  default: DEFAULT_STYLE,
  
  // 모던 스타일 (반투명 박스)
  modern: {
    ...DEFAULT_STYLE,
    fontSize: 42,
    outline: 0,
    backColor: '&H80000000',
    marginV: 60,
  },
  
  // 유튜브 스타일
  youtube: {
    ...DEFAULT_STYLE,
    fontSize: 52,
    primaryColor: '&H00FFFFFF',
    outlineColor: '&H00000000',
    outline: 4,
    shadow: 0,
    marginV: 50,
  },
  
  // 넷플릭스 스타일
  netflix: {
    ...DEFAULT_STYLE,
    fontName: 'Netflix Sans',
    fontSize: 44,
    primaryColor: '&H00FFFFFF',
    outlineColor: '&H40000000',
    outline: 2,
    shadow: 2,
    marginV: 55,
  },
  
  // 인스타그램 릴스 스타일
  reels: {
    ...DEFAULT_STYLE,
    fontSize: 56,
    primaryColor: '&H00FFFFFF',
    outlineColor: '&H00000000',
    outline: 3,
    shadow: 1,
    marginV: 100,
    alignment: 2,
  },
};

// ============ 여러 씬 처리 ============

/**
 * 여러 씬의 자막을 연속으로 생성
 */
export async function generateSubtitlesForScenes(
  scenes: Array<{
    sceneId: string;
    narration: string;
    audioDuration: number;
    videoDuration?: number;
  }>,
  language: 'ko' | 'en'
): Promise<SubtitleData[]> {
  const results: SubtitleData[] = [];
  let cumulativeTime = 0;
  
  for (const scene of scenes) {
    const subtitleData = await generateSubtitles(
      scene.narration,
      scene.sceneId,
      {
        language,
        audioDuration: scene.audioDuration,
        videoDuration: scene.videoDuration,
      }
    );
    
    // 누적 시간 적용 (전체 영상에서의 위치)
    const adjustedEntries = subtitleData.entries.map(entry => ({
      ...entry,
      startTime: entry.startTime + cumulativeTime,
      endTime: entry.endTime + cumulativeTime,
    }));
    
    results.push({
      ...subtitleData,
      entries: adjustedEntries,
    });
    
    cumulativeTime += subtitleData.totalDuration;
  }
  
  return results;
}

/**
 * 여러 씬의 자막을 하나의 파일로 합치기
 */
export function mergeSubtitles(subtitleDataArray: SubtitleData[]): SubtitleData {
  const mergedEntries: SubtitleEntry[] = [];
  let index = 1;
  
  for (const data of subtitleDataArray) {
    for (const entry of data.entries) {
      mergedEntries.push({
        ...entry,
        index: index++,
      });
    }
  }
  
  const totalDuration = subtitleDataArray.reduce(
    (sum, data) => sum + data.totalDuration,
    0
  );
  
  return {
    sceneId: 'merged',
    entries: mergedEntries,
    totalDuration,
  };
}
