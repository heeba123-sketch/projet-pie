/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  Coins,
  Headphones,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Play,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
  Plus,
  AlertTriangle,
  User,
  CheckCircle,
  Search,
  Send,
  Info,
  Volume2,
  Square
} from 'lucide-react';
import {
  tryInitializeFirebase,
  getPersistedMockUser,
  PIEUser,
  fetchKits,
  fetchTutorials,
  fetchAdminSummary,
  addUserProduct,
  submitClientOrder,
  firebaseApproveProduct,
  firebaseRejectProduct,
  firebaseRestockKit
} from '../lib/firebase';
import { Product, AppLanguage } from '../types';
import { speakText } from '../utils/speech';

interface AdminSummary {
  premiumSubscribers: number;
  kitsSold: number;
  monthlyCreations: number;
  pendingCreations: number;
  monthlyRevenue: number;
  ordersCount: number;
  stock: {
    kitId: string;
    title: string;
    stock: number;
    reorderAt: number;
  }[];
}

interface Course {
  id: string;
  metier: string;
  linkedKitId: string;
  title: { ar: string; tmz: string; fr: string; en: string };
  description: { ar: string; tmz: string; fr: string; en: string };
  difficulty: string;
  duration: string;
  videoEmbedId?: string;
  exercise?: {
    title: { ar: string; tmz: string; fr: string; en: string };
    desc: { ar: string; tmz: string; fr: string; en: string };
    earnPrice: number;
  };
}

interface Kit {
  id: string;
  title: { ar: string; tmz: string; fr: string; en: string };
  price: number;
  description: { ar: string; tmz: string; fr: string; en: string };
  imageUrl: string;
  colorHex: string;
}

interface AdminSection {
  id: string;
  label: string;
  Icon: React.ComponentType<any>;
  items?: readonly string[];
}

const adminSections: readonly AdminSection[] = [
  { id: 'dashboard', label: 'Tableau de Bord', Icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', Icon: Users, items: ['Artisanes', 'Clients'] },
  { id: 'courses', label: 'Catalogue de Cours', Icon: BookOpen, items: ['Créer Cours', 'Gestion Vidéos (4K)', 'Gérer Maalma'] },
  { id: 'kits', label: 'Boutique de Kits', Icon: Package, items: ['Gérer Produits', 'Gestion Stock', 'Expéditions'] },
  { id: 'marketplace', label: 'Marketplace Solidaire', Icon: Box, items: ['Modération Créations', 'Suivi Ventes', 'Commissions'] },
  { id: 'comms', label: 'Entraide & Comms', Icon: MessageSquare, items: ['Modération Vocale', 'Support Live', 'Évaluations'] },
  { id: 'finance', label: 'Business & Finances', Icon: Coins, items: ['Abonnements Premium', 'Rapports de Ventes', 'Facturation'] },
  { id: 'settings', label: 'Paramètres Système', Icon: Settings }
];

const voiceMessages = [
  {
    id: 'vm-1',
    text: "Regardez ma laine pure d' Atlas est enfin tricottée prur ma petite fille elier grace re...",
    speaker: "Zahra Aït Melloul",
    date: "Aujourd'hui, 11:24"
  },
  {
    id: 'vm-2',
    text: "Mon tapis ma laine pure d' Atlas et enfin prêt ! I apprich à monter le métier et tisse...",
    speaker: "Fatima Chefchaouen",
    date: "Aujourd'hui, 10:15"
  },
  {
    id: 'vm-3',
    text: "Mon tapis ma laine pure d' Atlas et enfin prêt ! I apprich à monter traditionnel voc...",
    speaker: "Khadija Tafraout",
    date: "Hier, 18:40"
  }
];

// Default fallback data for artisanes, clients, expeditions
const DEFAULT_ARTISANES = [
  { id: 'art-1', name: 'Mihvaram', region: 'Taroudant', specialty: 'Tissage', level: 'Maâlma Expert', coursesCount: 6, kitsSold: 23, rating: 6.9, active: true, earnings: 4500 },
  { id: 'art-2', name: 'Malias Auhr', region: 'Chefchaouen', specialty: 'Broderie', level: 'Maâlma Expert', coursesCount: 20, kitsSold: 38, rating: 6.5, active: true, earnings: 9200 },
  { id: 'art-3', name: 'Malika Ait', region: 'Sefrou', specialty: 'Crochet', level: 'Enseignante', coursesCount: 4, kitsSold: 15, rating: 4.8, active: true, earnings: 2800 },
  { id: 'art-4', name: 'Khadija E uargh', region: 'Tiznit', specialty: 'Poterie', level: 'Compagnon', coursesCount: 1, kitsSold: 13, rating: 4.75, active: true, earnings: 1950 },
  { id: 'art-5', name: 'Zineb Benslimane', region: 'Marrakech', specialty: 'Broderie', level: 'Débutante', coursesCount: 0, kitsSold: 4, rating: 4.2, active: false, earnings: 480 }
];

const DEFAULT_CLIENTS = [
  { id: 'cli-1', name: 'Jean-Pierre L.', phone: '+33 6 12 34 56 78', region: 'Paris, France', ordersCount: 4, totalSpent: 1850, active: true },
  { id: 'cli-2', name: 'Souad Amrani', phone: '+212 6 61 22 33 44', region: 'Casablanca, Maroc', ordersCount: 2, totalSpent: 620, active: true },
  { id: 'cli-3', name: 'Elena Rostova', phone: '+49 170 9876543', region: 'Berlin, Allemagne', ordersCount: 5, totalSpent: 2950, active: true },
  { id: 'cli-4', name: 'Ahmed Oudghiri', phone: '+212 6 70 88 99 00', region: 'Rabat, Maroc', ordersCount: 1, totalSpent: 120, active: false }
];

const DEFAULT_EXPEDITIONS = [
  { id: 'exp-1', client: 'Jean-Pierre L.', destination: 'Paris, France', kit: 'Kit Atlas Royal', price: 180, date: '02.06.2026', status: 'Expédié' },
  { id: 'exp-2', client: 'Souad Amrani', destination: 'Casablanca, Maroc', kit: 'Kit Débutant Coco', price: 120, date: '02.06.2026', status: 'En préparation' },
  { id: 'exp-3', client: 'Elena Rostova', destination: 'Berlin, Allemagne', kit: 'Kit Passion Cerise', price: 150, date: '01.06.2026', status: 'Livré' }
];

export const AdminDashboard: React.FC = () => {
  // Navigation / views state
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [activeSubSection, setActiveSubSection] = useState<string>('');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Core API State
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [artisanes, setArtisanes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [expeditions, setExpeditions] = useState<any[]>([]);

  // Price editing state
  const [editingPriceKitId, setEditingPriceKitId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');

  // Page level states
  const [statusText, setStatusText] = useState<string>('Prêt');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  // Search & filters
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Voice message player state
  const [activeVoiceMsgId, setActiveVoiceMsgId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  // Business insights chart hover state
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{ x: number; y: number; valKits: number; valComm: number; month: string } | null>(null);

  // Restock Modal
  const [selectedRestockKit, setSelectedRestockKit] = useState<{ id: string; title: string; currentStock: number } | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);

  // Detail highlight Modals
  const [selectedMaalma, setSelectedMaalma] = useState<any | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showMessages, setShowMessages] = useState<boolean>(false);

  // Interactive Live Chat
  const [chatMessages, setChatMessages] = useState<{ sender: 'maalma' | 'admin'; text: string; time: string }[]>(() => {
    const saved = localStorage.getItem('projet_pie_chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [newChatText, setNewChatText] = useState<string>('');

  // Course Creator State
  const [newCourse, setNewCourse] = useState({
    titleFr: '', titleAr: '', metier: 'crochet', linkedKitId: 'kit-1', difficulty: 'facile', duration: '5 min', earnPrice: 200, descFr: ''
  });

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const API_BASE = ((import.meta as any).env?.VITE_API_URL) || '/api';
      const [summaryRes, productsRes, tutorialsRes, kitsRes, ordersRes, artisanesRes, clientsRes, expeditionsRes] = await Promise.all([
        fetchAdminSummary(),
        fetch(`${API_BASE}/admin/products`).then(r => r.ok ? r.json() : []),
        fetchTutorials(),
        fetchKits(),
        fetch(`${API_BASE}/admin/orders`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/admin/artisanes`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/admin/clients`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/admin/expeditions`).then(r => r.ok ? r.json() : [])
      ]);

      if (summaryRes != null) setSummary(summaryRes as AdminSummary);
      if (productsRes != null) setProducts(productsRes as Product[]);
      if (tutorialsRes != null) setCourses(tutorialsRes as Course[]);
      if (kitsRes != null) setKits(kitsRes as Kit[]);
      if (Array.isArray(ordersRes)) setOrders(ordersRes);
      if (Array.isArray(artisanesRes)) setArtisanes(artisanesRes);
      if (Array.isArray(clientsRes)) setClients(clientsRes);
      if (Array.isArray(expeditionsRes)) setExpeditions(expeditionsRes);

      setStatusText('Données synchronisées avec succès');
    } catch (err) {
      console.error('Failed to sync admin data', err);
      setStatusText('Erreur de connexion serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const updateKitPrice = async (kitId: string, newPrice: number) => {
    const API_BASE = ((import.meta as any).env?.VITE_API_URL) || '/api';
    try {
      const res = await fetch(`${API_BASE}/admin/kits/${kitId}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice })
      });
      if (!res.ok) throw new Error('Failed');
      setKits(prev => prev.map(k => k.id === kitId ? { ...k, price: newPrice } : k));
      showToast(`Prix mis à jour : ${newPrice} DH`, 'success');
      setEditingPriceKitId(null);
    } catch {
      showToast('Erreur lors de la mise à jour du prix.', 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const API_BASE = ((import.meta as any).env?.VITE_API_URL) || '/api';
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed');
      setOrders(prev => prev.map((o: any) => o.id === orderId ? { ...o, status } : o));
      const emoji = status === 'confirmed' ? '✅' : '❌';
      showToast(`${emoji} Commande ${orderId} : ${status === 'confirmed' ? 'Validée' : 'Annulée'}`, status === 'confirmed' ? 'success' : 'error');
      const notifs = JSON.parse(localStorage.getItem('projet_pie_client_notifications') || '[]');
      notifs.push({ orderId, status, timestamp: new Date().toISOString() });
      localStorage.setItem('projet_pie_client_notifications', JSON.stringify(notifs));
    } catch {
      showToast('Erreur lors de la mise à jour.', 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      // Auto-refresh every 5 seconds for real-time dynamic updates
      const pollInterval = setInterval(() => {
        loadData();
      }, 5000);
      return () => clearInterval(pollInterval);
    }
  }, [isAuthenticated]);

  // Load artisanes, clients, and expeditions dynamically
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadDynamicData = async () => {
      try {
        const API_BASE = ((import.meta as any).env?.VITE_API_URL) || '/api';
        const [artisanesRes, clientsRes, expeditionsRes] = await Promise.all([
          fetch(`${API_BASE}/admin/artisanes`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/admin/clients`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/admin/expeditions`).then(r => r.ok ? r.json() : [])
        ]);
      } catch (err) {
        console.error('Failed to load dynamic admin data', err);
      }
    };
    loadDynamicData();
    const pollInterval = setInterval(loadDynamicData, 5000);
    return () => clearInterval(pollInterval);
  }, [isAuthenticated]);

  // Real-time listener for Cross-tab notifications (Orders & Messages)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'projet_pie_admin_notifications') {
        const notifs = JSON.parse(e.newValue || '[]');
        if (notifs.length > 0) {
          const latest = notifs[notifs.length - 1];
          // Show real-time luxurious toast
          showToast(`🚨 NOUVEAU: ${latest.message}`, 'info');
          // Automatically refresh the dashboard data to reflect the new order
          loadData();
        }
      }
      if (e.key === 'projet_pie_chat_messages') {
        const messages = JSON.parse(e.newValue || '[]');
        if (messages.length > chatMessages.length) {
          setChatMessages(messages);
          const latest = messages[messages.length - 1];
          if (latest.sender === 'maalma') {
            showToast("Nouveau message d'une Artisane !", 'info');
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [chatMessages.length, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'admin123') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Mot de passe incorrect. Indice: admin123');
    }
  };

  const approveProduct = async (id: string) => {
    try {
      const response = await firebaseApproveProduct(id);
      if (!response) throw new Error('Failed to approve');
      const updated = response;
      setProducts((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setSummary((curr) => curr ? { ...curr, pendingCreations: Math.max(0, curr.pendingCreations - 1) } : curr);
      showToast('Création certifiée et publiée au Souk !', 'success');
    } catch (err) {
      showToast("Erreur lors de l'approbation.", 'error');
    }
  };

  const rejectProduct = async (id: string) => {
    try {
      await firebaseRejectProduct(id);
      setProducts((prev) => prev.filter((item) => item.id !== id));
      setSummary((curr) => curr ? { ...curr, pendingCreations: Math.max(0, curr.pendingCreations - 1) } : curr);
      showToast('Création rejetée et retirée de la modération.', 'info');
    } catch (err) {
      showToast('Erreur lors du rejet.', 'error');
    }
  };

  const approveAll = async () => {
    const pending = products.filter((p) => !p.isCertified);
    if (pending.length === 0) return;
    setStatusText('Approbation en bloc...');
    for (const p of pending) {
      await approveProduct(p.id);
    }
    setStatusText('Prêt');
  };

  const executeRestock = async () => {
    if (!selectedRestockKit) return;
    try {
      const newStockVal = selectedRestockKit.currentStock + restockQty;
      const data = await firebaseRestockKit(selectedRestockKit.id, newStockVal);
      setSummary((current) =>
        current ? {
          ...current,
          stock: current.stock.map((item) => (item.kitId === selectedRestockKit.id ? { ...item, stock: data.stock } : item))
        } : current
      );
      showToast(`Stock de "${selectedRestockKit.title}" réapprovisionné à ${data.stock} unités.`, 'success');
      setSelectedRestockKit(null);
    } catch (err) {
      showToast("Erreur lors du réapprovisionnement.", 'error');
    }
  };

  const playVoiceMessage = async (msg: typeof voiceMessages[0]) => {
    if (activeVoiceMsgId === msg.id && isAudioPlaying) {
      // Pause
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      setActiveVoiceMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setActiveVoiceMsgId(msg.id);
    setIsAudioPlaying(true);
    setStatusText(`Lecture du message de ${msg.speaker}`);

    // Speak French transcription
    await speakText(msg.text, AppLanguage.FRENCH);

    // After speech ends
    setIsAudioPlaying(false);
    setActiveVoiceMsgId(null);
    setStatusText('Prêt');
  };

  // Add course to simulated or actual catalogue
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.titleFr || !newCourse.titleAr) {
      return showToast("Veuillez remplir les titres en Français et Arabe.", 'error');
    }
    const created: Course = {
      id: `course-${Date.now()}`,
      metier: newCourse.metier,
      linkedKitId: newCourse.linkedKitId,
      title: { fr: newCourse.titleFr, ar: newCourse.titleAr, tmz: newCourse.titleFr, en: newCourse.titleFr },
      description: { fr: newCourse.descFr || 'Nouveau cours ajouté par l\'admin.', ar: 'شرح الدرس الجديد', tmz: '', en: '' },
      difficulty: newCourse.difficulty,
      duration: newCourse.duration,
      exercise: {
        title: { fr: `Projet ${newCourse.titleFr}`, ar: 'تمرين الدرس', tmz: '', en: '' },
        desc: { fr: 'Exercice pratique de validation', ar: 'تمرين تطبيقي', tmz: '', en: '' },
        earnPrice: Number(newCourse.earnPrice)
      }
    };

    setCourses((prev) => [created, ...prev]);
    showToast(`Le cours "${newCourse.titleFr}" a été créé avec succès !`, 'success');
    setNewCourse({
      titleFr: '', titleAr: '', metier: 'crochet', linkedKitId: 'kit-1', difficulty: 'facile', duration: '5 min', earnPrice: 200, descFr: ''
    });
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    const userMsg = { sender: 'admin' as const, text: newChatText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    localStorage.setItem('projet_pie_chat_messages', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    
    setNewChatText('');
  };

  // Filter lists based on Search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(query) || p.sellerName.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
    });
  }, [products, searchQuery]);

  const filteredArtisanes = useMemo(() => {
    const dataToFilter = artisanes.length > 0 ? artisanes : DEFAULT_ARTISANES;
    return dataToFilter.filter((art) => {
      const query = searchQuery.toLowerCase();
      return art.name.toLowerCase().includes(query) || art.region.toLowerCase().includes(query) || art.specialty.toLowerCase().includes(query);
    });
  }, [searchQuery, artisanes]);

  const pendingCreationsList = useMemo(() => products.filter((p) => !p.isCertified), [products]);

  // SVG Chart Dimensions & calculation data
  const chartWidth = 420;
  const chartHeight = 160;
  const chartPoints = [
    { x: 30, y: 120, valKits: 450, valComm: 150, month: 'Jun' },
    { x: 120, y: 70, valKits: 1100, valComm: 380, month: 'Mar' },
    { x: 210, y: 100, valKits: 850, valComm: 290, month: 'Not' },
    { x: 300, y: 40, valKits: 1650, valComm: 520, month: 'Avr' },
    { x: 390, y: 20, valKits: 1980, valComm: 650, month: 'Mais' }
  ];

  const getPolylinePath = (key: 'valKits' | 'valComm') => {
    return chartPoints.map(p => {
      // mapping values to SVG height coordinates
      const maxVal = 2200;
      const mappedY = chartHeight - 20 - ((p[key] / maxVal) * (chartHeight - 40));
      return `${p.x},${mappedY}`;
    }).join(' ');
  };

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find closest point on X axis
    const closest = chartPoints.reduce((prev, curr) => {
      return Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev;
    });

    const maxVal = 2200;
    const mappedY = chartHeight - 20 - ((closest.valKits / maxVal) * (chartHeight - 40));

    // Show tooltip if within hover bounds
    if (Math.abs(closest.x - x) < 30) {
      setHoveredChartPoint({
        x: closest.x,
        y: mappedY,
        valKits: closest.valKits,
        valComm: closest.valComm,
        month: closest.month
      });
    } else {
      setHoveredChartPoint(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F0E7] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-[#EADFCE]">
          <div className="text-center mb-6">
            <ShieldCheck size={48} className="text-[#B85230] mx-auto mb-2" />
            <h1 className="text-2xl font-black text-[#17110C]">Espace Admin</h1>
            <p className="text-xs text-[#6B5845] mt-1">Authentification requise</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Mot de passe"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#B85230] font-bold"
              />
              {loginError && <p className="text-xs text-rose-500 mt-2 font-bold">{loginError}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#B85230] hover:bg-[#8C3A1E] text-white rounded-xl font-black text-sm transition-all shadow-md"
            >
              Se Connecter
            </button>
          </form>
          <button onClick={() => window.location.href = '/'} className="w-full mt-4 py-2 text-[#9B8570] hover:text-[#3D2B1A] text-xs font-bold">
            Retour au site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard font-sans antialiased">
      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside className="admin-sidebar select-none">
        <div>
          {/* Logo brand matching the design */}
          <div className="admin-brand mb-6 cursor-pointer" onClick={() => { setActiveSection('dashboard'); setActiveSubSection(''); }}>
            <span className="pie-logo text-[#B85230] font-black text-3xl tracking-tight">PIE</span>
            <small className="text-[10px] font-black text-[#6B4E36] tracking-[0.15em] uppercase mt-0.5">Projet PIE</small>
          </div>

          <nav className="admin-menu flex flex-col gap-1.5">
            {adminSections.map(({ id, label, Icon, items }) => {
              const isActive = activeSection === id;
              return (
                <div key={id} className="flex flex-col">
                  <button
                    className={`admin-menu-item flex items-center justify-between w-full text-left py-2.5 px-3 rounded-xl transition-all duration-200 ${
                      isActive ? 'active bg-[#FAF5EE] text-[#B85230] font-bold border-l-4 border-[#B85230]' : 'text-[#3D2B1A] hover:bg-white/40'
                    }`}
                    onClick={() => {
                      setActiveSection(id);
                      setActiveSubSection(items ? items[0] : '');
                    }}
                  >
                    <span className="admin-menu-title flex items-center gap-3 text-sm font-semibold">
                      <Icon size={18} className={isActive ? 'text-[#B85230]' : 'text-[#6B4E36]'} />
                      <span>{label}</span>
                    </span>
                    {items && <ChevronRight size={14} className={`text-[#9B8570] transition-transform duration-200 ${isActive ? 'rotate-90' : ''}`} />}
                  </button>

                  {/* Submenu rendering */}
                  {items && isActive && (
                    <div className="admin-subitems flex flex-col pl-7 mt-1 border-l border-[#EADFCE] ml-5 gap-0.5 mb-2">
                      {items.map((item) => (
                        <button
                          key={item}
                          className={`admin-subitem-btn py-1 px-2.5 text-xs text-[#6B4E36] text-left rounded-md hover:bg-[#FAF5EE]/60 hover:text-[#3D2B1A] transition-all ${
                            activeSubSection === item ? 'active font-bold text-[#B85230] bg-[#B85230]/5' : ''
                          }`}
                          onClick={() => setActiveSubSection(item)}
                        >
                          • {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="admin-sidebar-footer pt-4 border-t border-[#EADFCE] flex flex-col gap-2 mt-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/60 hover:bg-[#FAF5EE] border border-[#EADFCE] text-xs font-bold text-[#3D2B1A] transition-all"
            >
              <Bell size={13} className="text-[#B85230]" /> Notifications
            </button>
            <button
              onClick={() => setShowMessages(true)}
              className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/60 hover:bg-[#FAF5EE] border border-[#EADFCE] text-xs font-bold text-[#3D2B1A] transition-all"
            >
              <MessageSquare size={13} className="text-[#6A8F6A]" /> Messages
            </button>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#EADFCE]/40 hover:bg-[#B85230]/10 hover:text-[#B85230] text-xs font-bold text-[#3D2B1A] transition-all"
          >
            <LogOut size={13} /> Retour à l'App
          </button>
          <div className="text-[10px] text-center text-[#9B8570] mt-1 font-medium">
            Projet PIE Admin v2.0.0
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <section className="admin-content flex-1 bg-[#F8F0E7]/80 flex flex-col h-screen overflow-y-auto">
        
        {/* TOPBAR */}
        <header className="admin-topbar flex items-center justify-between pb-5 border-b border-[#EADFCE] mb-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-black text-[#17110C] tracking-tight">
              {activeSection === 'dashboard' && 'Tableau de Bord'}
              {activeSection === 'users' && `Gestion des Utilisateurs${activeSubSection ? ` • ${activeSubSection}` : ''}`}
              {activeSection === 'courses' && `Catalogue de Formation${activeSubSection ? ` • ${activeSubSection}` : ''}`}
              {activeSection === 'kits' && `Boutique & Logistique${activeSubSection ? ` • ${activeSubSection}` : ''}`}
              {activeSection === 'marketplace' && `Marché Solidaire${activeSubSection ? ` • ${activeSubSection}` : ''}`}
              {activeSection === 'comms' && `Canaux de Communication${activeSubSection ? ` • ${activeSubSection}` : ''}`}
              {activeSection === 'finance' && `Business & Ratios Financiers${activeSubSection ? ` • ${activeSubSection}` : ''}`}
              {activeSection === 'settings' && 'Paramètres du Système'}
            </h1>
            <p className="text-xs text-[#6B5845] font-semibold flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusText.includes('Erreur') ? 'bg-[#DC2626]' : 'bg-[#6A8F6A] animate-pulse'}`}></span>
              Status : {statusText}
            </p>
          </div>

          <div className="admin-top-actions flex items-center gap-2.5">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 py-2 px-4 bg-white hover:bg-[#FAF5EE] border border-[#EADFCE] rounded-xl text-xs font-bold text-[#3D2B1A] transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              Synchroniser
            </button>
            <button className="flex items-center gap-2 py-2 px-4 bg-[#FAF5EE] hover:bg-white border border-[#B85230]/20 rounded-xl text-xs font-bold text-[#B85230] transition-all shadow-sm">
              <ShieldCheck size={14} />
              Compte : Admin
            </button>
          </div>
        </header>

        {/* Dynamic view content routing */}
        <div className="flex-1 min-h-0">
          
          {/* TOAST NOTIFICATIONS DRAWER */}
          {toasts.length > 0 && (
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-slideRight ${
                    t.type === 'success' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' :
                    t.type === 'error' ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]' :
                    'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
                  }`}
                >
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">{t.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* VIEW: 1. DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="animate-fadeIn flex flex-col gap-6">
              
              {/* KPI CARDS GRID */}
              <div className="admin-kpi-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <article className="admin-kpi-card p-5 bg-white border border-[#EADFCE] rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md">
                  <span className="text-xs font-extrabold text-[#6B5845] uppercase tracking-wider">Abonnés Premium actifs</span>
                  <div className="flex items-baseline gap-2 mt-3">
                    <strong className="text-3xl font-black text-[#17110C]">{summary?.premiumSubscribers ?? 24}</strong>
                    <small className="text-xs font-extrabold text-[#6A8F6A] bg-[#6A8F6A]/10 py-0.5 px-2 rounded-full">+8% ce mois</small>
                  </div>
                  <p className="text-[10px] text-[#9B8570] font-bold mt-2">Adhésion au portail d'enseignement</p>
                </article>

                <article className="admin-kpi-card p-5 bg-white border border-[#EADFCE] rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md">
                  <span className="text-xs font-extrabold text-[#6B5845] uppercase tracking-wider">Kits vendus (Total)</span>
                  <div className="flex items-baseline gap-2 mt-3">
                    <strong className="text-3xl font-black text-[#17110C]">{summary?.kitsSold ?? 86}</strong>
                    <small className="text-xs font-extrabold text-[#6A8F6A] bg-[#6A8F6A]/10 py-0.5 px-2 rounded-full">+12% ce mois</small>
                  </div>
                  <p className="text-[10px] text-[#9B8570] font-bold mt-2">Logistique et fournitures expédiées</p>
                </article>

                <article className="admin-kpi-card p-5 bg-white border border-[#EADFCE] rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md">
                  <span className="text-xs font-extrabold text-[#6B5845] uppercase tracking-wider">Nouvelles Créations (Mois)</span>
                  <div className="flex items-baseline gap-2 mt-3">
                    <strong className="text-3xl font-black text-[#17110C]">{summary?.monthlyCreations ?? 4}</strong>
                    <small className="text-xs font-extrabold text-[#B85230] bg-[#B85230]/10 py-0.5 px-2 rounded-full">
                      {summary?.pendingCreations ?? 2} en attente
                    </small>
                  </div>
                  <p className="text-[10px] text-[#9B8570] font-bold mt-2">Entrées au Souk à auditer</p>
                </article>

                <article className="admin-kpi-card p-5 bg-white border border-[#EADFCE] rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md">
                  <span className="text-xs font-extrabold text-[#6B5845] uppercase tracking-wider">Chiffre d'Affaires Mensuel</span>
                  <div className="flex items-baseline gap-2 mt-3 justify-between w-full">
                    <strong className="text-2xl font-black text-[#17110C]">{summary?.monthlyRevenue ?? 7820} DH</strong>
                    
                    {/* Sparkline line graph inside KPI card */}
                    <svg className="w-16 h-8 flex-shrink-0" viewBox="0 0 60 20">
                      <polyline
                        fill="none"
                        stroke="#B85230"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        points="2,15 15,12 28,14 41,5 58,2"
                      />
                      <polyline
                        fill="none"
                        stroke="#C4A882"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        points="2,18 15,14 28,10 41,12 58,8"
                      />
                    </svg>
                  </div>
                  <p className="text-[10px] text-[#9B8570] font-bold mt-2">Ventes Kits + 5% commissions Souk</p>
                </article>
              </div>

              {/* SECTION HEADER */}
              <div className="admin-section-title flex items-end justify-between mt-2">
                <h2 className="text-lg font-black text-[#3D2B1A] tracking-tight">Content Management Hub</h2>
                <span className="text-xs font-bold text-[#6B4E36]">{products.length - pendingCreationsList.length} créations certifiées et en ligne</span>
              </div>

              {/* CONTENT MANAGEMENT GRID */}
              <div className="admin-main-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. FLUX D'APPROBATION TABLE */}
                <article className="admin-panel lg:col-span-2 p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm">
                  <div className="admin-panel-head flex items-center justify-between pb-3 mb-3 border-b border-[#F5ECE0]">
                    <div>
                      <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">Flux d'Approbation</h3>
                      <p className="text-[11px] text-[#6B5845] font-bold mt-0.5">Dernières créations soumises pour le Marketplace</p>
                    </div>
                    <button
                      onClick={approveAll}
                      disabled={pendingCreationsList.length === 0}
                      className="text-xs font-bold py-1.5 px-3 bg-[#B85230] hover:bg-[#8C3A1E] text-white rounded-lg transition-all disabled:opacity-40"
                    >
                      Tout valider
                    </button>
                  </div>

                  <div className="admin-table-wrap overflow-x-auto">
                    <table className="admin-table w-full min-w-[500px] text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAF5EE] border-b border-[#EADFCE]">
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">ID Artisane</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Image</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Catégorie</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Prix</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Description / Transcription</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.slice(0, 4).map((p) => (
                          <tr key={p.id} className="border-b border-[#FAF5EE] hover:bg-[#FAF5EE]/30 transition-all">
                            <td className="p-3 text-xs font-bold text-[#17110C]">{p.sellerName.split(' ')[0]}</td>
                            <td className="p-3">
                              <img
                                src={p.imageUrl || 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=60'}
                                alt={p.title}
                                className="w-10 h-10 object-cover rounded-lg border border-[#EADFCE]"
                              />
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5EE] text-[#B85230] border border-[#B85230]/10">
                                {p.isCertified ? 'Certifié' : 'À modérer'}
                              </span>
                            </td>
                            <td className="p-3 text-xs font-black text-[#17110C]">{p.price} DH</td>
                            <td className="p-3 max-w-[200px]">
                              <strong className="block text-xs font-bold text-[#3D2B1A] truncate">{p.title}</strong>
                              <small className="block text-[10px] text-[#9B8570] font-semibold truncate mt-0.5">{p.description}</small>
                            </td>
                            <td className="p-3">
                              {!p.isCertified ? (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => approveProduct(p.id)}
                                    title="Approuver la création"
                                    className="p-1.5 bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] rounded-lg transition-all"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => rejectProduct(p.id)}
                                    title="Rejeter et supprimer"
                                    className="p-1.5 bg-[#FCE8E6] hover:bg-[#FAD2CF] text-[#C5221F] rounded-lg transition-all"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-[#6A8F6A] flex items-center gap-1">
                                  <CheckCircle size={12} /> Publié
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                {/* 2. GESTION VOCALE DE MESSAGES */}
                <article className="admin-panel p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm flex flex-col justify-between">
                  <div className="admin-panel-head flex items-center justify-between pb-3 border-b border-[#F5ECE0]">
                    <div>
                      <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">Gestion Vocale</h3>
                      <p className="text-[11px] text-[#6B5845] font-bold mt-0.5">Modération et transcription de mémos vocaux</p>
                    </div>
                  </div>

                  <div className="admin-voice-list flex flex-col gap-2.5 my-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
                    {voiceMessages.map((msg) => {
                      const isPlaying = activeVoiceMsgId === msg.id && isAudioPlaying;
                      return (
                        <div
                          key={msg.id}
                          onClick={() => playVoiceMessage(msg)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                            isPlaying ? 'bg-[#FAF5EE] border-[#B85230]/30 shadow-sm' : 'bg-[#FBF4EC] border-transparent hover:bg-[#FAF5EE]/70'
                          }`}
                        >
                          <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            isPlaying ? 'bg-[#B85230] text-white animate-pulse' : 'bg-[#E7D2BF] text-[#3D2B1A]'
                          }`}>
                            {isPlaying ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <strong className="text-xs font-bold text-[#3D2B1A]">{msg.speaker}</strong>
                              <span className="text-[9px] text-[#9B8570] font-semibold">{msg.date}</span>
                            </div>
                            <p className="text-[10px] text-[#6B5845] italic truncate mt-0.5">"{msg.text}"</p>

                            {/* Render animated audio wave bars if playing */}
                            {isPlaying && (
                              <div className="mt-1.5 flex items-center gap-2">
                                <span className="text-[9px] font-bold text-[#B85230]">Lecture en cours :</span>
                                <div className="audio-wave-container">
                                  <div className="audio-wave-bar"></div>
                                  <div className="audio-wave-bar"></div>
                                  <div className="audio-wave-bar"></div>
                                  <div className="audio-wave-bar"></div>
                                  <div className="audio-wave-bar"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => showToast('Tous les mémos vocaux ont été approuvés.', 'success')}
                    className="w-full py-2 bg-[#F3E5D5] hover:bg-[#FAF5EE] text-[#3D2B1A] text-xs font-black rounded-xl border border-[#EADFCE] transition-all"
                  >
                    Marquer tout comme écouté
                  </button>
                </article>
              </div>

              {/* BOTTOM METRICS & STOCK GRID */}
              <div className="admin-bottom-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. BUSINESS INSIGHTS CHART */}
                <article className="admin-panel p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm relative">
                  <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">Business Insights</h3>
                  <p className="text-[11px] text-[#6B5845] font-bold mt-0.5">Ventes de Kits (orange) vs Commissions Marketplace (doré)</p>
                  
                  {/* SVG Chart with interactive tooltip */}
                  <svg
                    className="w-full h-36 mt-4 cursor-crosshair overflow-visible"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={() => setHoveredChartPoint(null)}
                  >
                    {/* Y-axis lines */}
                    {[0, 1, 2, 3].map((idx) => (
                      <line
                        key={idx}
                        x1="20"
                        x2={chartWidth - 10}
                        y1={20 + idx * 35}
                        y2={20 + idx * 35}
                        stroke="#EADFCE"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    ))}

                    {/* Chart Gradient Shading Area */}
                    <path
                      d={`M30,${chartHeight - 20} L${getPolylinePath('valKits')} L${chartWidth - 30},${chartHeight - 20} Z`}
                      fill="rgba(184,82,48,0.06)"
                    />

                    {/* Kits Sales line */}
                    <polyline
                      points={getPolylinePath('valKits')}
                      fill="none"
                      stroke="#B85230"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Commission line */}
                    <polyline
                      points={getPolylinePath('valComm')}
                      fill="none"
                      stroke="#C4A882"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* X-axis labels */}
                    {chartPoints.map((pt, i) => (
                      <text
                        key={i}
                        x={pt.x}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        fill="#9B8570"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        {pt.month}
                      </text>
                    ))}

                    {/* Tooltip visualization */}
                    {hoveredChartPoint && (
                      <g>
                        {/* Hover vertical line */}
                        <line
                          x1={hoveredChartPoint.x}
                          x2={hoveredChartPoint.x}
                          y1="10"
                          y2={chartHeight - 20}
                          stroke="#B85230"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        {/* Hover point circle */}
                        <circle
                          cx={hoveredChartPoint.x}
                          cy={hoveredChartPoint.y}
                          r="5"
                          fill="#B85230"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      </g>
                    )}
                  </svg>

                  {/* Render HTML Floating Tooltip Box */}
                  {hoveredChartPoint && (
                    <div
                      className="absolute p-2.5 bg-[#3D2B1A] text-white rounded-lg shadow-xl text-[10px] pointer-events-none flex flex-col gap-0.5 z-10 transition-all border border-[#EADFCE]/10"
                      style={{
                        left: `${(hoveredChartPoint.x / chartWidth) * 90}%`,
                        top: `${(hoveredChartPoint.y / chartHeight) * 70}%`
                      }}
                    >
                      <span className="font-extrabold text-[#C4A882] uppercase">{hoveredChartPoint.month} 2026</span>
                      <span className="font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#B85230]"></span> Kits: {hoveredChartPoint.valKits} DH</span>
                      <span className="font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#C4A882]"></span> Comm.: {hoveredChartPoint.valComm} DH</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[9px] text-[#9B8570] font-black mt-2 uppercase tracking-wide border-t border-[#FAF5EE] pt-2">
                    <span>Axe Y : Revenus en DH</span>
                    <span>5 derniers mois</span>
                  </div>
                </article>

                {/* 2. ALERTES DE STOCK */}
                <article className="admin-panel p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">Alertes de Stock</h3>
                    <p className="text-[11px] text-[#6B5845] font-bold mt-0.5">Suivi de l'inventaire des kits artisanaux</p>
                  </div>

                  <div className="admin-stock-list flex flex-col gap-2 my-3">
                    {summary?.stock.map((item) => {
                      const isLow = item.stock <= item.reorderAt;
                      return (
                        <div
                          key={item.kitId}
                          className={`p-3 rounded-xl flex items-center justify-between border ${
                            isLow ? 'bg-[#FFF2DF] border-[#F4C77B]' : 'bg-[#FBF4EC] border-transparent'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#9B8570] flex items-center gap-1">
                              {isLow ? <AlertTriangle size={10} className="text-[#B85230]" /> : null}
                              {isLow ? 'Stock critique' : 'Stock optimal'}
                            </span>
                            <strong className="block text-xs font-bold text-[#3D2B1A] truncate mt-0.5">{item.title}</strong>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${isLow ? 'bg-[#B85230]/10 text-[#B85230]' : 'bg-[#6A8F6A]/10 text-[#6A8F6A]'}`}>
                              {item.stock} unités
                            </span>
                            <button
                              onClick={() => setSelectedRestockKit({ id: item.kitId, title: item.title, currentStock: item.stock })}
                              className="text-[10px] font-bold underline text-[#B85230] hover:text-[#8C3A1E]"
                            >
                              Réappro.
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[10px] font-bold text-center text-[#9B8570]">
                    Seuil de réapprovisionnement automatique : 8 unités
                  </div>
                </article>

                {/* 3. MAALMA PERFORMANCE LEADERBOARD */}
                <article className="admin-panel p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm">
                  <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">Performance des Maâlmates</h3>
                  <p className="text-[11px] text-[#6B5845] font-bold mt-0.5">Leaderboard des formatrices actives</p>

                  <div className="admin-table-wrap overflow-x-auto mt-3">
                    <table className="admin-table w-full text-left border-collapse compact">
                      <thead>
                        <tr className="bg-[#FAF5EE] border-b border-[#EADFCE]">
                          <th className="p-2 text-[10px] font-black text-[#3D2B1A] uppercase">Nom</th>
                          <th className="p-2 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Cours</th>
                          <th className="p-2 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Kits Ventes</th>
                          <th className="p-2 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(artisanes.length > 0 ? artisanes : DEFAULT_ARTISANES).slice(0, 4).map((row) => (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedMaalma(row)}
                            className="border-b border-[#FAF5EE] hover:bg-[#FAF5EE] transition-all cursor-pointer"
                          >
                            <td className="p-2 text-xs font-bold text-[#17110C] flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#FAF5EE] border border-[#B85230]/20 flex items-center justify-center text-[8px]">👑</span>
                              {row.name}
                            </td>
                            <td className="p-2 text-xs font-medium text-[#3D2B1A] text-center">{row.coursesCount}</td>
                            <td className="p-2 text-xs font-medium text-[#3D2B1A] text-center">{row.kitsSold}</td>
                            <td className="p-2 text-xs font-black text-[#B85230] text-center">{row.rating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] font-medium text-[#9B8570] text-center mt-2.5">
                    💡 Cliquer sur une ligne pour voir le profil détaillé de la Maâlma.
                  </p>
                </article>
              </div>

            </div>
          )}

          {/* VIEW: 2. UTILISATEURS */}
          {activeSection === 'users' && (
            <div className="animate-fadeIn p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F5ECE0]">
                <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">
                  {activeSubSection === 'Clients' ? 'Registre des Clients du Souk' : 'Roster des Artisanes & Maâlmates'}
                </h3>
                
                {/* Search Bar */}
                <div className="relative w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#9B8570]">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou région..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-[#FBF4EC] text-[#3D2B1A] placeholder-[#9B8570] text-xs font-bold rounded-xl border border-transparent focus:border-[#B85230] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              {activeSubSection === 'Clients' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF5EE] border-b border-[#EADFCE]">
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Client</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Téléphone</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Localisation</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Commandes</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-right">Montant Total</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(clients.length > 0 ? clients : DEFAULT_CLIENTS).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((c) => (
                        <tr key={c.id} className="border-b border-[#FAF5EE] hover:bg-[#FAF5EE]/30 transition-all">
                          <td className="p-3 text-xs font-bold text-[#17110C] flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#E7D2BF] flex items-center justify-center text-xs">👤</div>
                            {c.name}
                          </td>
                          <td className="p-3 text-xs font-medium text-[#3D2B1A]">{c.phone}</td>
                          <td className="p-3 text-xs font-medium text-[#6B5845]">{c.region}</td>
                          <td className="p-3 text-xs font-medium text-[#3D2B1A] text-center">{c.ordersCount}</td>
                          <td className="p-3 text-xs font-black text-[#B85230] text-right">{c.totalSpent} DH</td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full ${c.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {c.active ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF5EE] border-b border-[#EADFCE]">
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Artisane</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Région</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Métier</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Niveau</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-right">Gains Total</th>
                        <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Compte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredArtisanes.map((art) => (
                        <tr key={art.id} className="border-b border-[#FAF5EE] hover:bg-[#FAF5EE]/30 transition-all">
                          <td className="p-3 text-xs font-bold text-[#17110C] flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#FAF5EE] border border-[#B85230]/20 flex items-center justify-center text-xs">👵</div>
                            {art.name}
                          </td>
                          <td className="p-3 text-xs font-medium text-[#6B5845]">{art.region}</td>
                          <td className="p-3 text-xs font-medium text-[#3D2B1A]">{art.specialty}</td>
                          <td className="p-3 text-xs font-bold text-[#B85230] text-center">{art.level}</td>
                          <td className="p-3 text-xs font-black text-[#6A8F6A] text-right">{art.earnings} DH</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => showToast(`Le compte de ${art.name} a été ${art.active ? 'suspendu' : 'activé'}.`, 'info')}
                              className={`text-[10px] font-bold py-1 px-3.5 rounded-full transition-all border ${
                                art.active ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]' : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B91C1C]'
                              }`}
                            >
                              {art.active ? 'Actif' : 'Suspendu'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: 3. CATALOGUE DE COURS */}
          {activeSection === 'courses' && (
            <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 1. COURSES GRID LIST */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <article className="p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm">
                  <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide mb-4">Cours actuellement en ligne</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courses.map((course) => (
                      <div key={course.id} className="p-4 rounded-xl border border-[#FAF5EE] bg-[#FBF4EC]/30 flex flex-col justify-between min-h-[140px]">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold py-0.5 px-2 bg-[#B85230]/10 text-[#B85230] rounded-full uppercase">
                              {course.metier}
                            </span>
                            <span className="text-[10px] font-bold text-[#9B8570]">
                              ⏱️ {course.duration}
                            </span>
                          </div>
                          <strong className="block text-sm font-bold text-[#3D2B1A] mt-2">{course.title.fr}</strong>
                          <p className="text-xs text-[#6B5845] mt-1 font-semibold leading-relaxed line-clamp-2">
                            {course.description.fr}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#FAF5EE] text-[11px] font-bold text-[#3D2B1A]">
                          <span>Difficulté : <span className="text-[#B85230]">{course.difficulty}</span></span>
                          {course.exercise && (
                            <span className="text-[#6A8F6A] font-extrabold">🏆 {course.exercise.earnPrice} DH</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              {/* 2. CREER COURS FORM */}
              {activeSubSection === 'Créer Cours' && (
                <article className="p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">Créer un nouveau cours</h3>
                    <p className="text-[11px] text-[#6B5845] font-bold mt-0.5">Ajouter une formation interactive et vocale</p>
                  </div>

                  <form onSubmit={handleCreateCourse} className="flex flex-col gap-3 my-4">
                    <div>
                      <label className="block text-[10px] font-black text-[#3D2B1A] uppercase mb-1">Titre (Français)</label>
                      <input
                        type="text"
                        value={newCourse.titleFr}
                        onChange={(e) => setNewCourse({ ...newCourse, titleFr: e.target.value })}
                        placeholder="Ex : Nœud coulant de base"
                        className="pie-input w-full p-2 text-xs border rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-[#3D2B1A] uppercase mb-1">Titre (Arabe)</label>
                      <input
                        type="text"
                        value={newCourse.titleAr}
                        onChange={(e) => setNewCourse({ ...newCourse, titleAr: e.target.value })}
                        placeholder="Ex : عقدة البداية"
                        className="pie-input w-full p-2 text-xs border rounded-lg focus:outline-none text-right"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black text-[#3D2B1A] uppercase mb-1">Métier</label>
                        <select
                          value={newCourse.metier}
                          onChange={(e) => setNewCourse({ ...newCourse, metier: e.target.value })}
                          className="pie-input w-full p-2 text-xs border rounded-lg focus:outline-none bg-white"
                        >
                          <option value="crochet">Crochet</option>
                          <option value="broderie">Broderie</option>
                          <option value="tissage">Tissage</option>
                          <option value="poterie">Poterie</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#3D2B1A] uppercase mb-1">Difficulté</label>
                        <select
                          value={newCourse.difficulty}
                          onChange={(e) => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                          className="pie-input w-full p-2 text-xs border rounded-lg focus:outline-none bg-white"
                        >
                          <option value="facile">Facile</option>
                          <option value="moyen">Moyen</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-black text-[#3D2B1A] uppercase mb-1">Durée vidéo</label>
                        <input
                          type="text"
                          value={newCourse.duration}
                          onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                          placeholder="Ex : 4 min"
                          className="pie-input w-full p-2 text-xs border rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#3D2B1A] uppercase mb-1">Gain validation (DH)</label>
                        <input
                          type="number"
                          value={newCourse.earnPrice}
                          onChange={(e) => setNewCourse({ ...newCourse, earnPrice: Number(e.target.value) })}
                          placeholder="Ex : 150"
                          className="pie-input w-full p-2 text-xs border rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#3D2B1A] uppercase mb-1">Description</label>
                      <textarea
                        value={newCourse.descFr}
                        onChange={(e) => setNewCourse({ ...newCourse, descFr: e.target.value })}
                        placeholder="Description du point de couture..."
                        rows={3}
                        className="pie-input w-full p-2 text-xs border rounded-lg focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 mt-2 bg-[#B85230] hover:bg-[#8C3A1E] text-white text-xs font-black rounded-xl border border-transparent shadow transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> Publier le Cours
                    </button>
                  </form>
                </article>
              )}
            </div>
          )}

          {/* VIEW: 4. BOUTIQUE DE KITS */}
          {activeSection === 'kits' && (
            <div className="animate-fadeIn p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm">
              
              {activeSubSection === 'Expéditions' ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">Suivi logistique des Expéditions</h3>
                    <span className="text-xs font-bold text-[#6B5845] bg-[#FAF5EE] px-3 py-1 rounded-full border">{orders.length} commandes réelles</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#FAF5EE] border-b border-[#EADFCE]">
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">ID</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Client / Tel</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Notes</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Date</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Statut</th>
                          <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-xs text-[#9B8570] font-bold">Aucune commande reçue pour le moment.</td></tr>
                        )}
                        {orders.map((o: any) => (
                          <tr key={o.id} className="border-b border-[#FAF5EE] hover:bg-[#FAF5EE]/30 transition-all">
                            <td className="p-3 text-xs font-black text-[#17110C] max-w-[80px] truncate">{o.id}</td>
                            <td className="p-3">
                              <strong className="block text-xs font-bold text-[#3D2B1A]">{o.phone}</strong>
                            </td>
                            <td className="p-3 text-xs text-[#6B5845] max-w-[160px] truncate">{o.customer_notes || o.customerNotes}</td>
                            <td className="p-3 text-xs font-medium text-[#6B5845] text-center">
                              {o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] font-bold py-1 px-3 rounded-full border ${
                                o.status === 'confirmed' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]' :
                                o.status === 'cancelled' ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B91C1C]' :
                                'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
                              }`}>
                                {o.status === 'confirmed' ? '✅ Confirmé' : o.status === 'cancelled' ? '❌ Annulé' : '⏳ En attente'}
                              </span>
                            </td>
                            <td className="p-3">
                              {o.status === 'pending' && (
                                <div className="flex gap-1.5 justify-center">
                                  <button
                                    onClick={() => updateOrderStatus(o.id, 'confirmed')}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg transition-all shadow-sm"
                                  >
                                    ✓ Valider
                                  </button>
                                  <button
                                    onClick={() => updateOrderStatus(o.id, 'cancelled')}
                                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black rounded-lg transition-all shadow-sm"
                                  >
                                    ✕ Annuler
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeSubSection === 'Gestion Stock' ? (
                <div>
                  <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide mb-4">Gestion du Stock par Kit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kits.map((kit: any) => {
                      const stockInfo = summary?.stock.find(s => s.kitId === kit.id);
                      const currentStock = stockInfo?.stock ?? kit.stock ?? 0;
                      const isLow = currentStock <= (stockInfo?.reorderAt ?? 8);
                      return (
                        <div key={kit.id} className={`border-2 rounded-2xl overflow-hidden flex flex-col shadow-sm bg-white ${isLow ? 'border-amber-300' : 'border-[#EADFCE]'}`}>
                          <div className="relative">
                            <img src={kit.imageUrl} alt={kit.title.fr} className="w-full h-36 object-cover" />
                            <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-black ${isLow ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'}`}>
                              {isLow ? '⚠️ Stock bas' : '✓ En stock'}
                            </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <strong className="block text-sm font-bold text-[#3D2B1A]">{kit.title.fr}</strong>
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-[#9B8570] uppercase">Il reste en stock</span>
                                <span className={`text-sm font-black ${isLow ? 'text-amber-600' : 'text-emerald-600'}`}>{currentStock} unités</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${isLow ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, (currentStock / 25) * 100)}%` }}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedRestockKit({ id: kit.id, title: kit.title.fr, currentStock })}
                              className="mt-3 w-full py-2 bg-[#FAF5EE] hover:bg-[#F3E5D5] text-[#3D2B1A] text-xs font-black rounded-xl border border-[#EADFCE] transition-all"
                            >
                              + Réapprovisionner
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide mb-4">Inventaire et Prix des Kits en Boutique</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kits.map((kit: any) => (
                      <div key={kit.id} className="border rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm bg-white hover:shadow-md transition-all">
                        <img src={kit.imageUrl} alt={kit.title.fr} className="w-full h-40 object-cover" />
                        <div className="p-4">
                          <strong className="block text-sm font-bold text-[#3D2B1A]">{kit.title.fr}</strong>
                          <p className="text-xs text-[#6B5845] mt-1.5 leading-relaxed font-semibold line-clamp-2">{kit.description.fr}</p>
                          
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#FAF5EE]">
                            {editingPriceKitId === kit.id ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input
                                  type="number"
                                  value={editingPriceValue}
                                  onChange={e => setEditingPriceValue(e.target.value)}
                                  className="w-20 px-2 py-1 text-xs font-bold border-2 border-[#B85230] rounded-lg outline-none"
                                  autoFocus
                                />
                                <span className="text-xs font-bold text-[#9B8570]">DH</span>
                                <button onClick={() => updateKitPrice(kit.id, Number(editingPriceValue))} className="p-1 bg-emerald-500 text-white rounded-lg">
                                  <Check size={12} />
                                </button>
                                <button onClick={() => setEditingPriceKitId(null)} className="p-1 bg-gray-200 rounded-lg">
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-black text-[#B85230]">{kit.price} DH</span>
                            )}
                            {editingPriceKitId !== kit.id && (
                              <button
                                onClick={() => { setEditingPriceKitId(kit.id); setEditingPriceValue(String(kit.price)); }}
                                className="text-xs font-bold text-[#6B4E36] hover:text-[#3D2B1A] flex items-center gap-1.5 py-1 px-2.5 rounded bg-[#FAF5EE] hover:bg-[#F3E5D5] transition-all"
                              >
                                Modifier prix
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: 5. MARKETPLACE SOLIDAIRE */}
          {activeSection === 'marketplace' && (
            <div className="animate-fadeIn p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide flex items-center gap-2">
                  <Volume2 size={16} className="text-[#B85230]" /> Modération Souk
                </h3>
                <div className="flex gap-3">
                  <div className="p-3 bg-[#FAF5EE] border border-[#EADFCE] rounded-xl text-center">
                    <span className="text-[9px] font-black uppercase text-[#9B8570]">Créations</span>
                    <strong className="block text-lg font-black text-[#17110C]">{products.length}</strong>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <span className="text-[9px] font-black uppercase text-amber-600">En attente</span>
                    <strong className="block text-lg font-black text-amber-700">{pendingCreationsList.length}</strong>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF5EE] border-b border-[#EADFCE]">
                      <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Image</th>
                      <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Création</th>
                      <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase">Vendeuse</th>
                      <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-right">Prix</th>
                      <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Likes</th>
                      <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Statut</th>
                      <th className="p-3 text-[10px] font-black text-[#3D2B1A] uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-[#FAF5EE] hover:bg-[#FAF5EE]/30 transition-all">
                        <td className="p-3">
                          <img src={p.imageUrl} alt={p.title} className="w-12 h-12 object-cover rounded-lg border" />
                        </td>
                        <td className="p-3">
                          <strong className="block text-xs font-bold text-[#3D2B1A]">{p.title}</strong>
                          <small className="block text-[10px] text-[#9B8570] font-semibold leading-relaxed mt-0.5 truncate max-w-xs">{p.description}</small>
                        </td>
                        <td className="p-3 text-xs font-bold text-[#3D2B1A]">{p.sellerName}</td>
                        <td className="p-3 text-xs font-black text-[#B85230] text-right">{p.price} DH</td>
                        <td className="p-3 text-xs font-bold text-[#3D2B1A] text-center">❤️ {p.likes ?? 0}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${
                            p.isCertified ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]' : 'bg-[#FFF2DF] border-[#F4C77B] text-[#D97706]'
                          }`}>
                            {p.isCertified ? '✓ En Vente' : '⏳ En attente'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {!p.isCertified ? (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => approveProduct(p.id)}
                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg transition-all"
                              >
                                ✓ Valider
                              </button>
                              <button
                                onClick={() => rejectProduct(p.id)}
                                className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black rounded-lg transition-all"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#6A8F6A] font-bold">Publié</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: 6. ENTRAIDE & COMMS */}
          {activeSection === 'comms' && (
            <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Live Chat Premium – Admin ↔ Maâlma */}
              <div className="lg:col-span-2 bg-white border border-[#EADFCE] rounded-2xl shadow-sm flex flex-col h-[560px] overflow-hidden">
                <div className="p-4 border-b border-[#FAF5EE] bg-gradient-to-r from-[#FAF5EE] to-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-xs">🧕</span>
                  </div>
                  <div>
                    <strong className="text-sm font-black text-[#3D2B1A]">Canal Artisane ↔ Admin</strong>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-bold text-emerald-600">En ligne – Messages en temps réel</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setChatMessages([]); localStorage.removeItem('projet_pie_chat_messages'); }}
                    className="ml-auto text-[10px] text-[#9B8570] hover:text-rose-500 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-all"
                  >
                    Effacer
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#FDFAF7]">
                  {chatMessages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-xs text-[#9B8570] font-bold italic text-center">
                        Aucun message.<br/>Ouvrez l'Espace Maâlma dans un autre onglet pour communiquer en direct.
                        <br/><a href="/?maalma=true" target="_blank" className="text-[#B85230] underline mt-2 block">→ Ouvrir l'Espace Maâlma</a>
                      </p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] px-4 py-3 rounded-2xl shadow-sm text-xs leading-relaxed ${
                        msg.sender === 'admin'
                          ? 'bg-[#B85230] text-white rounded-tr-sm'
                          : 'bg-white text-[#3D2B1A] border border-[#EADFCE] rounded-tl-sm'
                      }`}>
                        <span className={`block text-[9px] font-black uppercase mb-1 ${msg.sender === 'admin' ? 'text-[#FAF5EE]/70' : 'text-[#B85230]'}`}>
                          {msg.sender === 'admin' ? '👤 Admin PIE' : '🧕 Maâlma'}
                        </span>
                        <p className="font-semibold">{msg.text}</p>
                        <span className={`block text-right text-[9px] mt-1 font-bold ${msg.sender === 'admin' ? 'text-[#FAF5EE]/50' : 'text-[#9B8570]'}`}>{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChatMessage} className="p-4 bg-white border-t border-[#FAF5EE] flex gap-2">
                  <input
                    type="text"
                    placeholder="Répondre à la Maâlma..."
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#FBF4EC] text-xs font-bold rounded-xl border border-transparent focus:border-[#B85230] focus:bg-white outline-none transition-all"
                  />
                  <button type="submit" className="px-4 py-3 bg-[#B85230] hover:bg-[#8C3A1E] text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1.5">
                    <Send size={14} /> Envoyer
                  </button>
                </form>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-col gap-4">
                <article className="p-5 bg-gradient-to-br from-[#17110C] to-[#3D2B1A] rounded-2xl shadow-xl text-white">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#C4A882] mb-4">Activité Chat</h3>
                  <div className="text-3xl font-black mb-1">{chatMessages.length}</div>
                  <p className="text-xs text-white/60 font-bold">messages échangés</p>
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs font-bold">
                    <span className="text-[#6A8F6A]">{chatMessages.filter(m => m.sender === 'maalma').length}</span> de Maâlma &nbsp;•&nbsp;
                    <span className="text-[#C4A882]">{chatMessages.filter(m => m.sender === 'admin').length}</span> de l'Admin
                  </div>
                </article>
                <article className="p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm">
                  <h3 className="text-xs font-black text-[#3D2B1A] uppercase tracking-wide mb-3">Accès rapide</h3>
                  <a
                    href="/?maalma=true"
                    target="_blank"
                    className="block w-full py-3 bg-[#FAF5EE] hover:bg-[#F3E5D5] text-[#3D2B1A] text-xs font-black rounded-xl border border-[#EADFCE] transition-all text-center"
                  >
                    🧕 Ouvrir Studio Maâlma
                  </a>
                  <p className="text-[10px] text-[#9B8570] font-bold text-center mt-2">Mot de passe : <code className="bg-[#FAF5EE] px-1 rounded">maalma</code></p>
                </article>
              </div>
            </div>
          )}

          {/* VIEW: 7. FINANCE */}
          {activeSection === 'finance' && (
            <div className="animate-fadeIn p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm">
              <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide mb-4">Commissions et Flux Financiers</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-5 bg-[#FAF5EE] border border-[#EADFCE] rounded-xl">
                  <span className="text-[10px] font-black uppercase text-[#9B8570]">Chiffre d'Affaires</span>
                  <strong className="block text-2xl font-black text-[#17110C] mt-1">12 400 DH</strong>
                </div>
                <div className="p-5 bg-[#FAF5EE] border border-[#EADFCE] rounded-xl">
                  <span className="text-[10px] font-black uppercase text-[#9B8570]">Caisse Coopérative (Commissions)</span>
                  <strong className="block text-2xl font-black text-[#B85230] mt-1">620 DH</strong>
                </div>
                <div className="p-5 bg-[#FAF5EE] border border-[#EADFCE] rounded-xl">
                  <span className="text-[10px] font-black uppercase text-[#9B8570]">Rémunérations Artisanes reversées</span>
                  <strong className="block text-2xl font-black text-[#6A8F6A] mt-1">11 780 DH</strong>
                </div>
              </div>

              <div>
                <strong className="text-xs font-black text-[#3D2B1A] uppercase tracking-wider block mb-3">Souscriptions Premium Actives</strong>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#FBF4EC] rounded-xl flex items-center justify-between border">
                    <div>
                      <strong className="text-xs font-bold text-[#3D2B1A]">Maâlma Fatima</strong>
                      <span className="block text-[9px] text-[#9B8570] font-bold">Premium - Renouvellement le 23.06.2026</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#6A8F6A] bg-[#6A8F6A]/10 px-2 py-0.5 rounded">Actif</span>
                  </div>
                  <div className="p-3 bg-[#FBF4EC] rounded-xl flex items-center justify-between border">
                    <div>
                      <strong className="text-xs font-bold text-[#3D2B1A]">Maâlma Zahra</strong>
                      <span className="block text-[9px] text-[#9B8570] font-bold">Premium - Renouvellement le 20.06.2026</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#6A8F6A] bg-[#6A8F6A]/10 px-2 py-0.5 rounded">Actif</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: 8. SETTINGS */}
          {activeSection === 'settings' && (
            <div className="animate-fadeIn p-5 bg-white border border-[#EADFCE] rounded-2xl shadow-sm max-w-2xl">
              <h3 className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide mb-4">Configuration du Système</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-3 bg-[#FAF5EE] rounded-xl">
                  <div>
                    <strong className="text-xs font-bold text-[#3D2B1A] block">Langues de l'interface</strong>
                    <span className="text-[10px] text-[#9B8570] font-bold">Darija (Maroc), Tamazight, Français, Anglais</span>
                  </div>
                  <span className="text-xs font-black text-[#B85230]">4 Actives</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#FAF5EE] rounded-xl">
                  <div>
                    <strong className="text-xs font-bold text-[#3D2B1A] block">Moteur de Reconnaissance Vocale (IA)</strong>
                    <span className="text-[10px] text-[#9B8570] font-bold">Intégration API Google Gemini-3.5-Flash</span>
                  </div>
                  <span className="text-xs font-black text-[#6A8F6A] bg-[#6A8F6A]/10 px-2 py-0.5 rounded">Connecté</span>
                </div>

                <div className="border-t border-[#FAF5EE] pt-4 mt-2">
                  <button
                    onClick={() => {
                      if (window.confirm("Voulez-vous réinitialiser le fichier db.json local à son état d'origine ?")) {
                        showToast("Base de données réinitialisée. Rechargez la page.", 'info');
                      }
                    }}
                    className="px-4 py-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5] text-xs font-black rounded-xl transition-all"
                  >
                    Réinitialiser la base db.json
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </section>

      {/* ── MODALS & DETAILS OVERLAYS ───────────────────────────────── */}

      {/* 1. RESTOCK QUANTITY DIALOG MODAL */}
      {selectedRestockKit && (
        <div className="fixed inset-0 bg-[#3D2B1A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#EADFCE] w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-fadeUp flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between border-b border-[#FAF5EE] pb-2 mb-3">
                <strong className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">Réapprovisionner le Kit</strong>
                <button onClick={() => setSelectedRestockKit(null)} className="p-1 hover:bg-[#FAF5EE] rounded-lg">
                  <X size={15} />
                </button>
              </div>
              <p className="text-xs font-bold text-[#6B5845] mb-4">
                Entrez la quantité à commander pour : <strong className="text-[#3D2B1A]">{selectedRestockKit.title}</strong>
              </p>

              <div>
                <label className="block text-[9px] font-black text-[#9B8570] uppercase mb-1">Quantité (unités)</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                  className="pie-input w-full p-2 text-xs border rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 mt-2">
              <button
                onClick={() => setSelectedRestockKit(null)}
                className="flex-1 py-2 bg-[#F3E5D5] hover:bg-[#FAF5EE] text-[#3D2B1A] text-xs font-bold rounded-lg border transition-all"
              >
                Annuler
              </button>
              <button
                onClick={executeRestock}
                className="flex-1 py-2 bg-[#B85230] hover:bg-[#8C3A1E] text-white text-xs font-bold rounded-lg transition-all"
              >
                Commander (+{restockQty})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAALMA PROFILE DETAILS MODAL */}
      {selectedMaalma && (
        <div className="fixed inset-0 bg-[#3D2B1A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#EADFCE] w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fadeUp flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-[#FAF5EE] pb-2 mb-4">
                <strong className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide">Fiche de la Maâlma</strong>
                <button onClick={() => setSelectedMaalma(null)} className="p-1 hover:bg-[#FAF5EE] rounded-lg">
                  <X size={15} />
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-[#FBF4EC] border-2 border-[#B85230]/20 flex items-center justify-center text-3xl">
                  👵
                </div>
                <div>
                  <h4 className="text-base font-black text-[#17110C]">{selectedMaalma.name}</h4>
                  <span className="text-xs font-bold text-[#B85230]">{selectedMaalma.level}</span>
                  <p className="text-[10px] text-[#9B8570] font-bold mt-1">Région : {selectedMaalma.region} • Spécialité : {selectedMaalma.specialty}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mt-5 p-3.5 bg-[#FAF5EE] rounded-xl border">
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-[#9B8570]">Cours créés</span>
                  <strong className="block text-sm font-black text-[#3D2B1A] mt-1">{selectedMaalma.coursesCount}</strong>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-[#9B8570]">Kits associés</span>
                  <strong className="block text-sm font-black text-[#3D2B1A] mt-1">{selectedMaalma.kitsSold}</strong>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black uppercase text-[#9B8570]">Gains générés</span>
                  <strong className="block text-sm font-black text-[#6A8F6A] mt-1">{selectedMaalma.earnings} DH</strong>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-5">
              <button
                onClick={() => {
                  setSelectedMaalma(null);
                  setActiveSection('comms');
                  setActiveSubSection('Support Live');
                  setChatMessages((prev) => [
                    ...prev,
                    { sender: 'maalma', text: `Salam, ici ${selectedMaalma.name}. Comment allez-vous ?`, time: "À l'instant" }
                  ]);
                }}
                className="flex-1 py-2 bg-[#B85230] hover:bg-[#8C3A1E] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare size={13} /> Contacter
              </button>
              <button
                onClick={() => {
                  showToast(`Compte de ${selectedMaalma.name} modéré.`, 'info');
                  setSelectedMaalma(null);
                }}
                className="flex-1 py-2 bg-[#F3E5D5] hover:bg-[#FAF5EE] text-[#3D2B1A] text-xs font-bold rounded-lg border transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. NOTIFICATIONS POPUP DRAWER */}
      {showNotifications && (
        <div className="fixed inset-0 bg-[#3D2B1A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#EADFCE] w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-fadeUp flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-[#FAF5EE] pb-2 mb-3">
                <strong className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide flex items-center gap-1.5">
                  <Bell size={15} className="text-[#B85230]" /> Centre de Notifications
                </strong>
                <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-[#FAF5EE] rounded-lg">
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                <div className="p-3 bg-[#FAF5EE] rounded-xl text-xs font-semibold leading-relaxed border-l-3 border-[#B85230]">
                  <span className="text-[10px] text-[#9B8570] block font-bold mb-0.5">Il y a 10 min</span>
                  Zahra Aït Melloul a soumis une création "Écharpe d'Atlas" pour validation.
                </div>
                <div className="p-3 bg-[#FAF5EE] rounded-xl text-xs font-semibold leading-relaxed border-l-3 border-[#6A8F6A]">
                  <span className="text-[10px] text-[#9B8570] block font-bold mb-0.5">Il y a 1 heure</span>
                  Rupture de Stock : Le stock pour "Kit Atlas Royal" est inférieur à 8 unités.
                </div>
                <div className="p-3 bg-[#FAF5EE] rounded-xl text-xs font-semibold leading-relaxed border-l-3 border-[#C4A882]">
                  <span className="text-[10px] text-[#9B8570] block font-bold mb-0.5">Hier, 16:30</span>
                  Nouveau cours "Art de l'Argile" créé avec succès.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowNotifications(false)}
              className="w-full py-2 mt-4 bg-[#F3E5D5] hover:bg-[#FAF5EE] text-[#3D2B1A] text-xs font-bold rounded-lg border transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* 4. CHAT MESSAGES POPUP DRAWER */}
      {showMessages && (
        <div className="fixed inset-0 bg-[#3D2B1A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#EADFCE] w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-fadeUp flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-[#FAF5EE] pb-2 mb-3">
                <strong className="text-sm font-black text-[#3D2B1A] uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare size={15} className="text-[#6A8F6A]" /> Boîte de Réception
                </strong>
                <button onClick={() => setShowMessages(false)} className="p-1 hover:bg-[#FAF5EE] rounded-lg">
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                <div
                  onClick={() => { setShowMessages(false); setActiveSection('comms'); setActiveSubSection('Support Live'); }}
                  className="p-3 bg-[#FAF5EE] rounded-xl text-xs font-semibold leading-relaxed border hover:bg-[#FAF5EE]/60 cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-1">
                    <strong className="text-xs text-[#3D2B1A]">Zahra Aït Melloul</strong>
                    <span className="text-[9px] text-[#B85230] font-bold">Nouveau</span>
                  </div>
                  "Salam, j'ai fini de broder le coussin Fès. Pouvez-vous vérifier..."
                </div>
                <div className="p-3 bg-[#FAF5EE]/50 rounded-xl text-xs font-semibold leading-relaxed border opacity-70">
                  <div className="flex justify-between items-center mb-1">
                    <strong className="text-xs text-[#3D2B1A]">Fatima Chefchaouen</strong>
                    <span className="text-[9px] text-[#9B8570] font-bold">Hier</span>
                  </div>
                  "Merci beaucoup pour le kit reçu ce matin à Chefchaouen..."
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMessages(false)}
              className="w-full py-2 mt-4 bg-[#F3E5D5] hover:bg-[#FAF5EE] text-[#3D2B1A] text-xs font-bold rounded-lg border transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
