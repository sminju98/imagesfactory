/**
 * 사용자 이메일 인증 처리 스크립트
 */

const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'imagefactory-5ccc6',
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function verifyUserEmail(email) {
  try {
    console.log(`\n🔍 사용자 검색 중: ${email}\n`);
    
    // Firebase Auth에서 사용자 찾기
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Auth 사용자 발견:`);
    console.log(`   - UID: ${userRecord.uid}`);
    console.log(`   - 이름: ${userRecord.displayName || 'N/A'}`);
    console.log(`   - 현재 인증 상태: ${userRecord.emailVerified ? '✅ 인증됨' : '❌ 미인증'}\n`);

    if (userRecord.emailVerified) {
      console.log('✅ 이미 이메일이 인증되어 있습니다!\n');
    } else {
      // Firebase Auth에서 이메일 인증 처리
      await auth.updateUser(userRecord.uid, {
        emailVerified: true,
      });
      console.log('✅ Firebase Auth 이메일 인증 완료!\n');
    }

    // Firestore에서도 업데이트
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (userDoc.exists()) {
      await db.collection('users').doc(userRecord.uid).update({
        emailVerified: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ Firestore 이메일 인증 상태 업데이트 완료!\n');
    } else {
      console.log('⚠️  Firestore에 사용자 문서가 없습니다.\n');
    }

    console.log('╔════════════════════════════════════════╗');
    console.log('║   ✅ 이메일 인증 처리 완료!          ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error('❌ 사용자를 찾을 수 없습니다:', email);
    } else {
      console.error('❌ 이메일 인증 처리 실패:', error);
    }
    throw error;
  }
}

// 실행
const email = process.argv[2] || 'thdalswn98@naver.com';

console.log('\n╔════════════════════════════════════════╗');
console.log('║   📧 이메일 인증 처리                ║');
console.log('╚════════════════════════════════════════╝');

verifyUserEmail(email)
  .then(() => {
    console.log('✅ 작업 완료! 이제 해당 계정으로 로그인할 수 있습니다.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  });

