/**
 * 커스텀 토큰을 사용해서 실제 ID 토큰 가져오기
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 커스텀 토큰 (이전 스크립트에서 생성한 것)
const customToken = process.argv[2];

if (!customToken) {
  console.error('❌ 커스텀 토큰이 필요합니다.');
  console.log('사용법: node scripts/get-id-token-from-custom.js <custom_token>');
  process.exit(1);
}

async function getIdToken() {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    console.log('🔄 커스텀 토큰으로 로그인 중...');
    const userCredential = await signInWithCustomToken(auth, customToken);
    console.log('✅ 로그인 성공:', userCredential.user.email);
    
    console.log('🔄 ID 토큰 가져오는 중...');
    const idToken = await userCredential.user.getIdToken();
    console.log('\n✅ ID 토큰:');
    console.log(idToken);
    console.log('\n이 토큰을 TEST_AUTH_TOKEN 환경 변수로 사용하세요:');
    console.log(`export TEST_AUTH_TOKEN="${idToken}"`);
    
    return idToken;
  } catch (error) {
    console.error('❌ 오류:', error.message);
    throw error;
  }
}

getIdToken().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});


