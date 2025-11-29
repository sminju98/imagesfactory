// 콘텐츠 프로젝트 상세 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// GET: 프로젝트 상세 정보 및 태스크 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 프로젝트 정보
    const projectDoc = await db.collection('contentProjects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();

    // 태스크 목록 (타입별로 그룹화)
    const tasksSnapshot = await db.collection('contentProjects')
      .doc(projectId)
      .collection('tasks')
      .orderBy('type')
      .orderBy('order')
      .get();

    const tasksByType: Record<string, any[]> = {
      reels: [],
      comic: [],
      cardnews: [],
      banner: [],
      story: [],
      thumbnail: [],
      detail_header: [],
    };

    tasksSnapshot.docs.forEach(doc => {
      const task = { id: doc.id, ...doc.data() } as { id: string; type: string; [key: string]: any };
      if (task.type && tasksByType[task.type]) {
        tasksByType[task.type].push(task);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: projectDoc.id,
          ...projectData,
        },
        tasksByType,
        totalTasks: tasksSnapshot.size,
      },
    });

  } catch (error: any) {
    console.error('프로젝트 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE: 프로젝트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 권한 확인
    const projectDoc = await db.collection('contentProjects').doc(projectId).get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (projectDoc.data()?.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '삭제 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 서브컬렉션(tasks) 삭제
    const tasksSnapshot = await db.collection('contentProjects')
      .doc(projectId)
      .collection('tasks')
      .get();

    const batch = db.batch();
    tasksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 프로젝트 삭제
    batch.delete(db.collection('contentProjects').doc(projectId));

    await batch.commit();

    return NextResponse.json({
      success: true,
      data: { deletedId: projectId },
    });

  } catch (error: any) {
    console.error('프로젝트 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

