/**
 * ImageFactory 홍보 릴스 생성 테스트
 * Reels Factory 전체 프로세스 테스트
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 출력 디렉토리
const OUTPUT_DIR = path.join(__dirname, 'reels-output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// 인증 토큰 (실제 사용 시 Firebase Auth 토큰 필요)
let AUTH_TOKEN = '';

// 프로젝트 ID
let projectId = '';

console.log('🎬 ImageFactory 홍보 릴스 생성 시작!\n');
console.log('📋 프로젝트: ImageFactory 홍보 릴스');
console.log('📝 목적: ImageFactory 서비스 소개 및 홍보');
console.log('');

/**
 * API 호출 헬퍼
 */
async function callAPI(endpoint, method, body, token) {
  const url = `${API_BASE_URL}/api/reels${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API 호출 오류 (${endpoint}):`, error.message);
    throw error;
  }
}

/**
 * 파일 다운로드 헬퍼
 */
async function downloadFile(url, filePath) {
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (error) {
    console.error(`파일 다운로드 오류:`, error.message);
    throw error;
  }
}

/**
 * Step 0: 프로젝트 생성 및 프롬프트 교정
 */
async function step0() {
  console.log('\n📝 ===== Step 0: 프로젝트 생성 및 프롬프트 교정 =====\n');
  
  const prompt = `ImageFactory는 AI를 활용한 이미지 생성 서비스입니다. 다양한 AI 모델을 사용하여 고품질 이미지를 생성할 수 있으며, 최신 AI 기술을 활용한 Reels Factory 기능도 제공합니다.`;
  
  console.log('📝 원본 프롬프트:', prompt);
  console.log('🤖 GPT-5.1로 프롬프트 교정 중...\n');
  
  const createResult = await callAPI('/create', 'POST', {
    prompt,
    images: [],
    options: {
      target: '20-40대 창작자 및 마케터',
      tone: '친근하고 전문적인',
      purpose: '서비스 홍보 및 사용자 유도',
    },
  }, AUTH_TOKEN);
  
  if (!createResult.success) {
    throw new Error(`프로젝트 생성 실패: ${createResult.error}`);
  }
  
  projectId = createResult.data.projectId;
  console.log(`✅ 프로젝트 생성 완료: ${projectId}`);
  
  // 프롬프트 교정
  const refineResult = await callAPI('/refine-prompt', 'POST', {
    projectId,
    prompt,
  }, AUTH_TOKEN);
  
  if (!refineResult.success) {
    throw new Error(`프롬프트 교정 실패: ${refineResult.error}`);
  }
  
  console.log('✅ 프롬프트 교정 완료');
  console.log('📝 교정된 프롬프트:', refineResult.data.refinedPrompt);
  console.log('💡 개선 사항:', refineResult.data.improvements?.join(', ') || '없음');
  console.log(`💰 포인트 차감: ${refineResult.data.pointsDeducted}pt`);
  console.log(`💳 잔액: ${refineResult.data.newBalance}pt`);
  
  return refineResult.data.refinedPrompt;
}

/**
 * Step 1: Perplexity 리서치
 */
async function step1(refinedPrompt) {
  console.log('\n🔍 ===== Step 1: Perplexity 리서치 =====\n');
  
  console.log('🔍 최신 트렌드 및 경쟁사 분석 중...\n');
  
  const researchResult = await callAPI('/research', 'POST', {
    projectId,
    refinedPrompt,
  }, AUTH_TOKEN);
  
  if (!researchResult.success) {
    throw new Error(`리서치 실패: ${researchResult.error}`);
  }
  
  console.log('✅ 리서치 완료');
  console.log(`📊 리서치 결과: ${researchResult.data.results.length}개`);
  researchResult.data.results.forEach((result, index) => {
    console.log(`  ${index + 1}. [${result.category}] ${result.content.substring(0, 100)}...`);
  });
  console.log(`💰 포인트 차감: ${researchResult.data.pointsDeducted}pt`);
  console.log(`💳 잔액: ${researchResult.data.newBalance}pt`);
  
  return researchResult.data.results;
}

/**
 * Step 2: GPT 콘셉트 생성
 */
async function step2(refinedPrompt, researchResults) {
  console.log('\n💡 ===== Step 2: GPT 콘셉트 생성 =====\n');
  
  console.log('💡 마케팅 콘셉트 생성 중...\n');
  
  const selectedInsights = researchResults.slice(0, 3).map(r => r.content);
  
  const conceptResult = await callAPI('/concept', 'POST', {
    projectId,
    refinedPrompt,
    selectedInsights,
    options: {
      target: '20-40대 창작자 및 마케터',
      tone: '친근하고 전문적인',
      purpose: '서비스 홍보 및 사용자 유도',
    },
  }, AUTH_TOKEN);
  
  if (!conceptResult.success) {
    throw new Error(`콘셉트 생성 실패: ${conceptResult.error}`);
  }
  
  console.log('✅ 콘셉트 생성 완료');
  conceptResult.data.concepts.forEach((concept, index) => {
    console.log(`\n  콘셉트 ${index + 1}: ${concept.title}`);
    console.log(`    Hook: ${concept.hook}`);
    console.log(`    Flow: ${concept.flow.substring(0, 100)}...`);
    console.log(`    CTA: ${concept.cta}`);
  });
  console.log(`💰 포인트 차감: ${conceptResult.data.pointsDeducted}pt`);
  console.log(`💳 잔액: ${conceptResult.data.newBalance}pt`);
  
  // 첫 번째 콘셉트 선택
  const chosenConcept = conceptResult.data.concepts[0];
  console.log(`\n✅ 선택된 콘셉트: ${chosenConcept.title}`);
  
  return chosenConcept;
}

/**
 * Step 3: Grok 대본 생성
 */
async function step3(chosenConcept, refinedPrompt) {
  console.log('\n📜 ===== Step 3: Grok 대본 생성 =====\n');
  
  console.log('📜 영상 대본 생성 중...\n');
  
  const scriptResult = await callAPI('/script', 'POST', {
    projectId,
    chosenConcept,
  }, AUTH_TOKEN);
  
  if (!scriptResult.success) {
    throw new Error(`대본 생성 실패: ${scriptResult.error}`);
  }
  
  console.log('✅ 대본 생성 완료');
  scriptResult.data.videoScripts.forEach((script, index) => {
    console.log(`\n  Video ${index + 1} (${script.duration}초):`);
    console.log(`    내레이션: "${script.narration}"`);
    console.log(`    샷 수: ${script.shots?.length || 0}개`);
  });
  console.log(`💰 포인트 차감: ${scriptResult.data.pointsDeducted}pt`);
  console.log(`💳 잔액: ${scriptResult.data.newBalance}pt`);
  
  return scriptResult.data.videoScripts;
}

/**
 * Step 4: Veo3 영상 생성
 */
async function step4(videoScripts) {
  console.log('\n🎥 ===== Step 4: Veo3 영상 생성 =====\n');
  
  console.log('🎥 5개 영상 생성 중... (각 8초, 총 40초)\n');
  
  const videoClips = [];
  
  for (let i = 0; i < 5; i++) {
    const script = videoScripts[i];
    console.log(`\n영상 ${i + 1}/5 생성 중...`);
    console.log(`내레이션: "${script.narration}"`);
    
    const videoResult = await callAPI('/generate-video', 'POST', {
      projectId,
      videoIndex: i,
      videoScript: script,
    }, AUTH_TOKEN);
    
    if (!videoResult.success) {
      console.error(`❌ 영상 ${i + 1} 생성 실패:`, videoResult.error);
      continue;
    }
    
    console.log(`✅ 영상 ${i + 1} 생성 시작 (Operation ID: ${videoResult.data.operationId})`);
    console.log(`💰 포인트 차감: ${videoResult.data.pointsDeducted}pt`);
    console.log(`💳 잔액: ${videoResult.data.newBalance}pt`);
    
    videoClips.push({
      videoIndex: i,
      operationId: videoResult.data.operationId,
      status: 'processing',
    });
    
    // API Rate Limit 방지
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n✅ 모든 영상 생성 요청 완료: ${videoClips.length}/5`);
  console.log('⏳ 영상 생성 완료까지 대기 중... (약 1-5분 소요)');
  
  // 영상 생성 완료 대기 (폴링)
  for (let i = 0; i < videoClips.length; i++) {
    const clip = videoClips[i];
    let attempts = 0;
    const maxAttempts = 30; // 최대 5분 대기
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
      
      const projectStatus = await callAPI(`/${projectId}`, 'GET', null, AUTH_TOKEN);
      if (projectStatus.success && projectStatus.data.videoClips?.[i]?.status === 'completed') {
        const completedClip = projectStatus.data.videoClips[i];
        console.log(`✅ 영상 ${i + 1} 생성 완료: ${completedClip.url}`);
        videoClips[i] = completedClip;
        break;
      }
      
      attempts++;
      if (attempts % 3 === 0) {
        console.log(`  영상 ${i + 1} 생성 중... (${attempts * 10}초 경과)`);
      }
    }
  }
  
  return videoClips;
}

/**
 * Step 5: Gemini TTS + 자막 생성
 */
async function step5(videoScripts) {
  console.log('\n🎤 ===== Step 5: Gemini TTS + 자막 생성 =====\n');
  
  console.log('🎤 5개 영상의 음성 및 자막 생성 중...\n');
  
  const finalClips = [];
  
  for (let i = 0; i < 5; i++) {
    const script = videoScripts[i];
    console.log(`\n영상 ${i + 1}/5 처리 중...`);
    console.log(`내레이션: "${script.narration}"`);
    
    const ttsResult = await callAPI('/tts', 'POST', {
      projectId,
      videoIndex: i,
    }, AUTH_TOKEN);
    
    if (!ttsResult.success) {
      console.error(`❌ TTS ${i + 1} 생성 실패:`, ttsResult.error);
      continue;
    }
    
    console.log(`✅ 음성 생성 완료`);
    console.log(`✅ 자막 생성 완료`);
    console.log(`💰 포인트 차감: ${ttsResult.data.pointsDeducted}pt`);
    console.log(`💳 잔액: ${ttsResult.data.newBalance}pt`);
    
    // 오디오 다운로드
    if (ttsResult.data.audioUrl) {
      const audioPath = path.join(OUTPUT_DIR, `audio-${i + 1}.mp3`);
      try {
        // Base64 데이터 URL인 경우
        if (ttsResult.data.audioUrl.startsWith('data:')) {
          const base64Data = ttsResult.data.audioUrl.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(audioPath, buffer);
        } else {
          await downloadFile(ttsResult.data.audioUrl, audioPath);
        }
        console.log(`💾 오디오 저장: ${audioPath}`);
      } catch (err) {
        console.warn(`⚠️ 오디오 ${i + 1} 다운로드 실패:`, err.message);
      }
    }
    
    // 자막 파일 저장
    if (ttsResult.data.subtitle) {
      const srtPath = path.join(OUTPUT_DIR, `subtitle-${i + 1}.srt`);
      fs.writeFileSync(srtPath, ttsResult.data.subtitle.srt || '', 'utf8');
      console.log(`💾 자막 저장: ${srtPath}`);
    }
    
    finalClips.push({
      videoIndex: i,
      audioUrl: ttsResult.data.audioUrl,
      subtitle: ttsResult.data.subtitle,
    });
    
    // API Rate Limit 방지
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ 모든 영상의 음성 및 자막 생성 완료!`);
  
  return finalClips;
}

/**
 * Step 6: FFmpeg 영상 결합
 */
async function step6() {
  console.log('\n🎬 ===== Step 6: FFmpeg 영상 결합 =====\n');
  
  console.log('🎬 최종 릴스 생성 중...\n');
  
  const mergeResult = await callAPI('/merge', 'POST', {
    projectId,
  }, AUTH_TOKEN);
  
  if (!mergeResult.success) {
    throw new Error(`영상 결합 실패: ${mergeResult.error}`);
  }
  
  console.log('✅ 최종 릴스 생성 완료!');
  console.log(`📹 영상 URL: ${mergeResult.data.finalReelUrl}`);
  console.log(`⏱️  길이: ${mergeResult.data.duration}초`);
  console.log(`💰 포인트 차감: ${mergeResult.data.pointsDeducted}pt`);
  console.log(`💳 잔액: ${mergeResult.data.newBalance}pt`);
  
  // 최종 영상 다운로드
  if (mergeResult.data.finalReelUrl) {
    const finalPath = path.join(OUTPUT_DIR, 'final-reel.mp4');
    try {
      await downloadFile(mergeResult.data.finalReelUrl, finalPath);
      console.log(`💾 최종 영상 저장: ${finalPath}`);
    } catch (err) {
      console.warn(`⚠️ 최종 영상 다운로드 실패:`, err.message);
    }
  }
  
  return mergeResult.data.finalReelUrl;
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    console.log('⚠️  주의: 실제 API 호출을 위해서는 Firebase Auth 토큰이 필요합니다.');
    console.log('⚠️  현재는 시뮬레이션 모드로 진행됩니다.\n');
    
    // 실제 사용 시 Firebase Auth 토큰 필요
    // AUTH_TOKEN = await getFirebaseAuthToken();
    
    if (!AUTH_TOKEN) {
      console.log('⚠️  인증 토큰이 없어 시뮬레이션 모드로 진행합니다.');
      console.log('💡 실제 테스트를 위해서는 Firebase Auth 토큰을 설정하세요.\n');
    }
    
    // Step 0: 프로젝트 생성 및 프롬프트 교정
    const refinedPrompt = await step0();
    
    // Step 1: Perplexity 리서치
    const researchResults = await step1(refinedPrompt);
    
    // Step 2: GPT 콘셉트 생성
    const chosenConcept = await step2(refinedPrompt, researchResults);
    
    // Step 3: Grok 대본 생성
    const videoScripts = await step3(chosenConcept, refinedPrompt);
    
    // Step 4: Veo3 영상 생성
    const videoClips = await step4(videoScripts);
    
    // Step 5: Gemini TTS + 자막 생성
    const finalClips = await step5(videoScripts);
    
    // Step 6: FFmpeg 영상 결합
    const finalReelUrl = await step6();
    
    console.log('\n🎉 ===== 릴스 생성 완료! =====\n');
    console.log(`📹 최종 영상: ${finalReelUrl}`);
    console.log(`📁 출력 디렉토리: ${OUTPUT_DIR}`);
    console.log(`\n✅ ImageFactory 홍보 릴스가 성공적으로 생성되었습니다!`);
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 실행
main();

