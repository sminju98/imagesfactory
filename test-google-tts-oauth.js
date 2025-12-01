/**
 * Google Cloud TTS API 테스트 (OAuth2 토큰 사용)
 */

require('dotenv').config({ path: '.env.local' });

// 제공된 TTS 키를 OAuth2 토큰으로 사용
const oauthToken = process.env.GOOGLE_TTS_API_KEY || 'AQ.Ab8RN6IKMdyF25KSZlr22cf029PUqUw5XM_As0-GT9wK-Z4eog';

if (!oauthToken) {
  console.error('❌ GOOGLE_TTS_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('✅ OAuth2 토큰 확인됨:', oauthToken.substring(0, 15) + '...');

// 테스트 텍스트
const testText = '안녕하세요. 이미지팩토리입니다. 릴스 자동 제작 기능을 테스트하고 있습니다.';

async function testGoogleTTSWithOAuth() {
  console.log('\n🎤 Google Cloud TTS API 테스트 시작 (OAuth2 토큰 사용)...\n');
  console.log('📝 테스트 텍스트:', testText);
  console.log('');

  try {
    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize`;
    
    console.log('🌐 API URL:', apiUrl);
    console.log('📤 요청 전송 중...\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oauthToken}`, // OAuth2 토큰 사용
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

    if (response.ok) {
      const data = await response.json();
      console.log('✅ TTS API 호출 성공!');
      
      if (data.audioContent) {
        const audioLength = data.audioContent.length;
        console.log('📦 오디오 데이터 크기:', Math.round(audioLength / 1024), 'KB');
        
        // Base64 디코딩하여 파일로 저장
        const fs = require('fs');
        const path = require('path');
        const buffer = Buffer.from(data.audioContent, 'base64');
        const outputPath = path.join(__dirname, 'test-google-tts-oauth-output.mp3');
        fs.writeFileSync(outputPath, buffer);
        console.log('💾 오디오 파일 저장됨:', outputPath);
        console.log('✅ TTS 테스트 성공!');
        return;
      } else {
        console.log('❌ 응답에 audioContent가 없습니다.');
        console.log('📦 전체 응답:', JSON.stringify(data, null, 2));
      }
    } else {
      const errorText = await response.text();
      console.error('❌ API 오류 응답:');
      try {
        const errorJson = JSON.parse(errorText);
        console.error(JSON.stringify(errorJson, null, 2));
      } catch {
        console.error(errorText);
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error(error.message);
    console.error(error.stack);
  }
}

testGoogleTTSWithOAuth()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });

