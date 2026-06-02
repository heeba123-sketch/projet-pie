/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppLanguage } from '../types';
import { speakPhrase, speakText } from '../utils/speech';
import { Volume2 } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onChangeLanguage,
}) => {
  const selectLanguage = async (lang: AppLanguage) => {
    onChangeLanguage(lang);
    
    // Play a friendly introductory sound guiding them on what they can do
    let greeting = "";
    if (lang === AppLanguage.DARIJA) {
      greeting = "مزيان، دابا رانا كانهضرو بالدارجة. بركي على الكراسي باش تسمعي شنو كاين.";
    } else if (lang === AppLanguage.TAMAZIGHT) {
      greeting = "Tanemmirt! Sawalagh s Tamazight. Ouy'ed aflla n tifeltt.";
    } else if (lang === AppLanguage.FRENCH) {
      greeting = "Très bien, l'application parle maintenant français. Tapez sur n'importe quel élément pour écouter son guide vocal.";
    } else if (lang === AppLanguage.ENGLISH) {
      greeting = "Perfect! The app is now in English. Tap any item to hear its vocal guidance.";
    }
    
    await speakText(greeting, lang);
  };

  const getLanguageDetails = (lang: AppLanguage) => {
    switch (lang) {
      case AppLanguage.DARIJA:
        return {
          flag: "🇲🇦",
          symbol: "دارجة",
          label: "الدارجة",
          bgColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
          activeBg: "bg-emerald-600 text-white border-emerald-600"
        };
      case AppLanguage.TAMAZIGHT:
        return {
          flag: "ⵣ",
          symbol: "ⵜⴰⵎ",
          label: "ⵜⴰⵎⴰⵣⵉⵖⵜ",
          bgColor: "bg-amber-50 text-amber-800 border-amber-200",
          activeBg: "bg-amber-500 text-white border-amber-500"
        };
      case AppLanguage.FRENCH:
        return {
          flag: "🇫🇷",
          symbol: "FR",
          label: "Français",
          bgColor: "bg-blue-50 text-blue-800 border-blue-200",
          activeBg: "bg-blue-600 text-white border-blue-600"
        };
      case AppLanguage.ENGLISH:
        return {
          flag: "🇬🇧",
          symbol: "EN",
          label: "English",
          bgColor: "bg-purple-50 text-purple-800 border-purple-200",
          activeBg: "bg-purple-600 text-white border-purple-600"
        };
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 min-w-0" id="language-sec">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
        <Volume2 size={12} className="text-amber-500 animate-pulse" />
        <span>اختيار اللغة / Choisir la langue</span>
      </div>
      <div className="flex gap-2 p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm w-full max-w-full overflow-x-auto">
        {(Object.values(AppLanguage) as AppLanguage[]).map((lang) => {
          const isSelected = currentLanguage === lang;
          const { flag, symbol, label, bgColor, activeBg } = getLanguageDetails(lang);

          return (
            <button
              key={lang}
              id={`lang-btn-${lang}`}
              onClick={() => selectLanguage(lang)}
              className={`px-3 sm:px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-sm select-none cursor-pointer shrink-0 ${
                isSelected ? `${activeBg} scale-105 shadow-md font-bold` : `${bgColor} hover:bg-white`
              }`}
            >
              <span className="text-base font-bold leading-none">{flag}</span>
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
