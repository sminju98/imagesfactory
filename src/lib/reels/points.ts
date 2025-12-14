/**
 * Reels Factory 크레딧 관리 유틸리티
 * 
 * 가격 정책: 원가의 2배, 1크레딧 = 10원
 * 
 * 원가 기준 (Google Veo 3.1 사용):
 * - Google Veo 3.1: ~$0.15/영상 (6초) = ₩210 → 42크레딧
 * - Google TTS Neural2: $16/100만 문자
 * - GPT-4o-mini: $0.15/1M input, $0.60/1M output
 * - Perplexity: ~$0.005/query
 * - Grok-2: ~$0.01/query
 */

import { db, fieldValue } from '@/lib/firebase-admin';

/** 단계별 크레딧 비용 (원가 2배 기준) */
export const REELS_STEP_POINTS: Record<number, number> = {
  0: 1,     // 프롬프트 교정 (GPT) - 원가 ₩1 → 2원 → 1크레딧
  1: 2,     // Perplexity 리서치 - 원가 ₩7 → 14원 → 2크레딧
  2: 1,     // GPT 콘셉트 - 원가 ₩3 → 6원 → 1크레딧
  3: 3,     // Grok 대본 - 원가 ₩14 → 28원 → 3크레딧
  4: 50,    // Google Veo 3.1 영상 1개 (6초) - 원가 ₩210 → 420원 → 50크레딧 (예상)
  5: 2,     // TTS + 자막 1개 - 원가 ₩11 → 22원 → 2크레딧
  6: 10,    // FFmpeg 결합 - 서버 비용 → 10크레딧
};

/**
 * 단계별 크레딧 차감
 * @param userId 사용자 ID
 * @param projectId 프로젝트 ID
 * @param step 단계 (0-6)
 * @param count 개수 (Step4, Step5의 경우 영상 개수)
 * @returns 차감된 크레딧
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


