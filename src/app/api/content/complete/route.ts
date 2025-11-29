// 콘텐츠 생성 완료 처리 및 이메일 발송 API

import { NextRequest, NextResponse } from 'next/server';
import { db, fieldValue } from '@/lib/firebase-admin';

// 이메일 발송 함수 (SendGrid 또는 Firebase Extension 사용)
async function sendCompletionEmail(
  email: string,
  projectId: string,
  productName: string,
  completedCount: number,
  totalCount: number,
  language: string = 'ko'
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://imagesfactory.vercel.app';
  const resultUrl = `${baseUrl}/content/${projectId}`;

  // 다국어 이메일 내용
  const emailContent: Record<string, { subject: string; body: string }> = {
    ko: {
      subject: `🎉 [ImagesFactory] "${productName}" 콘텐츠 생성이 완료되었습니다!`,
      body: `
        <div style="font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 20px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 콘텐츠 생성 완료!</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              안녕하세요!<br><br>
              요청하신 <strong>"${productName}"</strong> 콘텐츠 생성이 완료되었습니다.
            </p>
            
            <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">생성 완료</span>
                <span style="color: #10b981; font-weight: bold;">${completedCount}개</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">전체 콘텐츠</span>
                <span style="color: #334155; font-weight: bold;">${totalCount}개</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resultUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                📦 결과 확인하기
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center;">
              결과 페이지에서 콘텐츠를 다운로드하거나 저장소에 저장할 수 있습니다.
            </p>
          </div>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 0 0 16px 16px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2025 ImagesFactory by MJ Studio
            </p>
          </div>
        </div>
      `,
    },
    en: {
      subject: `🎉 [ImagesFactory] Your "${productName}" content is ready!`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 20px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Content Generation Complete!</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">
              Hello!<br><br>
              Your <strong>"${productName}"</strong> content has been generated successfully.
            </p>
            
            <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Completed</span>
                <span style="color: #10b981; font-weight: bold;">${completedCount} items</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Total Content</span>
                <span style="color: #334155; font-weight: bold;">${totalCount} items</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resultUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
                📦 View Results
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center;">
              You can download or save your content from the results page.
            </p>
          </div>
          
          <div style="background: #1e293b; padding: 20px; border-radius: 0 0 16px 16px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2025 ImagesFactory by MJ Studio
            </p>
          </div>
        </div>
      `,
    },
  };

  const content = emailContent[language] || emailContent.ko;

  // SendGrid API 호출
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { 
            email: 'noreply@imagesfactory.com', 
            name: 'ImagesFactory' 
          },
          subject: content.subject,
          content: [{ type: 'text/html', value: content.body }],
        }),
      });

      if (!response.ok) {
        console.error('SendGrid 오류:', await response.text());
      }
    } catch (error) {
      console.error('이메일 발송 오류:', error);
    }
  } else {
    // Firebase Extension (Trigger Email) 사용
    try {
      await db.collection('mail').add({
        to: email,
        message: {
          subject: content.subject,
          html: content.body,
        },
      });
    } catch (error) {
      console.error('Firebase 이메일 오류:', error);
    }
  }
}

// POST: 콘텐츠 생성 완료 처리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, status, completedTaskIds, failedTaskIds } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: '프로젝트 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 프로젝트 정보 가져오기
    const projectDoc = await db.collection('contentProjects').doc(projectId).get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { success: false, error: '프로젝트를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const projectData = projectDoc.data()!;

    // 태스크 상태 업데이트
    if (completedTaskIds && completedTaskIds.length > 0) {
      const batch = db.batch();
      for (const taskId of completedTaskIds) {
        const taskRef = db.collection('contentProjects').doc(projectId).collection('tasks').doc(taskId);
        batch.update(taskRef, { 
          status: 'completed',
          completedAt: fieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    if (failedTaskIds && failedTaskIds.length > 0) {
      const batch = db.batch();
      for (const taskId of failedTaskIds) {
        const taskRef = db.collection('contentProjects').doc(projectId).collection('tasks').doc(taskId);
        batch.update(taskRef, { 
          status: 'failed',
        });
      }
      await batch.commit();
    }

    // 전체 태스크 상태 확인
    const tasksSnapshot = await db.collection('contentProjects')
      .doc(projectId)
      .collection('tasks')
      .get();

    let completedCount = 0;
    let failedCount = 0;
    let pendingCount = 0;

    tasksSnapshot.docs.forEach(doc => {
      const task = doc.data();
      switch (task.status) {
        case 'completed':
          completedCount++;
          break;
        case 'failed':
          failedCount++;
          break;
        default:
          pendingCount++;
      }
    });

    const totalCount = tasksSnapshot.size;
    const allDone = pendingCount === 0;

    // 프로젝트 상태 결정
    let newStatus: string;
    if (allDone) {
      if (failedCount === 0) {
        newStatus = 'completed';
      } else if (completedCount === 0) {
        newStatus = 'failed';
      } else {
        newStatus = 'partial';
      }
    } else {
      newStatus = 'processing';
    }

    // 프로젝트 업데이트
    await db.collection('contentProjects').doc(projectId).update({
      status: newStatus,
      completedTasks: completedCount,
      updatedAt: fieldValue.serverTimestamp(),
      ...(allDone && { completedAt: fieldValue.serverTimestamp() }),
    });

    // 완료 시 이메일 발송
    if (allDone && projectData.userId) {
      // 사용자 정보 가져오기
      const userDoc = await db.collection('users').doc(projectData.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data()!;
        const email = userData.email;
        const language = userData.language || 'ko';
        const productName = projectData.concept?.productName || '콘텐츠';

        if (email) {
          await sendCompletionEmail(
            email,
            projectId,
            productName,
            completedCount,
            totalCount,
            language
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        status: newStatus,
        completedCount,
        failedCount,
        totalCount,
        allDone,
      },
    });

  } catch (error: any) {
    console.error('완료 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

