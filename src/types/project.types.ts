/**
 * AI 콘텐츠 프로젝트 타입 정의
 * Short-form/Reels Content Factory
 */

import { Timestamp } from 'firebase/firestore';

// ============ 프로젝트 상태 ============

export type ProjectStatus = 
  | 'input'      // Step 1: 입력 대기
  | 'prompt'     // Step 2: 프롬프트 교정
  | 'script'     // Step 3: 스크립트/씬 생성
  | 'video'      // Step 4: 비디오 생성
  | 'tts'        // Step 5: TTS 생성
  | 'subtitle'   // Step 6: 자막 생성
  | 'composing'  // Step 7: 최종 합성 중
  | 'done'       // 완료
  | 'failed';    // 실패

// ============ 씬 ============

export interface Scene {
  id: string;
  index: number;
  prompt: string;         // 영어 비주얼 프롬프트 (텍스트 없음)
  narration: string;      // 한국어/영어 내레이션
  duration: number;       // 기본 8초
  approved: boolean;      // 사용자 승인 여부
}

// ============ 비디오 클립 ============

export interface VideoClip {
  sceneId: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  operationId?: string;   // Veo API operation ID
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  retryCount?: number;
}

// ============ TTS 오디오 ============

export interface TTSAudio {
  sceneId: string;
  audioUrl?: string;
  duration?: number;      // 실제 오디오 길이 (초)
  voice: string;          // 음성 ID
  text: string;           // 원본 텍스트
  status: 'pending' | 'completed' | 'failed';
}

// ============ 자막 ============

export interface SubtitleEntry {
  index: number;
  startTime: number;      // 초
  endTime: number;        // 초
  text: string;
}

export interface Subtitle {
  sceneId: string;
  entries: SubtitleEntry[];
  srtContent?: string;
  assContent?: string;
  totalDuration: number;
}

// GPT가 생성한 자막 스타일
export interface GeneratedSubtitleStyle {
  fontName: string;
  fontSize: number;
  primaryColor: string;
  outlineColor: string;
  backColor: string;
  bold: boolean;
  outline: number;
  shadow: number;
  alignment: 2 | 5 | 8;
  marginV: number;
  styleName: string;
  styleDescription: string;
  mood: string;
}

// ============ 메인 프로젝트 ============

export interface AIContentProject {
  id: string;
  userId: string;
  
  // Step 1: 입력
  rawPrompt: string;
  referenceImageUrl?: string;
  
  // Step 2: 프롬프트 교정
  correctedPrompt?: string;
  confirmedPrompt?: string;
  
  // Step 3: 스크립트/씬
  script?: string;
  scenes: Scene[];
  scriptFinal?: string;
  scenesFinal: Scene[];
  subtitleStyle?: GeneratedSubtitleStyle;  // GPT가 생성한 자막 스타일
  
  // Step 4: 비디오
  videoClips: VideoClip[];
  selectedVideoClips: string[];
  
  // Step 5: TTS
  ttsAudios: TTSAudio[];
  selectedVoice?: string;
  
  // Step 6: 자막
  subtitles: Subtitle[];
  subtitlesFinal: Subtitle[];
  
  // Step 7: 최종
  finalVideoUrl?: string;
  
  // 메타데이터
  status: ProjectStatus;
  currentStep: number;
  pointsUsed: number;
  language: 'ko' | 'en';
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ API 요청/응답 타입 ============

// Step 1: 입력 저장
export interface SubmitInputRequest {
  projectId: string;
  rawPrompt: string;
  referenceImageUrl?: string;
  language?: 'ko' | 'en';
}

export interface SubmitInputResponse {
  success: boolean;
  projectId?: string;
  error?: string;
}

// Step 2: 프롬프트 교정
export interface CorrectPromptRequest {
  projectId: string;
  rawPrompt: string;
}

export interface CorrectPromptResponse {
  success: boolean;
  correctedPrompt?: string;
  error?: string;
}

export interface ConfirmPromptRequest {
  projectId: string;
  confirmedPrompt: string;
}

// Step 3: 스크립트/씬 생성
export interface GenerateScriptRequest {
  projectId: string;
  confirmedPrompt: string;
}

export interface GenerateScriptResponse {
  success: boolean;
  script?: string;
  scenes?: Scene[];
  subtitleStyle?: GeneratedSubtitleStyle;  // GPT가 생성한 자막 스타일
  error?: string;
}

export interface ConfirmScriptRequest {
  projectId: string;
  scriptFinal: string;
  scenesFinal: Scene[];
}

// Step 4: 비디오 생성
export interface GenerateVideoRequest {
  projectId: string;
  sceneId: string;
  prompt: string;
}

export interface GenerateVideoResponse {
  success: boolean;
  operationId?: string;
  error?: string;
}

export interface CheckVideoStatusRequest {
  operationId: string;
}

export interface CheckVideoStatusResponse {
  success: boolean;
  done: boolean;
  videoUrl?: string;
  error?: string;
}

export interface SelectVideoRequest {
  projectId: string;
  selectedVideoClips: string[];
}

// Step 5: TTS 생성
export interface GenerateTTSRequest {
  projectId: string;
  sceneId: string;
  text: string;
  voice?: string;
}

export interface GenerateTTSResponse {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
}

export interface ConfirmTTSRequest {
  projectId: string;
  ttsAudios: TTSAudio[];
}

// Step 6: 자막 생성
export interface GenerateSubtitleRequest {
  projectId: string;
  sceneId: string;
  narration: string;
  audioDuration: number;
}

export interface GenerateSubtitleResponse {
  success: boolean;
  subtitles?: Subtitle;
  srtContent?: string;
  error?: string;
}

export interface ConfirmSubtitleRequest {
  projectId: string;
  subtitlesFinal: Subtitle[];
}

// Step 7: 최종 합성
export interface FinalComposeRequest {
  projectId: string;
}

export interface FinalComposeResponse {
  success: boolean;
  finalVideoUrl?: string;
  error?: string;
}

// 프로젝트 조회
export interface GetProjectResponse {
  success: boolean;
  project?: AIContentProject;
  error?: string;
}

// ============ 유틸리티 타입 ============

export type VoiceOption = 
  | 'alloy'    // 중성적
  | 'echo'     // 남성적, 깊은
  | 'fable'    // 영국식
  | 'onyx'     // 남성적, 권위있는
  | 'nova'     // 여성적, 부드러운
  | 'shimmer'; // 여성적, 따뜻한

export const VOICE_OPTIONS: Record<VoiceOption, { label: string; description: string }> = {
  alloy: { label: 'Alloy', description: '중성적이고 균형잡힌 목소리' },
  echo: { label: 'Echo', description: '남성적이고 깊은 목소리' },
  fable: { label: 'Fable', description: '영국식 억양' },
  onyx: { label: 'Onyx', description: '남성적이고 권위있는 목소리' },
  nova: { label: 'Nova', description: '여성적이고 부드러운 목소리' },
  shimmer: { label: 'Shimmer', description: '여성적이고 따뜻한 목소리' },
};

// 포인트 비용
export const POINT_COSTS = {
  promptCorrection: 5,
  scriptGeneration: 10,
  videoGeneration: 50,  // 개당
  ttsGeneration: 10,    // 개당
  finalComposition: 20,
} as const;

// 기본값
export const DEFAULT_VIDEO_DURATION = 8; // 초
export const DEFAULT_SCENE_COUNT = { min: 3, max: 7 };
export const DEFAULT_LANGUAGE: 'ko' | 'en' = 'ko';
