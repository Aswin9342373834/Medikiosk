'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import hi from '../locales/hi.json';

export type SupportedLanguageCode = 'en' | 'ta' | 'hi';
export type LegacyLanguageName = 'English' | 'Tamil' | 'Hindi';
export type AnyLanguageInput = SupportedLanguageCode | LegacyLanguageName;

export interface LanguageOption {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  speechLang: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', speechLang: 'en-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechLang: 'ta-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLang: 'hi-IN' }
];

export const normalizeLanguageCode = (input?: string | null): SupportedLanguageCode => {
  if (!input) return 'en';
  const lower = input.toLowerCase().trim();
  if (lower === 'ta' || lower === 'tamil' || lower.includes('தமிழ்')) return 'ta';
  if (lower === 'hi' || lower === 'hindi' || lower.includes('हिन्दी')) return 'hi';
  return 'en';
};

const dictionaries: Record<SupportedLanguageCode, any> = {
  en,
  ta,
  hi
};

interface LanguageContextType {
  language: SupportedLanguageCode;
  setLanguage: (lang: AnyLanguageInput) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  speechLang: string;
  languages: LanguageOption[];
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'medikiosk_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguageCode>('en');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const normalized = normalizeLanguageCode(stored);
        setLanguageState(normalized);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = normalized;
          document.documentElement.dir = 'ltr';
        }
      }
    } catch (e) {
      console.warn('[i18n] Failed to read stored language:', e);
    }
  }, []);

  const setLanguage = useCallback((input: AnyLanguageInput) => {
    const code = normalizeLanguageCode(input);
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = code;
        document.documentElement.dir = 'ltr';
      }
    } catch (e) {
      console.warn('[i18n] Failed to persist language:', e);
    }
  }, []);

  const speechLang = useMemo(() => {
    switch (language) {
      case 'ta':
        return 'ta-IN';
      case 'hi':
        return 'hi-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  }, [language]);

  const resolvePath = (obj: any, path: string): any => {
    if (!obj) return undefined;
    if (obj[path] !== undefined) return obj[path];
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  };

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const currentDict = dictionaries[language] || dictionaries.en;
      let value = resolvePath(currentDict, key);

      // Fallback to English
      if (value === undefined && language !== 'en') {
        value = resolvePath(dictionaries.en, key);
      }

      if (value === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[i18n] Missing translation for key: "${key}" in language: "${language}"`);
        }
        return key;
      }

      let result = String(value);
      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }
      return result;
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      speechLang,
      languages: SUPPORTED_LANGUAGES,
      isRTL: false
    }),
    [language, setLanguage, t, speechLang]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (k: string) => k,
      speechLang: 'en-IN',
      languages: SUPPORTED_LANGUAGES,
      isRTL: false
    };
  }
  return context;
};

export const useTranslation = () => {
  const { t, language, setLanguage, speechLang, languages } = useLanguage();
  return { t, language, setLanguage, speechLang, languages };
};
