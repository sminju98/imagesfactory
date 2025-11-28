import { NextRequest, NextResponse } from 'next/server';
import { auth, db, fieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { concept, message, script, copy, referenceImageIds } = await request.json();

    if (!concept || !message || !script || !copy) {
      return NextResponse.json({
        success: false,
        error: '모든 단계 데이터가 필요합니다',
      });
    }

    // 인증 확인 (선택적 - 개발 중에는 비활성화 가능)
    const authHeader = request.headers.get('Authorization');
    let userId = 'anonymous';

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (authError) {
        console.log('인증 실패, 익명 사용자로 진행');
      }
    }

    // 콘텐츠 프로젝트 생성
    const projectRef = db.collection('contentProjects').doc();
    const projectId = projectRef.id;

    // 생성할 콘텐츠 목록 계산
    const contentTasks = [
      // 릴스 10장
      ...script.reelsStory.map((scene: any, index: number) => ({
        type: 'reels',
        order: index + 1,
        prompt: scene.imagePrompt || `${concept.productName} marketing content, ${scene.description}`,
        text: copy.reelsCaptions[index] || scene.caption,
        width: 1080,
        height: 1920,
      })),
      // 4컷 만화
      ...script.comicStory.map((panel: any, index: number) => ({
        type: 'comic',
        order: index + 1,
        prompt: panel.imagePrompt || `${concept.productName} comic illustration, ${panel.description}`,
        text: panel.dialogue,
        width: 1080,
        height: 1080,
      })),
      // 카드뉴스 5장
      ...script.cardNewsFlow.map((page: any, index: number) => ({
        type: 'card_news',
        order: index + 1,
        prompt: page.imagePrompt || `${concept.productName} card news, ${page.title}`,
        text: copy.cardNewsCopies[index] || page.body,
        width: 1080,
        height: 1080,
      })),
      // 배너 2장
      { type: 'banner', order: 1, prompt: `${concept.productName} banner advertisement, professional marketing`, text: copy.bannerCopy, width: 1200, height: 628 },
      { type: 'banner', order: 2, prompt: `${concept.productName} promotional banner, modern design`, text: copy.bannerCopy, width: 1200, height: 628 },
      // 스토리 2장
      { type: 'story', order: 1, prompt: `${concept.productName} story advertisement, vertical format`, text: copy.storyCopy, width: 1080, height: 1920 },
      { type: 'story', order: 2, prompt: `${concept.productName} instagram story, engaging design`, text: copy.storyCopy, width: 1080, height: 1920 },
      // 썸네일 3장
      { type: 'thumbnail', order: 1, prompt: `${concept.productName} youtube thumbnail, clickbait style`, text: copy.thumbnailTitle, width: 1280, height: 720 },
      { type: 'thumbnail', order: 2, prompt: `${concept.productName} video thumbnail, professional`, text: copy.thumbnailTitle, width: 1280, height: 720 },
      { type: 'thumbnail', order: 3, prompt: `${concept.productName} thumbnail, modern design`, text: copy.thumbnailTitle, width: 1280, height: 720 },
      // 상세페이지 2장
      { type: 'detail_header', order: 1, prompt: `${concept.productName} product detail page header, premium quality`, text: copy.detailPageHeadline, width: 860, height: 500 },
      { type: 'detail_header', order: 2, prompt: `${concept.productName} landing page hero image, professional`, text: copy.detailPageHeadline, width: 860, height: 500 },
    ];

    // 프로젝트 문서 저장
    await projectRef.set({
      userId,
      status: 'processing',
      currentStep: 'production',
      inputPrompt: concept.productName,
      referenceImageIds: referenceImageIds || [],
      concept,
      message,
      script,
      copy,
      totalTasks: contentTasks.length,
      completedTasks: 0,
      totalPointsUsed: 0, // 나중에 계산
      createdAt: fieldValue.serverTimestamp(),
      updatedAt: fieldValue.serverTimestamp(),
    });

    // 각 콘텐츠 태스크를 서브컬렉션에 저장
    const batch = db.batch();
    contentTasks.forEach((task, index) => {
      const taskRef = projectRef.collection('tasks').doc();
      batch.set(taskRef, {
        ...task,
        status: 'pending',
        projectId,
        userId,
        createdAt: fieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    // TODO: 실제 이미지 생성 작업 트리거
    // 현재는 시뮬레이션으로 처리됨 (StepProduction.tsx에서)

    return NextResponse.json({
      success: true,
      taskId: projectId,
      totalTasks: contentTasks.length,
    });

  } catch (error: any) {
    console.error('생산 시작 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '생산 시작 중 오류가 발생했습니다',
    }, { status: 500 });
  }
}

