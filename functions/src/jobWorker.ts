/**
 * Job Worker Firebase Function (v2)
 * Firestore Trigger: Job 문서가 생성되면 이미지 생성 작업 수행
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db, storage, fieldValue } from './utils/firestore';
import { generateImage } from './utils/imageGeneration';
import { Job, Task, User, SYSTEM_MAX_INSTANCES } from './types';
import fetch from 'node-fetch';

const MAX_RETRIES = 3;

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

    try {
      // 1. AI 모델로 이미지 생성
      const generatedImage = await generateImage({
        prompt: jobData.prompt,
        modelId: jobData.modelId,
        referenceImageUrl: jobData.referenceImageUrl || undefined,
        width: 1024,
        height: 1024,
      });

      console.log(`🎨 이미지 생성 완료: ${generatedImage.url.substring(0, 50)}...`);

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

      // 4. Job 상태 업데이트: completed
      await snapshot.ref.update({
        status: 'completed',
        imageUrl: uploadedUrls[0], // 대표 이미지
        imageUrls: uploadedUrls,   // 모든 이미지 (Midjourney 4장)
        thumbnailUrl: uploadedUrls[0],
        finishedAt: fieldValue.serverTimestamp(),
        updatedAt: fieldValue.serverTimestamp(),
      });

      console.log(`✅ Job ${jobId} 완료 (${uploadedUrls.length}장)`);

    } catch (error) {
      console.error(`❌ Job ${jobId} 실패:`, error);

      const retries = (jobData.retries || 0) + 1;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (retries <= MAX_RETRIES) {
        console.log(`🔄 Job ${jobId} 재시도 (${retries}/${MAX_RETRIES})`);
        
        // 기존 Job을 pending으로 되돌려서 재시도 (새 Job 생성하지 않음)
        await snapshot.ref.update({
          status: 'pending',
          retries,
          errorMessage: `재시도 예정... (${retries}/${MAX_RETRIES})`,
          updatedAt: fieldValue.serverTimestamp(),
        });

      } else {
        console.error(`☠️ Job ${jobId} 영구 실패 (재시도 ${MAX_RETRIES}회 초과)`);

        await snapshot.ref.update({
          status: 'failed',
          errorMessage,
          finishedAt: fieldValue.serverTimestamp(),
          updatedAt: fieldValue.serverTimestamp(),
        });

        await refundJobPoints(taskId, jobData);
      }
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
