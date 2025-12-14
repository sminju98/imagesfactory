/**
 * Veo3 API 테스트 (Google GenAI SDK 사용)
 */

require('dotenv').config({ path: '.env.local' });

// @google/genai 패키지 import 시도
let GoogleGenAI;
try {
  GoogleGenAI = require('@google/genai').GoogleGenAI;
} catch (error) {
  console.error('❌ @google/genai 패키지를 찾을 수 없습니다.');
  console.error('설치: npm install @google/genai');
  process.exit(1);
}

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_VEO3_API_KEY || 'AQ.Ab8RN6L3NRDmxQpk4-ccsCNmP3-6wbeeDBAsPC-KfaPFL_G1Uw';

if (!apiKey) {
  console.error('❌ GOOGLE_AI_API_KEY 또는 GOOGLE_VEO3_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('✅ API 키 확인됨:', apiKey.substring(0, 15) + '...');

async function testVeo3() {
  console.log('\n🎥 Veo3 API 테스트 시작 (Google GenAI SDK 사용)...\n');

  const testPrompt = 'A person working late at night on a computer, tired expression, dim lighting, cinematic quality';

  try {
    const ai = new GoogleGenAI({
      apiKey,
    });

    console.log('📝 테스트 프롬프트:', testPrompt);
    console.log('🌐 모델: veo-3.1-generate-preview');
    console.log('📤 영상 생성 요청 전송 중...\n');

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: testPrompt,
      aspectRatio: '9:16',
      duration: 8,
    });

    console.log('✅ 작업 시작됨!');
    console.log('📋 Operation:', JSON.stringify(operation, null, 2).substring(0, 200));
    console.log('\n⏳ 영상 생성 완료 대기 중... (최대 5분)\n');

    let attempts = 0;
    const maxAttempts = 30; // 최대 5분 (10초 * 30)

    // 작업 완료까지 폴링
    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10초 대기
      
      console.log(`🔄 상태 확인 중... (${attempts + 1}/${maxAttempts})`);
      
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });

      attempts++;
    }

    if (operation.done) {
      if (operation.error) {
        console.error('❌ 영상 생성 실패:', operation.error);
        return;
      }

      if (operation.response?.generatedVideos?.[0]?.video) {
        const videoFile = operation.response.generatedVideos[0].video;
        console.log('✅ 영상 생성 완료!');
        console.log('📦 Video 파일:', JSON.stringify(videoFile, null, 2));
        
        // 영상 다운로드 (선택사항)
        const fs = require('fs');
        const path = require('path');
        const outputPath = path.join(__dirname, 'test-veo3-output.mp4');
        
        try {
          await ai.files.download({
            file: videoFile,
            downloadPath: outputPath,
          });
          console.log('💾 영상 다운로드 완료:', outputPath);
        } catch (downloadError) {
          console.warn('⚠️ 영상 다운로드 실패:', downloadError.message);
          console.log('💡 Video URI:', videoFile.uri || 'N/A');
        }
      } else {
        console.error('❌ 응답에 영상 데이터가 없습니다.');
        console.log('📦 전체 응답:', JSON.stringify(operation, null, 2));
      }
    } else {
      console.warn('⚠️ 시간 초과: 영상 생성이 아직 완료되지 않았습니다.');
      console.log('💡 나중에 operation을 다시 확인하세요.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error(error.message);
    console.error(error.stack);
  }
}

testVeo3()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });


