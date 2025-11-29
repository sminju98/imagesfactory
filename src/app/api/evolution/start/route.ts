// 이미지 진화 시작 API

import { NextRequest, NextResponse } from 'next/server';
import { db, fieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      selectedImageIds, 
      additionalPrompt, 
      modelsConfig, 
      evolutionStrength = 0.5,
      sessionId 
    } = body;

    // 유효성 검사
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    if (!selectedImageIds || selectedImageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 1개의 참고 이미지를 선택해주세요' },
        { status: 400 }
      );
    }

    if (selectedImageIds.length > 8) {
      return NextResponse.json(
        { success: false, error: '참고 이미지는 최대 8개까지 선택 가능합니다' },
        { status: 400 }
      );
    }

    if (!modelsConfig || Object.keys(modelsConfig).length === 0) {
      return NextResponse.json(
        { success: false, error: '최소 1개 모델을 선택해주세요' },
        { status: 400 }
      );
    }

    // 참고 이미지 정보 가져오기
    const referenceImages: any[] = [];
    for (const imageId of selectedImageIds) {
      // favorites 컬렉션에서 찾기
      const favDoc = await db.collection('favorites').doc(imageId).get();
      if (favDoc.exists) {
        referenceImages.push({ id: favDoc.id, ...favDoc.data() });
        continue;
      }
      
      // uploadedImages 컬렉션에서 찾기
      const uploadDoc = await db.collection('uploadedImages').doc(imageId).get();
      if (uploadDoc.exists) {
        referenceImages.push({ id: uploadDoc.id, ...uploadDoc.data() });
      }
    }

    if (referenceImages.length === 0) {
      return NextResponse.json(
        { success: false, error: '선택한 이미지를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 프롬프트 조합 (참고 이미지들의 프롬프트 + 추가 프롬프트)
    const basePrompts = referenceImages
      .filter(img => img.prompt)
      .map(img => img.prompt)
      .slice(0, 3);  // 최대 3개 프롬프트만 사용
    
    const combinedPrompt = [
      ...basePrompts,
      additionalPrompt
    ].filter(Boolean).join('. ');

    // 진화 강도에 따른 프롬프트 수정
    const evolutionPrefix = evolutionStrength > 0.7 
      ? 'Create a significantly evolved version: '
      : evolutionStrength > 0.4 
        ? 'Create a moderately evolved version: '
        : 'Create a slightly evolved version: ';

    const finalPrompt = evolutionPrefix + combinedPrompt;

    // 참고 이미지 URL들
    const referenceImageUrls = referenceImages.map(img => img.imageUrl);

    // 총 포인트 계산
    const MODEL_POINTS: Record<string, number> = {
      'midjourney': 60,
      'gpt-image': 10,
      'gemini': 8,
      'grok': 6,
      'ideogram': 6,
      'leonardo': 5,
      'seedream': 5,
      'sdxl': 4,
      'recraft': 4,
      'flux': 3,
      'hunyuan': 3,
    };

    let totalPoints = 0;
    let totalImages = 0;
    const modelConfigs: any[] = [];

    for (const [modelId, count] of Object.entries(modelsConfig)) {
      if (count && (count as number) > 0) {
        const pointsPerImage = MODEL_POINTS[modelId] || 5;
        totalPoints += pointsPerImage * (count as number);
        totalImages += count as number;
        modelConfigs.push({
          modelId,
          count,
          pointsCost: pointsPerImage * (count as number),
          status: 'pending',
          completedCount: 0,
        });
      }
    }

    // 사용자 포인트 확인
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    if ((userData.points || 0) < totalPoints) {
      return NextResponse.json(
        { success: false, error: `포인트가 부족합니다. 필요: ${totalPoints}pt, 보유: ${userData.points || 0}pt` },
        { status: 400 }
      );
    }

    // 진화 세션 생성 또는 업데이트
    let currentSessionId = sessionId;
    let currentGeneration = 1;

    if (sessionId) {
      // 기존 세션 업데이트
      const sessionDoc = await db.collection('evolutionSessions').doc(sessionId).get();
      if (sessionDoc.exists) {
        currentGeneration = (sessionDoc.data()?.currentGeneration || 1) + 1;
      }
    } else {
      // 새 세션 생성
      currentSessionId = `${userId}_${Date.now()}`;
      await db.collection('evolutionSessions').doc(currentSessionId).set({
        id: currentSessionId,
        userId,
        name: `진화 세션 ${new Date().toLocaleDateString('ko-KR')}`,
        generations: { '1': selectedImageIds },
        selectedImageIds,
        basePrompt: combinedPrompt,
        currentGeneration: 1,
        totalImages: 0,
        status: 'active',
        createdAt: fieldValue.serverTimestamp(),
        updatedAt: fieldValue.serverTimestamp(),
      });
    }

    // Task 생성
    const taskId = db.collection('tasks').doc().id;
    await db.collection('tasks').doc(taskId).set({
      userId,
      userEmail: userData.email,
      prompt: finalPrompt,
      fullPrompt: finalPrompt,
      translatedPrompt: finalPrompt,
      modelConfigs,
      totalImages,
      totalPoints,
      status: 'pending',
      progress: 0,
      imageUrls: [],
      referenceImageUrls,
      evolutionSessionId: currentSessionId,
      evolutionGeneration: currentGeneration,
      evolutionStrength,
      parentImageIds: selectedImageIds,
      createdAt: fieldValue.serverTimestamp(),
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 포인트 차감
    await db.collection('users').doc(userId).update({
      points: fieldValue.increment(-totalPoints),
    });

    // 포인트 트랜잭션 기록
    await db.collection('pointTransactions').add({
      userId,
      amount: -totalPoints,
      type: 'usage',
      description: `이미지 진화 (${currentGeneration}세대) - ${totalImages}장`,
      relatedTaskId: taskId,
      balanceBefore: userData.points,
      balanceAfter: userData.points - totalPoints,
      createdAt: fieldValue.serverTimestamp(),
    });

    // Jobs 생성
    for (const config of modelConfigs) {
      for (let i = 0; i < config.count; i++) {
        const jobId = db.collection('tasks').doc(taskId).collection('jobs').doc().id;
        await db.collection('tasks').doc(taskId).collection('jobs').doc(jobId).set({
          taskId,
          modelId: config.modelId,
          prompt: finalPrompt,
          referenceImageUrls,
          status: 'pending',
          pointsCost: MODEL_POINTS[config.modelId] || 5,
          evolutionGeneration: currentGeneration,
          parentImageIds: selectedImageIds,
          createdAt: fieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        sessionId: currentSessionId,
        generation: currentGeneration,
        totalImages,
        totalPoints,
      },
    });

  } catch (error: any) {
    console.error('진화 시작 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

