"use strict";
/**
 * Job Worker Firebase Function (v2)
 * Firestore Trigger: Job 문서가 생성되면 이미지 생성 작업 수행
 *
 * 재시도 로직: 함수 내에서 최대 3회까지 직접 재시도 후 실패 처리
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobWorker = void 0;
var firestore_1 = require("firebase-functions/v2/firestore");
var firestore_2 = require("./utils/firestore");
var imageGeneration_1 = require("./utils/imageGeneration");
var types_1 = require("./types");
var node_fetch_1 = require("node-fetch");
var MAX_RETRIES = 3;
var RETRY_DELAY_MS = 2000; // 재시도 간 대기 시간
/**
 * 지연 함수
 */
var delay = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
/**
 * 이미지 생성 시도 (재시도 로직 포함)
 */
function tryGenerateImage(jobData, maxRetries) {
    return __awaiter(this, void 0, void 0, function () {
        var lastError, attempt, generatedImage, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lastError = '';
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= maxRetries)) return [3 /*break*/, 8];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 7]);
                    console.log("\uD83C\uDFA8 [".concat(jobData.modelId, "] \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2DC\uB3C4 ").concat(attempt, "/").concat(maxRetries));
                    return [4 /*yield*/, (0, imageGeneration_1.generateImage)({
                            prompt: jobData.prompt,
                            modelId: jobData.modelId,
                            referenceImageUrl: jobData.referenceImageUrl || undefined,
                            width: 1024,
                            height: 1024,
                        })];
                case 3:
                    generatedImage = _a.sent();
                    return [2 /*return*/, { success: true, image: generatedImage, retries: attempt - 1 }];
                case 4:
                    error_1 = _a.sent();
                    lastError = error_1 instanceof Error ? error_1.message : String(error_1);
                    console.error("\u274C [".concat(jobData.modelId, "] \uC2DC\uB3C4 ").concat(attempt, "/").concat(maxRetries, " \uC2E4\uD328:"), lastError);
                    if (!(attempt < maxRetries)) return [3 /*break*/, 6];
                    console.log("\u23F3 ".concat(RETRY_DELAY_MS, "ms \uD6C4 \uC7AC\uC2DC\uB3C4..."));
                    return [4 /*yield*/, delay(RETRY_DELAY_MS)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [3 /*break*/, 7];
                case 7:
                    attempt++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, { success: false, error: lastError, retries: maxRetries }];
            }
        });
    });
}
/**
 * Job 생성 시 이미지 생성 작업 수행 (v2)
 */
exports.jobWorker = (0, firestore_1.onDocumentCreated)({
    document: 'tasks/{taskId}/jobs/{jobId}',
    region: 'asia-northeast3',
    timeoutSeconds: 300,
    memory: '1GiB',
    maxInstances: types_1.SYSTEM_MAX_INSTANCES,
}, function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var snapshot, _a, taskId, jobId, jobData, userId, modelId, result, generatedImage, bucket, uploadedUrls, imagesToProcess, i, imgUrl, imageBuffer, imageResponse, _b, _c, suffix, filename, file, uploadedUrl, error_2, errorMessage;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                snapshot = event.data;
                if (!snapshot) {
                    console.log('No data associated with the event');
                    return [2 /*return*/];
                }
                _a = event.params, taskId = _a.taskId, jobId = _a.jobId;
                jobData = snapshot.data();
                // pending 상태의 Job만 처리
                if (jobData.status !== 'pending') {
                    console.log("\u2139\uFE0F Job ".concat(jobId, " is not pending, skipping"));
                    return [2 /*return*/];
                }
                userId = jobData.userId, modelId = jobData.modelId;
                console.log("\uD83D\uDE80 Job ".concat(jobId, " \uC2DC\uC791: Task=").concat(taskId, ", Model=").concat(modelId, ", User=").concat(userId));
                // Job 상태를 processing으로 업데이트
                return [4 /*yield*/, snapshot.ref.update({
                        status: 'processing',
                        updatedAt: firestore_2.fieldValue.serverTimestamp(),
                    })];
            case 1:
                // Job 상태를 processing으로 업데이트
                _d.sent();
                return [4 /*yield*/, tryGenerateImage(jobData, MAX_RETRIES)];
            case 2:
                result = _d.sent();
                if (!!result.success) return [3 /*break*/, 5];
                // 모든 재시도 실패
                console.error("\u2620\uFE0F Job ".concat(jobId, " \uC601\uAD6C \uC2E4\uD328 (").concat(MAX_RETRIES, "\uD68C \uC7AC\uC2DC\uB3C4 \uD6C4)"));
                return [4 /*yield*/, snapshot.ref.update({
                        status: 'failed',
                        retries: result.retries,
                        errorMessage: result.error,
                        finishedAt: firestore_2.fieldValue.serverTimestamp(),
                        updatedAt: firestore_2.fieldValue.serverTimestamp(),
                    })];
            case 3:
                _d.sent();
                return [4 /*yield*/, refundJobPoints(taskId, jobData)];
            case 4:
                _d.sent();
                return [2 /*return*/];
            case 5:
                generatedImage = result.image;
                console.log("\uD83C\uDFA8 \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC644\uB8CC (".concat(result.retries, "\uD68C \uC7AC\uC2DC\uB3C4 \uD6C4): ").concat(generatedImage.url.substring(0, 50), "..."));
                _d.label = 6;
            case 6:
                _d.trys.push([6, 17, , 20]);
                bucket = firestore_2.storage.bucket();
                uploadedUrls = [];
                imagesToProcess = generatedImage.urls || [generatedImage.url];
                console.log("\uD83D\uDCE6 ".concat(imagesToProcess.length, "\uC7A5 \uC774\uBBF8\uC9C0 \uCC98\uB9AC \uC911..."));
                i = 0;
                _d.label = 7;
            case 7:
                if (!(i < imagesToProcess.length)) return [3 /*break*/, 15];
                imgUrl = imagesToProcess[i];
                imageBuffer = void 0;
                if (!generatedImage.isBase64) return [3 /*break*/, 8];
                // base64 데이터를 직접 Buffer로 변환
                console.log("\uD83D\uDCE6 [Base64] \uC9C1\uC811 \uBCC0\uD658 \uC911...");
                imageBuffer = Buffer.from(imgUrl, 'base64');
                return [3 /*break*/, 11];
            case 8: return [4 /*yield*/, (0, node_fetch_1.default)(imgUrl)];
            case 9:
                imageResponse = _d.sent();
                if (!imageResponse.ok) {
                    throw new Error("\uC774\uBBF8\uC9C0 \uB2E4\uC6B4\uB85C\uB4DC \uC2E4\uD328: ".concat(imageResponse.statusText));
                }
                _c = (_b = Buffer).from;
                return [4 /*yield*/, imageResponse.arrayBuffer()];
            case 10:
                imageBuffer = _c.apply(_b, [_d.sent()]);
                _d.label = 11;
            case 11:
                suffix = imagesToProcess.length > 1 ? "_".concat(i + 1) : '';
                filename = "generations/".concat(taskId, "/").concat(jobId).concat(suffix, "_").concat(generatedImage.modelId, ".png");
                file = bucket.file(filename);
                return [4 /*yield*/, file.save(Buffer.from(imageBuffer), {
                        contentType: 'image/png',
                        metadata: {
                            cacheControl: 'public, max-age=2592000',
                            metadata: { taskId: taskId, jobId: jobId, modelId: generatedImage.modelId },
                        },
                    })];
            case 12:
                _d.sent();
                return [4 /*yield*/, file.makePublic()];
            case 13:
                _d.sent();
                uploadedUrl = "https://storage.googleapis.com/".concat(bucket.name, "/").concat(filename);
                uploadedUrls.push(uploadedUrl);
                console.log("\u2601\uFE0F Storage \uC5C5\uB85C\uB4DC \uC644\uB8CC (".concat(i + 1, "/").concat(imagesToProcess.length, "): ").concat(uploadedUrl));
                _d.label = 14;
            case 14:
                i++;
                return [3 /*break*/, 7];
            case 15: 
            // Job 상태 업데이트: completed
            return [4 /*yield*/, snapshot.ref.update({
                    status: 'completed',
                    retries: result.retries,
                    imageUrl: uploadedUrls[0], // 대표 이미지
                    imageUrls: uploadedUrls, // 모든 이미지 (Midjourney 4장)
                    thumbnailUrl: uploadedUrls[0],
                    finishedAt: firestore_2.fieldValue.serverTimestamp(),
                    updatedAt: firestore_2.fieldValue.serverTimestamp(),
                })];
            case 16:
                // Job 상태 업데이트: completed
                _d.sent();
                console.log("\u2705 Job ".concat(jobId, " \uC644\uB8CC (").concat(uploadedUrls.length, "\uC7A5)"));
                return [3 /*break*/, 20];
            case 17:
                error_2 = _d.sent();
                errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                console.error("\u274C Job ".concat(jobId, " Storage \uC5C5\uB85C\uB4DC \uC2E4\uD328:"), errorMessage);
                return [4 /*yield*/, snapshot.ref.update({
                        status: 'failed',
                        errorMessage: "Storage \uC5C5\uB85C\uB4DC \uC2E4\uD328: ".concat(errorMessage),
                        finishedAt: firestore_2.fieldValue.serverTimestamp(),
                        updatedAt: firestore_2.fieldValue.serverTimestamp(),
                    })];
            case 18:
                _d.sent();
                return [4 /*yield*/, refundJobPoints(taskId, jobData)];
            case 19:
                _d.sent();
                return [3 /*break*/, 20];
            case 20: return [2 /*return*/];
        }
    });
}); });
/**
 * 실패한 Job에 대한 포인트 환불
 */
function refundJobPoints(taskId, jobData) {
    return __awaiter(this, void 0, void 0, function () {
        var taskRef, error_3;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    taskRef = firestore_2.db.collection('tasks').doc(taskId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, firestore_2.db.runTransaction(function (transaction) { return __awaiter(_this, void 0, void 0, function () {
                            var taskDoc, task, userRef, userDoc, userData, refundAmount, transactionRef;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, transaction.get(taskRef)];
                                    case 1:
                                        taskDoc = _a.sent();
                                        if (!taskDoc.exists) {
                                            console.error("Task ".concat(taskId, " not found for refund"));
                                            return [2 /*return*/];
                                        }
                                        task = taskDoc.data();
                                        userRef = firestore_2.db.collection('users').doc(task.userId);
                                        return [4 /*yield*/, transaction.get(userRef)];
                                    case 2:
                                        userDoc = _a.sent();
                                        if (!userDoc.exists) {
                                            console.error("User ".concat(task.userId, " not found for refund"));
                                            return [2 /*return*/];
                                        }
                                        userData = userDoc.data();
                                        refundAmount = jobData.pointsCost;
                                        transaction.update(userRef, {
                                            points: firestore_2.fieldValue.increment(refundAmount),
                                            updatedAt: firestore_2.fieldValue.serverTimestamp(),
                                        });
                                        transactionRef = firestore_2.db.collection('pointTransactions').doc();
                                        transaction.set(transactionRef, {
                                            userId: task.userId,
                                            amount: refundAmount,
                                            type: 'refund',
                                            description: "\uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2E4\uD328 \uD658\uBD88 (".concat(jobData.modelId, ")"),
                                            relatedGenerationId: taskId,
                                            balanceBefore: userData.points,
                                            balanceAfter: userData.points + refundAmount,
                                            createdAt: firestore_2.fieldValue.serverTimestamp(),
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    console.log("\uD83D\uDCB0 \uD3EC\uC778\uD2B8 \uD658\uBD88 \uC644\uB8CC: ".concat(jobData.pointsCost, "pt \u2192 ").concat(jobData.userId));
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.error('포인트 환불 실패:', error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
