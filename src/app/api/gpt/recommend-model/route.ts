/**
 * GPT 모델 추천 API
 * POST /api/gpt/recommend-model
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AI_MODELS } from '@/types/task.types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL_INFO = AI_MODELS.map(m => ({
  id: m.id,
  name: m.name,
  description: m.description,
  pointsPerImage: m.pointsPerImage,
  category: m.category,
  supportsReference: m.supportsReference,
}));

const SYSTEM_PROMPT = `당신은 AI 이미지 생성 모델 전문가입니다.
사용자의 프롬프트와 예산을 분석하여 최적의 모델 조합을 추천해주세요.

사용 가능한 모델:
${JSON.stringify(MODEL_INFO, null, 2)}

모델 특성:
- pixart, flux: 빠르고 저렴, 일반적인 이미지에 적합
- sdxl, leonardo: 고품질, 다양한 스타일
- realistic-vision: 실사 인물/사진 특화
- aurora: 고품질 범용
- ideogram: 텍스트가 포함된 이미지 특화
- dall-e-3: 최고 품질, 복잡한 장면/개념 표현

추천 시 고려사항:
1. 프롬프트의 특성 (실사/애니메이션/추상 등)
2. 예산 (총 포인트)
3. 다양성 (여러 모델로 다양한 결과 시도)
4. 품질 vs 수량 균형

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "recommendations": [
    {
      "modelId": "모델ID",
      "count": 생성수량,
      "reason": "추천 이유"
    }
  ],
  "totalPoints": 총포인트,
  "explanation": "전체 추천 설명"
}`;

export async function POST(request: NextRequest) {
  try {
    // 인증 없이 사용 가능 (프롬프트 교정/모델 추천은 무료 기능)
    const body = await request.json();
    const { prompt, budget = 500 } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.length < 3) {
      return NextResponse.json(
        { success: false, error: '프롬프트를 입력해주세요.' },
        { status: 400 }
      );
    }

    // GPT-4로 모델 추천
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `프롬프트: "${prompt}"\n예산: ${budget} 포인트\n\n최적의 모델 조합을 추천해주세요.` 
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('GPT 응답이 없습니다.');
    }

    const result = JSON.parse(content);

    // 추천 결과 검증 및 포인트 계산
    const validatedRecommendations = result.recommendations
      .filter((rec: { modelId: string }) => AI_MODELS.some(m => m.id === rec.modelId))
      .map((rec: { modelId: string; count: number; reason: string }) => {
        const model = AI_MODELS.find(m => m.id === rec.modelId)!;
        return {
          ...rec,
          modelName: model.name,
          pointsPerImage: model.pointsPerImage,
          subtotal: model.pointsPerImage * rec.count,
        };
      });

    const totalPoints = validatedRecommendations.reduce(
      (sum: number, rec: { subtotal: number }) => sum + rec.subtotal, 
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        prompt,
        budget,
        recommendations: validatedRecommendations,
        totalPoints,
        explanation: result.explanation,
      },
    });

  } catch (error) {
    console.error('모델 추천 에러:', error);
    return NextResponse.json(
      { success: false, error: '모델 추천 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

