/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppLanguage, VoiceAssistantResponse } from '../types';
import { SpeechRecognizer, speakText } from '../utils/speech';
import { Mic, MicOff, Volume2, Sparkles, X, MessageSquare, HelpCircle } from 'lucide-react';

interface VoiceGuideProps {
  currentLanguage: AppLanguage;
  onNavigateTab: (tab: 'home' | 'learn' | 'kits' | 'marketplace' | 'community' | 'profile') => void;
  onAddToCart: (kitId: string) => void;
  onForceSync: () => void;
  isOffline: boolean;
}

export const VoiceGuide: React.FC<VoiceGuideProps> = ({
  currentLanguage,
  onNavigateTab,
  onAddToCart,
  onForceSync,
  isOffline
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognizer, setRecognizer] = useState<SpeechRecognizer | null>(null);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initializing speech recognizer once
  useEffect(() => {
    const recObj = new SpeechRecognizer(currentLanguage);
    setRecognizer(recObj);

    // Hide initial tooltip after 8 seconds
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Close chatbot when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        // Only close if we are not speaking/listening
        if (!isListening) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isListening]);

  // Update voice language code if selection changes
  useEffect(() => {
    if (recognizer) {
      recognizer.updateLanguage(currentLanguage);
    }
  }, [currentLanguage, recognizer]);

  const handleMicTrigger = () => {
    if (!recognizer) {
      const supportError = {
        [AppLanguage.DARIJA]: "تسجيل الصوت ماخدامش فهاد المتصفح.",
        [AppLanguage.TAMAZIGHT]: "Reconnaissance vocale ur t'khdem gh browser ad.",
        [AppLanguage.FRENCH]: "La reconnaissance vocale n'est pas supportée dans ce navigateur.",
        [AppLanguage.ENGLISH]: "Speech recognition is not supported in this browser."
      }[currentLanguage];
      setErrorText(supportError);
      return;
    }

    if (isListening) {
      recognizer.stop();
      setIsListening(false);
      return;
    }

    setErrorText('');
    setSpeechTranscript('');
    setAssistantReply('');
    setIsListening(true);

    recognizer.start(
      async (resultText) => {
        setSpeechTranscript(resultText);
        
        // Send this text to our Gemini/Keyword Voice Assistant Backend Endpoint!
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/voice-assistant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript: resultText,
              activeLanguage: currentLanguage
            })
          });

          const data: VoiceAssistantResponse = await response.json();
          console.log("Assistant instruction payload returned:", data);

          // Get the warm local language vocal reply
          const spokenReply = data.voiceResponse[currentLanguage];
          setAssistantReply(spokenReply);

          // Execute physical actions from Gemini!
          if (data.action === 'navigate' && data.target) {
            onNavigateTab(data.target as any);
          } else if (data.action === 'add_to_cart') {
            // Add custom kit selection (e.g. kit-1 starter Coco)
            const targetId = data.item || 'kit-1';
            onAddToCart(targetId);
          } else if (data.action === 'sync') {
            onForceSync();
          }

          // Speak back
          await speakText(spokenReply, currentLanguage);

        } catch (err) {
          console.error("Failed executing voice directive", err);
          // Fallback response
          const defaultResponse = {
            [AppLanguage.DARIJA]: "سمحلي بزاف معرفتش شنو قلتي، عاودي جربي مرة خرى.",
            [AppLanguage.TAMAZIGHT]: "Suregh! Ur ssingh mad tennit, a'awed jreb tikelt yadni.",
            [AppLanguage.FRENCH]: "Pardon, je n'ai pas pu capturer votre commande. Veuillez ré-essayer.",
            [AppLanguage.ENGLISH]: "Sorry, I couldn't understand that. Please try again."
          }[currentLanguage];
          setAssistantReply(defaultResponse);
          await speakText(defaultResponse, currentLanguage);
        }
      },
      () => {
        setIsListening(false);
      },
      (err) => {
        console.error("Recognizer error", err);
        setIsListening(false);
        const errorMsg = {
          [AppLanguage.DARIJA]: "مشكل فالفهم. عافاك هضري بطريقة واضحة.",
          [AppLanguage.TAMAZIGHT]: "Lmochkil n tsout. Sawal s l'haqq ifawn.",
          [AppLanguage.FRENCH]: "Problème de capture. S'il vous plaît parlez distinctement.",
          [AppLanguage.ENGLISH]: "Speech capture issue. Please speak clearly."
        }[currentLanguage];
        setErrorText(errorMsg);
      }
    );
  };

  return (
    <div className="fixed bottom-24 right-3 sm:right-6 z-50" id="pie-voice-assistant-root" ref={popoverRef}>
      
      {/* 1. CHATBOT POPOVER INTERFACE PANEL */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[calc(100vw-24px)] max-w-[360px] bg-white border border-orange-100 rounded-[30px] shadow-[0_15px_50px_rgba(146,64,14,0.18)] overflow-hidden transition-all duration-300 animate-slideUp font-sans">
          
          {/* Popover Header with Morocco's artisan theme color accent */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg shadow-inner">
                👑
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black uppercase tracking-wider font-sans">
                  {currentLanguage === AppLanguage.DARIJA ? "المعلمة كنزة الصوتية" : "Coach Vocale Kenza"}
                </h4>
                <p className="text-[10px] text-orange-200 font-mono">
                  {currentLanguage === AppLanguage.DARIJA ? "مساعد ذكي بالصوت 24h/24" : "Assistant vocal marocain"}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Interactive Assistant Body */}
          <div className="p-5 space-y-4 bg-gradient-to-b from-amber-50/20 to-white">
            
            {/* Context/Tip badge */}
            <div className="flex items-center gap-1.5 text-[10px] text-amber-800 font-black uppercase tracking-wider bg-orange-100/60 p-2 rounded-2xl border border-orange-200/30">
              <Sparkles size={12} className="text-orange-650 shrink-0 animate-spin" />
              <span>
                {currentLanguage === AppLanguage.DARIJA ? "توجيه بالدارجة والتامازيغت" : "Guidage vocal intelligent"}
              </span>
            </div>

            {/* Display message logs, spoken transcripts or instructions */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-slate-100 text-left min-h-[90px] flex flex-col justify-center">
              {speechTranscript ? (
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-400 block uppercase font-mono tracking-widest">
                    {currentLanguage === AppLanguage.DARIJA ? "شنو سمعت" : "Vous avez dit"}
                  </span>
                  <p className="text-xs font-extrabold text-amber-900 italic">
                    "{speechTranscript}"
                  </p>
                </div>
              ) : isListening ? (
                <div className="space-y-2 py-1 text-center">
                  <div className="flex gap-1.5 justify-center items-center h-4">
                    <div className="w-1.5 h-3 bg-orange-600 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-5 bg-amber-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-3.5 bg-orange-600 rounded-full animate-bounce delay-150"></div>
                    <div className="w-1.5 h-4.5 bg-amber-500 rounded-full animate-bounce delay-100"></div>
                  </div>
                  <p className="text-[10px] text-orange-750 font-black uppercase font-mono tracking-widest animate-pulse">
                    {currentLanguage === AppLanguage.DARIJA ? "أنا كانسمع، هضري دابا..." : "Écoute active en cours..."}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  {currentLanguage === AppLanguage.DARIJA ? "بركي على الميكروفون لتحت وقولي مثلاً 'بغيت نتعلم الكروشي' أو 'ديني لساحة التضامن'." :
                   currentLanguage === AppLanguage.FRENCH ? "Appuyez sur le micro et dites 'Apprendre le crochet' ou 'Acheter un kit' pour piloter la coopérative par votre voix !" :
                   "Press the microphone below and say something like 'Learn weaving' or 'Go to community center' to navigate verbally!"}
                </p>
              )}
            </div>

            {/* Glowing tactile microphone button */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <button
                onClick={handleMicTrigger}
                className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-350 relative z-10 border-4 shadow-md ${
                  isListening 
                    ? 'bg-rose-500 border-rose-200 text-white scale-110 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse'
                    : 'bg-amber-650 border-amber-550 hover:bg-amber-750 hover:border-amber-450 text-white hover:scale-105 active:scale-95'
                }`}
                title="Clavier vocal"
              >
                {isListening ? <MicOff size={24} className="animate-pulse" /> : <Mic size={24} />}
              </button>
              <span className="text-[9px] font-black uppercase text-gray-400 font-mono tracking-widest">
                {isListening ? (currentLanguage === AppLanguage.DARIJA ? "بركي باش تحبسي" : "Arrêter") : (currentLanguage === AppLanguage.DARIJA ? "بركي باش تقولي طلبك" : "Appuyer & Parler")}
              </span>
            </div>

            {/* Assistant Voice text bubble back response */}
            {assistantReply && (
              <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-200/30 text-left animate-fadeIn">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-800 mb-1 uppercase tracking-wider">
                  <Volume2 size={12} className="text-orange-650 animate-pulse" />
                  <span>
                    {currentLanguage === AppLanguage.DARIJA ? "المعلمة كنزة كاتجوبك" : "Réponse de Kenza"}
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-bold leading-relaxed font-sans">
                  {assistantReply}
                </p>
              </div>
            )}

            {errorText && (
              <p className="text-[10px] font-bold text-rose-600 font-mono text-center">
                ⚠️ {errorText}
              </p>
            )}

          </div>

          {/* Quick Shortcuts helpful suggestions inside the overlay */}
          <div className="bg-stone-50 px-4 py-3 border-t border-slate-100 flex gap-2 justify-center flex-wrap">
            <button
              onClick={async () => {
                const transcripts = {
                  [AppLanguage.DARIJA]: "بغيت نتعلم",
                  [AppLanguage.TAMAZIGHT]: "Righ ad lemmed",
                  [AppLanguage.FRENCH]: "Je veux apprendre",
                  [AppLanguage.ENGLISH]: "I want to learn"
                };
                const replies = {
                  [AppLanguage.DARIJA]: "وخا، ها هما دروس كروشي للمبتدئين.",
                  [AppLanguage.TAMAZIGHT]: "Aha! Khad dorous n'tizgawt.",
                  [AppLanguage.FRENCH]: "Je vous redirige vers l'espace d'apprentissage.",
                  [AppLanguage.ENGLISH]: "I am redirecting you to the learning center."
                };
                setSpeechTranscript(transcripts[currentLanguage]);
                setAssistantReply(replies[currentLanguage]);
                onNavigateTab('learn');
                await speakText(replies[currentLanguage], currentLanguage);
              }}
              className="text-[9px] bg-white border border-gray-205 px-2 py-1 rounded-full text-slate-650 hover:bg-amber-50 hover:border-amber-300 font-sans cursor-pointer transition-colors"
            >
              {currentLanguage === AppLanguage.DARIJA ? "بغيت نتعلم" : "Je veux apprendre"}
            </button>
            <button
              onClick={async () => {
                const transcripts = {
                  [AppLanguage.DARIJA]: "نشري الصندوق",
                  [AppLanguage.TAMAZIGHT]: "Asg n soof",
                  [AppLanguage.FRENCH]: "Aller à la boutique",
                  [AppLanguage.ENGLISH]: "Go to the kits shop"
                };
                const replies = {
                  [AppLanguage.DARIJA]: "وخا، فتحت ليك متجر الصناديق.",
                  [AppLanguage.TAMAZIGHT]: "Wakha, khad asg n soof.",
                  [AppLanguage.FRENCH]: "Voici tous nos coffrets d'artisanat équipés d'outils.",
                  [AppLanguage.ENGLISH]: "Here are our craft kits and tool boxes."
                };
                setSpeechTranscript(transcripts[currentLanguage]);
                setAssistantReply(replies[currentLanguage]);
                onNavigateTab('kits');
                await speakText(replies[currentLanguage], currentLanguage);
              }}
              className="text-[9px] bg-white border border-gray-205 px-2 py-1 rounded-full text-slate-650 hover:bg-amber-50 hover:border-amber-300 font-sans cursor-pointer transition-colors"
            >
              {currentLanguage === AppLanguage.DARIJA ? "نشري الصندوق" : "Coffret Kits"}
            </button>
          </div>

        </div>
      )}

      {/* 2. PERSISTENT FLOATING ROUND BOT BUTTON */}
      <div className="relative">
        
        {/* Help label Speech Bubble Tooltip beside the button */}
        {showTooltip && !isOpen && (
          <div className="absolute right-14 sm:right-16 bottom-2.5 max-w-[calc(100vw-92px)] bg-slate-900 text-white rounded-2xl px-3 py-1.5 shadow-xl text-[10px] font-black uppercase tracking-wider font-sans border border-slate-800 animate-pulse flex items-center gap-1.5">
            <span className="text-xs">🎙️</span>
            <span>
              {currentLanguage === AppLanguage.DARIJA ? "توجيه بالصوت هنا !" : "Parlez avec le site !"}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-gray-400 hover:text-white ml-1 cursor-pointer"
            >
              <X size={10} />
            </button>
          </div>
        )}

        {/* The Giant Glowing Chatbot style button icon */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              const greetings = {
                [AppLanguage.DARIJA]: "مرحبا بيك فالمساعد الصوتي لحرفة! بركي على الميكروفون الملون و قولي شنو بغيتي.",
                [AppLanguage.TAMAZIGHT]: "Azul! Marh ba bik f lmou'awen n ssaout. Ouy'ed aflla n mic bac ad sawalad.",
                [AppLanguage.FRENCH]: "Bienvenue sur l'assistance vocale Hirfa. Appuyez sur le micro pour me parler.",
                [AppLanguage.ENGLISH]: "Welcome to the Hirfa voice assistant. Press the microphone to speak with me."
              };
              speakText(greetings[currentLanguage], currentLanguage);
            }
          }}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer shadow-[0_8px_30px_rgba(217,119,6,0.3)] transition-all duration-300 focus:outline-none z-55 ${
            isOpen 
              ? 'bg-slate-900 border-2 border-slate-700 text-amber-500 rotate-90 scale-95' 
              : isListening 
                ? 'bg-rose-500 border-2 border-rose-300 text-white scale-110 shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse'
                : 'bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-550 border-2 border-amber-400 text-white hover:scale-110 active:scale-95'
          }`}
          title="Coach Vocal"
        >
          {isOpen ? (
            <X size={18} />
          ) : isListening ? (
            <div className="flex gap-0.5 items-center">
              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce"></span>
              <span className="w-1 h-3.5 bg-white rounded-full animate-bounce [animation-delay:0.1s]"></span>
              <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
            </div>
          ) : (
            <div className="relative">
              <Mic size={18} className="animate-pulse" />
              {/* Little soundwave decorative rings */}
              <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </button>

      </div>

    </div>
  );
};
