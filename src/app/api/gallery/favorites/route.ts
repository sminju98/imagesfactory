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

    // 사용자의 즐겨찾기 조회 (인덱스 없이 작동하도록 orderBy 제거)
    const favoritesSnapshot = await db.collection('favorites')
      .where('userId', '==', userId)
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

    // 클라이언트에서 정렬 (최신순)
    favorites.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // limit 적용
    const limitedFavorites = favorites.slice(0, limitParam);

    return NextResponse.json({
      success: true,
      data: {
        favorites: limitedFavorites,
        total: favorites.length,
        hasMore: limitedFavorites.length < favorites.length,
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



