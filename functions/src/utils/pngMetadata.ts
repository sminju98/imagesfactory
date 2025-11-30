/**
 * PNG 메타데이터 유틸리티
 * 이미지에 프롬프트 히스토리를 저장하고 읽는 기능
 */

import sharp from 'sharp';

// 프롬프트 히스토리 타입
export interface PromptGeneration {
  generation: number;      // 세대 번호 (1, 2, 3...)
  prompt: string;          // 프롬프트
  modelId: string;         // 사용된 모델
  timestamp: string;       // 생성 시간 (ISO string)
}

export interface ImageMetadata {
  promptHistory: PromptGeneration[];
  currentGeneration: number;
  createdAt: string;
  userId?: string;
  taskId?: string;
}

/**
 * PNG 이미지에 메타데이터 추가
 */
export async function addMetadataToPng(
  imageBuffer: Buffer,
  metadata: ImageMetadata
): Promise<Buffer> {
  try {
    // 메타데이터를 JSON 문자열로 변환
    const metadataJson = JSON.stringify(metadata);
    
    // Sharp를 사용해 PNG에 tEXt 청크로 메타데이터 추가
    const outputBuffer = await sharp(imageBuffer)
      .png({
        compressionLevel: 9,
      })
      .withMetadata({
        exif: {
          IFD0: {
            ImageDescription: metadataJson,
            Software: 'ImageFactory',
            Artist: 'ImageFactory AI',
          }
        }
      })
      .toBuffer();
    
    return outputBuffer;
  } catch (error) {
    console.error('PNG 메타데이터 추가 실패:', error);
    // 실패 시 원본 버퍼 반환
    return imageBuffer;
  }
}

/**
 * PNG 이미지에서 메타데이터 읽기
 */
export async function readMetadataFromPng(
  imageBuffer: Buffer
): Promise<ImageMetadata | null> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    // EXIF에서 ImageDescription 읽기
    if (metadata.exif) {
      // Sharp의 metadata()는 exif를 Buffer로 반환하므로 파싱 필요
      // 대신 raw exif 데이터에서 직접 추출 시도
      const exifString = metadata.exif.toString('utf8');
      
      // JSON 패턴 찾기
      const jsonMatch = exifString.match(/\{[\s\S]*"promptHistory"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as ImageMetadata;
        } catch {
          // JSON 파싱 실패
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('PNG 메타데이터 읽기 실패:', error);
    return null;
  }
}

/**
 * URL에서 이미지를 다운로드하고 메타데이터 읽기
 */
export async function readMetadataFromUrl(
  imageUrl: string
): Promise<ImageMetadata | null> {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.statusText}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    return await readMetadataFromPng(buffer);
  } catch (error) {
    console.error('URL에서 메타데이터 읽기 실패:', error);
    return null;
  }
}

/**
 * 새로운 프롬프트 히스토리 생성 (이전 히스토리 + 현재 프롬프트)
 */
export function createPromptHistory(
  previousMetadata: ImageMetadata | null,
  currentPrompt: string,
  modelId: string,
  userId?: string,
  taskId?: string
): ImageMetadata {
  const now = new Date().toISOString();
  
  // 이전 히스토리가 있으면 가져오고, 없으면 빈 배열
  const previousHistory = previousMetadata?.promptHistory || [];
  const previousGeneration = previousMetadata?.currentGeneration || 0;
  
  // 새로운 세대 정보
  const newGeneration: PromptGeneration = {
    generation: previousGeneration + 1,
    prompt: currentPrompt,
    modelId,
    timestamp: now,
  };
  
  // 기존 히스토리에 새 세대 추가
  let updatedHistory = [...previousHistory, newGeneration];
  
  // 최대 5세대까지만 유지 (오래된 것부터 삭제)
  if (updatedHistory.length > 5) {
    // 가장 오래된 것부터 삭제 (generation 번호가 작은 것부터)
    updatedHistory.sort((a, b) => a.generation - b.generation);
    updatedHistory = updatedHistory.slice(-5); // 최근 5개만 유지
    // generation 번호 재정렬 (1, 2, 3, 4, 5)
    updatedHistory = updatedHistory.map((gen, index) => ({
      ...gen,
      generation: index + 1,
    }));
  }
  
  return {
    promptHistory: updatedHistory,
    currentGeneration: previousGeneration + 1,
    createdAt: previousMetadata?.createdAt || now,
    userId,
    taskId,
  };
}

/**
 * 프롬프트 히스토리를 문자열로 변환 (AI 모델에 전달용)
 */
export function formatPromptHistoryForAI(metadata: ImageMetadata | null): string {
  if (!metadata || !metadata.promptHistory || metadata.promptHistory.length === 0) {
    return '';
  }
  
  const historyLines = metadata.promptHistory.map((gen) => 
    `[Generation ${gen.generation}] ${gen.prompt}`
  );
  
  return `Previous generations:\n${historyLines.join('\n')}\n\nCurrent generation: ${metadata.currentGeneration + 1}`;
}


