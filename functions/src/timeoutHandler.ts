/**
 * Task 타임아웃 핸들러
 * 10분 이상 processing 상태인 Task를 부분 완료로 처리
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db, fieldValue } from './utils/firestore';
import { createZipAndUpload } from './utils/zip';
import { sendEmail, getGenerationCompleteEmailHTML } from './utils/email';
import { Task, Job, User } from './types';

const TIMEOUT_MINUTES = 10;

/**
 * 5분마다 실행되는 타임아웃 체크 함수
 */
export const checkTaskTimeout = onSchedule(
  {
    schedule: 'every 5 minutes',
    region: 'asia-northeast3',
    timeoutSeconds: 540,
    memory: '2GiB',
  },
  async () => {
    console.log('🕐 타임아웃 체크 시작...');

    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - TIMEOUT_MINUTES * 60 * 1000);

    // processing 상태인 Task 조회
    const tasksSnapshot = await db.collection('tasks')
      .where('status', 'in', ['pending', 'processing'])
      .get();

    if (tasksSnapshot.empty) {
      console.log('처리 대기 중인 Task 없음');
      return;
    }

    console.log(`📋 ${tasksSnapshot.size}개 Task 확인 중...`);

    for (const taskDoc of tasksSnapshot.docs) {
      const task = taskDoc.data() as Task;
      const taskId = taskDoc.id;

      // createdAt 확인
      const createdAt = task.createdAt as any;
      if (!createdAt || !createdAt.toDate) {
        continue;
      }

      const taskCreatedAt = createdAt.toDate();
      
      // 10분 미만이면 스킵
      if (taskCreatedAt > timeoutThreshold) {
        continue;
      }

      console.log(`⏰ Task ${taskId} 타임아웃 (${Math.round((now.getTime() - taskCreatedAt.getTime()) / 60000)}분 경과)`);

      // 완료된 Job들의 이미지 수집
      const jobsSnapshot = await taskDoc.ref.collection('jobs').get();
      
      let completedJobs = 0;
      let failedJobs = 0;
      let pendingJobs = 0;
      let processingJobs = 0;
      let failedPoints = 0;
      const imageUrls: string[] = [];

      jobsSnapshot.forEach(doc => {
        const job = doc.data() as Job;
        
        switch (job.status) {
          case 'completed':
            completedJobs++;
            if (job.imageUrls && job.imageUrls.length > 0) {
              imageUrls.push(...job.imageUrls);
            } else if (job.imageUrl) {
              imageUrls.push(job.imageUrl);
            }
            break;
          case 'failed':
            failedJobs++;
            failedPoints += job.pointsCost || 0;
            break;
          case 'pending':
            pendingJobs++;
            failedPoints += job.pointsCost || 0; // 대기 중인 것도 환불
            break;
          case 'processing':
            processingJobs++;
            failedPoints += job.pointsCost || 0; // 처리 중인 것도 환불
            break;
        }
      });

      // 대기/처리 중인 Job들을 failed로 변경
      const batch = db.batch();
      jobsSnapshot.forEach(doc => {
        const job = doc.data() as Job;
        if (job.status === 'pending' || job.status === 'processing') {
          batch.update(doc.ref, {
            status: 'failed',
            errorMessage: '타임아웃으로 인해 취소됨',
            finishedAt: fieldValue.serverTimestamp(),
            updatedAt: fieldValue.serverTimestamp(),
          });
        }
      });
      await batch.commit();

      // 환불 처리
      const timedOutCount = pendingJobs + processingJobs;
      if (failedPoints > 0) {
        await processRefund(task.userId, taskId, failedPoints, timedOutCount + failedJobs, task.totalImages);
        console.log(`💰 ${failedPoints} 포인트 환불 (타임아웃: ${timedOutCount}개, 실패: ${failedJobs}개)`);
      }

      // Task 상태 결정
      let finalStatus: Task['status'];
      let failedReason: string;

      if (completedJobs === 0) {
        finalStatus = 'failed';
        failedReason = '10분 타임아웃으로 인해 이미지 생성이 취소되었습니다.';
      } else {
        finalStatus = 'completed';
        failedReason = `${timedOutCount + failedJobs}개 이미지 생성 실패/타임아웃 (${failedPoints}P 자동 환불됨)`;
      }

      // 결과 페이지 URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imagefactory.co.kr';
      const resultPageUrl = `${appUrl}/generation/${taskId}`;

      // Task 업데이트
      const updateData: Record<string, any> = {
        status: finalStatus,
        progress: 100,
        imageUrls,
        resultPageUrl,
        failedReason,
        finishedAt: fieldValue.serverTimestamp(),
        updatedAt: fieldValue.serverTimestamp(),
      };

      await taskDoc.ref.update(updateData);

      // 사용자 통계 업데이트
      if (completedJobs > 0) {
        const userRef = db.collection('users').doc(task.userId);
        await userRef.update({
          'stats.totalGenerations': fieldValue.increment(1),
          'stats.totalImages': fieldValue.increment(completedJobs),
          updatedAt: fieldValue.serverTimestamp(),
        });
      }

      // ZIP 생성 및 이메일 발송
      if (finalStatus === 'completed' && imageUrls.length > 0) {
        await processCompletedTask(taskId, task, imageUrls, resultPageUrl, timedOutCount + failedJobs, failedPoints);
      }

      console.log(`✅ Task ${taskId} 부분 완료 처리 (${completedJobs}/${task.totalImages}장 성공)`);
    }

    console.log('🕐 타임아웃 체크 완료');
  }
);

/**
 * 환불 처리
 */
async function processRefund(
  userId: string,
  taskId: string,
  refundPoints: number,
  failedCount: number,
  totalCount: number
): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) {
    console.error(`환불 실패: 사용자 ${userId} 없음`);
    return;
  }

  const userData = userDoc.data() as User;
  const currentPoints = userData.points || 0;
  const newPoints = currentPoints + refundPoints;

  await userRef.update({
    points: newPoints,
    updatedAt: fieldValue.serverTimestamp(),
  });

  const transactionRef = db.collection('pointTransactions').doc();
  await transactionRef.set({
    userId,
    type: 'refund',
    amount: refundPoints,
    balanceBefore: currentPoints,
    balanceAfter: newPoints,
    description: `이미지 생성 타임아웃/실패 환불 (${failedCount}/${totalCount}개)`,
    relatedTaskId: taskId,
    createdAt: fieldValue.serverTimestamp(),
  });
}

/**
 * 완료된 Task 처리 (ZIP 생성 + 이메일 발송)
 */
async function processCompletedTask(
  taskId: string,
  task: Task,
  imageUrls: string[],
  resultPageUrl: string,
  failedJobs: number,
  refundedPoints: number
): Promise<void> {
  const taskRef = db.collection('tasks').doc(taskId);

  let zipUrl: string | undefined;
  try {
    if (imageUrls.length >= 1) {
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

  const userDoc = await db.collection('users').doc(task.userId).get();
  const userData = userDoc.data() as User;

  try {
    await sendEmail({
      to: task.userEmail,
      subject: '🎨 ImageFactory - 이미지 생성 완료 (일부 타임아웃)',
      html: getGenerationCompleteEmailHTML({
        displayName: userData?.displayName || '사용자',
        totalImages: task.totalImages,
        successImages: imageUrls.length,
        failedImages: failedJobs,
        prompt: task.prompt,
        resultPageUrl,
        zipUrl,
      }),
    });
    console.log(`📧 완료 이메일 발송: ${task.userEmail}`);
  } catch (error) {
    console.error('이메일 발송 실패:', error);
  }
}


