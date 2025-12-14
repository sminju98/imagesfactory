/**
 * Google Cloud TTS API 테스트 (Veo3와 동일한 API 키 사용)
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_VEO3_API_KEY || 'AQ.Ab8RN6L3NRDmxQpk4-ccsCNmP3-6wbeeDBAsPC-KfaPFL_G1Uw';

if (!apiKey) {
  console.error('❌ GOOGLE_AI_API_KEY 또는 GOOGLE_VEO3_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('✅ API 키 확인됨:', apiKey.substring(0, 15) + '...');

// 테스트 텍스트
const testText = '안녕하세요. 이미지팩토리입니다. 릴스 자동 제작 기능을 테스트하고 있습니다.';

async function testGoogleTTS() {
  console.log('\n🎤 Google Cloud TTS API 테스트 시작 (Veo3 API 키 사용)...\n');
  console.log('📝 테스트 텍스트:', testText);
  console.log('');

  try {
    // 방법 1: 일반 Google Cloud TTS API
    const apiUrl1 = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    console.log('🌐 방법 1: Google Cloud TTS API');
    console.log('📤 요청 전송 중...\n');

    const response1 = await fetch(apiUrl1, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          text: testText,
        },
        voice: {
          languageCode: 'ko-KR',
          name: 'ko-KR-Neural2-A', // 한국어 여성 음성 (Neural2)
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
        },
      }),
    });

    console.log('📊 응답 상태:', response1.status, response1.statusText);

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ 방법 1 성공!');
      
      if (data1.audioContent) {
        const audioLength = data1.audioContent.length;
        console.log('📦 오디오 데이터 크기:', Math.round(audioLength / 1024), 'KB');
        
        // Base64 디코딩하여 파일로 저장
        const fs = require('fs');
        const path = require('path');
        const buffer = Buffer.from(data1.audioContent, 'base64');
        const outputPath = path.join(__dirname, 'test-google-tts-output.mp3');
        fs.writeFileSync(outputPath, buffer);
        console.log('💾 오디오 파일 저장됨:', outputPath);
        console.log('✅ TTS 테스트 성공!');
        return;
      }
    } else {
      const errorText1 = await response1.text();
      console.error('❌ 방법 1 실패:');
      try {
        const errorJson = JSON.parse(errorText1);
        console.error(JSON.stringify(errorJson, null, 2));
      } catch {
        console.error(errorText1);
      }
    }

    // 방법 2: Gemini API를 통한 TTS (시도)
    console.log('\n🌐 방법 2: Gemini API를 통한 TTS 시도...');
    const apiUrl2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const response2 = await fetch(apiUrl2, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `다음 텍스트를 음성으로 변환해주세요: ${testText}`,
          }],
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
        },
      }),
    });

    console.log('📊 응답 상태:', response2.status, response2.statusText);

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ 방법 2 성공!');
      console.log('📦 응답:', JSON.stringify(data2, null, 2).substring(0, 500));
    } else {
      const errorText2 = await response2.text();
      console.error('❌ 방법 2 실패:');
      try {
        const errorJson = JSON.parse(errorText2);
        console.error(JSON.stringify(errorJson, null, 2));
      } catch {
        console.error(errorText2);
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error(error.message);
    console.error(error.stack);
  }
}

testGoogleTTS()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });


