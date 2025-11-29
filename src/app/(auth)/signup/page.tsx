'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useTranslation, SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/i18n';
import { Sparkles, Mail, Lock, User as UserIcon, CheckCircle, AlertCircle, Globe, ChevronDown } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!formData.email || !formData.password || !formData.displayName) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError(t('auth.agreeRequired'));
      return;
    }

    try {
      setLoading(true);

      // Firebase Auth 회원가입
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // 가입 보너스 포인트
      const SIGNUP_BONUS_POINTS = 100;

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: formData.displayName,
        photoURL: null,
        provider: 'password',
        points: SIGNUP_BONUS_POINTS, // 가입 보너스 100 포인트
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          totalGenerations: 0,
          totalImages: 0,
          totalPointsUsed: 0,
          totalPointsPurchased: 0,
          totalEvolutions: 0,
        },
      });

      // 포인트 트랜잭션 기록
      await setDoc(doc(collection(db, 'pointTransactions')), {
        userId: user.uid,
        type: 'bonus',
        amount: SIGNUP_BONUS_POINTS,
        balanceBefore: 0,
        balanceAfter: SIGNUP_BONUS_POINTS,
        description: '회원가입 보너스 포인트',
        createdAt: serverTimestamp(),
      });

      // 이메일 인증 발송
      await sendEmailVerification(user);

      // 환영 이메일 발송
      try {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            displayName: formData.displayName,
            points: SIGNUP_BONUS_POINTS,
          }),
        });
      } catch (emailError) {
        console.error('Welcome email error:', emailError);
      }

      alert(t('auth.signupComplete'));
      router.push('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Firebase 에러 메시지 처리
      if (error.code === 'auth/email-already-in-use') {
        setError(t('auth.emailInUse'));
      } else if (error.code === 'auth/invalid-email') {
        setError(t('auth.invalidEmail'));
      } else if (error.code === 'auth/weak-password') {
        setError(t('auth.weakPassword'));
      } else {
        setError(t('auth.signupError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      console.log('🔵 [DEBUG] 구글 회원가입 시작');
      console.log('🔵 [DEBUG] Firebase Auth 상태:', auth);
      console.log('🔵 [DEBUG] Auth Domain:', auth.config.authDomain);
      
      const provider = new GoogleAuthProvider();
      console.log('🔵 [DEBUG] GoogleAuthProvider 생성 완료');
      
      const userCredential = await signInWithPopup(auth, provider);
      console.log('🔵 [DEBUG] signInWithPopup 성공:', userCredential);
      
      const user = userCredential.user;
      console.log('🔵 [DEBUG] 사용자 정보:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });

      // Firestore에 사용자 정보 저장 (신규 사용자인 경우)
      console.log('🔵 [DEBUG] Firestore에서 기존 사용자 확인 중...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('🔵 [DEBUG] 기존 사용자 존재 여부:', userDoc.exists());
      
      if (!userDoc.exists()) {
        console.log('🔵 [DEBUG] 신규 사용자! Firestore에 저장 시작...');
        
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '사용자',
          photoURL: user.photoURL,
          provider: 'google',
          points: 1000, // 가입 보너스
          emailVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          stats: {
            totalGenerations: 0,
            totalImages: 0,
            totalPointsUsed: 0,
            totalPointsPurchased: 0,
          },
        };
        
        console.log('🔵 [DEBUG] 저장할 사용자 데이터:', userData);
        
        await setDoc(doc(db, 'users', user.uid), userData);
        
        console.log('✅ [DEBUG] Firestore 저장 완료!');
        
        // 환영 이메일 발송
        try {
          console.log('🔵 [DEBUG] 환영 이메일 발송 시도...');
          await fetch('/api/email/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              displayName: user.displayName || '사용자',
              points: 1000,
            }),
          });
          console.log('✅ [DEBUG] 환영 이메일 발송 성공');
        } catch (emailError) {
          console.error('🔴 [ERROR] Welcome email error:', emailError);
        }

        alert(t('auth.signupCompleteGoogle'));
      } else {
        console.log('🔵 [DEBUG] 기존 사용자 로그인');
        alert(t('auth.loginSuccess'));
      }

      console.log('🔵 [DEBUG] 메인 페이지로 이동...');
      router.push('/');
    } catch (error: any) {
      console.error('🔴 [ERROR] Google signup error:', error);
      console.error('🔴 [ERROR] Error code:', error.code);
      console.error('🔴 [ERROR] Error message:', error.message);
      console.error('🔴 [ERROR] Full error object:', JSON.stringify(error, null, 2));
      
      // 에러 타입별 상세 로깅
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('🟡 [INFO] 사용자가 팝업을 닫았습니다');
        setError(t('auth.popupClosed'));
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('🟡 [INFO] 팝업 요청이 취소되었습니다');
        setError(t('auth.loginCancelled'));
      } else if (error.code === 'auth/popup-blocked') {
        console.log('🟡 [INFO] 브라우저에서 팝업을 차단했습니다');
        setError(t('auth.popupBlocked'));
      } else if (error.code === 'auth/unauthorized-domain') {
        console.error('🔴 [CRITICAL] 도메인이 승인되지 않았습니다!');
        setError(t('auth.unauthorizedDomain'));
      } else {
        console.error('🔴 [ERROR] 알 수 없는 에러:', error.code);
        setError(`${t('auth.googleLoginError')}: ${error.code}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 relative">
      {/* 언어 선택 - 우상단 고정 */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm"
          >
            <Globe className="w-4 h-4 text-gray-500" />
            <span>{currentLang?.flag} {currentLang?.name}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as LanguageCode);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2 ${language === lang.code ? 'bg-indigo-50 text-indigo-600' : ''}`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">{t('common.appName')}</h1>
              <p className="text-xs text-gray-500">by MJ Studio</p>
            </div>
          </Link>
          <p className="text-gray-600">
            {t('auth.freeStartBonus')}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.signup')}</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.name')}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('auth.namePlaceholder')}
                />
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('auth.passwordMinLengthHint')}</p>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  <Link href="/terms" className="text-indigo-600 hover:underline">
                    {t('common.terms')}
                  </Link>
                  {t('auth.agreeRequired2')}
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  <Link href="/privacy" className="text-indigo-600 hover:underline">
                    {t('common.privacy')}
                  </Link>
                  {t('auth.agreeRequired2')}
                </span>
              </label>
            </div>

            {/* 가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.signingUp') : t('auth.signup')}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t('auth.or')}</span>
            </div>
          </div>

          {/* 구글 가입 */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700">{t('auth.googleSignup')}</span>
          </button>

          {/* 로그인 링크 */}
          <p className="mt-6 text-center text-sm text-gray-600">
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className="text-indigo-600 hover:underline font-semibold">
              {t('auth.login')}
            </Link>
          </p>
        </div>

        {/* 가입 혜택 */}
        <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {t('auth.signupBenefits')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="mr-2">🎁</span>
              {t('auth.benefitBonus')}
            </li>
            <li className="flex items-center">
              <span className="mr-2">🤖</span>
              {t('auth.benefitUnlimited')}
            </li>
            <li className="flex items-center">
              <span className="mr-2">📧</span>
              {t('auth.benefitEmail')}
            </li>
            <li className="flex items-center">
              <span className="mr-2">💾</span>
              {t('auth.benefitHistory')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

