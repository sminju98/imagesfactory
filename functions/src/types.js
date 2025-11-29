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
// 글로벌 가격: 1 포인트 = 1센트 ($0.01)
exports.MODEL_POINTS = {
    'pixart': 1,
    'flux': 1,
    'realistic-vision': 2,
    'sdxl': 3,
    'kandinsky': 2,
    'playground': 3,
    'leonardo': 5,
    'recraft': 4,
    'grok': 6,
    'ideogram': 6,
    'gemini': 8,
    'gpt-image': 10,
    'firefly': 10,
    'midjourney': 60, // 1회 요청당 4장 생성
    'dall-e-3': 15,
    'seedream': 5,
    'hunyuan': 3,
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
