/**
 * Firebase Admin SDK 초기화 및 Firestore/Storage 유틸리티
 */

import * as admin from 'firebase-admin';

// Firebase Admin SDK 초기화 (이미 초기화되어 있으면 스킵)
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('✅ Firebase Admin initialized in Functions');
}

// Firestore 인스턴스
export const db = admin.firestore();

// Storage 인스턴스
export const storage = admin.storage();

// FieldValue (serverTimestamp 등)
export const fieldValue = admin.firestore.FieldValue;

// Auth 인스턴스
export const auth = admin.auth();


