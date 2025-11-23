'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types/user.types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔵 [useAuth] onAuthStateChanged 호출됨');
      console.log('🔵 [useAuth] firebaseUser:', firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      } : null);
      
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          console.log('🔵 [useAuth] Firestore에서 사용자 정보 조회 중...', firebaseUser.uid);
          
          // Firestore에서 사용자 정보 가져오기
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          console.log('🔵 [useAuth] Firestore 조회 결과:', {
            exists: userDoc.exists(),
            data: userDoc.exists() ? userDoc.data() : null,
          });
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log('✅ [useAuth] 사용자 정보 로드 성공:', userData);
            setUser(userData);
          } else {
            console.error('🔴 [useAuth] Firestore에 사용자 문서가 없습니다!');
            console.error('🔴 [useAuth] UID:', firebaseUser.uid);
            console.error('🔴 [useAuth] 회원가입 시 Firestore 저장 실패 가능성');
            setUser(null);
          }
        } catch (error) {
          console.error('🔴 [useAuth] Firestore 조회 에러:', error);
          setUser(null);
        }
      } else {
        console.log('🔵 [useAuth] 로그아웃 상태');
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, firebaseUser, loading };
};

