// Firebase Admin SDK (서버 사이드 전용)
import * as admin from 'firebase-admin';

// 에뮬레이터 사용 여부
const useEmulator = process.env.FIREBASE_EMULATOR === 'true';

// Firebase Admin 초기화 (중복 방지)
if (!admin.apps.length) {
  try {
    if (useEmulator) {
      // 🔥 에뮬레이터 모드
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'imagefactory-5ccc6';
      
      admin.initializeApp({
        projectId,
        storageBucket: `${projectId}.appspot.com`,
      });
      
      console.log('🔥 Firebase Admin initialized (EMULATOR MODE)');
      console.log('   - Firestore: localhost:8080');
      console.log('   - Auth: localhost:9099');
      console.log('   - Storage: localhost:9199');
      console.log('   - Functions: localhost:5001');
      console.log('   - UI: http://localhost:4000');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      // Base64로 인코딩된 서비스 계정 JSON 사용
      const serviceAccountJson = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin initialized');
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
      console.log('✅ Firebase Admin initialized');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

// Firestore 인스턴스
export const db = admin.firestore();

// 에뮬레이터 연결 설정
if (useEmulator) {
  db.settings({
    host: 'localhost:8080',
    ssl: false,
  });
}

export const auth = admin.auth();
export const storage = admin.storage();
export const fieldValue = admin.firestore.FieldValue;

export default admin;
