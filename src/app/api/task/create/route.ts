// 이미지 생성 태스크 생성 API

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, prompt, modelConfigs, referenceImageUrl } = body;

    if (!userId || !prompt || !modelConfigs || modelConfigs.length === 0) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 총 이미지 수와 포인트 계산
    let totalImages = 0;
    let totalPoints = 0;
    
    for (const config of modelConfigs) {
      totalImages += config.count;
      totalPoints += config.count * (config.pointsPerImage || 1);
    }

    // 사용자 포인트 확인
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentPoints = userData?.points || 0;

    if (currentPoints < totalPoints) {
      return NextResponse.json(
        { success: false, error: '포인트가 부족합니다' },
        { status: 400 }
      );
    }

    // 포인트 차감
    await userRef.update({
      points: FieldValue.increment(-totalPoints),
    });

    // 태스크 생성
    const taskRef = db.collection('tasks').doc();
    const taskData = {
      id: taskRef.id,
      userId,
      userEmail,
      prompt,
      modelConfigs,
      referenceImageUrl: referenceImageUrl || null,
      totalImages,
      totalPoints,
      status: 'pending',
      progress: 0,
      imageUrls: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await taskRef.set(taskData);

    // 각 모델별로 jobs 생성
    const batch = db.batch();
    
    for (const config of modelConfigs) {
      for (let i = 0; i < config.count; i++) {
        const jobRef = taskRef.collection('jobs').doc();
        batch.set(jobRef, {
          id: jobRef.id,
          taskId: taskRef.id,
          modelId: config.modelId,
          prompt,
          referenceImageUrl: referenceImageUrl || null,
          status: 'pending',
          pointsCost: config.pointsPerImage || 1,
          retryCount: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        taskId: taskRef.id,
        totalImages,
        totalPoints,
      },
    });

  } catch (error: any) {
    console.error('태스크 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}




