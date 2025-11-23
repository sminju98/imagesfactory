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

    // 상태 업데이트: processing
    await generationRef.update({
      status: 'processing',
      progress: 0,
      updatedAt: fieldValue.serverTimestamp(),
    });

    const generatedImages: string[] = [];
    let completedCount = 0;

    // 모든 이미지 생성 작업을 배열로 준비
    const allGenerationTasks: Array<{
      modelId: string;
      modelIndex: number;
      imageIndex: number;
    }> = [];

    modelConfigs.forEach((config: any, modelIndex: number) => {
      for (let i = 0; i < config.count; i++) {
        allGenerationTasks.push({
          modelId: config.modelId,
          modelIndex,
          imageIndex: i,
        });
      }
    });

    console.log(`🚀 병렬 처리 시작: 총 ${allGenerationTasks.length}장을 동시에 생성`);

    // 모든 모델 상태를 processing으로 변경
    const statusUpdates: any = {};
    modelConfigs.forEach((config: any, index: number) => {
      statusUpdates[`modelConfigs.${index}.status`] = 'processing';
    });
    await generationRef.update(statusUpdates);

    // 병렬로 모든 이미지 생성 (Promise.all)
    const results = await Promise.allSettled(
      allGenerationTasks.map(async (task) => {
        try {
          // AI로 이미지 생성
          const result = await generateImage({
            prompt,
            modelId: task.modelId,
            width: 1024,
            height: 1024,
            referenceImageUrl: referenceImageUrl || undefined,
          });

          // 이미지 다운로드
          const imageResponse = await fetch(result.url);
          const imageBuffer = await imageResponse.arrayBuffer();

          // Firebase Storage에 업로드 (파일명에 모델명 포함)
          const modelNames: Record<string, string> = {
            'pixart': 'PixArt',
            'realistic-vision': 'Realistic',
            'flux': 'Flux',
            'sdxl': 'SDXL',
            'leonardo': 'Leonardo',
            'dall-e-3': 'DALLE3',
            'aurora': 'Grok',
            'ideogram': 'Ideogram',
          };
          const modelName = modelNames[task.modelId] || task.modelId;
          const imageNumber = String(task.imageIndex + 1).padStart(3, '0');
          
          const bucket = storage.bucket();
          const filename = `generations/${generationId}/${imageNumber}_${modelName}.png`;
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

          console.log(`✅ ${task.modelId} ${task.imageIndex + 1} 생성 완료`);
          
          return { success: true, imageUrl, task };
        } catch (error) {
          console.error(`❌ ${task.modelId} ${task.imageIndex + 1} 실패:`, error);
          return { success: false, error, task };
        }
      })
    );

    // 성공한 이미지만 수집
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.imageUrl) {
        generatedImages.push(result.value.imageUrl);
        completedCount++;
      }
    });

    // 최종 진행률 업데이트
    await generationRef.update({
      progress: 100,
    });

    // 모든 모델 상태를 completed로 변경
    const completedUpdates: any = {};
    modelConfigs.forEach((config: any, index: number) => {
      const modelResults = results.filter(
        (r) => r.status === 'fulfilled' && r.value.task?.modelIndex === index && r.value.success
      );
      completedUpdates[`modelConfigs.${index}.status`] = 'completed';
      completedUpdates[`modelConfigs.${index}.completedCount`] = modelResults.length;
    });
    await generationRef.update(completedUpdates);

    console.log(`🎉 병렬 처리 완료: ${completedCount}/${allGenerationTasks.length}장 성공`);

    // 실패한 이미지에 대한 환불 처리
    const failedCount = allGenerationTasks.length - completedCount;
    if (failedCount > 0) {
      // 모델별 실패 포인트 계산
      let refundPoints = 0;
      results.forEach((result) => {
        if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)) {
          if (result.status === 'fulfilled' && result.value.task) {
            const modelConfig = modelConfigs[result.value.task.modelIndex];
            refundPoints += modelConfig.pointsPerImage || 0;
          }
        }
      });

      if (refundPoints > 0) {
        // 포인트 환불
        const currentPoints = userData.points || 0;
        await userRef.update({
          points: currentPoints + refundPoints,
          updatedAt: fieldValue.serverTimestamp(),
        });

        // 환불 거래 내역 저장
        await db.collection('pointTransactions').add({
          userId,
          amount: refundPoints,
          type: 'refund',
          description: `이미지 생성 실패 환불 (${failedCount}장)`,
          balanceBefore: currentPoints,
          balanceAfter: currentPoints + refundPoints,
          relatedGenerationId: generationId,
          createdAt: fieldValue.serverTimestamp(),
        });

        console.log(`💰 환불 완료: ${refundPoints}pt (${failedCount}장 실패)`);
      }
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
