/**
 * Reels Factory API 실제 테스트 스크립트
 * 실제 API를 호출하고 생성된 영상을 로컬에 저장
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 테스트 데이터 - ImageFactory 홍보 릴스
const TEST_PROMPT = `ImageFactory는 AI를 활용한 이미지 생성 서비스입니다. 다양한 AI 모델(Midjourney, DALL-E 3, Stable Diffusion 등)을 사용하여 고품질 이미지를 생성할 수 있으며, 최신 AI 기술을 활용한 Reels Factory 기능도 제공합니다. 간단한 프롬프트만으로 전문적인 이미지와 릴스 영상을 만들 수 있는 혁신적인 플랫폼입니다.`;
const TEST_OPTIONS = {
  target: '20-40대 창작자, 마케터, 디자이너, 콘텐츠 크리에이터',
  tone: '친근하고 트렌디하며 전문적',
  purpose: 'ImageFactory 서비스 홍보 및 신규 사용자 유치',
};

// 환경 변수에서 토큰 가져오기 (또는 직접 입력)
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// 결과 저장 디렉토리
const OUTPUT_DIR = path.join(__dirname, 'reels-test-output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let projectId = null;
let refinedPrompt = null;
let selectedInsights = [];
let chosenConcept = null;
let videoScripts = [];
let videoClips = [];
let finalClips = [];
let finalReelUrl = null;

// 파일 다운로드 헬퍼
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 리다이렉트 처리
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ 다운로드 완료: ${filepath}`);
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// API 호출 헬퍼
async function callAPI(endpoint, method, body, token = null) {
  const url = `${BASE_URL}/api/reels${endpoint}`;
  const urlObj = new URL(url);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve({ success: false, error: 'JSON 파싱 실패', raw: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Step 0: 프로젝트 생성 및 프롬프트 교정
async function step0() {
  console.log('\n🎬 ===== Step 0: 입력 & 프롬프트 교정 =====\n');
  
  console.log('📝 입력된 정보:');
  console.log(`프롬프트: ${TEST_PROMPT}`);
  console.log(`타겟: ${TEST_OPTIONS.target}`);
  console.log(`톤앤매너: ${TEST_OPTIONS.tone}`);
  console.log(`목적: ${TEST_OPTIONS.purpose}`);
  
  if (!AUTH_TOKEN) {
    console.error('❌ AUTH_TOKEN이 필요합니다. 환경 변수 TEST_AUTH_TOKEN을 설정하거나 스크립트를 수정하세요.');
    return false;
  }
  
  // 프로젝트 생성
  console.log('\n📦 프로젝트 생성 중...');
  const createResult = await callAPI('/create', 'POST', {
    prompt: TEST_PROMPT,
    images: [],
    options: TEST_OPTIONS,
  }, AUTH_TOKEN);
  
  if (createResult.success) {
    projectId = createResult.data.projectId;
    console.log(`✅ 프로젝트 생성 완료: ${projectId}`);
  } else {
    console.error('❌ 프로젝트 생성 실패:', createResult.error);
    return false;
  }
  
  // GPT로 프롬프트 교정
  console.log('\n🤖 GPT-5.1로 프롬프트 교정 중...');
  const refineResult = await callAPI('/refine-prompt', 'POST', {
    projectId,
    prompt: TEST_PROMPT,
  }, AUTH_TOKEN);
  
  if (refineResult.success) {
    refinedPrompt = refineResult.data.refinedPrompt;
    console.log('\n✅ 교정된 프롬프트:');
    console.log(refinedPrompt);
    console.log(`\n💰 포인트 차감: ${refineResult.data.pointsDeducted}pt`);
    console.log(`💳 잔액: ${refineResult.data.newBalance}pt`);
  } else {
    console.error('❌ 프롬프트 교정 실패:', refineResult.error);
    return false;
  }
  
  return true;
}

// Step 1: Perplexity 리서치
async function step1() {
  console.log('\n🔍 ===== Step 1: Perplexity 리서치 =====\n');
  
  console.log('Perplexity API (sonar-pro)로 최신 트렌드 검색 중...');
  const researchResult = await callAPI('/research', 'POST', {
    projectId,
    refinedPrompt,
  }, AUTH_TOKEN);
  
  if (researchResult.success) {
    const results = researchResult.data.results || [];
    console.log(`\n📊 리서치 결과 (${results.length}개):`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. [${result.category}] ${result.content.substring(0, 80)}...`);
    });
    
    // 모든 인사이트 선택
    selectedInsights = results.map(r => r.id);
    console.log(`\n✅ 선택된 인사이트: ${selectedInsights.length}개`);
    console.log(`💰 포인트 차감: ${researchResult.data.pointsDeducted}pt`);
    console.log(`💳 잔액: ${researchResult.data.newBalance}pt`);
  } else {
    console.error('❌ 리서치 실패:', researchResult.error);
    return false;
  }
  
  return true;
}

// Step 2: GPT 콘셉트 기획
async function step2() {
  console.log('\n💡 ===== Step 2: GPT 콘셉트 기획 =====\n');
  
  console.log('GPT-5.1로 릴스 콘셉트 생성 중...');
  const conceptResult = await callAPI('/concept', 'POST', {
    projectId,
    refinedPrompt,
    selectedInsights,
    options: TEST_OPTIONS,
  }, AUTH_TOKEN);
  
  if (conceptResult.success) {
    const concepts = conceptResult.data.concepts || [];
    console.log(`\n🎯 생성된 콘셉트 (${concepts.length}개):`);
    concepts.forEach((concept, index) => {
      console.log(`\n${index + 1}. ${concept.title}`);
      console.log(`   Hook: ${concept.hook}`);
      console.log(`   Flow: ${concept.flow}`);
      console.log(`   CTA: ${concept.cta}`);
    });
    
    // 첫 번째 콘셉트 선택
    chosenConcept = concepts[0];
    console.log(`\n✅ 선택된 콘셉트: ${chosenConcept.title}`);
    console.log(`💰 포인트 차감: ${conceptResult.data.pointsDeducted}pt`);
    console.log(`💳 잔액: ${conceptResult.data.newBalance}pt`);
  } else {
    console.error('❌ 콘셉트 생성 실패:', conceptResult.error);
    return false;
  }
  
  return true;
}

// Step 3: Grok 대본 작성
async function step3() {
  console.log('\n📝 ===== Step 3: Grok 대본 작성 =====\n');
  
  console.log('Grok-2-vision-1212로 장면별 대본 생성 중...');
  const scriptResult = await callAPI('/script', 'POST', {
    projectId,
    chosenConcept,
  }, AUTH_TOKEN);
  
  if (scriptResult.success) {
    videoScripts = scriptResult.data.videoScripts || [];
    console.log(`\n📹 생성된 대본 (${videoScripts.length}개 영상):`);
    videoScripts.forEach((script, index) => {
      console.log(`\n--- Video ${index + 1} (${script.duration}초) ---`);
      console.log(`내레이션: "${script.narration}"`);
      console.log(`샷 개수: ${script.shots?.length || 0}개`);
    });
    
    console.log('\n✅ 모든 대본 승인 완료');
    console.log(`💰 포인트 차감: ${scriptResult.data.pointsDeducted}pt`);
    console.log(`💳 잔액: ${scriptResult.data.newBalance}pt`);
  } else {
    console.error('❌ 대본 생성 실패:', scriptResult.error);
    return false;
  }
  
  return true;
}

// Step 4: Veo3 영상 생성
async function step4() {
  console.log('\n🎥 ===== Step 4: Veo3 영상 제작 =====\n');
  
  console.log('Veo 3.1로 5개의 8초 영상 생성 중...');
  console.log('(실제로는 각 영상당 약 2-5분 소요)');
  
  videoClips = [];
  
  for (let i = 0; i < 5; i++) {
    console.log(`\n영상 ${i + 1}/5 생성 중...`);
    const script = videoScripts[i];
    
    const videoResult = await callAPI('/generate-video', 'POST', {
      projectId,
      videoIndex: i,
      videoScript: script,
    }, AUTH_TOKEN);
    
    if (videoResult.success) {
      console.log(`✅ 영상 ${i + 1} 생성 시작 (Operation ID: ${videoResult.data.operationId})`);
      
      // Veo3 작업 상태 확인 (폴링)
      let completed = false;
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 60; // 최대 5분 대기
      
      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초마다 확인
        
        const statusResult = await callAPI(`/${projectId}`, 'GET', null, AUTH_TOKEN);
        if (statusResult.success && statusResult.data.videoClips) {
          const clip = statusResult.data.videoClips[i];
          if (clip && clip.status === 'completed' && clip.url) {
            completed = true;
            videoUrl = clip.url;
            videoClips.push(clip);
            console.log(`✅ 영상 ${i + 1} 생성 완료!`);
            
            // 영상 다운로드
            const videoPath = path.join(OUTPUT_DIR, `video-${i + 1}.mp4`);
            try {
              await downloadFile(videoUrl, videoPath);
            } catch (err) {
              console.warn(`⚠️ 영상 ${i + 1} 다운로드 실패:`, err.message);
            }
            break;
          } else if (clip && clip.status === 'failed') {
            console.error(`❌ 영상 ${i + 1} 생성 실패:`, clip.error);
            break;
          }
        }
        attempts++;
        if (attempts % 6 === 0) {
          console.log(`   대기 중... (${attempts * 5}초 경과)`);
        }
      }
      
      if (!completed) {
        console.warn(`⚠️ 영상 ${i + 1} 생성 시간 초과`);
      }
    } else {
      console.error(`❌ 영상 ${i + 1} 생성 요청 실패:`, videoResult.error);
    }
  }
  
  console.log(`\n✅ 완료된 영상: ${videoClips.length}/5`);
  
  return true;
}

// Step 5: Pixazo TTS + 자막 생성
async function step5() {
  console.log('\n🎤 ===== Step 5: Pixazo TTS + 자막 생성 =====\n');
  
  console.log('Pixazo TTS로 음성 합성 중...');
  console.log('GPT-5.1로 자막 타임스탬프 생성 중...');
  
  finalClips = [];
  
  for (let i = 0; i < 5; i++) {
    const script = videoScripts[i];
    console.log(`\n영상 ${i + 1}/5 처리 중...`);
    console.log(`내레이션: "${script.narration}"`);
    
    const ttsResult = await callAPI('/tts', 'POST', {
      projectId,
      videoIndex: i,
      videoScript: script,
    }, AUTH_TOKEN);
    
    if (ttsResult.success) {
      console.log(`✅ 음성 생성 완료`);
      console.log(`✅ 자막 생성 완료`);
      
      // 오디오 다운로드
      if (ttsResult.data.audioUrl) {
        const audioPath = path.join(OUTPUT_DIR, `audio-${i + 1}.mp3`);
        try {
          await downloadFile(ttsResult.data.audioUrl, audioPath);
        } catch (err) {
          console.warn(`⚠️ 오디오 ${i + 1} 다운로드 실패:`, err.message);
        }
      }
      
      finalClips.push({
        videoIndex: i,
        videoUrl: videoClips[i]?.url,
        audioUrl: ttsResult.data.audioUrl,
        subtitle: ttsResult.data.subtitle,
      });
      
      console.log(`💰 포인트 차감: ${ttsResult.data.pointsDeducted}pt`);
      console.log(`💳 잔액: ${ttsResult.data.newBalance}pt`);
    } else {
      console.error(`❌ TTS 생성 실패:`, ttsResult.error);
    }
  }
  
  console.log(`\n✅ 모든 영상의 음성 및 자막 생성 완료!`);
  
  return true;
}

// Step 6: FFmpeg 영상 결합
async function step6() {
  console.log('\n🎬 ===== Step 6: FFmpeg 영상 결합 =====\n');
  
  console.log('FFmpeg로 5개 영상을 결합 중...');
  console.log('각 영상에 음성과 자막 합성 중...');
  
  const mergeResult = await callAPI('/merge', 'POST', {
    projectId,
  }, AUTH_TOKEN);
  
  if (mergeResult.success) {
    finalReelUrl = mergeResult.data.finalReelUrl;
    console.log('\n✅ 영상 결합 완료!');
    console.log(`🎉 최종 릴스 URL: ${finalReelUrl}`);
    console.log(`💰 포인트 차감: ${mergeResult.data.pointsDeducted}pt`);
    console.log(`💳 잔액: ${mergeResult.data.newBalance}pt`);
    
    // 최종 영상 다운로드
    if (finalReelUrl) {
      const finalPath = path.join(OUTPUT_DIR, 'final-reel.mp4');
      try {
        await downloadFile(finalReelUrl, finalPath);
        console.log(`\n✅ 최종 릴스 다운로드 완료: ${finalPath}`);
      } catch (err) {
        console.warn(`⚠️ 최종 영상 다운로드 실패:`, err.message);
      }
    }
  } else {
    console.error('❌ 영상 결합 실패:', mergeResult.error);
    return false;
  }
  
  return true;
}

// HTML 결과 페이지 생성
function generateHTMLReport() {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reels Factory 테스트 결과</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .section {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { margin: 0; }
    h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .video-item {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
    }
    video {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .final-video {
      text-align: center;
      margin: 30px 0;
    }
    .final-video video {
      max-width: 400px;
      margin: 0 auto;
    }
    .info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
    }
    .success { color: #28a745; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎬 Reels Factory 테스트 결과</h1>
    <p>프로젝트 ID: ${projectId}</p>
    <p>생성 시간: ${new Date().toLocaleString('ko-KR')}</p>
  </div>

  <div class="section">
    <h2>📝 입력 정보</h2>
    <div class="info">
      <p><strong>프롬프트:</strong> ${TEST_PROMPT}</p>
      <p><strong>교정된 프롬프트:</strong> ${refinedPrompt || 'N/A'}</p>
      <p><strong>타겟:</strong> ${TEST_OPTIONS.target}</p>
      <p><strong>톤앤매너:</strong> ${TEST_OPTIONS.tone}</p>
      <p><strong>목적:</strong> ${TEST_OPTIONS.purpose}</p>
    </div>
  </div>

  ${chosenConcept ? `
  <div class="section">
    <h2>💡 선택된 콘셉트</h2>
    <div class="info">
      <h3>${chosenConcept.title}</h3>
      <p><strong>Hook:</strong> ${chosenConcept.hook}</p>
      <p><strong>Flow:</strong> ${chosenConcept.flow}</p>
      <p><strong>CTA:</strong> ${chosenConcept.cta}</p>
    </div>
  </div>
  ` : ''}

  ${videoScripts.length > 0 ? `
  <div class="section">
    <h2>📹 생성된 대본</h2>
    ${videoScripts.map((script, i) => `
      <div class="info" style="margin-bottom: 15px;">
        <h3>Video ${i + 1} (${script.duration}초)</h3>
        <p><strong>내레이션:</strong> "${script.narration}"</p>
        <p><strong>샷 개수:</strong> ${script.shots?.length || 0}개</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${videoClips.length > 0 ? `
  <div class="section">
    <h2>🎥 생성된 영상 클립</h2>
    <div class="video-grid">
      ${videoClips.map((clip, i) => `
        <div class="video-item">
          <h3>Video ${i + 1}</h3>
          ${clip.url ? `
            <video controls>
              <source src="video-${i + 1}.mp4" type="video/mp4">
            </video>
            <p class="success">✅ 생성 완료</p>
          ` : `
            <p class="error">❌ 생성 실패</p>
          `}
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${finalReelUrl ? `
  <div class="section">
    <h2>🎉 최종 릴스</h2>
    <div class="final-video">
      <video controls>
        <source src="final-reel.mp4" type="video/mp4">
      </video>
      <p><strong>길이:</strong> 40초 (8초 × 5개)</p>
      <p><strong>해상도:</strong> 1080x1920 (9:16)</p>
      <p><strong>형식:</strong> MP4 (H.264 + AAC)</p>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2>📊 요약</h2>
    <div class="info">
      <p><strong>완료된 단계:</strong> ${finalReelUrl ? '6/6 (완료)' : videoClips.length > 0 ? '4/6' : '진행 중'}</p>
      <p><strong>생성된 영상:</strong> ${videoClips.length}/5</p>
      <p><strong>최종 릴스:</strong> ${finalReelUrl ? '✅ 완료' : '⏳ 진행 중'}</p>
    </div>
  </div>
</body>
</html>`;

  const htmlPath = path.join(OUTPUT_DIR, 'index.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`\n📄 HTML 리포트 생성: ${htmlPath}`);
  console.log(`브라우저에서 열기: file://${htmlPath}`);
}

// 최종 요약
function printSummary() {
  console.log('\n\n🎉 ===== Reels Factory 테스트 완료! =====\n');
  console.log('📋 최종 결과 요약:');
  console.log(`\n1. 프로젝트 ID: ${projectId}`);
  console.log(`\n2. 교정된 프롬프트:`);
  console.log(`   ${refinedPrompt}`);
  console.log(`\n3. 선택된 인사이트: ${selectedInsights.length}개`);
  if (chosenConcept) {
    console.log(`\n4. 선택된 콘셉트: ${chosenConcept.title}`);
  }
  console.log(`\n5. 생성된 대본: ${videoScripts.length}개 영상`);
  console.log(`\n6. 생성된 영상: ${videoClips.length}/5`);
  if (finalReelUrl) {
    console.log(`\n7. 최종 릴스: ✅ 완료`);
    console.log(`   저장 위치: ${OUTPUT_DIR}/final-reel.mp4`);
  }
  
  console.log(`\n📁 모든 파일 저장 위치: ${OUTPUT_DIR}`);
  console.log(`📄 HTML 리포트: ${OUTPUT_DIR}/index.html`);
}

// 메인 실행
async function main() {
  console.log('🎬 Reels Factory API 실제 테스트 시작!');
  console.log('📌 목표: 이미지팩토리 홍보 릴스 제작\n');
  
  if (!AUTH_TOKEN) {
    console.error('\n❌ 인증 토큰이 필요합니다!');
    console.log('\n사용 방법:');
    console.log('1. 브라우저에서 로그인 후 개발자 도구 콘솔에서:');
    console.log('   firebase.auth().currentUser.getIdToken().then(console.log)');
    console.log('2. 또는 환경 변수로 설정:');
    console.log('   TEST_AUTH_TOKEN=your_token node test-reels-api-real.js');
    console.log('\n또는 스크립트 내부의 AUTH_TOKEN 변수를 직접 수정하세요.');
    return;
  }
  
  try {
    if (await step0()) {
      if (await step1()) {
        if (await step2()) {
          if (await step3()) {
            if (await step4()) {
              if (await step5()) {
                if (await step6()) {
                  generateHTMLReport();
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
    console.error(error.stack);
  }
}

main();

