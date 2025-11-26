"use strict";
/**
 * Job Worker Firebase Function
 * Firestore Trigger: Job 문서가 생성되면 이미지 생성 작업 수행
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobWorker = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("./utils/firestore");
const imageGeneration_1 = require("./utils/imageGeneration");
const node_fetch_1 = __importDefault(require("node-fetch"));
const MAX_RETRIES = 3;
/**
 * Job 생성 시 이미지 생성 작업 수행
 */
exports.jobWorker = functions
    .region('asia-northeast3')
    .runWith({
    timeoutSeconds: 300, // 5분
    memory: '1GB',
})
    .firestore
    .document('tasks/{taskId}/jobs/{jobId}')
    .onCreate(async (snapshot, context) => {
    const { taskId, jobId } = context.params;
    const jobData = snapshot.data();
    // pending 상태의 Job만 처리
    if (jobData.status !== 'pending') {
        console.log(`ℹ️ Job ${jobId} is not pending, skipping`);
        return null;
    }
    console.log(`🚀 Job ${jobId} 시작: Task=${taskId}, Model=${jobData.modelId}`);
    // Job 상태를 processing으로 업데이트
    await snapshot.ref.update({
        status: 'processing',
        updatedAt: firestore_1.fieldValue.serverTimestamp(),
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
        // 2. 생성된 이미지 다운로드
        const imageResponse = await (0, node_fetch_1.default)(generatedImage.url);
        if (!imageResponse.ok) {
            throw new Error(`이미지 다운로드 실패: ${imageResponse.statusText}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        // 3. Firebase Storage에 업로드
        const bucket = firestore_1.storage.bucket();
        const filename = `generations/${taskId}/${jobId}_${generatedImage.modelId}.png`;
        const file = bucket.file(filename);
        await file.save(Buffer.from(imageBuffer), {
            contentType: 'image/png',
            metadata: {
                cacheControl: 'public, max-age=2592000', // 30일
                metadata: {
                    taskId,
                    jobId,
                    modelId: generatedImage.modelId,
                },
            },
        });
        await file.makePublic();
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        console.log(`☁️ Storage 업로드 완료: ${imageUrl}`);
        // TODO: 썸네일 생성 (Sharp 사용)
        const thumbnailUrl = imageUrl; // 임시로 원본 URL 사용
        // 4. Job 상태 업데이트: completed
        await snapshot.ref.update({
            status: 'completed',
            imageUrl,
            thumbnailUrl,
            finishedAt: firestore_1.fieldValue.serverTimestamp(),
            updatedAt: firestore_1.fieldValue.serverTimestamp(),
        });
        console.log(`✅ Job ${jobId} 완료`);
    }
    catch (error) {
        console.error(`❌ Job ${jobId} 실패:`, error);
        const retries = (jobData.retries || 0) + 1;
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (retries <= MAX_RETRIES) {
            // 재시도: 상태를 pending으로 변경
            console.log(`🔄 Job ${jobId} 재시도 (${retries}/${MAX_RETRIES})`);
            // 재시도를 위해 새 Job 문서 생성 (기존 Job은 실패로 표시)
            const taskRef = firestore_1.db.collection('tasks').doc(taskId);
            const newJobRef = taskRef.collection('jobs').doc();
            await firestore_1.db.runTransaction(async (transaction) => {
                // 기존 Job 실패 표시
                transaction.update(snapshot.ref, {
                    status: 'failed',
                    errorMessage: `재시도 중... (${retries}/${MAX_RETRIES})`,
                    updatedAt: firestore_1.fieldValue.serverTimestamp(),
                });
                // 새 Job 생성
                transaction.set(newJobRef, {
                    taskId,
                    userId: jobData.userId,
                    prompt: jobData.prompt,
                    modelId: jobData.modelId,
                    status: 'pending',
                    retries,
                    pointsCost: jobData.pointsCost,
                    referenceImageUrl: jobData.referenceImageUrl,
                    createdAt: firestore_1.fieldValue.serverTimestamp(),
                    updatedAt: firestore_1.fieldValue.serverTimestamp(),
                });
            });
        }
        else {
            // 최대 재시도 초과: 실패 처리 및 포인트 환불
            console.error(`☠️ Job ${jobId} 영구 실패 (재시도 ${MAX_RETRIES}회 초과)`);
            await snapshot.ref.update({
                status: 'failed',
                errorMessage,
                finishedAt: firestore_1.fieldValue.serverTimestamp(),
                updatedAt: firestore_1.fieldValue.serverTimestamp(),
            });
            // 포인트 환불
            await refundJobPoints(taskId, jobData);
        }
    }
    return null;
});
/**
 * 실패한 Job에 대한 포인트 환불
 */
async function refundJobPoints(taskId, jobData) {
    const taskRef = firestore_1.db.collection('tasks').doc(taskId);
    try {
        await firestore_1.db.runTransaction(async (transaction) => {
            const taskDoc = await transaction.get(taskRef);
            if (!taskDoc.exists) {
                console.error(`Task ${taskId} not found for refund`);
                return;
            }
            const task = taskDoc.data();
            const userRef = firestore_1.db.collection('users').doc(task.userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                console.error(`User ${task.userId} not found for refund`);
                return;
            }
            const userData = userDoc.data();
            const refundAmount = jobData.pointsCost;
            // 포인트 환불
            transaction.update(userRef, {
                points: firestore_1.fieldValue.increment(refundAmount),
                updatedAt: firestore_1.fieldValue.serverTimestamp(),
            });
            // 환불 거래 내역
            const transactionRef = firestore_1.db.collection('pointTransactions').doc();
            transaction.set(transactionRef, {
                userId: task.userId,
                amount: refundAmount,
                type: 'refund',
                description: `이미지 생성 실패 환불 (${jobData.modelId})`,
                relatedGenerationId: taskId,
                balanceBefore: userData.points,
                balanceAfter: userData.points + refundAmount,
                createdAt: firestore_1.fieldValue.serverTimestamp(),
            });
        });
        console.log(`💰 포인트 환불 완료: ${jobData.pointsCost}pt → ${jobData.userId}`);
    }
    catch (error) {
        console.error('포인트 환불 실패:', error);
    }
}
//# sourceMappingURL=jobWorker.js.map