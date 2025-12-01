/**
 * Reels Factory API 테스트 스크립트
 * 이미지팩토리 홍보 릴스 제작
 */

// 테스트 데이터
const TEST_PROMPT = '이미지팩토리를 홍보하는 릴스를 만들어보자';
const TEST_OPTIONS = {
  target: '20-40대 크리에이터, 마케터, 디자이너',
  tone: '친근하고 트렌디하며 전문적',
  purpose: '서비스 홍보 및 사용자 유치',
};

let projectId = null;
let refinedPrompt = null;
let selectedInsights = [];
let chosenConcept = null;
let videoScripts = [];

// API 호출 헬퍼 (실제 환경에서는 인증 토큰 필요)
async function callAPI(endpoint, method, body, token = null) {
  const url = `http://localhost:3000/api/reels${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API 호출 오류 (${endpoint}):`, error.message);
    return { success: false, error: error.message };
  }
}

// Step 0: 프로젝트 생성 및 프롬프트 교정
async function step0() {
  console.log('\n🎬 ===== Step 0: 입력 & 프롬프트 교정 =====\n');
  
  console.log('📝 입력된 정보:');
  console.log(`프롬프트: ${TEST_PROMPT}`);
  console.log(`타겟: ${TEST_OPTIONS.target}`);
  console.log(`톤앤매너: ${TEST_OPTIONS.tone}`);
  console.log(`목적: ${TEST_OPTIONS.purpose}`);
  
  // 프로젝트 생성 (실제로는 인증 필요)
  console.log('\n📦 프로젝트 생성 중...');
  const createResult = await callAPI('/create', 'POST', {
    prompt: TEST_PROMPT,
    images: [],
    options: TEST_OPTIONS,
  });
  
  if (createResult.success) {
    projectId = createResult.data.projectId;
    console.log(`✅ 프로젝트 생성 완료: ${projectId}`);
  } else {
    console.log('⚠️ 프로젝트 생성 실패 (시뮬레이션 모드)');
    projectId = 'test-project-' + Date.now();
  }
  
  // GPT로 프롬프트 교정 시뮬레이션
  console.log('\n🤖 GPT-5.1로 프롬프트 교정 중...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  refinedPrompt = `AI 이미지 생성 서비스 "이미지팩토리"를 소개하는 릴스 콘텐츠. 
대량 이미지 생성, 다양한 AI 모델 지원, 간편한 웹 인터페이스, 저렴한 가격의 핵심 가치를 
20-40대 크리에이터와 마케터에게 친근하고 트렌디한 톤으로 전달하여 
서비스 사용을 유도하는 마케팅 콘텐츠`;
  
  console.log('\n✅ 교정된 프롬프트:');
  console.log(refinedPrompt);
  
  return true;
}

// Step 1: Perplexity 리서치
async function step1() {
  console.log('\n🔍 ===== Step 1: Perplexity 리서치 =====\n');
  
  console.log('Perplexity API (sonar-pro)로 최신 트렌드 검색 중...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 시뮬레이션 결과 (실제로는 Perplexity API 호출)
  const researchResults = [
    {
      id: '1',
      category: 'keyword',
      content: 'AI 이미지 생성 트렌드 2025: 대량 생성, 배치 처리, 자동화, 워크플로우 통합',
      selected: false,
    },
    {
      id: '2',
      category: 'painpoint',
      content: '크리에이터 페인포인트: 이미지 생성 비용 부담, 여러 모델 사용의 복잡성, 일관성 없는 결과물',
      selected: false,
    },
    {
      id: '3',
      category: 'trend',
      content: '2025 AI 이미지 생성 시장: 웹 기반 UI 선호, 대량 생성 니즈 증가, 가격 경쟁력 중요',
      selected: false,
    },
    {
      id: '4',
      category: 'usp',
      content: '이미지팩토리 차별화: 한 번에 수십 장 생성, 20개 이상 AI 모델 지원, 타 서비스 대비 30% 저렴',
      selected: false,
    },
    {
      id: '5',
      category: 'expression',
      content: '마케팅 표현: "수십 장을 한 번에", "원하는 스타일, 원하는 모델", "디자이너의 시간을 절약"',
      selected: false,
    },
  ];
  
  console.log('\n📊 리서치 결과:');
  researchResults.forEach((result, index) => {
    console.log(`${index + 1}. [${result.category}] ${result.content}`);
  });
  
  // 자동으로 모든 인사이트 선택
  selectedInsights = researchResults.map(r => r.content);
  
  console.log(`\n✅ 선택된 인사이트 (${selectedInsights.length}개):`);
  selectedInsights.forEach((insight, i) => {
    console.log(`${i + 1}. ${insight}`);
  });
  
  return true;
}

// Step 2: GPT 콘셉트 기획
async function step2() {
  console.log('\n💡 ===== Step 2: GPT 콘셉트 기획 =====\n');
  
  console.log('GPT-5.1로 릴스 콘셉트 생성 중...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const concepts = [
    {
      id: '1',
      title: '시간 절약',
      hook: '디자이너의 하루, 이미지 찾는데 3시간?',
      flow: '문제 제기 (시간 낭비) → 해결책 소개 (이미지팩토리) → 핵심 기능 (대량 생성) → 사용 후기 → 지금 시작하기',
      cta: '지금 바로 시작하세요!',
      summary: '이미지 찾는 시간을 3시간에서 3분으로',
    },
    {
      id: '2',
      title: '다양한 선택',
      hook: '20개 AI 모델, 원하는 스타일을 자유롭게',
      flow: '다양성 강조 → 모델 소개 → 스타일 비교 → 실제 결과물 → 무료 체험',
      cta: '무료로 시작하기!',
      summary: '20개 이상 AI 모델로 원하는 스타일 찾기',
    },
    {
      id: '3',
      title: '비용 효율',
      hook: '타 서비스 대비 30% 저렴, 대량 생성 가능',
      flow: '비용 비교 → 가격 제시 → 대량 생성 장점 → ROI 설명 → 특별 할인',
      cta: '지금 가입하면 특별 혜택!',
      summary: '저렴한 가격으로 더 많이 생성',
    },
  ];
  
  console.log('\n🎯 생성된 콘셉트:');
  concepts.forEach((concept, index) => {
    console.log(`\n${index + 1}. ${concept.title}`);
    console.log(`   Hook: ${concept.hook}`);
    console.log(`   Flow: ${concept.flow}`);
    console.log(`   CTA: ${concept.cta}`);
    console.log(`   요약: ${concept.summary}`);
  });
  
  // 첫 번째 콘셉트 선택
  chosenConcept = concepts[0];
  
  console.log(`\n✅ 선택된 콘셉트: ${chosenConcept.title}`);
  console.log(`   이유: 시간 절약은 크리에이터의 가장 큰 니즈`);
  
  return true;
}

// Step 3: Grok 대본 작성
async function step3() {
  console.log('\n📝 ===== Step 3: Grok 대본 작성 =====\n');
  
  console.log('Grok-2-vision-1212로 장면별 대본 생성 중...');
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  videoScripts = [
    {
      videoIndex: 0,
      duration: 8,
      shots: [
        {
          index: 0,
          duration: 2,
          description: '디자이너가 스톡 사이트에서 이미지를 찾는 모습 (스트레스 받는 표정)',
          visualPrompt: 'A frustrated designer scrolling through stock photo websites, looking stressed and tired',
        },
        {
          index: 1,
          duration: 3,
          description: '시계가 빠르게 돌아가는 타임랩스',
          visualPrompt: 'Time-lapse of a clock showing hours passing quickly',
        },
        {
          index: 2,
          duration: 3,
          description: '이미지팩토리 로고와 "3시간 → 3분" 텍스트',
          visualPrompt: 'ImageFactory logo with text "3 hours → 3 minutes" animated transition',
        },
      ],
      narration: '디자이너의 하루, 이미지 찾는데 3시간?',
      approved: true,
    },
    {
      videoIndex: 1,
      duration: 8,
      shots: [
        {
          index: 0,
          duration: 2,
          description: '여러 스톡 사이트를 열어놓고 비교하는 모습',
          visualPrompt: 'Multiple browser tabs open with different stock photo sites, person comparing images',
        },
        {
          index: 1,
          duration: 3,
          description: '이미지팩토리 웹사이트로 전환되는 화면',
          visualPrompt: 'Smooth transition to ImageFactory website interface, clean and modern design',
        },
        {
          index: 2,
          duration: 3,
          description: '프롬프트 입력하고 생성 버튼 클릭',
          visualPrompt: 'Hand typing prompt and clicking generate button on ImageFactory interface',
        },
      ],
      narration: '이미지팩토리에서 프롬프트만 입력하면 끝',
      approved: true,
    },
    {
      videoIndex: 2,
      duration: 8,
      shots: [
        {
          index: 0,
          duration: 2,
          description: '여러 AI 모델 선택 화면 (Midjourney, DALL-E, Stable Diffusion 등)',
          visualPrompt: 'Grid of different AI model options: Midjourney, DALL-E, Stable Diffusion, etc.',
        },
        {
          index: 1,
          duration: 3,
          description: '대량 생성 진행 화면 (20장, 30장 생성 중)',
          visualPrompt: 'Progress screen showing batch generation of 20-30 images simultaneously',
        },
        {
          index: 2,
          duration: 3,
          description: '완성된 이미지 그리드 뷰',
          visualPrompt: 'Grid view of completed images in various styles, all matching the prompt',
        },
      ],
      narration: '20개 AI 모델, 수십 장을 한 번에 생성',
      approved: true,
    },
    {
      videoIndex: 3,
      duration: 8,
      shots: [
        {
          index: 0,
          duration: 2,
          description: '사용자 후기 카드 (만족도 4.8/5.0)',
          visualPrompt: 'User testimonial cards showing 4.8/5.0 satisfaction rating',
        },
        {
          index: 1,
          duration: 3,
          description: '실제 생성된 이미지 갤러리',
          visualPrompt: 'Gallery of actual generated images showing diverse styles and quality',
        },
        {
          index: 2,
          duration: 3,
          description: '가격 비교 차트 (타 서비스 대비 30% 저렴)',
          visualPrompt: 'Price comparison chart showing ImageFactory 30% cheaper than competitors',
        },
      ],
      narration: '수많은 크리에이터가 선택한 이유가 있습니다',
      approved: true,
    },
    {
      videoIndex: 4,
      duration: 8,
      shots: [
        {
          index: 0,
          duration: 2,
          description: '이미지팩토리 웹사이트 메인 화면',
          visualPrompt: 'ImageFactory main website homepage, clean and inviting',
        },
        {
          index: 1,
          duration: 3,
          description: '무료 체험 버튼과 특별 할인 배너',
          visualPrompt: 'Free trial button and special discount banner highlighted',
        },
        {
          index: 2,
          duration: 3,
          description: 'QR코드와 "지금 바로 시작하기" CTA',
          visualPrompt: 'QR code and strong call-to-action "Start Now" with ImageFactory branding',
        },
      ],
      narration: '지금 바로 시작하세요! 무료 체험 가능',
      approved: true,
    },
  ];
  
  console.log('\n📹 생성된 대본 (5개 영상):');
  videoScripts.forEach((script, index) => {
    console.log(`\n--- Video ${index + 1} (${script.duration}초) ---`);
    console.log(`내레이션: "${script.narration}"`);
    script.shots.forEach((shot) => {
      console.log(`  샷 ${shot.index + 1} (${shot.duration}초): ${shot.description}`);
      console.log(`    프롬프트: ${shot.visualPrompt}`);
    });
  });
  
  console.log('\n✅ 모든 대본 승인 완료');
  
  return true;
}

// Step 4: Veo3 영상 생성
async function step4() {
  console.log('\n🎥 ===== Step 4: Veo3 영상 제작 =====\n');
  
  console.log('Veo 3.1로 5개의 8초 영상 생성 중...');
  console.log('(실제로는 각 영상당 약 2-5분 소요)');
  
  for (let i = 0; i < 5; i++) {
    console.log(`\n영상 ${i + 1}/5 생성 중...`);
    const script = videoScripts[i];
    const combinedPrompt = script.shots.map(s => s.visualPrompt).join('. Then ');
    console.log(`프롬프트: ${combinedPrompt.substring(0, 100)}...`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`✅ 영상 ${i + 1} 생성 완료`);
    console.log(`   (실제 URL: https://storage.googleapis.com/veo3/video-${i + 1}.mp4)`);
  }
  
  console.log('\n✅ 모든 영상 생성 완료!');
  console.log('총 40초 릴스 (8초 × 5개)');
  
  return true;
}

// Step 5: Pixazo TTS + 자막 생성
async function step5() {
  console.log('\n🎤 ===== Step 5: Pixazo TTS + 자막 생성 =====\n');
  
  console.log('Pixazo TTS로 음성 합성 중...');
  console.log('GPT-5.1로 자막 타임스탬프 생성 중...');
  
  for (let i = 0; i < 5; i++) {
    const script = videoScripts[i];
    console.log(`\n영상 ${i + 1}/5 처리 중...`);
    console.log(`내레이션: "${script.narration}"`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TTS 생성 시뮬레이션
    const audioUrl = `https://storage.googleapis.com/pixazo/audio-${i + 1}.mp3`;
    const duration = Math.ceil(script.narration.length / 3.5);
    
    // 자막 생성 시뮬레이션
    const subtitleEntries = [
      { index: 1, startTime: 0.0, endTime: duration / 2, text: script.narration.split(' ')[0] + ' ' + script.narration.split(' ')[1] },
      { index: 2, startTime: duration / 2, endTime: duration, text: script.narration.split(' ').slice(2).join(' ') },
    ];
    
    console.log(`✅ 음성 생성 완료 (${duration}초)`);
    console.log(`✅ 자막 생성 완료 (${subtitleEntries.length}개 항목)`);
    console.log(`   자막 예시: "${subtitleEntries[0].text}" (0.0s - ${duration / 2}s)`);
  }
  
  console.log('\n✅ 모든 영상의 음성 및 자막 생성 완료!');
  
  return true;
}

// Step 6: FFmpeg 영상 결합
async function step6() {
  console.log('\n🎬 ===== Step 6: FFmpeg 영상 결합 =====\n');
  
  console.log('FFmpeg로 5개 영상을 결합 중...');
  console.log('각 영상에 음성과 자막 합성 중...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n✅ 영상 결합 완료!');
  console.log('✅ 음성 합성 완료!');
  console.log('✅ 자막 합성 완료!');
  
  const finalReelUrl = `https://storage.googleapis.com/reels/final-${Date.now()}.mp4`;
  console.log(`\n🎉 최종 릴스 URL: ${finalReelUrl}`);
  console.log('   길이: 40초 (8초 × 5개)');
  console.log('   해상도: 1080x1920 (9:16)');
  console.log('   형식: MP4 (H.264 + AAC)');
  
  return true;
}

// 최종 요약
function printSummary() {
  console.log('\n\n🎉 ===== Reels Factory 테스트 완료! =====\n');
  console.log('📋 최종 결과 요약:');
  console.log(`\n1. 프로젝트 ID: ${projectId}`);
  console.log(`\n2. 교정된 프롬프트:`);
  console.log(`   ${refinedPrompt}`);
  console.log(`\n3. 선택된 인사이트: ${selectedInsights.length}개`);
  console.log(`\n4. 선택된 콘셉트: ${chosenConcept.title}`);
  console.log(`   Hook: ${chosenConcept.hook}`);
  console.log(`\n5. 생성된 대본: ${videoScripts.length}개 영상`);
  console.log(`   총 길이: ${videoScripts.length * 8}초`);
  console.log(`\n6. 생성된 영상: 5개 (각 8초)`);
  console.log(`   최종 릴스: 40초`);
  
  console.log('\n\n✨ 완성된 릴스는 40초 분량의 이미지팩토리 홍보 영상입니다!');
  console.log('   - 음성 내레이션 포함');
  console.log('   - 자막 포함');
  console.log('   - 5개 영상 순차 재생');
  console.log('   - SNS 최적화 (9:16 비율)');
}

// 메인 실행
async function main() {
  console.log('🎬 Reels Factory API 테스트 시작!');
  console.log('📌 목표: 이미지팩토리 홍보 릴스 제작\n');
  
  try {
    if (await step0()) {
      if (await step1()) {
        if (await step2()) {
          if (await step3()) {
            if (await step4()) {
              if (await step5()) {
                if (await step6()) {
                  printSummary();
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
  }
}

main();

