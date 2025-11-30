// PayPal 결제 승인 API

import { NextRequest, NextResponse } from 'next/server';
import { db, fieldValue } from '@/lib/firebase-admin';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId } = await request.json();

    if (!orderId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // PayPal 액세스 토큰 획득
    const accessToken = await getPayPalAccessToken();

    // PayPal 주문 캡처
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureResponse.json();

    if (captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      return NextResponse.json(
        { success: false, error: 'Payment capture failed' },
        { status: 400 }
      );
    }

    // 결제 금액에서 포인트 계산 ($1 = 100pt)
    const amount = parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value);
    const points = Math.floor(amount * 100);

    // Firestore에서 결제 정보 업데이트
    const paymentRef = db.collection('payments').doc(orderId);
    await paymentRef.update({
      status: 'completed',
      captureId: captureData.purchase_units[0].payments.captures[0].id,
      capturedAt: fieldValue.serverTimestamp(),
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 사용자 포인트 업데이트
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const currentPoints = userDoc.data()?.points || 0;
    const newPoints = currentPoints + points;

    await userRef.update({
      points: newPoints,
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 포인트 거래 내역 기록
    const transactionRef = db.collection('pointTransactions').doc();
    await transactionRef.set({
      id: transactionRef.id,
      userId,
      amount: points,
      type: 'purchase',
      description: `PayPal 결제 - $${amount}`,
      relatedPaymentId: orderId,
      balanceBefore: currentPoints,
      balanceAfter: newPoints,
      createdAt: fieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Payment captured and points charged',
        points,
        newBalance: newPoints,
      },
    });

  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
