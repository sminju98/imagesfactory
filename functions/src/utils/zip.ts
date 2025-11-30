/**
 * ZIP 파일 생성 유틸리티
 */

import JSZip from 'jszip';
import fetch from 'node-fetch';
import { storage } from './firestore';

/**
 * 이미지 URL들을 다운로드하여 ZIP 파일로 만들고 Storage에 업로드
 */
export async function createZipAndUpload(
  imageUrls: string[],
  taskId: string
): Promise<string> {
  const zip = new JSZip();
  
  console.log(`📦 ZIP 생성 시작: Task ${taskId}, 총 ${imageUrls.length}개 이미지`);
  
  // 이미지 다운로드 및 ZIP에 추가
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`이미지 다운로드 실패: ${url}`);
        continue;
      }
      
      const buffer = await response.buffer();
      const filename = `image_${String(i + 1).padStart(3, '0')}.png`;
      zip.file(filename, buffer);
      console.log(`📦 ZIP에 추가: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error(`이미지 다운로드 오류 (${url}):`, error);
    }
  }
  
  // ZIP 파일 생성
  console.log('📦 ZIP 압축 중...');
  const zipBuffer = await zip.generateAsync({ 
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  console.log(`✅ ZIP 파일 생성 완료 (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  
  // Storage에 업로드
  const bucket = storage.bucket();
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const zipFilename = `zips/${taskId}_${date}.zip`;
  const file = bucket.file(zipFilename);
  
  await file.save(zipBuffer, {
    contentType: 'application/zip',
    metadata: {
      cacheControl: 'public, max-age=2592000',
      metadata: { taskId },
    },
  });
  
  await file.makePublic();
  const zipUrl = `https://storage.googleapis.com/${bucket.name}/${zipFilename}`;
  
  console.log(`✅ ZIP 파일 Storage 업로드 완료: ${zipUrl}`);
  
  return zipUrl;
}


