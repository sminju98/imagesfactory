/**
 * Gemini TTS API 테스트 (서비스 계정 인증)
 */

require('dotenv').config({ path: '.env.local' });

const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const path = require('path');

// 서비스 계정 JSON 파일 경로
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                       path.join(__dirname, 'imagefactory-5ccc6-ef0b85c83dfe.json');
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'imagefactory-5ccc6';

console.log('✅ 서비스 계정 파일:', credentialsPath);
console.log('✅ 프로젝트 ID:', projectId);

// 테스트 텍스트
const testText = '안녕하세요. 이미지팩토리입니다. 릴스 자동 제작 기능을 테스트하고 있습니다.';

async function testGeminiTTSWithServiceAccount() {
  console.log('\n🎤 Gemini TTS API 테스트 시작 (서비스 계정 인증)...\n');
  console.log('📝 테스트 텍스트:', testText);
  console.log('📚 모델: gemini-2.5-flash-tts');
  console.log('');

  try {
    const client = new TextToSpeechClient({
      keyFilename: credentialsPath,
      projectId,
    });

    console.log('📤 요청 전송 중...\n');

    const request = {
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
      // Gemini TTS 모델 지정
      model: 'gemini-2.5-flash-tts',
    };

    const [response] = await client.synthesizeSpeech(request);

    console.log('✅ Gemini TTS API 호출 성공!');

    if (response.audioContent) {
      const audioLength = response.audioContent.length;
      console.log('📦 오디오 데이터 크기:', Math.round(audioLength / 1024), 'KB');
      
      // Base64 인코딩하여 파일로 저장
      const fs = require('fs');
      const buffer = Buffer.from(response.audioContent);
      const outputPath = path.join(__dirname, 'test-gemini-tts-service-account-output.mp3');
      fs.writeFileSync(outputPath, buffer);
      console.log('💾 오디오 파일 저장됨:', outputPath);
      console.log('✅ Gemini TTS 테스트 성공!');
    } else {
      console.log('❌ 응답에 audioContent가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error(error.message);
    if (error.details) {
      console.error('상세 오류:', JSON.stringify(error.details, null, 2));
    }
    console.error(error.stack);
  }
}

testGeminiTTSWithServiceAccount()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });


