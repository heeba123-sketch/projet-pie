/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AppLanguage, CartItem, Product } from './types';
import { LanguageSelector } from './components/LanguageSelector';
import { LearnCenter } from './components/LearnCenter';
import { KitCenter } from './components/KitCenter';
import { MarketplaceCenter } from './components/MarketplaceCenter';
import { CommunityCenter } from './components/CommunityCenter';
import { VoiceGuide } from './components/VoiceGuide';
import { AuthCenter } from './components/AuthCenter';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  tryInitializeFirebase, 
  getPersistedMockUser,
  savePersistedMockUser,
  updateUserProfile,
  PIEUser,
  fetchKits,
  fetchProducts,
  addUserProduct,
  submitClientOrder
} from './lib/firebase';
import { speakPhrase, speakText } from './utils/speech';
import {
  Cloud, CloudOff, RefreshCw, Upload,
  Volume2, Home, Package, ShoppingBag,
  Users, User as UserIcon, ShieldCheck
} from 'lucide-react';

// ── Admin route detection ───────────────────────────────────────────────────
const isAdminRoute = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('admin') === 'true' || window.location.hash === '#admin' || window.location.pathname === '/admin';
};

export default function App() {
  // Render Admin Dashboard if ?admin=true or #admin
  if (isAdminRoute()) {
    return <AdminDashboard />;
  }
  const [activeTab, setActiveTab] = useState<'home' | 'learn' | 'kits' | 'marketplace' | 'community' | 'profile'>('home');
  const [user, setUser] = useState<PIEUser | null>(getPersistedMockUser());
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(AppLanguage.FRENCH);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<{
    type: 'add_to_marketplace' | 'submit_order';
    payload: any;
    id: string;
  }[]>([]);

  useEffect(() => {
    tryInitializeFirebase();
    const handleOnline = () => { setIsOffline(false); triggerDataSync(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    speakPhrase('home_intro', currentLanguage);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const storedCart = localStorage.getItem('projet_pie_cart');
    if (storedCart) setCart(JSON.parse(storedCart));
    const storedQueue = localStorage.getItem('projet_pie_offline_queue');
    if (storedQueue) setOfflineQueue(JSON.parse(storedQueue));
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('projet_pie_cart', JSON.stringify(newCart));
  };

  const handleQueueOfflineAction = (type: 'add_to_marketplace' | 'submit_order', payload: any) => {
    const newAction = { type, payload, id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
    const updatedQueue = [...offlineQueue, newAction];
    setOfflineQueue(updatedQueue);
    localStorage.setItem('projet_pie_offline_queue', JSON.stringify(updatedQueue));
    speakPhrase('btn_offline', currentLanguage);
  };

  const triggerDataSync = async () => {
    if (isOffline || offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      for (const item of offlineQueue) {
        if (item.type === 'add_to_marketplace') {
          await addUserProduct(item.payload);
        } else if (item.type === 'submit_order') {
          await submitClientOrder(item.payload);
        }
      }
      setOfflineQueue([]);
      localStorage.removeItem('projet_pie_offline_queue');
      const latestProducts = await fetchProducts();
      setProducts(latestProducts);
      const msg = currentLanguage === AppLanguage.DARIJA
        ? 'راني صيفط كاع الحوايج للحاسوب دابا ودخلات التغيرات بنجاح !'
        : 'Toutes vos créations et commandes enregistrées hors ligne sont maintenant synchronisées avec succès !';
      speakText(msg, currentLanguage);
    } catch (err) { 
      console.error('Sync process failed', err); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handleVoiceCartAdd = (kitId: string) => {
    fetchKits().then((kits: any[]) => {
      const matchingKit = kits.find((k: any) => k.id === kitId || k.title.fr.toLowerCase().includes(kitId.toLowerCase()));
      if (matchingKit) {
        const existing = cart.find((item: CartItem) => item.kitId === matchingKit.id);
        const newCart = existing
          ? cart.map((item: CartItem) => item.kitId === matchingKit.id ? { ...item, quantity: item.quantity + 1 } : item)
          : [...cart, { kitId: matchingKit.id, quantity: 1 }];
        updateCart(newCart);
        speakPhrase('success_cart', currentLanguage);
      }
    });
  };

  // ── Styles helpers ──────────────────────────────────────────────────────
  const navCard = (borderColor: string): React.CSSProperties => ({
    padding: '24px 20px',
    background: '#fff',
    border: `2px solid ${borderColor}`,
    borderRadius: 24,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 2px 14px rgba(61,43,26,0.07)',
    transition: 'all 0.22s ease',
    minHeight: 210,
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    fontFamily: 'var(--font-sans)',
  });

  const navItems = [
    { id: 'home',        Icon: Home,        emoji: null, labelFr: 'Accueil',  labelAr: 'رئيس' },
    { id: 'learn',       Icon: null,        emoji: '🎓', labelFr: 'Cours',    labelAr: 'تعلم' },
    { id: 'kits',        Icon: Package,     emoji: null, labelFr: 'Kits',     labelAr: 'صناد' },
    { id: 'marketplace', Icon: ShoppingBag, emoji: null, labelFr: 'Souk',     labelAr: 'سوق'  },
    { id: 'community',   Icon: Users,       emoji: null, labelFr: 'Entraide', labelAr: 'تضامن'},
  ] as const;

  return (
    <div className="app-shell">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header id="pie-header" className="pie-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* PIE Serif Logo */}
          <button
            onClick={() => { setActiveTab('home'); speakPhrase('home_intro', currentLanguage); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', lineHeight: 1 }}
          >
            <div className="pie-logo" style={{ fontSize: 30, lineHeight: 1 }}>
              PIE
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--pie-brown-mid)', letterSpacing: '0.10em', textTransform: 'uppercase', lineHeight: 1.6 }}>
              Project PIE
            </div>
          </button>

          {/* Sync / offline badge */}
          {isOffline ? (
            <button
              onClick={() => speakPhrase('btn_offline', currentLanguage)}
              className="pie-status-pill offline"
              title="Hors ligne – Données stockées localement"
            >
              <CloudOff size={12} /> Hors ligne
            </button>
          ) : offlineQueue.length > 0 ? (
            <button
              onClick={triggerDataSync}
              className="pie-status-pill sync"
            >
              {isSyncing
                ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                : <Upload size={12} />}
              {isSyncing ? 'Sync...' : `${offlineQueue.length} en attente`}
            </button>
          ) : (
            <span className="pie-status-pill saved">
              <Cloud size={12} /> Sauvegardé
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LanguageSelector currentLanguage={currentLanguage} onChangeLanguage={setCurrentLanguage} />

          <button
            onClick={() => {
              setActiveTab('profile');
              if (user) {
                speakText(
                  currentLanguage === AppLanguage.DARIJA
                    ? `أهلاً بك يا ${user.displayName}. رصيدك ${user.earnings} درهم.`
                    : `Bienvenue ${user.displayName}. Votre solde est de ${user.earnings} DH.`,
                  currentLanguage
                );
              } else {
                speakText(
                  currentLanguage === AppLanguage.DARIJA ? 'اضغط لفتح حسابك.' : 'Cliquez pour créer votre compte artisan.',
                  currentLanguage
                );
              }
            }}
            className={`pie-profile-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            {user ? (
              <>
                <span style={{ fontSize: 15 }}>
                  {user.role === 'foyer' ? '👵' : user.role === 'jeune' ? '👦' : user.role === 'etudiant' ? '🎓' : '🛖'}
                </span>
                <span style={{ maxWidth: 55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</span>
                <span style={{ background: activeTab === 'profile' ? 'rgba(255,255,255,0.25)' : 'var(--pie-terra)', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 900 }}>
                  {user.earnings} DH
                </span>
              </>
            ) : (
              <><UserIcon size={13} /> <span>{currentLanguage === AppLanguage.DARIJA ? 'حسابي' : 'Compte'}</span></>
            )}
          </button>

          {/* Admin shortcut — shield icon */}
          <a
            href="/?admin=true"
            title="Tableau de bord Admin"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(184,82,48,0.08)',
              border: '1.5px solid rgba(184,82,48,0.18)',
              color: 'var(--pie-terra)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(184,82,48,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(184,82,48,0.08)')}
          >
            <ShieldCheck size={16} />
          </a>
        </div>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <main className="pie-main">

        {/* HOME */}
        {activeTab === 'home' && (
          <section className="pie-hero animate-fadeUp" id="home-view">

            {/* Welcome banner */}
            <div className="pie-hero-banner">
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <span style={{ fontSize: 38 }}>🏺</span>
                <span style={{ fontSize: 38 }}>🪡</span>
                <span style={{ fontSize: 38 }}>🛖</span>
              </div>

              <h2 className="pie-hero-title">
                {currentLanguage === AppLanguage.DARIJA ? 'منصة حرفة: التعلم والريادة'
                  : currentLanguage === AppLanguage.FRENCH ? "Hirfa : L'Artisanat & Apprentissage"
                  : 'Hirfa: Crafts & Skill-Learning'}
              </h2>

              <p className="pie-hero-copy">
                {currentLanguage === AppLanguage.DARIJA
                  ? 'تعلم الكروشي، الطرز الفاسي، نسيج الزرابي والفخار مع كبار الصنّاع والمعلمات، اطلب صندوق اللوازم مجهز لباب الدار وبيع منتوجاتك بكل سهولة.'
                  : currentLanguage === AppLanguage.FRENCH
                  ? 'La plateforme solidaire et inclusive conçue pour toutes les artisanes. Apprenez Crochet, Broderie, Tissage, Poterie — commandez vos matériaux et générez de vrais revenus.'
                  : 'The solidarity crafts platform. Learn trades, receive supply kits, and secure financial autonomy.'}
              </p>

              {user ? (
                <div className="pie-hero-action">
                  <span style={{ fontSize: 14, color: 'var(--pie-brown)' }}>✨ Ahla S-sehla, <strong>{user.displayName}</strong></span>
                  <span className="badge-terra" style={{ fontSize: 10, padding: '4px 12px' }}>{user.level}</span>
                  <button onClick={() => setActiveTab('profile')} style={{ background: 'none', border: 'none', color: 'var(--pie-terra)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                    Voir mes gains →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('profile')}
                  className="btn-terra"
                  style={{ padding: '12px 24px' }}
                >
                  🚪 {currentLanguage === AppLanguage.DARIJA ? 'تفعيل حسابي كصانعة' : 'Activer mon Compte Artisan'}
                </button>
              )}
            </div>

            {/* ── 4 NAVIGATION CARDS ──────────────────────────────────── */}
            <div className="pie-hero-grid stagger">

              {/* LEARN */}
              <button
                onClick={() => { setActiveTab('learn'); speakPhrase('btn_learn', currentLanguage); }}
                className="pie-nav-card animate-fadeUp"
                style={{ borderColor: 'rgba(184,82,48,0.10)' }}
              >
                <div className="nav-card-icon" style={{ background: 'var(--pie-terra)', color: '#fff' }}>🎓</div>
                <div>
                  <h3 className="nav-card-title">{currentLanguage === AppLanguage.DARIJA ? 'تعلم الكروشي' : currentLanguage === AppLanguage.FRENCH ? 'Apprendre' : 'Learn'}</h3>
                  <p className="nav-card-copy">{currentLanguage === AppLanguage.DARIJA ? 'خطوة بخطوة بالصوت' : currentLanguage === AppLanguage.FRENCH ? 'Cours avec guide vocal' : 'Animated guides'}</p>
                </div>
                <div className="nav-card-icon" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(184,82,48,0.10)', color: 'var(--pie-terra)', boxShadow: 'none' }}>
                  <Volume2 size={14} />
                </div>
              </button>

              {/* KITS */}
              <button
                onClick={() => { setActiveTab('kits'); speakPhrase('btn_kits', currentLanguage); }}
                className="pie-nav-card animate-fadeUp"
                style={{ borderColor: 'rgba(106,143,106,0.12)' }}
              >
                <div className="nav-card-icon" style={{ background: 'var(--pie-sage)', color: '#fff' }}>📦</div>
                <div>
                  <h3 className="nav-card-title">{currentLanguage === AppLanguage.DARIJA ? 'شرا الصوندوق' : currentLanguage === AppLanguage.FRENCH ? 'Acheter un Kit' : 'Buy a Kit'}</h3>
                  <p className="nav-card-copy">{currentLanguage === AppLanguage.DARIJA ? 'مواد مهيزة' : currentLanguage === AppLanguage.FRENCH ? 'Matériel livré' : 'Materials'}</p>
                </div>
                <div className="nav-card-icon" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(106,143,106,0.12)', color: 'var(--pie-sage-dark)', boxShadow: 'none' }}>
                  <Volume2 size={14} />
                </div>
              </button>

              {/* MARKETPLACE */}
              <button
                onClick={() => { setActiveTab('marketplace'); speakPhrase('btn_marketplace', currentLanguage); }}
                className="pie-nav-card animate-fadeUp"
                style={{ borderColor: 'rgba(90,138,90,0.12)' }}
              >
                <div className="nav-card-icon" style={{ background: '#5A8A5A', color: '#fff' }}>🛍️</div>
                <div>
                  <h3 className="nav-card-title">{currentLanguage === AppLanguage.DARIJA ? 'نبيع المنتوجات ديالي' : currentLanguage === AppLanguage.FRENCH ? 'Espace Vendre & Marché' : 'Sell My Creations'}</h3>
                  <p className="nav-card-copy">{currentLanguage === AppLanguage.DARIJA ? 'صوري وصيفطي' : currentLanguage === AppLanguage.FRENCH ? 'Prenez en photo et vendez' : 'Photo & sell instantly'}</p>
                </div>
                <div className="nav-card-icon" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(90,138,90,0.12)', color: '#4A7A4A', boxShadow: 'none' }}>
                  <Volume2 size={14} />
                </div>
              </button>

              {/* COMMUNITY */}
              <button
                onClick={() => {
                  setActiveTab('community');
                  speakText(
                    currentLanguage === AppLanguage.DARIJA
                      ? 'ساحة المعلمات والتضامن. تواصلو بالصوت وبلا كتابة.'
                      : "Entrez dans la place d'entraide vocale des artisanes.",
                    currentLanguage
                  );
                }}
                className="pie-nav-card animate-fadeUp"
                style={{ borderColor: 'rgba(160,90,60,0.10)' }}
              >
                <div className="nav-card-icon" style={{ background: '#A05A3C', color: '#fff' }}>🤝</div>
                <div>
                  <h3 className="nav-card-title">{currentLanguage === AppLanguage.DARIJA ? 'ساحة التضامن والزغاريد' : currentLanguage === AppLanguage.FRENCH ? "Mural d'Entraide & Partage" : 'Community Wall'}</h3>
                  <p className="nav-card-copy">{currentLanguage === AppLanguage.DARIJA ? 'تشاركي بالصوت وبلا قراية' : currentLanguage === AppLanguage.FRENCH ? 'Discutez par messages vocaux' : 'Voice messages & cheers'}</p>
                </div>
                <div className="nav-card-icon" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(160,90,60,0.12)', color: '#A05A3C', boxShadow: 'none' }}>
                  <Volume2 size={14} />
                </div>
              </button>
            </div>

            {/* ── COOPERATIVE FOOTER ──────────────────────────────────── */}
            <div className="pie-footer-panel">
              <h3>
                <span>🇲🇦</span>
                <span>{currentLanguage === AppLanguage.DARIJA ? 'تعاونية الأنامل الذهبية الموحدة' : 'Coopérative Locale de Projet PIE'}</span>
              </h3>
              <p>
                {currentLanguage === AppLanguage.DARIJA
                  ? 'مشروع تضامني يدعم الفتيات والنساء الحرفيات فالمغرب لتشجيع الرواج الاقتصادي والصناعة التقليدية.'
                  : "Une initiative solidaire pour valoriser la broderie artisanale marocaine et l'indépendance financière des couturières."}
              </p>
            </div>
          </section>
        )}

        {activeTab === 'learn' && (
          <div style={{ padding: '16px 0' }}>
            <LearnCenter currentLanguage={currentLanguage} onAddToCart={handleVoiceCartAdd} />
          </div>
        )}
        {activeTab === 'kits' && (
          <div style={{ padding: '16px 0' }}>
            <KitCenter currentLanguage={currentLanguage} cart={cart} onUpdateCart={updateCart} isOffline={isOffline} onQueueOfflineAction={handleQueueOfflineAction} />
          </div>
        )}
        {activeTab === 'marketplace' && (
          <div style={{ padding: '16px 0' }}>
            <MarketplaceCenter currentLanguage={currentLanguage} isOffline={isOffline} onQueueOfflineAction={handleQueueOfflineAction} products={products} onProductsUpdated={setProducts} />
          </div>
        )}
        {activeTab === 'community' && (
          <div style={{ padding: '16px 0' }}>
            <CommunityCenter currentLanguage={currentLanguage} />
          </div>
        )}
        {activeTab === 'profile' && (
          <div style={{ padding: '16px 0' }}>
            <AuthCenter
              currentLanguage={currentLanguage}
              user={user}
              onLogin={(u) => {
                setUser(u);
                // Persist locally for offline access
                savePersistedMockUser(u);
                localStorage.setItem('pie_is_logged_in', 'true');
                // Persist to Firestore if Firebase is active (best-effort, no await)
                updateUserProfile(u.uid, u).catch((err) =>
                  console.warn('Firestore profile sync failed, local copy kept.', err)
                );
              }}
              onLogout={() => {
                setUser(null);
                // Clear both local stores
                savePersistedMockUser(null);
                localStorage.removeItem('pie_is_logged_in');
                localStorage.removeItem('pie_logged_user');
              }}
            />
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV ────────────────────────────────────────────────── */}
      <nav className="pie-bottom-nav safe-bottom" id="pie-bottom-nav" role="navigation" aria-label="Navigation principale">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const hasBadge = item.id === 'kits' && cart.length > 0;
          return (
            <button
              key={item.id}
              className={`pie-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id as any);
                if (item.id === 'learn') speakPhrase('btn_learn', currentLanguage);
                else if (item.id === 'kits') speakPhrase('btn_kits', currentLanguage);
                else if (item.id === 'marketplace') speakPhrase('btn_marketplace', currentLanguage);
                else if (item.id === 'home') speakPhrase('home_intro', currentLanguage);
              }}
              aria-label={currentLanguage === AppLanguage.DARIJA ? item.labelAr : item.labelFr}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-icon-wrap" style={{ position: 'relative' }}>
                {item.emoji
                  ? <span style={{ fontSize: 20 }}>{item.emoji}</span>
                  : item.Icon && <item.Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? 'var(--pie-terra)' : '#9B8570'} />
                }
                {hasBadge && (
                  <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--pie-terra)', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900 }}>
                    {cart.length}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--pie-terra)' : '#9B8570' }}>
                {currentLanguage === AppLanguage.DARIJA ? item.labelAr : item.labelFr}
              </span>
            </button>
          );
        })}
      </nav>

      <VoiceGuide
        currentLanguage={currentLanguage}
        onNavigateTab={setActiveTab}
        onAddToCart={handleVoiceCartAdd}
        onForceSync={triggerDataSync}
        isOffline={isOffline}
      />
    </div>
  );
}
