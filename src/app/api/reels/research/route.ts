/**
 * Step1: Perplexity 리서치 API
 * POST /api/reels/research
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, fieldValue } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { searchWithPerplexity } from '@/lib/perplexity';
import { deductReelsPoints, refundReelsPoints } from '@/lib/reels/points';
import { extractKeywordsFromResearch } from '@/lib/reels/gpt';

export async function POST(request: NextRequest) {
  let projectId = '';
  let userId = '';
  
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let user;
    try {
      const decodedToken = await auth.verifyIdToken(token);
      user = decodedToken;
      userId = user.uid;
    } catch {
      return NextResponse.json(
        { success: false, error: '인증 토큰이 유효하지 않습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    projectId = body.projectId;
    const { refinedPrompt } = body;

    if (!projectId || !refinedPrompt) {
      return NextResponse.json(
        { success: false, error: 'projectId와 refinedPrompt가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 소유권 확인
    const projectDoc = await db.collection('reelsProjects').doc(projectId).get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data();
    if (projectData?.userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 포인트 차감 (Step 1: 20 포인트)
    const pointsResult = await deductReelsPoints(userId, projectId, 1);
    if (!pointsResult.success) {
      return NextResponse.json(
        { success: false, error: pointsResult.error },
        { status: 400 }
      );
    }

    try {
      // 오늘 날짜
    const today = new Date();
    const todayStr = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

      // Perplexity 검색 쿼리
    const searchQueries = [
        `${refinedPrompt} 관련 최신 트렌드 키워드 2025 (${todayStr} 기준)`,
        `${refinedPrompt} 소비자 페인포인트 및 니즈 (${todayStr} 기준)`,
        `${refinedPrompt} 마케팅 표현 및 밈 (${todayStr} 기준)`,
        `${refinedPrompt} USP 및 차별화 포인트 (${todayStr} 기준)`,
    ];

    const allResearchText: string[] = [];

      // 각 쿼리 실행
    for (const query of searchQueries) {
      try {
        const searchPromise = searchWithPerplexity(query, refinedPrompt);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Perplexity API 타임아웃')), 30000)
        );
        
          const searchResult = (await Promise.race([searchPromise, timeoutPromise])) as any;
        
        if (searchResult.searchResults && !searchResult.error) {
          allResearchText.push(searchResult.searchResults);
        }
      } catch (error: any) {
          console.error(`Perplexity 쿼리 실패:`, error.message);
      }
    }

    const combinedResearch = allResearchText.join('\n\n');

      // GPT로 키워드 추출
    let allResults: Array<{
      id: string;
      category: 'keyword' | 'painpoint' | 'trend' | 'usp' | 'expression' | 'general';
      content: string;
      source?: string;
      selected: boolean;
    }> = [];

    if (combinedResearch.trim().length > 0) {
      try {
        const gptPromise = extractKeywordsFromResearch(combinedResearch);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('GPT 타임아웃')), 60000)
        );
        
          allResults = (await Promise.race([gptPromise, timeoutPromise])) as typeof allResults;
      } catch (error: any) {
        console.error('GPT 키워드 추출 오류:', error);
          // 폴백 처리
        for (let i = 0; i < allResearchText.length; i++) {
          const researchText = allResearchText[i];
            const category: typeof allResults[0]['category'] =
            searchQueries[i].includes('키워드') ? 'keyword' :
            searchQueries[i].includes('페인포인트') ? 'painpoint' :
            searchQueries[i].includes('트렌드') ? 'trend' :
            searchQueries[i].includes('USP') ? 'usp' : 
            searchQueries[i].includes('표현') ? 'expression' : 'general';

          const insights = researchText
            .split('\n')
            .filter(line => line.trim().length > 20)
            .slice(0, 3)
            .map((content, index) => ({
              id: `${Date.now()}-${category}-${index}`,
              category,
              content: content.trim(),
              selected: false,
            }));

          allResults.push(...insights);
        }
      }
    } else {
      allResults = [{
        id: `no-results-${Date.now()}`,
        category: 'general' as const,
          content: '리서치 결과를 찾을 수 없습니다.',
        selected: false,
      }];
    }

      // 각 카테고리에서 첫 번째 인사이트를 자동 선택
      const autoSelectedIds = allResults
        .filter((_, index) => index < 5) // 최대 5개 자동 선택
        .map(r => r.id);
      
      // 선택된 인사이트 마킹
      allResults = allResults.map(r => ({
        ...r,
        selected: autoSelectedIds.includes(r.id),
      }));

      // 프로젝트 업데이트 (기본 인사이트 자동 선택)
      await db.collection('reelsProjects').doc(projectId).update({
        researchResults: allResults,
        selectedInsights: autoSelectedIds, // 자동 선택된 인사이트 저장
        currentStep: 2,
        updatedAt: fieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        data: {
          results: allResults,
          pointsDeducted: pointsResult.pointsDeducted,
        },
      });

    } catch (error: any) {
      // 실패 시 환불
      await refundReelsPoints(userId, projectId, 1);
      throw error;
    }

  } catch (error: any) {
    console.error('리서치 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '리서치에 실패했습니다.' },
      { status: 500 }
    );
  }
}
