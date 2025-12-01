# Reels Factory API 테스트 스크립트 사용 가이드

## 개요

`test-reels-api.js`는 Reels Factory의 전체 워크플로우를 테스트하고, 생성된 영상을 로컬에 저장하는 스크립트입니다.

## 기능

- ✅ 실제 API 호출 (Step 0-6 전체)
- ✅ 생성된 영상 자동 다운로드
- ✅ 오디오 및 자막 파일 저장
- ✅ HTML 리포트 자동 생성

## 사용 방법

### 1. 인증 토큰 가져오기

#### 방법 A: 브라우저에서 가져오기
1. 브라우저에서 이미지팩토리에 로그인
2. 개발자 도구 (F12) 열기
3. 콘솔 탭에서 다음 명령 실행:
```javascript
firebase.auth().currentUser.getIdToken().then(console.log)
```
4. 출력된 토큰을 복사

#### 방법 B: 환경 변수로 설정
```bash
export TEST_AUTH_TOKEN="your_token_here"
```

### 2. 스크립트 실행

```bash
# 기본 (localhost:3000)
node test-reels-api.js

# 환경 변수와 함께
TEST_AUTH_TOKEN=your_token node test-reels-api.js

# 프로덕션 서버 사용 시
TEST_BASE_URL=https://your-domain.com TEST_AUTH_TOKEN=your_token node test-reels-api.js
```

### 3. 결과 확인

스크립트 실행 후 `reels-test-output/` 디렉토리에 다음 파일들이 생성됩니다:

```
reels-test-output/
├── index.html          # HTML 리포트 (브라우저에서 열기)
├── video-1.mp4        # 생성된 영상 1
├── video-2.mp4        # 생성된 영상 2
├── video-3.mp4        # 생성된 영상 3
├── video-4.mp4        # 생성된 영상 4
├── video-5.mp4        # 생성된 영상 5
├── audio-1.mp3        # TTS 오디오 1
├── audio-2.mp3        # TTS 오디오 2
├── audio-3.mp3        # TTS 오디오 3
├── audio-4.mp3        # TTS 오디오 4
├── audio-5.mp3        # TTS 오디오 5
├── subtitle-1.srt     # 자막 파일 1
├── subtitle-2.srt     # 자막 파일 2
├── subtitle-3.srt     # 자막 파일 3
├── subtitle-4.srt     # 자막 파일 4
├── subtitle-5.srt     # 자막 파일 5
└── final-reel.mp4     # 최종 릴스 (40초)
```

### 4. HTML 리포트 보기

```bash
# macOS
open reels-test-output/index.html

# Linux
xdg-open reels-test-output/index.html

# Windows
start reels-test-output/index.html
```

또는 브라우저에서 직접 `file://` URL로 열기:
```
file:///Users/songminju/imagesfactory/reels-test-output/index.html
```

## 테스트 단계

스크립트는 다음 6단계를 순차적으로 실행합니다:

1. **Step 0**: 프로젝트 생성 및 프롬프트 교정 (GPT-5.1)
2. **Step 1**: Perplexity 리서치 (sonar-pro)
3. **Step 2**: GPT 콘셉트 기획 (GPT-5.1)
4. **Step 3**: Grok 대본 작성 (Grok-2-vision-1212)
5. **Step 4**: Veo3 영상 생성 (5개, 각 8초)
6. **Step 5**: Pixazo TTS + 자막 생성
7. **Step 6**: FFmpeg 영상 결합

## 예상 소요 시간

- Step 0-3: 약 1-2분
- Step 4: 약 10-25분 (각 영상당 2-5분)
- Step 5: 약 1-2분
- Step 6: 약 1-2분

**총 예상 시간: 약 15-30분**

## 포인트 소모

각 단계별 포인트:
- Step 0: 10pt
- Step 1: 50pt
- Step 2: 30pt
- Step 3: 100pt
- Step 4: 500pt (100pt × 5개 영상)
- Step 5: 100pt (20pt × 5개 영상)
- Step 6: 50pt

**총 소모 포인트: 약 840pt**

## 문제 해결

### 인증 토큰 오류
```
❌ AUTH_TOKEN이 필요합니다.
```
→ 위의 "인증 토큰 가져오기" 섹션 참조

### API 연결 오류
```
API 호출 오류: connect ECONNREFUSED
```
→ 개발 서버가 실행 중인지 확인:
```bash
pnpm dev
```

### 영상 다운로드 실패
→ 영상 URL이 유효한지 확인. Firebase Storage 권한 설정 확인 필요.

### 포인트 부족
→ 계정에 충분한 포인트가 있는지 확인. 포인트 충전 후 다시 시도.

## 주의사항

- ⚠️ 실제 포인트가 차감됩니다
- ⚠️ Veo3 영상 생성은 시간이 오래 걸립니다 (각 영상당 2-5분)
- ⚠️ 네트워크 연결이 안정적인지 확인하세요
- ⚠️ 중간에 중단되면 이미 사용된 포인트는 환불되지 않습니다 (일부 단계 제외)

## 커스터마이징

스크립트 상단의 변수를 수정하여 테스트 내용을 변경할 수 있습니다:

```javascript
const TEST_PROMPT = '이미지팩토리를 홍보하는 릴스를 만들어보자';
const TEST_OPTIONS = {
  target: '20-40대 크리에이터, 마케터, 디자이너',
  tone: '친근하고 트렌디하며 전문적',
  purpose: '서비스 홍보 및 사용자 유치',
};
```

