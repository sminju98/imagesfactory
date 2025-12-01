import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getTranslationFromRequest } from '@/lib/server-i18n';
import { searchWithPerplexity, generateSearchQuery } from '@/lib/perplexity';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const { t } = getTranslationFromRequest(request);
  
  try {
    const { concept, message } = await request.json();

    if (!concept || !message) {
      return NextResponse.json({
        success: false,
        error: t.errors.invalidRequest,
      });
    }

    // 오늘 날짜 가져오기
    const today = new Date();
    const todayStr = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    const todayISO = today.toISOString().split('T')[0];

    const systemPrompt = `당신은 SNS 콘텐츠 전문 크리에이터입니다.
제공된 마케팅 콘셉트와 메시지를 바탕으로 다양한 포맷의 콘텐츠 시나리오를 작성해주세요.

오늘 날짜: ${todayStr} (${todayISO})

시의성이 중요한 정보가 포함된 경우:
- 오늘 날짜(${todayStr})를 참고하여 최근 7일~30일간의 최신 정보를 활용하세요
- 날짜 관련 정보는 반드시 오늘 날짜를 기준으로 명시하세요

다음 JSON 형식으로 응답해주세요:
{
  "reelsStory": [
    { "order": 1, "description": "장면 설명", "caption": "자막 텍스트", "duration": 3, "imagePrompt": "이미지 생성용 영어 프롬프트" },
    ... (총 10개 장면)
  ],
  "comicStory": [
    { "order": 1, "description": "1컷 장면 설명", "dialogue": "대사/말풍선 텍스트", "imagePrompt": "이미지 생성용 영어 프롬프트" },
    { "order": 2, "description": "2컷 장면 설명", "dialogue": "대사", "imagePrompt": "..." },
    { "order": 3, "description": "3컷 장면 설명", "dialogue": "대사", "imagePrompt": "..." },
    { "order": 4, "description": "4컷 장면 설명 (반전/결론)", "dialogue": "대사", "imagePrompt": "..." }
  ],
  "cardNewsFlow": [
    { "order": 1, "title": "표지 제목", "body": "본문 없음 (표지)", "imagePrompt": "..." },
    { "order": 2, "title": "문제 제기", "body": "본문 내용", "imagePrompt": "..." },
    { "order": 3, "title": "해결책 제시", "body": "본문 내용", "imagePrompt": "..." },
    { "order": 4, "title": "상세 설명", "body": "본문 내용", "imagePrompt": "..." },
    { "order": 5, "title": "CTA", "body": "마무리 문구", "imagePrompt": "..." }
  ]
}

릴스 스토리는 훅 → 문제 → 해결 → 증거 → CTA 흐름으로 구성하세요.
4컷 만화는 기승전결 구조로 작성하세요.
카드뉴스는 스와이프 유도하는 흐름으로 작성하세요.
imagePrompt는 영어로, 구체적이고 시각적인 설명을 포함하세요.

JSON만 응답하고, 다른 설명은 추가하지 마세요.`;

    // Perplexity로 콘텐츠 포맷 트렌드 검색
    console.log('🔍 Perplexity로 콘텐츠 포맷 트렌드 검색 중...');
    const searchQuery = generateSearchQuery(
      concept.productName,
      concept.keywords,
      'trend'
    );
    const searchResult = await searchWithPerplexity(
      `${searchQuery} 릴스 카드뉴스 만화 콘텐츠 포맷 트렌드 2025`,
      `${concept.strategy} ${message.mainCopy}`
    );
    
    let formatTrendContext = '';
    if (searchResult.searchResults && !searchResult.error) {
      formatTrendContext = `\n\n[최신 콘텐츠 포맷 트렌드 및 인사이트]\n${searchResult.searchResults}`;
      console.log('✅ 검색 결과 수집 완료');
    }

    const userPrompt = `
제품명: ${concept.productName}
USP: ${concept.usp}
타겟: ${concept.target}
톤앤매너: ${concept.toneAndManner}
전략: ${concept.strategy}

메인 카피: ${message.mainCopy}
서브 카피: ${message.subCopy}
CTA: ${message.ctaText}
${formatTrendContext}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1', // 최신 GPT 모델
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_completion_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    let scriptData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scriptData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON not found in response');
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', responseText);
      return NextResponse.json({
        success: false,
        error: t.errors.scriptGenerationFailed,
      });
    }

    return NextResponse.json({
      success: true,
      data: scriptData,
    });

  } catch (error: any) {
    console.error('대본 생성 오류:', error);
    return NextResponse.json({
      success: false,
      error: t.errors.scriptGenerationFailed,
    }, { status: 500 });
  }
}

