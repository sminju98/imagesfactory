# Step5: TTS + 자막 생성 설정 가이드

## 현재 상태

✅ **구현 완료:**
- TTS API 라우트: `/api/reels/tts`
- 자막 생성: GPT-5.1 사용
- 포인트 차감/환불 로직
- Firebase Storage 업로드 준비

❌ **문제점:**
- Google Cloud TTS는 API 키가 아닌 **서비스 계정** 필요
- 제공된 키는 작동하지 않음

## 해결 방법

### 방법 1: Google Cloud 서비스 계정 사용 (권장)

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **프로젝트 선택 또는 생성**
   - Veo3와 동일한 프로젝트 사용 권장

3. **Text-to-Speech API 활성화**
   - https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
   - "사용" 버튼 클릭

4. **서비스 계정 생성**
   - https://console.cloud.google.com/iam-admin/serviceaccounts
   - "서비스 계정 만들기" 클릭
   - 이름: `tts-service-account`
   - 역할: `Cloud Text-to-Speech API 사용자`

5. **서비스 계정 키 다운로드**
   - 생성된 서비스 계정 클릭
   - "키" 탭 → "키 추가" → "새 키 만들기"
   - JSON 형식 선택
   - 다운로드된 JSON 파일을 프로젝트 루트에 저장 (예: `google-service-account.json`)

6. **환경 변수 설정**
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
   ```

7. **코드 수정**
   - `@google-cloud/text-to-speech` 패키지 사용
   - 서비스 계정 인증 사용

### 방법 2: 다른 TTS 서비스 사용

#### 옵션 A: Azure Cognitive Services TTS
- 고품질 한국어 음성 지원
- API 키 기반 인증
- 무료 티어 제공

#### 옵션 B: AWS Polly
- 고품질 한국어 음성 지원
- API 키 기반 인증
- 무료 티어 제공

#### 옵션 C: Naver Clova TTS
- 한국어 특화
- API 키 기반 인증
- 무료 티어 제공

## 현재 코드 구조

### API 라우트
- `src/app/api/reels/tts/route.ts`
  - TTS 생성 요청 처리
  - 자막 생성 (GPT-5.1)
  - 포인트 차감/환불

### TTS 유틸리티
- `src/lib/reels/google-tts.ts`
  - Google Cloud TTS 호출
  - OAuth2 토큰 또는 API 키 사용 시도

### 자막 유틸리티
- `src/lib/reels/subtitle.ts`
  - GPT-5.1로 자막 타임스탬프 생성
  - SRT/WebVTT 형식 변환

## 테스트 방법

```bash
# TTS 테스트
node test-google-tts-oauth.js

# 전체 Step5 테스트
node test-reels-api.js
```

## 다음 단계

1. Google Cloud 서비스 계정 생성 및 설정
2. 또는 다른 TTS 서비스로 전환
3. 테스트 및 검증


