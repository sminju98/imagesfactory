"use strict";
/**
 * AI 모델별 이미지 생성 유틸리티
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = generateImage;
var axios_1 = require("axios");
var retry_1 = require("./retry");
/**
 * 한글 포함 여부 확인
 */
function isKorean(text) {
    return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
}
/**
 * 민감한 키워드 우회 처리
 */
function sanitizePrompt(prompt) {
    var replacements = [
        // 의료/성형 관련
        [/plastic surgery/gi, 'aesthetic enhancement'],
        [/cosmetic surgery/gi, 'beauty treatment'],
        [/surgery clinic/gi, 'wellness center'],
        [/성형/gi, '뷰티'],
        [/수술/gi, '시술'],
        [/병원/gi, '센터'],
        [/클리닉/gi, '스튜디오'],
        // 신체 부위 민감 표현
        [/breast/gi, 'figure'],
        [/liposuction/gi, 'body contouring'],
        [/facelift/gi, 'facial rejuvenation'],
        [/nose job/gi, 'facial harmony'],
        [/rhinoplasty/gi, 'facial harmony'],
        // 기타 민감 표현
        [/before and after/gi, 'transformation'],
        [/medical procedure/gi, 'wellness service'],
    ];
    var sanitized = prompt;
    for (var _i = 0, replacements_1 = replacements; _i < replacements_1.length; _i++) {
        var _a = replacements_1[_i], pattern = _a[0], replacement = _a[1];
        sanitized = sanitized.replace(pattern, replacement);
    }
    if (sanitized !== prompt) {
        console.log("\uD83D\uDEE1\uFE0F [Sanitize] \uD504\uB86C\uD504\uD2B8 \uC6B0\uD68C \uCC98\uB9AC\uB428");
    }
    return sanitized;
}
/**
 * GPT를 사용한 프롬프트 교정 및 영어 번역
 * - 모든 언어를 영어로 번역
 * - 이미지 생성에 최적화된 프롬프트로 교정
 */
function enhanceAndTranslatePrompt(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var response, enhancedPrompt, error_1, err;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    // OpenAI API 키가 없으면 원본 반환
                    if (!process.env.OPENAI_API_KEY) {
                        console.log("\uD83C\uDF10 [Enhance] OpenAI API \uD0A4 \uC5C6\uC74C, \uC6D0\uBCF8 \uC0AC\uC6A9");
                        return [2 /*return*/, prompt];
                    }
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 3, , 4]);
                    console.log("\uD83E\uDD16 [GPT] \uD504\uB86C\uD504\uD2B8 \uAD50\uC815 \uC2DC\uC791");
                    return [4 /*yield*/, axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                            model: 'gpt-4o-mini',
                            messages: [
                                {
                                    role: 'system',
                                    content: "You are an expert prompt engineer for AI image generation.\nYour task:\n1. If the input is NOT in English, translate it to natural English first\n2. Enhance the prompt for better AI image generation results\n3. Add relevant artistic details (lighting, composition, style, quality)\n4. Keep it concise but descriptive (max 150 words)\n5. Output ONLY the enhanced English prompt, no explanations or prefixes",
                                },
                                {
                                    role: 'user',
                                    content: prompt,
                                },
                            ],
                            max_completion_tokens: 250,
                            temperature: 0.7,
                        }, {
                            headers: {
                                'Authorization': "Bearer ".concat(process.env.OPENAI_API_KEY),
                                'Content-Type': 'application/json',
                            },
                        })];
                case 2:
                    response = _g.sent();
                    enhancedPrompt = (_e = (_d = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.trim();
                    if (enhancedPrompt) {
                        console.log("\u2705 [GPT] \uD504\uB86C\uD504\uD2B8 \uAD50\uC815 \uC644\uB8CC: \"".concat(enhancedPrompt.substring(0, 80), "...\""));
                        return [2 /*return*/, enhancedPrompt];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _g.sent();
                    err = error_1;
                    console.error('❌ [GPT] 프롬프트 교정 실패:', ((_f = err.response) === null || _f === void 0 ? void 0 : _f.data) || err.message);
                    return [3 /*break*/, 4];
                case 4:
                    // 교정 실패 시 원본 반환
                    console.log("\uD83C\uDF10 [GPT] \uAD50\uC815 \uC2E4\uD328, \uC6D0\uBCF8 \uC0AC\uC6A9");
                    return [2 /*return*/, prompt];
            }
        });
    });
}
/**
 * 프롬프트 영문 번역 (GPT 사용, 폴백으로 Google Translation)
 */
function translatePromptToEnglish(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var enhanced, response, translated, error_2;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, enhanceAndTranslatePrompt(prompt)];
                case 1:
                    enhanced = _e.sent();
                    if (enhanced !== prompt) {
                        return [2 /*return*/, enhanced];
                    }
                    if (!process.env.GOOGLE_TRANSLATE_API_KEY) return [3 /*break*/, 5];
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, axios_1.default.post("https://translation.googleapis.com/language/translate/v2?key=".concat(process.env.GOOGLE_TRANSLATE_API_KEY), {
                            q: prompt,
                            target: 'en',
                            format: 'text',
                        })];
                case 3:
                    response = _e.sent();
                    if ((_d = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.translations) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.translatedText) {
                        translated = response.data.data.translations[0].translatedText;
                        console.log("\uD83C\uDF10 [Translate] \"".concat(prompt, "\" \u2192 \"").concat(translated, "\""));
                        return [2 /*return*/, translated];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _e.sent();
                    console.error('Translation error:', error_2);
                    return [3 /*break*/, 5];
                case 5:
                    // 모두 실패 시 원본 반환
                    console.log("\uD83C\uDF10 [Translate] Using original prompt (no translation)");
                    return [2 /*return*/, prompt];
            }
        });
    });
}
/**
 * DALL-E 3로 이미지 생성
 */
function generateWithDALLE3(params) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, _a, width, _b, height, referenceImageUrl, finalPrompt, _c, size, callAPI, response, error_3, sanitizedPrompt;
        var _this = this;
        var _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    prompt = params.prompt, _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b, referenceImageUrl = params.referenceImageUrl;
                    if (!isKorean(prompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(prompt)];
                case 1:
                    _c = _j.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = prompt;
                    _j.label = 3;
                case 3:
                    finalPrompt = _c;
                    if (referenceImageUrl) {
                        finalPrompt = "".concat(finalPrompt, ", in a similar style and composition to the reference image, maintaining consistent aesthetic");
                        console.log('🖼️ [DALL-E 3] 참고 이미지 스타일 반영');
                    }
                    size = width === height ? '1024x1024' : width > height ? '1792x1024' : '1024x1792';
                    callAPI = function (promptToUse) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, axios_1.default.post('https://api.openai.com/v1/images/generations', {
                                    model: 'dall-e-3',
                                    prompt: promptToUse,
                                    n: 1,
                                    size: size,
                                    quality: 'standard',
                                }, {
                                    headers: {
                                        'Authorization': "Bearer ".concat(process.env.OPENAI_API_KEY),
                                        'Content-Type': 'application/json',
                                    },
                                })];
                        });
                    }); };
                    _j.label = 4;
                case 4:
                    _j.trys.push([4, 6, , 10]);
                    return [4 /*yield*/, callAPI(finalPrompt)];
                case 5:
                    // 1차 시도: 원본 프롬프트로 시도
                    response = _j.sent();
                    return [3 /*break*/, 10];
                case 6:
                    error_3 = _j.sent();
                    if (!(((_d = error_3.response) === null || _d === void 0 ? void 0 : _d.status) === 400 || ((_e = error_3.response) === null || _e === void 0 ? void 0 : _e.status) === 403)) return [3 /*break*/, 8];
                    console.log('⚠️ [DALL-E 3] 정책 위반 감지, 민감단어 우회 후 재시도...');
                    sanitizedPrompt = sanitizePrompt(finalPrompt);
                    return [4 /*yield*/, callAPI(sanitizedPrompt)];
                case 7:
                    response = _j.sent();
                    return [3 /*break*/, 9];
                case 8: throw error_3;
                case 9: return [3 /*break*/, 10];
                case 10:
                    if (!((_h = (_g = (_f = response.data) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.url)) {
                        throw new Error('DALL-E 3 API 응답 오류');
                    }
                    return [2 /*return*/, {
                            url: response.data.data[0].url,
                            modelId: 'dall-e-3',
                        }];
            }
        });
    });
}
/**
 * xAI Grok-2 이미지 생성
 */
function generateWithGrok(params) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, sanitizedPrompt, finalPrompt, _a, response;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    prompt = params.prompt;
                    sanitizedPrompt = sanitizePrompt(prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _a = _e.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = sanitizedPrompt;
                    _e.label = 3;
                case 3:
                    finalPrompt = _a;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83C\uDF1F [Grok-2] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    return [4 /*yield*/, axios_1.default.post('https://api.x.ai/v1/images/generations', {
                            model: 'grok-2-image-1212',
                            prompt: finalPrompt,
                            n: 1,
                            response_format: 'url',
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(process.env.XAI_API_KEY),
                            },
                        })];
                case 4:
                    response = _e.sent();
                    if (!((_d = (_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.url)) {
                        console.error('❌ [Grok] API 응답:', JSON.stringify(response.data));
                        throw new Error('Grok API 응답 오류');
                    }
                    console.log('✅ [Grok-2] 이미지 생성 완료');
                    return [2 /*return*/, {
                            url: response.data.data[0].url,
                            modelId: 'grok',
                        }];
            }
        });
    });
}
/**
 * Replicate API를 통한 이미지 생성 (SDXL, Flux, PixArt 등)
 * model: 모델 ID (예: 'owner/model-name') 또는 버전 해시
 * 새로운 API 엔드포인트: /v1/models/{owner}/{name}/predictions 사용
 */
function generateWithReplicate(params_1, model_1) {
    return __awaiter(this, arguments, void 0, function (params, model, inputOverrides) {
        var prompt, _a, width, _b, height, referenceImageUrl, modelId, finalPrompt, _c, input, isVersionHash, response, predictionId, prediction, maxWaitTime, startTime, pollResponse, outputUrl;
        if (inputOverrides === void 0) { inputOverrides = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    prompt = params.prompt, _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b, referenceImageUrl = params.referenceImageUrl, modelId = params.modelId;
                    if (!isKorean(prompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(prompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = prompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    input = __assign({ prompt: finalPrompt, width: width, height: height, num_outputs: 1 }, inputOverrides);
                    if (referenceImageUrl) {
                        input.image = referenceImageUrl;
                        input.prompt_strength = 0.8;
                    }
                    isVersionHash = model.length === 64 && /^[a-f0-9]+$/.test(model);
                    if (!isVersionHash) return [3 /*break*/, 5];
                    return [4 /*yield*/, axios_1.default.post('https://api.replicate.com/v1/predictions', { version: model, input: input }, {
                            headers: {
                                'Authorization': "Token ".concat(process.env.REPLICATE_API_TOKEN),
                                'Content-Type': 'application/json',
                            },
                        })];
                case 4:
                    // 버전 해시인 경우 기존 /v1/predictions 엔드포인트 사용
                    response = _d.sent();
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, axios_1.default.post("https://api.replicate.com/v1/models/".concat(model, "/predictions"), { input: input }, {
                        headers: {
                            'Authorization': "Token ".concat(process.env.REPLICATE_API_TOKEN),
                            'Content-Type': 'application/json',
                        },
                    })];
                case 6:
                    // owner/name 형태인 경우 새로운 /v1/models/{owner}/{name}/predictions 엔드포인트 사용
                    response = _d.sent();
                    _d.label = 7;
                case 7:
                    predictionId = response.data.id;
                    prediction = response.data;
                    maxWaitTime = 5 * 60 * 1000;
                    startTime = Date.now();
                    _d.label = 8;
                case 8:
                    if (!(prediction.status !== 'succeeded' && prediction.status !== 'failed')) return [3 /*break*/, 11];
                    if (Date.now() - startTime > maxWaitTime) {
                        throw new Error('Replicate prediction timeout');
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 9:
                    _d.sent();
                    return [4 /*yield*/, axios_1.default.get("https://api.replicate.com/v1/predictions/".concat(predictionId), {
                            headers: { 'Authorization': "Token ".concat(process.env.REPLICATE_API_TOKEN) },
                        })];
                case 10:
                    pollResponse = _d.sent();
                    prediction = pollResponse.data;
                    return [3 /*break*/, 8];
                case 11:
                    if (prediction.status === 'failed') {
                        throw new Error("Replicate prediction failed: ".concat(prediction.error));
                    }
                    outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
                    return [2 /*return*/, {
                            url: outputUrl,
                            modelId: modelId,
                        }];
            }
        });
    });
}
/**
 * SDXL 이미지 생성
 */
/**
 * Stable Diffusion 3.5 Large 이미지 생성 (Stability AI via Replicate)
 * SDXL보다 최신, MMDiT 아키텍처, 타이포그래피/프롬프트 이해 향상
 */
function generateWithSDXL(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, sanitizedPrompt, finalPrompt, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83C\uDFAF [SD 3.5 Large] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    return [2 /*return*/, generateWithReplicate(__assign(__assign({}, params), { prompt: finalPrompt, modelId: 'sdxl' }), 'stability-ai/stable-diffusion-3.5-large', {
                            width: width,
                            height: height,
                            num_inference_steps: 28,
                            guidance_scale: 3.5,
                            output_format: 'webp',
                            output_quality: 80,
                        })];
            }
        });
    });
}
/**
 * Flux 1.1 Pro 이미지 생성 (Black Forest Labs via Replicate)
 * 원조 개발사의 공식 최신 모델 - 고품질, 프롬프트 준수 최고
 */
function generateWithFlux(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, aspectRatio, sanitizedPrompt, finalPrompt, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    aspectRatio = width === height ? '1:1' : width > height ? '16:9' : '9:16';
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83C\uDFA8 [Flux 1.1 Pro] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    return [2 /*return*/, generateWithReplicate(__assign(__assign({}, params), { prompt: finalPrompt, modelId: 'flux' }), 'black-forest-labs/flux-1.1-pro', {
                            aspect_ratio: aspectRatio,
                            output_format: 'webp',
                            output_quality: 80,
                            safety_tolerance: 2,
                            prompt_upsampling: true,
                        })];
            }
        });
    });
}
/**
 * Hunyuan Image 3 이미지 생성 (Tencent via Replicate)
 */
function generateWithHunyuan(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, aspectRatio, sanitizedPrompt, finalPrompt, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    aspectRatio = width === height ? '1:1' : width > height ? '16:9' : '9:16';
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83C\uDFA8 [Hunyuan] Image 3 \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    return [2 /*return*/, generateWithReplicate(__assign(__assign({}, params), { prompt: finalPrompt, modelId: 'hunyuan' }), 'tencent/hunyuan-image-3', {
                            aspect_ratio: aspectRatio,
                            num_outputs: 1,
                        })];
            }
        });
    });
}
/**
 * Seedream 4.0 이미지 생성 (Segmind API)
 * 4K 고해상도 text-to-image 모델
 */
function generateWithSeedream(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, sanitizedPrompt, finalPrompt, _c, response, base64Image;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83C\uDFA8 [Seedream 4] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    return [4 /*yield*/, axios_1.default.post('https://api.segmind.com/v1/seedream-4', {
                            prompt: finalPrompt,
                            negative_prompt: 'blurry, low quality, distorted, deformed',
                            samples: 1,
                            width: width,
                            height: height,
                            guidance_scale: 7.5,
                            num_inference_steps: 30,
                        }, {
                            headers: {
                                'x-api-key': process.env.SEGMIND_API_KEY,
                                'Content-Type': 'application/json',
                            },
                            responseType: 'arraybuffer',
                        })];
                case 4:
                    response = _d.sent();
                    base64Image = Buffer.from(response.data).toString('base64');
                    console.log("\u2705 [Seedream 4] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC644\uB8CC");
                    return [2 /*return*/, {
                            url: base64Image, // base64 데이터만 반환 (data:image 접두사 없음)
                            modelId: 'seedream',
                            isBase64: true,
                        }];
            }
        });
    });
}
/**
 * Recraft V3 이미지 생성 (Replicate)
 * SOTA 벤치마크 1위, 긴 텍스트 렌더링, 다양한 스타일 지원
 */
function generateWithRecraft(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, sanitizedPrompt, finalPrompt, _c, size;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83D\uDD8C\uFE0F [Recraft V3] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791 (SOTA)");
                    size = "".concat(width, "x").concat(height);
                    return [2 /*return*/, generateWithReplicate(__assign(__assign({}, params), { prompt: finalPrompt, modelId: 'recraft' }), 'recraft-ai/recraft-v3', {
                            size: size,
                            style: 'realistic_image',
                        })];
            }
        });
    });
}
/**
 * Playground v2.5 이미지 생성 (Replicate)
 * 미적 점수 SDXL 2배, Aesthetic 특화 (53K+ runs)
 */
function generateWithPlayground(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, sanitizedPrompt, finalPrompt, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83C\uDFA8 [Playground v2.5] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    return [2 /*return*/, generateWithReplicate(__assign(__assign({}, params), { prompt: finalPrompt, modelId: 'playground' }), 'jyoung105/playground-v2.5', {
                            width: width,
                            height: height,
                            guidance_scale: 3,
                        })];
            }
        });
    });
}
/**
 * Kandinsky 3.0 이미지 생성 (Replicate)
 * 러시아 Sber AI, 가성비 고품질 (111K+ runs)
 */
function generateWithKandinsky(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, sanitizedPrompt, finalPrompt, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83E\uDE86 [Kandinsky 3.0] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    return [2 /*return*/, generateWithReplicate(__assign(__assign({}, params), { prompt: finalPrompt, modelId: 'kandinsky' }), 'asiryan/kandinsky-3.0', {
                            width: width,
                            height: height,
                            num_inference_steps: 25,
                        })];
            }
        });
    });
}
/**
 * PixArt-Σ 이미지 생성 (via Replicate)
 * 고품질 텍스트-이미지 생성, 빠른 속도
 * 버전 해시: 5a54352c99d9fef467986bc8f3a20205e8712cbd3df1cbae4975d6254c902de1
 */
function generateWithPixArt(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, sanitizedPrompt, finalPrompt, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83C\uDFA8 [PixArt-\u03A3] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    // 버전 해시 방식으로 호출
                    return [2 /*return*/, generateWithReplicate(__assign(__assign({}, params), { prompt: finalPrompt, modelId: 'pixart' }), '5a54352c99d9fef467986bc8f3a20205e8712cbd3df1cbae4975d6254c902de1', {
                            width: width,
                            height: height,
                            num_inference_steps: 20,
                            guidance_scale: 4.5,
                        })];
            }
        });
    });
}
/**
 * Realistic Vision v6 이미지 생성 (via Replicate)
 * 포토리얼리즘 특화, 인물/피부 질감 최적화
 * 버전 해시: fa61c3351b7fe2fe2497082fb459168e88ff1b66c845f12bfdaaa4f2139f6a9a
 */
function generateWithRealisticVision(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, sanitizedPrompt, finalPrompt, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 768 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log("\uD83D\uDCF8 [Realistic Vision v6] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    // 버전 해시 방식으로 호출 (num_steps 파라미터 사용)
                    return [2 /*return*/, generateWithReplicate(__assign(__assign({}, params), { prompt: finalPrompt + ', photorealistic, detailed, high quality, 8k', modelId: 'realistic-vision' }), 'fa61c3351b7fe2fe2497082fb459168e88ff1b66c845f12bfdaaa4f2139f6a9a', {
                            width: width,
                            height: height,
                            num_steps: 30,
                            guidance_scale: 7.5,
                            negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
                        })];
            }
        });
    });
}
/**
 * Leonardo.ai 이미지 생성 (Phoenix 1.0)
 */
function generateWithLeonardo(params) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, _a, width, _b, height, sanitizedPrompt, finalPrompt, _c, response, generationId, generation, maxWaitTime, startTime, pollResponse;
        var _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    prompt = params.prompt, _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    sanitizedPrompt = sanitizePrompt(prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _g.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _g.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    console.log('🎨 [Leonardo] Phoenix 1.0 이미지 생성 시작');
                    return [4 /*yield*/, axios_1.default.post('https://cloud.leonardo.ai/api/rest/v1/generations', {
                            prompt: finalPrompt,
                            modelId: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3', // Phoenix 1.0
                            width: width,
                            height: height,
                            num_images: 1,
                        }, {
                            headers: {
                                'accept': 'application/json',
                                'authorization': "Bearer ".concat(process.env.LEONARDO_API_KEY),
                                'content-type': 'application/json',
                            },
                        })];
                case 4:
                    response = _g.sent();
                    if (!((_e = (_d = response.data) === null || _d === void 0 ? void 0 : _d.sdGenerationJob) === null || _e === void 0 ? void 0 : _e.generationId)) {
                        throw new Error('Leonardo API 응답 오류');
                    }
                    generationId = response.data.sdGenerationJob.generationId;
                    generation = response.data.sdGenerationJob;
                    maxWaitTime = 5 * 60 * 1000;
                    startTime = Date.now();
                    _g.label = 5;
                case 5:
                    if (!(generation.status !== 'COMPLETE' && generation.status !== 'FAILED')) return [3 /*break*/, 8];
                    if (Date.now() - startTime > maxWaitTime) {
                        throw new Error('Leonardo generation timeout');
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 6:
                    _g.sent();
                    return [4 /*yield*/, axios_1.default.get("https://cloud.leonardo.ai/api/rest/v1/generations/".concat(generationId), {
                            headers: {
                                'accept': 'application/json',
                                'authorization': "Bearer ".concat(process.env.LEONARDO_API_KEY),
                            },
                        })];
                case 7:
                    pollResponse = _g.sent();
                    generation = pollResponse.data.generations_by_pk;
                    return [3 /*break*/, 5];
                case 8:
                    if (generation.status === 'FAILED' || !((_f = generation.generated_images) === null || _f === void 0 ? void 0 : _f.length)) {
                        throw new Error("Leonardo generation failed");
                    }
                    return [2 /*return*/, {
                            url: generation.generated_images[0].url,
                            modelId: 'leonardo',
                        }];
            }
        });
    });
}
/**
 * GPT-Image-1 이미지 생성 (OpenAI 최신 이미지 모델)
 * 참고: https://platform.openai.com/docs/api-reference/images/create
 * 실패 시 민감단어 우회 처리 후 재시도
 */
function generateWithGPTImage(params) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, _a, width, _b, height, referenceImageUrl, finalPrompt, _c, size, callAPI, response, error_4, sanitizedPrompt, imageData, imageUrl, storage, bucket, filename, file, imageBuffer;
        var _this = this;
        var _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    prompt = params.prompt, _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b, referenceImageUrl = params.referenceImageUrl;
                    if (!isKorean(prompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(prompt)];
                case 1:
                    _c = _h.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = prompt;
                    _h.label = 3;
                case 3:
                    finalPrompt = _c;
                    if (referenceImageUrl) {
                        finalPrompt = "".concat(finalPrompt, ", in a similar style and composition to the reference image, maintaining consistent aesthetic");
                        console.log('🖼️ [GPT-Image-1] 참고 이미지 스타일 반영');
                    }
                    size = width === height ? '1024x1024' : width > height ? '1536x1024' : '1024x1536';
                    console.log("\uD83C\uDFA8 [GPT-Image-1] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791 (size: ".concat(size, ")"));
                    callAPI = function (promptToUse) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, axios_1.default.post('https://api.openai.com/v1/images/generations', {
                                    model: 'gpt-image-1',
                                    prompt: promptToUse,
                                    n: 1,
                                    size: size,
                                    quality: 'high',
                                }, {
                                    headers: {
                                        'Authorization': "Bearer ".concat(process.env.OPENAI_API_KEY),
                                        'Content-Type': 'application/json',
                                    },
                                })];
                        });
                    }); };
                    _h.label = 4;
                case 4:
                    _h.trys.push([4, 6, , 10]);
                    return [4 /*yield*/, callAPI(finalPrompt)];
                case 5:
                    // 1차 시도: 원본 프롬프트로 시도
                    response = _h.sent();
                    return [3 /*break*/, 10];
                case 6:
                    error_4 = _h.sent();
                    if (!(((_d = error_4.response) === null || _d === void 0 ? void 0 : _d.status) === 400 || ((_e = error_4.response) === null || _e === void 0 ? void 0 : _e.status) === 403)) return [3 /*break*/, 8];
                    console.log('⚠️ [GPT-Image-1] 정책 위반 감지, 민감단어 우회 후 재시도...');
                    sanitizedPrompt = sanitizePrompt(finalPrompt);
                    return [4 /*yield*/, callAPI(sanitizedPrompt)];
                case 7:
                    response = _h.sent();
                    return [3 /*break*/, 9];
                case 8: throw error_4;
                case 9: return [3 /*break*/, 10];
                case 10:
                    imageData = (_g = (_f = response.data) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g[0];
                    if (!imageData) {
                        console.error('❌ [GPT-Image-1] API 응답:', JSON.stringify(response.data));
                        throw new Error('GPT-Image-1 API 응답 오류');
                    }
                    imageUrl = imageData.url;
                    if (!(!imageUrl && imageData.b64_json)) return [3 /*break*/, 14];
                    console.log('📦 [GPT-Image-1] base64 이미지를 Storage에 업로드 중...');
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./firestore'); })];
                case 11:
                    storage = (_h.sent()).storage;
                    bucket = storage.bucket();
                    filename = "gpt-image-temp/".concat(Date.now(), "_").concat(Math.random().toString(36).substring(7), ".png");
                    file = bucket.file(filename);
                    imageBuffer = Buffer.from(imageData.b64_json, 'base64');
                    return [4 /*yield*/, file.save(imageBuffer, {
                            contentType: 'image/png',
                            metadata: {
                                cacheControl: 'public, max-age=2592000',
                            },
                        })];
                case 12:
                    _h.sent();
                    return [4 /*yield*/, file.makePublic()];
                case 13:
                    _h.sent();
                    imageUrl = "https://storage.googleapis.com/".concat(bucket.name, "/").concat(filename);
                    _h.label = 14;
                case 14:
                    console.log('✅ [GPT-Image-1] 이미지 생성 완료');
                    return [2 /*return*/, {
                            url: imageUrl,
                            modelId: 'gpt-image',
                        }];
            }
        });
    });
}
/**
 * Google Gemini 이미지 생성 (Imagen 4.0)
 * 참고: https://ai.google.dev/gemini-api/docs/imagen
 */
function generateWithGemini(params) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, _a, width, _b, height, finalPrompt, _c, aspectRatio, callAPI, response, error_5, sanitizedPrompt, base64Image, storage, bucket, filename, file, imageBuffer, imageUrl;
        var _this = this;
        var _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    prompt = params.prompt, _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    if (!isKorean(prompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(prompt)];
                case 1:
                    _c = _j.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = prompt;
                    _j.label = 3;
                case 3:
                    finalPrompt = _c;
                    aspectRatio = width === height ? '1:1' : width > height ? '16:9' : '9:16';
                    console.log("\uD83D\uDC8E [Gemini Imagen 4.0] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791 (aspectRatio: ".concat(aspectRatio, ")"));
                    callAPI = function (promptToUse) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2 /*return*/, axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict', {
                                    instances: [
                                        {
                                            prompt: promptToUse,
                                        },
                                    ],
                                    parameters: {
                                        sampleCount: 1,
                                        aspectRatio: aspectRatio,
                                        personGeneration: 'allow_adult',
                                    },
                                }, {
                                    headers: {
                                        'x-goog-api-key': process.env.GOOGLE_AI_API_KEY,
                                        'Content-Type': 'application/json',
                                    },
                                })];
                        });
                    }); };
                    _j.label = 4;
                case 4:
                    _j.trys.push([4, 6, , 10]);
                    return [4 /*yield*/, callAPI(finalPrompt)];
                case 5:
                    // 1차 시도: 원본 프롬프트로 시도
                    response = _j.sent();
                    return [3 /*break*/, 10];
                case 6:
                    error_5 = _j.sent();
                    if (!(((_d = error_5.response) === null || _d === void 0 ? void 0 : _d.status) === 400 || ((_e = error_5.response) === null || _e === void 0 ? void 0 : _e.status) === 403)) return [3 /*break*/, 8];
                    console.log('⚠️ [Gemini] 정책 위반 감지, 민감단어 우회 후 재시도...');
                    sanitizedPrompt = sanitizePrompt(finalPrompt);
                    return [4 /*yield*/, callAPI(sanitizedPrompt)];
                case 7:
                    response = _j.sent();
                    return [3 /*break*/, 9];
                case 8: throw error_5;
                case 9: return [3 /*break*/, 10];
                case 10:
                    if (!((_h = (_g = (_f = response.data) === null || _f === void 0 ? void 0 : _f.predictions) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.bytesBase64Encoded)) {
                        console.error('❌ [Gemini] API 응답:', JSON.stringify(response.data));
                        throw new Error('Gemini Imagen API 응답 오류');
                    }
                    console.log('✅ [Gemini] 이미지 생성 완료, base64 데이터 수신');
                    base64Image = response.data.predictions[0].bytesBase64Encoded;
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./firestore'); })];
                case 11:
                    storage = (_j.sent()).storage;
                    bucket = storage.bucket();
                    filename = "gemini-temp/".concat(Date.now(), "_").concat(Math.random().toString(36).substring(7), ".png");
                    file = bucket.file(filename);
                    imageBuffer = Buffer.from(base64Image, 'base64');
                    return [4 /*yield*/, file.save(imageBuffer, {
                            contentType: 'image/png',
                            metadata: {
                                cacheControl: 'public, max-age=2592000',
                            },
                        })];
                case 12:
                    _j.sent();
                    return [4 /*yield*/, file.makePublic()];
                case 13:
                    _j.sent();
                    imageUrl = "https://storage.googleapis.com/".concat(bucket.name, "/").concat(filename);
                    console.log("\u2601\uFE0F [Gemini] Storage \uC5C5\uB85C\uB4DC \uC644\uB8CC: ".concat(imageUrl));
                    return [2 /*return*/, {
                            url: imageUrl,
                            modelId: 'gemini',
                        }];
            }
        });
    });
}
/**
 * Ideogram 이미지 생성
 */
/**
 * Ideogram V3 Turbo 이미지 생성 (Replicate)
 * 텍스트 렌더링 최강, 4.6M runs
 */
function generateWithIdeogram(params) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, _b, height, sanitizedPrompt, finalPrompt, _c, aspectRatio;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    sanitizedPrompt = sanitizePrompt(params.prompt);
                    if (!isKorean(sanitizedPrompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(sanitizedPrompt)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = sanitizedPrompt;
                    _d.label = 3;
                case 3:
                    finalPrompt = _c;
                    finalPrompt = sanitizePrompt(finalPrompt);
                    aspectRatio = width === height ? '1:1' : width > height ? '16:9' : '9:16';
                    console.log("\u270D\uFE0F [Ideogram V3 Turbo] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791 (Replicate)");
                    return [2 /*return*/, generateWithReplicate(__assign(__assign({}, params), { prompt: finalPrompt, modelId: 'ideogram' }), 'ideogram-ai/ideogram-v3-turbo', {
                            prompt: finalPrompt,
                            aspect_ratio: aspectRatio,
                        })];
            }
        });
    });
}
/**
 * Midjourney 이미지 생성 (Maginary.ai API)
 * 참고: https://app.maginary.ai
 */
function generateWithMidjourney(params) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, _a, width, _b, height, finalPrompt, _c, aspectRatio, promptWithAspect, createResponse, errorText, createData, uuid, maxWaitTime, startTime, genDetails, getResponse, processingState, hasSuccessfulSlot, errorMsg, imageUrls, slots, successfulSlots;
        var _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    prompt = params.prompt, _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b;
                    if (!isKorean(prompt)) return [3 /*break*/, 2];
                    return [4 /*yield*/, translatePromptToEnglish(prompt)];
                case 1:
                    _c = _o.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = prompt;
                    _o.label = 3;
                case 3:
                    finalPrompt = _c;
                    aspectRatio = width === height ? '' : width > height ? ' --ar 16:9' : ' --ar 9:16';
                    promptWithAspect = finalPrompt + aspectRatio;
                    console.log("\uD83C\uDFA8 [Midjourney] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uC791");
                    console.log("\uD83D\uDCDD [Midjourney] \uD504\uB86C\uD504\uD2B8: ".concat(promptWithAspect.substring(0, 100), "..."));
                    return [4 /*yield*/, fetch('https://app.maginary.ai/api/gens/', {
                            method: 'POST',
                            headers: {
                                'Authorization': "Bearer ".concat(process.env.MAGINARY_API_KEY),
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ prompt: promptWithAspect }),
                        })];
                case 4:
                    createResponse = _o.sent();
                    if (!!createResponse.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, createResponse.text()];
                case 5:
                    errorText = _o.sent();
                    console.error("\u274C [Midjourney] API \uC624\uB958 (".concat(createResponse.status, "):"), errorText);
                    throw new Error("Midjourney API \uC624\uB958: ".concat(createResponse.status));
                case 6: return [4 /*yield*/, createResponse.json()];
                case 7:
                    createData = _o.sent();
                    if (!(createData === null || createData === void 0 ? void 0 : createData.uuid)) {
                        console.error('❌ [Midjourney] 생성 요청 실패:', JSON.stringify(createData));
                        throw new Error('Midjourney API 생성 요청 실패');
                    }
                    uuid = createData.uuid;
                    console.log("\uD83D\uDCDD [Midjourney] Generation UUID: ".concat(uuid));
                    maxWaitTime = 5 * 60 * 1000;
                    startTime = Date.now();
                    _o.label = 8;
                case 8:
                    if (!(Date.now() - startTime < maxWaitTime)) return [3 /*break*/, 12];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 9:
                    _o.sent(); // 3초마다 체크
                    return [4 /*yield*/, fetch("https://app.maginary.ai/api/gens/".concat(uuid, "/"), {
                            headers: {
                                'Authorization': "Bearer ".concat(process.env.MAGINARY_API_KEY),
                                'Content-Type': 'application/json',
                            },
                        })];
                case 10:
                    getResponse = _o.sent();
                    if (!getResponse.ok) {
                        console.error("\u274C [Midjourney] \uC0C1\uD0DC \uC870\uD68C \uC624\uB958 (".concat(getResponse.status, ")"));
                        return [3 /*break*/, 8]; // 재시도
                    }
                    return [4 /*yield*/, getResponse.json()];
                case 11:
                    genDetails = _o.sent();
                    processingState = genDetails.processing_state || genDetails.status;
                    hasSuccessfulSlot = (_e = (_d = genDetails.processing_result) === null || _d === void 0 ? void 0 : _d.slots) === null || _e === void 0 ? void 0 : _e.some(function (slot) { return slot.status === 'success' && slot.url; });
                    if (processingState === 'done' || hasSuccessfulSlot) {
                        console.log('✅ [Midjourney] 이미지 생성 완료');
                        console.log("\uD83D\uDCCB [Midjourney] \uC804\uCCB4 \uC751\uB2F5:", JSON.stringify(genDetails, null, 2));
                        return [3 /*break*/, 12];
                    }
                    if (processingState === 'failed' || processingState === 'error') {
                        errorMsg = ((_f = genDetails.processing_result) === null || _f === void 0 ? void 0 : _f.error_message) || genDetails.error || genDetails.message || 'Unknown error';
                        throw new Error("Midjourney \uC0DD\uC131 \uC2E4\uD328: ".concat(errorMsg));
                    }
                    console.log("\u23F3 [Midjourney] \uC0DD\uC131 \uC911... (state: ".concat(processingState, ")"));
                    return [3 /*break*/, 8];
                case 12:
                    imageUrls = [];
                    slots = ((_g = genDetails === null || genDetails === void 0 ? void 0 : genDetails.processing_result) === null || _g === void 0 ? void 0 : _g.slots) || [];
                    successfulSlots = slots.filter(function (slot) { return slot.status === 'success' && slot.url; });
                    if (successfulSlots.length > 0) {
                        imageUrls = successfulSlots.map(function (slot) { return slot.url; });
                        console.log("\uD83D\uDDBC\uFE0F [Midjourney] slots\uC5D0\uC11C ".concat(imageUrls.length, "\uC7A5 URL \uCD94\uCD9C"));
                    }
                    // 2) images 배열에서 찾기
                    if (imageUrls.length === 0 && ((_h = genDetails === null || genDetails === void 0 ? void 0 : genDetails.images) === null || _h === void 0 ? void 0 : _h.length) > 0) {
                        imageUrls = genDetails.images.filter(function (img) { return typeof img === 'string' || (img === null || img === void 0 ? void 0 : img.url); })
                            .map(function (img) { return typeof img === 'string' ? img : img.url; });
                        console.log("\uD83D\uDDBC\uFE0F [Midjourney] images\uC5D0\uC11C ".concat(imageUrls.length, "\uC7A5 URL \uCD94\uCD9C"));
                    }
                    // 3) result.images에서 찾기
                    if (imageUrls.length === 0 && ((_k = (_j = genDetails === null || genDetails === void 0 ? void 0 : genDetails.result) === null || _j === void 0 ? void 0 : _j.images) === null || _k === void 0 ? void 0 : _k.length) > 0) {
                        imageUrls = genDetails.result.images;
                        console.log("\uD83D\uDDBC\uFE0F [Midjourney] result.images\uC5D0\uC11C ".concat(imageUrls.length, "\uC7A5 URL \uCD94\uCD9C"));
                    }
                    // 4) processing_result.images에서 찾기
                    if (imageUrls.length === 0 && ((_m = (_l = genDetails === null || genDetails === void 0 ? void 0 : genDetails.processing_result) === null || _l === void 0 ? void 0 : _l.images) === null || _m === void 0 ? void 0 : _m.length) > 0) {
                        imageUrls = genDetails.processing_result.images;
                        console.log("\uD83D\uDDBC\uFE0F [Midjourney] processing_result.images\uC5D0\uC11C ".concat(imageUrls.length, "\uC7A5 URL \uCD94\uCD9C"));
                    }
                    // 5) output_url 또는 image_url 필드
                    if (imageUrls.length === 0 && ((genDetails === null || genDetails === void 0 ? void 0 : genDetails.output_url) || (genDetails === null || genDetails === void 0 ? void 0 : genDetails.image_url))) {
                        imageUrls = [genDetails.output_url || genDetails.image_url];
                        console.log("\uD83D\uDDBC\uFE0F [Midjourney] output_url\uC5D0\uC11C 1\uC7A5 URL \uCD94\uCD9C");
                    }
                    if (imageUrls.length === 0) {
                        console.error('❌ [Midjourney] URL을 찾을 수 없음. 전체 응답:', JSON.stringify(genDetails));
                        throw new Error('Midjourney 이미지 URL을 찾을 수 없습니다');
                    }
                    console.log("\uD83D\uDDBC\uFE0F [Midjourney] \uCD5C\uC885 ".concat(imageUrls.length, "\uC7A5 \uC0DD\uC131 \uC644\uB8CC"));
                    return [2 /*return*/, {
                            url: imageUrls[0], // 대표 이미지
                            urls: imageUrls, // 모든 이미지 (4장)
                            modelId: 'midjourney',
                        }];
            }
        });
    });
}
/**
 * 테스트용 더미 이미지 생성
 */
function generateDummyImage(params) {
    return __awaiter(this, void 0, void 0, function () {
        var modelId, _a, width, _b, height, referenceImageUrl, modelNames, displayName, label, colors, color, dummyUrl;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    modelId = params.modelId, _a = params.width, width = _a === void 0 ? 1024 : _a, _b = params.height, height = _b === void 0 ? 1024 : _b, referenceImageUrl = params.referenceImageUrl;
                    console.log("\uD83C\uDFA8 [TEST MODE] Generating dummy image for ".concat(modelId));
                    modelNames = {
                        'dall-e-3': 'DALL-E-3',
                        'sdxl': 'SDXL',
                        'flux': 'FLUX',
                        'pixart': 'PixArt',
                        'realistic-vision': 'Realistic',
                        'leonardo': 'Leonardo',
                        'ideogram': 'Ideogram',
                        'aurora': 'Aurora',
                    };
                    displayName = modelNames[modelId] || modelId.toUpperCase();
                    label = referenceImageUrl ? "".concat(displayName, "+REF") : displayName;
                    colors = ['6366F1', 'EC4899', '10B981', 'F59E0B', '3B82F6', '8B5CF6'];
                    color = colors[Math.floor(Math.random() * colors.length)];
                    dummyUrl = "https://placehold.co/".concat(width, "x").concat(height, "/").concat(color, "/FFFFFF/png?text=").concat(encodeURIComponent(label));
                    // 실제 생성 시간 시뮬레이션
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500 + Math.random() * 1000); })];
                case 1:
                    // 실제 생성 시간 시뮬레이션
                    _c.sent();
                    return [2 /*return*/, {
                            url: dummyUrl,
                            modelId: modelId,
                        }];
            }
        });
    });
}
/**
 * 모델별 이미지 생성 라우터
 */
function generateImage(params) {
    return __awaiter(this, void 0, void 0, function () {
        var modelId;
        var _this = this;
        return __generator(this, function (_a) {
            modelId = params.modelId;
            // 테스트 모드
            if (process.env.TEST_MODE === 'true') {
                console.log('🎨 [TEST MODE] Using dummy image generation');
                return [2 /*return*/, generateDummyImage(params)];
            }
            // 재시도 로직과 함께 실행
            return [2 /*return*/, (0, retry_1.withRetry)(function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (modelId) {
                            case 'dall-e-3':
                                return [2 /*return*/, generateWithDALLE3(params)];
                            case 'aurora':
                            case 'grok':
                                return [2 /*return*/, generateWithGrok(params)];
                            case 'sdxl':
                                return [2 /*return*/, generateWithSDXL(params)];
                            case 'pixart':
                                return [2 /*return*/, generateWithPixArt(params)];
                            case 'realistic-vision':
                                return [2 /*return*/, generateWithRealisticVision(params)];
                            case 'flux':
                                return [2 /*return*/, generateWithFlux(params)];
                            case 'leonardo':
                                return [2 /*return*/, generateWithLeonardo(params)];
                            case 'ideogram':
                                return [2 /*return*/, generateWithIdeogram(params)];
                            case 'gpt-image':
                                return [2 /*return*/, generateWithGPTImage(params)];
                            case 'gemini':
                                return [2 /*return*/, generateWithGemini(params)];
                            case 'midjourney':
                                return [2 /*return*/, generateWithMidjourney(params)];
                            case 'hunyuan':
                                return [2 /*return*/, generateWithHunyuan(params)];
                            case 'seedream':
                                return [2 /*return*/, generateWithSeedream(params)];
                            case 'recraft':
                                return [2 /*return*/, generateWithRecraft(params)];
                            case 'playground':
                                return [2 /*return*/, generateWithPlayground(params)];
                            case 'kandinsky':
                                return [2 /*return*/, generateWithKandinsky(params)];
                            default:
                                console.warn("Unknown model: ".concat(modelId, ", using SDXL as fallback"));
                                return [2 /*return*/, generateWithSDXL(__assign(__assign({}, params), { modelId: 'sdxl' }))];
                        }
                        return [2 /*return*/];
                    });
                }); })];
        });
    });
}
