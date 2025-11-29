import { NextRequest, NextResponse } from 'next/server';
import { db, auth, fieldValue } from '@/lib/firebase-admin';
import { getTranslationFromRequest } from '@/lib/server-i18n';

export async function POST(request: NextRequest) {
  const { t } = getTranslationFromRequest(request);
  
  try {
    // Authorization 헤더에서 ID Token 가져오기
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: t.errors.unauthorized },
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
        { success: false, error: t.errors.invalidToken },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prompt, email, selectedModels, referenceImageUrl } = body;

    // 유효성 검사
    if (!prompt || !email || !selectedModels) {
      return NextResponse.json(
        { success: false, error: t.errors.invalidRequest },
        { status: 400 }
      );
    }

    console.log('📝 이미지 생성 요청:', {
      userId,
      prompt: prompt.substring(0, 50) + '...',
      hasReferenceImage: !!referenceImageUrl,
      referenceImageUrl: referenceImageUrl || 'none',
    });

    if (prompt.length < 10) {
      return NextResponse.json(
        { success: false, error: t.errors.promptTooShort },
        { status: 400 }
      );
    }
    
    if (prompt.length > 1000) {
      return NextResponse.json(
        { success: false, error: t.errors.promptTooLong },
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
        { success: false, error: t.errors.userNotFound },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const currentPoints = userData.points || 0;

    // 포인트 확인
    if (currentPoints < totalPoints) {
      return NextResponse.json(
        { success: false, error: t.errors.insufficientPoints, details: { current: currentPoints, required: totalPoints } },
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

    // 🔥 tasks 컬렉션에 Task 문서 생성 (Firebase Functions 트리거용)
    const taskRef = db.collection('tasks').doc();
    await taskRef.set({
      userId,
      userEmail: email,
      prompt,
      totalImages,
      totalPoints,
      modelConfigs,
      referenceImageUrl: referenceImageUrl || null,
      status: 'pending',
      progress: 0,
      pointsDeducted: true,
      transactionId: transactionRef.id,
      createdAt: fieldValue.serverTimestamp(),
      updatedAt: fieldValue.serverTimestamp(),
    });

    console.log('✅ Task created:', taskRef.id);

    // 🚀 jobs 서브컬렉션에 개별 Job 생성 → jobWorker가 트리거됨
    const batch = db.batch();
    
    for (const config of modelConfigs) {
      for (let i = 0; i < config.count; i++) {
        const jobRef = taskRef.collection('jobs').doc();
        batch.set(jobRef, {
          taskId: taskRef.id,
          userId,
          prompt,
          modelId: config.modelId,
          status: 'pending',
          retries: 0,
          pointsCost: config.pointsPerImage,
          referenceImageUrl: referenceImageUrl || null,
          createdAt: fieldValue.serverTimestamp(),
          updatedAt: fieldValue.serverTimestamp(),
        });
      }
    }
    
    await batch.commit();
    console.log(`🚀 ${totalImages}개 Job 생성 완료 → Firebase Functions 트리거!`);

    return NextResponse.json({
      success: true,
      data: {
        generationId: taskRef.id,
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
    // 무료/저가 모델
    'pixart': 10,
    'flux': 10,
    'realistic-vision': 20,
    'sdxl': 30,
    'kandinsky': 30,
    'hunyuan': 30,
    // 중간가 모델
    'playground': 40,
    'leonardo': 50,
    'recraft': 50,
    'seedream': 50,
    // 고가 모델
    'gemini': 60,
    'grok': 80,
    'ideogram': 80,
    // 프리미엄 모델
    'gpt-image': 150,
    'firefly': 120,
    'midjourney': 200,
  };
  return pointsMap[modelId] || 30;
}
