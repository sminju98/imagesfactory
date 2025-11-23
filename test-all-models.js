/**
 * 모든 AI 모델 테스트 스크립트
 */

const prompt = "beautiful Korean woman with flawless skin, professional model photoshoot for plastic surgery clinic advertisement, natural makeup, elegant pose, studio lighting, high resolution, photorealistic, detailed facial features";

// 모든 모델 테스트 (각 1장씩)
const selectedModels = {
  'pixart': 1,        // 50pt - 초저가 초고속
  'realistic-vision': 1,  // 60pt - 인물 특화
  'flux': 1,          // 80pt - 초고속
  'sdxl': 1,          // 100pt - 범용 추천
  'leonardo': 1,      // 120pt - 일러스트
  'dall-e-3': 1,      // 200pt - 최고품질
  'aurora': 1,        // 250pt - Grok
  'ideogram': 1,      // 280pt - 텍스트 특화
};

async function testAllModels() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   🎨 모든 AI 모델 테스트 (각 1장씩)                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const totalModels = Object.keys(selectedModels).length;
  const totalPoints = Object.entries(selectedModels).reduce((sum, [modelId, count]) => {
    const points = {
      'pixart': 50,
      'realistic-vision': 60,
      'flux': 80,
      'sdxl': 100,
      'leonardo': 120,
      'dall-e-3': 200,
      'aurora': 250,
      'ideogram': 280,
    }[modelId] || 100;
    return sum + (points * count);
  }, 0);

  console.log('📝 테스트 정보:');
  console.log('   - 프롬프트:', prompt.substring(0, 60) + '...');
  console.log('   - 테스트 모델:', totalModels, '개');
  console.log('   - 총 이미지 수:', totalModels, '장');
  console.log('   - 예상 소요 포인트:', totalPoints, 'pt');
  console.log('   - 예상 소요 시간: 약 2-3분\n');

  console.log('🤖 테스트할 모델 목록:');
  Object.keys(selectedModels).forEach((modelId, index) => {
    const modelNames = {
      'pixart': 'PixArt-Σ (초저가 초고속)',
      'realistic-vision': 'Realistic Vision (인물 특화)',
      'flux': 'Flux Schnell (초고속)',
      'sdxl': 'Stable Diffusion XL (범용)',
      'leonardo': 'Leonardo.ai (일러스트)',
      'dall-e-3': 'DALL-E 3 (최고품질)',
      'aurora': 'Aurora (Grok)',
      'ideogram': 'Ideogram (텍스트 특화)',
    };
    console.log(`   ${index + 1}. ${modelNames[modelId]}`);
  });
  console.log('');

  const requestBody = {
    userId: 'AskSOXPSv0bvPImnv55EOYwL5tb2',
    prompt: prompt,
    email: 'sminju98@gmail.com',
    selectedModels: selectedModels,
  };

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
      console.log('📍 실시간 진행 상황:');
      console.log('   👉 http://localhost:3000/generation/' + data.data.generationId);
      console.log('');
      console.log('⏳ 이미지 생성 중...');
      console.log('   - 각 모델별로 순차적으로 생성됩니다');
      console.log('   - 완료되면 ZIP 파일과 함께 이메일로 전송됩니다!');
      console.log('   - 📧 메일함을 확인해주세요!\n');
    } else {
      console.error('❌ 요청 실패:', data.error);
    }
  } catch (error) {
    console.error('❌ API 호출 에러:', error.message);
  }
}

testAllModels();

