// 사용자의 즐겨찾기(좋아요) 갤러리 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// 즐겨찾기 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId가 필요합니다' },
        { status: 400 }
      );
    }

    // 사용자의 즐겨찾기 조회
    const favoritesSnapshot = await db.collection('favorites')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limitParam)
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

    // 총 개수 조회
    const countSnapshot = await db.collection('favorites')
      .where('userId', '==', userId)
      .count()
      .get();
    const total = countSnapshot.data().count;

    return NextResponse.json({
      success: true,
      data: {
        favorites,
        total,
        hasMore: favorites.length < total,
      },
    });

  } catch (error: any) {
    console.error('즐겨찾기 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 즐겨찾기 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get('favoriteId');
    const userId = searchParams.get('userId');

    if (!favoriteId || !userId) {
      return NextResponse.json(
        { success: false, error: 'favoriteId와 userId가 필요합니다' },
        { status: 400 }
      );
    }

    // 소유권 확인 후 삭제
    const favoriteRef = db.collection('favorites').doc(favoriteId);
    const favoriteDoc = await favoriteRef.get();

    if (!favoriteDoc.exists) {
      return NextResponse.json(
        { success: false, error: '즐겨찾기를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const favoriteData = favoriteDoc.data();
    if (favoriteData?.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '삭제 권한이 없습니다' },
        { status: 403 }
      );
    }

    await favoriteRef.delete();

    return NextResponse.json({
      success: true,
      data: { deleted: favoriteId },
    });

  } catch (error: any) {
    console.error('즐겨찾기 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
