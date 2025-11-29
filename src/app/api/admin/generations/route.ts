/**
 * 어드민 - 이미지 생성 기록 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// 전체 이미지 생성 기록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, processing, completed, failed
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId');

    let query: FirebaseFirestore.Query = db.collection('tasks')
      .orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.limit(500).get();
    
    let generations = await Promise.all(snapshot.docs.map(async (doc) => {
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

      // Jobs 조회
      const jobsSnapshot = await doc.ref.collection('jobs').get();
      const jobs = jobsSnapshot.docs.map(jobDoc => {
        const jobData = jobDoc.data();
        return {
          id: jobDoc.id,
          modelId: jobData.modelId,
          status: jobData.status,
          pointsCost: jobData.pointsCost,
          imageUrl: jobData.imageUrl,
          errorMessage: jobData.errorMessage,
        };
      });

      const completedJobs = jobs.filter(j => j.status === 'completed').length;
      const failedJobs = jobs.filter(j => j.status === 'failed').length;

      return {
        id: doc.id,
        userId: data.userId,
        userEmail,
        userName,
        prompt: data.prompt?.substring(0, 100) + (data.prompt?.length > 100 ? '...' : ''),
        fullPrompt: data.prompt,
        totalImages: data.totalImages,
        totalPoints: data.totalPoints,
        status: data.status,
        progress: data.progress,
        imageUrls: data.imageUrls || [],
        failedReason: data.failedReason,
        completedJobs,
        failedJobs,
        totalJobs: jobs.length,
        modelConfigs: data.modelConfigs,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
      };
    }));

    // 검색어 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      generations = generations.filter(gen => 
        gen.userEmail?.toLowerCase().includes(searchLower) ||
        gen.userName?.toLowerCase().includes(searchLower) ||
        gen.fullPrompt?.toLowerCase().includes(searchLower) ||
        gen.id.toLowerCase().includes(searchLower)
      );
    }

    // 페이지네이션
    const total = generations.length;
    const startIndex = (page - 1) * limit;
    const paginatedGenerations = generations.slice(startIndex, startIndex + limit);

    // 통계
    const stats = {
      total: generations.length,
      pending: generations.filter(g => g.status === 'pending').length,
      processing: generations.filter(g => g.status === 'processing').length,
      completed: generations.filter(g => g.status === 'completed').length,
      failed: generations.filter(g => g.status === 'failed').length,
      totalImages: generations.reduce((sum, g) => sum + (g.imageUrls?.length || 0), 0),
      totalPoints: generations.reduce((sum, g) => sum + (g.totalPoints || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        generations: paginatedGenerations,
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
    console.error('생성 기록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


