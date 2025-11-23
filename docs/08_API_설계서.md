# API 설계서 (API Design Document)
# imagesfactory

**문서 버전**: 1.0  
**작성일**: 2025-11-23  
**대상 독자**: 개발팀

---

## 📋 개요

본 문서는 imagesfactory의 REST API 상세 설계를 정의합니다.

---

## 🌐 API 기본 정보

### Base URL
- **개발**: `http://localhost:3000/api`
- **프로덕션**: `https://imagesfactory.com/api`

### 인증 방식
- Firebase Authentication Token
- Header: `Authorization: Bearer {idToken}`

### 응답 형식
모든 API는 JSON 형식으로 응답합니다.

#### 성공 응답
```json
{
  "success": true,
  "data": {
    // 실제 데이터
  },
  "meta": {
    // 페이지네이션 등 메타 정보 (선택)
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 에러 메시지",
    "details": {
      // 추가 에러 상세 정보 (선택)
    }
  }
}
```

### HTTP 상태 코드
- `200 OK`: 요청 성공
- `201 Created`: 리소스 생성 성공
- `204 No Content`: 성공, 응답 본문 없음
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `409 Conflict`: 충돌 (예: 이메일 중복)
- `422 Unprocessable Entity`: 검증 실패
- `429 Too Many Requests`: Rate limit 초과
- `500 Internal Server Error`: 서버 에러
- `503 Service Unavailable`: 서비스 불가

### Rate Limiting
- 인증된 사용자: 100 req/분
- 이미지 생성: 10 req/시간
- 로그인: 5 req/분

---

## 🔐 인증 API

### POST /api/auth/register
이메일 회원가입

#### Request
```typescript
{
  email: string;        // 이메일 (필수)
  password: string;     // 비밀번호 (필수, 최소 6자)
  displayName: string;  // 이름 (필수)
  agreeToTerms: boolean;    // 이용약관 동의 (필수)
  agreeToPrivacy: boolean;  // 개인정보처리방침 동의 (필수)
}
```

#### Response (201)
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다. 이메일을 확인해주세요.",
  "data": {
    "user": {
      "uid": "abc123",
      "email": "user@example.com",
      "displayName": "홍길동",
      "points": 1000,
      "emailVerified": false,
      "createdAt": "2025-11-23T10:00:00Z"
    }
  }
}
```

#### Errors
- `400`: 필수 필드 누락
- `409`: 이메일 중복
- `422`: 이메일/비밀번호 형식 오류

---

### POST /api/auth/login
이메일 로그인

#### Request
```typescript
{
  email: string;
  password: string;
  remember?: boolean;  // 로그인 상태 유지 (선택, 기본: false)
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "abc123",
      "email": "user@example.com",
      "displayName": "홍길동",
      "photoURL": null,
      "points": 2500,
      "emailVerified": true
    },
    "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "AMf-vBwl3p7..."
  }
}
```

#### Errors
- `400`: 필수 필드 누락
- `401`: 이메일 또는 비밀번호 오류
- `423`: 계정 잠금 (5회 실패 시)

---

### POST /api/auth/google
구글 소셜 로그인

#### Request
```typescript
{
  idToken: string;  // Google ID Token
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "google_xyz",
      "email": "user@gmail.com",
      "displayName": "김철수",
      "photoURL": "https://lh3.googleusercontent.com/...",
      "points": 1000,
      "emailVerified": true,
      "isNewUser": true
    },
    "idToken": "...",
    "refreshToken": "..."
  }
}
```

---

### POST /api/auth/logout
로그아웃

#### Request
Header만 필요 (Authorization)

#### Response (200)
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

---

### POST /api/auth/verify-email
이메일 인증 (재발송)

#### Request
```typescript
{
  email: string;
}
```

#### Response (200)
```json
{
  "success": true,
  "message": "인증 이메일이 발송되었습니다."
}
```

#### Errors
- `429`: 너무 많은 요청 (3회 제한)

---

### POST /api/auth/reset-password
비밀번호 재설정 이메일 발송

#### Request
```typescript
{
  email: string;
}
```

#### Response (200)
```json
{
  "success": true,
  "message": "비밀번호 재설정 이메일이 발송되었습니다."
}
```

---

### GET /api/auth/me
현재 사용자 정보 조회

#### Request
Header: Authorization Required

#### Response (200)
```json
{
  "success": true,
  "data": {
    "uid": "abc123",
    "email": "user@example.com",
    "displayName": "홍길동",
    "photoURL": null,
    "points": 2500,
    "emailVerified": true,
    "provider": "password",
    "createdAt": "2025-11-01T10:00:00Z",
    "stats": {
      "totalGenerations": 15,
      "totalImages": 150,
      "totalPointsUsed": 15000
    }
  }
}
```

---

## 🎨 이미지 생성 API

### POST /api/generate
이미지 생성 요청

#### Request
```typescript
{
  prompt: string;           // 프롬프트 (필수, 10-1000자)
  imageCount: number;       // 이미지 수 (필수, 1-50)
  style: 'realistic' | 'artistic' | 'anime' | '3d' | 'watercolor' | 'oil';
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
}
```

#### Response (201)
```json
{
  "success": true,
  "data": {
    "generation": {
      "id": "gen_xyz123",
      "userId": "abc123",
      "prompt": "a beautiful sunset over the ocean",
      "promptKo": "바다 위의 아름다운 일몰",
      "promptTranslated": "a beautiful sunset over the ocean",
      "imageCount": 10,
      "style": "realistic",
      "aspectRatio": "16:9",
      "status": "pending",
      "progress": 0,
      "pointsUsed": 1000,
      "createdAt": "2025-11-23T10:00:00Z",
      "estimatedCompletionTime": 300
    }
  }
}
```

#### Errors
- `400`: 잘못된 요청 파라미터
- `402`: 포인트 부족
- `422`: 프롬프트 검증 실패 (금지어 포함)
- `429`: Rate limit 초과 (시간당 10회)

---

### GET /api/generate/:id
생성 작업 상태 조회

#### Request
Path Parameter: `id` (generation ID)

#### Response (200)
```json
{
  "success": true,
  "data": {
    "id": "gen_xyz123",
    "status": "processing",
    "progress": 45,
    "completedCount": 4,
    "totalCount": 10,
    "estimatedTimeRemaining": 180,
    "prompt": "a beautiful sunset over the ocean",
    "imageCount": 10,
    "style": "realistic",
    "aspectRatio": "16:9",
    "pointsUsed": 1000,
    "createdAt": "2025-11-23T10:00:00Z",
    "images": [
      {
        "id": "img_001",
        "imageUrl": "https://storage.googleapis.com/.../0.png",
        "thumbnailUrl": "https://storage.googleapis.com/.../0_thumb.png",
        "order": 1,
        "width": 1792,
        "height": 1024,
        "fileSize": 2048576,
        "createdAt": "2025-11-23T10:01:30Z"
      }
    ]
  }
}
```

#### Status Values
- `pending`: 대기 중
- `processing`: 생성 중
- `completed`: 완료
- `failed`: 실패
- `cancelled`: 취소됨

---

### DELETE /api/generate/:id
생성 작업 취소

#### Request
Path Parameter: `id` (generation ID)

#### Response (200)
```json
{
  "success": true,
  "message": "생성 작업이 취소되었습니다.",
  "data": {
    "refundedPoints": 600,
    "completedImages": 4
  }
}
```

#### Errors
- `404`: 작업을 찾을 수 없음
- `409`: 이미 완료되어 취소 불가

---

### GET /api/generate/history
생성 히스토리 조회

#### Request Query Parameters
```typescript
{
  page?: number;        // 페이지 번호 (기본: 1)
  limit?: number;       // 페이지당 항목 수 (기본: 20, 최대: 100)
  status?: string;      // 상태 필터 (pending/processing/completed/failed)
  startDate?: string;   // 시작 날짜 (ISO 8601)
  endDate?: string;     // 종료 날짜 (ISO 8601)
  search?: string;      // 프롬프트 검색 키워드
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "generations": [
      {
        "id": "gen_xyz123",
        "prompt": "a beautiful sunset...",
        "imageCount": 10,
        "status": "completed",
        "progress": 100,
        "pointsUsed": 1000,
        "thumbnails": [
          "https://.../0_thumb.png",
          "https://.../1_thumb.png",
          "https://.../2_thumb.png",
          "https://.../3_thumb.png"
        ],
        "createdAt": "2025-11-23T10:00:00Z",
        "completedAt": "2025-11-23T10:25:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### POST /api/generate/:id/regenerate
동일 프롬프트로 재생성

#### Request
Path Parameter: `id` (generation ID)

#### Response (201)
```json
{
  "success": true,
  "data": {
    "newGenerationId": "gen_abc456",
    "pointsUsed": 1000
  }
}
```

---

### GET /api/generate/:id/download
이미지 ZIP 다운로드

#### Request
Path Parameter: `id` (generation ID)

#### Response (200)
파일 다운로드 (application/zip)

#### Errors
- `404`: 작업을 찾을 수 없음
- `400`: 아직 완료되지 않음

---

## 💰 포인트 API

### GET /api/points/balance
포인트 잔액 조회

#### Request
Header: Authorization Required

#### Response (200)
```json
{
  "success": true,
  "data": {
    "balance": 2500,
    "currency": "KRW",
    "estimatedImages": 25
  }
}
```

---

### GET /api/points/transactions
포인트 거래 내역 조회

#### Request Query Parameters
```typescript
{
  page?: number;
  limit?: number;
  type?: 'purchase' | 'usage' | 'refund' | 'bonus';
  startDate?: string;
  endDate?: string;
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "userId": "abc123",
        "amount": -1000,
        "type": "usage",
        "description": "이미지 10장 생성",
        "relatedGenerationId": "gen_xyz123",
        "balanceBefore": 3500,
        "balanceAfter": 2500,
        "createdAt": "2025-11-23T10:00:00Z"
      },
      {
        "id": "txn_122",
        "amount": 10000,
        "type": "purchase",
        "description": "프로 패키지 구매",
        "relatedPaymentId": "pay_456",
        "balanceBefore": 0,
        "balanceAfter": 10000,
        "createdAt": "2025-11-22T15:30:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 8
  }
}
```

---

### GET /api/points/packages
포인트 패키지 목록

#### Response (200)
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "starter",
        "name": "스타터",
        "points": 1000,
        "price": 5000,
        "images": 10,
        "discount": 0,
        "pricePerImage": 500,
        "popular": false
      },
      {
        "id": "basic",
        "name": "베이직",
        "points": 3000,
        "price": 13500,
        "images": 30,
        "discount": 10,
        "pricePerImage": 450,
        "popular": false
      },
      {
        "id": "pro",
        "name": "프로",
        "points": 10000,
        "price": 40000,
        "images": 100,
        "discount": 20,
        "pricePerImage": 400,
        "popular": true
      },
      {
        "id": "business",
        "name": "비즈니스",
        "points": 30000,
        "price": 105000,
        "images": 300,
        "discount": 30,
        "pricePerImage": 350,
        "popular": false
      },
      {
        "id": "enterprise",
        "name": "엔터프라이즈",
        "points": 100000,
        "price": 300000,
        "images": 1000,
        "discount": 40,
        "pricePerImage": 300,
        "popular": false
      }
    ]
  }
}
```

---

## 💳 결제 API (토스페이먼츠)

### POST /api/payment/create
결제 생성

#### Request
```typescript
{
  packageId: string;  // 패키지 ID
  amount: number;     // 결제 금액 (원)
  points: number;     // 충전될 포인트
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "paymentKey": null,
    "orderId": "order_2025112310001",
    "amount": 40000,
    "points": 10000,
    "customerEmail": "user@example.com",
    "customerName": "홍길동"
  }
}
```

---

### POST /api/payment/confirm
결제 승인 (토스페이먼츠 콜백)

#### Request
```typescript
{
  paymentKey: string;   // 토스 결제 키
  orderId: string;      // 주문 ID
  amount: number;       // 결제 금액
}
```

#### Response (200)
```json
{
  "success": true,
  "message": "결제가 완료되었습니다.",
  "data": {
    "paymentId": "pay_123",
    "orderId": "order_2025112310001",
    "amount": 40000,
    "points": 10000,
    "status": "completed",
    "confirmedAt": "2025-11-23T10:05:00Z",
    "receiptUrl": "https://..."
  }
}
```

#### Errors
- `400`: 잘못된 요청
- `409`: 이미 처리된 결제
- `500`: 결제 승인 실패

---

### GET /api/payment/history
결제 내역 조회

#### Request Query Parameters
```typescript
{
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  startDate?: string;
  endDate?: string;
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_123",
        "orderId": "order_2025112310001",
        "amount": 40000,
        "points": 10000,
        "status": "completed",
        "paymentMethod": "카드",
        "paymentKey": "tviva20211215va123abc",
        "receiptUrl": "https://...",
        "createdAt": "2025-11-23T10:00:00Z",
        "confirmedAt": "2025-11-23T10:05:00Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

### POST /api/payment/refund
환불 요청

#### Request
```typescript
{
  paymentId: string;
  reason?: string;
}
```

#### Response (200)
```json
{
  "success": true,
  "message": "환불이 신청되었습니다.",
  "data": {
    "refundId": "refund_123",
    "amount": 40000,
    "points": 10000,
    "status": "pending",
    "estimatedDays": "3-5"
  }
}
```

#### Errors
- `400`: 환불 불가 (7일 초과, 포인트 사용 등)
- `404`: 결제 내역 없음

---

## 👤 사용자 API

### GET /api/user/profile
프로필 조회

#### Response (200)
```json
{
  "success": true,
  "data": {
    "uid": "abc123",
    "email": "user@example.com",
    "displayName": "홍길동",
    "photoURL": null,
    "provider": "password",
    "emailVerified": true,
    "points": 2500,
    "createdAt": "2025-11-01T10:00:00Z",
    "stats": {
      "totalGenerations": 15,
      "totalImages": 150,
      "totalPointsUsed": 15000,
      "totalPurchased": 50000
    }
  }
}
```

---

### PATCH /api/user/profile
프로필 수정

#### Request
```typescript
{
  displayName?: string;
  photoURL?: string;
}
```

#### Response (200)
```json
{
  "success": true,
  "message": "프로필이 수정되었습니다.",
  "data": {
    "displayName": "김철수",
    "photoURL": "https://..."
  }
}
```

---

### POST /api/user/upload-photo
프로필 사진 업로드

#### Request
Form Data:
- `file`: 이미지 파일 (최대 2MB, JPG/PNG)

#### Response (200)
```json
{
  "success": true,
  "data": {
    "photoURL": "https://storage.googleapis.com/.../profile.jpg"
  }
}
```

---

### PUT /api/user/password
비밀번호 변경

#### Request
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

#### Response (200)
```json
{
  "success": true,
  "message": "비밀번호가 변경되었습니다."
}
```

#### Errors
- `401`: 현재 비밀번호 오류
- `400`: 새 비밀번호 형식 오류

---

### DELETE /api/user/account
계정 삭제

#### Request
```typescript
{
  password: string;  // 비밀번호 확인
  reason?: string;   // 삭제 사유 (선택)
}
```

#### Response (200)
```json
{
  "success": true,
  "message": "계정이 삭제되었습니다."
}
```

---

## 📊 통계 API

### GET /api/stats/dashboard
대시보드 통계

#### Response (200)
```json
{
  "success": true,
  "data": {
    "points": {
      "current": 2500,
      "thisMonth": -3000,
      "lastMonth": -2000
    },
    "generations": {
      "total": 15,
      "thisMonth": 5,
      "pending": 0,
      "processing": 1
    },
    "images": {
      "total": 150,
      "thisMonth": 50
    },
    "recentGenerations": [
      {
        "id": "gen_xyz",
        "thumbnails": ["...", "..."],
        "imageCount": 10,
        "status": "completed",
        "createdAt": "2025-11-23T10:00:00Z"
      }
    ]
  }
}
```

---

## 🔧 관리자 API (Admin)

### GET /api/admin/users
사용자 목록 조회

#### Request Query Parameters
```typescript
{
  page?: number;
  limit?: number;
  search?: string;  // 이메일, 이름 검색
  provider?: 'password' | 'google';
  emailVerified?: boolean;
}
```

#### Response (200)
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "uid": "abc123",
        "email": "user@example.com",
        "displayName": "홍길동",
        "points": 2500,
        "emailVerified": true,
        "provider": "password",
        "createdAt": "2025-11-01T10:00:00Z",
        "lastLoginAt": "2025-11-23T09:00:00Z",
        "stats": {
          "totalGenerations": 15,
          "totalImages": 150
        }
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1234
  }
}
```

---

### POST /api/admin/points/adjust
포인트 수동 조정

#### Request
```typescript
{
  userId: string;
  amount: number;     // 양수: 추가, 음수: 차감
  reason: string;
}
```

#### Response (200)
```json
{
  "success": true,
  "message": "포인트가 조정되었습니다.",
  "data": {
    "userId": "abc123",
    "balanceBefore": 2500,
    "balanceAfter": 3500,
    "amount": 1000
  }
}
```

---

### GET /api/admin/stats
전체 통계

#### Response (200)
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1234,
      "today": 45,
      "thisMonth": 567,
      "verified": 1100
    },
    "generations": {
      "total": 5678,
      "today": 89,
      "thisMonth": 1234,
      "successRate": 95.5
    },
    "revenue": {
      "today": 500000,
      "thisMonth": 15000000,
      "total": 50000000
    }
  }
}
```

---

## 🔔 웹훅 API

### POST /api/webhooks/toss
토스페이먼츠 웹훅

#### Request (토스페이먼츠에서 발송)
```typescript
{
  eventType: 'PAYMENT_CONFIRM' | 'PAYMENT_CANCEL' | 'PAYMENT_FAIL';
  data: {
    orderId: string;
    paymentKey: string;
    amount: number;
    status: string;
    // ... 기타 토스 데이터
  }
}
```

#### Response (200)
```json
{
  "success": true
}
```

---

## 📝 에러 코드 정리

### 인증 관련
- `AUTH_INVALID_EMAIL`: 유효하지 않은 이메일
- `AUTH_EMAIL_EXISTS`: 이미 존재하는 이메일
- `AUTH_WEAK_PASSWORD`: 약한 비밀번호
- `AUTH_WRONG_PASSWORD`: 잘못된 비밀번호
- `AUTH_USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `AUTH_ACCOUNT_LOCKED`: 계정 잠금
- `AUTH_TOKEN_EXPIRED`: 토큰 만료
- `AUTH_INVALID_TOKEN`: 유효하지 않은 토큰

### 이미지 생성 관련
- `GENERATION_INVALID_PROMPT`: 유효하지 않은 프롬프트
- `GENERATION_FORBIDDEN_CONTENT`: 금지된 콘텐츠
- `GENERATION_LIMIT_EXCEEDED`: 생성 한도 초과
- `GENERATION_NOT_FOUND`: 생성 작업을 찾을 수 없음
- `GENERATION_ALREADY_COMPLETED`: 이미 완료된 작업
- `GENERATION_FAILED`: 생성 실패

### 포인트/결제 관련
- `INSUFFICIENT_POINTS`: 포인트 부족
- `PAYMENT_INVALID_AMOUNT`: 유효하지 않은 금액
- `PAYMENT_ALREADY_PROCESSED`: 이미 처리된 결제
- `PAYMENT_FAILED`: 결제 실패
- `REFUND_NOT_ALLOWED`: 환불 불가
- `REFUND_ALREADY_PROCESSED`: 이미 환불된 결제

### 일반 에러
- `INVALID_REQUEST`: 잘못된 요청
- `VALIDATION_ERROR`: 검증 실패
- `NOT_FOUND`: 리소스를 찾을 수 없음
- `PERMISSION_DENIED`: 권한 없음
- `RATE_LIMIT_EXCEEDED`: Rate limit 초과
- `INTERNAL_ERROR`: 서버 내부 에러
- `SERVICE_UNAVAILABLE`: 서비스 불가

---

## 🧪 테스트 예시

### cURL 예시

#### 회원가입
```bash
curl -X POST https://imagesfactory.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "테스트",
    "agreeToTerms": true,
    "agreeToPrivacy": true
  }'
```

#### 이미지 생성
```bash
curl -X POST https://imagesfactory.com/api/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "prompt": "a beautiful sunset over the ocean",
    "imageCount": 10,
    "style": "realistic",
    "aspectRatio": "16:9"
  }'
```

---

**문서 히스토리**
- v1.0 (2025-11-23): 초안 작성

