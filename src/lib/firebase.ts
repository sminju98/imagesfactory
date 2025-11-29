// Firebase 클라이언트 초기화
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 🔥 에뮬레이터 연결 (환경 변수가 명시적으로 true일 때만)
// 로컬에서도 프로덕션 Firebase를 사용하려면 NEXT_PUBLIC_FIREBASE_EMULATOR를 설정하지 않음
const useEmulator = typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true';

if (useEmulator) {
  // 이미 연결되어 있는지 확인 (중복 연결 방지)
  const isEmulatorConnected = (db as any)._settings?.host?.includes('localhost');
  
  if (!isEmulatorConnected) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('🔥 Firebase Emulator 연결됨');
    } catch (error) {
      // 이미 연결된 경우 무시
      console.log('Firebase Emulator 이미 연결됨');
    }
  }
} else {
  console.log('🔥 프로덕션 Firebase 사용');
}

export default app;
