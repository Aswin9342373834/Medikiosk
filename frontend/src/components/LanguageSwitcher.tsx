'use client';

import React from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../contexts/LanguageContext';
import { Globe, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLanguage?: string;
  onLanguageChange?: (lang: any) => void;
  variant?: 'compact' | 'kiosk' | 'select' | 'pills';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
  variant = 'compact',
  className = ''
}) => {
  const { language: globalLang, setLanguage: setGlobalLang } = useLanguage();

  const activeCode: SupportedLanguageCode = (
    currentLanguage
      ? (currentLanguage === 'Tamil' || currentLanguage === 'ta' ? 'ta' : currentLanguage === 'Hindi' || currentLanguage === 'hi' ? 'hi' : 'en')
      : globalLang
  );

  const handleSelect = (code: SupportedLanguageCode) => {
    setGlobalLang(code);
    if (onLanguageChange) {
      onLanguageChange(code);
    }
  };

  // 1. Kiosk Variant: Large, high-contrast, touch-friendly cards
  if (variant === 'kiosk') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 w-full ${className}`}>
        {SUPPORTED_LANGUAGES.map(item => {
          const isSelected = activeCode === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              aria-label={`Select language ${item.name}`}
              className={`p-6 rounded-2xl font-bold border-3 transition-all text-center flex flex-col items-center justify-center gap-1.5 min-h-[110px] ${
                isSelected
                  ? 'bg-hospital-700 text-white border-hospital-800 shadow-lg scale-102 ring-4 ring-blue-300'
                  : 'bg-white text-slate-800 border-slate-300 hover:border-hospital-500 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <div className="text-2xl sm:text-3xl font-black">{item.nativeName}</div>
              <div className={`text-sm sm:text-base font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                {item.name}
              </div>
              {isSelected && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-300 mt-1">
                  <Check className="w-4 h-4" />
                  <span>Selected</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Select Dropdown Variant (great for compact navbar/mobile headers)
  if (variant === 'select') {
    return (
      <div className={`flex items-center bg-slate-100/90 hover:bg-slate-200/90 border border-slate-300 rounded-lg px-2.5 py-1.5 gap-2 transition ${className}`}>
        <Globe className="w-4 h-4 text-slate-600 flex-shrink-0" />
        <select
          value={activeCode}
          onChange={(e) => handleSelect(e.target.value as SupportedLanguageCode)}
          className="bg-transparent text-slate-800 text-xs sm:text-sm font-bold outline-none cursor-pointer"
          aria-label="Select Language"
        >
          {SUPPORTED_LANGUAGES.map(item => (
            <option key={item.code} value={item.code} className="text-slate-900 py-1">
              {item.nativeName} ({item.name})
            </option>
          ))}
        </select>
      </div>
    );
  }

  // 3. Compact / Pills Variant: Button group
  return (
    <div
      className={`inline-flex items-center gap-1 bg-white/95 border border-slate-300 shadow-xs rounded-xl p-1 ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <div className="flex items-center pl-1.5 pr-1 text-slate-500">
        <Globe className="w-4 h-4 text-hospital-600" />
      </div>
      {SUPPORTED_LANGUAGES.map(item => {
        const isSelected = activeCode === item.code;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => handleSelect(item.code)}
            aria-pressed={isSelected}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              isSelected
                ? 'bg-hospital-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-hospital-700'
            }`}
          >
            <span className="font-extrabold">{item.nativeName}</span>
          </button>
        );
      })}
    </div>
  );
};
