/**
 * 자막 생성 유틸리티
 * GPT를 사용하여 문장별 타임스탬프 생성
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SubtitleEntry {
  index: number;
  startTime: number; // 초
  endTime: number; // 초
  text: string;
}

interface SubtitleData {
  entries: SubtitleEntry[];
  format: 'srt' | 'vtt';
}

/**
 * GPT로 자막 타임스탬프 생성
 * @param narration 내레이션 텍스트
 * @param duration 영상 길이 (초)
 * @returns 자막 데이터
 */
export async function generateSubtitlesWithGPT(
  narration: string,
  duration: number
): Promise<SubtitleData> {
  const systemPrompt = `당신은 자막 제작 전문가입니다.
주어진 내레이션 텍스트를 ${duration}초 영상에 맞게 문장별로 분할하고,
각 문장의 시작 시간과 종료 시간을 계산해주세요.

JSON 형식으로 응답:
{
  "entries": [
    {
      "index": 1,
      "startTime": 0.0,
      "endTime": 2.5,
      "text": "첫 번째 문장"
    },
    {
      "index": 2,
      "startTime": 2.5,
      "endTime": 5.0,
      "text": "두 번째 문장"
    }
  ]
}

규칙:
- 각 문장은 2-4초 길이로 분할
- 자연스러운 구간에서 끊기
- 전체 길이가 ${duration}초를 넘지 않도록 조정
- 한국어 기준 1초에 약 3-4음절 속도`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-5.1',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: narration },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
  
  return {
    entries: result.entries || [],
    format: 'srt',
  };
}

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
 * SRT 시간 형식 (00:00:00,000)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * WebVTT 시간 형식 (00:00:00.000)
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}


