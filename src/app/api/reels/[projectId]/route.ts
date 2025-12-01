/**
 * Reels 프로젝트 상태 조회 및 업데이트 API
 * GET /api/reels/[projectId] - 상태 조회
 * PUT /api/reels/[projectId] - 상태 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';
import { checkVeo3Operation } from '@/lib/reels/veo3';
import { refundReelsPoints } from '@/lib/reels/points';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
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

    const { projectId } = params;

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

    // 진행 중인 영상 작업 상태 확인
    if (projectData.videoClips) {
      for (let i = 0; i < projectData.videoClips.length; i++) {
        const clip = projectData.videoClips[i];
        if (clip.status === 'processing' && clip.operationId) {
          const status = await checkVeo3Operation(clip.operationId);
          if (status.done) {
            if (status.videoUrl) {
              projectData.videoClips[i] = {
                ...clip,
                url: status.videoUrl,
                status: 'completed',
              };
            } else {
              projectData.videoClips[i] = {
                ...clip,
                status: 'failed',
                error: status.error,
              };
              // 실패한 영상에 대한 환불 처리 (Step 4)
              if (clip.pointsUsed) {
                await refundReelsPoints(projectData.userId, projectId, 4, 1);
              }
            }
          }
        }
      }

      // 상태가 변경되었으면 업데이트
      const hasChanges = projectData.videoClips.some(
        (clip: any, index: number) => 
          clip.status !== (projectDoc.data()?.videoClips?.[index]?.status)
      );

      if (hasChanges) {
        await db.collection('reelsProjects').doc(projectId).update({
          videoClips: projectData.videoClips,
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: projectDoc.id,
        ...projectData,
      },
    });
  } catch (error: any) {
    console.error('프로젝트 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '프로젝트 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
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

    const { projectId } = params;
    const updates = await request.json();

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

    // 실패 상태로 변경 시 환불 처리
    if (updates.status === 'failed' && projectData.status !== 'failed') {
      const currentStep = updates.currentStep ?? projectData.currentStep ?? 0;
      
      // 현재 단계까지 사용된 포인트 환불
      // Step 0-3: 전체 환불
      // Step 4-5: 실패한 영상만 환불 (이미 개별 처리됨)
      // Step 6: 환불 없음 (이미 완료된 작업)
      
      if (currentStep < 4) {
        // Step 0-3까지 완료된 경우, 각 단계별 환불
        const stepResults: any = projectData.stepResults || {};
        
        if (stepResults.step0 && !stepResults.step0.refunded) {
          await refundReelsPoints(user.uid, projectId, 0);
        }
        if (stepResults.step1 && !stepResults.step1.refunded) {
          await refundReelsPoints(user.uid, projectId, 1);
        }
        if (stepResults.step2 && !stepResults.step2.refunded) {
          await refundReelsPoints(user.uid, projectId, 2);
        }
        if (stepResults.step3 && !stepResults.step3.refunded) {
          await refundReelsPoints(user.uid, projectId, 3);
        }
      }
    }

    // 업데이트
    await db.collection('reelsProjects').doc(projectId).update({
      ...updates,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { projectId },
    });
  } catch (error: any) {
    console.error('프로젝트 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '프로젝트 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

