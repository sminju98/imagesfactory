/**
 * 사용자 통계 업데이트 스크립트 (Firebase REST API 사용)
 */

const https = require('https');

const projectId = 'imagefactory-5ccc6';
const apiKey = 'AIzaSyAFehtzPYQTzXscJPm2-yqKK5GGXKQDIX0';

// Firestore REST API 호출
function firestoreRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `/v1/projects/${projectId}/databases/(default)/documents${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function updateUserStats(email) {
  try {
    console.log(`\n🔍 ${email} 통계 업데이트 시작...\n`);

    // 1. 사용자 찾기
    console.log('1️⃣  사용자 검색 중...');
    const usersResponse = await firestoreRequest('/users');
    const users = usersResponse.documents || [];
    
    const userDoc = users.find(doc => {
      const emailField = doc.fields?.email?.stringValue;
      return emailField === email;
    });

    if (!userDoc) {
      console.log(`❌ 사용자를 찾을 수 없습니다: ${email}\n`);
      return;
    }

    const userId = userDoc.name.split('/').pop();
    const displayName = userDoc.fields?.displayName?.stringValue || '사용자';
    console.log(`✅ 사용자 발견: ${displayName} (${userId})\n`);

    // 2. 이미지 생성 내역 조회
    console.log('2️⃣  이미지 생성 내역 조회 중...');
    const generationsResponse = await firestoreRequest('/imageGenerations');
    const generations = (generationsResponse.documents || []).filter(doc => {
      const docUserId = doc.fields?.userId?.stringValue;
      const status = doc.fields?.status?.stringValue;
      return docUserId === userId && status === 'completed';
    });

    console.log(`✅ 완료된 생성 작업: ${generations.length}건\n`);

    // 3. 통계 계산
    let totalImages = 0;
    let totalPoints = 0;

    generations.forEach(doc => {
      const images = doc.fields?.totalImages?.integerValue || 0;
      const points = doc.fields?.totalPoints?.integerValue || 0;
      totalImages += parseInt(images);
      totalPoints += parseInt(points);
    });

    console.log('📊 계산된 통계:');
    console.log(`   - 총 생성 작업: ${generations.length}건`);
    console.log(`   - 총 생성 이미지: ${totalImages}장`);
    console.log(`   - 총 사용 포인트: ${totalPoints}pt\n`);

    // 4. Firestore 업데이트 (PATCH)
    console.log('3️⃣  통계 업데이트 중...');
    
    const updateBody = {
      fields: {
        'stats': {
          mapValue: {
            fields: {
              totalGenerations: { integerValue: generations.length.toString() },
              totalImages: { integerValue: totalImages.toString() },
              totalPointsUsed: { integerValue: totalPoints.toString() },
              totalPointsPurchased: { integerValue: userDoc.fields?.stats?.mapValue?.fields?.totalPointsPurchased?.integerValue || '0' },
            }
          }
        }
      }
    };

    await firestoreRequest(
      `/users/${userId}?updateMask.fieldPaths=stats`,
      'PATCH',
      updateBody
    );

    console.log('✅ 통계 업데이트 완료!\n');

  } catch (error) {
    console.error('❌ 에러:', error.message);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   📊 사용자 통계 업데이트                        ║');
  console.log('╚════════════════════════════════════════════════════╝');

  await updateUserStats('sminju98@gmail.com');
  await updateUserStats('thdalswn98@naver.com');

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   ✅ 모든 계정 통계 업데이트 완료!              ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
}

main();


