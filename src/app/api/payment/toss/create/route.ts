import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, points } = body;

    // 유효성 검사
    if (!userId || !amount || !points) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 금액 검증 (원화, 최소 10,000원)
    if (amount < 10000 || amount > 1000000) {
      return NextResponse.json(
        { success: false, error: '결제 금액이 유효하지 않습니다' },
        { status: 400 }
      );
    }

    // 주문 ID 생성
    const orderId = `IF_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Firestore에 결제 정보 저장 (pending 상태)
    const paymentRef = db.collection('payments').doc();
    await paymentRef.set({
      id: paymentRef.id,
      userId,
      amount,
      points,
      status: 'pending',
      paymentMethod: 'toss',
      orderId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        paymentId: paymentRef.id,
      },
    });

  } catch (error: any) {
    console.error('토스페이먼츠 주문 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}



