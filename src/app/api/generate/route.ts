import { NextRequest, NextResponse } from 'next/server';
import { db, auth, fieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 ID Token 가져오기
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing token' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // ID Token 검증하여 userId 추출
    let userId;
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      userId = decodedToken.uid;
      console.log('✅ 인증된 사용자:', userId);
    } catch (error) {
      console.error('❌ Token 검증 실패:', error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prompt, email, selectedModels, referenceImageUrl } = body;

    // 유효성 검사
    if (!prompt || !email || !selectedModels) {
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

    // 사용자 정보 가져오기 및 포인트 확인
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const currentPoints = userData.points || 0;

    // 포인트 확인
    if (currentPoints < totalPoints) {
      return NextResponse.json(
        { success: false, error: `포인트가 부족합니다. (현재: ${currentPoints}pt, 필요: ${totalPoints}pt)` },
        { status: 400 }
      );
    }

    // 💰 포인트 즉시 차감
    await userRef.update({
      points: currentPoints - totalPoints,
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 거래 내역 저장
    const transactionRef = await db.collection('pointTransactions').add({
      userId,
      amount: -totalPoints,
      type: 'usage',
      description: `이미지 생성 요청 (${totalImages}장)`,
      balanceBefore: currentPoints,
      balanceAfter: currentPoints - totalPoints,
      createdAt: fieldValue.serverTimestamp(),
    });

    console.log('✅ 포인트 차감 완료:', {
      userId,
      deducted: totalPoints,
      remaining: currentPoints - totalPoints,
    });

    // Firestore에 생성 작업 저장
    const generationRef = await db.collection('imageGenerations').add({
      userId,
      prompt,
      email,
      totalImages,
      totalPoints,
      modelConfigs,
      referenceImageUrl: referenceImageUrl || null,
      status: 'pending',
      progress: 0,
      pointsDeducted: true, // 포인트 차감 완료 표시
      transactionId: transactionRef.id, // 거래 ID 저장 (환불용)
      createdAt: fieldValue.serverTimestamp(),
      updatedAt: fieldValue.serverTimestamp(),
    });

    console.log('✅ Generation created:', generationRef.id);
    console.log('🔥 Firebase Functions가 자동으로 이미지 생성을 시작합니다');

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
    'pixart': 10,
    'realistic-vision': 20,
    'flux': 10,
    'sdxl': 30,
    'leonardo': 30,
    'dall-e-3': 150,
    'aurora': 60,
    'ideogram': 60,
  };
  return pointsMap[modelId] || 30;
}

