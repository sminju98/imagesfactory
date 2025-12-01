/**
 * Pixazo VibeVoice TTS API 테스트 스크립트
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.PIXAZO_API_KEY;

if (!apiKey) {
  console.error('❌ PIXAZO_API_KEY가 설정되지 않았습니다.');
  console.log('💡 .env.local 파일에 PIXAZO_API_KEY를 설정해주세요.');
  process.exit(1);
}

console.log('✅ API 키 확인됨:', apiKey.substring(0, 8) + '...');

// 테스트 텍스트
const testText = '안녕하세요. 이미지팩토리입니다. 릴스 자동 제작 기능을 테스트하고 있습니다.';

async function testPixazoTTS() {
  console.log('\n🎤 Pixazo TTS API 테스트 시작...\n');
  console.log('⚠️  참고: VibeVoice는 한국어를 지원하지 않습니다 (영어/중국어만 지원)');
  console.log('💡 한국어 TTS를 위해서는 Pixazo의 다른 TTS 모델을 사용해야 합니다.\n');
  console.log('📝 테스트 텍스트:', testText);
  console.log('');

  try {
    // Pixazo API 엔드포인트 시도
    // 실제 엔드포인트는 API 콘솔에서 확인 필요
    const possibleEndpoints = [
      'https://api.pixazo.ai/v1/tts',
      'https://api.pixazo.com/v1/tts',
      'https://api.pixazo.ai/v1/text-to-speech',
      'https://api.pixazo.com/v1/text-to-speech',
      'https://api.pixazo.ai/v1/synthesize',
      'https://api.pixazo.com/v1/synthesize',
    ];

    for (const apiUrl of possibleEndpoints) {
    
      console.log(`\n🌐 시도 중: ${apiUrl}`);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: testText,
            voice: 'ko-KR-Standard-A', // 한국어 여성 음성
            speed: 1.0,
            pitch: 0,
            format: 'mp3',
          }),
        });

        console.log('📊 응답 상태:', response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ API 호출 성공!');
          console.log('📦 응답 데이터:', JSON.stringify(data, null, 2));

          if (data.audio_url || data.url || data.file_url) {
            const audioUrl = data.audio_url || data.url || data.file_url;
            console.log('\n🎵 음성 파일 URL:', audioUrl);
            console.log('⏱️  길이:', data.duration || data.duration_seconds || 'N/A', '초');
          }
          return; // 성공하면 종료
        } else {
          const errorText = await response.text();
          if (errorText.length < 500) {
            console.log('❌ 실패:', errorText.substring(0, 200));
          }
        }
      } catch (err) {
        console.log('❌ 네트워크 오류:', err.message);
      }
    }
    
    console.log('\n❌ 모든 엔드포인트 시도 실패');
    console.log('\n💡 다음을 확인해주세요:');
    console.log('1. Pixazo API 콘솔에서 한국어를 지원하는 TTS 모델 확인');
    console.log('2. API 문서에서 정확한 엔드포인트 확인');
    console.log('3. 모델명(voice) 파라미터 확인');
    console.log('\n📚 참고 링크:');
    console.log('   - API 콘솔: https://api-console.pixazo.ai/api_keys?product=vibevoice');
    console.log('   - 모델 목록: https://www.pixazo.ai/models/');

  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error(error.message);
    console.error('\n💡 가능한 원인:');
    console.error('1. API 엔드포인트가 잘못되었을 수 있습니다.');
    console.error('2. API 키가 유효하지 않을 수 있습니다.');
    console.error('3. 네트워크 연결 문제일 수 있습니다.');
    console.error('\n📚 Pixazo VibeVoice API 문서를 확인해주세요:');
    console.error('   https://api-console.pixazo.ai/api_keys?product=vibevoice');
  }
}

testPixazoTTS();

