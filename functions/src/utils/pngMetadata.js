"use strict";
/**
 * PNG 메타데이터 유틸리티
 * 이미지에 프롬프트 히스토리를 저장하고 읽는 기능
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMetadataToPng = addMetadataToPng;
exports.readMetadataFromPng = readMetadataFromPng;
exports.readMetadataFromUrl = readMetadataFromUrl;
exports.createPromptHistory = createPromptHistory;
exports.formatPromptHistoryForAI = formatPromptHistoryForAI;
var sharp_1 = require("sharp");
/**
 * PNG 이미지에 메타데이터 추가
 */
function addMetadataToPng(imageBuffer, metadata) {
    return __awaiter(this, void 0, void 0, function () {
        var metadataJson, outputBuffer, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    metadataJson = JSON.stringify(metadata);
                    return [4 /*yield*/, (0, sharp_1.default)(imageBuffer)
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
                            .toBuffer()];
                case 1:
                    outputBuffer = _a.sent();
                    return [2 /*return*/, outputBuffer];
                case 2:
                    error_1 = _a.sent();
                    console.error('PNG 메타데이터 추가 실패:', error_1);
                    // 실패 시 원본 버퍼 반환
                    return [2 /*return*/, imageBuffer];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * PNG 이미지에서 메타데이터 읽기
 */
function readMetadataFromPng(imageBuffer) {
    return __awaiter(this, void 0, void 0, function () {
        var metadata, exifString, jsonMatch, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, sharp_1.default)(imageBuffer).metadata()];
                case 1:
                    metadata = _a.sent();
                    // EXIF에서 ImageDescription 읽기
                    if (metadata.exif) {
                        exifString = metadata.exif.toString('utf8');
                        jsonMatch = exifString.match(/\{[\s\S]*"promptHistory"[\s\S]*\}/);
                        if (jsonMatch) {
                            try {
                                return [2 /*return*/, JSON.parse(jsonMatch[0])];
                            }
                            catch (_b) {
                                // JSON 파싱 실패
                            }
                        }
                    }
                    return [2 /*return*/, null];
                case 2:
                    error_2 = _a.sent();
                    console.error('PNG 메타데이터 읽기 실패:', error_2);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * URL에서 이미지를 다운로드하고 메타데이터 읽기
 */
function readMetadataFromUrl(imageUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var fetch_1, response, buffer, _a, _b, error_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('node-fetch'); })];
                case 1:
                    fetch_1 = (_c.sent()).default;
                    return [4 /*yield*/, fetch_1(imageUrl)];
                case 2:
                    response = _c.sent();
                    if (!response.ok) {
                        throw new Error("\uC774\uBBF8\uC9C0 \uB2E4\uC6B4\uB85C\uB4DC \uC2E4\uD328: ".concat(response.statusText));
                    }
                    _b = (_a = Buffer).from;
                    return [4 /*yield*/, response.arrayBuffer()];
                case 3:
                    buffer = _b.apply(_a, [_c.sent()]);
                    return [4 /*yield*/, readMetadataFromPng(buffer)];
                case 4: return [2 /*return*/, _c.sent()];
                case 5:
                    error_3 = _c.sent();
                    console.error('URL에서 메타데이터 읽기 실패:', error_3);
                    return [2 /*return*/, null];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * 새로운 프롬프트 히스토리 생성 (이전 히스토리 + 현재 프롬프트)
 */
function createPromptHistory(previousMetadata, currentPrompt, modelId, userId, taskId) {
    var now = new Date().toISOString();
    // 이전 히스토리가 있으면 가져오고, 없으면 빈 배열
    var previousHistory = (previousMetadata === null || previousMetadata === void 0 ? void 0 : previousMetadata.promptHistory) || [];
    var previousGeneration = (previousMetadata === null || previousMetadata === void 0 ? void 0 : previousMetadata.currentGeneration) || 0;
    // 새로운 세대 정보
    var newGeneration = {
        generation: previousGeneration + 1,
        prompt: currentPrompt,
        modelId: modelId,
        timestamp: now,
    };
    return {
        promptHistory: __spreadArray(__spreadArray([], previousHistory, true), [newGeneration], false),
        currentGeneration: previousGeneration + 1,
        createdAt: (previousMetadata === null || previousMetadata === void 0 ? void 0 : previousMetadata.createdAt) || now,
        userId: userId,
        taskId: taskId,
    };
}
/**
 * 프롬프트 히스토리를 문자열로 변환 (AI 모델에 전달용)
 */
function formatPromptHistoryForAI(metadata) {
    if (!metadata || !metadata.promptHistory || metadata.promptHistory.length === 0) {
        return '';
    }
    var historyLines = metadata.promptHistory.map(function (gen) {
        return "[Generation ".concat(gen.generation, "] ").concat(gen.prompt);
    });
    return "Previous generations:\n".concat(historyLines.join('\n'), "\n\nCurrent generation: ").concat(metadata.currentGeneration + 1);
}
