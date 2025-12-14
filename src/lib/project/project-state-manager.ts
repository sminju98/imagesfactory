/**
 * 프로젝트 상태 관리자
 * 각 단계별 상태 검증 및 전환 관리
 */

import { db } from '@/lib/firebase-admin';
import { AIContentProject, ProjectStatus } from '@/types/project.types';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const COLLECTION_NAME = 'aiContentProjects';

// 단계별 상태 매핑
const STEP_STATUS_MAP: Record<number, ProjectStatus> = {
  1: 'input',
  2: 'prompt',
  3: 'script',
  4: 'video',
  5: 'tts',
  6: 'subtitle',
  7: 'composing',
};

// 각 단계에서 다음 단계로 진행 가능한지 검증하는 조건
const STEP_VALIDATION: Record<number, (project: AIContentProject) => boolean> = {
  1: () => true, // 항상 시작 가능
  2: (p) => !!p.rawPrompt, // 입력 완료 필요
  3: (p) => !!p.confirmedPrompt, // 프롬프트 확인 필요
  4: (p) => p.scenesFinal && p.scenesFinal.length > 0, // 씬 확인 필요
  5: (p) => p.videoClips?.some(v => v.status === 'completed'), // 비디오 1개 이상 완료
  6: (p) => p.ttsAudios?.some(t => t.status === 'completed'), // TTS 1개 이상 완료
  7: (p) => p.subtitlesFinal && p.subtitlesFinal.length > 0, // 자막 확인 필요
};

/**
 * 프로젝트 상태 검증
 * @param projectId 프로젝트 ID
 * @param requiredStep 필요한 단계 (이 단계를 실행하기 위한 조건 검증)
 */
export async function validateProjectState(
  projectId: string,
  requiredStep: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const projectRef = db.collection(COLLECTION_NAME).doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return { valid: false, error: '프로젝트를 찾을 수 없습니다.' };
    }

    const project = projectDoc.data() as AIContentProject;

    // 이미 완료된 프로젝트
    if (project.status === 'done') {
      return { valid: false, error: '이미 완료된 프로젝트입니다.' };
    }

    // 실패한 프로젝트 (재시도 가능)
    if (project.status === 'failed') {
      // 실패 상태에서도 해당 단계부터 재시작 가능
    }

    // 이전 단계 검증
    for (let step = 1; step < requiredStep; step++) {
      const validator = STEP_VALIDATION[step];
      if (validator && !validator(project)) {
        return {
          valid: false,
          error: `Step ${step}가 완료되지 않았습니다.`,
        };
      }
    }

    return { valid: true };
  } catch (error: any) {
    console.error('프로젝트 상태 검증 오류:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * 프로젝트 상태 업데이트
 */
export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  currentStep?: number,
  additionalData?: Partial<AIContentProject>
): Promise<void> {
  const projectRef = db.collection(COLLECTION_NAME).doc(projectId);
  
  const updateData: any = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (currentStep !== undefined) {
    updateData.currentStep = currentStep;
  }

  if (additionalData) {
    Object.assign(updateData, additionalData);
  }

  await projectRef.update(updateData);
}

/**
 * 프로젝트 생성
 */
export async function createProject(
  userId: string,
  language: 'ko' | 'en' = 'ko'
): Promise<string> {
  const projectRef = db.collection(COLLECTION_NAME).doc();
  
  const newProject: Omit<AIContentProject, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt: FieldValue;
    updatedAt: FieldValue;
  } = {
    userId,
    rawPrompt: '',
    scenes: [],
    scenesFinal: [],
    videoClips: [],
    selectedVideoClips: [],
    ttsAudios: [],
    subtitles: [],
    subtitlesFinal: [],
    status: 'input',
    currentStep: 1,
    pointsUsed: 0,
    language,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await projectRef.set(newProject);
  return projectRef.id;
}

/**
 * 프로젝트 조회
 */
export async function getProject(projectId: string): Promise<AIContentProject | null> {
  const projectRef = db.collection(COLLECTION_NAME).doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    return null;
  }

  return {
    id: projectDoc.id,
    ...projectDoc.data(),
  } as AIContentProject;
}

/**
 * 프로젝트 데이터 업데이트 (부분)
 */
export async function updateProject(
  projectId: string,
  data: Partial<AIContentProject>
): Promise<void> {
  const projectRef = db.collection(COLLECTION_NAME).doc(projectId);
  
  await projectRef.update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * 프로젝트 실패 처리
 */
export async function markProjectFailed(
  projectId: string,
  errorMessage: string
): Promise<void> {
  await updateProjectStatus(projectId, 'failed', undefined, { errorMessage });
}

/**
 * 프로젝트 완료 처리
 */
export async function markProjectDone(
  projectId: string,
  finalVideoUrl: string,
  pointsUsed: number
): Promise<void> {
  await updateProjectStatus(projectId, 'done', 7, {
    finalVideoUrl,
    pointsUsed,
  });
}

/**
 * 사용자의 프로젝트 목록 조회
 */
export async function getUserProjects(
  userId: string,
  limit: number = 20
): Promise<AIContentProject[]> {
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as AIContentProject[];
}

/**
 * 포인트 차감
 */
export async function deductPoints(
  projectId: string,
  amount: number
): Promise<void> {
  const projectRef = db.collection(COLLECTION_NAME).doc(projectId);
  
  await projectRef.update({
    pointsUsed: FieldValue.increment(amount),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
