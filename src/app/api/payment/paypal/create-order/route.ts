import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// PayPal API 기본 URL (Sandbox 또는 Production)
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
    console.error('PayPal auth error:', data);
    throw new Error('Failed to get PayPal access token');
  }

  return data.access_token;
}

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

    if (amount < 1 || amount > 1000) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // PayPal Access Token 가져오기
    const accessToken = await getPayPalAccessToken();

    // PayPal 주문 생성
    const orderResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amount.toString(),
            },
            description: `ImageFactory Points - ${points.toLocaleString()}pt`,
            custom_id: userId, // 사용자 ID 저장
          },
        ],
        application_context: {
          brand_name: 'ImageFactory',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://imagefactory.co.kr'}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://imagefactory.co.kr'}/points`,
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('PayPal order creation error:', orderData);
      return NextResponse.json(
        { success: false, error: 'Failed to create PayPal order' },
        { status: 500 }
      );
    }

    // Firestore에 결제 정보 저장 (pending 상태)
    const paymentRef = db.collection('payments').doc();
    await paymentRef.set({
      id: paymentRef.id,
      userId,
      amount,
      points,
      status: 'pending',
      paymentMethod: 'paypal',
      paypalOrderId: orderData.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: orderData.id,
        paymentId: paymentRef.id,
      },
    });

  } catch (error: any) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

