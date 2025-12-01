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
    const { concept, message, script } = await request.json();

    if (!concept || !message || !script) {
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

    const systemPrompt = `당신은 카피라이터 전문가입니다.
제공된 마케팅 콘셉트, 메시지, 대본을 바탕으로 각 포맷에 들어갈 최종 카피를 확정해주세요.

오늘 날짜: ${todayStr} (${todayISO})

시의성이 중요한 정보가 포함된 경우:
- 오늘 날짜(${todayStr})를 참고하여 최근 7일~30일간의 최신 정보를 활용하세요
- 날짜 관련 정보는 반드시 오늘 날짜를 기준으로 명시하세요

다음 JSON 형식으로 응답해주세요:
{
  "reelsCaptions": [
    "1컷 자막",
    "2컷 자막",
    "3컷 자막",
    "4컷 자막",
    "5컷 자막",
    "6컷 자막",
    "7컷 자막",
    "8컷 자막",
    "9컷 자막",
    "10컷 자막"
  ],
  "cardNewsCopies": [
    "1장(표지) 문구",
    "2장 문구",
    "3장 문구",
    "4장 문구",
    "5장(CTA) 문구"
  ],
  "bannerCopy": "배너 광고 메인 문구 (20자 이내)",
  "storyCopy": "스토리 광고 문구 (15자 이내)",
  "thumbnailTitle": "유튜브 썸네일 제목 (25자 이내, 임팩트 있게)",
  "detailPageHeadline": "상세페이지 헤드라인 (30자 이내)"
}

각 카피는 해당 포맷에 최적화되어야 합니다:
- 릴스 자막: 짧고 임팩트 있게 (10자 이내)
- 카드뉴스: 스와이프 유도, 호기심 자극
- 배너/스토리: 클릭 유도
- 썸네일: 궁금증 유발, 숫자/이모지 활용
- 상세페이지: 신뢰감, 전문성

JSON만 응답하고, 다른 설명은 추가하지 마세요.`;

    // Perplexity로 최신 마케팅 트렌드 검색
    console.log('🔍 Perplexity로 최신 마케팅 트렌드 검색 중...');
    const searchQuery = generateSearchQuery(
      concept.productName,
      concept.keywords,
      'trend'
    );
    const searchResult = await searchWithPerplexity(
      `${searchQuery} SNS 콘텐츠 카피 트렌드`,
      `${concept.strategy} ${message.mainCopy}`
    );
    
    let trendContext = '';
    if (searchResult.searchResults && !searchResult.error) {
      trendContext = `\n\n[최신 SNS 콘텐츠 카피 트렌드]\n${searchResult.searchResults}`;
      console.log('✅ 검색 결과 수집 완료');
    }

    const userPrompt = `
제품명: ${concept.productName}
USP: ${concept.usp}
타겟: ${concept.target}
톤앤매너: ${concept.toneAndManner}

메인 카피: ${message.mainCopy}
서브 카피: ${message.subCopy}
CTA: ${message.ctaText}

릴스 대본:
${script.reelsStory?.map((s: any) => `${s.order}. ${s.caption}`).join('\n') || ''}

카드뉴스 흐름:
${script.cardNewsFlow?.map((p: any) => `${p.order}. ${p.title}: ${p.body}`).join('\n') || ''}
${trendContext}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1', // 최신 GPT 모델
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    let copyData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        copyData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON not found in response');
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', responseText);
      return NextResponse.json({
        success: false,
        error: t.errors.copyGenerationFailed,
      });
    }

    return NextResponse.json({
      success: true,
      data: copyData,
    });

  } catch (error: any) {
    console.error('카피 생성 오류:', error);
    return NextResponse.json({
      success: false,
      error: t.errors.copyGenerationFailed,
    }, { status: 500 });
  }
}

