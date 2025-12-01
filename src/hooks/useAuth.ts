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
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Firestore에서 사용자 정보 가져오기 (재시도 로직 포함)
          let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          // 문서가 없으면 잠시 후 재시도 (구글 로그인 후 생성 지연 대응)
          if (!userDoc.exists()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          }
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
          } else {
            // Firestore에 사용자 정보가 없으면 기본 정보로 생성
            const { setDoc, serverTimestamp } = await import('firebase/firestore');
            const defaultUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || '',
              provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'password',
              points: 0,
              emailVerified: firebaseUser.emailVerified,
              createdAt: new Date() as any,
              updatedAt: new Date() as any,
            };
            
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...defaultUser,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              setUser(defaultUser);
            } catch (createError) {
              console.error('사용자 문서 생성 실패:', createError);
              setUser(null);
            }
          }
        } catch (error) {
          console.error('Firestore 조회 에러:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, firebaseUser, loading };
};

