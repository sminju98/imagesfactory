/**
 * ZIP 파일 생성 유틸리티
 */

import JSZip from 'jszip';
import { storage } from './firestore';
import fetch from 'node-fetch';

/**
 * ZIP 파일을 생성하고 Firebase Storage에 업로드
 * @param taskId 작업 ID
 * @param imageUrls ZIP에 포함할 이미지 URL 목록
 * @returns 생성된 ZIP 파일의 공개 다운로드 URL
 */
export async function createZipAndUpload(
  taskId: string, 
  imageUrls: string[]
): Promise<string> {
  const zip = new JSZip();
  const MAX_ZIP_SIZE_MB = 500; // 최대 500MB
  let currentZipSize = 0;

  console.log(`📦 ZIP 생성 시작: Task ${taskId}, 총 ${imageUrls.length}개 이미지`);

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    
    try {
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        console.warn(`⚠️ 이미지 ${i + 1} 다운로드 실패: ${response.statusText}`);
        continue;
      }
      
      const imageBuffer = await response.arrayBuffer();
      const imageSizeKB = imageBuffer.byteLength / 1024;

      // ZIP 파일 크기 제한 체크
      if ((currentZipSize + imageBuffer.byteLength) / (1024 * 1024) > MAX_ZIP_SIZE_MB) {
        console.warn(
          `⚠️ ZIP 파일 크기 초과 (현재: ${(currentZipSize / (1024 * 1024)).toFixed(2)}MB). ` +
          `나머지 이미지는 ZIP에 포함되지 않습니다.`
        );
        break;
      }

      // 파일명에서 모델 정보 추출 또는 순번 사용
      const filename = `image_${String(i + 1).padStart(3, '0')}.png`;
      zip.file(filename, imageBuffer);
      currentZipSize += imageBuffer.byteLength;

      console.log(`📦 ZIP에 추가: ${filename} (${imageSizeKB.toFixed(2)} KB)`);
    } catch (error) {
      console.error(`⚠️ 이미지 ${i + 1} 처리 실패:`, error);
    }
  }

  console.log('📦 ZIP 압축 중...');
  
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipSizeMB = (zipBuffer.byteLength / (1024 * 1024)).toFixed(2);
  console.log(`✅ ZIP 파일 생성 완료 (${zipSizeMB} MB)`);

  // Firebase Storage에 업로드
  const bucket = storage.bucket();
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const file = bucket.file(`zips/${taskId}_${timestamp}.zip`);

  await file.save(zipBuffer, {
    contentType: 'application/zip',
    metadata: {
      cacheControl: 'public, max-age=2592000', // 30일
      contentDisposition: `attachment; filename="imagefactory_${timestamp}.zip"`,
    },
  });

  // 공개 URL 생성
  await file.makePublic();
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

  console.log('✅ ZIP 파일 Storage 업로드 완료:', downloadUrl);

  return downloadUrl;
}

/**
 * ZIP 파일 삭제
 */
export async function deleteZip(taskId: string): Promise<void> {
  const bucket = storage.bucket();
  const [files] = await bucket.getFiles({ prefix: `zips/${taskId}` });
  
  for (const file of files) {
    await file.delete();
    console.log(`🗑️ ZIP 파일 삭제: ${file.name}`);
  }
}

