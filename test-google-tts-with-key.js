/**
 * Google Cloud TTS API 테스트 (제공된 API 키 사용)
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_TTS_API_KEY || 'AQ.Ab8RN6IKMdyF25KSZlr22cf029PUqUw5XM_As0-GT9wK-Z4eog';

if (!apiKey) {
  console.error('❌ GOOGLE_TTS_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('✅ API 키 확인됨:', apiKey.substring(0, 15) + '...');

// 테스트 텍스트
const testText = '안녕하세요. 이미지팩토리입니다. 릴스 자동 제작 기능을 테스트하고 있습니다.';

async function testGoogleTTS() {
  console.log('\n🎤 Google Cloud TTS API 테스트 시작...\n');
  console.log('📝 테스트 텍스트:', testText);
  console.log('');

  try {
    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    console.log('🌐 API URL:', apiUrl.replace(apiKey, '***'));
    console.log('📤 요청 전송 중...\n');

    const response = await fetch(apiUrl, {
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

    console.log('📊 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 오류 응답:');
      try {
        const errorJson = JSON.parse(errorText);
        console.error(JSON.stringify(errorJson, null, 2));
      } catch {
        console.error(errorText);
      }
      return;
    }

    const data = await response.json();
    console.log('✅ API 호출 성공!');
    
    if (data.audioContent) {
      const audioLength = data.audioContent.length;
      console.log('📦 오디오 데이터 크기:', Math.round(audioLength / 1024), 'KB');
      console.log('🎵 Base64 인코딩된 오디오 데이터를 받았습니다.');
      
      // Base64 디코딩하여 파일로 저장
      const fs = require('fs');
      const path = require('path');
      const buffer = Buffer.from(data.audioContent, 'base64');
      const outputPath = path.join(__dirname, 'test-google-tts-output.mp3');
      fs.writeFileSync(outputPath, buffer);
      console.log('💾 오디오 파일 저장됨:', outputPath);
      console.log('✅ TTS 테스트 성공!');
    } else {
      console.log('❌ 응답에 audioContent가 없습니다.');
      console.log('📦 전체 응답:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error(error.message);
  }
}

testGoogleTTS();

