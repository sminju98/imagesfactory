"use strict";
/**
 * Task 생성 Firebase Function (v2)
 * HTTP Callable Function으로 클라이언트에서 호출
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("./utils/firestore");
const types_1 = require("./types");
/**
 * Task 생성 및 Job 생성 (v2)
 */
exports.createTask = (0, https_1.onCall)({
    region: 'asia-northeast3',
    memory: '256MiB',
}, async (request) => {
    // 1. 인증 확인
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email || '';
    const data = request.data;
    const { prompt, selectedModels, referenceImageUrl, evolutionSourceId } = data;
    // 2. 입력 유효성 검사
    if (!prompt || typeof prompt !== 'string') {
        throw new https_1.HttpsError('invalid-argument', '프롬프트를 입력해주세요.');
    }
    if (prompt.length < 10) {
        throw new https_1.HttpsError('invalid-argument', '프롬프트는 최소 10자 이상이어야 합니다.');
    }
    if (prompt.length > 1000) {
        throw new https_1.HttpsError('invalid-argument', '프롬프트는 최대 1000자까지 입력 가능합니다.');
    }
    if (!selectedModels || Object.keys(selectedModels).length === 0) {
        throw new https_1.HttpsError('invalid-argument', '최소 1개 이상의 모델을 선택해주세요.');
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
            throw new https_1.HttpsError('invalid-argument', `모델당 최대 50장까지 생성 가능합니다. (${modelId})`);
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
        for (let i = 0; i < numCount; i++) {
            jobsToCreate.push({
                taskId: '',
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
        throw new https_1.HttpsError('invalid-argument', '생성할 이미지가 없습니다.');
    }
    if (totalImages > 100) {
        throw new https_1.HttpsError('invalid-argument', '한 번에 최대 100장까지 생성 가능합니다.');
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
                throw new https_1.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
            }
            const userData = userDoc.data();
            const currentPoints = userData.points || 0;
            if (currentPoints < totalPoints) {
                throw new https_1.HttpsError('failed-precondition', `포인트가 부족합니다. 현재: ${currentPoints}pt, 필요: ${totalPoints}pt`);
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
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', '이미지 생성 요청 중 오류가 발생했습니다.', error instanceof Error ? error.message : String(error));
    }
});
//# sourceMappingURL=createTask.js.map