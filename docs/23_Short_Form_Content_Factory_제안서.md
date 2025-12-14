# Short-form/Reels Content Factory 제안서

## 📋 개요

AI 기반 숏폼 콘텐츠(릴스/쇼츠) 자동 생성 시스템입니다.
사용자 입력 → 프롬프트 교정 → 스크립트/씬 생성 → 비디오 생성 → TTS → 자막 → 최종 합성의 7단계 파이프라인으로 구성됩니다.

---

## 🔥 핵심 원칙

### 1. 사용자 확인 필수
- **모든 단계에서 사용자 확인/수정 필요**
- 자동 다음 단계 진행 금지
- 각 단계 독립적 실행

### 2. AI 모델 분리
- **텍스트 처리**: LangChain 또는 직접 API
- **비디오 생성**: 직접 HTTP 클라이언트 (LangChain 사용 안 함)
- **TTS/합성**: 직접 API 호출

---

## 📊 7단계 사용자 플로우

### STEP 1: 사용자 입력
- 원본 프롬프트 입력
- 참조 이미지 업로드 (선택)
- **데이터만 저장, 처리 없음**

### STEP 2: 프롬프트 교정 (GPT-5-mini)
- GPT-5-mini로 프롬프트 정제/최적화 (빠른 응답)
- 사용자가 교정된 프롬프트 확인/수정
- **확인 후 다음 단계 진행**

### STEP 3: 스크립트 + 씬 생성 (GPT-5.2)
- 전체 스크립트 작성 (모든 내레이션 연결)
- 3-7개 씬 생성 (각 8초)
- 각 씬: 비주얼 프롬프트(영어) + 내레이션(한국어/영어)
- **사용자가 씬별로 수정/확인**

### STEP 4: 비디오 생성 (Gemini Veo3)
- 각 씬별 8초 비디오 클립 생성
- **병렬 처리** (동시에 여러 씬 생성)
- 재시도 로직 (최대 3회)
- **사용자가 각 클립 확인/재생성**

### STEP 5: TTS 생성 (OpenAI TTS)
- 각 씬 내레이션 → 음성 변환
- 음성 선택 가능 (alloy, echo, fable, onyx, nova, shimmer)
- **병렬 처리**
- **사용자가 음성 확인/재생성**

### STEP 6: 자막 생성 + 타이밍 (GPT-5-mini)
- TTS 오디오 길이 기반 자막 타이밍
- GPT-5-mini로 문장 분할 최적화 (빠른 응답)
- SRT/ASS 형식 지원
- **사용자가 자막 텍스트/타이밍 수정**

### STEP 7: 최종 합성 (FFmpeg)
- 비디오 + TTS + 자막 합성
- 모든 클립 연결
- Firebase Storage 업로드
- **최종 영상 다운로드**

---

## 🛠 기술 스택

### AI 모델 사용

| 단계 | 모델 | 용도 | 비고 |
|------|------|------|------|
| 프롬프트 교정 | **GPT-5-mini** | 텍스트 정제 | 빠른 응답 |
| 스크립트/씬 | **GPT-5.2** | 한국어 품질 최고 | 직접 API |
| 비디오 생성 | Gemini Veo3 | 8초 클립 생성 | 직접 HTTP |
| TTS | OpenAI TTS | 음성 합성 | 직접 API |
| 자막 타이밍 | **GPT-5-mini** | 문장 분할 | 빠른 응답 |
| 최종 합성 | FFmpeg | 영상 합성 | 로컬 실행 |

### 기술 스택
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Video Processing**: FFmpeg

---

## 📁 프로젝트 구조

```
src/
├── app/
│   └── api/
│       ├── project/
│       │   └── create/route.ts          # 프로젝트 생성
│       ├── input/
│       │   └── submit/route.ts          # Step 1: 입력 저장
│       ├── prompt/
│       │   ├── correct/route.ts         # Step 2: GPT 프롬프트 교정
│       │   └── confirm/route.ts         # Step 2: 교정 확인
│       ├── script/
│       │   ├── generate/route.ts        # Step 3: GPT-5.2 스크립트/씬
│       │   └── confirm/route.ts         # Step 3: 씬 확인
│       ├── video/
│       │   ├── generate/route.ts        # Step 4: Veo3 비디오 생성
│       │   ├── select/route.ts          # Step 4: 클립 선택
│       │   └── final-compose/route.ts   # Step 7: 최종 합성
│       ├── tts/
│       │   ├── generate/route.ts        # Step 5: TTS 생성
│       │   └── confirm/route.ts         # Step 5: TTS 확인
│       └── subtitle/
│           ├── generate/route.ts        # Step 6: 자막 생성
│           └── confirm/route.ts         # Step 6: 자막 확인
│
├── lib/
│   └── project/
│       ├── gpt-prompt-corrector.ts      # GPT 프롬프트 교정
│       ├── gpt-script-scene-generator.ts # GPT-5.2 스크립트/씬 생성
│       ├── veo-video-generator.ts       # Veo3 비디오 생성
│       ├── tts-generator.ts             # OpenAI TTS
│       ├── subtitle-engine.ts           # 자막 생성 엔진
│       ├── final-video-composer.ts      # FFmpeg 최종 합성
│       └── project-state-manager.ts     # 상태 관리
│
└── types/
    └── project.types.ts                 # 타입 정의
```

---

## 📊 데이터 모델

### AIContentProject (Firestore)
```typescript
interface AIContentProject {
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
  
  // Step 4: 비디오
  videoClips: VideoClip[];
  selectedVideoClips: string[];
  
  // Step 5: TTS
  ttsAudios: TTSAudio[];
  
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Scene {
  id: string;
  index: number;
  prompt: string;         // 영어 비주얼 프롬프트 (텍스트 없음)
  narration: string;      // 한국어/영어 내레이션
  duration: number;       // 8초
  approved: boolean;
}

interface VideoClip {
  sceneId: string;
  videoUrl?: string;
  operationId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface TTSAudio {
  sceneId: string;
  audioUrl?: string;
  duration?: number;
  voice: string;
}

interface Subtitle {
  sceneId: string;
  entries: SubtitleEntry[];
  srtContent?: string;
  assContent?: string;
}

interface SubtitleEntry {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}
```

---

## 🎬 비디오 프롬프트 규칙

### 절대 금지 사항
1. **한국어 텍스트 포함 금지** (Hangul, Korean 단어)
2. **텍스트 오버레이 금지** (text, label, caption, subtitle)
3. **"Korean" 단어 사용 금지**

### 권장 사항
- 순수 시각적 묘사만 사용
- 카메라 앵글, 조명, 분위기 포함
- 구체적인 장면 설명
- 영어로만 작성

### 예시
```
❌ BAD: "Korean text overlay showing product name"
❌ BAD: "Text in Korean language appears on screen"
✅ GOOD: "Sleek product shot on white background, soft lighting, slow camera pan"
✅ GOOD: "Modern office space with natural light, person using laptop, cinematic angle"
```

---

## 🎵 TTS 규칙

### 내레이션 길이
- 최소 40-50자 (8초 영상 기준)
- 한국어: 초당 3-4음절
- 영어: 초당 2-3단어

### 음성 옵션 (OpenAI TTS)
| 음성 | 특징 |
|------|------|
| alloy | 중성적, 균형잡힌 |
| echo | 남성적, 깊은 |
| fable | 영국식 억양 |
| onyx | 남성적, 권위있는 |
| nova | 여성적, 부드러운 |
| shimmer | 여성적, 따뜻한 |

---

## 📝 자막 시스템

### 자막 타이밍 전략
1. TTS 오디오 길이 기반
2. GPT로 문장 자연스럽게 분할
3. 각 문장 2-4초 길이
4. 한국어: 초당 3-4음절 기준

### 지원 형식
- **SRT**: 기본 형식
- **ASS**: 스타일 포함 (폰트, 색상, 위치)

### ASS 스타일 기본값
```ass
Style: Default,AppleSDGothicNeo-Bold,48,&H00FFFFFF,&H000000FF,&H00000000,&HFF000000,-1,0,0,0,100,100,0,0,1,3,0,2,20,20,40,1
```

### 폰트 우선순위
1. AppleSDGothicNeo (macOS)
2. Noto Sans CJK KR (Linux/Windows)
3. NanumGothic (폴백)

---

## 🔄 병렬 처리

### 비디오 생성 (Step 4)
```javascript
// 모든 씬 동시 요청
const videoPromises = scenes.map(scene => 
  generateAndWaitForVideo(scene, projectId, token)
);
const results = await Promise.allSettled(videoPromises);
```

### TTS 생성 (Step 5)
```javascript
// 모든 씬 동시 TTS 생성
const ttsPromises = scenes.map(scene =>
  generateTTS(scene.narration, voice, language)
);
const results = await Promise.allSettled(ttsPromises);
```

---

## 🔁 재시도 로직

### Veo API 재시도
```javascript
const maxRetries = 3;
const retryDelays = [30000, 60000, 90000]; // 30초, 60초, 90초

for (let retry = 0; retry <= maxRetries; retry++) {
  try {
    const result = await generateVideo(prompt);
    if (result.success) return result;
  } catch (error) {
    if (retry < maxRetries && isRetryableError(error)) {
      await delay(retryDelays[retry]);
      continue;
    }
    throw error;
  }
}
```

### 재시도 대상 에러
- `429 Too Many Requests`
- `503 Service Unavailable`
- `fetch failed`
- `timeout`

---

## 💰 포인트 비용

| 항목 | 포인트 |
|------|--------|
| 프롬프트 교정 | 5 |
| 스크립트 생성 | 10 |
| 비디오 생성 (개당) | 50 |
| TTS 생성 (개당) | 10 |
| 최종 합성 | 20 |
| **총 (5개 씬 기준)** | **335** |

---

## 📋 API 엔드포인트

### 프로젝트 관리
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/project/create` | 프로젝트 생성 |
| GET | `/api/project/[id]` | 프로젝트 조회 |

### Step 1: 입력
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/input/submit` | 원본 프롬프트 저장 |

### Step 2: 프롬프트 교정
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/prompt/correct` | GPT 프롬프트 교정 |
| POST | `/api/prompt/confirm` | 교정 확인 |

### Step 3: 스크립트/씬
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/script/generate` | GPT-5.2 스크립트/씬 생성 |
| POST | `/api/script/confirm` | 씬 확인 |

### Step 4: 비디오
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/video/generate` | Veo3 비디오 생성 |
| POST | `/api/video/select` | 클립 선택 |

### Step 5: TTS
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/tts/generate` | TTS 생성 |
| POST | `/api/tts/confirm` | TTS 확인 |

### Step 6: 자막
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/subtitle/generate` | 자막 생성 |
| POST | `/api/subtitle/confirm` | 자막 확인 |

### Step 7: 최종 합성
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/video/final-compose` | FFmpeg 최종 합성 |

---

## ✅ 구현 체크리스트

### 완료
- [x] GPT-5.2 스크립트 생성기 (`gpt-script-scene-generator.ts`)
- [x] 최종 비디오 합성기 (`final-video-composer.ts`)
- [x] 비디오 프롬프트에서 한국어 제거
- [x] 병렬 처리 (비디오, TTS)
- [x] 재시도 로직

### 진행 중
- [ ] 자막 엔진 개선 (TTS 길이 기반)
- [ ] ASS 형식 지원
- [ ] API 라우트 완성

### 예정
- [ ] 프론트엔드 UI 연동
- [ ] 실시간 진행률 표시
- [ ] 에러 처리 개선

---

## 📌 주의사항

1. **배포 전 사용자 승인 필수**
2. **API 키 절대 커밋 금지**
3. **Veo API 할당량 주의** (일일 제한)
4. **FFmpeg 설치 필요** (서버 환경)
5. **한국어 폰트 설치 필요** (자막용)

---

## 🔗 관련 문서

- [06_Reels_Factory_기술_명세서.md](./06_Reels_Factory_기술_명세서.md)
- [05_개발_가이드.md](./05_개발_가이드.md)
- [03_기술_명세서.md](./03_기술_명세서.md)

