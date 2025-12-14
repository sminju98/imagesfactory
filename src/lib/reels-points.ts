/**
 * Reels Factory 단계별 포인트 관리
 */

import { db, fieldValue } from '@/lib/firebase-admin';

// 단계별 포인트 비용
export const STEP_POINTS = {
  0: 10,   // 프롬프트 교정
  1: 20,   // 리서치
  2: 20,   // 콘셉트
  3: 30,   // 대본
  4: 100,  // 영상 생성
  5: 50,   // TTS & 자막
  6: 30,   // 최종 결합
} as const;

// 총 예상 포인트
export const TOTAL_ESTIMATED_POINTS = Object.values(STEP_POINTS).reduce((a, b) => a + b, 0);

interface PointResult {
  success: boolean;
  pointsDeducted?: number;
  newBalance?: number;
  error?: string;
}

/**
 * 단계 시작 시 포인트 차감
 */
export async function deductStepPoints(
  userId: string,
  projectId: string,
  step: number
): Promise<PointResult> {
  const points = STEP_POINTS[step as keyof typeof STEP_POINTS];
  
  if (!points) {
    return { success: false, error: `유효하지 않은 단계: ${step}` };
  }

  try {
    // 트랜잭션으로 포인트 차감
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      
      const userData = userDoc.data()!;
      const currentPoints = userData.points || 0;
      
      if (currentPoints < points) {
        throw new Error(`포인트가 부족합니다. 필요: ${points}, 현재: ${currentPoints}`);
      }
      
      const newBalance = currentPoints - points;
      
      // 포인트 차감
      transaction.update(userRef, {
        points: newBalance,
        updatedAt: fieldValue.serverTimestamp(),
      });
      
      // 포인트 거래 기록
      const transactionRef = db.collection('pointTransactions').doc();
      transaction.set(transactionRef, {
        userId,
        amount: -points,
        type: 'usage',
        description: `Reels Step ${step} 생성`,
        relatedProjectId: projectId,
        balanceBefore: currentPoints,
        balanceAfter: newBalance,
        createdAt: fieldValue.serverTimestamp(),
      });
      
      // 프로젝트 포인트 사용량 업데이트
      const projectRef = db.collection('reelsProjects').doc(projectId);
      transaction.update(projectRef, {
        pointsUsed: fieldValue.increment(points),
        [`stepPoints.step${step}`]: points,
        updatedAt: fieldValue.serverTimestamp(),
      });
      
      return { pointsDeducted: points, newBalance };
    });
    
    console.log(`💰 Step ${step} 포인트 차감 완료:`, result);
    return { success: true, ...result };
    
  } catch (error: any) {
    console.error(`❌ Step ${step} 포인트 차감 실패:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 실패 시 포인트 환불
 */
export async function refundStepPoints(
  userId: string,
  projectId: string,
  step: number,
  reason: string
): Promise<PointResult> {
  const points = STEP_POINTS[step as keyof typeof STEP_POINTS];
  
  if (!points) {
    return { success: false, error: `유효하지 않은 단계: ${step}` };
  }

  try {
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      
      const userData = userDoc.data()!;
      const currentPoints = userData.points || 0;
      const newBalance = currentPoints + points;
      
      // 포인트 환불
      transaction.update(userRef, {
        points: newBalance,
        updatedAt: fieldValue.serverTimestamp(),
      });
      
      // 환불 기록
      const transactionRef = db.collection('pointTransactions').doc();
      transaction.set(transactionRef, {
        userId,
        amount: points,
        type: 'refund',
        description: `Reels Step ${step} 실패 환불: ${reason}`,
        relatedProjectId: projectId,
        balanceBefore: currentPoints,
        balanceAfter: newBalance,
        createdAt: fieldValue.serverTimestamp(),
      });
      
      // 프로젝트 포인트 사용량 업데이트
      const projectRef = db.collection('reelsProjects').doc(projectId);
      transaction.update(projectRef, {
        pointsUsed: fieldValue.increment(-points),
        [`stepPoints.step${step}`]: 0,
        updatedAt: fieldValue.serverTimestamp(),
      });
      
      return { pointsDeducted: -points, newBalance };
    });
    
    console.log(`💸 Step ${step} 포인트 환불 완료:`, result);
    return { success: true, ...result };
    
  } catch (error: any) {
    console.error(`❌ Step ${step} 포인트 환불 실패:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * 프로젝트 상태 업데이트 (백그라운드 작업용)
 */
export async function updateProjectStatus(
  projectId: string,
  status: 'processing' | 'completed' | 'failed',
  step: number,
  data?: Record<string, any>,
  errorMessage?: string
) {
  try {
    const projectRef = db.collection('reelsProjects').doc(projectId);
    
    const updateData: Record<string, any> = {
      status,
      [`stepStatus.step${step}`]: status,
      updatedAt: fieldValue.serverTimestamp(),
    };
    
    if (status === 'completed') {
      updateData.currentStep = step + 1;
    }
    
    if (status === 'failed' && errorMessage) {
      updateData.errorMessage = errorMessage;
      updateData[`stepError.step${step}`] = errorMessage;
    }
    
    if (data) {
      Object.assign(updateData, data);
    }
    
    await projectRef.update(updateData);
    console.log(`📝 프로젝트 상태 업데이트: ${projectId}, Step ${step} -> ${status}`);
    
  } catch (error) {
    console.error('프로젝트 상태 업데이트 실패:', error);
  }
}

