# Gemini TTS Vertex AI 설정 가이드

## 현재 상황

Gemini TTS는 Vertex AI를 통해 사용할 수 있지만, **서비스 계정 인증이 필요**합니다.

## 설정 방법

### 1. Google Cloud Console 설정

1. **프로젝트 선택**
   - 프로젝트 ID: `imagefactory-5ccc6`

2. **Vertex AI API 활성화**
   - https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
   - "사용" 버튼 클릭

3. **Text-to-Speech API 활성화**
   - https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
   - "사용" 버튼 클릭

4. **서비스 계정 생성**
   - https://console.cloud.google.com/iam-admin/serviceaccounts
   - "서비스 계정 만들기" 클릭
   - 이름: `gemini-tts-service`
   - 역할: 
     - `Vertex AI User`
     - `Cloud Text-to-Speech API 사용자`

5. **서비스 계정 키 다운로드**
   - 생성된 서비스 계정 클릭
   - "키" 탭 → "키 추가" → "새 키 만들기"
   - JSON 형식 선택
   - 다운로드된 JSON 파일을 프로젝트 루트에 저장 (예: `google-service-account.json`)

### 2. 환경 변수 설정

`.env.local` 파일에 추가:

```bash
# 서비스 계정 JSON 파일 경로
GOOGLE_APPLICATION_CREDENTIALS=./google-service-account.json

# 또는 서비스 계정 JSON을 Base64로 인코딩하여 환경 변수로 설정
# FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoi...

# 프로젝트 정보
GOOGLE_CLOUD_PROJECT_ID=imagefactory-5ccc6
GOOGLE_CLOUD_LOCATION=us-central1
```

### 3. 코드 수정

`@google-cloud/text-to-speech` 패키지를 사용하여 서비스 계정 인증으로 Gemini TTS를 사용할 수 있습니다.

## 참고

- Vertex AI는 API 키가 아닌 **서비스 계정 인증**을 사용합니다
- 제공된 키(`AQ.Ab8RN6L3NRDmxQpk4-ccsCNmP3-6wbeeDBAsPC-KfaPFL_G1Uw`)는 OAuth2 토큰 형식이지만, Vertex AI Text-to-Speech API에는 사용할 수 없습니다
- 서비스 계정 JSON 파일을 사용해야 합니다

## 다음 단계

1. Google Cloud Console에서 서비스 계정 생성
2. 서비스 계정 JSON 파일 다운로드
3. 환경 변수 설정
4. 코드 수정하여 서비스 계정 인증 사용


