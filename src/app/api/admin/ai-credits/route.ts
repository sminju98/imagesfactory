/**
 * AI 서비스별 크레딧/잔액 및 마지막 성공 시간 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

interface AICredit {
  service: string;
  modelId: string;
  balance: number | string;
  unit: string;
  status: 'ok' | 'error' | 'unknown';
  error?: string;
  lastUpdated: string;
  lastSuccess?: string;
  successCount?: number;
}

// 모델 ID와 서비스/API 매핑 (실제 사용하는 모델만)
const MODEL_CONFIG: Record<string, { service: string; apiType: string }> = {
  'midjourney': { service: 'Maginary.ai', apiType: 'maginary' },
  'gpt-image': { service: 'OpenAI', apiType: 'openai' },
  'gemini': { service: 'Google AI', apiType: 'gemini' },
  'grok': { service: 'xAI', apiType: 'xai' },
  'ideogram': { service: 'Ideogram', apiType: 'ideogram' },
  'leonardo': { service: 'Leonardo.ai', apiType: 'leonardo' },
  'recraft': { service: 'Recraft', apiType: 'recraft' },
  'seedream': { service: 'Segmind', apiType: 'segmind' },
  'flux': { service: 'Replicate', apiType: 'replicate' },
  'sdxl': { service: 'Replicate', apiType: 'replicate' },
  'pixart': { service: 'Replicate', apiType: 'replicate' },
  'hunyuan': { service: 'Replicate', apiType: 'replicate' },
  'realistic-vision': { service: 'Replicate', apiType: 'replicate' },
};

// 각 모델의 마지막 성공/실패 시간 조회
async function getModelStats(): Promise<Record<string, { lastSuccess?: Date; count: number; lastFailure?: Date; failureCount: number }>> {
  const modelStats: Record<string, { lastSuccess?: Date; count: number; lastFailure?: Date; failureCount: number }> = {};
  
  try {
    // 최근 tasks에서 jobs 조회
    const tasksSnapshot = await db.collection('tasks')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    
    for (const taskDoc of tasksSnapshot.docs) {
      // 성공한 jobs
      const completedJobs = await taskDoc.ref.collection('jobs')
        .where('status', '==', 'completed')
        .get();
      
      completedJobs.forEach((jobDoc) => {
        const job = jobDoc.data();
        const modelId = job.modelId;
        const finishedAt = job.finishedAt?.toDate?.() || job.updatedAt?.toDate?.();
        
        if (modelId && finishedAt) {
          if (!modelStats[modelId]) {
            modelStats[modelId] = { count: 0, failureCount: 0 };
          }
          modelStats[modelId].count++;
          if (!modelStats[modelId].lastSuccess || finishedAt > modelStats[modelId].lastSuccess) {
            modelStats[modelId].lastSuccess = finishedAt;
          }
        }
      });
      
      // 실패한 jobs (환불 대상)
      const failedJobs = await taskDoc.ref.collection('jobs')
        .where('status', '==', 'failed')
        .get();
      
      failedJobs.forEach((jobDoc) => {
        const job = jobDoc.data();
        const modelId = job.modelId;
        const finishedAt = job.finishedAt?.toDate?.() || job.updatedAt?.toDate?.();
        
        if (modelId && finishedAt) {
          if (!modelStats[modelId]) {
            modelStats[modelId] = { count: 0, failureCount: 0 };
          }
          modelStats[modelId].failureCount++;
          if (!modelStats[modelId].lastFailure || finishedAt > modelStats[modelId].lastFailure) {
            modelStats[modelId].lastFailure = finishedAt;
          }
        }
      });
    }
  } catch (error) {
    console.error('모델 성공 시간 조회 실패:', error);
  }
  
  return modelStats;
}

// API 상태 체크 (상세 오류 메시지 포함)
async function checkApiStatus(apiType: string): Promise<{ ok: boolean; balance?: string; error?: string }> {
  try {
    switch (apiType) {
      case 'openai': {
        if (!process.env.OPENAI_API_KEY) {
          return { ok: false, error: 'API 키 미설정' };
        }
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
        }
        return { ok: true };
      }
      
      case 'replicate': {
        if (!process.env.REPLICATE_API_TOKEN) {
          return { ok: false, error: 'API 토큰 미설정' };
        }
        // Replicate는 Token 인증 사용
        const res = await fetch('https://api.replicate.com/v1/account', {
          headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
        }
        const data = await res.json();
        return { ok: true, balance: data.spending_limit ? `한도 $${data.spending_limit}` : '정상' };
      }
      
      case 'ideogram': {
        if (!process.env.IDEOGRAM_API_KEY) {
          return { ok: false, error: 'API 키 미설정' };
        }
        const res = await fetch('https://api.ideogram.ai/me', {
          headers: { 'Api-Key': process.env.IDEOGRAM_API_KEY },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
        }
        const data = await res.json();
        return { ok: true, balance: data.credits !== undefined ? `${data.credits} 크레딧` : '정상' };
      }
      
      case 'leonardo': {
        if (!process.env.LEONARDO_API_KEY) {
          return { ok: false, error: 'API 키 미설정' };
        }
        const res = await fetch('https://cloud.leonardo.ai/api/rest/v1/me', {
          headers: { 'Authorization': `Bearer ${process.env.LEONARDO_API_KEY}` },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
        }
        const data = await res.json();
        const userInfo = data.user_details?.[0];
        return { 
          ok: true, 
          balance: userInfo?.apiPaidTokens !== undefined ? `${userInfo.apiPaidTokens} 토큰` : '정상'
        };
      }
      
      case 'xai': {
        if (!process.env.XAI_API_KEY) {
          return { ok: false, error: 'API 키 미설정' };
        }
        const res = await fetch('https://api.x.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${process.env.XAI_API_KEY}` },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
        }
        return { ok: true };
      }
      
      case 'gemini': {
        if (!process.env.GOOGLE_AI_API_KEY) {
          return { ok: false, error: 'API 키 미설정' };
        }
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_AI_API_KEY}`
        );
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
        }
        return { ok: true, balance: '무료 티어' };
      }
      
      case 'segmind': {
        if (!process.env.SEGMIND_API_KEY) {
          return { ok: false, error: 'API 키 미설정' };
        }
        const res = await fetch('https://api.segmind.com/v1/credits', {
          headers: { 'x-api-key': process.env.SEGMIND_API_KEY },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
        }
        const data = await res.json();
        return { ok: true, balance: data.credits !== undefined ? `${data.credits} 크레딧` : '정상' };
      }
      
      case 'maginary': {
        if (!process.env.MAGINARY_API_KEY) {
          return { ok: false, error: 'API 키 미설정 (MAGINARY_API_KEY)' };
        }
        // Maginary API 상태 확인 (간단한 요청으로 키 유효성 체크)
        const res = await fetch('https://app.maginary.ai/api/gens/', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${process.env.MAGINARY_API_KEY}` },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
        }
        return { ok: true, balance: '정상 (Maginary.ai)' };
      }
      
      case 'recraft': {
        // Recraft는 Replicate를 통해 사용
        return { ok: true, balance: 'Replicate 경유' };
      }
      
      default:
        return { ok: false, error: '알 수 없는 API 타입' };
    }
  } catch (error: any) {
    return { ok: false, error: `예외: ${error.message}` };
  }
}

export async function GET(request: NextRequest) {
  const now = new Date().toISOString();
  
  // 1. 각 모델의 마지막 성공 시간 조회
  const modelStats = await getModelStats();
  
  // 2. API별 상태 체크 (중복 방지)
  const apiStatusCache: Record<string, { ok: boolean; balance?: string; error?: string }> = {};
  
  const checkApi = async (apiType: string) => {
    if (!apiStatusCache[apiType]) {
      apiStatusCache[apiType] = await checkApiStatus(apiType);
    }
    return apiStatusCache[apiType];
  };
  
  // 3. 모델별 결과 생성
  const results: AICredit[] = [];
  
  // 최근 24시간 내 성공 기록이 있으면 정상으로 간주
  const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  for (const [modelId, config] of Object.entries(MODEL_CONFIG)) {
    const apiStatus = await checkApi(config.apiType);
    const stats = modelStats[modelId];
    
    // 최근 성공 기록 확인
    const hasRecentSuccess = stats?.lastSuccess && stats.lastSuccess > recentThreshold;
    // 최근 실패 기록 확인 (성공보다 더 최근이면 실패로 간주)
    const hasRecentFailure = stats?.lastFailure && 
      (!stats.lastSuccess || stats.lastFailure > stats.lastSuccess);
    
    // 실패가 성공보다 더 최근이면 실패로 표시
    const isWorking = apiStatus.ok || (hasRecentSuccess && !hasRecentFailure);
    
    let balanceText = apiStatus.balance || (isWorking ? '정상' : '오류');
    if (!apiStatus.ok && hasRecentSuccess && !hasRecentFailure) {
      // API 체크는 실패했지만 최근 성공 기록이 있고 실패가 없는 경우
      balanceText = '정상 (최근 성공)';
    } else if (hasRecentFailure) {
      // 최근 실패가 있으면 오류로 표시
      balanceText = '오류 (최근 실패)';
    }
    
    results.push({
      service: config.service,
      modelId,
      balance: balanceText,
      unit: '-',
      status: isWorking ? 'ok' : 'error',
      error: isWorking ? undefined : (hasRecentFailure ? '최근 실패 기록 있음' : apiStatus.error),
      lastUpdated: now,
      lastSuccess: stats?.lastSuccess?.toISOString(),
      successCount: stats?.count || 0,
    });
  }
  
  // 마지막 성공 시간 기준 정렬 (최근 순)
  results.sort((a, b) => {
    if (!a.lastSuccess && !b.lastSuccess) return 0;
    if (!a.lastSuccess) return 1;
    if (!b.lastSuccess) return -1;
    return new Date(b.lastSuccess).getTime() - new Date(a.lastSuccess).getTime();
  });

  return NextResponse.json({
    success: true,
    data: results,
    timestamp: now,
  });
}