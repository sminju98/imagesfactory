/**
 * Veo 3 비디오 생성 API 테스트
 * Google AI Studio의 Veo 3 모델을 사용하여 비디오 생성 테스트
 */

const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경 변수 읽기
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      });
    }
  } catch (error) {
    console.error('환경 변수 로드 실패:', error.message);
  }
}

loadEnv();

async function testVeo3VideoGeneration() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GOOGLE_AI_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  console.log('🎬 [Veo 3] 비디오 생성 테스트 시작...\n');

  // 테스트 프롬프트
  const testPrompt = 'A serene sunset over a calm ocean with gentle waves, cinematic quality, 4K resolution';
  
  console.log(`📝 프롬프트: ${testPrompt}\n`);

  try {
    // Veo 3 API 엔드포인트 시도
    // 모델명: veo-3.0-generate-preview
    const endpoints = [
      {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:generateVideos',
        body: {
          prompt: testPrompt,
          negative_prompt: 'low quality, blurry, distorted',
        },
      },
      {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:generateContent',
        body: {
          contents: [{
            parts: [{
              text: testPrompt,
            }],
          }],
        },
      },
      {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:generate',
        body: {
          prompt: testPrompt,
        },
      },
    ];

    for (const { url, body } of endpoints) {
      console.log(`🔍 엔드포인트 시도: ${url}`);
      
      try {
        const response = await fetch(`${url}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const responseText = await response.text();
        let data;
        
        try {
          data = JSON.parse(responseText);
        } catch {
          console.log(`❌ JSON 파싱 실패. 응답: ${responseText.substring(0, 200)}`);
          continue;
        }
        
        if (response.ok) {
          console.log('✅ 성공! 응답:', JSON.stringify(data, null, 2));
          
          // 비동기 작업인 경우 operation 정보 확인
          if (data.name) {
            console.log(`\n📋 비동기 작업 생성됨: ${data.name}`);
            console.log('💡 이 작업은 시간이 걸릴 수 있습니다. operation을 폴링해야 합니다.');
          }
          
          return data;
        } else {
          console.log(`❌ 실패 (${response.status}):`, JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.log(`❌ 에러: ${error.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }

  // 사용 가능한 모델 목록 조회
  console.log('\n📋 사용 가능한 모델 목록 조회 중...\n');
  
  try {
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const modelsData = await modelsResponse.json();
    
    if (modelsResponse.ok) {
      console.log(`✅ 총 ${modelsData.models?.length || 0}개 모델 발견\n`);
      
      // Veo 관련 모델 검색
      const veoModels = modelsData.models?.filter(m => 
        m.name?.toLowerCase().includes('veo') || 
        m.displayName?.toLowerCase().includes('veo') ||
        m.name?.toLowerCase().includes('video') ||
        m.displayName?.toLowerCase().includes('video')
      );
      
      if (veoModels && veoModels.length > 0) {
        console.log('🎬 Veo/Video 관련 모델:');
        veoModels.forEach(model => {
          console.log(`  - ${model.name}`);
          console.log(`    Display: ${model.displayName || 'N/A'}`);
          console.log(`    Description: ${model.description || 'N/A'}`);
          console.log(`    Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('⚠️ Veo/Video 관련 모델을 찾을 수 없습니다.\n');
      }
      
      // 모든 모델 이름 출력 (참고용)
      console.log('📋 전체 모델 목록:');
      modelsData.models?.forEach(model => {
        console.log(`  - ${model.name}${model.supportedGenerationMethods?.includes('generateContent') ? ' (generateContent 지원)' : ''}`);
      });
      
      // generateVideos 메서드를 지원하는 모델 찾기
      const videoModels = modelsData.models?.filter(m => 
        m.supportedGenerationMethods?.some(method => 
          method.toLowerCase().includes('video') || 
          method.toLowerCase().includes('generate')
        )
      );
      
      if (videoModels && videoModels.length > 0) {
        console.log('\n🎥 비디오 생성 관련 메서드를 지원하는 모델:');
        videoModels.forEach(model => {
          console.log(`  - ${model.name}: ${model.supportedGenerationMethods?.join(', ')}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ 모델 목록 조회 실패:', error.message);
  }
}

// 실행
testVeo3VideoGeneration()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });

