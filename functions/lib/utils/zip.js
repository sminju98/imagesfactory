"use strict";
/**
 * ZIP 파일 생성 유틸리티
 * 대용량 처리를 위한 배치 다운로드 + 스트리밍 압축
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZipAndUpload = createZipAndUpload;
exports.deleteZip = deleteZip;
const jszip_1 = __importDefault(require("jszip"));
const firestore_1 = require("./firestore");
const node_fetch_1 = __importDefault(require("node-fetch"));
// 동시 다운로드 제한 (메모리 관리)
const CONCURRENT_DOWNLOADS = 10;
/**
 * 배열을 청크로 분할
 */
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * 이미지 다운로드 (타임아웃 포함)
 */
async function downloadImage(url, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await (0, node_fetch_1.default)(url, { signal: controller.signal });
        if (!response.ok)
            return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    catch {
        return null;
    }
    finally {
        clearTimeout(timeout);
    }
}
/**
 * ZIP 파일을 생성하고 Firebase Storage에 업로드
 * 대용량 처리를 위해 배치 다운로드 적용
 * @param taskId 작업 ID
 * @param imageUrls ZIP에 포함할 이미지 URL 목록
 * @returns 생성된 ZIP 파일의 공개 다운로드 URL
 */
async function createZipAndUpload(taskId, imageUrls) {
    const zip = new jszip_1.default();
    const MAX_ZIP_SIZE_MB = 1000; // 최대 1GB
    let currentZipSize = 0;
    let addedCount = 0;
    console.log(`📦 ZIP 생성 시작: Task ${taskId}, 총 ${imageUrls.length}개 이미지`);
    // 이미지 URL을 청크로 분할하여 배치 다운로드
    const urlChunks = chunkArray(imageUrls, CONCURRENT_DOWNLOADS);
    for (let chunkIdx = 0; chunkIdx < urlChunks.length; chunkIdx++) {
        const chunk = urlChunks[chunkIdx];
        const startIdx = chunkIdx * CONCURRENT_DOWNLOADS;
        console.log(`📦 배치 ${chunkIdx + 1}/${urlChunks.length} 처리 중... (${chunk.length}개)`);
        // 병렬 다운로드
        const downloads = await Promise.all(chunk.map(async (url, idx) => {
            const buffer = await downloadImage(url);
            return { idx: startIdx + idx, buffer, url };
        }));
        // ZIP에 추가
        for (const { idx, buffer, url } of downloads) {
            if (!buffer) {
                console.warn(`⚠️ 이미지 ${idx + 1} 다운로드 실패`);
                continue;
            }
            // ZIP 파일 크기 제한 체크
            if ((currentZipSize + buffer.byteLength) / (1024 * 1024) > MAX_ZIP_SIZE_MB) {
                console.warn(`⚠️ ZIP 파일 크기 제한 (${MAX_ZIP_SIZE_MB}MB) 도달. 나머지 생략.`);
                break;
            }
            // 파일명에서 모델 정보 추출
            const modelMatch = url.match(/_([a-zA-Z0-9-]+)\.png$/);
            const modelName = modelMatch ? modelMatch[1] : 'unknown';
            const filename = `image_${String(idx + 1).padStart(4, '0')}_${modelName}.png`;
            zip.file(filename, buffer);
            currentZipSize += buffer.byteLength;
            addedCount++;
        }
        // 크기 제한 도달 시 중단
        if ((currentZipSize / (1024 * 1024)) >= MAX_ZIP_SIZE_MB)
            break;
    }
    console.log(`📦 ZIP 압축 중... (${addedCount}개 이미지, ${(currentZipSize / (1024 * 1024)).toFixed(2)}MB)`);
    const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });
    const zipSizeMB = (zipBuffer.byteLength / (1024 * 1024)).toFixed(2);
    console.log(`✅ ZIP 파일 생성 완료 (${zipSizeMB} MB, ${addedCount}개 이미지)`);
    // Firebase Storage에 업로드
    const bucket = firestore_1.storage.bucket();
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
async function deleteZip(taskId) {
    const bucket = firestore_1.storage.bucket();
    const [files] = await bucket.getFiles({ prefix: `zips/${taskId}` });
    for (const file of files) {
        await file.delete();
        console.log(`🗑️ ZIP 파일 삭제: ${file.name}`);
    }
}
//# sourceMappingURL=zip.js.map