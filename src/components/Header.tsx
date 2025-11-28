'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation, SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/i18n';
import { Sparkles, User, LogIn, Globe, ChevronDown } from 'lucide-react';

export default function Header() {
  const { user, loading } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Desktop - 기존 레이아웃 */}
        <div className="hidden md:flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ImageFactory</h1>
              <p className="text-xs text-gray-500">by 엠제이스튜디오</p>
            </div>
          </Link>

          {!loading && (
            <div className="flex items-center space-x-4">
              {/* 언어 선택 */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center space-x-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
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
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2 ${
                          language === lang.code ? 'bg-indigo-50 text-indigo-600' : ''
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user ? (
                <>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{t('common.currentPoints')}</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {user.points.toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href="/points"
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-semibold shadow-md"
                  >
                    💰 {t('common.chargePoints')}
                  </Link>
                  <Link
                    href="/mypage"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>{t('common.mypage')}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {t('common.login')}
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>{t('common.signup')}</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile - 간단한 1줄 레이아웃 */}
        <div className="md:hidden flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">ImageFactory</h1>
              <p className="text-[10px] text-gray-500">{t('common.tagline')}</p>
            </div>
          </Link>

          {!loading && (
            <div className="flex items-center gap-2">
              {/* 모바일 언어 선택 */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-lg">{currentLang?.flag}</span>
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as LanguageCode);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center space-x-2 ${
                          language === lang.code ? 'bg-indigo-50 text-indigo-600' : ''
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user ? (
                <>
                  <span className="text-sm font-bold text-indigo-600">
                    {user.points.toLocaleString()}pt
                  </span>
                  <Link
                    href="/mypage"
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                >
                  {t('common.login')}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

