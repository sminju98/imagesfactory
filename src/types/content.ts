// 콘텐츠팩토리 관련 타입 정의

import { Timestamp } from 'firebase/firestore';

// ==================== 콘텐츠 타입 ====================

/** 콘텐츠 유형 */
export type ContentType = 
  | 'reels'           // 릴스 (10장)
  | 'comic'           // 4컷 만화
  | 'cardnews'        // 카드뉴스 (5장)
  | 'banner'          // 배너 광고
  | 'story'           // 스토리 광고
  | 'thumbnail'       // 썸네일 (3장)
  | 'detail_header';  // 상세페이지 헤더 (2장)

/** 콘텐츠 타입 한글 라벨 */
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  reels: '릴스',
  comic: '4컷 만화',
  cardnews: '카드뉴스',
  banner: '배너 광고',
  story: '스토리 광고',
  thumbnail: '썸네일',
  detail_header: '상세페이지',
};

/** 콘텐츠 타입별 아이콘 */
export const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  reels: '🎬',
  comic: '📖',
  cardnews: '📰',
  banner: '🖼️',
  story: '📱',
  thumbnail: '🎯',
  detail_header: '📄',
};

// ==================== 콘텐츠 프로젝트 ====================

/** 콘텐츠 프로젝트 상태 */
export type ContentProjectStatus = 'processing' | 'completed' | 'failed' | 'partial';

/** 콘텐츠 프로젝트 문서 */
export interface ContentProject {
  id: string;
  userId: string;
  status: ContentProjectStatus;
  currentStep: string;
  
  // 입력 데이터
  inputPrompt: string;
  referenceImageIds: string[];
  
  // 생성된 데이터
  concept: ContentConcept;
  message: ContentMessage;
  script: ContentScript;
  copy: ContentCopy;
  
  // 진행 상황
  totalTasks: number;
  completedTasks: number;
  totalPointsUsed: number;
  
  // 타임스탬프
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

/** 콘텐츠 콘셉트 */
export interface ContentConcept {
  productName: string;
  usp: string;
  target: string;
  toneAndManner: string;
  strategy: string;
  keywords: string[];
}

/** 콘텐츠 메시지 */
export interface ContentMessage {
  mainCopy: string;
  subCopy: string;
  ctaText: string;
  hashtags: string[];
}

/** 콘텐츠 스크립트 */
export interface ContentScript {
  reelsStory: ReelsScene[];
  comicStory: ComicPanel[];
  cardNewsFlow: CardNewsPage[];
}

/** 릴스 장면 */
export interface ReelsScene {
  order: number;
  description: string;
  caption: string;
  duration: number;
  imagePrompt: string;
}

/** 만화 패널 */
export interface ComicPanel {
  order: number;
  description: string;
  dialogue: string;
  imagePrompt: string;
}

/** 카드뉴스 페이지 */
export interface CardNewsPage {
  order: number;
  title: string;
  body: string;
  imagePrompt: string;
}

/** 콘텐츠 카피 */
export interface ContentCopy {
  reelsCaptions: string[];
  cardNewsCopies: string[];
  bannerCopy: string;
  storyCopy: string;
  thumbnailTitle: string;
  detailPageHeadline: string;
}

// ==================== 콘텐츠 태스크 ====================

/** 콘텐츠 태스크 상태 */
export type ContentTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 콘텐츠 태스크 문서 */
export interface ContentTask {
  id: string;
  projectId: string;
  userId: string;
  
  // 콘텐츠 정보
  type: ContentType;
  order: number;
  prompt: string;
  text?: string;
  
  // 이미지 정보
  width: number;
  height: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  
  // 상태
  status: ContentTaskStatus;
  error?: string;
  
  // 타임스탬프
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// ==================== 콘텐츠 저장소 아이템 ====================

/** 저장된 콘텐츠 아이템 */
export interface SavedContentItem {
  id: string;
  userId: string;
  projectId: string;
  
  // 콘텐츠 정보
  type: ContentType;
  order: number;
  imageUrl: string;
  thumbnailUrl: string;
  
  // 메타데이터
  prompt: string;
  text?: string;
  width: number;
  height: number;
  
  // 분류
  tags: string[];
  isFavorite: boolean;
  
  // 타임스탬프
  createdAt: Timestamp;
  savedAt: Timestamp;
}

// ==================== 필터 및 정렬 ====================

/** 콘텐츠 필터 옵션 */
export interface ContentFilterOptions {
  type?: ContentType;
  projectId?: string;
  isFavorite?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy: 'newest' | 'oldest' | 'type';
}

// ==================== 상수 ====================

/** 콘텐츠 타입별 기본 개수 */
export const CONTENT_TYPE_COUNTS: Record<ContentType, number> = {
  reels: 10,
  comic: 4,
  cardnews: 5,
  banner: 1,
  story: 1,
  thumbnail: 3,
  detail_header: 2,
};

/** 콘텐츠 타입별 크기 */
export const CONTENT_TYPE_SIZES: Record<ContentType, { width: number; height: number }> = {
  reels: { width: 1080, height: 1920 },
  comic: { width: 1080, height: 1080 },
  cardnews: { width: 1080, height: 1350 },
  banner: { width: 1200, height: 628 },
  story: { width: 1080, height: 1920 },
  thumbnail: { width: 1280, height: 720 },
  detail_header: { width: 860, height: 500 },
};

/** 페이지당 콘텐츠 수 */
export const CONTENT_PAGE_SIZE = 20;

