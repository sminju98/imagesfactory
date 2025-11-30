// 태스크의 이미지 목록 조회 API

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
    const imageUrls = taskData?.imageUrls || [];

    // 완료된 jobs에서 이미지 정보 조회
    const jobsSnapshot = await db.collection('tasks').doc(taskId)
      .collection('jobs')
      .where('status', '==', 'completed')
      .get();

    const images: any[] = [];
    
    jobsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.imageUrl) {
        images.push({
          id: doc.id,
          modelId: data.modelId,
          imageUrl: data.imageUrl,
          createdAt: data.finishedAt?.toDate?.()?.toISOString() || null,
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        status: taskData?.status,
        totalImages: taskData?.totalImages || 0,
        completedImages: images.length,
        imageUrls,
        images,
      },
    });

  } catch (error: any) {
    console.error('이미지 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}




