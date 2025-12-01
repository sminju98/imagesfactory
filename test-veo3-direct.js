/**
 * Veo3 API 직접 테스트
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_AI_API_KEY || 'AIzaSyCZPfh2jUaN4kNt5QuTgiDIp_aKlbrA_gU';

if (!apiKey) {
  console.error('❌ GOOGLE_AI_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('✅ API 키 확인됨:', apiKey.substring(0, 15) + '...');

async function testVeo3() {
  console.log('\n🎥 Veo3 API 테스트 시작...\n');

  const testPrompt = 'A person working late at night on a computer, tired expression, dim lighting';
  const model = 'veo-3.1-generate-preview';

  try {
    console.log('📝 테스트 프롬프트:', testPrompt);
    console.log('🌐 API URL:', `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateVideos`);
    console.log('📤 요청 전송 중...\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateVideos?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          aspect_ratio: '9:16',
          duration_seconds: 8,
        }),
      }
    );

    console.log('📊 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 오류 응답:');
      console.error(errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API 호출 성공!');
    console.log('📦 응답 데이터:', JSON.stringify(data, null, 2));

    if (data.name || data.operation) {
      const operationId = data.name || data.operation?.name;
      console.log('\n🎬 Operation ID:', operationId);
      console.log('💡 이 Operation ID로 작업 상태를 확인할 수 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error(error.message);
  }
}

testVeo3();

