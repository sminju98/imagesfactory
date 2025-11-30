/**
 * 재시도 유틸리티
 */

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoff?: boolean;
}

/**
 * 함수를 재시도하는 래퍼
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
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


