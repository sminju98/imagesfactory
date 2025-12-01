// Reels Factory 관련 타입 정의

import { Timestamp } from 'firebase/firestore';

// ==================== Reels 프로젝트 ====================

/** Reels 프로젝트 상태 */
export type ReelsProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

/** Reels 프로젝트 문서 */
export interface ReelsProject {
  id: string;
  userId: string;
  
  // Step0: 입력
  inputPrompt: string;
  refinedPrompt: string;
  uploadedImages: UploadedImage[];
  options: ReelsOptions;
  
  // Step1: 리서치
  researchResults: ResearchResult[];
  selectedInsights: string[];
  
  // Step2: 콘셉트
  concepts: Concept[];
  chosenConcept: Concept | null;
  
  // Step3: 대본
  videoScripts: VideoScript[];
  
  // Step4: 영상
  videoClips: VideoClip[];
  
  // Step5: 음성+자막
  finalClips: FinalClip[];
  
  // Step6: 최종
  finalReelUrl: string;
  
  // 메타데이터
  currentStep: number; // 0-6
  status: ReelsProjectStatus;
  errorMessage?: string;
  pointsUsed: number;
  stepResults?: {
    step0?: any;
    step1?: any;
    step2?: any;
    step3?: any;
    step4_video0?: any;
    step4_video1?: any;
    step4_video2?: any;
    step4_video3?: any;
    step4_video4?: any;
    step5_video0?: any;
    step5_video1?: any;
    step5_video2?: any;
    step5_video3?: any;
    step5_video4?: any;
    step6?: any;
  };
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/** 업로드된 이미지 */
export interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  originalName: string;
  size: number;
  mimeType: string;
}

/** Reels 옵션 */
export interface ReelsOptions {
  target: string;      // 타겟 고객
  tone: string;        // 톤앤매너
  purpose: string;     // 목적
}

/** 리서치 결과 */
export interface ResearchResult {
  id: string;
  category: 'keyword' | 'painpoint' | 'trend' | 'usp' | 'expression' | 'general';
  content: string;
  source?: string;
  selected: boolean;
}

/** 콘셉트 */
export interface Concept {
  id: string;
  title: string;
  hook: string;           // 훅 (시작 문구)
  flow: string;           // 플로우 설명
  cta: string;            // CTA
  summary: string;        // 요약
  selected: boolean;
}

/** 비디오 대본 */
export interface VideoScript {
  videoIndex: number;     // 0-4 (5개 영상)
  duration: number;       // 8초
  shots: Shot[];          // 샷 리스트
  narration: string;      // 내레이션 텍스트
  approved: boolean;
}

/** 샷 */
export interface Shot {
  index: number;
  duration: number;       // 초
  description: string;    // 장면 설명
  visualPrompt: string;   // Veo3용 프롬프트
  useUploadedImage?: string; // 업로드 이미지 사용 시 ID
}

/** 비디오 클립 */
export interface VideoClip {
  videoIndex: number;
  url: string;
  thumbnailUrl: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/** 최종 클립 (음성+자막 합성) */
export interface FinalClip {
  videoIndex: number;
  url: string;
  audioUrl: string;
  subtitleUrl: string;    // SRT/VTT 파일
  duration: number;
}

// ==================== API 응답 타입 ====================

/** API 응답 기본 타입 */
export interface ReelsApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 프롬프트 교정 응답 */
export interface RefinePromptResponse {
  refinedPrompt: string;
  improvements: string[];
}

/** 리서치 응답 */
export interface ResearchResponse {
  results: ResearchResult[];
}

/** 콘셉트 응답 */
export interface ConceptResponse {
  concepts: Concept[];
}

/** 대본 응답 */
export interface ScriptResponse {
  videoScripts: VideoScript[];
}

/** 영상 생성 응답 */
export interface VideoGenerationResponse {
  operationId: string;
}

/** TTS 응답 */
export interface TTSResponse {
  audioUrl: string;
  duration: number;
}

/** 결합 응답 */
export interface MergeResponse {
  finalReelUrl: string;
  duration: number;
}

// ==================== 상수 ====================

/** 총 단계 수 */
export const TOTAL_STEPS = 7; // Step0~Step6

/** 각 영상 길이 (초) */
export const VIDEO_DURATION = 8;

/** 총 릴스 길이 (초) */
export const TOTAL_REEL_DURATION = VIDEO_DURATION * 5; // 40초

