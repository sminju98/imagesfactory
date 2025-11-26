"use strict";
/**
 * Firebase Admin SDK 초기화 및 Firestore 유틸리티
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.increment = exports.arrayRemove = exports.arrayUnion = exports.serverTimestamp = exports.fieldValue = exports.storage = exports.auth = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
// Firebase Admin 초기화 (한 번만 실행)
if (!admin.apps.length) {
    try {
        // 환경 변수에서 서비스 계정 정보 로드
        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        }
        else if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
            // 개별 환경 변수 사용
            const serviceAccount = {
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            };
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        }
        else {
            // Firebase Functions 환경에서는 자동 초기화
            admin.initializeApp();
        }
        console.log('✅ Firebase Admin initialized in Functions');
    }
    catch (error) {
        console.error('❌ Firebase Admin initialization error:', error);
        // 이미 초기화된 경우 무시
        if (!admin.apps.length) {
            admin.initializeApp();
        }
    }
}
// Firestore 인스턴스
exports.db = admin.firestore();
// Auth 인스턴스
exports.auth = admin.auth();
// Storage 인스턴스
exports.storage = admin.storage();
// FieldValue 헬퍼
exports.fieldValue = admin.firestore.FieldValue;
/**
 * 서버 타임스탬프
 */
const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();
exports.serverTimestamp = serverTimestamp;
/**
 * 배열에 요소 추가
 */
const arrayUnion = (...elements) => admin.firestore.FieldValue.arrayUnion(...elements);
exports.arrayUnion = arrayUnion;
/**
 * 배열에서 요소 제거
 */
const arrayRemove = (...elements) => admin.firestore.FieldValue.arrayRemove(...elements);
exports.arrayRemove = arrayRemove;
/**
 * 숫자 증가
 */
const increment = (n) => admin.firestore.FieldValue.increment(n);
exports.increment = increment;
//# sourceMappingURL=firestore.js.map