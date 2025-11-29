/**
 * 어드민 - 특정 회원 상세 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// 회원 상세 조회 (갤러리, 생성 기록, 결제 내역 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params;
    const { searchParams } = new URL(request.url);
    const includeGallery = searchParams.get('gallery') === 'true';
    const includeGenerations = searchParams.get('generations') === 'true';
    const includePayments = searchParams.get('payments') === 'true';

    // 사용자 기본 정보
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    const user = {
      uid: userDoc.id,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      provider: userData.provider,
      points: userData.points || 0,
      emailVerified: userData.emailVerified,
      stats: userData.stats || {},
      createdAt: userData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || null,
    };

    const result: any = { user };

    // 갤러리 (좋아요 이미지 + 업로드 이미지)
    if (includeGallery) {
      // 좋아요 이미지
      const favoritesSnapshot = await db.collection('favorites')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      const favorites = favoritesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      }));

      // 업로드 이미지
      const uploadsSnapshot = await db.collection('uploadedImages')
        .where('userId', '==', uid)
        .orderBy('uploadedAt', 'desc')
        .limit(50)
        .get();
      
      const uploads = uploadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate?.()?.toISOString() || null,
      }));

      result.gallery = { favorites, uploads };
    }

    // 이미지 생성 기록
    if (includeGenerations) {
      const tasksSnapshot = await db.collection('tasks')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      const generations = await Promise.all(tasksSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // 각 Task의 Jobs 조회
        const jobsSnapshot = await doc.ref.collection('jobs').get();
        const jobs = jobsSnapshot.docs.map(jobDoc => ({
          id: jobDoc.id,
          ...jobDoc.data(),
          createdAt: jobDoc.data().createdAt?.toDate?.()?.toISOString() || null,
          finishedAt: jobDoc.data().finishedAt?.toDate?.()?.toISOString() || null,
        }));

        return {
          id: doc.id,
          prompt: data.prompt,
          totalImages: data.totalImages,
          totalPoints: data.totalPoints,
          status: data.status,
          progress: data.progress,
          imageUrls: data.imageUrls || [],
          failedReason: data.failedReason,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
          jobs,
        };
      }));

      result.generations = generations;
    }

    // 결제 내역
    if (includePayments) {
      const paymentsSnapshot = await db.collection('payments')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      const payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        confirmedAt: doc.data().confirmedAt?.toDate?.()?.toISOString() || null,
      }));

      // 포인트 거래 내역
      const transactionsSnapshot = await db.collection('pointTransactions')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      }));

      result.payments = payments;
      result.transactions = transactions;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('회원 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


