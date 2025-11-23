/**
 * Firestore 연결 테스트 스크립트
 */

// Firebase Admin SDK로 Firestore 연결 테스트
const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'imagefactory-5ccc6',
  });
}

const db = admin.firestore();

async function testFirestore() {
  console.log('\n🔍 Firestore 연결 테스트 시작...\n');
  
  try {
    // 1. 테스트 문서 쓰기
    console.log('1️⃣ 테스트 문서 생성 중...');
    const testRef = db.collection('_test').doc('connection-test');
    await testRef.set({
      message: 'Firestore 연결 성공!',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ 테스트 문서 생성 성공\n');

    // 2. 테스트 문서 읽기
    console.log('2️⃣ 테스트 문서 읽기 중...');
    const doc = await testRef.get();
    if (doc.exists) {
      console.log('✅ 테스트 문서 읽기 성공');
      console.log('   데이터:', doc.data());
    }
    console.log('');

    // 3. 테스트 문서 삭제
    console.log('3️⃣ 테스트 문서 삭제 중...');
    await testRef.delete();
    console.log('✅ 테스트 문서 삭제 성공\n');

    console.log('╔════════════════════════════════════════╗');
    console.log('║   ✅ Firestore 정상 작동 중!         ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log('이제 브라우저에서 구글 로그인을 다시 시도하세요! 🚀\n');

  } catch (error) {
    console.error('\n❌ Firestore 연결 실패:', error.message);
    console.error('\n원인:');
    if (error.code === 9) {
      console.error('  - Firestore Database가 아직 생성되지 않았습니다.');
      console.error('  - Firebase Console에서 Firestore를 활성화해주세요.');
    } else if (error.code === 7) {
      console.error('  - 권한이 없습니다.');
      console.error('  - Firebase Admin SDK 인증 설정을 확인해주세요.');
    } else {
      console.error('  - 알 수 없는 오류:', error);
    }
    console.error('\n해결책:');
    console.error('  👉 https://console.firebase.google.com/project/imagefactory-5ccc6/firestore\n');
  }

  process.exit(0);
}

testFirestore();

