/**
 * Task 생성 API Route
 * POST /api/task/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, auth, storage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getModelPoints, AI_MODELS } from '@/types/task.types';

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let userId: string;
    let userEmail: string;

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      userId = decodedToken.uid;
      userEmail = decodedToken.email || '';
    } catch {
      return NextResponse.json(
        { success: false, error: '인증이 만료되었습니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { prompt, selectedModels, referenceImageUrl, evolutionSourceId } = body;

    // 3. 입력 검증
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: '프롬프트를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (prompt.length < 10) {
      return NextResponse.json(
        { success: false, error: '프롬프트는 최소 10자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (!selectedModels || Object.keys(selectedModels).length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 1개 이상의 모델을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 4. 총 이미지 수 및 포인트 계산
    let totalImages = 0;
    let totalPoints = 0;
    const modelConfigs: Array<{
      modelId: string;
      count: number;
      pointsPerImage: number;
      status: string;
      completedCount: number;
    }> = [];

    interface JobData {
      userId: string;
      prompt: string;
      modelId: string;
      status: string;
      retries: number;
      pointsCost: number;
      referenceImageUrl: string | null;
    }

    const jobsToCreate: JobData[] = [];

    for (const [modelId, count] of Object.entries(selectedModels)) {
      const numCount = parseInt(String(count), 10);
      if (isNaN(numCount) || numCount <= 0) continue;

      const model = AI_MODELS.find(m => m.id === modelId);
      if (!model) continue;

      if (numCount > model.maxImages) {
        return NextResponse.json(
          { success: false, error: `${model.name}은(는) 최대 ${model.maxImages}장까지 생성 가능합니다.` },
          { status: 400 }
        );
      }

      const pointsPerImage = getModelPoints(modelId);
      totalImages += numCount;
      totalPoints += pointsPerImage * numCount;

      modelConfigs.push({
        modelId,
        count: numCount,
        pointsPerImage,
        status: 'pending',
        completedCount: 0,
      });

      for (let i = 0; i < numCount; i++) {
        jobsToCreate.push({
          userId,
          prompt,
          modelId,
          status: 'pending',
          retries: 0,
          pointsCost: pointsPerImage,
          referenceImageUrl: referenceImageUrl || null,
        });
      }
    }

    if (totalImages === 0) {
      return NextResponse.json(
        { success: false, error: '생성할 이미지가 없습니다.' },
        { status: 400 }
      );
    }

    if (totalImages > 100) {
      return NextResponse.json(
        { success: false, error: '한 번에 최대 100장까지 생성 가능합니다.' },
        { status: 400 }
      );
    }

    // 5. 사용자 포인트 확인 및 차감 (트랜잭션)
    const userRef = db.collection('users').doc(userId);
    const taskRef = db.collection('tasks').doc();
    const transactionRef = db.collection('pointTransactions').doc();

    interface TransactionResult {
      taskId: string;
      transactionId: string;
      newBalance: number;
    }

    const result = await db.runTransaction<TransactionResult>(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error('USER_NOT_FOUND');
      }

      const userData = userDoc.data();
      const currentPoints = userData?.points || 0;

      if (currentPoints < totalPoints) {
        throw new Error(`INSUFFICIENT_POINTS:${currentPoints}:${totalPoints}`);
      }

      // 포인트 차감
      transaction.update(userRef, {
        points: FieldValue.increment(-totalPoints),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 포인트 거래 내역
      transaction.set(transactionRef, {
        userId,
        amount: -totalPoints,
        type: 'usage',
        description: `이미지 생성 요청 (${totalImages}장)`,
        relatedGenerationId: taskRef.id,
        balanceBefore: currentPoints,
        balanceAfter: currentPoints - totalPoints,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Task 생성
      transaction.set(taskRef, {
        userId,
        userEmail,
        prompt,
        modelConfigs,
        totalImages,
        totalPoints,
        referenceImageUrl: referenceImageUrl || null,
        evolutionSourceId: evolutionSourceId || null,
        status: 'pending',
        progress: 0,
        pointsDeducted: true,
        transactionId: transactionRef.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        taskId: taskRef.id,
        transactionId: transactionRef.id,
        newBalance: currentPoints - totalPoints,
      };
    });

    // 6. Job 문서 생성 (배치)
    const batch = db.batch();
    
    for (const jobData of jobsToCreate) {
      const jobRef = taskRef.collection('jobs').doc();
      batch.set(jobRef, {
        ...jobData,
        taskId: result.taskId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    console.log(`✅ Task ${result.taskId} 생성: ${totalImages}개 이미지, ${totalPoints}pt`);

    return NextResponse.json({
      success: true,
      data: {
        taskId: result.taskId,
        totalImages,
        totalPoints,
        estimatedTime: Math.ceil(totalImages * 10), // 이미지당 약 10초
        newBalance: result.newBalance,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Task 생성 에러:', error);

    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      if (error.message.startsWith('INSUFFICIENT_POINTS')) {
        const [, current, required] = error.message.split(':');
        return NextResponse.json(
          { 
            success: false, 
            error: `포인트가 부족합니다. (현재: ${current}pt, 필요: ${required}pt)`,
            code: 'INSUFFICIENT_POINTS',
            currentPoints: parseInt(current),
            requiredPoints: parseInt(required),
          },
          { status: 402 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '이미지 생성 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}




