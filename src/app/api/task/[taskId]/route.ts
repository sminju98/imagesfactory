/**
 * Task 상태 조회 API
 * GET /api/task/[taskId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let userId: string;

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch {
      return NextResponse.json(
        { success: false, error: '인증이 만료되었습니다.' },
        { status: 401 }
      );
    }

    // Task 조회
    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json(
        { success: false, error: '작업을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();

    // 권한 확인
    if (taskData?.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // Job 통계 조회
    const jobsSnapshot = await taskRef.collection('jobs').get();
    let completedImages = 0;
    let failedImages = 0;
    const imageUrls: string[] = [];

    jobsSnapshot.forEach(doc => {
      const job = doc.data();
      if (job.status === 'completed') {
        completedImages++;
        if (job.imageUrl) {
          imageUrls.push(job.imageUrl);
        }
      } else if (job.status === 'failed') {
        failedImages++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: taskDoc.id,
        status: taskData?.status,
        progress: taskData?.progress || 0,
        totalImages: taskData?.totalImages || 0,
        completedImages,
        failedImages,
        imageUrls,
        zipUrl: taskData?.zipUrl,
        resultPageUrl: taskData?.resultPageUrl,
        failedReason: taskData?.failedReason,
        prompt: taskData?.prompt,
        modelConfigs: taskData?.modelConfigs,
        createdAt: taskData?.createdAt?.toDate?.() || null,
        finishedAt: taskData?.finishedAt?.toDate?.() || null,
      },
    });

  } catch (error) {
    console.error('Task 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '작업 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}




