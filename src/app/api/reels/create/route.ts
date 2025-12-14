/**
 * Reels 프로젝트 생성 API
 * POST /api/reels/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';

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

    const { prompt, images, options } = await request.json();

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: '프롬프트는 최소 10자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 생성
    const projectRef = db.collection('reelsProjects').doc();
    const projectId = projectRef.id;

    const projectData = {
      userId: user.uid,
      inputPrompt: prompt.trim(),
      refinedPrompt: prompt.trim(), // 교정 전에는 원본 프롬프트 사용
      uploadedImages: images || [],
      options: {
        target: options?.target || '',
        tone: options?.tone || '',
        purpose: options?.purpose || '',
      },
      researchResults: [],
      selectedInsights: [],
      concepts: [],
      chosenConcept: null,
      videoScripts: [],
      videoClips: [],
      finalClips: [],
      finalReelUrl: '',
      currentStep: 0,
      status: 'draft' as const,
      pointsUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await projectRef.set(projectData);

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        status: 'draft',
      },
    });
  } catch (error: any) {
    console.error('Reels 프로젝트 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '프로젝트 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
