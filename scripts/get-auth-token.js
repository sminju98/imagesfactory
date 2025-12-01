/**
 * Firebase Admin SDK를 사용해서 사용자 이메일로 커스텀 토큰 생성
 * 환경 변수를 사용해서 초기화
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Firebase Admin 초기화 (환경 변수 사용)
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
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
      console.log('✅ Firebase Admin initialized (Base64)');
    } else if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
      // 개별 환경 변수 사용
      const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin initialized (Env vars)');
    } else {
      throw new Error('Firebase Admin 환경 변수가 설정되지 않았습니다.');
    }
  } catch (error) {
    console.error('❌ Firebase Admin 초기화 실패:', error.message);
    process.exit(1);
  }
}

const userEmail = 'thdalswn98@naver.com';

async function getAuthToken() {
  try {
    // 사용자 UID 찾기
    const user = await admin.auth().getUserByEmail(userEmail);
    console.log('✅ 사용자 찾음:', user.uid, user.email);
    
    // 커스텀 토큰 생성
    const customToken = await admin.auth().createCustomToken(user.uid);
    console.log('\n✅ 커스텀 토큰 생성 완료:');
    console.log(customToken);
    console.log('\n⚠️ 참고: 이것은 커스텀 토큰입니다.');
    console.log('클라이언트에서 signInWithCustomToken 후 getIdToken을 호출하면 실제 ID 토큰을 얻을 수 있습니다.');
    
    return customToken;
  } catch (error) {
    console.error('❌ 오류:', error.message);
    throw error;
  }
}

getAuthToken().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});

