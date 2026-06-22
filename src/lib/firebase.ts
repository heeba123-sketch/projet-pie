/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  getDoc,
  writeBatch
} from 'firebase/firestore';

// Setup types
export interface PIEUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string;
  role: 'foyer' | 'jeune' | 'etudiant' | 'rural' | 'invite';
  location: string;
  earnings: number;
  coursesCompleted: number;
  level: string;
  xp: number;
  streak: number;
}

let app;
let auth: any = null;
let provider: any = null;
let db: any = null;
let isRealFirebase = false;

const MOCK_USERS_KEY = 'pie_mock_auth_users';
const ACTIVE_MOCK_USER_KEY = 'pie_mock_active_user';

// Default Kits data for fallback & seeding
export const DEFAULT_KITS = [
  {
    id: "kit-1",
    title: {
      ar: "صندوق الصوف كوكو المبتدئ",
      tmz: "Box n'Koko Tamzwarout",
      fr: "Kit Débutant Coco - Crochet",
      en: "Coco Starter Crochet Kit"
    },
    price: 120,
    description: {
      ar: "صندوق كامل لتعليم الكروشي الأول. فيه صوف كوكو غليظ وإبرة 4 ملم.",
      tmz: "Box i-lemden krouchi. Ssof ikhedmen d needle 4mm.",
      fr: "Le coffret parfait pour débuter le crochet. Contient de la laine épaisse Coco blanche et un crochet de 4mm.",
      en: "The perfect box to start crocheting. Includes thick white Coco yarn and a 4mm crochet."
    },
    imageUrl: "/assets/kit_coco_crochet.jpg",
    colorHex: "#F5F5DC",
    stock: 18
  },
  {
    id: "kit-2",
    title: {
      ar: "صندوق الشغف الكرزي",
      tmz: "Box Passion Cerise d'Khayt",
      fr: "Kit Passion Cerise - Broderie",
      en: "Cherry Passion Embroidery Kit"
    },
    price: 150,
    description: {
      ar: "صندوق يعلمك طرز الورود بخيط ملون وقرص خشبي مرن.",
      tmz: "Box i-tzegawt n rkham. Ikat ar-rcham d daira n akchoud.",
      fr: "Apprenez l'art de la broderie florale. Comprend un tambour en bois et des fils de coton rouge cerise.",
      en: "Learn floral embroidery with ease. Includes a wooden embroidery frame and cherry cotton threads."
    },
    imageUrl: "/assets/kit_passion_cerise.png",
    colorHex: "#8B0000",
    stock: 9
  },
  {
    id: "kit-3",
    title: {
      ar: "صندوق الأطلس الأمازيغي",
      tmz: "Box n'Atlas l'Ahmar",
      fr: "Kit Atlas Royal - Tissage Traditionnel",
      en: "Royal Atlas Traditional Weaving Kit"
    },
    price: 180,
    description: {
      ar: "صندوق فخم من تقاليد الأطلس فيه خيط صوف أحمر أصيل لتعلم المنسج العائلي.",
      tmz: "Box n'Ahmar l'Atlas. Ssof awragh d tkharay n tizgawt.",
      fr: "Plongez dans l'héritage berbère. Confectionnez un mini-tissage mural inspiré des motifs géométriques de l'Atlas.",
      en: "Discover Berber heritage. Create a small wall weaving matching traditional geometric Atlas designs."
    },
    imageUrl: "/assets/kit_atlas_royal.png",
    colorHex: "#FF4500",
    stock: 4
  }
];

// Default Courses data for fallback & seeding
export const DEFAULT_TUTORIALS = [
  {
    id: "course-1",
    metier: "crochet",
    linkedKitId: "kit-1",
    title: {
      ar: "الكروشي: عقدة البداية الأولى",
      tmz: "Krouchi: Oqqan Tamzwarout",
      fr: "Crochet - La première boucle : Le nœud coulant",
      en: "Crochet - First Stitch: The slip knot"
    },
    description: {
      ar: "أساس كل عمل في الكروشي. عقدة ساهلة دور الخيط على صبعك وجر.",
      tmz: "Aslas n krouchi. Aqan isehlan ssof f ouda nnek.",
      fr: "La base de tout travail. Créez votre première boucle coulissante sur le crochet.",
      en: "The foundation of all crochet. Twist the thread around your finger and pull securely."
    },
    difficulty: "facile",
    duration: "3 min",
    videoEmbedId: "n8A-H8U_8e0"
  },
  {
    id: "course-2",
    metier: "crochet",
    linkedKitId: "kit-1",
    title: {
      ar: "الكروشي: خدمة السنسلة الطائرة",
      tmz: "Krouchi: Maille Ssensla",
      fr: "Crochet - La maille en l'air (La chaînette)",
      en: "Crochet - The Chain Stitch (Chaînette)"
    },
    description: {
      ar: "كتصنع الطول المناسب لخدمتك. فحال السنسلة ساهلة وتكرر.",
      tmz: "Asg l'hem n tixri nnek. Tamen am ssensla isehlan.",
      fr: "Créez une jolie ligne de départ en faisant glisser la laine à travers la boucle existante.",
      en: "Produce your initial baseline row by passing the hook thread continuously."
    },
    difficulty: "facile",
    duration: "5 min",
    videoEmbedId: "n8A-H8U_8e0"
  },
  {
    id: "course-3",
    metier: "crochet",
    linkedKitId: "kit-1",
    title: {
      ar: "الكروشي: وردة د الأركان السحرية",
      tmz: "Krouchi: Tarjich n n'Argan",
      fr: "Crochet - Le Motif de Fleur d'Arganier",
      en: "Crochet - The Argan Flower Stitch"
    },
    description: {
      ar: "زواقة كروشي تقليدية ممتازة كتشبه للوردة. زيري باش تطلع مفكسية.",
      tmz: "Motif Argan tasebhaht krouchi. Lemmed asg.",
      fr: "Créez une splendide rosace en relief inspirée de l'arbre d'Arganier du Souss.",
      en: "Learn a floral motif design inspired by Souss valley's sacred Argan flower."
    },
    difficulty: "moyen",
    duration: "8 min",
    videoEmbedId: "CgH6q309wJw"
  },
  {
    id: "course-4",
    metier: "broderie",
    linkedKitId: "kit-2",
    title: {
      ar: "الطرز: غرزة الوردة الفاسية بالحرير",
      tmz: "Broderie: Tarzgout n'Fas",
      fr: "Broderie - Le Point de Nœud de Fès",
      en: "Embroidery - Fez Silk French Knot"
    },
    description: {
      ar: "غرزة فاسية تقليدية بالحرير كتصنع نقط بارزة ومطرزة غاية فالجمال.",
      tmz: "Tarzgout n silk lmou'allamat lmoghrib.",
      fr: "Le secret des détails granuleux et floraux sur les nappes marocaines brodées.",
      en: "The secret trick behind beaded floral details on premium Moroccan table clothing."
    },
    difficulty: "moyen",
    duration: "6 min",
    videoEmbedId: "YFv_D2C5x8Q"
  },
  {
    id: "course-5",
    metier: "tissage",
    linkedKitId: "kit-3",
    title: {
      ar: "التيسيج: نسج منسج الأطلس العريق",
      tmz: "Tissage: Mensaj n'Atlas",
      fr: "Tissage - Le Métier à Tisser de l'Atlas",
      en: "Weaving - Royal Atlas Looming"
    },
    description: {
      ar: "طريقة جمع خيوط الزربية بالطول والألوان الدافية باش تعلي لوحة منسوجة.",
      tmz: "Tixri lmounassama n ssof n n'Atlas.",
      fr: "Montez votre premier mini métier à tisser en bois et croisez la laine rouge.",
      en: "Mount your first miniature wall rug weaving project using warm Atlas crimson wool."
    },
    difficulty: "expert",
    duration: "10 min",
    videoEmbedId: "5F_O8t_v7sY"
  }
];

// Setup Mock Store if not exists
if (!localStorage.getItem(MOCK_USERS_KEY)) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify([
    {
      uid: 'user-lma-1',
      displayName: 'Khadiya Soussia',
      email: 'khadija@pie.ma',
      role: 'foyer',
      location: 'Tafraout',
      earnings: 4800,
      coursesCompleted: 3,
      level: 'Maâlma Confirmée',
      xp: 1250,
      streak: 12
    },
    {
      uid: 'user-lma-2',
      displayName: 'Yassir Gherbi',
      email: 'yassir@pie.ma',
      role: 'jeune',
      location: 'Sefrou',
      earnings: 2300,
      coursesCompleted: 2,
      level: 'Artisan Passionné',
      xp: 850,
      streak: 5
    }
  ]));
}

// Runtime attempt to load Firebase & Firestore
export async function tryInitializeFirebase() {
  try {
    const response = await fetch('/firebase-applet-config.json');
    if (!response.ok) {
      throw new Error('Config file not found');
    }
    const firebaseConfig = await response.json();
    if (firebaseConfig && firebaseConfig.apiKey) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);
      provider = new GoogleAuthProvider();
      isRealFirebase = true;
      console.log('🔥 Firebase & Firestore Initialized successfully!');
      
      // Run database seeding checking in the background
      seedFirestoreCollections();
    }
  } catch (err) {
    console.warn('⚠️ Firebase config file not available yet. Falling back to High-Fidelity Inclusive Auth Emulator.');
    isRealFirebase = false;
  }
}

export function getIsRealFirebase(): boolean {
  return isRealFirebase && auth !== null && db !== null;
}

// Database Seeding Logic
async function seedFirestoreCollections() {
  if (!db) return;
  try {
    // 1. Check Kits
    const kitsColl = collection(db, 'kits');
    const kitsSnapshot = await getDocs(kitsColl);
    if (kitsSnapshot.empty) {
      console.log('🌱 Seeding default Kits collection into Firestore...');
      const batch = writeBatch(db);
      DEFAULT_KITS.forEach((k) => {
        const d = doc(db, 'kits', k.id);
        batch.set(d, k);
      });
      await batch.commit();
    }

    // 2. Check Tutorials
    const tutorialsColl = collection(db, 'tutorials');
    const tutorialsSnapshot = await getDocs(tutorialsColl);
    if (tutorialsSnapshot.empty) {
      console.log('🌱 Seeding default Tutorials collection into Firestore...');
      const batch = writeBatch(db);
      DEFAULT_TUTORIALS.forEach((t) => {
        const d = doc(db, 'tutorials', t.id);
        batch.set(d, t);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to seed Firestore collections', err);
  }
}

const BASE = import.meta.env.VITE_API_URL || '/api';

// Always fetch Kits from the Laravel MySQL backend (via Express proxy)
export async function fetchKits(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/kits`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('[fetchKits] Backend unreachable, using bundled defaults.');
  }
  // Last-resort: bundled static list
  return DEFAULT_KITS;
}

// Always fetch Tutorials from the Laravel MySQL backend (via Express proxy)
export async function fetchTutorials(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/tutorials`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('[fetchTutorials] Backend unreachable, using bundled defaults.');
  }
  return DEFAULT_TUTORIALS;
}

// Always fetch Products from the Laravel MySQL backend (via Express proxy)
export async function fetchProducts(): Promise<any[]> {
  try {
    const res = await fetch(`${BASE}/products`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('[fetchProducts] Backend unreachable, returning empty list.');
  }
  return [];
}

// Add product to Laravel MySQL backend
export async function addUserProduct(product: any): Promise<any> {
  const pData = {
    ...product,
    isCertified: false,
    likes: 0,
    isUserAdded: true,
    createdAt: new Date().toISOString()
  };
  const res = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pData)
  });
  return await res.json();
}

// Submit order to Laravel MySQL backend
export async function submitClientOrder(order: any): Promise<any> {
  const oData = {
    ...order,
    date: new Date().toISOString()
  };
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(oData)
  });
  return await res.json();
}

// Firestore wrapper: Get user profile or create if not exists
export async function getUserProfile(uid: string): Promise<PIEUser | null> {
  if (getIsRealFirebase()) {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as PIEUser;
      }
    } catch (e) {
      console.error("Firestore read user profile error", e);
    }
  }
  return null;
}

// Firestore wrapper: Write / update user profile progress (XP, gains, level)
export async function updateUserProfile(uid: string, data: Partial<PIEUser>): Promise<void> {
  if (getIsRealFirebase()) {
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, data, { merge: true });
      return;
    } catch (e) {
      console.error("Firestore write user profile error", e);
    }
  }

  // Fallback: update in mock localstorage
  const mockUsers = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
  const index = mockUsers.findIndex((u: any) => u.uid === uid);
  if (index !== -1) {
    mockUsers[index] = { ...mockUsers[index], ...data };
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers));
  }
}

export async function signInWithGoogle(): Promise<PIEUser | null> {
  if (!auth || !provider) {
    throw new Error("Firebase Auth is not initialized yet.");
  }
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  
  // Try to load existing profile from Firestore
  let profile = await getUserProfile(user.uid);
  
  if (!profile) {
    // Register new user profile in Firestore
    profile = {
      uid: user.uid,
      displayName: user.displayName || 'Artisan Hirfa',
      email: user.email,
      role: 'foyer', // Default helpful target segment
      location: 'Tafraout (Souss)',
      earnings: 0,
      coursesCompleted: 0,
      level: 'Nouveau Membre',
      xp: 0,
      streak: 1
    };
    await updateUserProfile(user.uid, profile);
  }
  
  return profile;
}

export async function firebaseSignOut(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export { auth, provider, db, isRealFirebase };

export function getPersistedMockUser(): PIEUser | null {
  const stored = localStorage.getItem(ACTIVE_MOCK_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function savePersistedMockUser(user: PIEUser | null) {
  if (user) {
    localStorage.setItem(ACTIVE_MOCK_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(ACTIVE_MOCK_USER_KEY);
  }
}

// --- Administrative Firestore Wrappers ---

export async function firebaseApproveProduct(productId: string): Promise<any> {
  const response = await fetch(`${BASE}/admin/products/${productId}/approve`, { method: 'PUT' });
  return await response.json();
}

export async function firebaseRejectProduct(productId: string): Promise<void> {
  await fetch(`${BASE}/admin/products/${productId}`, { method: 'DELETE' });
}

export async function firebaseRestockKit(kitId: string, newStock: number): Promise<any> {
  const response = await fetch(`${BASE}/admin/kits/${kitId}/stock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock: newStock })
  });
  return await response.json();
}

export async function fetchAdminSummary(): Promise<any> {
  const response = await fetch(`${BASE}/admin/summary`);
  return await response.json();
}
