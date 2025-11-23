# 🚨 긴급: Firestore Database 활성화 필요

## 문제
```
FirebaseError: Failed to get document because the client is offline.
Error code: unavailable
```

## 원인
Firestore Database가 활성화되지 않았거나 보안 규칙이 모든 접근을 차단하고 있습니다.

## 해결 방법 (5분 소요)

### 1️⃣ Firebase Console 접속
👉 https://console.firebase.google.com/project/imagefactory-5ccc6/firestore

### 2️⃣ Firestore Database 활성화

1. 좌측 메뉴에서 **"빌드"** > **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 버튼 클릭
3. **모드 선택**: "테스트 모드에서 시작" 선택 (개발용)
4. **위치 선택**: `asia-northeast3 (Seoul)` 선택
5. **사용 설정** 클릭

### 3️⃣ 보안 규칙 설정 (임시 - 테스트용)

**Rules** 탭으로 이동하여 다음 규칙 적용:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 🚨 개발용 임시 규칙 - 모든 읽기/쓰기 허용
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **중요**: 이 규칙은 개발용입니다. 프로덕션 배포 전에 반드시 보안 규칙을 강화해야 합니다!

### 4️⃣ 규칙 게시
- **"게시"** 버튼 클릭
- 완료!

---

## ✅ 확인 방법

1. Firebase Console > Firestore Database에서 데이터베이스가 보이는지 확인
2. 브라우저에서 F5로 페이지 새로고침
3. 다시 구글 로그인 시도
4. 콘솔에 "✅ [DEBUG] Firestore 저장 완료!" 메시지 확인

---

## 📝 참고: 프로덕션용 보안 규칙

나중에 `/Users/songminju/imagesfactory/firestore.rules` 파일의 규칙으로 교체하세요:

```bash
firebase deploy --only firestore:rules
```

---

**지금 바로 Firebase Console에서 Firestore를 활성화해주세요!** 🚀


