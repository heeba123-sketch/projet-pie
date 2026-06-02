/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLanguage } from '../types';

/**
 * Phonetic adaptations for Tamazight so French TTS engines can read it intelligibly
 */
const TAMAZIGHT_PHONETIC_FALLBACK: Record<string, string> = {
  "ⴰⵣⵓⵍ": "Azoul! Marh ba bikoum.",
  "Azul": "Azoul! Marh ba bikoum.",
};

/**
 * Custom vocal guides for every screen to provide rich spoken feedback
 */
export const VOCAL_PHRASES: Record<string, Record<AppLanguage, string>> = {
  home_intro: {
    [AppLanguage.DARIJA]: "Marhaban bikum f Projet Pie! Hna tqder t'allem l'krouchi w tbi'e khidma dyalk. Brk 'goutona bac t'allem n'tiya.",
    [AppLanguage.TAMAZIGHT]: "Azul fellawen g Projet Pie! Da tlemmed tixri d crochet, tzenzed tighawsiwin nnek. Ouy'ed aflla n'tizgawt.",
    [AppLanguage.FRENCH]: "Bienvenue chez Projet Pie! Ici, apprenez le crochet et la broderie à votre rythme, recevez votre matériel, et vendez vos superbes créations. Appuyez sur un bouton pour entendre son explication.",
    [AppLanguage.ENGLISH]: "Welcome to Project Pie! Here you can learn crochet and embroidery, receive your creative kits, and sell your handmade work. Press any icon to hear its voice guide."
  },
  btn_learn: {
    [AppLanguage.DARIJA]: "Ta'allam l'Krouchi. Chouf dorous sahla b bazzzaf dyal sowar.",
    [AppLanguage.TAMAZIGHT]: "Lemmed krouchi d tizgawt. Zer dorous isehlen s tewlafin.",
    [AppLanguage.FRENCH]: "Espace d'apprentissage. Apprenez le crochet étape par étape avec des animations faciles.",
    [AppLanguage.ENGLISH]: "Learning Center. Master crochet and embroidery step-by-step with simple animations."
  },
  btn_kits: {
    [AppLanguage.DARIJA]: "Sowar dyal Sanadiq Ssof. Techri sandouk fih l'khayt, l'ebri, w kolchi lie khass.",
    [AppLanguage.TAMAZIGHT]: "Sghem l'box n'tizgawt. Ssof d tghawsiwin n l'khedmet khassnin.",
    [AppLanguage.FRENCH]: "Boutique de Kits. Achetez un coffret complet contenant la laine, les aiguilles et tout le matériel nécessaire.",
    [AppLanguage.ENGLISH]: "Material Kits Shop. Purchase a complete kit with yarn, needles, and patterns delivered to you."
  },
  btn_marketplace: {
    [AppLanguage.DARIJA]: "Souk sghir dyal l'khalat. Techri w tbi'e hwayej dyal l'yed.",
    [AppLanguage.TAMAZIGHT]: "Souk n lmou'alafat. Sghem negh zenz tighawsiwin l'yed nnek.",
    [AppLanguage.FRENCH]: "Le Marché Solidaire. Vendez vos créations faites à la main ou découvrez le travail d'autres artisanes.",
    [AppLanguage.ENGLISH]: "Handmade Marketplace. Sell your crochet items or shop certified creations made by local artisans."
  },
  btn_mic: {
    [AppLanguage.DARIJA]: "Hdar dyalak! Qouliya chno bghiti ndirlik. Mathalan qoul krouchi awla nechri.",
    [AppLanguage.TAMAZIGHT]: "Sawal! Ini yi d mad righ. Mathalan ini krouchi negh asg.",
    [AppLanguage.FRENCH]: "Parlez-moi ! Dites par exemple 'apprendre le crochet', 'acheter un kit', ou 'vendre'.",
    [AppLanguage.ENGLISH]: "Talk to me! Say something like 'learn crochet', 'buy kit', or 'marketplace'."
  },
  btn_sync: {
    [AppLanguage.DARIJA]: "M'sennia kolchi m'aa l'internet mzyan. Ghadi hwayj dyalak tsynia f l'blassa.",
    [AppLanguage.TAMAZIGHT]: "Tghawsiwin nnek ka d'synchronisawn. Kolchi i-cacher f l'appareil.",
    [AppLanguage.FRENCH]: "Données sauvegardées en local et synchronisées avec le serveur.",
    [AppLanguage.ENGLISH]: "Synchronized offline database. Your progress is saved and securely backed up."
  },
  btn_offline: {
    [AppLanguage.DARIJA]: "Makaynach l'internet daba! Khidma dyalek ghadi tkhab f tilifoune hta trje'e tharouf.",
    [AppLanguage.TAMAZIGHT]: "Urlant internet! Tikhray nnek gant i-cacher f tilifoune rh d ya'ach.",
    [AppLanguage.FRENCH]: "Mode Hors-ligne activé. Vos actions sont enregistrées localement et seront synchronisées dès le retour d'Internet.",
    [AppLanguage.ENGLISH]: "Offline mode active. Your changes are saved locally and will auto-sync when online."
  },
  success_cart: {
    [AppLanguage.DARIJA]: "Zidat l'sandouk f l'panier. Brk l'foq l'imnech l'chouf l'slat dyalak.",
    [AppLanguage.TAMAZIGHT]: "Inra l'box f tasmult nnek. Ouy'ed aflla n tsalt.",
    [AppLanguage.FRENCH]: "Kit ajouté au panier avec succès ! Cliquez sur le panier en haut à droite pour commander.",
    [AppLanguage.ENGLISH]: "Successfully added to cart! Click the basket on the top-right to order."
  },
  success_checkout: {
    [AppLanguage.DARIJA]: "Mzyane bazzzaf! Soweftna l'talab dyalak b najah, ghadi nettaslo bik qrib incha'allah.",
    [AppLanguage.TAMAZIGHT]: "Tanemmirt! Tasmult nnek t'inra b najah, ra k nettasel gr n l'khar.",
    [AppLanguage.FRENCH]: "Félicitations ! Votre commande a été enregistrée. Nous vous contacterons par téléphone pour valider l'adresse.",
    [AppLanguage.ENGLISH]: "Order submitted successfully! We will call you soon to arrange delivery."
  },
  vocal_upload_creation: {
    [AppLanguage.DARIJA]: "Tqdar tewra'a hna'a, tsower l'krouchi dyalk b l'cam w tsdha.",
    [AppLanguage.TAMAZIGHT]: "Tzmerad ad tsowert tikhray nnek s l'kam, t'upload-t.",
    [AppLanguage.FRENCH]: "Prenez en photo votre crochet pour le vendre sur le marché solidaire.",
    [AppLanguage.ENGLISH]: "Take a photo of your work to sell it instantly in the marketplace."
  }
};

let currentSpeakerUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Robust Text-to-Speech function mapped to native SpeechSynthesis voices
 */
export function speakText(text: string, lang: AppLanguage): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech synthesis not supported in this browser");
      resolve();
      return;
    }

    // Stop speaking any pending audio
    window.speechSynthesis.cancel();

    // Map custom text
    let targetText = text;
    if (lang === AppLanguage.TAMAZIGHT) {
      // Use phonetic fallback if mapped
      targetText = TAMAZIGHT_PHONETIC_FALLBACK[text] || text;
    }

    const utterance = new SpeechSynthesisUtterance(targetText);
    currentSpeakerUtterance = utterance;

    // Select suitable voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (lang === AppLanguage.DARIJA) {
      // Search for Arabic voices
      selectedVoice = voices.find(v => v.lang.startsWith('ar-MA') || v.lang.startsWith('ar-')) || null;
      utterance.rate = 0.85; // slightly slower for Darija clarity
    } else if (lang === AppLanguage.TAMAZIGHT) {
      // Berber phonemes sound wonderfully authentic when spoken by custom slow-rate French voice
      selectedVoice = voices.find(v => v.lang.startsWith('fr-FR') || v.lang.startsWith('fr')) || null;
      utterance.rate = 0.75; // slow down significantly
      utterance.pitch = 1.15; // slightly higher pitch
    } else if (lang === AppLanguage.FRENCH) {
      selectedVoice = voices.find(v => v.lang.startsWith('fr-')) || null;
      utterance.rate = 0.95;
    } else {
      selectedVoice = voices.find(v => v.lang.startsWith('en-')) || null;
      utterance.rate = 0.95;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Set culture/lang trigger
    utterance.lang = lang === AppLanguage.DARIJA ? 'ar-AE' : (lang === AppLanguage.TAMAZIGHT ? 'fr-FR' : (lang === AppLanguage.FRENCH ? 'fr-FR' : 'en-US'));

    utterance.onend = () => {
      currentSpeakerUtterance = null;
      resolve();
    };

    utterance.onerror = (e) => {
      console.error("TTS play error", e);
      currentSpeakerUtterance = null;
      resolve();
    };

    window.speechSynthesis.speak(utterance);
    
    // Safety timeout in case callback doesn't fire due to browser sleep
    setTimeout(() => {
      resolve();
    }, 12000);
  });
}

/**
 * Speaks a static layout phrase based on lookups
 */
export function speakPhrase(phraseKey: string, lang: AppLanguage): Promise<void> {
  const phrase = VOCAL_PHRASES[phraseKey]?.[lang];
  if (phrase) {
    return speakText(phrase, lang);
  } else {
    console.warn(`Phrase key not found: ${phraseKey}`);
    return Promise.resolve();
  }
}

/**
 * Full-featured Speech Recognition Wrapper using native Web Speech API
 */
export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback: (text: string) => void = () => {};
  private onEndCallback: () => void = () => {};
  private onErrorCallback: (err: any) => void = () => {};

  constructor(lang: AppLanguage) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.updateLanguage(lang);

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Speech recognized transcript:", transcript);
        this.onResultCallback(transcript);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEndCallback();
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech Recognition error:", event.error);
        this.isListening = false;
        this.onErrorCallback(event);
      };
    }
  }

  public updateLanguage(lang: AppLanguage) {
    if (!this.recognition) return;
    if (lang === AppLanguage.DARIJA) {
      this.recognition.lang = 'ar-MA'; // Moroccan Arabic / Darija Recognition
    } else if (lang === AppLanguage.TAMAZIGHT) {
      this.recognition.lang = 'kab-DZ'; // Kabyle / Tamazight Dialect or French-phonetics
    } else if (lang === AppLanguage.FRENCH) {
      this.recognition.lang = 'fr-FR';
    } else {
      this.recognition.lang = 'en-US';
    }
  }

  public start(
    onResult: (text: string) => void,
    onEnd: () => void,
    onError: (err: any) => void
  ) {
    if (!this.recognition) {
      onError("Speech Recognition not supported in this browser");
      return;
    }
    if (this.isListening) {
      this.recognition.stop();
      return;
    }

    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;
    this.onErrorCallback = onError;

    try {
      // Silence active synthesizers
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      this.recognition.start();
      this.isListening = true;
    } catch (err) {
      console.error("Failed to start speech recognition", err);
      onError(err);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public active(): boolean {
    return this.isListening;
  }
}
