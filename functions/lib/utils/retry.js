"use strict";
/**
 * 재시도 유틸리티
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
/**
 * 함수를 재시도하는 래퍼
 */
async function withRetry(fn, options = {}) {
    const { maxRetries = 3, delayMs = 1000, backoff = true } = options;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
            if (attempt < maxRetries) {
                const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=retry.js.map