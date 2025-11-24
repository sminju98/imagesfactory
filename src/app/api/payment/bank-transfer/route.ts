import { NextRequest, NextResponse } from 'next/server';
import { db, auth, fieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 ID Token 가져오기
    const authHeader = request.headers.get('authorization');
    
    let userId;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        userId = decodedToken.uid;
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing auth token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, points, depositorName } = body;

    // 유효성 검사
    if (!amount || !points || !depositorName) {
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

    // 무통장 입금 요청 저장
    const paymentRef = await db.collection('payments').add({
      userId,
      amount,
      points,
      status: 'pending', // 입금 대기 중
      paymentMethod: 'bank_transfer',
      depositorName,
      bankName: '신한은행',
      accountNumber: '110-452-180013',
      accountHolder: '송민주',
      orderId: `BANK_${Date.now()}_${userId.substring(0, 8)}`,
      userEmail: userData.email,
      userDisplayName: userData.displayName,
      createdAt: fieldValue.serverTimestamp(),
    });

    console.log('✅ 무통장 입금 요청 저장:', {
      paymentId: paymentRef.id,
      userId,
      amount,
      depositorName,
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentId: paymentRef.id,
        amount,
        points,
      },
    });

  } catch (error: any) {
    console.error('Bank transfer request error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


