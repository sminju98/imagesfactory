/**
 * Firebase Functions용 타입 정의
 */

import * as admin from 'firebase-admin';

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
 */
export interface Task {
  userId: string;
  userEmail: string;
  prompt: string;
  promptTranslated?: string;
  modelConfigs: ModelConfig[];
  totalImages: number;
  totalPoints: number;
  referenceImageUrl?: string | null;
  evolutionSourceId?: string;
  status: TaskStatus;
  progress: number;
  pointsDeducted: boolean;
  transactionId: string;
  imageUrls?: string[];
  zipUrl?: string;
  resultPageUrl?: string;
  failedReason?: string;
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
  finishedAt?: admin.firestore.FieldValue;
}

/**
 * 개별 이미지 생성 작업 (Job)
 */
export interface Job {
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
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
  finishedAt?: admin.firestore.FieldValue;
}

/**
 * 사용자 정보
 */
export interface User {
  email: string;
  displayName?: string;
  points: number;
  stats: {
    totalGenerations: number;
    totalImages: number;
    totalPointsUsed: number;
    totalPointsPurchased: number;
    totalLikesReceived: number;
  };
  fcmTokens?: string[];
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

/**
 * 갤러리 이미지
 */
export interface GalleryImage {
  userId: string;
  taskId: string;
  jobId: string;
  prompt: string;
  modelId: string;
  imageUrl: string;
  thumbnailUrl: string;
  publicUrl: string;
  width: number;
  height: number;
  fileSize: number;
  likesCount: number;
  commentsCount: number;
  isPublic: boolean;
  evolutionGeneration: number;
  parentImageId?: string;
  createdAt: admin.firestore.FieldValue;
}

/**
 * 포인트 거래
 */
export interface PointTransaction {
  userId: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  description: string;
  relatedGenerationId?: string;
  relatedPaymentId?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: admin.firestore.FieldValue;
}

/**
 * 이미지 생성 파라미터
 */
export interface GenerateImageParams {
  prompt: string;
  modelId: string;
  width?: number;
  height?: number;
  referenceImageUrl?: string;
}

/**
 * 생성된 이미지 결과
 */
export interface GeneratedImage {
  url: string;
  modelId: string;
}

/**
 * 모델별 포인트 가격
 */
export const MODEL_POINTS: Record<string, number> = {
  'pixart': 10,
  'flux': 10,
  'realistic-vision': 20,
  'sdxl': 30,
  'leonardo': 30,
  'aurora': 60,
  'ideogram': 60,
  'dall-e-3': 150,
};

/**
 * 모델 ID로 포인트 가격 조회
 */
export function getModelPoints(modelId: string): number {
  return MODEL_POINTS[modelId] || 30;
}

