# Reels Factory 기술 명세서

## 📋 목차
1. [기능 개요](#1-기능-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [데이터베이스 설계](#3-데이터베이스-설계)
4. [프론트엔드 설계](#4-프론트엔드-설계)
5. [백엔드 API 설계](#5-백엔드-api-설계)
6. [외부 API 연동](#6-외부-api-연동)
7. [FFmpeg 영상 처리](#7-ffmpeg-영상-처리)
8. [클라이언트-서버 데이터 흐름](#8-클라이언트-서버-데이터-흐름)
9. [구현 코드 템플릿](#9-구현-코드-템플릿)

---

## 1. 기능 개요

### 1.1 Reels Factory란?
사용자가 **"이미지 + 프롬프트 1줄"**만 입력하면 자동으로 40초 릴스 영상을 제작하는 기능입니다.

### 1.2 처리 단계
```
Step0 → Step1 → Step2 → Step3 → Step4 → Step5 → Step6
입력    리서치   콘셉트   대본    영상    음성    최종
```

| Step | 이름 | 담당 AI | 설명 |
|------|------|---------|------|
| Step0 | 입력 & 프롬프트 교정 | GPT-5.1-mini | 프롬프트 정제 |
| Step1 | 리서치 | Perplexity | 트렌드/키워드 수집 |
| Step2 | 콘셉트 기획 | GPT | 릴스 콘셉트 2~3개 생성 |
| Step3 | 대본 작성 | Grok2 | 장면별 샷 리스트 생성 |
| Step4 | 영상 제작 | Veo3 | 8초 영상 5개 생성 |
| Step5 | 음성 합성 | Pixazo | TTS + 자막 생성 |
| Step6 | 최종 결합 | FFmpeg | 5개 영상 이어붙이기 |

### 1.3 최종 결과물
- 40초 릴스 영상 (8초 × 5개)
- 음성 내레이션 포함
- 자막 포함
- 개별 클립 다운로드 가능

---

## 2. 시스템 아키텍처

### 2.1 전체 흐름도
```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                          │
├─────────────────────────────────────────────────────────────────┤
│  ReelsFactoryPage                                                │
│    ├── Step0Modal (입력 + GPT 교정)                              │
│    ├── Step1Modal (Perplexity 리서치)                            │
│    ├── Step2Modal (GPT 콘셉트)                                   │
│    ├── Step3Modal (Grok 대본)                                    │
│    ├── Step4Modal (Veo3 영상)                                    │
│    ├── Step5Modal (Pixazo TTS)                                   │
│    └── Step6Modal (FFmpeg 결합)                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
├─────────────────────────────────────────────────────────────────┤
│  /api/reels                                                      │
│    ├── /create          (프로젝트 생성)                          │
│    ├── /refine-prompt   (GPT 프롬프트 교정)                      │
│    ├── /research        (Perplexity 리서치)                      │
│    ├── /concept         (GPT 콘셉트 기획)                        │
│    ├── /script          (Grok 대본 생성)                         │
│    ├── /generate-video  (Veo3 영상 생성)                         │
│    ├── /tts             (Pixazo 음성 합성)                       │
│    ├── /merge           (FFmpeg 영상 결합)                       │
│    └── /[projectId]     (프로젝트 상태 조회)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Firebase    │   │  External AI  │   │  Cloud Run    │
│   Firestore   │   │     APIs      │   │   (FFmpeg)    │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ ReelsProjects │   │ - OpenAI      │   │ - Video       │
│ ReelsVideos   │   │ - Perplexity  │   │   Processing  │
│ ReelsAssets   │   │ - xAI (Grok)  │   │ - Concat      │
└───────────────┘   │ - Google Veo3 │   │ - Subtitles   │
                    │ - Pixazo      │   └───────────────┘
                    └───────────────┘
```

### 2.2 기술 스택
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (영상/이미지 저장)
- **AI APIs**: OpenAI, Perplexity, xAI Grok, Google Veo3, Pixazo
- **Video Processing**: FFmpeg (Cloud Functions 또는 Cloud Run)

---

## 3. 데이터베이스 설계

### 3.1 Firestore 컬렉션 구조

#### reelsProjects (메인 컬렉션)
```typescript
interface ReelsProject {
  id: string;                    // 문서 ID
  userId: string;                // 사용자 ID
  
  // Step0: 입력
  inputPrompt: string;           // 원본 프롬프트
  refinedPrompt: string;         // GPT 교정된 프롬프트
  uploadedImages: UploadedImage[]; // 업로드된 이미지들
  options: {
    target: string;              // 타겟 고객
    tone: string;                // 톤앤매너
    purpose: string;             // 목적
  };
  
  // Step1: 리서치
  researchResults: ResearchResult[];  // Perplexity 리서치 결과
  selectedInsights: string[];         // 선택된 인사이트
  
  // Step2: 콘셉트
  concepts: Concept[];           // 생성된 콘셉트 후보들
  chosenConcept: Concept | null; // 선택된 콘셉트
  
  // Step3: 대본
  videoScripts: VideoScript[];   // 5개 영상 대본
  
  // Step4: 영상
  videoClips: VideoClip[];       // 5개 생성된 영상
  
  // Step5: 음성+자막
  finalClips: FinalClip[];       // 음성+자막 합성된 영상
  
  // Step6: 최종
  finalReelUrl: string;          // 최종 릴스 URL
  
  // 메타데이터
  currentStep: number;           // 현재 단계 (0-6)
  status: 'draft' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  pointsUsed: number;            // 사용 포인트
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  originalName: string;
  size: number;
  mimeType: string;
}

interface ResearchResult {
  id: string;
  category: 'keyword' | 'painpoint' | 'trend' | 'usp' | 'expression';
  content: string;
  source?: string;
  selected: boolean;
}

interface Concept {
  id: string;
  title: string;
  hook: string;           // 훅 (시작 문구)
  flow: string;           // 플로우 설명
  cta: string;            // CTA
  summary: string;        // 요약
  selected: boolean;
}

interface VideoScript {
  videoIndex: number;     // 0-4 (5개 영상)
  duration: number;       // 8초
  shots: Shot[];          // 샷 리스트
  narration: string;      // 내레이션 텍스트
  approved: boolean;
}

interface Shot {
  index: number;
  duration: number;       // 초
  description: string;    // 장면 설명
  visualPrompt: string;   // Veo3용 프롬프트
  useUploadedImage?: string; // 업로드 이미지 사용 시 ID
}

interface VideoClip {
  videoIndex: number;
  url: string;
  thumbnailUrl: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface FinalClip {
  videoIndex: number;
  url: string;
  audioUrl: string;
  subtitleUrl: string;    // SRT/VTT 파일
  duration: number;
}
```

### 3.2 Firestore 인덱스
```json
{
  "indexes": [
    {
      "collectionGroup": "reelsProjects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reelsProjects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 4. 프론트엔드 설계

### 4.1 디렉토리 구조
```
src/
├── app/
│   └── reels/
│       ├── page.tsx                    # 메인 페이지 (Step0)
│       ├── [projectId]/
│       │   └── page.tsx                # 프로젝트 상세/결과 페이지
│       └── history/
│           └── page.tsx                # 히스토리 페이지
│
├── components/
│   └── reels-factory/
│       ├── ReelsFactoryMain.tsx        # 메인 컴포넌트
│       ├── ReelsFactoryModal.tsx       # 공통 모달 래퍼
│       ├── StepProgress.tsx            # 단계 진행률 표시
│       │
│       ├── steps/
│       │   ├── Step0Input.tsx          # 입력 + 프롬프트 교정
│       │   ├── Step1Research.tsx       # Perplexity 리서치
│       │   ├── Step2Concept.tsx        # GPT 콘셉트 기획
│       │   ├── Step3Script.tsx         # Grok 대본 생성
│       │   ├── Step4Videos.tsx         # Veo3 영상 제작
│       │   ├── Step5Voice.tsx          # Pixazo TTS + 자막
│       │   └── Step6Final.tsx          # 최종 결합
│       │
│       ├── common/
│       │   ├── VideoPreview.tsx        # 영상 미리보기
│       │   ├── ImageUpload.tsx         # 이미지 업로드
│       │   ├── LoadingProgress.tsx     # 로딩 진행률
│       │   ├── ConceptCard.tsx         # 콘셉트 카드
│       │   ├── ScriptEditor.tsx        # 대본 편집기
│       │   └── InsightCheckbox.tsx     # 인사이트 체크박스
│       │
│       └── result/
│           ├── ReelsPlayer.tsx         # 최종 릴스 플레이어
│           ├── ClipDownloader.tsx      # 클립 다운로드
│           └── ShareButtons.tsx        # 공유 버튼
│
├── hooks/
│   └── useReelsProject.ts              # Reels 프로젝트 훅
│
├── store/
│   └── reelsStore.ts                   # Zustand 스토어
│
└── types/
    └── reels.types.ts                  # 타입 정의
```

### 4.2 공통 모달 컴포넌트
```typescript
// src/components/reels-factory/ReelsFactoryModal.tsx

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ReelsFactoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps?: number;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
  preventClose?: boolean;
}

export const ReelsFactoryModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  currentStep,
  totalSteps = 7,
  children,
  footer,
  size = 'lg',
  preventClose = false,
}: ReelsFactoryModalProps) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={preventClose ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-zinc-900 rounded-2xl shadow-2xl ${sizeClasses[size]} w-full mx-4 flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Step Progress */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Step {currentStep}/{totalSteps - 1}</span>
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i <= currentStep 
                        ? 'bg-indigo-500' 
                        : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {!preventClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4.3 단계 진행률 컴포넌트
```typescript
// src/components/reels-factory/StepProgress.tsx

interface StepProgressProps {
  currentStep: number;
  steps: { id: number; name: string; description: string }[];
}

export const StepProgress = ({ currentStep, steps }: StepProgressProps) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
              ${index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep 
                  ? 'bg-indigo-500 text-white animate-pulse' 
                  : 'bg-zinc-700 text-zinc-400'
              }
            `}>
              {index < currentStep ? '✓' : index}
            </div>
            
            {/* Step Info */}
            <div className="ml-3 hidden md:block">
              <p className={`text-sm font-medium ${
                index <= currentStep ? 'text-white' : 'text-zinc-500'
              }`}>
                {step.name}
              </p>
              <p className="text-xs text-zinc-500">{step.description}</p>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`
                w-12 md:w-24 h-1 mx-2 rounded
                ${index < currentStep ? 'bg-green-500' : 'bg-zinc-700'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 5. 백엔드 API 설계

### 5.1 API 라우트 구조
```
src/app/api/reels/
├── create/
│   └── route.ts              # POST: 프로젝트 생성
├── refine-prompt/
│   └── route.ts              # POST: GPT 프롬프트 교정
├── research/
│   └── route.ts              # POST: Perplexity 리서치
├── concept/
│   └── route.ts              # POST: GPT 콘셉트 기획
├── script/
│   └── route.ts              # POST: Grok 대본 생성
├── generate-video/
│   └── route.ts              # POST: Veo3 영상 생성
├── tts/
│   └── route.ts              # POST: Pixazo TTS
├── subtitle/
│   └── route.ts              # POST: 자막 생성
├── merge/
│   └── route.ts              # POST: FFmpeg 결합
└── [projectId]/
    └── route.ts              # GET: 상태 조회, PUT: 업데이트
```

### 5.2 API 엔드포인트 상세

#### POST /api/reels/create
```typescript
// 요청
{
  prompt: string;
  images?: File[];
  options: {
    target: string;
    tone: string;
    purpose: string;
  }
}

// 응답
{
  success: true,
  data: {
    projectId: string;
    status: 'draft';
  }
}
```

#### POST /api/reels/refine-prompt
```typescript
// 요청
{
  projectId: string;
  prompt: string;
}

// 응답
{
  success: true,
  data: {
    refinedPrompt: string;
    improvements: string[];
  }
}
```

#### POST /api/reels/research
```typescript
// 요청
{
  projectId: string;
  refinedPrompt: string;
}

// 응답
{
  success: true,
  data: {
    results: ResearchResult[];
  }
}
```

#### POST /api/reels/concept
```typescript
// 요청
{
  projectId: string;
  refinedPrompt: string;
  selectedInsights: string[];
  options: { target, tone, purpose };
}

// 응답
{
  success: true,
  data: {
    concepts: Concept[]; // 2-3개
  }
}
```

#### POST /api/reels/script
```typescript
// 요청
{
  projectId: string;
  chosenConcept: Concept;
  uploadedImages: UploadedImage[];
}

// 응답
{
  success: true,
  data: {
    videoScripts: VideoScript[]; // 5개
  }
}
```

#### POST /api/reels/generate-video
```typescript
// 요청
{
  projectId: string;
  videoScript: VideoScript;
  videoIndex: number;
}

// 응답 (비동기)
{
  success: true,
  data: {
    operationId: string; // 작업 ID (폴링용)
  }
}
```

#### POST /api/reels/tts
```typescript
// 요청
{
  projectId: string;
  videoIndex: number;
  narration: string;
}

// 응답
{
  success: true,
  data: {
    audioUrl: string;
    duration: number;
  }
}
```

#### POST /api/reels/merge
```typescript
// 요청
{
  projectId: string;
  finalClips: FinalClip[];
}

// 응답
{
  success: true,
  data: {
    finalReelUrl: string;
    duration: number;
  }
}
```

---

## 6. 외부 API 연동

### 6.1 GPT (프롬프트 교정 / 콘셉트)
```typescript
// src/lib/reels/gpt.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function refinePromptWithGPT(prompt: string): Promise<string> {
  const systemPrompt = `당신은 릴스 콘텐츠 전문가입니다.
사용자의 프롬프트를 분석하여 더 효과적인 릴스 제작을 위한 프롬프트로 교정해주세요.

교정 원칙:
1. 명확하고 구체적인 표현 사용
2. 타겟 오디언스 고려
3. 트렌디한 표현 추가
4. 감성적 호소력 강화

JSON 형식으로 응답:
{
  "refinedPrompt": "교정된 프롬프트",
  "improvements": ["개선점1", "개선점2", ...]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  return completion.choices[0]?.message?.content || '';
}

export async function generateConceptsWithGPT(
  refinedPrompt: string,
  insights: string[],
  options: { target: string; tone: string; purpose: string }
): Promise<Concept[]> {
  const systemPrompt = `당신은 SNS 릴스 콘텐츠 기획자입니다.
주어진 정보를 바탕으로 40초 릴스를 위한 콘셉트 3개를 제안해주세요.

각 콘셉트는 다음을 포함:
- title: 콘셉트 제목
- hook: 시작 3초 훅 문구
- flow: 전체 흐름 설명 (5개 영상)
- cta: 마무리 CTA
- summary: 한 줄 요약

JSON 형식:
{
  "concepts": [
    { "id": "1", "title": "...", "hook": "...", "flow": "...", "cta": "...", "summary": "..." },
    ...
  ]
}`;

  const userPrompt = `
프롬프트: ${refinedPrompt}

리서치 인사이트:
${insights.join('\n')}

타겟: ${options.target}
톤앤매너: ${options.tone}
목적: ${options.purpose}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
  return result.concepts || [];
}
```

### 6.2 Perplexity (리서치)
```typescript
// src/lib/reels/perplexity.ts

export async function researchWithPerplexity(
  refinedPrompt: string
): Promise<ResearchResult[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY가 설정되지 않았습니다.');
  }

  const searchQueries = [
    `${refinedPrompt} 관련 최신 트렌드 키워드 2025`,
    `${refinedPrompt} 소비자 페인포인트 및 니즈`,
    `${refinedPrompt} 마케팅 표현 및 밈`,
  ];

  const results: ResearchResult[] = [];

  for (const query of searchQueries) {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `당신은 마케팅 리서치 전문가입니다. 
릴스 콘텐츠 제작을 위한 인사이트를 JSON 형식으로 제공하세요.

JSON 형식:
{
  "insights": [
    { "category": "keyword|painpoint|trend|usp|expression", "content": "인사이트 내용", "source": "출처" },
    ...
  ]
}`,
          },
          { role: 'user', content: query },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    try {
      const parsed = JSON.parse(content);
      results.push(...parsed.insights.map((insight: any, i: number) => ({
        id: `${Date.now()}-${i}`,
        ...insight,
        selected: false,
      })));
    } catch {
      // JSON 파싱 실패 시 텍스트로 추가
      results.push({
        id: `${Date.now()}`,
        category: 'general',
        content: content,
        selected: false,
      });
    }
  }

  return results;
}
```

### 6.3 Grok (대본 생성)
```typescript
// src/lib/reels/grok.ts

export async function generateScriptsWithGrok(
  concept: Concept,
  uploadedImages: UploadedImage[]
): Promise<VideoScript[]> {
  const apiKey = process.env.XAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('XAI_API_KEY가 설정되지 않았습니다.');
  }

  const systemPrompt = `당신은 릴스 영상 대본 작가입니다.
주어진 콘셉트로 40초 릴스를 위한 5개 영상(각 8초)의 상세 대본을 작성하세요.

각 영상은 3-5개의 샷으로 구성되며, 각 샷에는:
- duration: 초 단위 길이
- description: 장면 설명
- visualPrompt: Veo3 영상 생성용 영어 프롬프트

JSON 형식:
{
  "videoScripts": [
    {
      "videoIndex": 0,
      "duration": 8,
      "shots": [
        { "index": 0, "duration": 2, "description": "...", "visualPrompt": "..." },
        ...
      ],
      "narration": "내레이션 텍스트"
    },
    ... (총 5개)
  ]
}

영상 구조:
- Video 1 (0-8초): Hook - 시선 끌기
- Video 2 (8-16초): Problem - 문제 제기
- Video 3 (16-24초): Solution - 해결책 제시
- Video 4 (24-32초): Proof - 증거/후기
- Video 5 (32-40초): CTA - 행동 유도`;

  const userPrompt = `
콘셉트: ${concept.title}
Hook: ${concept.hook}
Flow: ${concept.flow}
CTA: ${concept.cta}

업로드된 이미지 ${uploadedImages.length}개가 있습니다.
적절한 장면에 이미지를 활용해주세요.
`;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  
  return result.videoScripts || [];
}
```

### 6.4 Veo3 (영상 생성)
```typescript
// src/lib/reels/veo3.ts

export async function generateVideoWithVeo3(
  script: VideoScript,
  projectId: string
): Promise<{ operationId: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY가 설정되지 않았습니다.');
  }

  // 샷들을 하나의 프롬프트로 결합
  const combinedPrompt = script.shots
    .map(shot => shot.visualPrompt)
    .join('. Then ');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:generateVideos?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: combinedPrompt,
        config: {
          duration_seconds: 8,
          aspect_ratio: '9:16', // 릴스 세로 비율
          negative_prompt: 'blurry, low quality, distorted, ugly',
        },
      }),
    }
  );

  const data = await response.json();
  
  // Veo3는 비동기 작업이므로 operation ID 반환
  return {
    operationId: data.name || data.operationId,
  };
}

export async function checkVeo3Operation(
  operationId: string
): Promise<{ done: boolean; videoUrl?: string; error?: string }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${apiKey}`
  );

  const data = await response.json();
  
  if (data.done) {
    if (data.result?.generatedVideos?.[0]?.video) {
      return {
        done: true,
        videoUrl: data.result.generatedVideos[0].video.uri,
      };
    }
    return {
      done: true,
      error: data.error?.message || '영상 생성 실패',
    };
  }

  return { done: false };
}
```

### 6.5 Pixazo (TTS)
```typescript
// src/lib/reels/pixazo.ts

export async function generateTTSWithPixazo(
  narration: string,
  options: {
    voice?: string;
    speed?: number;
    pitch?: number;
  } = {}
): Promise<{ audioUrl: string; duration: number }> {
  const apiKey = process.env.PIXAZO_API_KEY;
  
  if (!apiKey) {
    throw new Error('PIXAZO_API_KEY가 설정되지 않았습니다.');
  }

  const response = await fetch('https://api.pixazo.com/v1/tts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: narration,
      voice: options.voice || 'ko-KR-Standard-A',
      speed: options.speed || 1.0,
      pitch: options.pitch || 0,
      output_format: 'mp3',
    }),
  });

  const data = await response.json();
  
  return {
    audioUrl: data.audio_url,
    duration: data.duration_seconds,
  };
}
```

---

## 7. FFmpeg 영상 처리

### 7.1 FFmpeg 서비스 (Cloud Functions)
```typescript
// functions/src/ffmpegService.ts

import * as functions from 'firebase-functions';
import { spawn } from 'child_process';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const storage = new Storage();

// 영상에 오디오 합성
export async function mergeAudioToVideo(
  videoUrl: string,
  audioUrl: string,
  outputPath: string
): Promise<string> {
  const tempDir = os.tmpdir();
  const videoPath = path.join(tempDir, 'input.mp4');
  const audioPath = path.join(tempDir, 'audio.mp3');
  const outputFilePath = path.join(tempDir, 'output.mp4');

  // 파일 다운로드
  await downloadFile(videoUrl, videoPath);
  await downloadFile(audioUrl, audioPath);

  // FFmpeg 명령 실행
  await runFFmpeg([
    '-i', videoPath,
    '-i', audioPath,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-shortest',
    outputFilePath,
  ]);

  // 결과 업로드
  const uploadedUrl = await uploadToStorage(outputFilePath, outputPath);
  
  // 임시 파일 정리
  fs.unlinkSync(videoPath);
  fs.unlinkSync(audioPath);
  fs.unlinkSync(outputFilePath);

  return uploadedUrl;
}

// 자막 합성
export async function addSubtitlesToVideo(
  videoUrl: string,
  subtitleUrl: string,
  outputPath: string
): Promise<string> {
  const tempDir = os.tmpdir();
  const videoPath = path.join(tempDir, 'input.mp4');
  const subtitlePath = path.join(tempDir, 'subtitle.srt');
  const outputFilePath = path.join(tempDir, 'output.mp4');

  await downloadFile(videoUrl, videoPath);
  await downloadFile(subtitleUrl, subtitlePath);

  // 자막 스타일 설정
  const subtitleFilter = `subtitles=${subtitlePath}:force_style='FontName=Pretendard,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Shadow=1,Alignment=2,MarginV=50'`;

  await runFFmpeg([
    '-i', videoPath,
    '-vf', subtitleFilter,
    '-c:a', 'copy',
    outputFilePath,
  ]);

  const uploadedUrl = await uploadToStorage(outputFilePath, outputPath);
  
  fs.unlinkSync(videoPath);
  fs.unlinkSync(subtitlePath);
  fs.unlinkSync(outputFilePath);

  return uploadedUrl;
}

// 영상 이어붙이기 (Concat)
export async function concatVideos(
  videoUrls: string[],
  outputPath: string,
  transitionDuration: number = 0.3
): Promise<string> {
  const tempDir = os.tmpdir();
  const inputFiles: string[] = [];
  
  // 모든 영상 다운로드
  for (let i = 0; i < videoUrls.length; i++) {
    const filePath = path.join(tempDir, `input_${i}.mp4`);
    await downloadFile(videoUrls[i], filePath);
    inputFiles.push(filePath);
  }

  // concat 파일 리스트 생성
  const listPath = path.join(tempDir, 'list.txt');
  const listContent = inputFiles.map(f => `file '${f}'`).join('\n');
  fs.writeFileSync(listPath, listContent);

  const outputFilePath = path.join(tempDir, 'final.mp4');

  // 트랜지션 없이 단순 결합
  if (transitionDuration === 0) {
    await runFFmpeg([
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c', 'copy',
      outputFilePath,
    ]);
  } else {
    // 트랜지션 적용 (crossfade)
    // 복잡한 필터 그래프 사용
    const filterComplex = buildCrossfadeFilter(inputFiles.length, transitionDuration);
    
    const ffmpegArgs = [];
    for (const file of inputFiles) {
      ffmpegArgs.push('-i', file);
    }
    ffmpegArgs.push(
      '-filter_complex', filterComplex,
      '-map', '[v]',
      '-map', '[a]',
      outputFilePath
    );
    
    await runFFmpeg(ffmpegArgs);
  }

  const uploadedUrl = await uploadToStorage(outputFilePath, outputPath);
  
  // 임시 파일 정리
  for (const file of inputFiles) {
    fs.unlinkSync(file);
  }
  fs.unlinkSync(listPath);
  fs.unlinkSync(outputFilePath);

  return uploadedUrl;
}

// Crossfade 필터 생성
function buildCrossfadeFilter(count: number, duration: number): string {
  // 5개 영상을 crossfade로 연결
  let filter = '';
  
  for (let i = 0; i < count; i++) {
    filter += `[${i}:v]fps=30,format=yuv420p[v${i}];`;
  }
  
  for (let i = 0; i < count - 1; i++) {
    const input1 = i === 0 ? `[v0]` : `[vout${i - 1}]`;
    const input2 = `[v${i + 1}]`;
    const output = i === count - 2 ? `[v]` : `[vout${i}]`;
    
    filter += `${input1}${input2}xfade=transition=fade:duration=${duration}:offset=${(i + 1) * 8 - duration}${output};`;
  }
  
  // 오디오 결합
  const audioInputs = Array.from({ length: count }, (_, i) => `[${i}:a]`).join('');
  filter += `${audioInputs}concat=n=${count}:v=0:a=1[a]`;
  
  return filter;
}

// 유틸리티 함수
async function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-y', ...args]);
    
    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg: ${data}`);
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

async function uploadToStorage(filePath: string, destPath: string): Promise<string> {
  const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
  await bucket.upload(filePath, { destination: destPath });
  
  const file = bucket.file(destPath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7일
  });
  
  return url;
}
```

### 7.2 자막 생성 (SRT/WebVTT)
```typescript
// src/lib/reels/subtitle.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SubtitleEntry {
  index: number;
  startTime: number; // 초
  endTime: number;
  text: string;
}

export async function generateSubtitles(
  narration: string,
  audioDuration: number
): Promise<SubtitleEntry[]> {
  const systemPrompt = `당신은 자막 타이밍 전문가입니다.
주어진 내레이션 텍스트를 자연스러운 자막으로 분할하고 타임스탬프를 생성하세요.

규칙:
1. 한 자막당 최대 15자
2. 자막 간격 최소 0.3초
3. 호흡이 자연스럽게 끊어지는 위치에서 분할
4. 전체 길이: ${audioDuration}초

JSON 형식:
{
  "subtitles": [
    { "index": 1, "startTime": 0.0, "endTime": 1.5, "text": "자막 텍스트" },
    ...
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: narration },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
  return result.subtitles || [];
}

export function generateSRT(subtitles: SubtitleEntry[]): string {
  return subtitles.map((sub, i) => {
    const start = formatSRTTime(sub.startTime);
    const end = formatSRTTime(sub.endTime);
    return `${i + 1}\n${start} --> ${end}\n${sub.text}\n`;
  }).join('\n');
}

export function generateWebVTT(subtitles: SubtitleEntry[]): string {
  const entries = subtitles.map((sub) => {
    const start = formatVTTTime(sub.startTime);
    const end = formatVTTTime(sub.endTime);
    return `${start} --> ${end}\n${sub.text}`;
  }).join('\n\n');

  return `WEBVTT\n\n${entries}`;
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

function formatVTTTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`;
}

function pad(num: number, size: number): string {
  return num.toString().padStart(size, '0');
}
```

---

## 8. 클라이언트-서버 데이터 흐름

### 8.1 전체 시퀀스 다이어그램
```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Client  │     │  API    │     │ Firebase │     │ External │
│         │     │ Routes  │     │          │     │   APIs   │
└────┬────┘     └────┬────┘     └────┬─────┘     └────┬─────┘
     │               │               │                │
     │ Step0: 입력   │               │                │
     ├──────────────>│               │                │
     │               │ 프로젝트 생성  │                │
     │               ├──────────────>│                │
     │               │               │                │
     │               │ GPT 교정      │                │
     │               ├───────────────┼───────────────>│
     │               │<──────────────┼────────────────│
     │               │ 저장          │                │
     │               ├──────────────>│                │
     │<──────────────│               │                │
     │               │               │                │
     │ Step1: 리서치  │               │                │
     ├──────────────>│               │                │
     │               │ Perplexity    │                │
     │               ├───────────────┼───────────────>│
     │               │<──────────────┼────────────────│
     │               │ 저장          │                │
     │               ├──────────────>│                │
     │<──────────────│               │                │
     │               │               │                │
     │ Step2: 콘셉트  │               │                │
     ├──────────────>│               │                │
     │               │ GPT           │                │
     │               ├───────────────┼───────────────>│
     │               │<──────────────┼────────────────│
     │<──────────────│               │                │
     │               │               │                │
     │ Step3: 대본   │               │                │
     ├──────────────>│               │                │
     │               │ Grok          │                │
     │               ├───────────────┼───────────────>│
     │               │<──────────────┼────────────────│
     │<──────────────│               │                │
     │               │               │                │
     │ Step4: 영상   │               │                │
     ├──────────────>│               │                │
     │               │ Veo3 (비동기) │                │
     │               ├───────────────┼───────────────>│
     │               │ operationId   │                │
     │<──────────────│<──────────────┼────────────────│
     │               │               │                │
     │ 폴링 (반복)    │               │                │
     ├──────────────>│               │                │
     │               │ 상태 확인     │                │
     │               ├───────────────┼───────────────>│
     │<──────────────│<──────────────┼────────────────│
     │               │               │                │
     │ Step5: TTS    │               │                │
     ├──────────────>│               │                │
     │               │ Pixazo        │                │
     │               ├───────────────┼───────────────>│
     │               │<──────────────┼────────────────│
     │               │ FFmpeg        │                │
     │               ├──────────────>│ (Cloud Run)   │
     │<──────────────│               │                │
     │               │               │                │
     │ Step6: 결합   │               │                │
     ├──────────────>│               │                │
     │               │ FFmpeg Concat │                │
     │               ├──────────────>│ (Cloud Run)   │
     │<──────────────│               │                │
     │               │               │                │
     │ 완료          │               │                │
     │<──────────────│               │                │
     │               │               │                │
```

### 8.2 상태 관리 (Zustand)
```typescript
// src/store/reelsStore.ts

import { create } from 'zustand';
import { ReelsProject, Concept, VideoScript, ResearchResult } from '@/types/reels.types';

interface ReelsState {
  // 프로젝트 상태
  project: ReelsProject | null;
  projectId: string | null;
  currentStep: number;
  isLoading: boolean;
  error: string | null;

  // Step 데이터
  inputPrompt: string;
  refinedPrompt: string;
  uploadedImages: File[];
  researchResults: ResearchResult[];
  selectedInsights: string[];
  concepts: Concept[];
  chosenConcept: Concept | null;
  videoScripts: VideoScript[];
  
  // 비디오 생성 진행 상태
  videoProgress: {
    [videoIndex: number]: {
      status: 'pending' | 'processing' | 'completed' | 'failed';
      progress: number;
      url?: string;
    };
  };

  // 액션
  setProject: (project: ReelsProject) => void;
  setCurrentStep: (step: number) => void;
  setInputPrompt: (prompt: string) => void;
  setRefinedPrompt: (prompt: string) => void;
  addUploadedImage: (file: File) => void;
  removeUploadedImage: (index: number) => void;
  setResearchResults: (results: ResearchResult[]) => void;
  toggleInsight: (id: string) => void;
  setConcepts: (concepts: Concept[]) => void;
  setChosenConcept: (concept: Concept) => void;
  setVideoScripts: (scripts: VideoScript[]) => void;
  updateVideoProgress: (videoIndex: number, update: Partial<ReelsState['videoProgress'][number]>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  project: null,
  projectId: null,
  currentStep: 0,
  isLoading: false,
  error: null,
  inputPrompt: '',
  refinedPrompt: '',
  uploadedImages: [],
  researchResults: [],
  selectedInsights: [],
  concepts: [],
  chosenConcept: null,
  videoScripts: [],
  videoProgress: {},
};

export const useReelsStore = create<ReelsState>((set) => ({
  ...initialState,

  setProject: (project) => set({ project, projectId: project.id }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setInputPrompt: (prompt) => set({ inputPrompt: prompt }),
  setRefinedPrompt: (prompt) => set({ refinedPrompt: prompt }),
  
  addUploadedImage: (file) => set((state) => ({
    uploadedImages: [...state.uploadedImages, file],
  })),
  
  removeUploadedImage: (index) => set((state) => ({
    uploadedImages: state.uploadedImages.filter((_, i) => i !== index),
  })),
  
  setResearchResults: (results) => set({ researchResults: results }),
  
  toggleInsight: (id) => set((state) => {
    const isSelected = state.selectedInsights.includes(id);
    return {
      selectedInsights: isSelected
        ? state.selectedInsights.filter((i) => i !== id)
        : [...state.selectedInsights, id],
      researchResults: state.researchResults.map((r) =>
        r.id === id ? { ...r, selected: !isSelected } : r
      ),
    };
  }),
  
  setConcepts: (concepts) => set({ concepts }),
  setChosenConcept: (concept) => set({ chosenConcept: concept }),
  setVideoScripts: (scripts) => set({ videoScripts: scripts }),
  
  updateVideoProgress: (videoIndex, update) => set((state) => ({
    videoProgress: {
      ...state.videoProgress,
      [videoIndex]: {
        ...state.videoProgress[videoIndex],
        ...update,
      },
    },
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
```

---

## 9. 구현 코드 템플릿

### 9.1 Step0 - 입력 컴포넌트
```typescript
// src/components/reels-factory/steps/Step0Input.tsx

'use client';

import { useState } from 'react';
import { useReelsStore } from '@/store/reelsStore';
import { ImagePlus, Sparkles, ArrowRight } from 'lucide-react';

interface Step0InputProps {
  onNext: () => void;
}

export const Step0Input = ({ onNext }: Step0InputProps) => {
  const {
    inputPrompt,
    setInputPrompt,
    refinedPrompt,
    setRefinedPrompt,
    uploadedImages,
    addUploadedImage,
    removeUploadedImage,
    isLoading,
    setLoading,
    setError,
  } = useReelsStore();

  const [options, setOptions] = useState({
    target: '',
    tone: '',
    purpose: '',
  });

  const handleRefinePrompt = async () => {
    if (!inputPrompt.trim()) {
      setError('프롬프트를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reels/refine-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputPrompt }),
      });

      const data = await response.json();

      if (data.success) {
        setRefinedPrompt(data.data.refinedPrompt);
      } else {
        setError(data.error || '프롬프트 교정에 실패했습니다.');
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          addUploadedImage(file);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 프롬프트 입력 */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          릴스 주제 입력
        </label>
        <textarea
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="어떤 릴스를 만들고 싶으신가요? (예: 카페 창업 노하우, 다이어트 팁, 신제품 소개...)"
          className="w-full h-32 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      {/* 이미지 업로드 */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          참고 이미지 (선택)
        </label>
        <div className="flex flex-wrap gap-3">
          {uploadedImages.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`uploaded-${index}`}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => removeUploadedImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
          
          <label className="w-24 h-24 border-2 border-dashed border-zinc-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <ImagePlus className="w-8 h-8 text-zinc-500" />
          </label>
        </div>
      </div>

      {/* 옵션 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            타겟 고객
          </label>
          <input
            type="text"
            value={options.target}
            onChange={(e) => setOptions({ ...options, target: e.target.value })}
            placeholder="20대 여성"
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            톤앤매너
          </label>
          <input
            type="text"
            value={options.tone}
            onChange={(e) => setOptions({ ...options, tone: e.target.value })}
            placeholder="친근한, 트렌디한"
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            목적
          </label>
          <input
            type="text"
            value={options.purpose}
            onChange={(e) => setOptions({ ...options, purpose: e.target.value })}
            placeholder="브랜드 인지도"
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500"
          />
        </div>
      </div>

      {/* 프롬프트 교정 버튼 */}
      <button
        onClick={handleRefinePrompt}
        disabled={isLoading || !inputPrompt.trim()}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Sparkles className="w-5 h-5" />
        {isLoading ? 'AI가 프롬프트를 다듬는 중...' : 'AI 프롬프트 교정'}
      </button>

      {/* 교정된 프롬프트 */}
      {refinedPrompt && (
        <div className="p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-xl">
          <p className="text-sm text-indigo-400 mb-2">✨ 교정된 프롬프트</p>
          <p className="text-white">{refinedPrompt}</p>
        </div>
      )}

      {/* 다음 버튼 */}
      <button
        onClick={onNext}
        disabled={!refinedPrompt}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        다음 단계로
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
```

### 9.2 API 라우트 템플릿
```typescript
// src/app/api/reels/refine-prompt/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, projectId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: '프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    const systemPrompt = `당신은 릴스 콘텐츠 전문가입니다.
사용자의 프롬프트를 분석하여 더 효과적인 릴스 제작을 위한 프롬프트로 교정해주세요.

교정 원칙:
1. 명확하고 구체적인 표현 사용
2. 타겟 오디언스 고려
3. 트렌디한 표현 추가
4. 감성적 호소력 강화
5. 40초 릴스에 적합한 내용

JSON 형식으로 응답:
{
  "refinedPrompt": "교정된 프롬프트",
  "improvements": ["개선점1", "개선점2", ...]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return NextResponse.json({
      success: true,
      data: {
        refinedPrompt: result.refinedPrompt,
        improvements: result.improvements || [],
      },
    });
  } catch (error: any) {
    console.error('프롬프트 교정 오류:', error);
    return NextResponse.json(
      { success: false, error: '프롬프트 교정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

### 9.3 타입 정의
```typescript
// src/types/reels.types.ts

import { Timestamp } from 'firebase/firestore';

export interface ReelsProject {
  id: string;
  userId: string;
  
  // Step0
  inputPrompt: string;
  refinedPrompt: string;
  uploadedImages: UploadedImage[];
  options: ReelsOptions;
  
  // Step1
  researchResults: ResearchResult[];
  selectedInsights: string[];
  
  // Step2
  concepts: Concept[];
  chosenConcept: Concept | null;
  
  // Step3
  videoScripts: VideoScript[];
  
  // Step4
  videoClips: VideoClip[];
  
  // Step5
  finalClips: FinalClip[];
  
  // Step6
  finalReelUrl: string;
  
  // Meta
  currentStep: number;
  status: ReelsProjectStatus;
  errorMessage?: string;
  pointsUsed: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ReelsProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface ReelsOptions {
  target: string;
  tone: string;
  purpose: string;
}

export interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface ResearchResult {
  id: string;
  category: 'keyword' | 'painpoint' | 'trend' | 'usp' | 'expression' | 'general';
  content: string;
  source?: string;
  selected: boolean;
}

export interface Concept {
  id: string;
  title: string;
  hook: string;
  flow: string;
  cta: string;
  summary: string;
  selected: boolean;
}

export interface VideoScript {
  videoIndex: number;
  duration: number;
  shots: Shot[];
  narration: string;
  approved: boolean;
}

export interface Shot {
  index: number;
  duration: number;
  description: string;
  visualPrompt: string;
  useUploadedImage?: string;
}

export interface VideoClip {
  videoIndex: number;
  url: string;
  thumbnailUrl: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface FinalClip {
  videoIndex: number;
  url: string;
  audioUrl: string;
  subtitleUrl: string;
  duration: number;
}

// API 응답 타입
export interface ReelsApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RefinePromptResponse {
  refinedPrompt: string;
  improvements: string[];
}

export interface ResearchResponse {
  results: ResearchResult[];
}

export interface ConceptResponse {
  concepts: Concept[];
}

export interface ScriptResponse {
  videoScripts: VideoScript[];
}

export interface VideoGenerationResponse {
  operationId: string;
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;
}

export interface MergeResponse {
  finalReelUrl: string;
  duration: number;
}
```

---

## 10. 포인트 비용 계획

| Step | 작업 | 예상 비용 | 포인트 |
|------|------|----------|--------|
| Step0 | GPT 프롬프트 교정 | $0.001 | 5pt |
| Step1 | Perplexity 리서치 | $0.01 | 30pt |
| Step2 | GPT 콘셉트 3개 | $0.003 | 10pt |
| Step3 | Grok 대본 5개 | $0.02 | 50pt |
| Step4 | Veo3 영상 5개 | $0.25 | 500pt |
| Step5 | Pixazo TTS 5개 | $0.05 | 100pt |
| Step6 | FFmpeg 처리 | $0.01 | 20pt |
| **총합** | | **$0.344** | **715pt** |

---

## 11. 환경 변수

```bash
# .env.local

# OpenAI
OPENAI_API_KEY=sk-...

# Perplexity
PERPLEXITY_API_KEY=pplx-...

# xAI (Grok)
XAI_API_KEY=xai-...

# Google (Veo3)
GOOGLE_AI_API_KEY=AIza...

# Pixazo
PIXAZO_API_KEY=px-...

# Firebase
FIREBASE_SERVICE_ACCOUNT_BASE64=...
FIREBASE_STORAGE_BUCKET=...
```

---

## 12. 개발 우선순위

### Phase 1 (MVP)
1. Step0: 입력 + GPT 교정
2. Step1: Perplexity 리서치
3. Step2: GPT 콘셉트
4. Step3: Grok 대본

### Phase 2
5. Step4: Veo3 영상 생성
6. Step5: TTS + 자막

### Phase 3
7. Step6: FFmpeg 결합
8. 히스토리 / 갤러리 저장
9. 공유 기능

---

이 문서는 Reels Factory 기능의 전체 설계를 담고 있습니다.
구현 시 각 섹션을 참고하여 단계별로 개발하세요.


