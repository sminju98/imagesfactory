/**
 * Firebase 설정 검증 스크립트
 * 구글 로그인이 안되는 원인을 자동으로 체크합니다
 */

const https = require('https');

// Firebase 설정 (firebase.ts에서 가져온 값)
const firebaseConfig = {
  apiKey: "AIzaSyAFehtzPYQTzXscJPm2-yqKK5GGXKQDIX0",
  authDomain: "imagefactory-5ccc6.firebaseapp.com",
  projectId: "imagefactory-5ccc6",
  storageBucket: "imagefactory-5ccc6.firebasestorage.app",
  messagingSenderId: "629353944984",
  appId: "1:629353944984:web:9b862385c899063ef2fded",
  measurementId: "G-5LSCXQ4R4W"
};

console.log('\n');
console.log('╔════════════════════════════════════════════════════╗');
console.log('║   🔍 Firebase 설정 검증 및 문제 진단             ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('\n');

// 1. Firebase 설정 확인
console.log('📋 1단계: Firebase 기본 설정 확인');
console.log('─'.repeat(50));
console.log(`✅ API Key: ${firebaseConfig.apiKey ? '설정됨' : '❌ 없음'}`);
console.log(`✅ Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`✅ Project ID: ${firebaseConfig.projectId}`);
console.log('\n');

// 2. Auth Domain 접근 가능 여부 확인
console.log('📋 2단계: Auth Domain 접근 확인');
console.log('─'.repeat(50));

const checkAuthDomain = () => {
  return new Promise((resolve) => {
    const url = `https://${firebaseConfig.authDomain}/__/auth/handler`;
    console.log(`🔍 테스트 URL: ${url}`);
    
    https.get(url, (res) => {
      console.log(`✅ Auth Domain 응답: ${res.statusCode}`);
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('✅ Auth Domain이 정상적으로 응답합니다');
        resolve(true);
      } else {
        console.log(`⚠️  예상치 못한 응답 코드: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error('❌ Auth Domain에 접근할 수 없습니다:', err.message);
      resolve(false);
    });
  });
};

// 3. 구글 로그인 문제 진단
const diagnoseGoogleLogin = () => {
  console.log('\n');
  console.log('📋 3단계: 구글 로그인 문제 진단');
  console.log('─'.repeat(50));
  console.log('\n');

  console.log('🔍 가능한 문제들:');
  console.log('\n');

  console.log('1️⃣  Firebase Console에서 Google 로그인 활성화 확인');
  console.log('   👉 https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/authentication/providers');
  console.log('   ✓ Google 로그인이 "사용 설정됨" 상태인지 확인');
  console.log('\n');

  console.log('2️⃣  승인된 도메인에 localhost 추가 확인 ⭐ (가장 중요!)');
  console.log('   👉 https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/authentication/settings');
  console.log('   ✓ "승인된 도메인" 섹션에 "localhost" 추가');
  console.log('   ✓ 도메인 목록:');
  console.log('      - localhost (필수)');
  console.log('      - ' + firebaseConfig.authDomain);
  console.log('\n');

  console.log('3️⃣  브라우저 팝업 차단 해제');
  console.log('   ✓ Chrome: 주소창 오른쪽의 팝업 차단 아이콘 확인');
  console.log('   ✓ 사이트 설정 > 팝업 > 허용');
  console.log('\n');

  console.log('4️⃣  OAuth 클라이언트 설정 확인');
  console.log('   👉 https://console.cloud.google.com/apis/credentials?project=' + firebaseConfig.projectId);
  console.log('   ✓ 승인된 JavaScript 원본: http://localhost:3000');
  console.log('   ✓ 승인된 리디렉션 URI: https://' + firebaseConfig.authDomain + '/__/auth/handler');
  console.log('\n');
};

// 4. 해결 방법 안내
const provideSolutions = () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   💡 해결 방법 (우선순위 순)                     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log('🥇 1순위: 승인된 도메인에 localhost 추가');
  console.log('─'.repeat(50));
  console.log('1. Firebase Console 접속');
  console.log('   👉 https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/authentication/settings');
  console.log('');
  console.log('2. "승인된 도메인" 섹션 찾기');
  console.log('');
  console.log('3. "도메인 추가" 버튼 클릭');
  console.log('');
  console.log('4. "localhost" 입력 후 추가');
  console.log('');
  console.log('5. 페이지 새로고침 후 다시 시도');
  console.log('\n');

  console.log('🥈 2순위: Google 로그인 활성화');
  console.log('─'.repeat(50));
  console.log('1. Firebase Console 접속');
  console.log('   👉 https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/authentication/providers');
  console.log('');
  console.log('2. "Google" 클릭');
  console.log('');
  console.log('3. "사용 설정" 토글 ON');
  console.log('');
  console.log('4. 프로젝트 공개용 이름 입력');
  console.log('');
  console.log('5. 지원 이메일 선택');
  console.log('');
  console.log('6. "저장" 클릭');
  console.log('\n');

  console.log('🥉 3순위: 브라우저 설정 확인');
  console.log('─'.repeat(50));
  console.log('1. Chrome 설정 > 개인정보 및 보안 > 사이트 설정');
  console.log('');
  console.log('2. 팝업 및 리디렉션 > localhost:3000 허용');
  console.log('');
  console.log('3. 시크릿 모드에서 테스트 (확장 프로그램 없이)');
  console.log('\n');
};

// 실행
(async () => {
  await checkAuthDomain();
  diagnoseGoogleLogin();
  provideSolutions();

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   ✅ 진단 완료                                    ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log('💡 위의 해결 방법을 순서대로 시도해보세요!');
  console.log('💡 문제가 해결되지 않으면 브라우저 콘솔의 에러 메시지를 확인해주세요.');
  console.log('\n');
})();


