// Firebase 클라이언트 초기화
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAFehtzPYQTzXscJPm2-yqKK5GGXKQDIX0",
  authDomain: "imagefactory-5ccc6.firebaseapp.com",
  projectId: "imagefactory-5ccc6",
  storageBucket: "imagefactory-5ccc6.firebasestorage.app",
  messagingSenderId: "629353944984",
  appId: "1:629353944984:web:9b862385c899063ef2fded",
  measurementId: "G-5LSCXQ4R4W"
};

// Firebase 앱 초기화 (중복 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// 초기화 디버그 로그
console.log('🔵 [DEBUG] Firebase 초기화 완료');
console.log('🔵 [DEBUG] Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '✅ 설정됨' : '❌ 없음',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('🔵 [DEBUG] Firebase Auth 초기화:', {
  currentUser: auth.currentUser?.email || '로그인 안됨',
  authDomain: auth.config.authDomain,
});

export default app;

