"use strict";
/**
 * Task 완료 체크 Firebase Function (v2)
 * Firestore Trigger: Job 상태가 변경되면 Task 완료 여부 확인
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
exports.checkTaskCompletion = void 0;
var firestore_1 = require("firebase-functions/v2/firestore");
var firestore_2 = require("./utils/firestore");
var zip_1 = require("./utils/zip");
var email_1 = require("./utils/email");
/**
 * Job 업데이트 시 Task 완료 여부 확인 (v2)
 */
exports.checkTaskCompletion = (0, firestore_1.onDocumentUpdated)({
    document: 'tasks/{taskId}/jobs/{jobId}',
    region: 'asia-northeast3',
    timeoutSeconds: 540,
    memory: '2GiB',
}, function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var change, _a, taskId, jobId, newData, oldData, taskRef, taskDoc, task, jobsSnapshot, completedJobs, failedJobs, pendingJobs, processingJobs, requeuedJobs, failedPoints, imageUrls, totalJobs, finishedJobs, progress, finalStatus, failedReason, refundedPoints, appUrl, resultPageUrl, updateData, userRef, galleryError_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                change = event.data;
                if (!change) {
                    console.log('No data associated with the event');
                    return [2 /*return*/];
                }
                _a = event.params, taskId = _a.taskId, jobId = _a.jobId;
                newData = change.after.data();
                oldData = change.before.data();
                // 상태 변경 확인
                if (newData.status === oldData.status) {
                    return [2 /*return*/];
                }
                // completed 또는 failed로 변경된 경우만 처리
                if (newData.status !== 'completed' && newData.status !== 'failed') {
                    return [2 /*return*/];
                }
                // requeued 상태에서 변경된 경우는 무시
                if (oldData.status === 'requeued') {
                    return [2 /*return*/];
                }
                console.log("\uD83D\uDD0D Job ".concat(jobId, " \uC0C1\uD0DC \uBCC0\uACBD: ").concat(oldData.status, " \u2192 ").concat(newData.status));
                taskRef = firestore_2.db.collection('tasks').doc(taskId);
                return [4 /*yield*/, taskRef.get()];
            case 1:
                taskDoc = _b.sent();
                if (!taskDoc.exists) {
                    console.error("Task ".concat(taskId, " not found"));
                    return [2 /*return*/];
                }
                task = taskDoc.data();
                // 이미 완료된 Task는 스킵
                if (task.status === 'completed' || task.status === 'failed') {
                    console.log("\u2139\uFE0F Task ".concat(taskId, " already ").concat(task.status, ", skipping"));
                    return [2 /*return*/];
                }
                return [4 /*yield*/, taskRef.collection('jobs').get()];
            case 2:
                jobsSnapshot = _b.sent();
                completedJobs = 0;
                failedJobs = 0;
                pendingJobs = 0;
                processingJobs = 0;
                requeuedJobs = 0;
                failedPoints = 0;
                imageUrls = [];
                jobsSnapshot.forEach(function (doc) {
                    var job = doc.data();
                    switch (job.status) {
                        case 'completed':
                            completedJobs++;
                            // Midjourney는 imageUrls 배열 사용 (4장)
                            if (job.imageUrls && job.imageUrls.length > 0) {
                                imageUrls.push.apply(imageUrls, job.imageUrls);
                            }
                            else if (job.imageUrl) {
                                imageUrls.push(job.imageUrl);
                            }
                            break;
                        case 'failed':
                            failedJobs++;
                            failedPoints += job.pointsCost || 0; // 실패한 포인트 누적
                            break;
                        case 'pending':
                            pendingJobs++;
                            break;
                        case 'processing':
                            processingJobs++;
                            break;
                        case 'requeued':
                            requeuedJobs++;
                            break;
                    }
                });
                totalJobs = jobsSnapshot.size - requeuedJobs;
                finishedJobs = completedJobs + failedJobs;
                progress = Math.round((finishedJobs / totalJobs) * 100);
                console.log("\uD83D\uDCCA Task ".concat(taskId, ": ").concat(completedJobs, " completed, ").concat(failedJobs, " failed, ").concat(pendingJobs, " pending, ").concat(processingJobs, " processing (").concat(progress, "%)"));
                if (!(task.status === 'pending' && (processingJobs > 0 || finishedJobs > 0))) return [3 /*break*/, 4];
                return [4 /*yield*/, taskRef.update({
                        status: 'processing',
                        updatedAt: firestore_2.fieldValue.serverTimestamp(),
                    })];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4: 
            // 진행률 업데이트
            return [4 /*yield*/, taskRef.update({
                    progress: progress,
                    updatedAt: firestore_2.fieldValue.serverTimestamp(),
                })];
            case 5:
                // 진행률 업데이트
                _b.sent();
                // 모든 Job이 완료되었는지 확인
                if (pendingJobs > 0 || processingJobs > 0) {
                    return [2 /*return*/];
                }
                console.log("\uD83C\uDF89 Task ".concat(taskId, " \uBAA8\uB4E0 Job \uC644\uB8CC!"));
                refundedPoints = 0;
                if (completedJobs === 0) {
                    finalStatus = 'failed';
                    failedReason = '모든 이미지 생성에 실패했습니다.';
                    refundedPoints = task.totalPoints; // 전액 환불
                }
                else {
                    finalStatus = 'completed';
                    if (failedJobs > 0) {
                        refundedPoints = failedPoints; // 부분 환불
                        failedReason = "".concat(failedJobs, "\uAC1C \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2E4\uD328 (").concat(refundedPoints, " \uD3EC\uC778\uD2B8 \uC790\uB3D9 \uD658\uBD88\uB428)");
                    }
                }
                if (!(refundedPoints > 0)) return [3 /*break*/, 7];
                return [4 /*yield*/, processRefund(task.userId, taskId, refundedPoints, failedJobs, task.totalImages)];
            case 6:
                _b.sent();
                console.log("\uD83D\uDCB0 ".concat(refundedPoints, " \uD3EC\uC778\uD2B8 \uD658\uBD88 \uC644\uB8CC (\uC2E4\uD328: ").concat(failedJobs, "\uAC1C)"));
                _b.label = 7;
            case 7:
                appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://imagefactory.co.kr';
                resultPageUrl = "".concat(appUrl, "/generation/").concat(taskId);
                updateData = {
                    status: finalStatus,
                    progress: 100,
                    imageUrls: imageUrls,
                    resultPageUrl: resultPageUrl,
                    finishedAt: firestore_2.fieldValue.serverTimestamp(),
                    updatedAt: firestore_2.fieldValue.serverTimestamp(),
                };
                // failedReason이 있을 때만 추가
                if (failedReason) {
                    updateData.failedReason = failedReason;
                }
                return [4 /*yield*/, taskRef.update(updateData)];
            case 8:
                _b.sent();
                userRef = firestore_2.db.collection('users').doc(task.userId);
                return [4 /*yield*/, userRef.update({
                        'stats.totalGenerations': firestore_2.fieldValue.increment(1),
                        'stats.totalImages': firestore_2.fieldValue.increment(completedJobs),
                        updatedAt: firestore_2.fieldValue.serverTimestamp(),
                    })];
            case 9:
                _b.sent();
                if (!(completedJobs > 0)) return [3 /*break*/, 13];
                _b.label = 10;
            case 10:
                _b.trys.push([10, 12, , 13]);
                return [4 /*yield*/, addImagesToGallery(taskId, task)];
            case 11:
                _b.sent();
                return [3 /*break*/, 13];
            case 12:
                galleryError_1 = _b.sent();
                console.error('갤러리 추가 실패 (무시하고 계속):', galleryError_1);
                return [3 /*break*/, 13];
            case 13:
                if (!(finalStatus === 'completed' && imageUrls.length > 0)) return [3 /*break*/, 15];
                return [4 /*yield*/, processCompletedTask(taskId, task, imageUrls, resultPageUrl, failedJobs, refundedPoints)];
            case 14:
                _b.sent();
                return [3 /*break*/, 17];
            case 15:
                if (!(finalStatus === 'failed')) return [3 /*break*/, 17];
                return [4 /*yield*/, processFailedTask(task, refundedPoints)];
            case 16:
                _b.sent();
                _b.label = 17;
            case 17: return [2 /*return*/];
        }
    });
}); });
/**
 * 완료된 Task 처리 (ZIP 생성 + 이메일 발송)
 */
function processCompletedTask(taskId, task, imageUrls, resultPageUrl, failedJobs, refundedPoints) {
    return __awaiter(this, void 0, void 0, function () {
        var taskRef, zipUrl, error_1, userDoc, userData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    taskRef = firestore_2.db.collection('tasks').doc(taskId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    if (!(imageUrls.length >= 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, zip_1.createZipAndUpload)(taskId, imageUrls)];
                case 2:
                    zipUrl = _a.sent();
                    return [4 /*yield*/, taskRef.update({
                            zipUrl: zipUrl,
                            updatedAt: firestore_2.fieldValue.serverTimestamp(),
                        })];
                case 3:
                    _a.sent();
                    console.log("\uD83D\uDCE6 ZIP \uC0DD\uC131 \uC644\uB8CC: ".concat(zipUrl));
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('ZIP 생성 실패:', error_1);
                    return [3 /*break*/, 6];
                case 6: return [4 /*yield*/, firestore_2.db.collection('users').doc(task.userId).get()];
                case 7:
                    userDoc = _a.sent();
                    userData = userDoc.data();
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, (0, email_1.sendEmail)({
                            to: task.userEmail,
                            subject: '🎨 ImageFactory - 이미지 생성 완료!',
                            html: (0, email_1.getGenerationCompleteEmailHTML)({
                                displayName: (userData === null || userData === void 0 ? void 0 : userData.displayName) || '사용자',
                                totalImages: task.totalImages,
                                successImages: imageUrls.length,
                                failedImages: failedJobs,
                                prompt: task.prompt,
                                resultPageUrl: resultPageUrl,
                                zipUrl: zipUrl,
                            }),
                        })];
                case 9:
                    _a.sent();
                    console.log("\uD83D\uDCE7 \uC644\uB8CC \uC774\uBA54\uC77C \uBC1C\uC1A1: ".concat(task.userEmail));
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _a.sent();
                    console.error('이메일 발송 실패:', error_2);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
/**
 * 실패한 Task 처리 (이메일 발송)
 */
function processFailedTask(task, refundedPoints) {
    return __awaiter(this, void 0, void 0, function () {
        var userDoc, userData, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, firestore_2.db.collection('users').doc(task.userId).get()];
                case 1:
                    userDoc = _a.sent();
                    userData = userDoc.data();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, email_1.sendEmail)({
                            to: task.userEmail,
                            subject: '😢 ImageFactory - 이미지 생성 실패 안내',
                            html: (0, email_1.getGenerationFailedEmailHTML)({
                                displayName: (userData === null || userData === void 0 ? void 0 : userData.displayName) || '사용자',
                                prompt: task.prompt,
                                reason: '서버 오류로 인해 이미지 생성에 실패했습니다.',
                                refundedPoints: refundedPoints,
                            }),
                        })];
                case 3:
                    _a.sent();
                    console.log("\uD83D\uDCE7 \uC2E4\uD328 \uC774\uBA54\uC77C \uBC1C\uC1A1: ".concat(task.userEmail));
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error('이메일 발송 실패:', error_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * 부분/전액 환불 처리
 */
function processRefund(userId, taskId, refundPoints, failedCount, totalCount) {
    return __awaiter(this, void 0, void 0, function () {
        var userRef, userDoc, userData, currentPoints, newPoints, transactionRef;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    userRef = firestore_2.db.collection('users').doc(userId);
                    return [4 /*yield*/, userRef.get()];
                case 1:
                    userDoc = _a.sent();
                    if (!userDoc.exists) {
                        console.error("\uD658\uBD88 \uC2E4\uD328: \uC0AC\uC6A9\uC790 ".concat(userId, " \uC5C6\uC74C"));
                        return [2 /*return*/];
                    }
                    userData = userDoc.data();
                    currentPoints = userData.points || 0;
                    newPoints = currentPoints + refundPoints;
                    // 사용자 포인트 증가
                    return [4 /*yield*/, userRef.update({
                            points: newPoints,
                            updatedAt: firestore_2.fieldValue.serverTimestamp(),
                        })];
                case 2:
                    // 사용자 포인트 증가
                    _a.sent();
                    transactionRef = firestore_2.db.collection('pointTransactions').doc();
                    return [4 /*yield*/, transactionRef.set({
                            userId: userId,
                            type: 'refund',
                            amount: refundPoints,
                            balanceBefore: currentPoints,
                            balanceAfter: newPoints,
                            description: failedCount === totalCount
                                ? "\uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC804\uCCB4 \uC2E4\uD328 \uD658\uBD88 (".concat(failedCount, "\uAC1C)")
                                : "\uC774\uBBF8\uC9C0 \uC0DD\uC131 \uBD80\uBD84 \uC2E4\uD328 \uD658\uBD88 (".concat(failedCount, "/").concat(totalCount, "\uAC1C \uC2E4\uD328)"),
                            relatedTaskId: taskId,
                            createdAt: firestore_2.fieldValue.serverTimestamp(),
                        })];
                case 3:
                    _a.sent();
                    console.log("\uD83D\uDCB0 \uD658\uBD88 \uD2B8\uB79C\uC7AD\uC158 \uAE30\uB85D: ".concat(refundPoints, "P (").concat(currentPoints, " \u2192 ").concat(newPoints, ")"));
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * 갤러리에 이미지 추가
 */
function addImagesToGallery(taskId, task) {
    return __awaiter(this, void 0, void 0, function () {
        var taskRef, jobsSnapshot, batch, appUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    taskRef = firestore_2.db.collection('tasks').doc(taskId);
                    return [4 /*yield*/, taskRef.collection('jobs')
                            .where('status', '==', 'completed')
                            .get()];
                case 1:
                    jobsSnapshot = _a.sent();
                    batch = firestore_2.db.batch();
                    appUrl = process.env.CDN_DOMAIN || 'https://cdn.imagefactory.co.kr';
                    jobsSnapshot.forEach(function (doc) {
                        var job = doc.data();
                        if (!job.imageUrl)
                            return;
                        var galleryRef = firestore_2.db.collection('gallery')
                            .doc(task.userId)
                            .collection('images')
                            .doc();
                        // galleryImage 객체 생성 (undefined 필드 제외)
                        var galleryImage = {
                            userId: task.userId,
                            taskId: taskId,
                            jobId: doc.id,
                            prompt: task.prompt,
                            modelId: job.modelId,
                            imageUrl: job.imageUrl,
                            thumbnailUrl: job.thumbnailUrl || job.imageUrl,
                            publicUrl: "".concat(appUrl, "/").concat(task.userId, "/").concat(doc.id, ".png"),
                            width: 1024,
                            height: 1024,
                            fileSize: 0,
                            likesCount: 0,
                            commentsCount: 0,
                            isPublic: true,
                            evolutionGeneration: 0,
                            createdAt: firestore_2.fieldValue.serverTimestamp(),
                        };
                        // parentImageId가 있을 때만 추가
                        if (task.evolutionSourceId) {
                            galleryImage.parentImageId = task.evolutionSourceId;
                        }
                        batch.set(galleryRef, galleryImage);
                    });
                    return [4 /*yield*/, batch.commit()];
                case 2:
                    _a.sent();
                    console.log("\uD83D\uDDBC\uFE0F \uAC24\uB7EC\uB9AC\uC5D0 ".concat(jobsSnapshot.size, "\uAC1C \uC774\uBBF8\uC9C0 \uCD94\uAC00"));
                    return [2 /*return*/];
            }
        });
    });
}
