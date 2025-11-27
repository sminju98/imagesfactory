// GPT를 이용한 프롬프트 번역
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 한글 프롬프트를 영문으로 번역
 * Google Translate 대신 GPT 사용 (더 자연스럽고 문맥 이해)
 */
export async function translatePromptToEnglish(koreanPrompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.1', // GPT-5.1 사용
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in image generation prompts. 
Translate Korean prompts to English while preserving the artistic intent and details. 
Keep the translation natural and suitable for AI image generation.
Only return the translated text, nothing else.`,
        },
        {
          role: 'user',
          content: koreanPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return response.choices[0].message.content || koreanPrompt;
  } catch (error) {
    console.error('Translation error:', error);
    // 번역 실패 시 원본 반환
    return koreanPrompt;
  }
}

/**
 * 프롬프트가 한글인지 확인
 */
export function isKorean(text: string): boolean {
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
  return koreanRegex.test(text);
}

/**
 * 프롬프트 개선 (선택 기능)
 */
export async function improvePrompt(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.1', // GPT-5.1 사용
      messages: [
        {
          role: 'system',
          content: `You are an expert in AI image generation prompts. 
Enhance the user's prompt to generate better images by adding relevant details about:
- Art style
- Lighting
- Composition
- Quality terms
Keep it concise and natural. Only return the improved prompt.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content || prompt;
  } catch (error) {
    console.error('Prompt improvement error:', error);
    return prompt;
  }
}

