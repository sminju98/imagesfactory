/**
 * ContentFactory 관련 타입 정의 (Phase 2)
 * 카드뉴스, 썸네일, 릴스/틱톡 영상 자동 생성
 */

import { Timestamp } from 'firebase/firestore';

/**
 * 콘텐츠 타입
 */
export type ContentType = 
  | 'card_news'
  | 'thumbnail'
  | 'reels'
  | 'poster'
  | 'banner';

/**
 * 콘텐츠 상태
 */
export type ContentStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 카드뉴스 슬라이드
 */
export interface CardNewsSlide {
  order: number;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  body?: string;
  textPosition: 'top' | 'center' | 'bottom';
  textColor: string;
  backgroundColor?: string;
}

/**
 * 카드뉴스
 */
export interface CardNews {
  id: string;
  userId: string;
  title: string;
  slides: CardNewsSlide[];
  templateId: string;
  aspectRatio: '1:1' | '4:5' | '9:16';
  status: ContentStatus;
  exportUrls?: {
    pdf?: string;
    images?: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 썸네일 설정
 */
export interface ThumbnailConfig {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'custom';
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  textStyle: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    strokeColor?: string;
    strokeWidth?: number;
  };
  overlayColor?: string;
  overlayOpacity?: number;
}

/**
 * 썸네일
 */
export interface Thumbnail {
  id: string;
  userId: string;
  sourceImageId: string;      // 갤러리 이미지 ID
  config: ThumbnailConfig;
  outputUrl?: string;
  status: ContentStatus;
  createdAt: Timestamp;
}

/**
 * 릴스/틱톡 영상 설정
 */
export interface ReelsConfig {
  duration: 5 | 10 | 15 | 30;  // 초
  aspectRatio: '9:16' | '1:1';
  transition: 'fade' | 'slide' | 'zoom' | 'none';
  transitionDuration: number;  // ms
  bgmId?: string;              // 배경음악 ID
  textOverlays?: {
    text: string;
    startTime: number;
    endTime: number;
    position: 'top' | 'center' | 'bottom';
  }[];
}

/**
 * 릴스/틱톡 영상
 */
export interface Reels {
  id: string;
  userId: string;
  sourceImageIds: string[];    // 사용할 갤러리 이미지들
  config: ReelsConfig;
  outputUrl?: string;
  thumbnailUrl?: string;
  status: ContentStatus;
  createdAt: Timestamp;
}

/**
 * 템플릿
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  type: ContentType;
  thumbnailUrl: string;
  config: Record<string, unknown>;  // 타입별 설정
  isPremium: boolean;
  usageCount: number;
  createdAt: Timestamp;
}

/**
 * 콘텐츠 생성 요청 (공통)
 */
export interface ContentCreateRequest {
  type: ContentType;
  sourceImageIds: string[];
  templateId?: string;
  config: Record<string, unknown>;
}

/**
 * 콘텐츠 생성 응답
 */
export interface ContentCreateResponse {
  contentId: string;
  type: ContentType;
  status: ContentStatus;
  estimatedTime?: number;
}

/**
 * ContentFactory 탭 메뉴 아이템
 */
export interface ContentMenuItem {
  id: ContentType;
  title: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  comingSoon?: boolean;
}

/**
 * ContentFactory 메뉴 목록
 */
export const CONTENT_MENU_ITEMS: ContentMenuItem[] = [
  {
    id: 'card_news',
    title: '카드뉴스',
    description: 'SNS용 카드뉴스 자동 생성',
    icon: '📰',
    isAvailable: false,
    comingSoon: true,
  },
  {
    id: 'thumbnail',
    title: '썸네일',
    description: '유튜브/인스타 썸네일 생성',
    icon: '🎬',
    isAvailable: false,
    comingSoon: true,
  },
  {
    id: 'reels',
    title: '릴스/틱톡',
    description: '짧은 영상 자동 생성',
    icon: '📱',
    isAvailable: false,
    comingSoon: true,
  },
  {
    id: 'poster',
    title: '포스터',
    description: '이벤트/행사 포스터 생성',
    icon: '🎨',
    isAvailable: false,
    comingSoon: true,
  },
  {
    id: 'banner',
    title: '배너',
    description: '웹/앱 배너 이미지 생성',
    icon: '🖼️',
    isAvailable: false,
    comingSoon: true,
  },
];

