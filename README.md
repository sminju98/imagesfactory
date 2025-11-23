# imagesfactory

> 수십 장의 AI 이미지를 한 번에 - imagesfactory

AI 프롬프트 기반 대량 이미지 생성 및 이메일 전송 서비스

## 📋 프로젝트 개요

imagesfactory는 사용자가 한 번의 프롬프트 입력으로 수십 장의 AI 이미지를 생성하고, 완성된 이미지를 이메일로 받을 수 있는 웹 서비스입니다.

### 주요 기능

- 🎨 **대량 이미지 생성**: 한 번에 최대 50장의 이미지 생성
- 🤖 **AI 기반**: DALL-E 3, Stable Diffusion 등 최신 AI 모델 활용
- 📧 **자동 이메일 전송**: 생성 완료 시 ZIP 파일로 전송
- 💰 **포인트 시스템**: 이미지 1장당 100 포인트
- 🔐 **다양한 인증**: 이메일/비밀번호, 구글 소셜 로그인
- 📊 **히스토리 관리**: 생성한 이미지 관리 및 다운로드

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod

### Backend & Database
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Hosting**: Vercel / Firebase Hosting

### 외부 API
- **AI**: OpenAI DALL-E 3, Stability AI
- **Email**: SendGrid
- **Payment**: 토스페이먼츠
- **Translation**: Google Cloud Translation API

## 📁 프로젝트 구조

```
imagesfactory/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/            # React 컴포넌트
│   ├── lib/                   # 유틸리티 & Firebase 설정
│   ├── services/              # 비즈니스 로직
│   ├── hooks/                 # Custom Hooks
│   ├── types/                 # TypeScript 타입
│   └── store/                 # Zustand Store
├── functions/                 # Firebase Cloud Functions
├── docs/                      # 📚 기획/개발 문서
│   ├── 01_BRD_비즈니스_요구사항_정의서.md
│   ├── 02_PRD_제품_요구사항_정의서.md
│   ├── 03_기술_명세서.md
│   ├── 04_Firebase_설정_가이드.md
│   ├── 05_개발_가이드.md
│   ├── 06_마케팅_전략.md
│   └── 07_운영_가이드.md
├── .cursorrules              # Cursor AI 개발 규칙
├── firestore.rules           # Firestore 보안 규칙
├── storage.rules             # Storage 보안 규칙
└── firebase.json             # Firebase 설정
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 20 LTS
- pnpm 8+
- Firebase CLI
- Git

### 설치

```bash
# 저장소 클론
git clone https://github.com/sminju98/imagesfactory.git
cd imagesfactory

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 필요한 API 키를 입력하세요

# Firebase 로그인
firebase login

# Firebase 에뮬레이터 시작 (별도 터미널)
firebase emulators:start

# 개발 서버 시작
pnpm dev
```

서버가 시작되면 http://localhost:3000 에서 확인할 수 있습니다.

### 환경 변수

`.env.local` 파일에 다음 환경 변수가 필요합니다:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-admin@iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 에뮬레이터 (로컬 개발)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

# AI API
OPENAI_API_KEY=sk-...
STABILITY_API_KEY=sk-...

# SendGrid
SENDGRID_API_KEY=SG.....
SENDGRID_FROM_EMAIL=noreply@imagesfactory.com

# Toss Payments
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# Google Translate
GOOGLE_TRANSLATE_API_KEY=your-key
```

## 📚 문서

모든 상세 문서는 `docs/` 디렉토리에서 확인할 수 있습니다:

- **[BRD](docs/01_BRD_비즈니스_요구사항_정의서.md)**: 비즈니스 요구사항 및 시장 분석
- **[PRD](docs/02_PRD_제품_요구사항_정의서.md)**: 제품 기능 및 사용자 스토리
- **[기술 명세서](docs/03_기술_명세서.md)**: 아키텍처 및 기술 스택
- **[Firebase 설정 가이드](docs/04_Firebase_설정_가이드.md)**: Firebase 프로젝트 설정
- **[개발 가이드](docs/05_개발_가이드.md)**: 개발 진행 방법
- **[마케팅 전략](docs/06_마케팅_전략.md)**: 마케팅 및 출시 전략
- **[운영 가이드](docs/07_운영_가이드.md)**: 서비스 운영 방법

## 🎯 개발 규칙

본 프로젝트는 `.cursorrules` 파일에 정의된 규칙을 따릅니다:

### 필수 규칙
- ✅ **모든 응답은 한국어로**
- ✅ **코딩 전 기획 문서 참고 필수**
- ✅ **의미 있는 변경사항은 Git 커밋 필수**
- ⛔ **절대 사용자 허락 없이 배포 금지**

### 코딩 컨벤션
- TypeScript 타입 정의 필수
- 함수형 컴포넌트 (Arrow Function)
- camelCase / PascalCase 네이밍
- 에러 처리 (try-catch) 필수

자세한 내용은 [.cursorrules](.cursorrules) 파일을 참조하세요.

## 🤝 기여

이 프로젝트는 비공개 프로젝트입니다. 기여하려면 프로젝트 관리자에게 문의하세요.

## 📄 라이선스

이 프로젝트는 비공개 소프트웨어입니다. 모든 권리는 imagesfactory에 있습니다.

## 📞 문의

- **웹사이트**: [imagesfactory.com](https://imagesfactory.com) (준비 중)
- **이메일**: support@imagesfactory.com
- **GitHub**: [@sminju98](https://github.com/sminju98)

---

**Made with ❤️ by imagesfactory Team**

