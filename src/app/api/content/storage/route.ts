// 콘텐츠 저장소 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { ContentType } from '@/types/content';

// GET: 저장된 콘텐츠 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as ContentType | null;
    const projectId = searchParams.get('projectId');
    const isFavorite = searchParams.get('isFavorite');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 기본 쿼리
    let query: FirebaseFirestore.Query = db.collection('savedContents')
      .where('userId', '==', userId);

    // 타입 필터
    if (type) {
      query = query.where('type', '==', type);
    }

    // 프로젝트 필터
    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    // 즐겨찾기 필터
    if (isFavorite === 'true') {
      query = query.where('isFavorite', '==', true);
    }

    // 정렬
    switch (sortBy) {
      case 'oldest':
        query = query.orderBy('createdAt', 'asc');
        break;
      case 'type':
        query = query.orderBy('type', 'asc').orderBy('createdAt', 'desc');
        break;
      default: // newest
        query = query.orderBy('createdAt', 'desc');
    }

    // 페이지네이션
    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();
    const contents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 타입별 통계
    const statsSnapshot = await db.collection('savedContents')
      .where('userId', '==', userId)
      .get();

    const stats: Record<string, number> = {
      total: statsSnapshot.size,
      reels: 0,
      comic: 0,
      cardnews: 0,
      banner: 0,
      story: 0,
      thumbnail: 0,
      detail_header: 0,
    };

    statsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.type && stats[data.type] !== undefined) {
        stats[data.type]++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        contents,
        stats,
        hasMore: contents.length === limit,
      },
    });

  } catch (error: any) {
    console.error('콘텐츠 저장소 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST: 콘텐츠 저장 (프로젝트에서 저장소로)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, projectId, taskIds } = body;

    if (!userId || !projectId) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 프로젝트의 완료된 태스크들 가져오기
    let tasksQuery = db.collection('contentProjects')
      .doc(projectId)
      .collection('tasks')
      .where('status', '==', 'completed');

    // 특정 태스크만 선택한 경우
    if (taskIds && taskIds.length > 0) {
      tasksQuery = tasksQuery.where('__name__', 'in', taskIds);
    }

    const tasksSnapshot = await tasksQuery.get();

    if (tasksSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: '저장할 콘텐츠가 없습니다' },
        { status: 404 }
      );
    }

    // 배치로 저장
    const batch = db.batch();
    const savedIds: string[] = [];

    tasksSnapshot.docs.forEach(doc => {
      const taskData = doc.data();
      const savedRef = db.collection('savedContents').doc();
      
      batch.set(savedRef, {
        userId,
        projectId,
        taskId: doc.id,
        type: taskData.type,
        order: taskData.order,
        imageUrl: taskData.imageUrl,
        thumbnailUrl: taskData.thumbnailUrl || taskData.imageUrl,
        prompt: taskData.prompt,
        text: taskData.text,
        width: taskData.width,
        height: taskData.height,
        tags: [],
        isFavorite: false,
        createdAt: taskData.createdAt,
        savedAt: new Date(),
      });

      savedIds.push(savedRef.id);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        savedCount: savedIds.length,
        savedIds,
      },
    });

  } catch (error: any) {
    console.error('콘텐츠 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PATCH: 콘텐츠 업데이트 (즐겨찾기, 태그 등)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, updates } = body;

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: '콘텐츠 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const allowedUpdates = ['isFavorite', 'tags'];
    const filteredUpdates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: '업데이트할 항목이 없습니다' },
        { status: 400 }
      );
    }

    await db.collection('savedContents').doc(contentId).update(filteredUpdates);

    return NextResponse.json({
      success: true,
      data: { contentId, updates: filteredUpdates },
    });

  } catch (error: any) {
    console.error('콘텐츠 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE: 콘텐츠 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const userId = searchParams.get('userId');

    if (!contentId || !userId) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 권한 확인
    const contentDoc = await db.collection('savedContents').doc(contentId).get();
    if (!contentDoc.exists) {
      return NextResponse.json(
        { success: false, error: '콘텐츠를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (contentDoc.data()?.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '삭제 권한이 없습니다' },
        { status: 403 }
      );
    }

    await db.collection('savedContents').doc(contentId).delete();

    return NextResponse.json({
      success: true,
      data: { deletedId: contentId },
    });

  } catch (error: any) {
    console.error('콘텐츠 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

