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

    // 기본 쿼리
    let query: FirebaseFirestore.Query = db.collection('contentProjects')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    // 상태 필터
    if (status && ['processing', 'completed', 'failed', 'partial'].includes(status)) {
      query = query.where('status', '==', status);
    }

    // 페이지네이션
    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();
    
    // 각 프로젝트의 태스크 정보도 함께 가져오기
    const projects = await Promise.all(
      snapshot.docs.map(async (doc) => {
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
          ...projectData,
          tasksSummary,
        };
      })
    );

    // 전체 통계
    const allProjectsSnapshot = await db.collection('contentProjects')
      .where('userId', '==', userId)
      .get();

    const stats = {
      total: allProjectsSnapshot.size,
      completed: 0,
      processing: 0,
      failed: 0,
    };

    allProjectsSnapshot.docs.forEach(doc => {
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

    return NextResponse.json({
      success: true,
      data: {
        projects,
        stats,
        hasMore: projects.length === limit,
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

