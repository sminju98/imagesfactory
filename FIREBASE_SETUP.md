# Firebase 설정 가이드 (빠른 시작)

## 🔥 Google 로그인 활성화

회원가입/로그인이 작동하려면 Firebase Console에서 설정이 필요합니다.

### 1단계: Firebase Console 접속
```
https://console.firebase.google.com/project/imagefactory-5ccc6
```

### 2단계: Authentication 설정
```
1. 좌측 메뉴 > "Authentication" 클릭
2. "Sign-in method" 탭 클릭
3. "Google" 클릭
4. "사용 설정" 토글 ON
5. 프로젝트 공개용 이름: "imagesfactory"
6. 프로젝트 지원 이메일: webmaster@geniuscat.co.kr
7. "저장" 클릭
```

### 3단계: 승인된 도메인 확인
```
Authentication > Settings > 승인된 도메인

확인할 도메인:
✅ localhost (기본 포함됨)
✅ imagefactory-5ccc6.firebaseapp.com (기본 포함됨)
```

만약 localhost가 없다면:
```
1. "도메인 추가" 클릭
2. "localhost" 입력
3. 추가
```

---

## 🔒 Firestore 보안 규칙 설정

### 1단계: Firestore Database 생성 (아직 안 했다면)
```
1. Firestore Database 메뉴
2. "데이터베이스 만들기" 클릭
3. 위치: asia-northeast3 (서울)
4. 프로덕션 모드로 시작
```

### 2단계: 보안 규칙 설정
```
1. Firestore Database > 규칙 탭
2. 다음 규칙 복사/붙여넣기:
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 사용자 문서
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // 이미지 생성 작업
    match /imageGenerations/{generationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // 포인트 거래 내역
    match /pointTransactions/{transactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if false;
      allow delete: if false;
    }
    
    // 결제 내역
    match /payments/{paymentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

```
3. "게시" 클릭
```

---

## 📦 Storage 설정

### 1단계: Storage 버킷 생성
```
1. Storage 메뉴
2. "시작하기" 클릭
3. 위치: asia-northeast3 (서울)
4. 완료
```

### 2단계: Storage 보안 규칙
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /generations/{generationId}/{imageFile} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## ✅ 테스트 준비 완료!

위 설정을 완료하면:
- ✅ Google 로그인 작동
- ✅ 이메일 회원가입 작동
- ✅ Firestore 읽기/쓰기 가능
- ✅ Storage 업로드 가능

---

## 🚀 테스트 순서

1. Firebase Console에서 위 설정 완료
2. http://localhost:3000/signup 접속
3. "Google로 회원가입" 클릭
4. Google 계정 선택
5. ✅ 자동으로 Firestore에 저장
6. ✅ 1,000 포인트 자동 지급
7. ✅ 환영 이메일 발송
8. 메인 페이지로 이동

