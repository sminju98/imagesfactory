/**
 * Gemini TTS API 테스트
 * Google AI Studio의 Gemini API를 통한 TTS 사용
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

async function testGeminiTTS() {
  console.log('\n🎤 Gemini TTS API 테스트 시작...\n');
  console.log('📝 테스트 텍스트:', testText);
  console.log('');

  // 방법 1: Gemini API의 generateContent를 통한 TTS 시도
  console.log('🌐 방법 1: Gemini API generateContent (AUDIO 모달리티)');
  
  try {
    const apiUrl1 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    console.log('📤 요청 전송 중...\n');

    const response1 = await fetch(apiUrl1, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testText,
          }],
        }],
        generationConfig: {
          responseModalities: ['AUDIO'], // 오디오 응답 요청
        },
      }),
    });

    console.log('📊 응답 상태:', response1.status, response1.statusText);

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ 방법 1 성공!');
      console.log('📦 응답 구조:', JSON.stringify(data1, null, 2).substring(0, 1000));
      
      // 오디오 데이터 추출 시도
      if (data1.candidates?.[0]?.content?.parts) {
        for (const part of data1.candidates[0].content.parts) {
          if (part.inlineData?.mimeType?.startsWith('audio/')) {
            console.log('🎵 오디오 데이터 발견!');
            console.log('📦 MIME 타입:', part.inlineData.mimeType);
            console.log('📦 데이터 크기:', part.inlineData.data.length, 'bytes');
            
            // Base64 디코딩하여 파일로 저장
            const fs = require('fs');
            const path = require('path');
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            const outputPath = path.join(__dirname, 'test-gemini-tts-output.mp3');
            fs.writeFileSync(outputPath, buffer);
            console.log('💾 오디오 파일 저장됨:', outputPath);
            console.log('✅ Gemini TTS 테스트 성공!');
            return;
          }
        }
      }
      
      console.log('⚠️ 응답에 오디오 데이터가 없습니다.');
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
  } catch (error) {
    console.error('❌ 방법 1 오류:', error.message);
  }

  // 방법 2: Google Cloud Text-to-Speech API의 Gemini TTS 엔드포인트 시도
  console.log('\n🌐 방법 2: Google Cloud TTS API (Gemini TTS 엔진)');
  
  try {
    // Gemini TTS는 Google Cloud TTS API를 통해 사용할 수 있음
    // 엔진: gemini-tts
    const apiUrl2 = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    const response2 = await fetch(apiUrl2, {
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
          name: 'ko-KR-Neural2-A',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
        },
        // Gemini TTS 엔진 사용 (가능한 경우)
        // engine: 'gemini-tts', // 이 옵션이 지원되는지 확인 필요
      }),
    });

    console.log('📊 응답 상태:', response2.status, response2.statusText);

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ 방법 2 성공!');
      
      if (data2.audioContent) {
        const audioLength = data2.audioContent.length;
        console.log('📦 오디오 데이터 크기:', Math.round(audioLength / 1024), 'KB');
        
        // Base64 디코딩하여 파일로 저장
        const fs = require('fs');
        const path = require('path');
        const buffer = Buffer.from(data2.audioContent, 'base64');
        const outputPath = path.join(__dirname, 'test-gemini-tts-output2.mp3');
        fs.writeFileSync(outputPath, buffer);
        console.log('💾 오디오 파일 저장됨:', outputPath);
        console.log('✅ Gemini TTS 테스트 성공!');
        return;
      }
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
    console.error('❌ 방법 2 오류:', error.message);
  }

  // 방법 3: Google AI Studio의 Speech API 시도
  console.log('\n🌐 방법 3: Google AI Studio Speech API');
  
  try {
    // Google AI Studio의 Speech API 엔드포인트 확인
    const apiUrl3 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateSpeech?key=${apiKey}`;
    
    const response3 = await fetch(apiUrl3, {
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
    });

    console.log('📊 응답 상태:', response3.status, response3.statusText);

    if (response3.ok) {
      const data3 = await response3.json();
      console.log('✅ 방법 3 성공!');
      console.log('📦 응답:', JSON.stringify(data3, null, 2).substring(0, 500));
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
  } catch (error) {
    console.error('❌ 방법 3 오류:', error.message);
  }
}

testGeminiTTS()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });

