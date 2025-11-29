"use strict";
/**
 * 이메일 발송 유틸리티 (Google SMTP)
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
exports.sendEmail = sendEmail;
exports.getGenerationCompleteEmailHTML = getGenerationCompleteEmailHTML;
exports.getGenerationFailedEmailHTML = getGenerationFailedEmailHTML;
var nodemailer = require("nodemailer");
// Google SMTP 설정
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});
/**
 * 이메일 발송
 */
function sendEmail(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var error_1;
        var to = _b.to, subject = _b.subject, html = _b.html;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
                        console.warn('⚠️ GMAIL_USER or GMAIL_APP_PASSWORD is not set. Skipping email sending.');
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, transporter.sendMail({
                            from: "ImageFactory <".concat(process.env.GMAIL_USER, ">"),
                            to: to,
                            subject: subject,
                            html: html,
                        })];
                case 2:
                    _c.sent();
                    console.log("\u2705 Email sent to ".concat(to));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    console.error("\u274C Failed to send email to ".concat(to, ":"), error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * 이미지 생성 완료 이메일 HTML
 */
function getGenerationCompleteEmailHTML(_a) {
    var displayName = _a.displayName, totalImages = _a.totalImages, successImages = _a.successImages, failedImages = _a.failedImages, prompt = _a.prompt, resultPageUrl = _a.resultPageUrl, zipUrl = _a.zipUrl;
    var failedHtml = failedImages > 0
        ? "<p style=\"color: #f59e0b; font-weight: bold;\">\u26A0\uFE0F ".concat(failedImages, "\uC7A5\uC740 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD558\uC5EC \uD3EC\uC778\uD2B8\uAC00 \uD658\uBD88\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>")
        : '';
    return "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <meta charset=\"utf-8\">\n      <title>\uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC644\uB8CC</title>\n    </head>\n    <body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;\">\n      <div style=\"max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">\n        <h1 style=\"color: #6366f1; margin-bottom: 24px;\">\uD83C\uDFA8 \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC644\uB8CC!</h1>\n        \n        <p style=\"color: #374151; font-size: 16px;\">\uC548\uB155\uD558\uC138\uC694, <strong>".concat(displayName, "</strong>\uB2D8!</p>\n        \n        <p style=\"color: #374151; font-size: 16px;\">\uC694\uCCAD\uD558\uC2E0 \uC774\uBBF8\uC9C0 \uC911 <strong>").concat(successImages, "\uC7A5</strong>\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>\n        \n        ").concat(failedHtml, "\n        \n        <div style=\"background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;\">\n          <p style=\"color: #6b7280; font-size: 14px; margin: 0;\">\uD504\uB86C\uD504\uD2B8:</p>\n          <p style=\"color: #374151; font-size: 14px; margin: 8px 0 0 0;\">").concat(prompt.substring(0, 200)).concat(prompt.length > 200 ? '...' : '', "</p>\n        </div>\n        \n        <div style=\"text-align: center; margin-top: 24px;\">\n          ").concat(zipUrl ? "<a href=\"".concat(zipUrl, "\" style=\"display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 8px;\">\n            \uD83D\uDCE5 ZIP \uB2E4\uC6B4\uB85C\uB4DC\n          </a>") : '', "\n          <a href=\"").concat(resultPageUrl, "\" style=\"display: inline-block; background: ").concat(zipUrl ? '#374151' : '#6366f1', "; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;\">\n            \uD83D\uDDBC\uFE0F \uACB0\uACFC \uBCF4\uAE30\n          </a>\n        </div>\n        \n        <hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;\" />\n        \n        <p style=\"color: #9ca3af; font-size: 12px; text-align: center;\">\n          \uC774 \uBA54\uC77C\uC740 ImageFactory\uC5D0\uC11C \uBC1C\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.\n        </p>\n      </div>\n    </body>\n    </html>\n  ");
}
/**
 * 이미지 생성 실패 이메일 HTML
 */
function getGenerationFailedEmailHTML(_a) {
    var displayName = _a.displayName, prompt = _a.prompt, reason = _a.reason, refundedPoints = _a.refundedPoints;
    var refundHtml = refundedPoints && refundedPoints > 0
        ? "<p style=\"color: #22c55e; font-weight: bold;\">\uD83D\uDCB0 ".concat(refundedPoints, " \uD3EC\uC778\uD2B8\uAC00 \uC790\uB3D9 \uD658\uBD88\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>")
        : '';
    return "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <meta charset=\"utf-8\">\n      <title>\uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2E4\uD328</title>\n    </head>\n    <body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;\">\n      <div style=\"max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">\n        <h1 style=\"color: #ef4444; margin-bottom: 24px;\">\uD83D\uDE22 \uC774\uBBF8\uC9C0 \uC0DD\uC131 \uC2E4\uD328</h1>\n        \n        <p style=\"color: #374151; font-size: 16px;\">\uC548\uB155\uD558\uC138\uC694, <strong>".concat(displayName, "</strong>\uB2D8!</p>\n        \n        <p style=\"color: #374151; font-size: 16px;\">\uC8C4\uC1A1\uD569\uB2C8\uB2E4. \uC694\uCCAD\uD558\uC2E0 \uC774\uBBF8\uC9C0 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD558\uC600\uC2B5\uB2C8\uB2E4.</p>\n        \n        ").concat(refundHtml, "\n        \n        <div style=\"background: #fef2f2; border-radius: 8px; padding: 16px; margin: 20px 0;\">\n          <p style=\"color: #991b1b; font-size: 14px; margin: 0;\">\uC2E4\uD328 \uC0AC\uC720:</p>\n          <p style=\"color: #374151; font-size: 14px; margin: 8px 0 0 0;\">").concat(reason, "</p>\n        </div>\n        \n        <div style=\"background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;\">\n          <p style=\"color: #6b7280; font-size: 14px; margin: 0;\">\uD504\uB86C\uD504\uD2B8:</p>\n          <p style=\"color: #374151; font-size: 14px; margin: 8px 0 0 0;\">").concat(prompt.substring(0, 200)).concat(prompt.length > 200 ? '...' : '', "</p>\n        </div>\n        \n        <p style=\"color: #374151; font-size: 14px;\">\n          \uBB38\uC81C\uAC00 \uC9C0\uC18D\uB418\uBA74 \uACE0\uAC1D\uC13C\uD130\uB85C \uBB38\uC758\uD574 \uC8FC\uC138\uC694.\n        </p>\n        \n        <hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;\" />\n        \n        <p style=\"color: #9ca3af; font-size: 12px; text-align: center;\">\n          \uC774 \uBA54\uC77C\uC740 ImageFactory\uC5D0\uC11C \uBC1C\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.\n        </p>\n      </div>\n    </body>\n    </html>\n  ");
}
