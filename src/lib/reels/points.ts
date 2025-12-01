/**
 * Reels Factory 포인트 관리 유틸리티
 */

import { db, fieldValue } from '@/lib/firebase-admin';

/** 단계별 포인트 비용 */
export const REELS_STEP_POINTS: Record<number, number> = {
  0: 10,   // 프롬프트 교정 (GPT-5.1)
  1: 50,   // Perplexity 리서치
  2: 30,   // GPT 콘셉트 (GPT-5.1)
  3: 100,  // Grok 대본 (Grok-2)
  4: 100,  // Veo3 영상 1개 (총 5개 = 500pt)
  5: 20,   // TTS + 자막 1개 (총 5개 = 100pt)
  6: 50,   // FFmpeg 결합
};

/**
 * 단계별 포인트 차감
 * @param userId 사용자 ID
 * @param projectId 프로젝트 ID
 * @param step 단계 (0-6)
 * @param count 개수 (Step4, Step5의 경우 영상 개수)
 * @returns 차감된 포인트
 */
export async function deductReelsPoints(
  userId: string,
  projectId: string,
  step: number,
  count: number = 1
): Promise<{ success: boolean; pointsDeducted: number; newBalance: number; error?: string }> {
  const basePoints = REELS_STEP_POINTS[step] || 0;
  const totalPoints = basePoints * count;

  if (totalPoints <= 0) {
    return {
      success: false,
      pointsDeducted: 0,
      newBalance: 0,
      error: '유효하지 않은 단계입니다.',
    };
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        success: false,
        pointsDeducted: 0,
        newBalance: 0,
        error: '사용자를 찾을 수 없습니다.',
      };
    }

    const userData = userDoc.data()!;
    const currentPoints = userData.points || 0;

    if (currentPoints < totalPoints) {
      return {
        success: false,
        pointsDeducted: 0,
        newBalance: currentPoints,
        error: `포인트가 부족합니다. 현재: ${currentPoints}pt, 필요: ${totalPoints}pt`,
      };
    }

    // 포인트 차감
    const newBalance = currentPoints - totalPoints;
    await userRef.update({
      points: newBalance,
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 거래 내역 저장
    const stepNames: Record<number, string> = {
      0: '프롬프트 교정',
      1: '리서치',
      2: '콘셉트 기획',
      3: '대본 작성',
      4: '영상 생성',
      5: 'TTS + 자막',
      6: '영상 결합',
    };

    await db.collection('pointTransactions').add({
      userId,
      amount: -totalPoints,
      type: 'usage',
      description: `Reels Factory - ${stepNames[step]}${count > 1 ? ` (${count}개)` : ''}`,
      relatedGenerationId: projectId,
      balanceBefore: currentPoints,
      balanceAfter: newBalance,
      createdAt: fieldValue.serverTimestamp(),
    });

    // 프로젝트 포인트 업데이트
    const projectRef = db.collection('reelsProjects').doc(projectId);
    await projectRef.update({
      pointsUsed: fieldValue.increment(totalPoints),
      updatedAt: fieldValue.serverTimestamp(),
    });

    return {
      success: true,
      pointsDeducted: totalPoints,
      newBalance,
    };
  } catch (error: any) {
    console.error('포인트 차감 오류:', error);
    return {
      success: false,
      pointsDeducted: 0,
      newBalance: 0,
      error: error.message || '포인트 차감에 실패했습니다.',
    };
  }
}

/**
 * 포인트 환불 (실패 시)
 */
export async function refundReelsPoints(
  userId: string,
  projectId: string,
  step: number,
  count: number = 1
): Promise<void> {
  const basePoints = REELS_STEP_POINTS[step] || 0;
  const refundPoints = basePoints * count;

  if (refundPoints <= 0) return;

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return;

    const userData = userDoc.data()!;
    const currentPoints = userData.points || 0;
    const newBalance = currentPoints + refundPoints;

    await userRef.update({
      points: newBalance,
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 거래 내역 저장
    await db.collection('pointTransactions').add({
      userId,
      amount: refundPoints,
      type: 'refund',
      description: `Reels Factory 환불 - Step ${step}`,
      relatedGenerationId: projectId,
      balanceBefore: currentPoints,
      balanceAfter: newBalance,
      createdAt: fieldValue.serverTimestamp(),
    });

    // 프로젝트 포인트 업데이트
    const projectRef = db.collection('reelsProjects').doc(projectId);
    await projectRef.update({
      pointsUsed: fieldValue.increment(-refundPoints),
      updatedAt: fieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('포인트 환불 오류:', error);
  }
}

