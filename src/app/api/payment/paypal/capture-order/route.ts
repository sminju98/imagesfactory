import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// PayPal API 기본 URL
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// PayPal Access Token 가져오기
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userId } = body;

    if (!orderId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // PayPal Access Token 가져오기
    const accessToken = await getPayPalAccessToken();

    // PayPal 결제 캡처
    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error('PayPal capture error:', captureData);
      return NextResponse.json(
        { success: false, error: 'Failed to capture PayPal payment' },
        { status: 500 }
      );
    }

    // 결제 상태 확인
    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Firestore에서 결제 정보 찾기
    const paymentsSnapshot = await db.collection('payments')
      .where('paypalOrderId', '==', orderId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (paymentsSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found' },
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
          message: 'Payment already processed',
          points: paymentData.points,
        },
      });
    }

    // 결제 정보 업데이트
    const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
    
    await paymentDoc.ref.update({
      status: 'completed',
      paypalCaptureId: captureId,
      paypalStatus: captureData.status,
      confirmedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 사용자 포인트 충전
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
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
      userId,
      amount: paymentData.points,
      type: 'purchase',
      description: `PayPal - $${paymentData.amount}`,
      relatedPaymentId: paymentDoc.id,
      balanceBefore: currentPoints,
      balanceAfter: newPoints,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Payment completed successfully',
        points: paymentData.points,
        newBalance: newPoints,
        captureId,
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

