/**
 * 오늘의 테마주 검색 테스트
 * Perplexity API를 사용하여 오늘 날짜의 테마주 검색
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

async function searchTodayThemeStock() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.error('❌ PERPLEXITY_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  // 오늘 날짜 가져오기
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}년 ${month}월 ${day}일`;
  const dateStrEn = `${year}-${month}-${day}`;

  console.log(`📅 오늘 날짜: ${dateStr}\n`);
  console.log('🔍 오늘의 테마주 검색 중...\n');

  try {
    const query = `오늘 ${dateStr} 한국 주식시장 테마주 및 주요 이슈주, 상승 종목 분석`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar', // 웹 검색 지원 모델 (기본 모델)
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst expert. Provide accurate, up-to-date information about Korean stock market theme stocks and major issues for today. Include specific stock names, reasons for price movements, and market trends.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Perplexity API 오류:', response.status, errorText);
      process.exit(1);
    }

    const data = await response.json();
    const searchResults = data.choices?.[0]?.message?.content || '';

    console.log('✅ 검색 결과:\n');
    console.log('='.repeat(80));
    console.log(searchResults);
    console.log('='.repeat(80));

    // 추가로 영어 쿼리도 시도
    console.log('\n\n🔍 English query also...\n');
    
    const queryEn = `Korean stock market theme stocks today ${dateStrEn}, major movers, rising stocks analysis`;

    const responseEn = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst expert. Provide accurate, up-to-date information about Korean stock market theme stocks and major issues for today. Include specific stock names, reasons for price movements, and market trends.',
          },
          {
            role: 'user',
            content: queryEn,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (responseEn.ok) {
      const dataEn = await responseEn.json();
      const searchResultsEn = dataEn.choices?.[0]?.message?.content || '';
      
      console.log('✅ English Search Results:\n');
      console.log('='.repeat(80));
      console.log(searchResultsEn);
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('❌ 검색 오류:', error);
    process.exit(1);
  }
}

// 실행
searchTodayThemeStock()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });

