/**
 * Task 이미지 목록 조회 API
 * GET /api/task/[taskId]/images
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

    // Task 권한 확인
    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return NextResponse.json(
        { success: false, error: '작업을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const taskData = taskDoc.data();
    if (taskData?.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 완료된 Job의 이미지 조회
    const jobsSnapshot = await taskRef.collection('jobs')
      .where('status', '==', 'completed')
      .orderBy('createdAt', 'asc')
      .get();

    const images = jobsSnapshot.docs.map(doc => {
      const job = doc.data();
      return {
        jobId: doc.id,
        imageUrl: job.imageUrl,
        thumbnailUrl: job.thumbnailUrl || job.imageUrl,
        modelId: job.modelId,
        prompt: job.prompt,
        createdAt: job.createdAt?.toDate?.() || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        images,
        total: images.length,
      },
    });

  } catch (error) {
    console.error('이미지 목록 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '이미지 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}




