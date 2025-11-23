import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount, points } = body;

    console.log('💳 결제 승인 요청:', { paymentKey, orderId, amount, points });

    // 유효성 검사
    if (!paymentKey || !orderId || !amount || !points) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    const tossSecretKey = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
    const authorization = Buffer.from(`${tossSecretKey}:`).toString('base64');

    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authorization}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    if (!tossResponse.ok) {
      const errorData = await tossResponse.json();
      console.error('토스페이먼츠 승인 실패:', errorData);
      return NextResponse.json(
        { success: false, error: errorData.message || '결제 승인 실패' },
        { status: 400 }
      );
    }

    const paymentData = await tossResponse.json();
    console.log('✅ 토스페이먼츠 승인 성공:', paymentData);

    // orderId에서 userId 추출
    const userId = orderId.split('_')[2] || '';
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID format' },
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
    const newPoints = currentPoints + points;

    // 포인트 및 통계 업데이트
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

    // 포인트 거래 내역 저장
    await addDoc(collection(db, 'pointTransactions'), {
      userId,
      amount: points,
      type: 'purchase',
      description: `포인트 충전 (${amount.toLocaleString()}원)`,
      balanceBefore: currentPoints,
      balanceAfter: newPoints,
      relatedPaymentId: paymentData.paymentKey,
      createdAt: serverTimestamp(),
    });

    // 결제 내역 저장
    await addDoc(collection(db, 'payments'), {
      userId,
      amount,
      points,
      status: 'completed',
      paymentMethod: paymentData.method,
      paymentKey: paymentData.paymentKey,
      orderId: paymentData.orderId,
      transactionId: paymentData.transactionKey,
      receiptUrl: paymentData.receipt?.url,
      createdAt: serverTimestamp(),
      confirmedAt: serverTimestamp(),
    });

    console.log('✅ 포인트 충전 완료:', {
      userId,
      points,
      newBalance: newPoints,
    });

    return NextResponse.json({
      success: true,
      data: {
        points,
        newBalance: newPoints,
        payment: paymentData,
      },
    });

  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

