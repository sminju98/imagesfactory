/**
 * 기존 이미지 생성 내역을 포인트 거래 내역으로 동기화
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'imagefactory-5ccc6',
  });
}

const db = admin.firestore();

async function syncTransactions(email) {
  try {
    console.log(`\n🔍 사용자 검색: ${email}`);
    
    // 사용자 찾기
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      console.log(`❌ 사용자를 찾을 수 없습니다: ${email}\n`);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`✅ 사용자 발견: ${userData.displayName} (${userId})\n`);

    // 기존 거래 내역 확인
    const existingTxs = await db.collection('pointTransactions')
      .where('userId', '==', userId)
      .get();
    
    console.log(`📝 기존 거래 내역: ${existingTxs.size}건`);

    // 이미지 생성 내역 가져오기
    const generationsSnapshot = await db.collection('imageGenerations')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .get();

    console.log(`🖼️  완료된 이미지 생성: ${generationsSnapshot.size}건\n`);

    if (generationsSnapshot.empty) {
      console.log('생성 내역이 없습니다.\n');
      return;
    }

    // 이미 거래 내역이 있는 generationId 확인
    const existingGenIds = new Set();
    existingTxs.forEach(doc => {
      const data = doc.data();
      if (data.relatedGenerationId) {
        existingGenIds.add(data.relatedGenerationId);
      }
    });

    // 거래 내역이 없는 생성 작업만 처리
    let addedCount = 0;
    let currentBalance = userData.points || 0;

    for (const genDoc of generationsSnapshot.docs) {
      const genId = genDoc.id;
      const genData = genDoc.data();

      // 이미 거래 내역이 있으면 스킵
      if (existingGenIds.has(genId)) {
        continue;
      }

      const pointsUsed = genData.totalPoints || 0;
      const createdAt = genData.createdAt || admin.firestore.Timestamp.now();

      console.log(`📦 거래 내역 생성: ${genId} (-${pointsUsed}pt)`);

      // 거래 내역 추가
      await db.collection('pointTransactions').add({
        userId,
        amount: -pointsUsed,
        type: 'usage',
        description: `이미지 생성 (${genData.totalImages || 0}장) - 소급 적용`,
        balanceBefore: currentBalance + pointsUsed,
        balanceAfter: currentBalance,
        relatedGenerationId: genId,
        createdAt: createdAt,
      });

      addedCount++;
    }

    console.log(`\n✅ 거래 내역 ${addedCount}건 추가 완료!`);

    // 통계 업데이트
    const totalUsed = generationsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().totalPoints || 0);
    }, 0);

    const totalImages = generationsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().totalImages || 0);
    }, 0);

    await db.collection('users').doc(userId).update({
      'stats.totalGenerations': generationsSnapshot.size,
      'stats.totalImages': totalImages,
      'stats.totalPointsUsed': totalUsed,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ 사용자 통계 업데이트 완료!`);
    console.log(`   - 총 생성 작업: ${generationsSnapshot.size}건`);
    console.log(`   - 총 생성 이미지: ${totalImages}장`);
    console.log(`   - 총 사용 포인트: ${totalUsed}pt\n`);

  } catch (error) {
    console.error('❌ 동기화 실패:', error);
    throw error;
  }
}

async function syncAllUsers() {
  const emails = [
    'sminju98@gmail.com',
    'thdalswn98@naver.com',
  ];

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   🔄 거래 내역 동기화 (소급 적용)                ║');
  console.log('╚════════════════════════════════════════════════════╝');

  for (const email of emails) {
    try {
      await syncTransactions(email);
    } catch (error) {
      console.error(`${email} 동기화 실패`);
    }
  }

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   ✅ 모든 계정 동기화 완료!                      ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
}

syncAllUsers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

