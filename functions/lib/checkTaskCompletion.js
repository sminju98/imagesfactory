"use strict";
/**
 * Task 완료 체크 Firebase Function (v2)
 * Firestore Trigger: Job 상태가 변경되면 Task 완료 여부 확인
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTaskCompletion = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("./utils/firestore");
const zip_1 = require("./utils/zip");
const email_1 = require("./utils/email");
/**
 * Job 업데이트 시 Task 완료 여부 확인 (v2)
 */
exports.checkTaskCompletion = (0, firestore_1.onDocumentUpdated)({
    document: 'tasks/{taskId}/jobs/{jobId}',
    region: 'asia-northeast3',
    timeoutSeconds: 540,
    memory: '2GiB',
}, async (event) => {
    const change = event.data;
    if (!change) {
        console.log('No data associated with the event');
        return;
    }
    const { taskId, jobId } = event.params;
    const newData = change.after.data();
    const oldData = change.before.data();
    // 상태 변경 확인
    if (newData.status === oldData.status) {
        return;
    }
    // completed 또는 failed로 변경된 경우만 처리
    if (newData.status !== 'completed' && newData.status !== 'failed') {
        return;
    }
    // requeued 상태에서 변경된 경우는 무시
    if (oldData.status === 'requeued') {
        return;
    }
    console.log(`🔍 Job ${jobId} 상태 변경: ${oldData.status} → ${newData.status}`);
    const taskRef = firestore_2.db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
        console.error(`Task ${taskId} not found`);
        return;
    }
    const task = taskDoc.data();
    // 이미 완료된 Task는 스킵
    if (task.status === 'completed' || task.status === 'failed') {
        console.log(`ℹ️ Task ${taskId} already ${task.status}, skipping`);
        return;
    }
    // 모든 Job 조회
    const jobsSnapshot = await taskRef.collection('jobs').get();
    let completedJobs = 0;
    let failedJobs = 0;
    let pendingJobs = 0;
    let processingJobs = 0;
    let requeuedJobs = 0;
    let failedPoints = 0; // 실패한 Job들의 포인트 합계
    const imageUrls = [];
    jobsSnapshot.forEach(doc => {
        const job = doc.data();
        switch (job.status) {
            case 'completed':
                completedJobs++;
                // Midjourney는 imageUrls 배열 사용 (4장)
                if (job.imageUrls && job.imageUrls.length > 0) {
                    imageUrls.push(...job.imageUrls);
                }
                else if (job.imageUrl) {
                    imageUrls.push(job.imageUrl);
                }
                break;
            case 'failed':
                failedJobs++;
                failedPoints += job.pointsCost || 0; // 실패한 포인트 누적
                break;
            case 'pending':
                pendingJobs++;
                break;
            case 'processing':
                processingJobs++;
                break;
            case 'requeued':
                requeuedJobs++;
                break;
        }
    });
    const totalJobs = jobsSnapshot.size - requeuedJobs;
    const finishedJobs = completedJobs + failedJobs;
    const progress = Math.round((finishedJobs / totalJobs) * 100);
    console.log(`📊 Task ${taskId}: ${completedJobs} completed, ${failedJobs} failed, ${pendingJobs} pending, ${processingJobs} processing (${progress}%)`);
    // Task 상태를 processing으로 업데이트
    if (task.status === 'pending' && (processingJobs > 0 || finishedJobs > 0)) {
        await taskRef.update({
            status: 'processing',
            updatedAt: firestore_2.fieldValue.serverTimestamp(),
        });
    }
    // 진행률 업데이트
    await taskRef.update({
        progress,
        updatedAt: firestore_2.fieldValue.serverTimestamp(),
    });
    // 모든 Job이 완료되었는지 확인
    if (pendingJobs > 0 || processingJobs > 0) {
        return;
    }
    console.log(`🎉 Task ${taskId} 모든 Job 완료!`);
    // Task 최종 상태 결정
    let finalStatus;
    let failedReason;
    let refundedPoints = 0;
    if (completedJobs === 0) {
        finalStatus = 'failed';
        failedReason = '모든 이미지 생성에 실패했습니다.';
        refundedPoints = task.totalPoints; // 전액 환불
    }
    else {
        finalStatus = 'completed';
        if (failedJobs > 0) {
            refundedPoints = failedPoints; // 부분 환불
            failedReason = `${failedJobs}개 이미지 생성 실패 (${refundedPoints} 포인트 자동 환불됨)`;
        }
    }
    // 부분/전액 환불 처리
    if (refundedPoints > 0) {
        await processRefund(task.userId, taskId, refundedPoints, failedJobs, task.totalImages);
        console.log(`💰 ${refundedPoints} 포인트 환불 완료 (실패: ${failedJobs}개)`);
    }
    // 결과 페이지 URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imagefactory.co.kr';
    const resultPageUrl = `${appUrl}/generation/${taskId}`;
    // Task 업데이트 (undefined 값 제외)
    const updateData = {
        status: finalStatus,
        progress: 100,
        imageUrls,
        resultPageUrl,
        finishedAt: firestore_2.fieldValue.serverTimestamp(),
        updatedAt: firestore_2.fieldValue.serverTimestamp(),
    };
    // failedReason이 있을 때만 추가
    if (failedReason) {
        updateData.failedReason = failedReason;
    }
    await taskRef.update(updateData);
    // 사용자 통계 업데이트
    const userRef = firestore_2.db.collection('users').doc(task.userId);
    await userRef.update({
        'stats.totalGenerations': firestore_2.fieldValue.increment(1),
        'stats.totalImages': firestore_2.fieldValue.increment(completedJobs),
        updatedAt: firestore_2.fieldValue.serverTimestamp(),
    });
    // 갤러리에 이미지 추가 (에러가 발생해도 ZIP/이메일은 진행)
    if (completedJobs > 0) {
        try {
            await addImagesToGallery(taskId, task);
        }
        catch (galleryError) {
            console.error('갤러리 추가 실패 (무시하고 계속):', galleryError);
        }
    }
    // ZIP 생성 및 이메일 발송
    if (finalStatus === 'completed' && imageUrls.length > 0) {
        await processCompletedTask(taskId, task, imageUrls, resultPageUrl, failedJobs, refundedPoints);
    }
    else if (finalStatus === 'failed') {
        await processFailedTask(task, refundedPoints);
    }
});
/**
 * 완료된 Task 처리 (ZIP 생성 + 이메일 발송)
 */
async function processCompletedTask(taskId, task, imageUrls, resultPageUrl, failedJobs, refundedPoints) {
    const taskRef = firestore_2.db.collection('tasks').doc(taskId);
    let zipUrl;
    try {
        if (imageUrls.length >= 1) {
            zipUrl = await (0, zip_1.createZipAndUpload)(taskId, imageUrls);
            await taskRef.update({
                zipUrl,
                updatedAt: firestore_2.fieldValue.serverTimestamp(),
            });
            console.log(`📦 ZIP 생성 완료: ${zipUrl}`);
        }
    }
    catch (error) {
        console.error('ZIP 생성 실패:', error);
    }
    const userDoc = await firestore_2.db.collection('users').doc(task.userId).get();
    const userData = userDoc.data();
    try {
        await (0, email_1.sendEmail)({
            to: task.userEmail,
            subject: '🎨 ImageFactory - 이미지 생성 완료!',
            html: (0, email_1.getGenerationCompleteEmailHTML)({
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
    }
    catch (error) {
        console.error('이메일 발송 실패:', error);
    }
}
/**
 * 실패한 Task 처리 (이메일 발송)
 */
async function processFailedTask(task, refundedPoints) {
    const userDoc = await firestore_2.db.collection('users').doc(task.userId).get();
    const userData = userDoc.data();
    try {
        await (0, email_1.sendEmail)({
            to: task.userEmail,
            subject: '😢 ImageFactory - 이미지 생성 실패 안내',
            html: (0, email_1.getGenerationFailedEmailHTML)({
                displayName: userData?.displayName || '사용자',
                prompt: task.prompt,
                reason: '서버 오류로 인해 이미지 생성에 실패했습니다.',
                refundedPoints: refundedPoints,
            }),
        });
        console.log(`📧 실패 이메일 발송: ${task.userEmail}`);
    }
    catch (error) {
        console.error('이메일 발송 실패:', error);
    }
}
/**
 * 부분/전액 환불 처리
 */
async function processRefund(userId, taskId, refundPoints, failedCount, totalCount) {
    const userRef = firestore_2.db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        console.error(`환불 실패: 사용자 ${userId} 없음`);
        return;
    }
    const userData = userDoc.data();
    const currentPoints = userData.points || 0;
    const newPoints = currentPoints + refundPoints;
    // 사용자 포인트 증가
    await userRef.update({
        points: newPoints,
        updatedAt: firestore_2.fieldValue.serverTimestamp(),
    });
    // 환불 트랜잭션 기록
    const transactionRef = firestore_2.db.collection('pointTransactions').doc();
    await transactionRef.set({
        userId,
        type: 'refund',
        amount: refundPoints,
        balanceBefore: currentPoints,
        balanceAfter: newPoints,
        description: failedCount === totalCount
            ? `이미지 생성 전체 실패 환불 (${failedCount}개)`
            : `이미지 생성 부분 실패 환불 (${failedCount}/${totalCount}개 실패)`,
        relatedTaskId: taskId,
        createdAt: firestore_2.fieldValue.serverTimestamp(),
    });
    console.log(`💰 환불 트랜잭션 기록: ${refundPoints}P (${currentPoints} → ${newPoints})`);
}
/**
 * 갤러리에 이미지 추가
 */
async function addImagesToGallery(taskId, task) {
    const taskRef = firestore_2.db.collection('tasks').doc(taskId);
    const jobsSnapshot = await taskRef.collection('jobs')
        .where('status', '==', 'completed')
        .get();
    const batch = firestore_2.db.batch();
    const appUrl = process.env.CDN_DOMAIN || 'https://cdn.imagefactory.co.kr';
    jobsSnapshot.forEach(doc => {
        const job = doc.data();
        if (!job.imageUrl)
            return;
        const galleryRef = firestore_2.db.collection('gallery')
            .doc(task.userId)
            .collection('images')
            .doc();
        // galleryImage 객체 생성 (undefined 필드 제외)
        const galleryImage = {
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
            fileSize: 0,
            likesCount: 0,
            commentsCount: 0,
            isPublic: true,
            evolutionGeneration: 0,
            createdAt: firestore_2.fieldValue.serverTimestamp(),
        };
        // parentImageId가 있을 때만 추가
        if (task.evolutionSourceId) {
            galleryImage.parentImageId = task.evolutionSourceId;
        }
        batch.set(galleryRef, galleryImage);
    });
    await batch.commit();
    console.log(`🖼️ 갤러리에 ${jobsSnapshot.size}개 이미지 추가`);
}
//# sourceMappingURL=checkTaskCompletion.js.map