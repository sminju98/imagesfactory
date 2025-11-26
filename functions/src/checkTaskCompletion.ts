/**
 * Task 완료 체크 Firebase Function
 * Firestore Trigger: Job 상태가 변경되면 Task 완료 여부 확인
 */

import * as functions from 'firebase-functions';
import { db, fieldValue } from './utils/firestore';
import { createZipAndUpload } from './utils/zip';
import { sendEmail, getGenerationCompleteEmailHTML, getGenerationFailedEmailHTML } from './utils/email';
import { Task, Job, User, GalleryImage } from './types';

/**
 * Job 업데이트 시 Task 완료 여부 확인
 */
export const checkTaskCompletion = functions
  .region('asia-northeast3')
  .runWith({
    timeoutSeconds: 540, // 9분 (ZIP 생성 포함)
    memory: '2GB',
  })
  .firestore
  .document('tasks/{taskId}/jobs/{jobId}')
  .onUpdate(async (change, context) => {
    const { taskId, jobId } = context.params;
    const newData = change.after.data() as Job;
    const oldData = change.before.data() as Job;

    // 상태 변경 확인
    if (newData.status === oldData.status) {
      return null;
    }

    // completed 또는 failed로 변경된 경우만 처리
    if (newData.status !== 'completed' && newData.status !== 'failed') {
      return null;
    }

    console.log(`🔍 Job ${jobId} 상태 변경: ${oldData.status} → ${newData.status}`);

    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      console.error(`Task ${taskId} not found`);
      return null;
    }

    const task = taskDoc.data() as Task;

    // 이미 완료된 Task는 스킵
    if (task.status === 'completed' || task.status === 'failed') {
      console.log(`ℹ️ Task ${taskId} already ${task.status}, skipping`);
      return null;
    }

    // 모든 Job 조회
    const jobsSnapshot = await taskRef.collection('jobs').get();
    
    let completedJobs = 0;
    let failedJobs = 0;
    let pendingJobs = 0;
    let processingJobs = 0;
    const imageUrls: string[] = [];

    jobsSnapshot.forEach(doc => {
      const job = doc.data() as Job;
      
      switch (job.status) {
        case 'completed':
          completedJobs++;
          if (job.imageUrl) {
            imageUrls.push(job.imageUrl);
          }
          break;
        case 'failed':
          failedJobs++;
          break;
        case 'pending':
          pendingJobs++;
          break;
        case 'processing':
          processingJobs++;
          break;
      }
    });

    const totalJobs = jobsSnapshot.size;
    const finishedJobs = completedJobs + failedJobs;
    const progress = Math.round((finishedJobs / totalJobs) * 100);

    console.log(`📊 Task ${taskId}: ${completedJobs} completed, ${failedJobs} failed, ${pendingJobs} pending, ${processingJobs} processing (${progress}%)`);

    // Task 상태를 processing으로 업데이트
    if (task.status === 'pending' && (processingJobs > 0 || finishedJobs > 0)) {
      await taskRef.update({
        status: 'processing',
        updatedAt: fieldValue.serverTimestamp(),
      });
    }

    // 진행률 업데이트
    await taskRef.update({
      progress,
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 모든 Job이 완료되었는지 확인
    if (pendingJobs > 0 || processingJobs > 0) {
      return null; // 아직 진행 중인 Job이 있음
    }

    console.log(`🎉 Task ${taskId} 모든 Job 완료!`);

    // Task 최종 상태 결정
    let finalStatus: Task['status'];
    let failedReason: string | undefined;

    if (completedJobs === 0) {
      finalStatus = 'failed';
      failedReason = '모든 이미지 생성에 실패했습니다.';
    } else {
      finalStatus = 'completed';
      if (failedJobs > 0) {
        failedReason = `${failedJobs}개 이미지 생성 실패 (자동 환불됨)`;
      }
    }

    // 결과 페이지 URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imagefactory.co.kr';
    const resultPageUrl = `${appUrl}/generation/${taskId}`;

    // Task 업데이트
    await taskRef.update({
      status: finalStatus,
      progress: 100,
      imageUrls,
      resultPageUrl,
      failedReason,
      finishedAt: fieldValue.serverTimestamp(),
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 사용자 통계 업데이트
    const userRef = db.collection('users').doc(task.userId);
    await userRef.update({
      'stats.totalGenerations': fieldValue.increment(1),
      'stats.totalImages': fieldValue.increment(completedJobs),
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 갤러리에 이미지 추가
    if (completedJobs > 0) {
      await addImagesToGallery(taskId, task);
    }

    // ZIP 생성 및 이메일 발송
    if (finalStatus === 'completed' && imageUrls.length > 0) {
      await processCompletedTask(taskId, task, imageUrls, resultPageUrl, failedJobs);
    } else if (finalStatus === 'failed') {
      await processFailedTask(task);
    }

    return null;
  });

/**
 * 완료된 Task 처리 (ZIP 생성 + 이메일 발송)
 */
async function processCompletedTask(
  taskId: string,
  task: Task,
  imageUrls: string[],
  resultPageUrl: string,
  failedJobs: number
): Promise<void> {
  const taskRef = db.collection('tasks').doc(taskId);

  // ZIP 파일 생성
  let zipUrl: string | undefined;
  try {
    if (imageUrls.length >= 3) { // 3장 이상일 때만 ZIP 생성
      zipUrl = await createZipAndUpload(taskId, imageUrls);
      await taskRef.update({
        zipUrl,
        updatedAt: fieldValue.serverTimestamp(),
      });
      console.log(`📦 ZIP 생성 완료: ${zipUrl}`);
    }
  } catch (error) {
    console.error('ZIP 생성 실패:', error);
  }

  // 사용자 정보 조회
  const userDoc = await db.collection('users').doc(task.userId).get();
  const userData = userDoc.data() as User;

  // 완료 이메일 발송
  try {
    await sendEmail({
      to: task.userEmail,
      subject: '🎨 ImageFactory - 이미지 생성 완료!',
      html: getGenerationCompleteEmailHTML({
        displayName: userData?.displayName || '사용자',
        totalImages: task.totalImages,
        successImages: imageUrls.length,
        failedImages: failedJobs,
        prompt: task.prompt,
        resultPageUrl,
        imageUrls,
        zipUrl,
      }),
    });
    console.log(`📧 완료 이메일 발송: ${task.userEmail}`);
  } catch (error) {
    console.error('이메일 발송 실패:', error);
  }
}

/**
 * 실패한 Task 처리 (이메일 발송)
 */
async function processFailedTask(task: Task): Promise<void> {
  const userDoc = await db.collection('users').doc(task.userId).get();
  const userData = userDoc.data() as User;

  try {
    await sendEmail({
      to: task.userEmail,
      subject: '😢 ImageFactory - 이미지 생성 실패 안내',
      html: getGenerationFailedEmailHTML({
        displayName: userData?.displayName || '사용자',
        prompt: task.prompt,
        reason: '서버 오류로 인해 이미지 생성에 실패했습니다.',
        refundedPoints: task.totalPoints,
      }),
    });
    console.log(`📧 실패 이메일 발송: ${task.userEmail}`);
  } catch (error) {
    console.error('이메일 발송 실패:', error);
  }
}

/**
 * 갤러리에 이미지 추가
 */
async function addImagesToGallery(taskId: string, task: Task): Promise<void> {
  const taskRef = db.collection('tasks').doc(taskId);
  const jobsSnapshot = await taskRef.collection('jobs')
    .where('status', '==', 'completed')
    .get();

  const batch = db.batch();
  const appUrl = process.env.CDN_DOMAIN || 'https://cdn.imagefactory.co.kr';

  jobsSnapshot.forEach(doc => {
    const job = doc.data() as Job;
    
    if (!job.imageUrl) return;

    const galleryRef = db.collection('gallery')
      .doc(task.userId)
      .collection('images')
      .doc();

    const galleryImage: GalleryImage = {
      userId: task.userId,
      taskId,
      jobId: doc.id,
      prompt: task.prompt,
      modelId: job.modelId,
      imageUrl: job.imageUrl,
      thumbnailUrl: job.thumbnailUrl || job.imageUrl,
      publicUrl: `${appUrl}/${task.userId}/${doc.id}.png`,
      width: 1024,
      height: 1024,
      fileSize: 0, // TODO: 실제 파일 크기 계산
      likesCount: 0,
      commentsCount: 0,
      isPublic: true,
      evolutionGeneration: 0,
      parentImageId: task.evolutionSourceId,
      createdAt: fieldValue.serverTimestamp(),
    };

    batch.set(galleryRef, galleryImage);
  });

  await batch.commit();
  console.log(`🖼️ 갤러리에 ${jobsSnapshot.size}개 이미지 추가`);
}

