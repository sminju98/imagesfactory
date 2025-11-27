"use strict";
/**
 * Firebase Functions용 타입 정의
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_MAX_INSTANCES = exports.USER_CONCURRENCY_LIMIT = exports.MODEL_CONCURRENCY_LIMITS = exports.MODEL_POINTS = void 0;
exports.getModelPoints = getModelPoints;
exports.getModelConcurrencyLimit = getModelConcurrencyLimit;
/**
 * 모델별 포인트 가격
 */
exports.MODEL_POINTS = {
    'pixart': 10,
    'flux': 10,
    'realistic-vision': 20,
    'sdxl': 30,
    'kandinsky': 20,
    'playground': 30,
    'leonardo': 50,
    'recraft': 40,
    'grok': 60,
    'ideogram': 60,
    'gemini': 80,
    'gpt-image': 100,
    'firefly': 100,
    'midjourney': 120,
    'dall-e-3': 150,
    'seedream': 50,
    'hunyuan': 30,
};
/**
 * 모델 ID로 포인트 가격 조회
 */
function getModelPoints(modelId) {
    return exports.MODEL_POINTS[modelId] || 30;
}
/**
 * 모델별 동시 처리 제한 (Rate Limit)
 * - API Rate Limit을 고려하여 설정
 * - 숫자가 낮을수록 동시 요청이 적음
 */
exports.MODEL_CONCURRENCY_LIMITS = {
    // === 빠른 모델 (높은 동시성) ===
    'pixart': 20, // Replicate - 여유로움
    'flux': 20, // Replicate - 빠른 모델
    'realistic-vision': 15, // Replicate
    'sdxl': 15, // Stability AI
    'kandinsky': 15, // Replicate
    'hunyuan': 15, // Replicate
    // === 중간 속도 모델 ===
    'playground': 10, // Playground AI
    'leonardo': 8, // Leonardo.ai
    'recraft': 8, // Recraft AI
    'seedream': 10, // Segmind
    // === 제한적인 모델 ===
    'gemini': 10, // Google AI - 분당 60회
    'grok': 5, // xAI
    'ideogram': 5, // Ideogram - 분당 10회
    // === 프리미엄 모델 (낮은 동시성) ===
    'gpt-image': 3, // OpenAI - 분당 5회
    'dall-e-3': 3, // OpenAI - 분당 5회
    'firefly': 3, // Adobe - 분당 5회
    'midjourney': 2, // GoAPI - 제한적
};
/**
 * 모델별 동시 처리 제한 조회
 */
function getModelConcurrencyLimit(modelId) {
    return exports.MODEL_CONCURRENCY_LIMITS[modelId] || 5;
}
/**
 * 유저별 동시 작업 제한
 */
exports.USER_CONCURRENCY_LIMIT = 10; // 유저당 최대 10개 Job 동시 처리
/**
 * 전체 시스템 동시 처리 제한
 */
exports.SYSTEM_MAX_INSTANCES = 50; // Firebase Functions 최대 인스턴스
//# sourceMappingURL=types.js.map