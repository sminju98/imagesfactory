import { NextRequest, NextResponse } from 'next/server';
import { db, auth, fieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 ID Token 가져오기
    const authHeader = request.headers.get('authorization');
    
    let userId;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        userId = decodedToken.uid;
      } catch (error) {
        console.error('Token verification error:', error);
      }
    }

    const body = await request.json();
    const { amount, points } = body;
    
    // body에서 userId가 없으면 token에서 가져온 userId 사용
    if (!userId) {
      userId = body.userId;
    }

    // 유효성 검사
    if (!userId || !amount || !points) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 1000 || amount > 1000000) {
      return NextResponse.json(
        { success: false, error: '충전 금액은 1,000원 ~ 1,000,000원 사이여야 합니다' },
        { status: 400 }
      );
    }

    if (amount !== points) {
      return NextResponse.json(
        { success: false, error: '금액과 포인트가 일치하지 않습니다 (1원 = 1포인트)' },
        { status: 400 }
      );
    }

    // 사용자 정보 가져오기 (Admin SDK)
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

    // 포인트 및 통계 업데이트
    const newPoints = currentPoints + points;
    const currentStats = userData.stats || {
      totalGenerations: 0,
      totalImages: 0,
      totalPointsUsed: 0,
      totalPointsPurchased: 0,
    };

    await userRef.update({
      points: newPoints,
      'stats.totalPointsPurchased': (currentStats.totalPointsPurchased || 0) + points,
      updatedAt: fieldValue.serverTimestamp(),
    });

    console.log('📊 통계 업데이트:', {
      totalPointsPurchased: (currentStats.totalPointsPurchased || 0) + points,
    });

    // 거래 내역 저장
    await db.collection('pointTransactions').add({
      userId,
      amount: points,
      type: 'purchase',
      description: `포인트 충전 (테스트: ${amount.toLocaleString()}원)`,
      balanceBefore: currentPoints,
      balanceAfter: newPoints,
      createdAt: fieldValue.serverTimestamp(),
    });

    // 결제 내역 저장
    const paymentRef = await db.collection('payments').add({
      userId,
      amount,
      points,
      status: 'completed',
      paymentMethod: 'test',
      orderId: `TEST_${Date.now()}`,
      createdAt: fieldValue.serverTimestamp(),
      confirmedAt: fieldValue.serverTimestamp(),
    });

    console.log('✅ 포인트 충전 완료:', {
      userId,
      points,
      newPoints,
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: paymentRef.id,
        points,
        newBalance: newPoints,
      },
    });

  } catch (error: any) {
    console.error('Payment charge error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
