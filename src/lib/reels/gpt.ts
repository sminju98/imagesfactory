/**
 * GPT를 사용한 Reels Factory 기능
 * - Step0: 프롬프트 교정
 * - Step2: 콘셉트 기획
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Step0: 프롬프트 교정
 */
export async function refinePromptWithGPT(prompt: string): Promise<{
  refinedPrompt: string;
  improvements: string[];
}> {
  // 오늘 날짜 가져오기
  const today = new Date();
  const todayStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const todayISO = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식

  const systemPrompt = `당신은 릴스 콘텐츠 전문가입니다.
사용자의 프롬프트를 분석하여 더 효과적인 릴스 제작을 위한 프롬프트로 교정해주세요.

오늘 날짜: ${todayStr} (${todayISO})

교정 원칙:
1. 명확하고 구체적인 표현 사용
2. 타겟 오디언스 고려
3. 트렌디한 표현 추가
4. 감성적 호소력 강화
5. 40초 릴스에 적합한 내용
6. 시각적으로 표현 가능한 내용으로 변환
7. 시의성이 중요한 정보(뉴스, 트렌드, 이벤트 등)가 포함된 경우:
   - 오늘 날짜(${todayStr})를 참고하여 최근 7일~30일간의 최신 정보를 찾도록 지시
   - "최근 n일간", "2025년 최신", "오늘 기준" 등의 표현을 추가하여 시의성 강조
   - 날짜 관련 정보는 반드시 오늘 날짜를 기준으로 명시

JSON 형식으로 응답:
{
  "refinedPrompt": "교정된 프롬프트 (시의성이 중요하면 날짜 기준 명시)",
  "improvements": ["개선점1", "개선점2", ...]
}`;

  const userPromptWithDate = `${prompt}\n\n위 프롬프트에서 시의성이 중요한 정보가 있다면, 오늘 날짜(${todayStr})를 참고하여 최근 정보를 찾도록 프롬프트를 교정해주세요.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-5.1-mini', // 빠른 응답을 위한 미니 모델
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPromptWithDate },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
  
  return {
    refinedPrompt: result.refinedPrompt || prompt,
    improvements: result.improvements || [],
  };
}

/**
 * Perplexity 리서치 결과에서 키워드 후보 추출 (GPT 사용)
 */
export async function extractKeywordsFromResearch(
  researchResults: string
): Promise<Array<{
  id: string;
  category: 'keyword' | 'painpoint' | 'trend' | 'usp' | 'expression' | 'general';
  content: string;
  selected: boolean;
}>> {
  const systemPrompt = `당신은 마케팅 키워드 분석 전문가입니다.
Perplexity 리서치 결과를 분석하여 릴스 제작에 활용할 수 있는 키워드 후보를 추출해주세요.

각 키워드는 다음 카테고리로 분류:
- keyword: 검색 키워드, 트렌드 키워드
- painpoint: 소비자 페인포인트, 니즈
- trend: 최신 트렌드, 밈
- usp: 차별화 포인트, USP
- expression: 마케팅 표현, 문구
- general: 기타 유용한 인사이트

JSON 형식:
{
  "keywords": [
    { "id": "1", "category": "keyword", "content": "키워드 내용" },
    { "id": "2", "category": "painpoint", "content": "페인포인트 내용" },
    ...
  ]
}`;

  const userPrompt = `다음은 Perplexity 리서치 결과입니다. 릴스 제작에 활용할 수 있는 키워드 후보를 추출해주세요:

${researchResults}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-5.1',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
  const keywords = result.keywords || [];
  
  return keywords.map((keyword: any, index: number) => ({
    id: keyword.id || `keyword-${Date.now()}-${index}`,
    category: keyword.category || 'general',
    content: keyword.content || '',
    selected: false,
  }));
}

/**
 * Step2: 콘셉트 기획
 */
export async function generateConceptsWithGPT(
  refinedPrompt: string,
  insights: string[],
  options: { target: string; tone: string; purpose: string }
): Promise<Array<{
  id: string;
  title: string;
  hook: string;
  flow: string;
  cta: string;
  summary: string;
  selected: boolean;
}>> {
  const systemPrompt = `당신은 SNS 릴스 콘텐츠 기획자입니다.
주어진 정보를 바탕으로 40초 릴스를 위한 콘셉트 3개를 제안해주세요.

각 콘셉트는 다음을 포함:
- title: 콘셉트 제목 (10자 이내)
- hook: 시작 3초 훅 문구 (강렬하고 임팩트 있게)
- flow: 전체 흐름 설명 (5개 영상 구조)
- cta: 마무리 CTA (행동 유도)
- summary: 한 줄 요약

JSON 형식:
{
  "concepts": [
    { "id": "1", "title": "...", "hook": "...", "flow": "...", "cta": "...", "summary": "..." },
    { "id": "2", ... },
    { "id": "3", ... }
  ]
}`;

  const userPrompt = `
프롬프트: ${refinedPrompt}

리서치 인사이트:
${insights.join('\n')}

타겟: ${options.target}
톤앤매너: ${options.tone}
목적: ${options.purpose}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-5.1', // 최신 GPT 모델
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
  const concepts = result.concepts || [];
  
  return concepts.map((concept: any) => ({
    ...concept,
    selected: false,
  }));
}

