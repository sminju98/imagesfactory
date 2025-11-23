# Firebase 설정 가이드
# imagesfactory

**문서 버전**: 1.0  
**작성일**: 2025-11-23  
**대상 독자**: 개발팀

---

## 📋 개요

본 문서는 imagesfactory 프로젝트의 Firebase 설정 및 사용 방법을 안내합니다.

---

## 🔥 Firebase 프로젝트 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `imagesfactory`
4. Google Analytics 설정 (선택)
5. 프로젝트 생성 완료

### 2. 웹 앱 추가

1. 프로젝트 설정 > 일반
2. "앱 추가" > 웹 (</>) 선택
3. 앱 닉네임: `imagesfactory-web`
4. Firebase Hosting 설정 (선택)
5. SDK 설정 코드 복사 (나중에 사용)

---

## 🗄 Firestore Database 설정

### 1. Firestore 활성화

1. 빌드 > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 위치: `asia-northeast3` (서울)
4. 보안 규칙: 프로덕션 모드에서 시작
5. 완료

### 2. 컬렉션 생성

초기 컬렉션 수동 생성 (문서 1개씩):

#### users
```
컬렉션 ID: users
문서 ID: (자동)
필드:
- email (string): "test@example.com"
- displayName (string): "테스트 사용자"
- points (number): 1000
- createdAt (timestamp): 현재 시간
```

#### imageGenerations
```
컬렉션 ID: imageGenerations
문서 ID: (자동)
필드:
- userId (string): ""
- prompt (string): ""
- status (string): "pending"
- createdAt (timestamp): 현재 시간
```

#### pointTransactions
```
컬렉션 ID: pointTransactions
문서 ID: (자동)
필드:
- userId (string): ""
- amount (number): 0
- type (string): "bonus"
- createdAt (timestamp): 현재 시간
```

#### payments
```
컬렉션 ID: payments
문서 ID: (자동)
필드:
- userId (string): ""
- amount (number): 0
- status (string): "pending"
- createdAt (timestamp): 현재 시간
```

### 3. 인덱스 생성

Firestore > 인덱스 > 복합 인덱스 생성:

#### imageGenerations 인덱스
```
컬렉션: imageGenerations
필드:
- userId (오름차순)
- createdAt (내림차순)
쿼리 범위: 컬렉션
```

#### pointTransactions 인덱스
```
컬렉션: pointTransactions
필드:
- userId (오름차순)
- createdAt (내림차순)
쿼리 범위: 컬렉션
```

#### payments 인덱스
```
컬렉션: payments
필드:
- userId (오름차순)
- createdAt (내림차순)
쿼리 범위: 컬렉션
```

---

## 🔒 Firestore 보안 규칙

### firestore.rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // 헬퍼 함수
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isValidEmail() {
      return request.auth.token.email_verified == true;
    }
    
    // users 컬렉션
    match /users/{userId} {
      // 자신의 문서만 읽기 가능
      allow read: if isSignedIn() && isOwner(userId);
      
      // 회원가입 시 생성 가능
      allow create: if isSignedIn() && isOwner(userId);
      
      // 자신의 문서만 수정 가능 (단, 포인트는 서버에서만 수정)
      allow update: if isSignedIn() && isOwner(userId) 
        && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['points']));
      
      // 자신의 계정만 삭제 가능
      allow delete: if isSignedIn() && isOwner(userId);
    }
    
    // imageGenerations 컬렉션
    match /imageGenerations/{generationId} {
      // 자신의 생성 작업만 읽기
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      
      // 생성 작업 생성 가능
      allow create: if isSignedIn() 
        && isOwner(request.resource.data.userId)
        && request.resource.data.status == 'pending';
      
      // 상태 업데이트는 서버에서만 (Cloud Functions)
      allow update: if false;
      
      // 자신의 생성 작업만 삭제
      allow delete: if isSignedIn() && isOwner(resource.data.userId);
      
      // images 서브컬렉션
      match /images/{imageId} {
        // 부모 생성 작업의 소유자만 읽기
        allow read: if isSignedIn() 
          && isOwner(get(/databases/$(database)/documents/imageGenerations/$(generationId)).data.userId);
        
        // 서버에서만 생성/수정/삭제
        allow write: if false;
      }
    }
    
    // pointTransactions 컬렉션
    match /pointTransactions/{transactionId} {
      // 자신의 거래 내역만 읽기
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      
      // 서버에서만 생성 (포인트 시스템 무결성)
      allow create, update, delete: if false;
    }
    
    // payments 컬렉션
    match /payments/{paymentId} {
      // 자신의 결제 내역만 읽기
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      
      // 결제 생성 가능
      allow create: if isSignedIn() 
        && isOwner(request.resource.data.userId)
        && request.resource.data.status == 'pending';
      
      // 서버에서만 업데이트
      allow update, delete: if false;
    }
    
    // 관리자 전용 컬렉션 (향후 추가)
    match /admin/{document=**} {
      allow read, write: if false; // 서버에서만 접근
    }
  }
}
```

### 보안 규칙 배포

```bash
firebase deploy --only firestore:rules
```

---

## 🔐 Authentication 설정

### 1. Authentication 활성화

1. 빌드 > Authentication
2. "시작하기" 클릭
3. 로그인 방법 탭

### 2. 이메일/비밀번호 로그인 설정

1. "이메일/비밀번호" 클릭
2. "사용 설정" 토글 ON
3. "이메일 링크" (비밀번호 없는 로그인) OFF (선택)
4. 저장

### 3. Google 로그인 설정

1. "Google" 클릭
2. "사용 설정" 토글 ON
3. 프로젝트 공개용 이름: `imagesfactory`
4. 프로젝트 지원 이메일: 본인 이메일
5. 저장

### 4. 이메일 템플릿 설정

Authentication > Templates:

#### 이메일 주소 확인
```
제목: imagesfactory 이메일 인증

안녕하세요,

imagesfactory에 가입해 주셔서 감사합니다!

아래 링크를 클릭하여 이메일 주소를 인증해주세요:

%LINK%

링크는 1시간 동안 유효합니다.

감사합니다.
imagesfactory 팀
```

#### 비밀번호 재설정
```
제목: imagesfactory 비밀번호 재설정

안녕하세요,

비밀번호 재설정 요청을 받았습니다.

아래 링크를 클릭하여 새 비밀번호를 설정해주세요:

%LINK%

링크는 1시간 동안 유효합니다.

요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.

감사합니다.
imagesfactory 팀
```

### 5. 승인된 도메인 추가

Authentication > Settings > 승인된 도메인:

- `localhost` (기본 포함)
- `imagesfactory.com` (프로덕션)
- `imagesfactory.web.app` (Firebase Hosting)
- `your-app.vercel.app` (Vercel 배포 시)

---

## 📦 Storage 설정

### 1. Storage 활성화

1. 빌드 > Storage
2. "시작하기" 클릭
3. 보안 규칙: 프로덕션 모드
4. 위치: `asia-northeast3` (서울)
5. 완료

### 2. 폴더 구조

```
imagesfactory-bucket/
├── users/
│   └── {userId}/
│       └── profile.jpg          # 프로필 이미지
├── generations/
│   └── {generationId}/
│       ├── 0.png                # 원본 이미지
│       ├── 0_thumb.png          # 썸네일
│       ├── 1.png
│       ├── 1_thumb.png
│       └── ...
└── zips/
    └── {generationId}.zip       # ZIP 파일
```

### 3. Storage 보안 규칙

#### storage.rules

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // 헬퍼 함수
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // 이미지 파일 검증
    function isImageFile() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // 파일 크기 제한 (10MB)
    function isUnderSizeLimit() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // 프로필 이미지
    match /users/{userId}/profile.jpg {
      allow read: if isSignedIn();
      allow write: if isSignedIn() 
        && isOwner(userId) 
        && isImageFile() 
        && isUnderSizeLimit();
    }
    
    // 생성된 이미지 (읽기 전용)
    match /generations/{generationId}/{imageFile} {
      allow read: if isSignedIn();
      allow write: if false; // 서버에서만 업로드
    }
    
    // ZIP 파일
    match /zips/{zipFile} {
      allow read: if isSignedIn();
      allow write: if false; // 서버에서만 생성
    }
  }
}
```

### 보안 규칙 배포

```bash
firebase deploy --only storage:rules
```

---

## ☁️ Cloud Functions 설정

### 1. Functions 초기화

```bash
firebase init functions
```

선택사항:
- Language: TypeScript
- ESLint: Yes
- Install dependencies: Yes

### 2. 주요 Function

#### imageGeneration.ts

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();

interface GenerationData {
  generationId: string;
  prompt: string;
  imageCount: number;
  style: string;
  aspectRatio: string;
}

export const processImageGeneration = functions
  .region('asia-northeast3')
  .runWith({
    timeoutSeconds: 540, // 9분
    memory: '2GB',
  })
  .firestore
  .document('imageGenerations/{generationId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() as GenerationData;
    const { generationId } = context.params;
    
    try {
      // 상태 업데이트: processing
      await snap.ref.update({ status: 'processing' });
      
      // 이미지 생성 로직
      for (let i = 0; i < data.imageCount; i++) {
        // AI API 호출
        const imageUrl = await generateImage(data.prompt, data.style);
        
        // Storage에 업로드
        const uploadedUrl = await uploadToStorage(imageUrl, generationId, i);
        
        // Firestore에 저장
        await admin.firestore()
          .collection('imageGenerations')
          .doc(generationId)
          .collection('images')
          .add({
            imageUrl: uploadedUrl,
            order: i + 1,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        
        // 진행률 업데이트
        const progress = Math.round(((i + 1) / data.imageCount) * 100);
        await snap.ref.update({ progress });
      }
      
      // ZIP 생성 및 이메일 발송
      await createZipAndSendEmail(generationId);
      
      // 완료 상태 업데이트
      await snap.ref.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
    } catch (error) {
      console.error('Image generation failed:', error);
      
      // 실패 상태 업데이트
      await snap.ref.update({
        status: 'failed',
        failedReason: error.message,
      });
      
      // 포인트 환불
      await refundPoints(data.userId, data.pointsUsed);
    }
  });

async function generateImage(prompt: string, style: string): Promise<string> {
  // AI API 호출 (DALL-E, Stable Diffusion 등)
  // 구현 필요
  return 'image-url';
}

async function uploadToStorage(imageUrl: string, generationId: string, index: number): Promise<string> {
  // Storage 업로드 로직
  // 구현 필요
  return 'storage-url';
}

async function createZipAndSendEmail(generationId: string): Promise<void> {
  // ZIP 생성 및 이메일 발송
  // 구현 필요
}

async function refundPoints(userId: string, amount: number): Promise<void> {
  // 포인트 환불
  await admin.firestore().runTransaction(async (transaction) => {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await transaction.get(userRef);
    const currentPoints = userDoc.data()?.points || 0;
    
    transaction.update(userRef, {
      points: currentPoints + amount,
    });
    
    transaction.create(admin.firestore().collection('pointTransactions').doc(), {
      userId,
      amount,
      type: 'refund',
      description: '이미지 생성 실패로 인한 환불',
      balanceBefore: currentPoints,
      balanceAfter: currentPoints + amount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}
```

### 3. Functions 배포

```bash
# 모든 Functions 배포 (승인 필요!)
firebase deploy --only functions

# 특정 Function만 배포
firebase deploy --only functions:processImageGeneration
```

---

## 🔧 로컬 개발 환경

### 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인

```bash
firebase login
```

### 3. 프로젝트 초기화

```bash
cd /Users/songminju/imagesfactory
firebase init
```

선택:
- Firestore: Yes
- Functions: Yes
- Storage: Yes
- Emulators: Yes (선택)

### 4. 에뮬레이터 설정

#### firebase.json

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ],
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

### 5. 에뮬레이터 실행

```bash
firebase emulators:start
```

접속:
- Emulator UI: http://localhost:4000
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Functions: http://localhost:5001
- Storage: http://localhost:9199

---

## 🔑 환경 변수 설정

### .env.local (로컬 개발)

```bash
# Firebase 클라이언트 설정
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="imagesfactory.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="imagesfactory"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="imagesfactory.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# Firebase Admin SDK (서버 사이드)
FIREBASE_ADMIN_PROJECT_ID="imagesfactory"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk@imagesfactory.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 에뮬레이터 사용 여부
NEXT_PUBLIC_USE_FIREBASE_EMULATOR="true"

# AI API
OPENAI_API_KEY="sk-..."
STABILITY_API_KEY="sk-..."

# SendGrid
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@imagesfactory.com"

# Toss Payments
TOSS_CLIENT_KEY="test_ck_..."
TOSS_SECRET_KEY="test_sk_..."

# Google Translate
GOOGLE_TRANSLATE_API_KEY="your-key"
```

### .env.production (프로덕션)

```bash
# 위와 동일하지만 프로덕션 키 사용
NEXT_PUBLIC_USE_FIREBASE_EMULATOR="false"
# ... 프로덕션 키
```

---

## 📊 Firebase Admin SDK 설정

### 서비스 계정 키 생성

1. Firebase Console > 프로젝트 설정
2. 서비스 계정 탭
3. "새 비공개 키 생성" 클릭
4. JSON 파일 다운로드
5. **절대 Git에 커밋하지 말 것!**

### lib/firebase-admin.ts

```typescript
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const fieldValue = admin.firestore.FieldValue;

export default admin;
```

---

## 📈 모니터링 & 분석

### 1. Firebase Analytics

프로젝트 설정 > 통합 > Google Analytics 연결

### 2. Performance Monitoring

```bash
firebase init performance
```

### 3. Crashlytics (선택)

에러 추적을 위한 Crashlytics 설정

---

## 💰 비용 관리

### Firebase 요금제

#### Spark (무료)
- Firestore: 1GB 저장, 50K 읽기/일
- Storage: 5GB
- Functions: 125K 호출/월

#### Blaze (종량제)
- 사용한 만큼 지불
- 무료 할당량 포함
- **권장**: 프로덕션용

### 예상 비용 (월간)

```
Firestore:
- 저장: 10GB x $0.18/GB = $1.80
- 읽기: 1M x $0.06/100K = $0.60
- 쓰기: 500K x $0.18/100K = $0.90

Storage:
- 저장: 100GB x $0.026/GB = $2.60
- 다운로드: 10GB x $0.12/GB = $1.20

Functions:
- 호출: 1M x $0.40/M = $0.40
- 컴퓨팅: 100GB-s x $0.0000025 = $0.25

총 예상: $7-10/월 (초기)
```

### 비용 알림 설정

1. Google Cloud Console
2. 결제 > 예산 및 알림
3. 예산 생성 (예: $20/월)
4. 알림 설정 (80% 도달 시)

---

## 🔍 디버깅 팁

### Firestore 쿼리 디버그

```typescript
// 쿼리 실행 계획 보기
const query = collection(db, 'imageGenerations')
  .where('userId', '==', userId)
  .orderBy('createdAt', 'desc')
  .limit(20);

// 에뮬레이터에서 확인
console.log('Query:', query);
```

### Functions 로그 확인

```bash
# 실시간 로그
firebase functions:log --only processImageGeneration

# 에뮬레이터 로그
# Emulator UI에서 Functions > Logs 확인
```

### Storage 권한 문제

```typescript
// 공개 URL 생성
const fileRef = ref(storage, 'path/to/file.jpg');
const url = await getDownloadURL(fileRef);
```

---

## 📚 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 데이터 모델링](https://firebase.google.com/docs/firestore/data-model)
- [Firebase 보안 규칙](https://firebase.google.com/docs/rules)
- [Cloud Functions 가이드](https://firebase.google.com/docs/functions)

---

**문서 히스토리**
- v1.0 (2025-11-23): 초안 작성

