import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, referenceImageIds } = await request.json();

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: '프롬프트를 10자 이상 입력해주세요',
      });
    }

    // GPT로 콘셉트 분석
    const systemPrompt = `당신은 마케팅 전문가이자 콘텐츠 기획자입니다.
사용자가 제공한 제품/서비스 정보를 바탕으로 마케팅 콘셉트를 분석해주세요.

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
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
        error: '콘셉트 분석 결과를 처리하는 중 오류가 발생했습니다',
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
      error: error.message || '콘셉트 생성 중 오류가 발생했습니다',
    }, { status: 500 });
  }
}


