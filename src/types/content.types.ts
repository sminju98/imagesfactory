/**
 * ContentFactory 타입 정의
 * 하루 콘텐츠 공장 - 프롬프트 하나로 다양한 콘텐츠 자동 생성
 */

// 콘텐츠 생성 단계
export type ContentStep = 
  | 'concept'    // Step 1: 콘셉트 정리
  | 'message'    // Step 2: 메시지 방향
  | 'script'     // Step 3: 대본/시나리오
  | 'copy'       // Step 4: 카피 확정
  | 'production' // Step 5: 자동 생산

export const CONTENT_STEPS: { id: ContentStep; name: string; emoji: string }[] = [
  { id: 'concept', name: '콘셉트', emoji: '💡' },
  { id: 'message', name: '메시지', emoji: '💬' },
  { id: 'script', name: '대본', emoji: '📝' },
  { id: 'copy', name: '카피', emoji: '✍️' },
  { id: 'production', name: '생산', emoji: '🏭' },
];

// Step 1: 콘셉트 데이터
export interface ConceptData {
  productName: string;        // 제품명
  usp: string;                // USP (장점)
  target: string;             // 타겟
  toneAndManner: string;      // 톤앤매너
  strategy: string;           // 전략 방향
  keywords: string[];         // 키워드
  marketTrend?: string;       // 시장 트렌드 (Perplexity)
}

// Step 2: 메시지 데이터
export interface MessageData {
  mainCopy: string;           // 메인 카피
  subCopy: string;            // 서브 카피
  ctaText: string;            // CTA 문구
  alternativeOptions?: {      // 대안 옵션들
    mainCopy: string[];
    subCopy: string[];
    ctaText: string[];
  };
}

// Step 3: 대본/시나리오 데이터
export interface ScriptData {
  reelsStory: ReelsScene[];      // 릴스/틱톡 컷씬 10개
  comicStory: ComicPanel[];      // 4컷 만화 스토리
  cardNewsFlow: CardNewsPage[];  // 카드뉴스 흐름
}

export interface ReelsScene {
  order: number;
  description: string;     // 장면 설명
  caption: string;         // 자막
  duration: number;        // 초 단위
  imagePrompt?: string;    // 이미지 생성용 프롬프트
}

export interface ComicPanel {
  order: number;           // 1-4
  description: string;     // 장면 설명
  dialogue: string;        // 대사/말풍선
  imagePrompt?: string;    // 이미지 생성용 프롬프트
}

export interface CardNewsPage {
  order: number;           // 1-5
  title: string;           // 페이지 제목
  body: string;            // 본문
  imagePrompt?: string;    // 이미지 생성용 프롬프트
}

// Step 4: 카피 확정 데이터
export interface CopyData {
  reelsCaptions: string[];        // 릴스 자막
  cardNewsCopies: string[];       // 카드뉴스 각 페이지 문구
  bannerCopy: string;             // 배너 문구
  storyCopy: string;              // 스토리 문구
  thumbnailTitle: string;         // 유튜브 썸네일 제목
  detailPageHeadline: string;     // 상세페이지 헤드라인
}

// Step 5: 생산 결과
export interface ProductionResult {
  reelsImages: GeneratedContent[];      // 릴스 컷씬 이미지
  comicImages: GeneratedContent[];      // 4컷 만화 이미지
  cardNewsImages: GeneratedContent[];   // 카드뉴스 1080x1080
  bannerImages: GeneratedContent[];     // 배너/스토리 광고
  thumbnailImages: GeneratedContent[];  // 유튜브 섬네일
  detailPageHeader: GeneratedContent[]; // 상세페이지 헤더
}

export interface GeneratedContent {
  id: string;
  type: ContentType;
  imageUrl: string;
  thumbnailUrl?: string;
  text?: string;           // 오버레이 텍스트
  width: number;
  height: number;
  modelId?: string;
  createdAt: Date;
}

// 콘텐츠 타입
export type ContentType = 
  | 'reels'
  | 'comic'
  | 'card_news'
  | 'banner'
  | 'story'
  | 'thumbnail'
  | 'detail_header';

// 콘텐츠 템플릿 사이즈
export const CONTENT_SIZES: Record<ContentType, { width: number; height: number; label: string }> = {
  reels: { width: 1080, height: 1920, label: '릴스/틱톡 (9:16)' },
  comic: { width: 1080, height: 1080, label: '4컷 만화 (1:1)' },
  card_news: { width: 1080, height: 1080, label: '카드뉴스 (1:1)' },
  banner: { width: 1200, height: 628, label: '배너 광고 (1.91:1)' },
  story: { width: 1080, height: 1920, label: '스토리 광고 (9:16)' },
  thumbnail: { width: 1280, height: 720, label: '유튜브 썸네일 (16:9)' },
  detail_header: { width: 860, height: 500, label: '상세페이지 (약 1.7:1)' },
};

// 전체 콘텐츠 프로젝트
export interface ContentProject {
  id: string;
  userId: string;
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  currentStep: ContentStep;
  
  // 입력 데이터
  inputPrompt: string;          // 사용자 입력 프롬프트
  referenceImageIds?: string[]; // 참고 이미지 ID (ImageFactory에서 선택)
  
  // 단계별 데이터
  concept?: ConceptData;
  message?: MessageData;
  script?: ScriptData;
  copy?: CopyData;
  production?: ProductionResult;
  
  // 메타데이터
  totalPointsUsed: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// API 요청/응답 타입
export interface GenerateConceptRequest {
  prompt: string;
  referenceImageIds?: string[];
}

export interface GenerateConceptResponse {
  success: boolean;
  data?: ConceptData;
  error?: string;
}

export interface GenerateMessageRequest {
  concept: ConceptData;
}

export interface GenerateMessageResponse {
  success: boolean;
  data?: MessageData;
  error?: string;
}

export interface GenerateScriptRequest {
  concept: ConceptData;
  message: MessageData;
}

export interface GenerateScriptResponse {
  success: boolean;
  data?: ScriptData;
  error?: string;
}

export interface GenerateCopyRequest {
  concept: ConceptData;
  message: MessageData;
  script: ScriptData;
}

export interface GenerateCopyResponse {
  success: boolean;
  data?: CopyData;
  error?: string;
}

export interface StartProductionRequest {
  projectId: string;
  concept: ConceptData;
  message: MessageData;
  script: ScriptData;
  copy: CopyData;
  selectedImageIds?: string[]; // ImageFactory에서 선택한 이미지
}

export interface StartProductionResponse {
  success: boolean;
  taskId?: string;
  error?: string;
}