"use strict";
/**
 * Task 생성 Firebase Function
 * HTTP Callable Function으로 클라이언트에서 호출
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("./utils/firestore");
const types_1 = require("./types");
/**
 * Task 생성 및 Job 생성
 * - 사용자 포인트 확인 및 차감
 * - Task 문서 생성
 * - Job 서브컬렉션에 개별 작업 생성
 */
exports.createTask = functions
    .region('asia-northeast3')
    .https.onCall(async (data, context) => {
    // 1. 인증 확인
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email || '';
    const { prompt, selectedModels, referenceImageUrl, evolutionSourceId } = data;
    // 2. 입력 유효성 검사
    if (!prompt || typeof prompt !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', '프롬프트를 입력해주세요.');
    }
    if (prompt.length < 10) {
        throw new functions.https.HttpsError('invalid-argument', '프롬프트는 최소 10자 이상이어야 합니다.');
    }
    if (prompt.length > 1000) {
        throw new functions.https.HttpsError('invalid-argument', '프롬프트는 최대 1000자까지 입력 가능합니다.');
    }
    if (!selectedModels || Object.keys(selectedModels).length === 0) {
        throw new functions.https.HttpsError('invalid-argument', '최소 1개 이상의 모델을 선택해주세요.');
    }
    // 3. 총 이미지 수 및 포인트 계산
    let totalImages = 0;
    let totalPoints = 0;
    const modelConfigs = [];
    const jobsToCreate = [];
    for (const [modelId, count] of Object.entries(selectedModels)) {
        const numCount = parseInt(String(count), 10);
        if (isNaN(numCount) || numCount <= 0)
            continue;
        if (numCount > 50) {
            throw new functions.https.HttpsError('invalid-argument', `모델당 최대 50장까지 생성 가능합니다. (${modelId})`);
        }
        const pointsPerImage = (0, types_1.getModelPoints)(modelId);
        totalImages += numCount;
        totalPoints += pointsPerImage * numCount;
        modelConfigs.push({
            modelId,
            count: numCount,
            pointsPerImage,
            status: 'pending',
            completedCount: 0,
        });
        // Job 데이터 준비
        for (let i = 0; i < numCount; i++) {
            jobsToCreate.push({
                taskId: '', // 나중에 설정
                userId,
                prompt,
                modelId,
                status: 'pending',
                retries: 0,
                pointsCost: pointsPerImage,
                referenceImageUrl: referenceImageUrl || null,
            });
        }
    }
    if (totalImages === 0) {
        throw new functions.https.HttpsError('invalid-argument', '생성할 이미지가 없습니다.');
    }
    if (totalImages > 100) {
        throw new functions.https.HttpsError('invalid-argument', '한 번에 최대 100장까지 생성 가능합니다.');
    }
    console.log(`📝 Task 생성 시작: userId=${userId}, totalImages=${totalImages}, totalPoints=${totalPoints}`);
    // 4. 사용자 포인트 확인 및 차감 (트랜잭션)
    const userRef = firestore_1.db.collection('users').doc(userId);
    const taskRef = firestore_1.db.collection('tasks').doc();
    const transactionRef = firestore_1.db.collection('pointTransactions').doc();
    try {
        const result = await firestore_1.db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new functions.https.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
            }
            const userData = userDoc.data();
            const currentPoints = userData.points || 0;
            if (currentPoints < totalPoints) {
                throw new functions.https.HttpsError('failed-precondition', `포인트가 부족합니다. 현재: ${currentPoints}pt, 필요: ${totalPoints}pt`);
            }
            // 포인트 차감
            transaction.update(userRef, {
                points: firestore_1.fieldValue.increment(-totalPoints),
                updatedAt: firestore_1.fieldValue.serverTimestamp(),
            });
            // 포인트 거래 내역 저장
            transaction.set(transactionRef, {
                userId,
                amount: -totalPoints,
                type: 'usage',
                description: `이미지 생성 요청 (${totalImages}장)`,
                relatedGenerationId: taskRef.id,
                balanceBefore: currentPoints,
                balanceAfter: currentPoints - totalPoints,
                createdAt: firestore_1.fieldValue.serverTimestamp(),
            });
            // Task 문서 생성
            const newTask = {
                userId,
                userEmail,
                prompt,
                modelConfigs,
                totalImages,
                totalPoints,
                referenceImageUrl: referenceImageUrl || null,
                evolutionSourceId: evolutionSourceId || undefined,
                status: 'pending',
                progress: 0,
                pointsDeducted: true,
                transactionId: transactionRef.id,
                createdAt: firestore_1.fieldValue.serverTimestamp(),
                updatedAt: firestore_1.fieldValue.serverTimestamp(),
            };
            transaction.set(taskRef, newTask);
            return {
                taskId: taskRef.id,
                transactionId: transactionRef.id,
                newBalance: currentPoints - totalPoints,
            };
        });
        // 5. Job 문서 생성 (트랜잭션 외부에서 배치로 처리)
        const batch = firestore_1.db.batch();
        for (const jobData of jobsToCreate) {
            const jobRef = taskRef.collection('jobs').doc();
            batch.set(jobRef, {
                ...jobData,
                taskId: result.taskId,
                createdAt: firestore_1.fieldValue.serverTimestamp(),
                updatedAt: firestore_1.fieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
        console.log(`✅ Task ${result.taskId} 생성 완료: ${totalImages}개 Job 생성`);
        // 예상 소요 시간 계산 (이미지당 평균 10초)
        const estimatedTime = Math.ceil(totalImages * 10);
        return {
            success: true,
            taskId: result.taskId,
            totalImages,
            totalPoints,
            estimatedTime,
            newBalance: result.newBalance,
        };
    }
    catch (error) {
        console.error('❌ Task 생성 실패:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', '이미지 생성 요청 중 오류가 발생했습니다.', error instanceof Error ? error.message : String(error));
    }
});
//# sourceMappingURL=createTask.js.map