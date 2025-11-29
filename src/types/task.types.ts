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
// Global pricing: 1 point = $0.01 (1 cent)
export const AI_MODELS: AIModel[] = [
  {
    id: 'pixart',
    name: 'PixArt-Σ',
    description: 'Fast artistic images',
    pointsPerImage: 1,
    category: 'fast',
    supportsReference: false,
    maxImages: 48,
  },
  {
    id: 'flux',
    name: 'Flux 1.1 Pro',
    description: 'Black Forest Labs official',
    pointsPerImage: 3,
    category: 'quality',
    supportsReference: false,
    maxImages: 20,
  },
  {
    id: 'realistic-vision',
    name: 'Realistic Vision',
    description: 'Photorealistic portraits',
    pointsPerImage: 2,
    category: 'quality',
    supportsReference: true,
    maxImages: 24,
  },
  {
    id: 'sdxl',
    name: 'SD 3.5 Large',
    description: 'Stability AI latest MMDiT',
    pointsPerImage: 4,
    category: 'quality',
    supportsReference: false,
    maxImages: 20,
  },
  {
    id: 'leonardo',
    name: 'Leonardo Phoenix',
    description: 'Game/Character art',
    pointsPerImage: 5,
    category: 'quality',
    supportsReference: false,
    maxImages: 20,
  },
  {
    id: 'grok',
    name: 'Grok-2 Image',
    description: 'xAI image generation',
    pointsPerImage: 6,
    category: 'premium',
    supportsReference: false,
    maxImages: 15,
  },
  {
    id: 'ideogram',
    name: 'Ideogram V3',
    description: 'Best text rendering',
    pointsPerImage: 6,
    category: 'premium',
    supportsReference: false,
    maxImages: 12,
  },
  {
    id: 'gpt-image',
    name: 'GPT-Image-1',
    description: 'OpenAI latest',
    pointsPerImage: 10,
    category: 'premium',
    supportsReference: true,
    maxImages: 12,
  },
  {
    id: 'midjourney',
    name: 'Midjourney v6.1',
    description: 'Best creative artwork (4 images/request)',
    pointsPerImage: 60, // 1 request = 4 images = $0.60
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

