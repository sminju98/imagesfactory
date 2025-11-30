'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 지원 언어 목록
export const SUPPORTED_LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 번역 데이터 캐시 (중첩 객체 저장)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translationsCache: Record<string, any> = {};

// 중첩 객체에서 dot notation으로 값 가져오기
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getNestedValue = (obj: any, path: string): string | undefined => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }
  
  return typeof current === 'string' ? current : undefined;
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('ko');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // 언어 로드
  const loadTranslations = async (lang: LanguageCode) => {
    if (translationsCache[lang]) {
      setTranslations(translationsCache[lang]);
      return;
    }

    try {
      const response = await fetch(`/locales/${lang}.json`);
      if (!response.ok) throw new Error('Failed to load translations');
      const data = await response.json();
      translationsCache[lang] = data;
      setTranslations(data);
      console.log(`✅ Loaded ${lang} translations:`, Object.keys(data));
    } catch (error) {
      console.error(`❌ Failed to load ${lang} translations:`, error);
      // 폴백: 영어 로드
      if (lang !== 'en') {
        await loadTranslations('en');
      }
    }
  };

  // 초기 언어 감지
  useEffect(() => {
    const detectLanguage = (): LanguageCode => {
      // 1. localStorage에서 저장된 언어 확인
      const saved = localStorage.getItem('language') as LanguageCode;
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }

      // 2. 브라우저 언어 감지
      const browserLang = navigator.language.split('-')[0];
      const matched = SUPPORTED_LANGUAGES.find(l => l.code === browserLang);
      if (matched) {
        return matched.code;
      }

      // 3. 기본값: 영어
      return 'en';
    };

    const detectedLang = detectLanguage();
    setLanguageState(detectedLang);
    loadTranslations(detectedLang).finally(() => setIsLoading(false));
  }, []);

  // 언어 변경
  const setLanguage = async (lang: LanguageCode) => {
    setIsLoading(true);
    localStorage.setItem('language', lang);
    setLanguageState(lang);
    await loadTranslations(lang);
    setIsLoading(false);
  };

  // 번역 함수 (dot notation 지원)
  const t = (key: string, params?: Record<string, string | number>): string => {
    // 중첩 객체에서 값 가져오기 (예: 'terms.article1.title')
    let text = getNestedValue(translations, key) || key;
    
    // 파라미터 치환 {{name}}
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
      });
    }
    
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

