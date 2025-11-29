// 이미지 진화 시스템 타입 정의

import { Timestamp } from 'firebase/firestore';

// ==================== 이미지 관련 타입 ====================

/** 진화 히스토리 단계 */
export interface EvolutionStep {
  step: string;                 // "gen1", "gen2"...
  prompt: string;
  refinedPrompt: string;
  modelId: string;
  parentIds: string[];
  createdAt: Timestamp;
}

/** 이미지 코멘트 */
export interface ImageComment {
  id: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
}

/** 이미지 문서 (Firestore) */
export interface ImageDocument {
  id: string;
  userId: string;
  taskId: string;
  jobId: string;
  
  // 기본 정보
  prompt: string;
  refinedPrompt: string;
  modelId: string;
  imageUrl: string;
  thumbnailUrl: string;
  
  // 진화 정보
  generation: number;           // 1, 2, 3...
  parentIds: string[];          // 부모 이미지 ID들
  evolutionHistory: EvolutionStep[];
  evolutionSessionId?: string;  // 진화 세션 ID
  
  // 인터랙션
  isLiked: boolean;
  likesCount: number;
  comments: ImageComment[];
  
  // 메타데이터
  width: number;
  height: number;
  fileSize: number;
  styleTags: string[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== 선호 갤러리 타입 ====================

/** 선호 이미지 문서 (Firestore) */
export interface FavoriteDocument {
  id: string;
  userId: string;
  imageId: string;
  imageUrl: string;
  thumbnailUrl: string;
  prompt: string;
  modelId: string;
  generation: number;
  tags: string[];
  note: string;
  createdAt: Timestamp;
}

// ==================== 업로드 이미지 타입 ====================

/** 업로드된 이미지 문서 (Firestore) */
export interface UploadedImage {
  id: string;
  userId: string;
  
  // 이미지 정보
  imageUrl: string;
  thumbnailUrl: string;
  originalFileName: string;
  
  // 메타데이터
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  
  // 사용 정보
  usedInTasks: string[];        // 레퍼런스로 사용된 Task ID들
  usedCount: number;            // 사용 횟수
  
  // 분류
  tags: string[];
  note: string;
  
  // 타임스탬프
  uploadedAt: Timestamp;
  lastUsedAt: Timestamp;
}

// ==================== 진화 세션 타입 ====================

/** 진화 세션 상태 */
export type EvolutionSessionStatus = 'active' | 'completed' | 'archived';

/** 진화 세션 문서 (Firestore) */
export interface EvolutionSession {
  id: string;
  userId: string;
  name: string;
  
  // 세대별 이미지 ID 목록
  generations: {
    [generationNum: string]: string[];  // { "1": [id1, id2], "2": [id3, id4] }
  };
  
  // 현재 선택된 이미지들
  selectedImageIds: string[];
  
  // 설정
  basePrompt: string;
  currentGeneration: number;
  totalImages: number;
  
  status: EvolutionSessionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== 진화 설정 타입 ====================

/** 진화 설정 (모달에서 사용) */
export interface EvolutionConfig {
  selectedImageIds: string[];           // 선택된 참고 이미지 (최대 8개)
  additionalPrompt: string;
  modelsConfig: {
    [modelId: string]: number;          // 모델별 생성 개수 (참고 이미지 개수의 배수)
  };
  evolutionStrength: number;            // 0.1 ~ 1.0
  referenceCount: number;               // 참고 이미지 개수 (1~8)
}

/** 진화 생성 요청 */
export interface EvolutionCreateRequest {
  userId: string;
  sessionId?: string;                   // 기존 세션 ID (없으면 새 세션 생성)
  config: EvolutionConfig;
}

/** 진화 생성 응답 */
export interface EvolutionCreateResponse {
  success: boolean;
  taskId?: string;
  sessionId?: string;
  error?: string;
}

// ==================== 갤러리 필터 타입 ====================

/** 갤러리 필터 타입 */
export type GalleryFilterType = 'all' | 'liked' | 'uploaded' | 'evolution';

/** 갤러리 정렬 옵션 */
export type GallerySortOption = 'newest' | 'oldest' | 'mostLiked' | 'generation';

/** 갤러리 필터 옵션 */
export interface GalleryFilterOptions {
  type: GalleryFilterType;
  modelId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  generation?: number;
  sortBy: GallerySortOption;
}

// ==================== ContentFactory 연동 타입 ====================

/** ContentFactory로 전송할 이미지 데이터 */
export interface ContentFactoryImageData {
  id: string;
  url: string;
  thumbnailUrl: string;
  prompt: string;
  refinedPrompt: string;
  modelId: string;
  generation: number;
  styleTags: string[];
  metadata: {
    width: number;
    height: number;
    evolutionHistory: EvolutionStep[];
  };
}

/** ContentFactory 입력 데이터 */
export interface ContentFactoryInput {
  // 선택된 이미지들
  selectedImages: ContentFactoryImageData[];
  
  // 사용자 입력
  userPrompt: string;
  
  // 스타일 정보 (이미지들에서 추출)
  styleTags: string[];
  
  // 진화 히스토리
  evolutionHistory: {
    sessionId: string;
    totalGenerations: number;
    bestImages: string[];  // 각 세대 최고 좋아요 이미지
  };
  
  // 콘텐츠 타입 설정
  contentTypes: {
    reels: boolean;
    comic: boolean;
    cardnews: boolean;
    banner: boolean;
    thumbnail: boolean;
    detail: boolean;
  };
}

// ==================== 유틸리티 타입 ====================

/** 참고 이미지 개수에 따른 허용 생성 개수 */
export const MAX_REFERENCE_IMAGES = 8;
export const MAX_IMAGES_PER_MODEL = 20;

/** 허용 생성 개수 계산 */
export function getAllowedCounts(referenceCount: number, maxPerModel: number = MAX_IMAGES_PER_MODEL): number[] {
  const counts: number[] = [];
  for (let i = referenceCount; i <= maxPerModel; i += referenceCount) {
    counts.push(i);
  }
  return counts;
}

/** 각 참고 이미지당 생성 개수 계산 */
export function getImagesPerReference(totalCount: number, referenceCount: number): number {
  return totalCount / referenceCount;
}

// ==================== 상수 ====================

/** 가입 보너스 포인트 */
export const SIGNUP_BONUS_POINTS = 100;

/** 진화 강도 기본값 */
export const DEFAULT_EVOLUTION_STRENGTH = 0.5;

/** 갤러리 페이지당 이미지 수 */
export const GALLERY_PAGE_SIZE = 24;


