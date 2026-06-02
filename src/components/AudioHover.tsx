/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppLanguage } from '../types';
import { speakPhrase, speakText } from '../utils/speech';
import { Volume2 } from 'lucide-react';

interface AudioHoverProps {
  phraseKey?: string;
  customText?: string;
  lang: AppLanguage;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export const AudioHover: React.FC<AudioHoverProps> = ({
  phraseKey,
  customText,
  lang,
  children,
  className = '',
  showIcon = false
}) => {
  const handleVocalSpeak = (e: React.MouseEvent | React.TouchEvent) => {
    // Only speak on click / tap to avoid excessive automated noise on scroll/touching
    e.stopPropagation();
    if (phraseKey) {
      speakPhrase(phraseKey, lang);
    } else if (customText) {
      speakText(customText, lang);
    }
  };

  return (
    <div 
      className={`relative group inline-block ${className}`}
      onClick={handleVocalSpeak}
    >
      {children}
      {showIcon && (
        <button
          type="button"
          onClick={handleVocalSpeak}
          className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-md scale-75 group-hover:scale-90 transition-transform cursor-pointer"
          title="Écouter l'explication vocale"
        >
          <Volume2 size={12} />
        </button>
      )}
    </div>
  );
};
