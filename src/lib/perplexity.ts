/**
 * Perplexity API 유틸리티
 * 웹 검색을 통한 최신 정보 수집
 */

interface PerplexitySearchResult {
  searchQuery: string;
  searchResults: string;
  error?: string;
}

/**
 * Perplexity API를 사용하여 웹 검색 수행
 * @param query 검색 쿼리
 * @param context 추가 컨텍스트 (제품명, 키워드 등)
 * @returns 검색 결과 요약
 */
export async function searchWithPerplexity(
  query: string,
  context?: string
): Promise<PerplexitySearchResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ PERPLEXITY_API_KEY가 설정되지 않았습니다. 검색 없이 진행합니다.');
    return {
      searchQuery: query,
      searchResults: '',
    };
  }

  try {
    // 오늘 날짜 가져오기
    const today = new Date();
    const todayStr = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    const todayISO = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식

    // 컨텍스트가 있으면 쿼리에 추가
    const fullQuery = context 
      ? `${query}\n\n관련 컨텍스트: ${context}\n\n중요: 오늘 날짜는 ${todayStr} (${todayISO})입니다. 반드시 오늘 날짜를 확인하고 최신 정보를 검색해주세요.`
      : `${query}\n\n중요: 오늘 날짜는 ${todayStr} (${todayISO})입니다. 반드시 오늘 날짜를 확인하고 최신 정보를 검색해주세요.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro', // 웹 검색 지원 모델 (Perplexity 공식 문서 참고)
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that provides accurate, up-to-date information from web search. Today's date is ${todayStr} (${todayISO}). Always check the current date and provide the most recent information available. Summarize the search results concisely and focus on the most relevant information.`,
          },
          {
            role: 'user',
            content: fullQuery,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API 오류:', response.status, errorText);
      return {
        searchQuery: query,
        searchResults: '',
        error: `API 오류: ${response.status}`,
      };
    }

    const data = await response.json();
    const searchResults = data.choices?.[0]?.message?.content || '';

    return {
      searchQuery: query,
      searchResults,
    };
  } catch (error: any) {
    console.error('Perplexity 검색 오류:', error);
    return {
      searchQuery: query,
      searchResults: '',
      error: error.message,
    };
  }
}

/**
 * 콘텐츠 생성에 필요한 검색 쿼리 생성
 * @param productName 제품명
 * @param keywords 키워드 배열
 * @param topic 주제 (트렌드, 시장 동향 등)
 * @returns 검색 쿼리
 */
export function generateSearchQuery(
  productName: string,
  keywords?: string[],
  topic: 'trend' | 'market' | 'competitor' | 'general' = 'general'
): string {
  const keywordStr = keywords?.slice(0, 3).join(' ') || '';
  
  switch (topic) {
    case 'trend':
      return `최신 ${productName} ${keywordStr} 트렌드 및 시장 동향 2025`;
    case 'market':
      return `${productName} ${keywordStr} 시장 분석 및 경쟁사 동향`;
    case 'competitor':
      return `${productName} ${keywordStr} 경쟁 제품 및 브랜드 비교`;
    default:
      return `${productName} ${keywordStr} 최신 정보 및 인사이트`;
  }
}

