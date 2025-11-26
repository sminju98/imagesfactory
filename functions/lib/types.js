"use strict";
/**
 * Firebase Functions용 타입 정의
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_POINTS = void 0;
exports.getModelPoints = getModelPoints;
/**
 * 모델별 포인트 가격
 */
exports.MODEL_POINTS = {
    'pixart': 10,
    'flux': 10,
    'realistic-vision': 20,
    'sdxl': 30,
    'leonardo': 30,
    'aurora': 60,
    'ideogram': 60,
    'dall-e-3': 150,
};
/**
 * 모델 ID로 포인트 가격 조회
 */
function getModelPoints(modelId) {
    return exports.MODEL_POINTS[modelId] || 30;
}
//# sourceMappingURL=types.js.map