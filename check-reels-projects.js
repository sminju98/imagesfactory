/**
 * Firebase에 저장된 Reels 프로젝트 확인 스크립트
 */

const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  try {
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
      console.log('⚠️ FIREBASE_SERVICE_ACCOUNT_BASE64 환경 변수가 필요합니다.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Firebase 초기화 오류:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function checkReelsProjects() {
  try {
    console.log('🔍 Firebase에서 Reels 프로젝트 조회 중...\n');
    
    const snapshot = await db.collection('reelsProjects')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    if (snapshot.empty) {
      console.log('❌ 저장된 프로젝트가 없습니다.');
      console.log('\n💡 프로젝트를 생성하려면:');
      console.log('   1. 웹 브라우저에서 http://localhost:3000/reels 접속');
      console.log('   2. "시작하기" 버튼 클릭');
      console.log('   3. 프롬프트 입력 후 단계별 진행');
      return;
    }
    
    console.log(`✅ 총 ${snapshot.size}개의 프로젝트를 찾았습니다.\n`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📋 프로젝트 ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   프롬프트: ${data.inputPrompt?.substring(0, 50)}...`);
      console.log(`   상태: ${data.status || 'draft'}`);
      console.log(`   현재 단계: ${data.currentStep || 0}/7`);
      console.log(`   생성일: ${data.createdAt?.toDate?.()?.toLocaleString('ko-KR') || '-'}`);
      
      if (data.finalReelUrl) {
        console.log(`   ✅ 최종 릴스: ${data.finalReelUrl}`);
        console.log(`   👉 결과 보기: http://localhost:3000/reels/${doc.id}`);
      } else if (data.videoClips && data.videoClips.length > 0) {
        const completed = data.videoClips.filter((c) => c.status === 'completed').length;
        console.log(`   🎥 영상 진행: ${completed}/5 완료`);
      }
    });
    
    console.log('\n\n💡 결과를 보려면:');
    console.log('   웹 브라우저에서 http://localhost:3000/reels/[프로젝트ID] 접속');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkReelsProjects().then(() => process.exit(0));

