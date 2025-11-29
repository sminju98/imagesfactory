// 이미지 좋아요 토글 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, imageUrl, taskId, modelId, prompt } = await request.json();
    
    if (!userId || !imageUrl) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }
    
    // imageUrl을 기반으로 고유 ID 생성
    const imageId = Buffer.from(imageUrl).toString('base64').slice(0, 40);
    const favoriteId = `${userId}_${imageId}`;
    const favoriteRef = db.collection('favorites').doc(favoriteId);
    const favoriteDoc = await favoriteRef.get();
    
    const isCurrentlyLiked = favoriteDoc.exists;
    const newIsLiked = !isCurrentlyLiked;
    
    if (newIsLiked) {
      // 선호 갤러리에 추가
      await favoriteRef.set({
        id: favoriteId,
        userId,
        imageId,
        imageUrl,
        thumbnailUrl: imageUrl,
        prompt: prompt || '',
        modelId: modelId || '',
        taskId: taskId || '',
        tags: [],
        note: '',
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      // 선호 갤러리에서 제거
      await favoriteRef.delete();
    }
    
    return NextResponse.json({
      success: true,
      data: {
        isLiked: newIsLiked,
        favoriteId: newIsLiked ? favoriteId : null,
      },
    });
    
  } catch (error: any) {
    console.error('좋아요 토글 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 좋아요 상태 확인 (여러 이미지)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const imageUrls = searchParams.get('imageUrls');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId가 필요합니다' },
        { status: 400 }
      );
    }
    
    // 사용자의 모든 좋아요 가져오기
    const favoritesSnapshot = await db.collection('favorites')
      .where('userId', '==', userId)
      .get();
    
    const likedUrls = new Set<string>();
    favoritesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.imageUrl) {
        likedUrls.add(data.imageUrl);
      }
    });
    
    // 요청된 이미지 URL들에 대한 좋아요 상태 반환
    if (imageUrls) {
      const urls = JSON.parse(imageUrls);
      const likedStatus: Record<string, boolean> = {};
      urls.forEach((url: string) => {
        likedStatus[url] = likedUrls.has(url);
      });
      
      return NextResponse.json({
        success: true,
        data: { likedStatus },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: { likedUrls: Array.from(likedUrls) },
    });
    
  } catch (error: any) {
    console.error('좋아요 상태 확인 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
