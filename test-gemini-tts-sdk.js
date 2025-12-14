/**
 * Gemini TTS API 테스트 (@google/genai SDK 사용)
 */

require('dotenv').config({ path: '.env.local' });

const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_VEO3_API_KEY || 'AQ.Ab8RN6L3NRDmxQpk4-ccsCNmP3-6wbeeDBAsPC-KfaPFL_G1Uw';

if (!apiKey) {
  console.error('❌ GOOGLE_AI_API_KEY 또는 GOOGLE_VEO3_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('✅ API 키 확인됨:', apiKey.substring(0, 15) + '...');

// 테스트 텍스트
const testText = '안녕하세요. 이미지팩토리입니다. 릴스 자동 제작 기능을 테스트하고 있습니다.';

async function testGeminiTTSWithSDK() {
  console.log('\n🎤 Gemini TTS API 테스트 시작 (@google/genai SDK 사용)...\n');
  console.log('📝 테스트 텍스트:', testText);
  console.log('');

  try {
    const ai = new GoogleGenAI({
      apiKey,
    });

    console.log('🔍 사용 가능한 메서드 확인 중...\n');

    // 방법 1: models.generateContent를 AUDIO 모달리티로 시도
    console.log('🌐 방법 1: models.generateContent (AUDIO 모달리티)');
    
    try {
      const response1 = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{
          parts: [{
            text: testText,
          }],
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
        },
      });

      console.log('✅ 방법 1 성공!');
      console.log('📦 응답:', JSON.stringify(response1, null, 2).substring(0, 1000));
    } catch (error1) {
      console.error('❌ 방법 1 실패:', error1.message);
    }

    // 방법 2: models.generateSpeech 시도 (존재하는 경우)
    console.log('\n🌐 방법 2: models.generateSpeech');
    
    try {
      if (ai.models.generateSpeech) {
        const response2 = await ai.models.generateSpeech({
          text: testText,
          languageCode: 'ko-KR',
          voice: {
            name: 'ko-KR-Neural2-A',
          },
        });

        console.log('✅ 방법 2 성공!');
        console.log('📦 응답:', JSON.stringify(response2, null, 2).substring(0, 1000));
      } else {
        console.log('⚠️ models.generateSpeech 메서드가 없습니다.');
      }
    } catch (error2) {
      console.error('❌ 방법 2 실패:', error2.message);
    }

    // 방법 3: 직접 REST API 호출 (Gemini TTS 엔드포인트)
    console.log('\n🌐 방법 3: REST API 직접 호출 (Gemini TTS)');
    
    try {
      // Google AI Studio의 Speech API 엔드포인트
      const response3 = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateSpeech?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: testText,
            languageCode: 'ko-KR',
            voice: {
              name: 'ko-KR-Neural2-A',
            },
          }),
        }
      );

      console.log('📊 응답 상태:', response3.status, response3.statusText);

      if (response3.ok) {
        const data3 = await response3.json();
        console.log('✅ 방법 3 성공!');
        console.log('📦 응답:', JSON.stringify(data3, null, 2).substring(0, 1000));
      } else {
        const errorText3 = await response3.text();
        console.error('❌ 방법 3 실패:');
        try {
          const errorJson = JSON.parse(errorText3);
          console.error(JSON.stringify(errorJson, null, 2));
        } catch {
          console.error(errorText3);
        }
      }
    } catch (error3) {
      console.error('❌ 방법 3 오류:', error3.message);
    }

  } catch (error) {
    console.error('❌ 전체 오류:', error.message);
    console.error(error.stack);
  }
}

testGeminiTTSWithSDK()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });


