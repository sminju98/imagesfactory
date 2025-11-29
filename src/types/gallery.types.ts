/**
 * Gallery 관련 타입 정의
 * 갤러리, 좋아요, 코멘트, 진화 시스템
 */

import { Timestamp } from 'firebase/firestore';

/**
 * 갤러리 이미지
 * Firestore: gallery/{userId}/images/{imageId}
 */
export interface GalleryImage {
  id: string;
  userId: string;
  taskId: string;
  jobId: string;
  prompt: string;
  modelId: string;
  imageUrl: string;
  thumbnailUrl: string;
  publicUrl: string;          // 브랜드 도메인 URL
  width: number;
  height: number;
  fileSize: number;
  likesCount: number;
  commentsCount: number;
  isPublic: boolean;          // 공개 여부
  evolutionGeneration: number; // 진화 세대 (0 = 원본)
  parentImageId?: string;      // 진화 부모 이미지
  tags?: string[];             // 태그
  createdAt: Timestamp;
}

/**
 * 좋아요
 * Firestore: likes/{imageId}/users/{userId}
 */
export interface Like {
  userId: string;
  imageId: string;
  imageOwnerId: string;       // 이미지 소유자 ID
  createdAt: Timestamp;
}

/**
 * 코멘트
 * Firestore: comments/{imageId}/items/{commentId}
 */
export interface Comment {
  id: string;
  imageId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  content: string;            // 코멘트 내용 (다음 세대 반영용)
  isAppliedToEvolution: boolean; // 진화에 반영되었는지
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 진화 세션
 * Firestore: evolutions/{evolutionId}
 */
export interface Evolution {
  id: string;
  userId: string;
  sourceImageIds: string[];   // 좋아요 받은 이미지들
  sourcePrompts: string[];    // 원본 프롬프트들
  comments: string[];         // 반영할 코멘트들
  generatedTaskId?: string;   // 생성된 Task ID
  generation: number;         // 세대 번호
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 갤러리 이미지 조회 필터
 */
export interface GalleryFilter {
  modelId?: string;
  sortBy: 'newest' | 'oldest' | 'likes' | 'comments';
  isPublic?: boolean;
  generation?: number;
  limit?: number;
  cursor?: string;
}

/**
 * 좋아요 토글 요청
 */
export interface LikeToggleRequest {
  imageId: string;
}

/**
 * 좋아요 토글 응답
 */
export interface LikeToggleResponse {
  isLiked: boolean;
  likesCount: number;
}

/**
 * 코멘트 작성 요청
 */
export interface CommentCreateRequest {
  imageId: string;
  content: string;
}

/**
 * 코멘트 응답
 */
export interface CommentResponse extends Comment {
  // 추가 정보가 필요한 경우
}

/**
 * 진화 생성 요청
 */
export interface EvolutionRequest {
  selectedImageIds: string[];  // 좋아요 기반 선택된 이미지들
  additionalPrompt?: string;   // 추가 프롬프트
  selectedComments?: string[]; // 반영할 코멘트들
  modelId?: string;            // 사용할 모델 (선택)
  imageCount?: number;         // 생성할 이미지 수
}

/**
 * 진화 응답
 */
export interface EvolutionResponse {
  evolutionId: string;
  taskId: string;
  generation: number;
  totalImages: number;
  totalPoints: number;
}

/**
 * 갤러리 이미지 + 상호작용 정보
 */
export interface GalleryImageWithInteraction extends GalleryImage {
  isLiked: boolean;           // 현재 사용자가 좋아요 했는지
  recentComments: Comment[];  // 최근 코멘트 (미리보기용)
}

/**
 * 이미지 카드 액션 타입
 */
export type ImageCardAction = 
  | 'like'
  | 'comment'
  | 'copy_url'
  | 'use_reference'
  | 'download'
  | 'delete'
  | 'evolve';

/**
 * 갤러리 통계
 */
export interface GalleryStats {
  totalImages: number;
  totalLikes: number;
  totalComments: number;
  mostLikedImage?: GalleryImage;
  modelDistribution: Record<string, number>;
}




