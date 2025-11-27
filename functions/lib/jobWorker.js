"use strict";
/**
 * Job Worker Firebase Function (v2)
 * Firestore Trigger: Job 문서가 생성되면 이미지 생성 작업 수행
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobWorker = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("./utils/firestore");
const imageGeneration_1 = require("./utils/imageGeneration");
const types_1 = require("./types");
const node_fetch_1 = __importDefault(require("node-fetch"));
const MAX_RETRIES = 3;
/**
 * Job 생성 시 이미지 생성 작업 수행 (v2)
 */
exports.jobWorker = (0, firestore_1.onDocumentCreated)({
    document: 'tasks/{taskId}/jobs/{jobId}',
    region: 'asia-northeast3',
    timeoutSeconds: 300,
    memory: '1GiB',
    maxInstances: types_1.SYSTEM_MAX_INSTANCES,
}, async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log('No data associated with the event');
        return;
    }
    const { taskId, jobId } = event.params;
    const jobData = snapshot.data();
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
        updatedAt: firestore_2.fieldValue.serverTimestamp(),
    });
    try {
        // 1. AI 모델로 이미지 생성
        const generatedImage = await (0, imageGeneration_1.generateImage)({
            prompt: jobData.prompt,
            modelId: jobData.modelId,
            referenceImageUrl: jobData.referenceImageUrl || undefined,
            width: 1024,
            height: 1024,
        });
        console.log(`🎨 이미지 생성 완료: ${generatedImage.url.substring(0, 50)}...`);
        // 2. 생성된 이미지 다운로드 (base64인 경우 직접 변환)
        let imageBuffer;
        if (generatedImage.isBase64) {
            // base64 데이터를 직접 Buffer로 변환
            console.log(`📦 [Base64] 직접 변환 중...`);
            imageBuffer = Buffer.from(generatedImage.url, 'base64');
        }
        else {
            // URL에서 이미지 다운로드
            const imageResponse = await (0, node_fetch_1.default)(generatedImage.url);
            if (!imageResponse.ok) {
                throw new Error(`이미지 다운로드 실패: ${imageResponse.statusText}`);
            }
            imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        }
        // 3. Firebase Storage에 업로드
        const bucket = firestore_2.storage.bucket();
        const filename = `generations/${taskId}/${jobId}_${generatedImage.modelId}.png`;
        const file = bucket.file(filename);
        await file.save(Buffer.from(imageBuffer), {
            contentType: 'image/png',
            metadata: {
                cacheControl: 'public, max-age=2592000',
                metadata: { taskId, jobId, modelId: generatedImage.modelId },
            },
        });
        await file.makePublic();
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        console.log(`☁️ Storage 업로드 완료: ${imageUrl}`);
        // 4. Job 상태 업데이트: completed
        await snapshot.ref.update({
            status: 'completed',
            imageUrl,
            thumbnailUrl: imageUrl,
            finishedAt: firestore_2.fieldValue.serverTimestamp(),
            updatedAt: firestore_2.fieldValue.serverTimestamp(),
        });
        console.log(`✅ Job ${jobId} 완료`);
    }
    catch (error) {
        console.error(`❌ Job ${jobId} 실패:`, error);
        const retries = (jobData.retries || 0) + 1;
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (retries <= MAX_RETRIES) {
            console.log(`🔄 Job ${jobId} 재시도 (${retries}/${MAX_RETRIES})`);
            const taskRef = firestore_2.db.collection('tasks').doc(taskId);
            const newJobRef = taskRef.collection('jobs').doc();
            await firestore_2.db.runTransaction(async (transaction) => {
                transaction.update(snapshot.ref, {
                    status: 'failed',
                    errorMessage: `재시도 중... (${retries}/${MAX_RETRIES})`,
                    updatedAt: firestore_2.fieldValue.serverTimestamp(),
                });
                transaction.set(newJobRef, {
                    taskId,
                    userId: jobData.userId,
                    prompt: jobData.prompt,
                    modelId: jobData.modelId,
                    status: 'pending',
                    retries,
                    pointsCost: jobData.pointsCost,
                    referenceImageUrl: jobData.referenceImageUrl,
                    createdAt: firestore_2.fieldValue.serverTimestamp(),
                    updatedAt: firestore_2.fieldValue.serverTimestamp(),
                });
            });
        }
        else {
            console.error(`☠️ Job ${jobId} 영구 실패 (재시도 ${MAX_RETRIES}회 초과)`);
            await snapshot.ref.update({
                status: 'failed',
                errorMessage,
                finishedAt: firestore_2.fieldValue.serverTimestamp(),
                updatedAt: firestore_2.fieldValue.serverTimestamp(),
            });
            await refundJobPoints(taskId, jobData);
        }
    }
});
/**
 * 실패한 Job에 대한 포인트 환불
 */
async function refundJobPoints(taskId, jobData) {
    const taskRef = firestore_2.db.collection('tasks').doc(taskId);
    try {
        await firestore_2.db.runTransaction(async (transaction) => {
            const taskDoc = await transaction.get(taskRef);
            if (!taskDoc.exists) {
                console.error(`Task ${taskId} not found for refund`);
                return;
            }
            const task = taskDoc.data();
            const userRef = firestore_2.db.collection('users').doc(task.userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                console.error(`User ${task.userId} not found for refund`);
                return;
            }
            const userData = userDoc.data();
            const refundAmount = jobData.pointsCost;
            transaction.update(userRef, {
                points: firestore_2.fieldValue.increment(refundAmount),
                updatedAt: firestore_2.fieldValue.serverTimestamp(),
            });
            const transactionRef = firestore_2.db.collection('pointTransactions').doc();
            transaction.set(transactionRef, {
                userId: task.userId,
                amount: refundAmount,
                type: 'refund',
                description: `이미지 생성 실패 환불 (${jobData.modelId})`,
                relatedGenerationId: taskId,
                balanceBefore: userData.points,
                balanceAfter: userData.points + refundAmount,
                createdAt: firestore_2.fieldValue.serverTimestamp(),
            });
        });
        console.log(`💰 포인트 환불 완료: ${jobData.pointsCost}pt → ${jobData.userId}`);
    }
    catch (error) {
        console.error('포인트 환불 실패:', error);
    }
}
//# sourceMappingURL=jobWorker.js.map