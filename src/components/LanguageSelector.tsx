/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppLanguage } from '../types';
import { speakText } from '../utils/speech';
import { Volume2 } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

const languageDetails: Record<AppLanguage, {
  symbol: string;
  label: string;
  greeting: string;
  bgColor: string;
  activeBg: string;
}> = {
  [AppLanguage.DARIJA]: {
    symbol: '🇲🇦',
    label: 'Darija',
    greeting: 'Mzian, daba application katkhddem b Darija.',
    bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    activeBg: 'bg-emerald-600 text-white border-emerald-600',
  },
  [AppLanguage.FRENCH]: {
    symbol: '🇫🇷',
    label: 'Francais',
    greeting: "Tres bien, l'application parle maintenant francais.",
    bgColor: 'bg-blue-50 text-blue-800 border-blue-200',
    activeBg: 'bg-blue-600 text-white border-blue-600',
  },
  [AppLanguage.ENGLISH]: {
    symbol: '🇬🇧',
    label: 'English',
    greeting: 'Perfect, the application is now in English.',
    bgColor: 'bg-purple-50 text-purple-800 border-purple-200',
    activeBg: 'bg-purple-600 text-white border-purple-600',
  },
  [AppLanguage.TAMAZIGHT]: {
    symbol: 'ⵣ',
    label: 'Chalha',
    greeting: 'Azul, application tura s Chalha.',
    bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
    activeBg: 'bg-amber-500 text-white border-amber-500',
  },
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onChangeLanguage,
}) => {
  const selectLanguage = async (lang: AppLanguage) => {
    onChangeLanguage(lang);
    await speakText(languageDetails[lang].greeting, lang);
  };

  return (
    <div className="flex flex-col items-center gap-2 min-w-0" id="language-sec">
      <div className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
        <Volume2 size={12} className="text-amber-500 animate-pulse" />
        <span>Langue / Language</span>
      </div>
      <div className="flex gap-2 p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm w-full max-w-full overflow-x-auto">
        {(Object.values(AppLanguage) as AppLanguage[]).map((lang) => {
          const isSelected = currentLanguage === lang;
          const { symbol, label, bgColor, activeBg } = languageDetails[lang];

          return (
            <button
              key={lang}
              id={`lang-btn-${lang}`}
              onClick={() => selectLanguage(lang)}
              className={`px-3 sm:px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm select-none cursor-pointer shrink-0 ${
                isSelected ? `${activeBg} scale-105 shadow-md font-bold` : `${bgColor} hover:bg-white`
              }`}
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-mono font-bold leading-none">{symbol}</span>
                <span className="text-[10px] opacity-80 leading-none mt-0.5">{label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
