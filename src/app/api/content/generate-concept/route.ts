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
    const { prompt, referenceImageIds } = await request.json();

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: t.errors.promptTooShort,
      });
    }

    // Perplexity로 최신 트렌드 검색
    console.log('🔍 Perplexity로 최신 트렌드 검색 중...');
    const searchQuery = generateSearchQuery(prompt.substring(0, 50), undefined, 'trend');
    const searchResult = await searchWithPerplexity(searchQuery, prompt);
    
    let trendContext = '';
    if (searchResult.searchResults && !searchResult.error) {
      trendContext = `\n\n[최신 시장 트렌드 및 인사이트]\n${searchResult.searchResults}`;
      console.log('✅ 검색 결과 수집 완료');
    } else {
      console.log('⚠️ 검색 결과 없음, 기본 정보만 사용');
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

    // GPT로 콘셉트 분석
    const systemPrompt = `당신은 마케팅 전문가이자 콘텐츠 기획자입니다.
사용자가 제공한 제품/서비스 정보와 최신 시장 트렌드를 바탕으로 마케팅 콘셉트를 분석해주세요.

오늘 날짜: ${todayStr} (${todayISO})

시의성이 중요한 정보(뉴스, 트렌드, 이벤트 등)가 포함된 경우:
- 오늘 날짜(${todayStr})를 참고하여 최근 7일~30일간의 최신 정보를 활용하세요
- 날짜 관련 정보는 반드시 오늘 날짜를 기준으로 명시하세요
- "2025년 최신", "최근 n일간", "오늘 기준" 등의 표현을 사용하여 시의성을 강조하세요

다음 JSON 형식으로 응답해주세요:
{
  "productName": "제품/서비스명",
  "usp": "핵심 장점 및 차별점 (2-3문장)",
  "target": "타겟 고객층 (연령, 성별, 특성 등)",
  "toneAndManner": "브랜드 톤앤매너 (형용사 3-5개)",
  "strategy": "마케팅 전략 방향 (2-3문장)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "marketTrend": "관련 시장 트렌드 및 인사이트 (1-2문장)"
}

JSON만 응답하고, 다른 설명은 추가하지 마세요.`;

    const userPromptWithTrend = `${prompt}${trendContext}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1', // 최신 GPT 모델
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPromptWithTrend },
      ],
      temperature: 0.7,
      max_completion_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // JSON 파싱
    let conceptData;
    try {
      // JSON 블록 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        conceptData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON not found in response');
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', responseText);
      return NextResponse.json({
        success: false,
        error: t.errors.conceptGenerationFailed,
      });
    }

    return NextResponse.json({
      success: true,
      data: conceptData,
    });

  } catch (error: any) {
    console.error('콘셉트 생성 오류:', error);
    return NextResponse.json({
      success: false,
      error: t.errors.conceptGenerationFailed,
    }, { status: 500 });
  }
}

