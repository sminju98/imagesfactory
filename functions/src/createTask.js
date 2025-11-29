"use strict";
/**
 * Task 생성 Firebase Function (v2)
 * HTTP Callable Function으로 클라이언트에서 호출
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
exports.createTask = void 0;
var https_1 = require("firebase-functions/v2/https");
var firestore_1 = require("./utils/firestore");
var types_1 = require("./types");
/**
 * Task 생성 및 Job 생성 (v2)
 */
exports.createTask = (0, https_1.onCall)({
    region: 'asia-northeast3',
    memory: '256MiB',
}, function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userEmail, data, prompt, selectedModels, referenceImageUrl, evolutionSourceId, totalImages, totalPoints, modelConfigs, jobsToCreate, _i, _a, _b, modelId, count, numCount, pointsPerImage, i, userRef, taskRef, transactionRef, result, batch, _c, jobsToCreate_1, jobData, jobRef, estimatedTime, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                // 1. 인증 확인
                if (!request.auth) {
                    throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
                }
                userId = request.auth.uid;
                userEmail = request.auth.token.email || '';
                data = request.data;
                prompt = data.prompt, selectedModels = data.selectedModels, referenceImageUrl = data.referenceImageUrl, evolutionSourceId = data.evolutionSourceId;
                // 2. 입력 유효성 검사
                if (!prompt || typeof prompt !== 'string') {
                    throw new https_1.HttpsError('invalid-argument', '프롬프트를 입력해주세요.');
                }
                if (prompt.length < 10) {
                    throw new https_1.HttpsError('invalid-argument', '프롬프트는 최소 10자 이상이어야 합니다.');
                }
                if (prompt.length > 1000) {
                    throw new https_1.HttpsError('invalid-argument', '프롬프트는 최대 1000자까지 입력 가능합니다.');
                }
                if (!selectedModels || Object.keys(selectedModels).length === 0) {
                    throw new https_1.HttpsError('invalid-argument', '최소 1개 이상의 모델을 선택해주세요.');
                }
                totalImages = 0;
                totalPoints = 0;
                modelConfigs = [];
                jobsToCreate = [];
                for (_i = 0, _a = Object.entries(selectedModels); _i < _a.length; _i++) {
                    _b = _a[_i], modelId = _b[0], count = _b[1];
                    numCount = parseInt(String(count), 10);
                    if (isNaN(numCount) || numCount <= 0)
                        continue;
                    if (numCount > 50) {
                        throw new https_1.HttpsError('invalid-argument', "\uBAA8\uB378\uB2F9 \uCD5C\uB300 50\uC7A5\uAE4C\uC9C0 \uC0DD\uC131 \uAC00\uB2A5\uD569\uB2C8\uB2E4. (".concat(modelId, ")"));
                    }
                    pointsPerImage = (0, types_1.getModelPoints)(modelId);
                    totalImages += numCount;
                    totalPoints += pointsPerImage * numCount;
                    modelConfigs.push({
                        modelId: modelId,
                        count: numCount,
                        pointsPerImage: pointsPerImage,
                        status: 'pending',
                        completedCount: 0,
                    });
                    // 모든 모델 동일하게 1개 요청 = 1개 Job
                    // Midjourney는 1회 요청(600P)에 4장 생성
                    for (i = 0; i < numCount; i++) {
                        jobsToCreate.push({
                            taskId: '',
                            userId: userId,
                            prompt: prompt,
                            modelId: modelId,
                            status: 'pending',
                            retries: 0,
                            pointsCost: pointsPerImage,
                            referenceImageUrl: referenceImageUrl || null,
                        });
                    }
                }
                if (totalImages === 0) {
                    throw new https_1.HttpsError('invalid-argument', '생성할 이미지가 없습니다.');
                }
                if (totalImages > 100) {
                    throw new https_1.HttpsError('invalid-argument', '한 번에 최대 100장까지 생성 가능합니다.');
                }
                console.log("\uD83D\uDCDD Task \uC0DD\uC131 \uC2DC\uC791: userId=".concat(userId, ", totalImages=").concat(totalImages, ", totalPoints=").concat(totalPoints));
                userRef = firestore_1.db.collection('users').doc(userId);
                taskRef = firestore_1.db.collection('tasks').doc();
                transactionRef = firestore_1.db.collection('pointTransactions').doc();
                _d.label = 1;
            case 1:
                _d.trys.push([1, 4, , 5]);
                return [4 /*yield*/, firestore_1.db.runTransaction(function (transaction) { return __awaiter(void 0, void 0, void 0, function () {
                        var userDoc, userData, currentPoints, newTask;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, transaction.get(userRef)];
                                case 1:
                                    userDoc = _a.sent();
                                    if (!userDoc.exists) {
                                        throw new https_1.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
                                    }
                                    userData = userDoc.data();
                                    currentPoints = userData.points || 0;
                                    if (currentPoints < totalPoints) {
                                        throw new https_1.HttpsError('failed-precondition', "\uD3EC\uC778\uD2B8\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4. \uD604\uC7AC: ".concat(currentPoints, "pt, \uD544\uC694: ").concat(totalPoints, "pt"));
                                    }
                                    // 포인트 차감
                                    transaction.update(userRef, {
                                        points: firestore_1.fieldValue.increment(-totalPoints),
                                        updatedAt: firestore_1.fieldValue.serverTimestamp(),
                                    });
                                    // 포인트 거래 내역 저장
                                    transaction.set(transactionRef, {
                                        userId: userId,
                                        amount: -totalPoints,
                                        type: 'usage',
                                        description: "\uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC694\uCCAD (".concat(totalImages, "\uC7A5)"),
                                        relatedGenerationId: taskRef.id,
                                        balanceBefore: currentPoints,
                                        balanceAfter: currentPoints - totalPoints,
                                        createdAt: firestore_1.fieldValue.serverTimestamp(),
                                    });
                                    newTask = {
                                        userId: userId,
                                        userEmail: userEmail,
                                        prompt: prompt,
                                        modelConfigs: modelConfigs,
                                        totalImages: totalImages,
                                        totalPoints: totalPoints,
                                        referenceImageUrl: referenceImageUrl || null,
                                        evolutionSourceId: evolutionSourceId || undefined,
                                        status: 'pending',
                                        progress: 0,
                                        pointsDeducted: true,
                                        transactionId: transactionRef.id,
                                        createdAt: firestore_1.fieldValue.serverTimestamp(),
                                        updatedAt: firestore_1.fieldValue.serverTimestamp(),
                                    };
                                    transaction.set(taskRef, newTask);
                                    return [2 /*return*/, {
                                            taskId: taskRef.id,
                                            transactionId: transactionRef.id,
                                            newBalance: currentPoints - totalPoints,
                                        }];
                            }
                        });
                    }); })];
            case 2:
                result = _d.sent();
                batch = firestore_1.db.batch();
                for (_c = 0, jobsToCreate_1 = jobsToCreate; _c < jobsToCreate_1.length; _c++) {
                    jobData = jobsToCreate_1[_c];
                    jobRef = taskRef.collection('jobs').doc();
                    batch.set(jobRef, __assign(__assign({}, jobData), { taskId: result.taskId, createdAt: firestore_1.fieldValue.serverTimestamp(), updatedAt: firestore_1.fieldValue.serverTimestamp() }));
                }
                return [4 /*yield*/, batch.commit()];
            case 3:
                _d.sent();
                console.log("\u2705 Task ".concat(result.taskId, " \uC0DD\uC131 \uC644\uB8CC: ").concat(totalImages, "\uAC1C Job \uC0DD\uC131"));
                estimatedTime = Math.ceil(totalImages * 10);
                return [2 /*return*/, {
                        success: true,
                        taskId: result.taskId,
                        totalImages: totalImages,
                        totalPoints: totalPoints,
                        estimatedTime: estimatedTime,
                        newBalance: result.newBalance,
                    }];
            case 4:
                error_1 = _d.sent();
                console.error('❌ Task 생성 실패:', error_1);
                if (error_1 instanceof https_1.HttpsError) {
                    throw error_1;
                }
                throw new https_1.HttpsError('internal', '이미지 생성 요청 중 오류가 발생했습니다.', error_1 instanceof Error ? error_1.message : String(error_1));
            case 5: return [2 /*return*/];
        }
    });
}); });
