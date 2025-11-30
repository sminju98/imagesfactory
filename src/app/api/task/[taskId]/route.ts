// 태스크 상세 조회 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    const taskDoc = await db.collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return NextResponse.json(
        { success: false, error: '태스크를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();

    // jobs 조회
    const jobsSnapshot = await db.collection('tasks').doc(taskId).collection('jobs').get();
    const jobs: any[] = [];
    
    jobsSnapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        finishedAt: data.finishedAt?.toDate?.()?.toISOString() || null,
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        task: {
          id: taskDoc.id,
          ...taskData,
          createdAt: taskData?.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: taskData?.updatedAt?.toDate?.()?.toISOString() || null,
          completedAt: taskData?.completedAt?.toDate?.()?.toISOString() || null,
        },
        jobs,
      },
    });

  } catch (error: any) {
    console.error('태스크 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}




