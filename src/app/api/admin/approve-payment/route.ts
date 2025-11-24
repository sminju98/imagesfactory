import { NextRequest, NextResponse } from 'next/server';
import { db, fieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Missing paymentId' },
        { status: 400 }
      );
    }

    // 결제 정보 가져오기
    const paymentRef = db.collection('payments').doc(paymentId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    const paymentData = paymentDoc.data()!;

    if (paymentData.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '이미 처리된 요청입니다' },
        { status: 400 }
      );
    }

    const { userId, amount, points } = paymentData;

    // 사용자 정보 가져오기
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
    const newPoints = currentPoints + points;

    // 포인트 충전
    const currentStats = userData.stats || {};
    await userRef.update({
      points: newPoints,
      'stats.totalPointsPurchased': (currentStats.totalPointsPurchased || 0) + points,
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 거래 내역 저장
    await db.collection('pointTransactions').add({
      userId,
      amount: points,
      type: 'purchase',
      description: `무통장 입금 (${amount.toLocaleString()}원)`,
      balanceBefore: currentPoints,
      balanceAfter: newPoints,
      relatedPaymentId: paymentId,
      createdAt: fieldValue.serverTimestamp(),
    });

    // 결제 상태 업데이트
    await paymentRef.update({
      status: 'completed',
      confirmedAt: fieldValue.serverTimestamp(),
    });

    console.log('✅ 입금 승인 완료:', {
      paymentId,
      userId,
      amount,
      points,
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId,
        points,
        newBalance: newPoints,
      },
    });

  } catch (error: any) {
    console.error('Approve payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


