// 선호 갤러리 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// 선호 이미지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const pageSize = parseInt(searchParams.get('pageSize') || '24');
    const lastId = searchParams.get('lastId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }
    
    let query = db.collection('favorites')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(pageSize);
    
    // 페이지네이션
    if (lastId) {
      const lastDoc = await db.collection('favorites').doc(lastId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }
    
    const snapshot = await query.get();
    const favorites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        favorites,
        hasMore: favorites.length === pageSize,
        lastId: favorites.length > 0 ? favorites[favorites.length - 1].id : null,
      },
    });
    
  } catch (error: any) {
    console.error('선호 이미지 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 선호 이미지 노트/태그 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const { favoriteId, note, tags } = await request.json();
    
    if (!favoriteId) {
      return NextResponse.json(
        { success: false, error: '선호 이미지 ID가 필요합니다' },
        { status: 400 }
      );
    }
    
    const favoriteRef = db.collection('favorites').doc(favoriteId);
    const favoriteDoc = await favoriteRef.get();
    
    if (!favoriteDoc.exists) {
      return NextResponse.json(
        { success: false, error: '선호 이미지를 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    
    const updates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (note !== undefined) {
      updates.note = note;
    }
    
    if (tags !== undefined) {
      updates.tags = tags;
    }
    
    await favoriteRef.update(updates);
    
    return NextResponse.json({
      success: true,
      message: '업데이트되었습니다',
    });
    
  } catch (error: any) {
    console.error('선호 이미지 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 선호 이미지 삭제 (좋아요 취소와 동일)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const favoriteId = searchParams.get('favoriteId');
    
    if (!favoriteId) {
      return NextResponse.json(
        { success: false, error: '선호 이미지 ID가 필요합니다' },
        { status: 400 }
      );
    }
    
    const favoriteRef = db.collection('favorites').doc(favoriteId);
    const favoriteDoc = await favoriteRef.get();
    
    if (!favoriteDoc.exists) {
      return NextResponse.json(
        { success: false, error: '선호 이미지를 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    
    const favoriteData = favoriteDoc.data()!;
    
    // 원본 이미지의 좋아요 상태도 업데이트
    const imageRef = db.collection('images').doc(favoriteData.imageId);
    const imageDoc = await imageRef.get();
    
    if (imageDoc.exists) {
      await imageRef.update({
        isLiked: false,
        likesCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    
    // 선호 이미지 삭제
    await favoriteRef.delete();
    
    return NextResponse.json({
      success: true,
      message: '선호 이미지가 삭제되었습니다',
    });
    
  } catch (error: any) {
    console.error('선호 이미지 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}


