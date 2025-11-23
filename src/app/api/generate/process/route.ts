import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { generateImage } from '@/lib/ai-models';
import { sendEmail, getGenerationCompleteEmailHTML } from '@/lib/email';
import archiver from 'archiver';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const { generationId } = await request.json();

    if (!generationId) {
      return NextResponse.json(
        { success: false, error: 'Missing generationId' },
        { status: 400 }
      );
    }

    // Firestore에서 생성 작업 가져오기
    const generationRef = doc(db, 'imageGenerations', generationId);
    const generationDoc = await getDoc(generationRef);

    if (!generationDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Generation not found' },
        { status: 404 }
      );
    }

    const generationData = generationDoc.data();
    const { userId, prompt, email, modelConfigs, totalPoints } = generationData;

    // 사용자 정보 가져오기
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentPoints = userData.points || 0;

    // 포인트 확인
    if (currentPoints < totalPoints) {
      throw new Error('Insufficient points');
    }

    // 포인트 차감
    await updateDoc(userRef, {
      points: currentPoints - totalPoints,
    });

    // 포인트 거래 내역 저장
    await addDoc(collection(db, 'pointTransactions'), {
      userId,
      amount: -totalPoints,
      type: 'usage',
      description: `이미지 생성 (${generationData.totalImages}장)`,
      balanceBefore: currentPoints,
      balanceAfter: currentPoints - totalPoints,
      relatedGenerationId: generationId,
      createdAt: new Date(),
    });

    // 상태 업데이트: processing
    await updateDoc(generationRef, {
      status: 'processing',
      progress: 0,
      updatedAt: new Date(),
    });

    const generatedImages: string[] = [];
    let completedCount = 0;

    // 각 모델별로 이미지 생성
    for (const modelConfig of modelConfigs) {
      const { modelId, count } = modelConfig;

      // 모델 상태 업데이트
      await updateDoc(generationRef, {
        [`modelConfigs.${modelConfigs.indexOf(modelConfig)}.status`]: 'processing',
      });

      for (let i = 0; i < count; i++) {
        try {
          // AI로 이미지 생성
          const result = await generateImage({
            prompt,
            modelId,
            width: 1024,
            height: 1024,
          });

          // 이미지 다운로드
          const imageResponse = await fetch(result.url);
          const imageBuffer = await imageResponse.arrayBuffer();

          // Firebase Storage에 업로드
          const filename = `${generationId}/${modelId}_${i}.png`;
          const storageRef = ref(storage, `generations/${filename}`);
          await uploadBytes(storageRef, imageBuffer);
          const imageUrl = await getDownloadURL(storageRef);

          generatedImages.push(imageUrl);
          completedCount++;

          // 진행률 업데이트
          const progress = Math.round((completedCount / generationData.totalImages) * 100);
          await updateDoc(generationRef, {
            progress,
            [`modelConfigs.${modelConfigs.indexOf(modelConfig)}.completedCount`]: i + 1,
          });

          console.log(`Generated: ${modelId} ${i + 1}/${count} (${progress}%)`);
        } catch (error) {
          console.error(`Error generating image ${i} for ${modelId}:`, error);
        }
      }

      // 모델 완료
      await updateDoc(generationRef, {
        [`modelConfigs.${modelConfigs.indexOf(modelConfig)}.status`]: 'completed',
      });
    }

    // ZIP 파일 생성은 건너뛰고 (복잡함) 단순히 URL 목록만 저장
    const zipUrl = `Generated ${generatedImages.length} images`;

    // 완료 상태 업데이트
    await updateDoc(generationRef, {
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      imageUrls: generatedImages,
      zipUrl,
    });

    // 이메일 발송
    try {
      await sendEmail({
        to: email,
        subject: '🎉 imagesfactory - 이미지 생성 완료!',
        html: getGenerationCompleteEmailHTML({
          displayName: userData.displayName || '사용자',
          totalImages: generatedImages.length,
          prompt,
          downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/generation/${generationId}`,
          imageUrls: generatedImages,
        }),
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // 이메일 실패해도 생성은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      data: {
        generationId,
        totalImages: generatedImages.length,
      },
    });
  } catch (error: any) {
    console.error('Process generation error:', error);

    // 실패 처리
    try {
      const { generationId } = await request.json();
      if (generationId) {
        await updateDoc(doc(db, 'imageGenerations', generationId), {
          status: 'failed',
          failedReason: error.message,
          updatedAt: new Date(),
        });
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

