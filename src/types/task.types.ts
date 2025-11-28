/**
 * Task 및 Job 관련 타입 정의
 * 분산 큐 기반 이미지 생성 시스템
 */

import { Timestamp } from 'firebase/firestore';

// Task 상태
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Job 상태
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 모델별 설정
 */
export interface ModelConfig {
  modelId: string;
  count: number;
  pointsPerImage: number;
  status: JobStatus;
  completedCount: number;
}

/**
 * 이미지 생성 작업 (Task)
 * Firestore: tasks/{taskId}
 */
export interface Task {
  id: string;
  userId: string;
  userEmail: string;
  prompt: string;
  promptTranslated?: string;  // 영문 번역
  modelConfigs: ModelConfig[];
  totalImages: number;
  totalPoints: number;
  referenceImageUrl?: string | null;
  evolutionSourceId?: string; // 진화 원본 이미지 ID
  status: TaskStatus;
  progress: number;           // 0-100
  pointsDeducted: boolean;
  transactionId: string;
  imageUrls?: string[];       // 완료된 이미지 URLs
  zipUrl?: string;
  resultPageUrl?: string;
  failedReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  finishedAt?: Timestamp;
}

/**
 * 개별 이미지 생성 작업 (Job)
 * Firestore: tasks/{taskId}/jobs/{jobId}
 */
export interface Job {
  id: string;
  taskId: string;
  userId: string;
  prompt: string;
  modelId: string;
  status: JobStatus;
  retries: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  pointsCost: number;
  referenceImageUrl?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  finishedAt?: Timestamp;
}

/**
 * Task 생성 요청 파라미터
 */
export interface CreateTaskRequest {
  prompt: string;
  selectedModels: Record<string, number>; // { modelId: count }
  referenceImageUrl?: string;
  evolutionSourceId?: string;
}

/**
 * Task 생성 응답
 */
export interface CreateTaskResponse {
  taskId: string;
  totalImages: number;
  totalPoints: number;
  estimatedTime?: number;
}

/**
 * Task 상태 응답
 */
export interface TaskStatusResponse {
  id: string;
  status: TaskStatus;
  progress: number;
  totalImages: number;
  completedImages: number;
  failedImages: number;
  imageUrls: string[];
  zipUrl?: string;
  resultPageUrl?: string;
  failedReason?: string;
}

/**
 * 모델 정보
 */
export interface AIModel {
  id: string;
  name: string;
  description: string;
  pointsPerImage: number;
  category: 'fast' | 'quality' | 'premium';
  supportsReference: boolean;
  maxImages: number;
}

/**
 * 사용 가능한 AI 모델 목록
 */
export const AI_MODELS: AIModel[] = [
  {
    id: 'pixart',
    name: 'PixArt-Σ',
    description: '빠르고 예술적인 이미지',
    pointsPerImage: 10,
    category: 'fast',
    supportsReference: false,
    maxImages: 20,
  },
  {
    id: 'flux',
    name: 'Flux 1.1 Pro',
    description: '원조 Black Forest Labs 공식 모델',
    pointsPerImage: 30,
    category: 'quality',
    supportsReference: false,
    maxImages: 15,
  },
  {
    id: 'realistic-vision',
    name: 'Realistic Vision',
    description: '실사 이미지 특화',
    pointsPerImage: 20,
    category: 'quality',
    supportsReference: true,
    maxImages: 15,
  },
  {
    id: 'sdxl',
    name: 'SD 3.5 Large',
    description: 'Stability AI 최신 MMDiT 모델',
    pointsPerImage: 40,
    category: 'quality',
    supportsReference: false,
    maxImages: 15,
  },
  {
    id: 'leonardo',
    name: 'Leonardo XL',
    description: '다양한 스타일 지원',
    pointsPerImage: 30,
    category: 'quality',
    supportsReference: false,
    maxImages: 10,
  },
  {
    id: 'aurora',
    name: 'Aurora (Grok)',
    description: 'xAI 고품질 모델',
    pointsPerImage: 60,
    category: 'premium',
    supportsReference: false,
    maxImages: 10,
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    description: '텍스트 포함 이미지 특화',
    pointsPerImage: 60,
    category: 'premium',
    supportsReference: false,
    maxImages: 10,
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'OpenAI 최고 품질',
    pointsPerImage: 150,
    category: 'premium',
    supportsReference: true,
    maxImages: 5,
  },
  {
    id: 'midjourney',
    name: 'Midjourney v6.1',
    description: '창의적 아트워크 최강',
    pointsPerImage: 100,
    category: 'premium',
    supportsReference: false,
    maxImages: 10,
  },
];

/**
 * 모델 ID로 포인트 가격 조회
 */
export function getModelPoints(modelId: string): number {
  const model = AI_MODELS.find(m => m.id === modelId);
  return model?.pointsPerImage ?? 30;
}

/**
 * 모델 ID로 모델 정보 조회
 */
export function getModelInfo(modelId: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === modelId);
}


