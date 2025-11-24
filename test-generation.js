/**
 * 이미지 생성 API 테스트 스크립트
 */

async function testImageGeneration() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   🧪 이미지 생성 테스트                             ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const prompt = "beautiful Korean woman with flawless skin, professional model photoshoot, plastic surgery clinic advertisement style, natural makeup, elegant pose, studio lighting, high resolution, photorealistic";

  // 테스트할 모델 (1장씩)
  const selectedModels = {
    'sdxl': 1,
    'flux': 1,
    'pixart': 1,
    'realistic-vision': 1,
  };

  const requestBody = {
    userId: 'AskSOXPSv0bvPImnv55EOYwL5tb2', // sminju98@gmail.com
    prompt: prompt,
    email: 'sminju98@gmail.com',
    selectedModels: selectedModels,
  };

  console.log('📝 요청 정보:');
  console.log('   - 프롬프트:', prompt.substring(0, 50) + '...');
  console.log('   - 이메일:', requestBody.email);
  console.log('   - 모델:', Object.keys(selectedModels).join(', '));
  console.log('   - 총 이미지 수:', Object.values(selectedModels).reduce((a, b) => a + b, 0), '장\n');

  try {
    console.log('🚀 API 호출 중...\n');
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ 이미지 생성 요청 성공!');
      console.log('   - Generation ID:', data.data.generationId);
      console.log('   - 총 이미지:', data.data.totalImages, '장');
      console.log('   - 소요 포인트:', data.data.totalPoints, 'pt');
      console.log('');
      console.log('📍 결과 확인:');
      console.log('   👉 http://localhost:3000/generation/' + data.data.generationId);
      console.log('');
      console.log('⏳ 이미지 생성 중... (약 30초~1분 소요)');
      console.log('   완료되면 이메일로 전송됩니다!\n');
    } else {
      console.error('❌ 요청 실패:', data.error);
    }
  } catch (error) {
    console.error('❌ API 호출 에러:', error.message);
  }
}

testImageGeneration();


