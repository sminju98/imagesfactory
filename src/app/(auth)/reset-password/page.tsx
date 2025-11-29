'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useTranslation, SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/i18n';
import { Sparkles, Mail, AlertCircle, CheckCircle, Globe, ChevronDown, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const { t, language, setLanguage } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError(t('auth.emailRequired'));
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    try {
      setLoading(true);
      // Firebase sendPasswordResetEmail - 기본 설정 사용
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error.code, error.message);
      
      switch (error.code) {
        case 'auth/user-not-found':
          setError(t('auth.userNotFound'));
          break;
        case 'auth/invalid-email':
          setError(t('auth.invalidEmail'));
          break;
        case 'auth/too-many-requests':
          setError(t('auth.tooManyRequests'));
          break;
        case 'auth/missing-android-pkg-name':
        case 'auth/missing-continue-uri':
        case 'auth/missing-ios-bundle-id':
        case 'auth/invalid-continue-uri':
        case 'auth/unauthorized-continue-uri':
          // ActionCodeSettings 관련 에러는 무시하고 기본으로 진행
          setError(t('auth.resetPasswordError'));
          break;
        default:
          setError(t('auth.resetPasswordError') + ` (${error.code || 'unknown'})`);
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
              <p className="text-xs text-gray-500">{t('common.tagline')}</p>
            </div>
          </Link>
          <p className="text-gray-600">
            {t('auth.resetPasswordDesc')}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('auth.resetPassword')}</h2>

          {/* 성공 메시지 */}
          {success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('auth.resetEmailSent')}</h3>
              <p className="text-gray-600 mb-6">
                {t('auth.resetEmailSentDesc', { email })}
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all text-center"
                >
                  {t('auth.backToLogin')}
                </Link>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="block w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all text-center"
                >
                  {t('auth.sendAgain')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 에러 메시지 */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={t('auth.emailPlaceholder')}
                    />
                  </div>
                </div>

                {/* 제출 버튼 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.loading') : t('auth.sendResetEmail')}
                </button>
              </form>

              {/* 로그인으로 돌아가기 */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-indigo-600 hover:underline font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {t('auth.backToLogin')}
                </Link>
              </div>
            </>
          )}
        </div>

        {/* 도움말 */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <h4 className="font-bold text-indigo-900 mb-2">💡 {t('auth.resetPasswordTipTitle')}</h4>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• {t('auth.resetPasswordTip1')}</li>
            <li>• {t('auth.resetPasswordTip2')}</li>
            <li>• {t('auth.resetPasswordTip3')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
