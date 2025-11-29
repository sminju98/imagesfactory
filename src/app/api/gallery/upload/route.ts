// 레퍼런스 이미지 업로드 API

import { NextRequest, NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: '파일과 사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }
    
    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 이미지 형식입니다 (JPEG, PNG, WebP, GIF만 가능)' },
        { status: 400 }
      );
    }
    
    // 파일 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 10MB를 초과할 수 없습니다' },
        { status: 400 }
      );
    }
    
    // 파일 버퍼로 변환
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Firebase Storage에 업로드
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `uploads/${userId}/${fileName}`;
    
    const bucket = storage.bucket();
    const fileRef = bucket.file(filePath);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: userId,
        },
      },
    });
    
    // 파일을 공개로 설정하고 URL 가져오기
    await fileRef.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    // Firestore에 메타데이터 저장
    const uploadId = `${userId}_${timestamp}`;
    const uploadRef = db.collection('uploadedImages').doc(uploadId);
    
    // 이미지 크기는 클라이언트에서 전달받거나 기본값 사용
    const width = parseInt(formData.get('width') as string) || 0;
    const height = parseInt(formData.get('height') as string) || 0;
    
    const uploadedImageData = {
      id: uploadId,
      userId,
      imageUrl,
      thumbnailUrl: imageUrl, // 동일하게 사용 (추후 썸네일 생성 가능)
      originalFileName: file.name,
      width,
      height,
      fileSize: file.size,
      mimeType: file.type,
      usedInTasks: [],
      usedCount: 0,
      tags: [],
      note: '',
      uploadedAt: FieldValue.serverTimestamp(),
      lastUsedAt: FieldValue.serverTimestamp(),
    };
    
    await uploadRef.set(uploadedImageData);
    
    return NextResponse.json({
      success: true,
      data: {
        id: uploadId,
        imageUrl,
        thumbnailUrl: imageUrl,
        originalFileName: file.name,
        fileSize: file.size,
      },
    });
    
  } catch (error: any) {
    console.error('이미지 업로드 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '업로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 업로드 이미지 사용 기록 업데이트 API
export async function PATCH(request: NextRequest) {
  try {
    const { imageId, taskId } = await request.json();
    
    if (!imageId || !taskId) {
      return NextResponse.json(
        { success: false, error: '이미지 ID와 Task ID가 필요합니다' },
        { status: 400 }
      );
    }
    
    const imageRef = db.collection('uploadedImages').doc(imageId);
    const imageDoc = await imageRef.get();
    
    if (!imageDoc.exists) {
      return NextResponse.json(
        { success: false, error: '업로드된 이미지를 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    
    await imageRef.update({
      usedInTasks: FieldValue.arrayUnion(taskId),
      usedCount: FieldValue.increment(1),
      lastUsedAt: FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({
      success: true,
      message: '사용 기록이 업데이트되었습니다',
    });
    
  } catch (error: any) {
    console.error('사용 기록 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
