import { NextRequest, NextResponse } from 'next/server';
import { db, storage, fieldValue } from '@/lib/firebase-admin';
import { generateImage } from '@/lib/ai-models';
import { sendEmail, getGenerationCompleteEmailHTML } from '@/lib/email';
import JSZip from 'jszip';

// Vercel serverless function 타임아웃 설정 (최대 5분)
export const maxDuration = 300;

/**
 * ZIP 파일 생성 및 Storage 업로드
 */
async function createZipAndUpload(generationId: string, imageUrls: string[]): Promise<string> {
  const zip = new JSZip();

  // 각 이미지를 다운로드하여 ZIP에 추가
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const imageUrl = imageUrls[i];
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      
      const filename = `image_${String(i + 1).padStart(3, '0')}.png`;
      zip.file(filename, imageBuffer);
      
      console.log(`📦 ZIP에 추가: ${filename} (${(imageBuffer.byteLength / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error(`⚠️ 이미지 ${i + 1} 다운로드 실패:`, error);
    }
  }

  // ZIP 파일 생성
  console.log('📦 ZIP 압축 중...');
  const zipBuffer = await zip.generateAsync({ 
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  const zipSizeMB = (zipBuffer.byteLength / 1024 / 1024).toFixed(2);
  console.log(`✅ ZIP 파일 생성 완료 (${zipSizeMB} MB)`);

  // Firebase Storage에 업로드 (Admin SDK)
  const bucket = storage.bucket();
  const file = bucket.file(`zips/${generationId}.zip`);
  
  await file.save(Buffer.from(zipBuffer), {
    contentType: 'application/zip',
    metadata: {
      cacheControl: 'public, max-age=2592000', // 30일
    },
  });

  // 공개 URL 생성
  await file.makePublic();
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/zips/${generationId}.zip`;
  
  console.log('✅ ZIP 파일 Storage 업로드 완료:', downloadUrl);
  
  return downloadUrl;
}

export async function POST(request: NextRequest) {
  try {
    const { generationId } = await request.json();

    if (!generationId) {
      return NextResponse.json(
        { success: false, error: 'Missing generationId' },
        { status: 400 }
      );
    }

    // Firestore에서 생성 작업 가져오기 (Admin SDK)
    const generationRef = db.collection('imageGenerations').doc(generationId);
    const generationDoc = await generationRef.get();

    if (!generationDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Generation not found' },
        { status: 404 }
      );
    }

    const generationData = generationDoc.data()!;
    const { userId, prompt, email, modelConfigs, totalPoints, referenceImageUrl } = generationData;

    // 사용자 정보 가져오기
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data()!;
    const currentPoints = userData.points || 0;

    // 포인트 확인
    if (currentPoints < totalPoints) {
      throw new Error('Insufficient points');
    }

    // 포인트 차감
    await userRef.update({
      points: currentPoints - totalPoints,
    });

    // 포인트 거래 내역 저장
    await db.collection('pointTransactions').add({
      userId,
      amount: -totalPoints,
      type: 'usage',
      description: `이미지 생성 (${generationData.totalImages}장)`,
      balanceBefore: currentPoints,
      balanceAfter: currentPoints - totalPoints,
      relatedGenerationId: generationId,
      createdAt: fieldValue.serverTimestamp(),
    });

    // 상태 업데이트: processing
    await generationRef.update({
      status: 'processing',
      progress: 0,
      updatedAt: fieldValue.serverTimestamp(),
    });

    const generatedImages: string[] = [];
    let completedCount = 0;

    // 각 모델별로 이미지 생성
    for (const modelConfig of modelConfigs) {
      const { modelId, count } = modelConfig;
      const modelIndex = modelConfigs.indexOf(modelConfig);

      // 모델 상태 업데이트
      await generationRef.update({
        [`modelConfigs.${modelIndex}.status`]: 'processing',
      });

      for (let i = 0; i < count; i++) {
        try {
          // AI로 이미지 생성
          const result = await generateImage({
            prompt,
            modelId,
            width: 1024,
            height: 1024,
            referenceImageUrl: referenceImageUrl || undefined,
          });

          // 이미지 다운로드
          const imageResponse = await fetch(result.url);
          const imageBuffer = await imageResponse.arrayBuffer();

          // Firebase Storage에 업로드 (Admin SDK)
          const bucket = storage.bucket();
          const filename = `generations/${generationId}/${modelId}_${i}.png`;
          const file = bucket.file(filename);
          
          await file.save(Buffer.from(imageBuffer), {
            contentType: 'image/png',
            metadata: {
              cacheControl: 'public, max-age=2592000',
            },
          });

          // 공개 URL 생성
          await file.makePublic();
          const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

          generatedImages.push(imageUrl);
          completedCount++;

          // 진행률 업데이트
          const progress = Math.round((completedCount / generationData.totalImages) * 100);
          await generationRef.update({
            progress,
            [`modelConfigs.${modelIndex}.completedCount`]: i + 1,
          });

          console.log(`Generated: ${modelId} ${i + 1}/${count} (${progress}%)`);
        } catch (error) {
          console.error(`Error generating image ${i} for ${modelId}:`, error);
        }
      }

      // 모델 완료
      await generationRef.update({
        [`modelConfigs.${modelIndex}.status`]: 'completed',
      });
    }

    // ZIP 파일 생성 및 Storage 업로드
    let zipUrl = '';
    try {
      console.log('📦 ZIP 파일 생성 중...');
      zipUrl = await createZipAndUpload(generationId, generatedImages);
      console.log('✅ ZIP 파일 생성 완료:', zipUrl);
    } catch (zipError) {
      console.error('⚠️ ZIP 생성 실패 (이미지 링크는 사용 가능):', zipError);
      zipUrl = '';
    }

    // 완료 상태 업데이트
    await generationRef.update({
      status: 'completed',
      progress: 100,
      completedAt: fieldValue.serverTimestamp(),
      imageUrls: generatedImages,
      zipUrl,
    });

    // 사용자 통계 업데이트
    const currentStats = userData.stats || {
      totalGenerations: 0,
      totalImages: 0,
      totalPointsUsed: 0,
      totalPointsPurchased: 0,
    };

    await userRef.update({
      'stats.totalGenerations': (currentStats.totalGenerations || 0) + 1,
      'stats.totalImages': (currentStats.totalImages || 0) + generatedImages.length,
      'stats.totalPointsUsed': (currentStats.totalPointsUsed || 0) + totalPoints,
      updatedAt: fieldValue.serverTimestamp(),
    });

    console.log('📊 통계 업데이트 완료:', {
      totalGenerations: (currentStats.totalGenerations || 0) + 1,
      totalImages: (currentStats.totalImages || 0) + generatedImages.length,
      totalPointsUsed: (currentStats.totalPointsUsed || 0) + totalPoints,
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
          downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://imagesfactory.vercel.app'}/generation/${generationId}`,
          imageUrls: generatedImages,
          zipUrl: zipUrl || undefined,
        }),
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
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

    try {
      const { generationId } = await request.json();
      if (generationId) {
        await db.collection('imageGenerations').doc(generationId).update({
          status: 'failed',
          failedReason: error.message,
          updatedAt: fieldValue.serverTimestamp(),
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
