// Firebase Admin SDK (서버 사이드 전용)
import * as admin from 'firebase-admin';

// Firebase Admin 초기화 (중복 방지)
if (!admin.apps.length) {
  try {
    // Base64로 인코딩된 서비스 계정 JSON 사용
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
    } else {
      // 개별 환경 변수 사용 (fallback)
      const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const fieldValue = admin.firestore.FieldValue;

export default admin;

