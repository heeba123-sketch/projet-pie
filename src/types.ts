/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AppLanguage {
  DARIJA = 'ar', // Moroccan Darija
  TAMAZIGHT = 'tmz', // Berber/Tamazight
  FRENCH = 'fr',
  ENGLISH = 'en'
}

export interface LocalizedText {
  ar: string;  // Darija phonetics / Arabic script
  tmz: string; // Tamazight transcript / Tifinagh symbols
  fr: string;  // French translation
  en: string;  // English translation
}

export interface Course {
  id: string;
  metier?: 'crochet' | 'broderie' | 'tissage' | 'poterie' | string;
  title: LocalizedText;
  description: LocalizedText;
  difficulty: 'facile' | 'moyen' | 'expert'; // easy, medium, expert
  steps: CourseStep[];
  videoMockName: string; // e.g. 'chain-stitch'
  videoEmbedId?: string; // Optional YouTube video ID for real-world tutorials
  duration: string; // duration in voice representation
  linkedKitId?: string; // Optional kit ID associated with this course
  exercise?: {
    title: LocalizedText;
    desc: LocalizedText;
    earnPrice: number;
    outputProductId: string;
  };
}

export interface CourseStep {
  stepNumber: number;
  instruction: LocalizedText;
  animationKey: string; // dynamic graphic representation coordinate system
}

export interface Kit {
  id: string;
  title: LocalizedText;
  price: number; // in MAD (Maroc Dirham) or DH
  description: LocalizedText;
  whatsInside: LocalizedText[];
  imageUrl: string;
  colorHex: string; // crochet primary wool color code
}

export interface Product {
  id: string;
  title: string; // Human readable name
  price: number;
  description: string;
  imageUrl: string;
  sellerName: string;
  isCertified: boolean; // Approved by Maâlma expert
  likes: number;
  isUserAdded?: boolean;
  offlineId?: string; // Tracking offline submissions before sync
  voiceMemoUrl?: string; // Simulated voice description
}

export interface CartItem {
  kitId: string;
  quantity: number;
}

export interface AppState {
  currentLanguage: AppLanguage;
  activeTab: 'home' | 'learn' | 'kits' | 'marketplace' | 'community' | 'profile';
  activeCourseId: string | null;
  activeCourseStep: number;
  cart: CartItem[];
  isOffline: boolean;
  isSyncing: boolean;
  marketplaceProducts: Product[];
  offlineActionsQueue: {
    type: 'add_to_marketplace' | 'submit_order';
    payload: any;
    id: string;
  }[];
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorRole: 'foyer' | 'jeune' | 'etudiant' | 'rural'; // Femmes au foyer, Jeunes sans emploi, Étudiants, Habitants ruraux
  authorLocation: string; // e.g. "Tafraout", "Chefchaouen", "Sefrou"
  imageUrl: string;
  voicePhrase: LocalizedText;
  category: 'crochet' | 'broderie' | 'tissage' | 'couture';
  likes: number;
  cheersCount: number; // Custom Moroccan "Zghrouta" count
  timeAgo: LocalizedText;
}

export interface VoiceAssistantResponse {
  action?: 'navigate' | 'add_to_cart' | 'toggle_language' | 'sync' | 'speak';
  target?: string; // e.g., 'learn', 'kits', 'marketplace', 'home'
  item?: string;   // specific name of kit or product
  language?: string; // target language code
  voiceResponse: {
    ar: string;
    tmz: string;
    fr: string;
    en: string;
  };
}
