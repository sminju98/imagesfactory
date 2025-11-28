import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { concept } = await request.json();

    if (!concept) {
      return NextResponse.json({
        success: false,
        error: '콘셉트 데이터가 필요합니다',
      });
    }

    const systemPrompt = `당신은 카피라이터 전문가입니다.
제공된 마케팅 콘셉트를 바탕으로 효과적인 마케팅 메시지를 작성해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "mainCopy": "메인 카피 (임팩트 있는 한 줄, 15자 이내)",
  "subCopy": "서브 카피 (메인 카피를 보조하는 설명, 30자 이내)",
  "ctaText": "CTA 문구 (행동 유도 버튼 텍스트, 10자 이내)",
  "alternativeOptions": {
    "mainCopy": ["대안 메인 카피 1", "대안 메인 카피 2"],
    "subCopy": ["대안 서브 카피 1", "대안 서브 카피 2"],
    "ctaText": ["대안 CTA 1", "대안 CTA 2"]
  }
}

JSON만 응답하고, 다른 설명은 추가하지 마세요.`;

    const userPrompt = `
제품명: ${concept.productName}
USP: ${concept.usp}
타겟: ${concept.target}
톤앤매너: ${concept.toneAndManner}
전략: ${concept.strategy}
키워드: ${concept.keywords?.join(', ') || ''}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_completion_tokens: 800,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    let messageData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        messageData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON not found in response');
      }
    } catch (parseError) {
      console.error('JSON 파싱 오류:', responseText);
      return NextResponse.json({
        success: false,
        error: '메시지 생성 결과를 처리하는 중 오류가 발생했습니다',
      });
    }

    return NextResponse.json({
      success: true,
      data: messageData,
    });

  } catch (error: any) {
    console.error('메시지 생성 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '메시지 생성 중 오류가 발생했습니다',
    }, { status: 500 });
  }
}

