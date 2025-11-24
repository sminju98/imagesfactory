import { NextRequest, NextResponse } from 'next/server';
import { db, fieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, points } = body;

    if (!userId || !points) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (points <= 0) {
      return NextResponse.json(
        { success: false, error: '포인트는 0보다 커야 합니다' },
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
    const currentPoints = userData.points || 0;
    const newPoints = currentPoints + points;

    // 포인트 업데이트
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
      description: '관리자 포인트 지급',
      balanceBefore: currentPoints,
      balanceAfter: newPoints,
      createdAt: fieldValue.serverTimestamp(),
    });

    console.log('✅ 포인트 지급 완료:', {
      userId,
      points,
      newBalance: newPoints,
    });

    return NextResponse.json({
      success: true,
      data: {
        points,
        newBalance: newPoints,
      },
    });

  } catch (error: any) {
    console.error('Add points error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


