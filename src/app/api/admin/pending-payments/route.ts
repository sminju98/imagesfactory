import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인 (간단한 체크)
    // 프로덕션에서는 더 강력한 인증 필요
    
    // 입금 대기 중인 결제 조회 (orderBy 제거 - 인덱스 없이 작동)
    const paymentsSnapshot = await db.collection('payments')
      .where('status', '==', 'pending')
      .where('paymentMethod', '==', 'bank_transfer')
      .get();

    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?._seconds 
        ? new Date(doc.data().createdAt._seconds * 1000).toISOString()
        : new Date().toISOString(),
    }));

    console.log('✅ 입금 대기 목록 조회:', payments.length, '건');

    return NextResponse.json({
      success: true,
      data: payments,
    });

  } catch (error: any) {
    console.error('Pending payments error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

