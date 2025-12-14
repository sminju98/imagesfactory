/**
 * GPT 프롬프트 교정기
 * GPT-5.1을 사용하여 사용자 입력 프롬프트를 최적화
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PromptCorrectionResult {
  correctedPrompt: string;
  improvements: string[];
}

/**
 * GPT로 프롬프트 교정
 * @param rawPrompt 원본 사용자 프롬프트
 * @param language 언어 (ko/en)
 * @returns 교정된 프롬프트
 */
export async function correctPromptWithGPT(
  rawPrompt: string,
  language: 'ko' | 'en' = 'ko'
): Promise<PromptCorrectionResult> {
  const systemPrompt = `당신은 AI 비디오 콘텐츠 프롬프트 최적화 전문가입니다.
사용자가 입력한 프롬프트를 분석하고, Veo3 비디오 생성에 최적화된 프롬프트로 개선해주세요.

개선 원칙:
1. 모호한 표현을 구체적으로 변환
2. 시각적 요소 강화 (색상, 조명, 앵글, 분위기)
3. 동작과 움직임 명확화
4. 불필요한 텍스트 요소 제거 요청 명시
5. ${language === 'ko' ? '한국어' : '영어'}로 응답

JSON 형식으로 응답:
{
  "correctedPrompt": "개선된 프롬프트 (${language === 'ko' ? '한국어' : '영어'})",
  "improvements": [
    "개선 사항 1",
    "개선 사항 2"
  ]
}

주의사항:
- 원본 의도를 유지하면서 품질 향상
- 비디오 생성에 적합한 구체적 묘사 추가
- 텍스트 오버레이 요청은 제거 (자막으로 대체)`;

  const userPrompt = `다음 프롬프트를 개선해주세요:\n\n"${rawPrompt}"`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini', // 빠른 응답을 위해 GPT-5-mini 사용
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('GPT 응답이 비어있습니다.');
      return {
        correctedPrompt: rawPrompt,
        improvements: ['프롬프트 교정을 수행할 수 없었습니다.'],
      };
    }

    // JSON 파싱 (마크다운 코드블록 제거)
    let result: any;
    try {
      const jsonContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      result = JSON.parse(jsonContent);
    } catch (parseError) {
      // JSON 추출 시도
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw parseError;
      }
    }

    return {
      correctedPrompt: result.correctedPrompt || rawPrompt,
      improvements: result.improvements || [],
    };
  } catch (error: any) {
    console.error('프롬프트 교정 오류:', error);
    throw new Error(`프롬프트 교정 실패: ${error.message}`);
  }
}
