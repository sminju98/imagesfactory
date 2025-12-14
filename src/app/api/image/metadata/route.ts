// 이미지 메타데이터 읽기 API

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

interface PromptGeneration {
  generation: number;
  prompt: string;
  modelId: string;
  timestamp: string;
}

interface ImageMetadata {
  promptHistory: PromptGeneration[];
  currentGeneration: number;
  createdAt: string;
  userId?: string;
  taskId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'url 파라미터가 필요합니다' },
        { status: 400 }
      );
    }

    // 이미지 다운로드
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: '이미지를 다운로드할 수 없습니다' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Sharp로 메타데이터 읽기
    const metadata = await sharp(buffer).metadata();

    let imageMetadata: ImageMetadata | null = null;

    // EXIF에서 메타데이터 추출 시도
    if (metadata.exif) {
      const exifString = metadata.exif.toString('utf8');
      
      // JSON 패턴 찾기
      const jsonMatch = exifString.match(/\{[\s\S]*"promptHistory"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          imageMetadata = JSON.parse(jsonMatch[0]) as ImageMetadata;
        } catch {
          // JSON 파싱 실패
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasMetadata: !!imageMetadata,
        metadata: imageMetadata,
        generation: imageMetadata?.currentGeneration || 0,
        promptHistory: imageMetadata?.promptHistory || [],
      },
    });

  } catch (error: any) {
    console.error('이미지 메타데이터 읽기 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}



