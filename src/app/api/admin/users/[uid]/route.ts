// 관리자용 사용자 상세 조회 및 수정 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// 사용자 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // 사용자의 최근 생성 내역
    const generationsSnapshot = await db.collection('tasks')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const generations: any[] = [];
    generationsSnapshot.forEach((doc) => {
      const data = doc.data();
      generations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      });
    });

    // 사용자의 결제 내역
    const paymentsSnapshot = await db.collection('payments')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const payments: any[] = [];
    paymentsSnapshot.forEach((doc) => {
      const data = doc.data();
      payments.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      });
    });

    // 사용자의 갤러리 (좋아요)
    const favoritesSnapshot = await db.collection('favorites')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const favorites: any[] = [];
    favoritesSnapshot.forEach((doc) => {
      const data = doc.data();
      favorites.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          uid: userDoc.id,
          ...userData,
          createdAt: userData?.createdAt?.toDate?.()?.toISOString() || null,
          lastLoginAt: userData?.lastLoginAt?.toDate?.()?.toISOString() || null,
        },
        generations,
        payments,
        favorites,
      },
    });

  } catch (error: any) {
    console.error('사용자 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 사용자 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;
    const body = await request.json();

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 수정 가능한 필드만 허용
    const allowedFields = ['displayName', 'email', 'points', 'isAdmin', 'isBlocked'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: '수정할 데이터가 없습니다' },
        { status: 400 }
      );
    }

    updateData.updatedAt = FieldValue.serverTimestamp();

    await userRef.update(updateData);

    return NextResponse.json({
      success: true,
      data: { updated: updateData },
    });

  } catch (error: any) {
    console.error('사용자 정보 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

