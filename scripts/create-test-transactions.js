/**
 * 테스트 거래 내역 생성 (Firebase REST API 사용)
 */

const https = require('https');

const projectId = 'imagefactory-5ccc6';
const users = {
  'sminju98@gmail.com': 'AskSOXPSv0bvPImnv55EOYwL5tb2',
  'thdalswn98@naver.com': 'ehjWIu2CaLUQH0uYDhi5uKHDhov2',
};

function firestoreRequest(path, method = 'POST', body = null) {
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

async function createTransaction(userId, txData) {
  const body = {
    fields: {
      userId: { stringValue: userId },
      amount: { integerValue: txData.amount.toString() },
      type: { stringValue: txData.type },
      description: { stringValue: txData.description },
      balanceBefore: { integerValue: txData.balanceBefore.toString() },
      balanceAfter: { integerValue: txData.balanceAfter.toString() },
      createdAt: { timestampValue: txData.createdAt },
    }
  };

  if (txData.relatedGenerationId) {
    body.fields.relatedGenerationId = { stringValue: txData.relatedGenerationId };
  }

  await firestoreRequest('/pointTransactions', 'POST', body);
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   💰 테스트 거래 내역 생성                       ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  for (const [email, userId] of Object.entries(users)) {
    console.log(`\n📝 ${email} 거래 내역 생성 중...\n`);

    const now = new Date();
    
    // 1. 가입 보너스
    await createTransaction(userId, {
      amount: 1000,
      type: 'bonus',
      description: '가입 보너스',
      balanceBefore: 0,
      balanceAfter: 1000,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    console.log('✅ 가입 보너스 거래 내역 생성');

    // 2. 관리자 포인트 지급 (10만 포인트)
    await createTransaction(userId, {
      amount: 100000,
      type: 'purchase',
      description: '관리자 포인트 지급',
      balanceBefore: 1000,
      balanceAfter: 101000,
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    });
    console.log('✅ 관리자 지급 거래 내역 생성');

    console.log(`\n✅ ${email} 거래 내역 생성 완료!\n`);
  }

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   ✅ 모든 거래 내역 생성 완료!                  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log('이제 마이페이지를 새로고침하면 거래 내역이 보일 것입니다!\n');
}

main();


