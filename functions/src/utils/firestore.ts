/**
 * Firebase Admin SDK 초기화 및 Firestore 유틸리티
 */

import * as admin from 'firebase-admin';

// Firebase Admin 초기화 (한 번만 실행)
if (!admin.apps.length) {
  try {
    // 환경 변수에서 서비스 계정 정보 로드
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const serviceAccountJson = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
      // 개별 환경 변수 사용
      const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Firebase Functions 환경에서는 자동 초기화
      admin.initializeApp();
    }
    console.log('✅ Firebase Admin initialized in Functions');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    // 이미 초기화된 경우 무시
    if (!admin.apps.length) {
      admin.initializeApp();
    }
  }
}

// Firestore 인스턴스
export const db = admin.firestore();

// Auth 인스턴스
export const auth = admin.auth();

// Storage 인스턴스
export const storage = admin.storage();

// FieldValue 헬퍼
export const fieldValue = admin.firestore.FieldValue;

/**
 * 서버 타임스탬프
 */
export const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

/**
 * 배열에 요소 추가
 */
export const arrayUnion = (...elements: unknown[]) => 
  admin.firestore.FieldValue.arrayUnion(...elements);

/**
 * 배열에서 요소 제거
 */
export const arrayRemove = (...elements: unknown[]) => 
  admin.firestore.FieldValue.arrayRemove(...elements);

/**
 * 숫자 증가
 */
export const increment = (n: number) => admin.firestore.FieldValue.increment(n);


