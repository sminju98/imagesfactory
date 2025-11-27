/**
 * Firebase Functions용 타입 정의
 */

import * as admin from 'firebase-admin';

// Task 상태
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Job 상태
// requeued: Rate Limit으로 인해 새 Job으로 대체됨
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'requeued';

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
  // 대기열 관련 필드
  queuedAt?: admin.firestore.FieldValue;
  queueReason?: string;
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
  isBase64?: boolean;  // base64 데이터인 경우 true
}

/**
 * 모델별 포인트 가격
 */
export const MODEL_POINTS: Record<string, number> = {
  'pixart': 10,
  'flux': 10,
  'realistic-vision': 20,
  'sdxl': 30,
  'kandinsky': 20,
  'playground': 30,
  'leonardo': 50,
  'recraft': 40,
  'grok': 60,
  'ideogram': 60,
  'gemini': 80,
  'gpt-image': 100,
  'firefly': 100,
  'midjourney': 120,
  'dall-e-3': 150,
  'seedream': 50,
  'hunyuan': 30,
};

/**
 * 모델 ID로 포인트 가격 조회
 */
export function getModelPoints(modelId: string): number {
  return MODEL_POINTS[modelId] || 30;
}

/**
 * 모델별 동시 처리 제한 (Rate Limit)
 * - API Rate Limit을 고려하여 설정
 * - 숫자가 낮을수록 동시 요청이 적음
 */
export const MODEL_CONCURRENCY_LIMITS: Record<string, number> = {
  // === 빠른 모델 (높은 동시성) ===
  'pixart': 20,          // Replicate - 여유로움
  'flux': 20,            // Replicate - 빠른 모델
  'realistic-vision': 15, // Replicate
  'sdxl': 15,            // Stability AI
  'kandinsky': 15,       // Replicate
  'hunyuan': 15,         // Replicate
  
  // === 중간 속도 모델 ===
  'playground': 10,      // Playground AI
  'leonardo': 8,         // Leonardo.ai
  'recraft': 8,          // Recraft AI
  'seedream': 10,        // Segmind
  
  // === 제한적인 모델 ===
  'gemini': 10,          // Google AI - 분당 60회
  'grok': 5,             // xAI
  'ideogram': 5,         // Ideogram - 분당 10회
  
  // === 프리미엄 모델 (낮은 동시성) ===
  'gpt-image': 3,        // OpenAI - 분당 5회
  'dall-e-3': 3,         // OpenAI - 분당 5회
  'firefly': 3,          // Adobe - 분당 5회
  'midjourney': 2,       // GoAPI - 제한적
};

/**
 * 모델별 동시 처리 제한 조회
 */
export function getModelConcurrencyLimit(modelId: string): number {
  return MODEL_CONCURRENCY_LIMITS[modelId] || 5;
}

/**
 * 유저별 동시 작업 제한
 */
export const USER_CONCURRENCY_LIMIT = 10; // 유저당 최대 10개 Job 동시 처리

/**
 * 전체 시스템 동시 처리 제한
 */
export const SYSTEM_MAX_INSTANCES = 50; // Firebase Functions 최대 인스턴스

