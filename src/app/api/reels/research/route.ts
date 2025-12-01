/**
 * Step1: Perplexity 리서치 API
 * POST /api/reels/research
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { searchWithPerplexity } from '@/lib/perplexity';
import { deductReelsPoints, refundReelsPoints } from '@/lib/reels/points';
import { extractKeywordsFromResearch } from '@/lib/reels/gpt';

export async function POST(request: NextRequest) {
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
    } catch {
      return NextResponse.json(
        { success: false, error: '인증 토큰이 유효하지 않습니다.' },
        { status: 401 }
      );
    }

    const { projectId, refinedPrompt } = await request.json();

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

    // 오늘 날짜 가져오기
    const today = new Date();
    const todayStr = today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const todayISO = today.toISOString().split('T')[0];

    // Perplexity로 리서치 수행 (오늘 날짜 포함)
    const searchQueries = [
      `${refinedPrompt} 관련 최신 트렌드 키워드 2025 (오늘 날짜: ${todayStr} 기준 최신 정보)`,
      `${refinedPrompt} 소비자 페인포인트 및 니즈 (${todayStr} 기준 최신 정보)`,
      `${refinedPrompt} 마케팅 표현 및 밈 (${todayStr} 기준 최신 트렌드)`,
      `${refinedPrompt} USP 및 차별화 포인트 (${todayStr} 기준 최신 정보)`,
    ];

    // Perplexity로 리서치 수행 (모든 쿼리 결과 수집)
    const allResearchText: string[] = [];

    for (const query of searchQueries) {
      const searchResult = await searchWithPerplexity(query, refinedPrompt);
      
      if (searchResult.searchResults && !searchResult.error) {
        allResearchText.push(searchResult.searchResults);
      }
    }

    // 모든 리서치 결과를 하나로 합치기
    const combinedResearch = allResearchText.join('\n\n');

    // GPT로 키워드 후보 추출
    let allResults: Array<{
      id: string;
      category: 'keyword' | 'painpoint' | 'trend' | 'usp' | 'expression' | 'general';
      content: string;
      source?: string;
      selected: boolean;
    }> = [];

    if (combinedResearch.trim().length > 0) {
      try {
        allResults = await extractKeywordsFromResearch(combinedResearch);
      } catch (error) {
        console.error('GPT 키워드 추출 오류:', error);
        // GPT 실패 시 기존 방식으로 폴백
        for (let i = 0; i < allResearchText.length; i++) {
          const researchText = allResearchText[i];
          const category: 'keyword' | 'painpoint' | 'trend' | 'usp' | 'expression' | 'general' = 
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
    }

    // 포인트 차감 (Step 1)
    const pointsResult = await deductReelsPoints(user.uid, projectId, 1);
    if (!pointsResult.success) {
      return NextResponse.json(
        { success: false, error: pointsResult.error },
        { status: 400 }
      );
    }

    try {
      // 프로젝트 업데이트
      await db.collection('reelsProjects').doc(projectId).update({
        researchResults: allResults,
        currentStep: 2,
        stepResults: {
          step1: {
            results: allResults,
            pointsUsed: pointsResult.pointsDeducted,
            completedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        data: {
          results: allResults,
          pointsDeducted: pointsResult.pointsDeducted,
          newBalance: pointsResult.newBalance,
        },
      });
    } catch (error: any) {
      await refundReelsPoints(user.uid, projectId, 1);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        results: allResults,
      },
    });
  } catch (error: any) {
    console.error('리서치 오류:', error);
    return NextResponse.json(
      { success: false, error: '리서치에 실패했습니다.' },
      { status: 500 }
    );
  }
}

