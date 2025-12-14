# Gemini TTS 사용 가이드

## 현재 상황

Gemini TTS는 Google AI Studio를 통해 웹 인터페이스로 사용할 수 있지만, **API를 통한 직접 사용은 제한적**입니다.

## 사용 가능한 방법

### 방법 1: Google Cloud Text-to-Speech API (Gemini TTS 엔진)

Gemini TTS는 Google Cloud Text-to-Speech API의 일부로 제공됩니다.

#### 설정 방법

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
   - 다운로드된 JSON 파일을 프로젝트 루트에 저장

6. **환경 변수 설정**
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json
   ```

7. **코드 수정**
   - `@google-cloud/text-to-speech` 패키지 설치
   - 서비스 계정 인증 사용

### 방법 2: Google AI Studio 웹 인터페이스 사용

Gemini TTS는 현재 Google AI Studio의 웹 인터페이스를 통해서만 직접 사용할 수 있습니다.

- https://aistudio.google.com/generate-speech

이 방법은 API를 통한 자동화가 불가능합니다.

### 방법 3: Google Cloud TTS API (Neural2 엔진)

Gemini TTS 대신 Google Cloud TTS의 Neural2 엔진을 사용할 수 있습니다. 이는 Gemini TTS와 유사한 품질을 제공합니다.

#### 사용 가능한 한국어 음성

- `ko-KR-Neural2-A`: 한국어 여성 음성 (Neural2, 최신, 기본값)
- `ko-KR-Neural2-B`: 한국어 남성 음성 (Neural2, 최신)
- `ko-KR-Neural2-C`: 한국어 여성 음성 2 (Neural2, 최신)
- `ko-KR-Wavenet-A`: 한국어 여성 음성 (Wavenet, 고품질)
- `ko-KR-Wavenet-B`: 한국어 남성 음성 (Wavenet, 고품질)

## 현재 코드 구조

### TTS 유틸리티
- `src/lib/reels/google-tts.ts` - Google Cloud TTS 사용
- `src/lib/reels/gemini-tts.ts` - Gemini TTS 시도 (현재 작동하지 않음)

### API 라우트
- `src/app/api/reels/tts/route.ts` - TTS 생성 API

## 권장 사항

**현재 상황에서는 Google Cloud TTS API의 Neural2 엔진을 사용하는 것을 권장합니다.**

이유:
1. Gemini TTS는 API를 통한 직접 사용이 제한적
2. Neural2 엔진은 Gemini TTS와 유사한 품질 제공
3. 서비스 계정을 통해 안정적으로 사용 가능
4. 한국어 완벽 지원

## 다음 단계

1. Google Cloud 서비스 계정 생성 및 설정
2. `@google-cloud/text-to-speech` 패키지 설치
3. 코드 수정하여 서비스 계정 인증 사용
4. Neural2 엔진으로 TTS 생성

## 참고 자료

- [Google Cloud Text-to-Speech 문서](https://cloud.google.com/text-to-speech/docs)
- [Gemini TTS 문서](https://cloud.google.com/text-to-speech/docs/gemini-tts)
- [Google AI Studio](https://aistudio.google.com/generate-speech)


