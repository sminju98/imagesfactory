"use strict";
/**
 * 재시도 유틸리티 (Exponential Backoff)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
exports.sleep = sleep;
exports.createRateLimiter = createRateLimiter;
/**
 * 재시도 가능한 함수 실행
 * @param fn 실행할 함수
 * @param maxRetries 최대 재시도 횟수
 * @param delayMs 기본 지연 시간 (ms)
 * @param retryOnStatusCodes 재시도할 HTTP 상태 코드
 */
async function withRetry(fn, maxRetries = 3, delayMs = 1000, retryOnStatusCodes = [429, 500, 502, 503, 504]) {
    let retries = 0;
    while (true) {
        try {
            return await fn();
        }
        catch (error) {
            const err = error;
            const statusCode = err.response?.status || err.status;
            if (retries < maxRetries && (retryOnStatusCodes.includes(statusCode) ||
                err.message?.includes('ECONNRESET') ||
                err.message?.includes('timeout'))) {
                // Exponential backoff with jitter
                const delay = delayMs * Math.pow(2, retries) + Math.random() * 1000;
                console.warn(`⚠️ Retrying due to status ${statusCode} or error: ${err.message}. ` +
                    `Attempt ${retries + 1}/${maxRetries}. Retrying in ${delay.toFixed(0)}ms...`);
                await sleep(delay);
                retries++;
            }
            else {
                console.error(`❌ Max retries (${maxRetries}) reached or non-retryable error:`, error);
                throw error;
            }
        }
    }
}
/**
 * 지연 함수
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Rate Limit 대기
 * @param requestsPerMinute 분당 요청 수 제한
 */
function createRateLimiter(requestsPerMinute) {
    const minInterval = 60000 / requestsPerMinute; // ms
    let lastRequest = 0;
    return async function waitForRateLimit() {
        const now = Date.now();
        const elapsed = now - lastRequest;
        if (elapsed < minInterval) {
            const waitTime = minInterval - elapsed;
            console.log(`⏳ Rate limiting: waiting ${waitTime.toFixed(0)}ms`);
            await sleep(waitTime);
        }
        lastRequest = Date.now();
    };
}
//# sourceMappingURL=retry.js.map