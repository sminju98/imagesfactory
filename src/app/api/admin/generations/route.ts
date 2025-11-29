// 관리자용 이미지 생성 내역 조회 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = db.collection('tasks').orderBy('createdAt', 'desc').limit(limitParam);

    if (userId) {
      query = db.collection('tasks')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limitParam);
    }

    const snapshot = await query.get();

    const generations: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // status 필터링
      if (status && data.status !== status) return;

      generations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        generations,
        total: generations.length,
      },
    });

  } catch (error: any) {
    console.error('생성 내역 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

