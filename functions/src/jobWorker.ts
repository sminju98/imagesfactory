/**
 * Job Worker Firebase Function (v2)
 * Firestore Trigger: Job 문서가 생성되면 이미지 생성 작업 수행
 * 
 * 재시도 로직: 함수 내에서 최대 3회까지 직접 재시도 후 실패 처리
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db, storage, fieldValue } from './utils/firestore';
import { generateImage } from './utils/imageGeneration';
import { Job, Task, User, SYSTEM_MAX_INSTANCES, GeneratedImage } from './types';
import fetch from 'node-fetch';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 재시도 간 대기 시간

/**
 * 지연 함수
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 이미지 생성 시도 (재시도 로직 포함)
 */
async function tryGenerateImage(
  jobData: Job,
  maxRetries: number
): Promise<{ success: true; image: GeneratedImage; retries: number } | { success: false; error: string; retries: number }> {
  let lastError = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎨 [${jobData.modelId}] 이미지 생성 시도 ${attempt}/${maxRetries}`);
      
      const generatedImage = await generateImage({
        prompt: jobData.prompt,
        modelId: jobData.modelId,
        referenceImageUrl: jobData.referenceImageUrl || undefined,
        width: 1024,
        height: 1024,
      });
      
      return { success: true, image: generatedImage, retries: attempt - 1 };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`❌ [${jobData.modelId}] 시도 ${attempt}/${maxRetries} 실패:`, lastError);
      
      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        console.log(`⏳ ${RETRY_DELAY_MS}ms 후 재시도...`);
        await delay(RETRY_DELAY_MS);
      }
    }
  }
  
  return { success: false, error: lastError, retries: maxRetries };
}

/**
 * Job 생성 시 이미지 생성 작업 수행 (v2)
 */
export const jobWorker = onDocumentCreated(
  {
    document: 'tasks/{taskId}/jobs/{jobId}',
    region: 'asia-northeast3',
    timeoutSeconds: 300,
    memory: '1GiB',
    maxInstances: SYSTEM_MAX_INSTANCES,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const { taskId, jobId } = event.params;
    const jobData = snapshot.data() as Job;

    // pending 상태의 Job만 처리
    if (jobData.status !== 'pending') {
      console.log(`ℹ️ Job ${jobId} is not pending, skipping`);
      return;
    }

    const { userId, modelId } = jobData;
    console.log(`🚀 Job ${jobId} 시작: Task=${taskId}, Model=${modelId}, User=${userId}`);

    // Job 상태를 processing으로 업데이트
    await snapshot.ref.update({
      status: 'processing',
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 이미지 생성 시도 (내부에서 재시도 처리)
    const result = await tryGenerateImage(jobData, MAX_RETRIES);

    if (result.success === false) {
      // 모든 재시도 실패
      console.error(`☠️ Job ${jobId} 영구 실패 (${MAX_RETRIES}회 재시도 후)`);

      await snapshot.ref.update({
        status: 'failed',
        retries: result.retries,
        errorMessage: result.error,
        finishedAt: fieldValue.serverTimestamp(),
        updatedAt: fieldValue.serverTimestamp(),
      });

      await refundJobPoints(taskId, jobData);
      return;
    }

    // 이미지 생성 성공
    const generatedImage = result.image;
    console.log(`🎨 이미지 생성 완료 (${result.retries}회 재시도 후): ${generatedImage.url.substring(0, 50)}...`);

    try {
      const bucket = storage.bucket();
      const uploadedUrls: string[] = [];

      // Midjourney는 여러 이미지를 반환 (urls 배열)
      const imagesToProcess = generatedImage.urls || [generatedImage.url];
      console.log(`📦 ${imagesToProcess.length}장 이미지 처리 중...`);

      for (let i = 0; i < imagesToProcess.length; i++) {
        const imgUrl = imagesToProcess[i];
        let imageBuffer: Buffer;

        if (generatedImage.isBase64) {
          // base64 데이터를 직접 Buffer로 변환
          console.log(`📦 [Base64] 직접 변환 중...`);
          imageBuffer = Buffer.from(imgUrl, 'base64');
        } else {
          // URL에서 이미지 다운로드
          const imageResponse = await fetch(imgUrl);
          if (!imageResponse.ok) {
            throw new Error(`이미지 다운로드 실패: ${imageResponse.statusText}`);
          }
          imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        }

        // Firebase Storage에 업로드
        const suffix = imagesToProcess.length > 1 ? `_${i + 1}` : '';
        const filename = `generations/${taskId}/${jobId}${suffix}_${generatedImage.modelId}.png`;
        const file = bucket.file(filename);

        await file.save(Buffer.from(imageBuffer), {
          contentType: 'image/png',
          metadata: {
            cacheControl: 'public, max-age=2592000',
            metadata: { taskId, jobId, modelId: generatedImage.modelId },
          },
        });

        await file.makePublic();
        const uploadedUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        uploadedUrls.push(uploadedUrl);
        console.log(`☁️ Storage 업로드 완료 (${i + 1}/${imagesToProcess.length}): ${uploadedUrl}`);
      }

      // Job 상태 업데이트: completed
      await snapshot.ref.update({
        status: 'completed',
        retries: result.retries,
        imageUrl: uploadedUrls[0], // 대표 이미지
        imageUrls: uploadedUrls,   // 모든 이미지 (Midjourney 4장)
        thumbnailUrl: uploadedUrls[0],
        finishedAt: fieldValue.serverTimestamp(),
        updatedAt: fieldValue.serverTimestamp(),
      });

      console.log(`✅ Job ${jobId} 완료 (${uploadedUrls.length}장)`);

    } catch (error) {
      // Storage 업로드 실패 (이미지 생성은 성공했으나 업로드 실패)
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Job ${jobId} Storage 업로드 실패:`, errorMessage);

      await snapshot.ref.update({
        status: 'failed',
        errorMessage: `Storage 업로드 실패: ${errorMessage}`,
        finishedAt: fieldValue.serverTimestamp(),
        updatedAt: fieldValue.serverTimestamp(),
      });

      await refundJobPoints(taskId, jobData);
    }
  }
);

/**
 * 실패한 Job에 대한 포인트 환불
 */
async function refundJobPoints(taskId: string, jobData: Job): Promise<void> {
  const taskRef = db.collection('tasks').doc(taskId);
  
  try {
    await db.runTransaction(async (transaction) => {
      const taskDoc = await transaction.get(taskRef);
      if (!taskDoc.exists) {
        console.error(`Task ${taskId} not found for refund`);
        return;
      }

      const task = taskDoc.data() as Task;
      const userRef = db.collection('users').doc(task.userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        console.error(`User ${task.userId} not found for refund`);
        return;
      }

      const userData = userDoc.data() as User;
      const refundAmount = jobData.pointsCost;

      transaction.update(userRef, {
        points: fieldValue.increment(refundAmount),
        updatedAt: fieldValue.serverTimestamp(),
      });

      const transactionRef = db.collection('pointTransactions').doc();
      transaction.set(transactionRef, {
        userId: task.userId,
        amount: refundAmount,
        type: 'refund',
        description: `이미지 생성 실패 환불 (${jobData.modelId})`,
        relatedGenerationId: taskId,
        balanceBefore: userData.points,
        balanceAfter: userData.points + refundAmount,
        createdAt: fieldValue.serverTimestamp(),
      });
    });

    console.log(`💰 포인트 환불 완료: ${jobData.pointsCost}pt → ${jobData.userId}`);
  } catch (error) {
    console.error('포인트 환불 실패:', error);
  }
}