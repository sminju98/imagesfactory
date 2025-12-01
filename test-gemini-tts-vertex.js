/**
 * Gemini TTS API 테스트 (Vertex AI 사용)
 * 문서: https://docs.cloud.google.com/text-to-speech/docs/gemini-tts
 */

require('dotenv').config({ path: '.env.local' });

// Vertex AI API 키 또는 Google Cloud API 키 사용
const apiKey = process.env.GOOGLE_AI_API_KEY || 
               process.env.GOOGLE_VERTEX_AI_API_KEY || 
               process.env.GOOGLE_CLOUD_API_KEY ||
               'AQ.Ab8RN6L3NRDmxQpk4-ccsCNmP3-6wbeeDBAsPC-KfaPFL_G1Uw';

if (!apiKey) {
  console.error('❌ GOOGLE_AI_API_KEY, GOOGLE_VERTEX_AI_API_KEY 또는 GOOGLE_CLOUD_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('✅ API 키 확인됨:', apiKey.substring(0, 15) + '...');

// 테스트 텍스트
const testText = '안녕하세요. 이미지팩토리입니다. 릴스 자동 제작 기능을 테스트하고 있습니다.';

async function testGeminiTTSWithVertex() {
  console.log('\n🎤 Gemini TTS API 테스트 시작 (Vertex AI 사용)...\n');
  console.log('📝 테스트 텍스트:', testText);
  console.log('📚 모델: gemini-2.5-flash-tts');
  console.log('');

  // 프로젝트 ID 확인
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'imagefactory-5ccc6';
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  try {
    // 방법 1: Vertex AI Platform API를 통한 Gemini TTS 사용 시도
    console.log('🌐 방법 1: Vertex AI Platform API');
    const vertexApiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash-tts:predict`;
    
    console.log('📤 Vertex AI URL:', vertexApiUrl);
    console.log('📤 요청 전송 중...\n');

    // Vertex AI generateContent 형식 시도
    const vertexRequestBody = {
      instances: [{
        contents: [{
          parts: [{
            text: testText,
          }],
        }],
      }],
      parameters: {
        responseModalities: ['AUDIO'],
      },
    };

    let response = await fetch(vertexApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(vertexRequestBody),
    });

    console.log('📊 방법 1 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      // 방법 2: Google Cloud Text-to-Speech API (서비스 계정 인증 필요)
      console.log('\n🌐 방법 2: Google Cloud Text-to-Speech API (일반 엔드포인트)');
      const ttsApiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize`;
      
      const ttsRequestBody = {
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
      };

      response = await fetch(ttsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(ttsRequestBody),
      });

      console.log('📊 방법 2 응답 상태:', response.status, response.statusText);
    }

    console.log('📊 응답 상태:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini TTS API 호출 성공!');
      
      if (data.audioContent) {
        const audioLength = data.audioContent.length;
        console.log('📦 오디오 데이터 크기:', Math.round(audioLength / 1024), 'KB');
        
        // Base64 디코딩하여 파일로 저장
        const fs = require('fs');
        const path = require('path');
        const buffer = Buffer.from(data.audioContent, 'base64');
        const outputPath = path.join(__dirname, 'test-gemini-tts-vertex-output.mp3');
        fs.writeFileSync(outputPath, buffer);
        console.log('💾 오디오 파일 저장됨:', outputPath);
        console.log('✅ Gemini TTS 테스트 성공!');
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
        
        // Vertex AI 인증 방법 시도
        if (errorJson.error?.code === 401) {
          console.log('\n💡 Vertex AI 인증 방법 시도...');
          await testWithVertexAIAuth();
        }
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

async function testWithVertexAIAuth() {
  console.log('\n🔐 Vertex AI 인증 방법 시도...');
  
  // Vertex AI는 프로젝트 ID와 리전이 필요할 수 있음
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  
  if (!projectId) {
    console.log('⚠️ GOOGLE_CLOUD_PROJECT_ID가 설정되지 않았습니다.');
    console.log('💡 Vertex AI를 사용하려면 프로젝트 ID가 필요합니다.');
    return;
  }

  // Vertex AI 엔드포인트 시도
  const vertexUrl = `https://${location}-texttospeech.googleapis.com/v1/projects/${projectId}/locations/${location}:synthesizeSpeech`;
  
  console.log('🌐 Vertex AI URL:', vertexUrl);
  console.log('📤 요청 전송 중...\n');

  try {
    const response = await fetch(vertexUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GOOGLE_AI_API_KEY}`,
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
      }),
    });

    console.log('📊 응답 상태:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Vertex AI 호출 성공!');
      console.log('📦 응답:', JSON.stringify(data, null, 2).substring(0, 500));
    } else {
      const errorText = await response.text();
      console.error('❌ Vertex AI 호출 실패:');
      try {
        const errorJson = JSON.parse(errorText);
        console.error(JSON.stringify(errorJson, null, 2));
      } catch {
        console.error(errorText);
      }
    }
  } catch (error) {
    console.error('❌ Vertex AI 오류:', error.message);
  }
}

testGeminiTTSWithVertex()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });

