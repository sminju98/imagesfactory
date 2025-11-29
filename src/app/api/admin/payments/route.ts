/**
 * 어드민 - 결제 조회/환불 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, fieldValue } from '@/lib/firebase-admin';

// 전체 결제 내역 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, completed, failed, cancelled, refunded
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    let query: FirebaseFirestore.Query = db.collection('payments')
      .orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(500).get();
    
    let payments = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      // 사용자 정보 조회
      let userEmail = data.userEmail || '';
      let userName = '';
      if (data.userId) {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          userEmail = userData.email || userEmail;
          userName = userData.displayName || '';
        }
      }

      return {
        id: doc.id,
        userId: data.userId,
        userEmail,
        userName,
        amount: data.amount,
        points: data.points,
        status: data.status,
        paymentMethod: data.paymentMethod,
        orderId: data.orderId,
        depositorName: data.depositorName,
        failReason: data.failReason,
        refundReason: data.refundReason,
        refundedAt: data.refundedAt?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        confirmedAt: data.confirmedAt?.toDate?.()?.toISOString() || null,
      };
    }));

    // 검색어 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      payments = payments.filter(payment => 
        payment.userEmail?.toLowerCase().includes(searchLower) ||
        payment.userName?.toLowerCase().includes(searchLower) ||
        payment.orderId?.toLowerCase().includes(searchLower) ||
        payment.depositorName?.toLowerCase().includes(searchLower)
      );
    }

    // 페이지네이션
    const total = payments.length;
    const startIndex = (page - 1) * limit;
    const paginatedPayments = payments.slice(startIndex, startIndex + limit);

    // 통계
    const stats = {
      total: payments.length,
      pending: payments.filter(p => p.status === 'pending').length,
      completed: payments.filter(p => p.status === 'completed').length,
      failed: payments.filter(p => p.status === 'failed').length,
      refunded: payments.filter(p => p.status === 'refunded').length,
      totalAmount: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        payments: paginatedPayments,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error: any) {
    console.error('결제 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 결제 환불 처리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, reason } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: '결제 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const paymentRef = db.collection('payments').doc(paymentId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return NextResponse.json(
        { success: false, error: '결제 내역을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const paymentData = paymentDoc.data()!;

    if (paymentData.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: '완료된 결제만 환불할 수 있습니다' },
        { status: 400 }
      );
    }

    if (paymentData.status === 'refunded') {
      return NextResponse.json(
        { success: false, error: '이미 환불된 결제입니다' },
        { status: 400 }
      );
    }

    const { userId, points } = paymentData;

    // 사용자 포인트 차감
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const currentPoints = userData.points || 0;
    const newPoints = Math.max(0, currentPoints - points); // 음수 방지

    // 트랜잭션으로 처리
    await db.runTransaction(async (transaction) => {
      // 결제 상태 업데이트
      transaction.update(paymentRef, {
        status: 'refunded',
        refundReason: reason || '관리자 환불 처리',
        refundedAt: fieldValue.serverTimestamp(),
        updatedAt: fieldValue.serverTimestamp(),
      });

      // 사용자 포인트 차감
      transaction.update(userRef, {
        points: newPoints,
        updatedAt: fieldValue.serverTimestamp(),
      });

      // 포인트 거래 내역 추가
      const transactionRef = db.collection('pointTransactions').doc();
      transaction.set(transactionRef, {
        userId,
        amount: -points,
        type: 'refund',
        description: `결제 환불 (${reason || '관리자 처리'})`,
        relatedPaymentId: paymentId,
        balanceBefore: currentPoints,
        balanceAfter: newPoints,
        createdAt: fieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      message: `환불 처리 완료: ${points} 포인트 차감`,
      data: {
        refundedPoints: points,
        newBalance: newPoints,
      },
    });

  } catch (error: any) {
    console.error('환불 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


