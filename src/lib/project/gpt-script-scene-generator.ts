/**
 * GPT-5.2 스크립트 및 씬 생성 모듈
 * 제안서에 따라 GPT-5.2를 사용하여 전체 스크립트와 3-7개의 씬을 생성합니다.
 * 한국어 문장 품질과 문체 제어력이 최고입니다.
 * 콘텐츠에 맞는 자막 스타일도 함께 생성합니다.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 자막 스타일 인터페이스
export interface GeneratedSubtitleStyle {
  // 기본 스타일
  fontName: string;           // 폰트 이름
  fontSize: number;           // 폰트 크기 (32-72)
  
  // 색상 (hex 또는 ASS 형식)
  primaryColor: string;       // 메인 텍스트 색상
  outlineColor: string;       // 테두리 색상
  backColor: string;          // 배경 색상
  
  // 효과
  bold: boolean;              // 굵게
  outline: number;            // 테두리 두께 (0-5)
  shadow: number;             // 그림자 (0-3)
  
  // 위치
  alignment: 2 | 5 | 8;       // 2: 하단, 5: 중앙, 8: 상단
  marginV: number;            // 상하 여백 (20-150)
  
  // 메타 정보
  styleName: string;          // 스타일 이름 (예: "에너지틱", "미니멀", "프리미엄")
  styleDescription: string;   // 스타일 설명
  mood: string;               // 무드 (예: "활기찬", "차분한", "전문적인")
}

interface ScriptSceneResult {
  script: string;              // 전체 스크립트
  scenes: Array<{
    index: number;
    prompt: string;            // Veo용 비주얼 프롬프트
    narration: string;         // 해당 씬의 내레이션
    duration: number;          // 초 단위 (기본 8초)
  }>;
  subtitleStyle: GeneratedSubtitleStyle;  // GPT가 생성한 자막 스타일
}

/**
 * GPT-5.2를 사용하여 스크립트와 씬을 생성합니다.
 * 제안서 권장: GPT-5.2는 한국어 문장 품질과 문체 제어력이 최고입니다.
 * @param confirmedPrompt 확인된 프롬프트
 * @returns 전체 스크립트와 씬 배열
 */
export async function generateScriptScenesWithGPT(
  confirmedPrompt: string
): Promise<ScriptSceneResult> {
  const systemPrompt = `당신은 숏폼 비디오 전문 작가이자 디자이너입니다. 스크립트, 씬, 그리고 콘텐츠에 맞는 자막 스타일을 함께 생성하세요.

🔴 절대 규칙:
1. 비디오 프롬프트(prompt)에는 절대로 한국어 텍스트, 한글, 또는 "Korean"이라는 단어를 포함하지 마세요.
2. 비디오는 순수하게 시각적 이미지만 포함해야 하며, 텍스트나 언어는 포함하지 않습니다.
3. 한국어는 오직 내레이션(narration)과 자막에서만 사용됩니다.

📏 내레이션 길이 규칙 (매우 중요):
- 각 씬의 내레이션은 반드시 8초 동안 읽을 수 있을 정도로 길어야 합니다.
- 한국어 기준으로 8초 동안 자연스럽게 읽으면 약 50-60자입니다.
- 최소 글자 수: 50자 이상 (한 글자도 빠지면 안 됩니다!)
- 내레이션이 짧으면 TTS가 짧아져서 비디오가 잘립니다.

✅ 올바른 예시:
- ❌ 나쁜 예: "이미지팩토리에 오신 것을 환영합니다." (19자, 약 3초)
- ✅ 좋은 예: "이미지팩토리에 오신 것을 환영합니다. 이 플랫폼에서는 단 한 번의 클릭으로 수백 장의 이미지를 생성할 수 있습니다." (51자, 약 8초)

🎨 자막 스타일 생성 규칙:
콘텐츠의 무드와 타겟에 맞는 자막 스타일을 설계하세요.

스타일 옵션:
- fontName: "AppleSDGothicNeo-Bold" (기본), "Noto Sans CJK KR" (깔끔), "NanumSquareRound" (친근)
- fontSize: 32-72 (릴스 세로영상 기준, 추천 48-56)
- primaryColor: 메인 텍스트 색상 (ASS 형식 &HBBGGRR 또는 hex #RRGGBB)
  - 흰색: "&H00FFFFFF" 또는 "#FFFFFF"
  - 노란색: "&H00FFFF00" 또는 "#FFFF00"
  - 밝은 파랑: "&H00FF9500" 또는 "#0095FF"
- outlineColor: 테두리 색상 (가독성을 위해 보통 검정 "&H00000000")
- backColor: 배경색 (반투명 검정 "&H80000000" 추천)
- bold: true/false
- outline: 0-5 (테두리 두께, 추천 2-4)
- shadow: 0-3 (그림자)
- alignment: 2 (하단 중앙), 5 (중앙), 8 (상단)
- marginV: 상하 여백 20-150 (릴스: 80-120 추천)

스타일 예시:
- 에너지틱/활기찬: 노란색 텍스트, 굵은 테두리, 큰 글씨
- 프리미엄/고급: 흰색 텍스트, 얇은 테두리, 중간 글씨
- 미니멀/차분: 흰색 텍스트, 테두리 없음, 반투명 배경
- 유튜브/캐주얼: 흰색 텍스트, 두꺼운 검정 테두리
- 넷플릭스/시네마틱: 흰색 텍스트, 그림자 효과

요구사항:
1. 전체 스크립트 작성 (모든 씬의 내레이션을 연결) - 한국어
2. 3-7개의 씬 생성 (각 씬은 정확히 8초 길이)
3. 각 씬의 내레이션은 반드시 50자 이상
4. 콘텐츠에 맞는 자막 스타일 1개 생성

JSON 응답 형식:
{
  "script": "전체 스크립트 텍스트 - 한국어",
  "scenes": [
    {
      "index": 0,
      "prompt": "영어 비주얼 프롬프트 (텍스트 없이 시각적 묘사만)",
      "narration": "한국어 내레이션 (50자 이상)",
      "duration": 8
    }
  ],
  "subtitleStyle": {
    "fontName": "AppleSDGothicNeo-Bold",
    "fontSize": 52,
    "primaryColor": "&H00FFFFFF",
    "outlineColor": "&H00000000",
    "backColor": "&H80000000",
    "bold": true,
    "outline": 3,
    "shadow": 1,
    "alignment": 2,
    "marginV": 100,
    "styleName": "프리미엄",
    "styleDescription": "고급스럽고 세련된 느낌의 자막",
    "mood": "전문적인"
  }
}

⚠️ 체크리스트:
- 모든 narration이 50자 이상인가요?
- 비디오 prompt에 한국어나 텍스트가 없나요?
- subtitleStyle이 콘텐츠 무드와 어울리나요?`;

  const userPrompt = `다음 프롬프트를 바탕으로 비디오 스크립트와 씬을 생성해주세요:\n\n${confirmedPrompt}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.1', // GPT-5.2가 없으면 최신 버전 사용
      messages: [
        { role: 'system', content: systemPrompt + '\n\n반드시 JSON 형식으로 응답하세요.' },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('GPT 응답이 비어있습니다.');
    }

    // JSON 파싱
    let result: ScriptSceneResult;
    try {
      // 마크다운 코드 블록 제거
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(jsonContent);
    } catch (parseError: any) {
      // JSON 블록 추출 시도
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error(`JSON 파싱 실패: ${parseError.message}`);
      }
    }

    // 내레이션 길이 검증 및 경고
    const validatedScenes = (result.scenes || []).map((scene: any, index: number) => {
      const narration = scene.narration || '';
      if (narration.length < 50) {
        console.warn(`⚠️  씬 ${index + 1} 내레이션이 너무 짧습니다: ${narration.length}자 (최소 50자 필요)`);
      }
      return {
        index: scene.index ?? index,
        prompt: scene.prompt || '',
        narration: narration,
        duration: scene.duration ?? 8,
      };
    });

    // 자막 스타일 검증 및 기본값 설정
    const subtitleStyle = validateSubtitleStyle(result.subtitleStyle);

    console.log(`✅ 자막 스타일 생성됨: ${subtitleStyle.styleName} (${subtitleStyle.mood})`);

    return {
      script: result.script || '',
      scenes: validatedScenes,
      subtitleStyle,
    };
  } catch (error: any) {
    console.error('GPT 스크립트/씬 생성 오류:', error);
    throw new Error(`스크립트 생성 실패: ${error.message}`);
  }
}

/**
 * 자막 스타일 검증 및 기본값 설정
 */
function validateSubtitleStyle(style: any): GeneratedSubtitleStyle {
  const defaultStyle: GeneratedSubtitleStyle = {
    fontName: 'AppleSDGothicNeo-Bold',
    fontSize: 52,
    primaryColor: '&H00FFFFFF',
    outlineColor: '&H00000000',
    backColor: '&H80000000',
    bold: true,
    outline: 3,
    shadow: 1,
    alignment: 2,
    marginV: 100,
    styleName: '기본',
    styleDescription: '깔끔하고 가독성 좋은 기본 스타일',
    mood: '중립적',
  };

  if (!style) return defaultStyle;

  // Hex 색상을 ASS 형식으로 변환
  const convertColor = (color: string): string => {
    if (!color) return defaultStyle.primaryColor;
    if (color.startsWith('&H')) return color;
    if (color.startsWith('#')) {
      // #RRGGBB -> &H00BBGGRR
      const hex = color.slice(1);
      const r = hex.slice(0, 2);
      const g = hex.slice(2, 4);
      const b = hex.slice(4, 6);
      return `&H00${b}${g}${r}`;
    }
    return color;
  };

  return {
    fontName: style.fontName || defaultStyle.fontName,
    fontSize: Math.min(72, Math.max(32, style.fontSize || defaultStyle.fontSize)),
    primaryColor: convertColor(style.primaryColor),
    outlineColor: convertColor(style.outlineColor),
    backColor: convertColor(style.backColor),
    bold: style.bold ?? defaultStyle.bold,
    outline: Math.min(5, Math.max(0, style.outline ?? defaultStyle.outline)),
    shadow: Math.min(3, Math.max(0, style.shadow ?? defaultStyle.shadow)),
    alignment: [2, 5, 8].includes(style.alignment) ? style.alignment : defaultStyle.alignment,
    marginV: Math.min(150, Math.max(20, style.marginV || defaultStyle.marginV)),
    styleName: style.styleName || defaultStyle.styleName,
    styleDescription: style.styleDescription || defaultStyle.styleDescription,
    mood: style.mood || defaultStyle.mood,
  };
}

