import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const TOSS_API_URL = 'https://api.tosspayments.com/v1/payments/confirm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인 요청
    const authHeader = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');
    
    const tossResponse = await fetch(TOSS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const tossData = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error('토스페이먼츠 결제 승인 실패:', tossData);
      return NextResponse.json(
        { success: false, error: tossData.message || '결제 승인 실패' },
        { status: 400 }
      );
    }

    // Firestore에서 결제 정보 찾기
    const paymentsSnapshot = await db.collection('payments')
      .where('orderId', '==', orderId)
      .limit(1)
      .get();

    if (paymentsSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: '결제 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const paymentDoc = paymentsSnapshot.docs[0];
    const paymentData = paymentDoc.data();

    // 이미 처리된 결제인지 확인
    if (paymentData.status === 'completed') {
      return NextResponse.json({
        success: true,
        data: {
          message: '이미 처리된 결제입니다',
          points: paymentData.points,
        },
      });
    }

    // 금액 검증
    if (paymentData.amount !== amount) {
      return NextResponse.json(
        { success: false, error: '결제 금액이 일치하지 않습니다' },
        { status: 400 }
      );
    }

    // 결제 정보 업데이트
    await paymentDoc.ref.update({
      status: 'completed',
      paymentKey,
      tossPaymentData: tossData,
      confirmedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 사용자 포인트 충전
    const userRef = db.collection('users').doc(paymentData.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const currentPoints = userDoc.data()?.points || 0;
    const newPoints = currentPoints + paymentData.points;

    await userRef.update({
      points: newPoints,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 포인트 거래 내역 기록
    const transactionRef = db.collection('pointTransactions').doc();
    await transactionRef.set({
      id: transactionRef.id,
      userId: paymentData.userId,
      amount: paymentData.points,
      type: 'purchase',
      description: `토스페이먼츠 결제 - ₩${amount.toLocaleString()}`,
      relatedPaymentId: paymentDoc.id,
      balanceBefore: currentPoints,
      balanceAfter: newPoints,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        message: '결제가 완료되었습니다',
        points: paymentData.points,
        newBalance: newPoints,
      },
    });

  } catch (error: any) {
    console.error('토스페이먼츠 결제 승인 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}



