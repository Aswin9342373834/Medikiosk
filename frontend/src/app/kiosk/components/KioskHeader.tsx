'use client';

import React from 'react';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useTranslation } from '../../../contexts/LanguageContext';
import { AlertTriangle } from 'lucide-react';

interface KioskHeaderProps {
  language?: string;
  step: number;
  totalSteps: number;
  detectedRedFlags: string[];
  onLanguageChange?: (lang: any) => void;
}

export const KioskHeader: React.FC<KioskHeaderProps> = ({
  step,
  totalSteps,
  detectedRedFlags,
  onLanguageChange
}) => {
  const { t, language } = useTranslation();

  return (
    <>
      <header className="bg-hospital-700 text-white p-4 sm:p-6 shadow-md flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 bg-white text-hospital-700 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md">
            +
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight">
              {language === 'ta' ? 'அகில இந்திய மருத்துவ அறிவியல் நிறுவனம் (AIIMS)' : language === 'hi' ? 'अखिल भारतीय आयुर्विज्ञान संस्थान (AIIMS)' : 'All India Institute of Medical Sciences'}
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm font-semibold">
              {t('kiosk.title')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher
            variant="compact"
            onLanguageChange={onLanguageChange}
          />

          <div className="bg-hospital-800/80 border border-blue-400/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-right">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-blue-200">{t('opd.step')}</span>
            <div className="text-lg sm:text-2xl font-black">{step} / {totalSteps}</div>
          </div>
        </div>
      </header>

      {detectedRedFlags.length > 0 && (
        <div className="bg-red-600 text-white p-4 px-6 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 flex-shrink-0 text-yellow-300" />
            <div>
              <p className="font-extrabold text-base tracking-wide uppercase">
                {t('clinicalHistory.redFlagTitle')}
              </p>
              <p className="text-xs text-red-100">
                "{detectedRedFlags.join(' • ')}" • {t('clinicalHistory.redFlagAlert')}
              </p>
            </div>
          </div>
          <span className="bg-white text-red-700 text-xs font-black px-3 py-1 rounded-full uppercase">
            Priority Alert
          </span>
        </div>
      )}
    </>
  );
};
