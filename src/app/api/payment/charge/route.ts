import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, points } = body;

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

    // 사용자 정보 가져오기
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentPoints = userData.points || 0;

    // 🚨 개발 환경에서는 실제 결제 없이 포인트만 충전
    // 프로덕션에서는 토스페이먼츠 결제 연동 필요
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      console.log('🎨 [개발 모드] 실제 결제 없이 포인트 충전');
      
      // 포인트 업데이트 및 통계 증가
      const newPoints = currentPoints + points;
      const currentStats = userData.stats || {
        totalGenerations: 0,
        totalImages: 0,
        totalPointsUsed: 0,
        totalPointsPurchased: 0,
      };

      await updateDoc(userRef, {
        points: newPoints,
        'stats.totalPointsPurchased': (currentStats.totalPointsPurchased || 0) + points,
        updatedAt: serverTimestamp(),
      });

      console.log('📊 통계 업데이트:', {
        totalPointsPurchased: (currentStats.totalPointsPurchased || 0) + points,
      });

      // 거래 내역 저장
      await addDoc(collection(db, 'pointTransactions'), {
        userId,
        amount: points,
        type: 'purchase',
        description: `포인트 충전 (테스트: ${amount.toLocaleString()}원)`,
        balanceBefore: currentPoints,
        balanceAfter: newPoints,
        createdAt: serverTimestamp(),
      });

      // 결제 내역 저장
      const paymentRef = await addDoc(collection(db, 'payments'), {
        userId,
        amount,
        points,
        status: 'completed',
        paymentMethod: 'test',
        orderId: `TEST_${Date.now()}`,
        createdAt: serverTimestamp(),
        confirmedAt: serverTimestamp(),
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
    }

    // 프로덕션: 토스페이먼츠 연동
    // TODO: 실제 토스페이먼츠 결제 구현
    return NextResponse.json(
      { success: false, error: '프로덕션 결제는 아직 구현되지 않았습니다' },
      { status: 501 }
    );

  } catch (error: any) {
    console.error('Payment charge error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

