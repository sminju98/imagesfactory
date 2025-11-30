"use strict";
/**
 * Task 타임아웃 처리
 * 오래된 pending/processing 작업을 실패 처리
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTaskTimeout = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("./utils/firestore");
const TASK_TIMEOUT_MINUTES = 30; // 30분 이상 처리 중인 Task는 타임아웃
exports.checkTaskTimeout = (0, scheduler_1.onSchedule)({
    schedule: 'every 10 minutes',
    region: 'asia-northeast3',
    timeoutSeconds: 120,
}, async () => {
    console.log('🕐 Task 타임아웃 체크 시작...');
    const timeoutThreshold = new Date(Date.now() - TASK_TIMEOUT_MINUTES * 60 * 1000);
    // processing 상태이면서 오래된 Task 조회
    const tasksSnapshot = await firestore_1.db.collection('tasks')
        .where('status', 'in', ['pending', 'processing'])
        .where('createdAt', '<', timeoutThreshold)
        .limit(50)
        .get();
    if (tasksSnapshot.empty) {
        console.log('✅ 타임아웃된 Task 없음');
        return;
    }
    console.log(`⚠️ ${tasksSnapshot.size}개 Task 타임아웃 처리 중...`);
    const batch = firestore_1.db.batch();
    tasksSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
            status: 'failed',
            failedReason: `타임아웃: ${TASK_TIMEOUT_MINUTES}분 초과`,
            updatedAt: firestore_1.fieldValue.serverTimestamp(),
            finishedAt: firestore_1.fieldValue.serverTimestamp(),
        });
    });
    await batch.commit();
    console.log(`✅ ${tasksSnapshot.size}개 Task 타임아웃 처리 완료`);
});
//# sourceMappingURL=timeoutHandler.js.map