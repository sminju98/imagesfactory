/**
 * 특정 사용자에게 포인트 지급 스크립트
 */

const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'imagefactory-5ccc6',
  });
}

const db = admin.firestore();

async function addPoints(email, points) {
  try {
    console.log(`\n🔍 사용자 검색 중: ${email}`);
    
    // 이메일로 사용자 찾기
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`❌ 사용자를 찾을 수 없습니다: ${email}`);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    const currentPoints = userData.points || 0;

    console.log(`✅ 사용자 발견: ${userData.displayName} (${email})`);
    console.log(`   현재 포인트: ${currentPoints.toLocaleString()}pt`);

    // 포인트 지급
    const newPoints = currentPoints + points;
    
    await db.collection('users').doc(userId).update({
      points: newPoints,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`💰 포인트 지급 완료!`);
    console.log(`   지급 포인트: +${points.toLocaleString()}pt`);
    console.log(`   최종 포인트: ${newPoints.toLocaleString()}pt`);

    // 포인트 거래 내역 저장
    await db.collection('pointTransactions').add({
      userId,
      amount: points,
      type: 'bonus',
      description: '관리자 포인트 지급',
      balanceBefore: currentPoints,
      balanceAfter: newPoints,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`📝 거래 내역 저장 완료\n`);

  } catch (error) {
    console.error('\n❌ 포인트 지급 실패:', error);
    throw error;
  }
}

// 실행
const email = process.argv[2] || 'sminju98@gmail.com';
const points = parseInt(process.argv[3]) || 100000;

console.log('\n╔════════════════════════════════════════╗');
console.log('║   💰 포인트 지급 시스템              ║');
console.log('╚════════════════════════════════════════╝');

addPoints(email, points)
  .then(() => {
    console.log('✅ 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  });


