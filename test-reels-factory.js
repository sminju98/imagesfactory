/**
 * Reels Factory 단계별 테스트 스크립트
 * 사용자와 대화하면서 각 단계를 진행합니다.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 테스트 데이터 저장
let testData = {
  projectId: null,
  refinedPrompt: null,
  selectedInsights: [],
  chosenConcept: null,
  videoScripts: [],
};

// 질문 함수
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Step 0: 프롬프트 입력 및 교정
async function step0() {
  console.log('\n🎬 ===== Step 0: 입력 & 프롬프트 교정 =====\n');
  
  const prompt = await question('프롬프트를 입력해주세요: ');
  const target = await question('타겟 고객 (예: 20-30대 여성): ');
  const tone = await question('톤앤매너 (예: 친근하고 유머러스): ');
  const purpose = await question('목적 (예: 제품 판매): ');

  console.log('\n📝 입력된 정보:');
  console.log(`프롬프트: ${prompt}`);
  console.log(`타겟: ${target}`);
  console.log(`톤앤매너: ${tone}`);
  console.log(`목적: ${purpose}`);

  // GPT로 프롬프트 교정 시뮬레이션
  console.log('\n🤖 GPT-5.1로 프롬프트 교정 중...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const refinedPrompt = `[교정됨] ${prompt} - 타겟: ${target}, 톤: ${tone}, 목적: ${purpose}에 맞게 최적화된 릴스 콘텐츠`;
  
  console.log('\n✅ 교정된 프롬프트:');
  console.log(refinedPrompt);
  
  testData.refinedPrompt = refinedPrompt;
  testData.options = { target, tone, purpose };
  
  const proceed = await question('\n다음 단계로 진행하시겠습니까? (y/n): ');
  return proceed.toLowerCase() === 'y';
}

// Step 1: Perplexity 리서치
async function step1() {
  console.log('\n🔍 ===== Step 1: Perplexity 리서치 =====\n');
  
  console.log('Perplexity API로 최신 트렌드 검색 중...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 시뮬레이션 결과
  const researchResults = [
    { id: '1', category: 'keyword', content: '건강 다이어트 트렌드: 저칼로리, 고단백, 식이섬유 강조', selected: false },
    { id: '2', category: 'painpoint', content: '소비자 페인포인트: 요요현상, 식단 관리 어려움, 맛 없는 다이어트 식품', selected: false },
    { id: '3', category: 'trend', content: '2025 다이어트 트렌드: 개인 맞춤형, 지속 가능한 다이어트, 웰니스 중심', selected: false },
    { id: '4', category: 'usp', content: '차별화 포인트: 자연 원재료, 과학적 근거, 맛과 건강의 균형', selected: false },
    { id: '5', category: 'expression', content: '마케팅 표현: "살 빼지 말고 건강하게", "맛있게 다이어트"', selected: false },
  ];
  
  console.log('\n📊 리서치 결과:');
  researchResults.forEach((result, index) => {
    console.log(`${index + 1}. [${result.category}] ${result.content}`);
  });
  
  console.log('\n선택할 인사이트 번호를 입력하세요 (쉼표로 구분, 예: 1,2,3): ');
  const selected = await question('');
  
  const selectedIds = selected.split(',').map(s => s.trim()).filter(Boolean);
  testData.selectedInsights = researchResults
    .filter(r => selectedIds.includes(r.id))
    .map(r => r.content);
  
  console.log(`\n✅ 선택된 인사이트 (${testData.selectedInsights.length}개):`);
  testData.selectedInsights.forEach((insight, i) => {
    console.log(`${i + 1}. ${insight}`);
  });
  
  const proceed = await question('\n다음 단계로 진행하시겠습니까? (y/n): ');
  return proceed.toLowerCase() === 'y';
}

// Step 2: GPT 콘셉트 기획
async function step2() {
  console.log('\n💡 ===== Step 2: GPT 콘셉트 기획 =====\n');
  
  console.log('GPT-5.1로 릴스 콘셉트 생성 중...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const concepts = [
    {
      id: '1',
      title: '건강한 다이어트',
      hook: '다이어트가 맛없다고 생각하셨나요?',
      flow: '문제 제기 → 해결책 소개 → 제품 특징 → 사용 후기 → 행동 유도',
      cta: '지금 바로 시작하세요!',
      summary: '맛있게 건강하게 다이어트하는 방법',
    },
    {
      id: '2',
      title: '과학적 근거',
      hook: '과학이 증명한 다이어트의 비밀',
      flow: '과학적 근거 → 제품 원리 → 효과 검증 → 실제 사례 → 구매 유도',
      cta: '과학을 믿으세요!',
      summary: '연구 기반의 효과적인 다이어트 솔루션',
    },
    {
      id: '3',
      title: '라이프스타일',
      hook: '당신의 일상이 다이어트가 됩니다',
      flow: '일상 속 문제 → 간편한 해결 → 실생활 적용 → 변화된 모습 → 시작하기',
      cta: '오늘부터 시작!',
      summary: '일상에 자연스럽게 녹아드는 다이어트',
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
  
  const selected = await question('\n선택할 콘셉트 번호 (1-3): ');
  const selectedConcept = concepts[parseInt(selected) - 1];
  
  console.log(`\n✅ 선택된 콘셉트: ${selectedConcept.title}`);
  testData.chosenConcept = selectedConcept;
  
  const proceed = await question('\n다음 단계로 진행하시겠습니까? (y/n): ');
  return proceed.toLowerCase() === 'y';
}

// Step 3: Grok 대본 작성
async function step3() {
  console.log('\n📝 ===== Step 3: Grok 대본 작성 =====\n');
  
  console.log('Grok-2-vision-1212로 장면별 대본 생성 중...');
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  const videoScripts = [
    {
      videoIndex: 0,
      duration: 8,
      shots: [
        { index: 0, duration: 2, description: '다이어트 식품을 먹는 사람의 표정이 맛없어 보임', visualPrompt: 'A person trying to eat bland diet food with a disappointed expression' },
        { index: 1, duration: 3, description: '우리 제품을 먹는 사람의 만족스러운 표정', visualPrompt: 'A person enjoying delicious healthy diet food with a happy smile' },
        { index: 2, duration: 3, description: '제품 포장과 브랜드 로고', visualPrompt: 'Close-up of healthy diet product packaging with natural ingredients' },
      ],
      narration: '다이어트가 맛없다고 생각하셨나요?',
    },
    {
      videoIndex: 1,
      duration: 8,
      shots: [
        { index: 0, duration: 2, description: '요요현상으로 고민하는 사람', visualPrompt: 'A person struggling with yo-yo diet effect' },
        { index: 1, duration: 3, description: '식단 관리의 어려움을 보여주는 장면', visualPrompt: 'A person confused about meal planning and calorie counting' },
        { index: 2, duration: 3, description: '해결책 제시', visualPrompt: 'Simple and easy meal solution presented' },
      ],
      narration: '요요현상, 식단 관리의 어려움. 이제 해결책이 있습니다.',
    },
    {
      videoIndex: 2,
      duration: 8,
      shots: [
        { index: 0, duration: 2, description: '제품의 핵심 특징 소개', visualPrompt: 'Key product features highlighted with natural ingredients' },
        { index: 1, duration: 3, description: '과학적 근거와 영양 정보', visualPrompt: 'Scientific evidence and nutritional information displayed' },
        { index: 2, duration: 3, description: '맛과 건강의 균형', visualPrompt: 'Balance between taste and health shown' },
      ],
      narration: '자연 원재료로 만든 과학적 근거의 다이어트 솔루션.',
    },
    {
      videoIndex: 3,
      duration: 8,
      shots: [
        { index: 0, duration: 2, description: '실제 사용자 후기', visualPrompt: 'Real user testimonials and before/after photos' },
        { index: 1, duration: 3, description: '성공 사례', visualPrompt: 'Success stories of people who achieved their goals' },
        { index: 2, duration: 3, description: '신뢰할 수 있는 브랜드', visualPrompt: 'Trustworthy brand image with certifications' },
      ],
      narration: '수많은 사람들이 성공했습니다. 당신도 할 수 있습니다.',
    },
    {
      videoIndex: 4,
      duration: 8,
      shots: [
        { index: 0, duration: 2, description: '제품 구매 링크/QR코드', visualPrompt: 'Product purchase link or QR code displayed' },
        { index: 1, duration: 3, description: '특별 할인 정보', visualPrompt: 'Special discount offer highlighted' },
        { index: 2, duration: 3, description: '강렬한 CTA', visualPrompt: 'Strong call-to-action with product image' },
      ],
      narration: '지금 바로 시작하세요! 특별 할인 중입니다.',
    },
  ];
  
  console.log('\n📹 생성된 대본 (5개 영상):');
  videoScripts.forEach((script, index) => {
    console.log(`\n--- Video ${index + 1} (${script.duration}초) ---`);
    console.log(`내레이션: ${script.narration}`);
    script.shots.forEach((shot) => {
      console.log(`  샷 ${shot.index + 1} (${shot.duration}초): ${shot.description}`);
      console.log(`    프롬프트: ${shot.visualPrompt}`);
    });
  });
  
  const approve = await question('\n모든 대본을 승인하시겠습니까? (y/n): ');
  if (approve.toLowerCase() === 'y') {
    testData.videoScripts = videoScripts.map(s => ({ ...s, approved: true }));
    console.log('\n✅ 모든 대본 승인 완료');
  }
  
  const proceed = await question('\n다음 단계로 진행하시겠습니까? (y/n): ');
  return proceed.toLowerCase() === 'y';
}

// Step 4: Veo3 영상 생성
async function step4() {
  console.log('\n🎥 ===== Step 4: Veo3 영상 제작 =====\n');
  
  console.log('Veo 3.1로 5개의 8초 영상 생성 중...');
  console.log('(실제로는 각 영상당 약 2-5분 소요)');
  
  for (let i = 0; i < 5; i++) {
    console.log(`\n영상 ${i + 1}/5 생성 중...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`✅ 영상 ${i + 1} 생성 완료`);
  }
  
  console.log('\n✅ 모든 영상 생성 완료!');
  console.log('(실제로는 각 영상의 URL이 반환됩니다)');
  
  const proceed = await question('\n다음 단계로 진행하시겠습니까? (y/n): ');
  return proceed.toLowerCase() === 'y';
}

// 메인 함수
async function main() {
  console.log('🎬 Reels Factory 단계별 테스트 시작!\n');
  console.log('각 단계를 순서대로 진행하며 결과를 확인합니다.\n');
  
  try {
    if (await step0()) {
      if (await step1()) {
        if (await step2()) {
          if (await step3()) {
            if (await step4()) {
              console.log('\n🎉 모든 단계 완료!');
              console.log('\n최종 결과:');
              console.log(JSON.stringify(testData, null, 2));
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    rl.close();
  }
}

main();


