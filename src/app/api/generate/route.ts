import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, prompt, email, selectedModels, referenceImageUrl } = body;

    // 유효성 검사
    if (!userId || !prompt || !email || !selectedModels) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📝 이미지 생성 요청:', {
      userId,
      prompt: prompt.substring(0, 50) + '...',
      hasReferenceImage: !!referenceImageUrl,
      referenceImageUrl: referenceImageUrl || 'none',
    });

    if (prompt.length < 10 || prompt.length > 1000) {
      return NextResponse.json(
        { success: false, error: '프롬프트는 10자 이상 1000자 이하여야 합니다' },
        { status: 400 }
      );
    }

    // 총 이미지 수와 포인트 계산
    let totalImages = 0;
    let totalPoints = 0;
    const modelConfigs: any[] = [];

    Object.entries(selectedModels).forEach(([modelId, count]: [string, any]) => {
      if (count > 0) {
        const pointsPerImage = getModelPoints(modelId);
        totalImages += count;
        totalPoints += pointsPerImage * count;
        modelConfigs.push({
          modelId,
          count,
          pointsPerImage,
          status: 'pending',
          completedCount: 0,
        });
      }
    });

    // Firestore에 생성 작업 저장
    const generationRef = await addDoc(collection(db, 'imageGenerations'), {
      userId,
      prompt,
      email,
      totalImages,
      totalPoints,
      modelConfigs,
      referenceImageUrl: referenceImageUrl || null,
      status: 'pending',
      progress: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('Generation created:', generationRef.id);

    // 백그라운드에서 이미지 생성 시작
    // 비동기로 처리 (응답은 즉시 반환)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generationId: generationRef.id }),
    }).catch(error => {
      console.error('Failed to trigger process:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        generationId: generationRef.id,
        totalImages,
        totalPoints,
      },
    });
  } catch (error: any) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getModelPoints(modelId: string): number {
  const pointsMap: Record<string, number> = {
    'pixart': 50,
    'realistic-vision': 60,
    'flux': 80,
    'sdxl': 100,
    'leonardo': 120,
    'dall-e-3': 200,
    'aurora': 250,
    'ideogram': 280,
  };
  return pointsMap[modelId] || 100;
}

