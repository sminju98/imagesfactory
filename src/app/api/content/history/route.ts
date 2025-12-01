// 콘텐츠 히스토리 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// GET: 콘텐츠 프로젝트 히스토리 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // Content Projects와 Reels Projects 모두 조회
    const contentProjectsQuery = db.collection('contentProjects')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');
    
    const reelsProjectsQuery = db.collection('reelsProjects')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    // Content Projects 조회
    let contentQuery: FirebaseFirestore.Query = contentProjectsQuery;
    if (status && ['processing', 'completed', 'failed', 'partial'].includes(status)) {
      contentQuery = contentQuery.where('status', '==', status);
    }
    const contentSnapshot = await contentQuery.limit(limit).offset(offset).get();
    
    // Reels Projects 조회
    let reelsQuery: FirebaseFirestore.Query = reelsProjectsQuery;
    if (status && ['processing', 'completed', 'failed', 'draft'].includes(status)) {
      reelsQuery = reelsQuery.where('status', '==', status);
    }
    const reelsSnapshot = await reelsQuery.limit(limit).offset(offset).get();
    
    // Content Projects 처리
    const contentProjects = await Promise.all(
      contentSnapshot.docs.map(async (doc) => {
        const projectData = doc.data();
        
        // 태스크 요약 정보
        const tasksSnapshot = await db.collection('contentProjects')
          .doc(doc.id)
          .collection('tasks')
          .get();

        const tasksSummary = {
          total: tasksSnapshot.size,
          completed: 0,
          failed: 0,
          pending: 0,
          processing: 0,
          byType: {} as Record<string, { total: number; completed: number }>,
        };

        tasksSnapshot.docs.forEach(taskDoc => {
          const task = taskDoc.data();
          
          // 상태별 카운트
          switch (task.status) {
            case 'completed':
              tasksSummary.completed++;
              break;
            case 'failed':
              tasksSummary.failed++;
              break;
            case 'processing':
              tasksSummary.processing++;
              break;
            default:
              tasksSummary.pending++;
          }

          // 타입별 카운트
          if (!tasksSummary.byType[task.type]) {
            tasksSummary.byType[task.type] = { total: 0, completed: 0 };
          }
          tasksSummary.byType[task.type].total++;
          if (task.status === 'completed') {
            tasksSummary.byType[task.type].completed++;
          }
        });

        return {
          id: doc.id,
          type: 'content',
          ...projectData,
          tasksSummary,
        };
      })
    );
    
    // Reels Projects 처리
    const reelsProjects = reelsSnapshot.docs.map((doc) => {
      const projectData = doc.data();
      return {
        id: doc.id,
        type: 'reels',
        ...projectData,
        // Reels 프로젝트는 단계별 진행 상황을 표시
        progress: {
          currentStep: projectData.currentStep || 0,
          totalSteps: 7,
          completedSteps: projectData.currentStep || 0,
        },
      };
    });
    
    // 두 프로젝트 타입을 합치고 날짜순 정렬
    const allProjects = [...contentProjects, ...reelsProjects].sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    }).slice(0, limit);

    // 전체 통계 (Content + Reels)
    const allContentSnapshot = await db.collection('contentProjects')
      .where('userId', '==', userId)
      .get();
    
    const allReelsSnapshot = await db.collection('reelsProjects')
      .where('userId', '==', userId)
      .get();

    const stats = {
      total: allContentSnapshot.size + allReelsSnapshot.size,
      completed: 0,
      processing: 0,
      failed: 0,
      content: allContentSnapshot.size,
      reels: allReelsSnapshot.size,
    };

    allContentSnapshot.docs.forEach(doc => {
      const data = doc.data();
      switch (data.status) {
        case 'completed':
          stats.completed++;
          break;
        case 'processing':
          stats.processing++;
          break;
        case 'failed':
        case 'partial':
          stats.failed++;
          break;
      }
    });
    
    allReelsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      switch (data.status) {
        case 'completed':
          stats.completed++;
          break;
        case 'processing':
        case 'draft':
          stats.processing++;
          break;
        case 'failed':
          stats.failed++;
          break;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        projects: allProjects,
        stats,
        hasMore: allProjects.length === limit,
      },
    });

  } catch (error: any) {
    console.error('콘텐츠 히스토리 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

