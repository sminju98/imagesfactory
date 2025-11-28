import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { concept, message } = await request.json();

    if (!concept || !message) {
      return NextResponse.json({
        success: false,
        error: '콘셉트와 메시지 데이터가 필요합니다',
      });
    }

    const systemPrompt = `당신은 SNS 콘텐츠 전문 크리에이터입니다.
제공된 마케팅 콘셉트와 메시지를 바탕으로 다양한 포맷의 콘텐츠 시나리오를 작성해주세요.

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

    const userPrompt = `
제품명: ${concept.productName}
USP: ${concept.usp}
타겟: ${concept.target}
톤앤매너: ${concept.toneAndManner}
전략: ${concept.strategy}

메인 카피: ${message.mainCopy}
서브 카피: ${message.subCopy}
CTA: ${message.ctaText}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
        error: '대본 생성 결과를 처리하는 중 오류가 발생했습니다',
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
      error: error.message || '대본 생성 중 오류가 발생했습니다',
    }, { status: 500 });
  }
}

