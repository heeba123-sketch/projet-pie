import React from 'react';
import { AppLanguage } from '../types';
import { PIEUser } from '../lib/firebase';
import { Play, Star, ChevronRight, ShoppingCart } from 'lucide-react';

interface HomeCenterProps {
  currentLanguage: AppLanguage;
  user: PIEUser | null;
  onNavigate: (tab: string) => void;
  isDarkMode?: boolean;
  onAddToCart?: (item: any) => void;
  onChangeLanguage?: (lang: AppLanguage) => void;
}

export default function HomeCenter({ currentLanguage, user, onNavigate, isDarkMode, onAddToCart, onChangeLanguage }: HomeCenterProps) {
  const isArabic = currentLanguage === AppLanguage.DARIJA || currentLanguage === AppLanguage.TAMAZIGHT; // Assuming Arabic-like layout for Darija
  const t = (fr: string, ar: string, en: string) => {
    if (currentLanguage === AppLanguage.DARIJA) return ar;
    if (currentLanguage === AppLanguage.ENGLISH) return en;
    return fr;
  };

  const userName = user?.displayName || t('Khadija Soussia', 'خديجة السوسية', 'Khadija Soussia');
  const [followedArtisans, setFollowedArtisans] = React.useState<number[]>([]);

  const handleFollow = (idx: number) => {
    if (followedArtisans.includes(idx)) {
      setFollowedArtisans(followedArtisans.filter(i => i !== idx));
    } else {
      setFollowedArtisans([...followedArtisans, idx]);
    }
  };

  return (
    <div className={`pie-home-center ${isDarkMode ? 'dark' : ''}`}>
      
      {/* "Découvrez" text floating over the background image (top area) */}
      <div style={{
          position: 'fixed',
          top: '12vh',
          left: 0,
          width: '100%',
          textAlign: 'center',
          zIndex: 5,
          pointerEvents: 'none'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: 'var(--pie-terra)', textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}>
            {t("Découvrez l'artisanat marocain", 'اكتشف الصناعة التقليدية المغربية', 'Discover Moroccan Handicraft')}
          </h2>
        </div>

      {/* Spacer to show background image on top */}
      <div className="pie-home-spacer" />

      {/* White panel: adapted for any device */}
      <div className="pie-home-panel">
        {/* Header: Bienvenue + Language switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: `1px solid ${isDarkMode ? '#2a2018' : '#f0ebe3'}`, flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: isDarkMode ? '#fff' : '#1A0E06' }}>
            {t(`Bienvenue ${userName} 👋`, `مرحباً، ${userName} 👋`, `Welcome ${userName} 👋`)}
          </h1>
          {/* Language switcher pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {([
              { lang: AppLanguage.FRENCH,   flag: '🇫🇷', label: 'FR' },
              { lang: AppLanguage.DARIJA,   flag: '🇲🇦', label: 'MA' },
              { lang: AppLanguage.TAMAZIGHT,flag: 'ⵣ',    label: 'TM' },
              { lang: AppLanguage.ENGLISH,  flag: '🇬🇧', label: 'EN' },
            ] as { lang: AppLanguage; flag: string; label: string }[]).map(({ lang, flag, label }) => (
              <button
                key={lang}
                onClick={() => {
                  if (onChangeLanguage) {
                    onChangeLanguage(lang);
                    localStorage.setItem('pie_language', lang);
                  }
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '20px',
                  border: 'none',
                  background: currentLanguage === lang
                    ? 'var(--pie-terra)'
                    : (isDarkMode ? '#2a2018' : '#f0ebe3'),
                  color: currentLanguage === lang ? '#fff' : (isDarkMode ? '#ccc' : '#555'),
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{flag}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

          {/* Section: Learning Paths */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexDirection: isArabic ? 'row-reverse' : 'row' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                {t('Vos parcours', 'مسارات التعلم المغربية', 'Your learning paths')}
              </h3>
              <button 
                onClick={() => onNavigate('learn')}
                style={{ background: 'none', border: 'none', color: 'var(--pie-terra)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', flexDirection: isArabic ? 'row-reverse' : 'row' }}
              >
                {t('Voir tout', 'عرض الكل', 'See all')}
                <ChevronRight size={18} style={{ transform: isArabic ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>

            <div className="pie-home-grid-learning" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
              {/* Card 1 */}
              <div style={{ background: isDarkMode ? '#2a201a' : '#fcfaf8', borderRadius: '24px', padding: '16px', border: `1px solid ${isDarkMode ? '#3a2d24' : '#E8DDD3'}` }}>
                <div style={{ height: '160px', borderRadius: '16px', background: 'url(/assets/pottery_sewing.png) center/cover, #e0d5c1', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', textAlign: isArabic ? 'right' : 'left' }}>
                  {t('De l\'aiguille à l\'argile', 'من الإبرة إلى الطين: دمج الخياطة والفخار', 'From needle to clay')}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', color: isDarkMode ? '#aaa' : '#666', flexDirection: isArabic ? 'row-reverse' : 'row' }}>
                  <Star size={16} fill="#F5A623" color="#F5A623" />
                  <span>4.8</span>
                  <span>•</span>
                  <span>12 Lessons</span>
                </div>
                <button 
                  onClick={() => onNavigate('learn')}
                  style={{ width: '100%', padding: '12px', background: 'var(--pie-terra)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {t('Voir les détails', 'شاهد التفاصيل', 'Watch details')}
                </button>
              </div>

              {/* Card 2 */}
              <div style={{ background: isDarkMode ? '#2a201a' : '#fcfaf8', borderRadius: '24px', padding: '16px', border: `1px solid ${isDarkMode ? '#3a2d24' : '#E8DDD3'}` }}>
                <div style={{ height: '160px', borderRadius: '16px', background: 'url(/assets/weaving_colors.png) center/cover, #e0d5c1', marginBottom: '16px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Play size={24} fill="currentColor" />
                  </div>
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', textAlign: isArabic ? 'right' : 'left' }}>
                  {t('Tissage : l\'art des couleurs', 'نسيج الزربية: فن الألوان', 'Weaving: Art of colors')}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', color: isDarkMode ? '#aaa' : '#666', flexDirection: isArabic ? 'row-reverse' : 'row' }}>
                  <Star size={16} fill="#F5A623" color="#F5A623" />
                  <span>4.8</span>
                  <span>•</span>
                  <span>12 Lessons</span>
                </div>
                <button 
                  onClick={() => onNavigate('learn')}
                  style={{ width: '100%', padding: '12px', background: 'var(--pie-terra)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {t('Voir les détails', 'شاهد التفاصيل', 'Watch details')}
                </button>
              </div>
            </div>
          </div>

          {/* Section: Handicraft Market */}
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexDirection: isArabic ? 'row-reverse' : 'row' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                {t('Marché artisanal', 'سوق الحرف اليدوية', 'Handicraft Market')}
              </h3>
              <button 
                onClick={() => onNavigate('marketplace')}
                style={{ background: 'none', border: 'none', color: 'var(--pie-terra)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', flexDirection: isArabic ? 'row-reverse' : 'row' }}
              >
                {t('Voir tout', 'عرض الكل', 'See all')}
                <ChevronRight size={18} style={{ transform: isArabic ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>

            <div className="pie-home-grid-market" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
              {[
                { title: 'Sac en paille tissé', ar: 'حقيبة من القش المنسوج', price: '1200 DH', img: 'straw_bag.png' },
                { title: 'Broderie traditionnelle', ar: 'تطريز تقليدي', price: '350 DH', img: 'embroidery_art.png' },
                { title: 'Théière en argent', ar: 'أواني فضية من فاس', price: '350 DH', img: 'silver_teapot.png' }
              ].map((item, idx) => (
                <div key={idx} style={{ background: isDarkMode ? '#2a201a' : '#fff', borderRadius: '20px', padding: '12px', border: `1px solid ${isDarkMode ? '#3a2d24' : '#E8DDD3'}` }}>
                  <div style={{ height: '140px', borderRadius: '12px', background: `url(/assets/${item.img}) center/cover, #e0d5c1`, marginBottom: '12px' }} />
                  <div style={{ fontSize: '12px', color: '#F5A623', display: 'flex', gap: '2px', marginBottom: '4px', flexDirection: isArabic ? 'row-reverse' : 'row' }}>
                    <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', textAlign: isArabic ? 'right' : 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t(item.title, item.ar, item.title)}
                  </h4>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--pie-terra)', marginBottom: '12px', textAlign: isArabic ? 'right' : 'left' }}>
                    {item.price}
                  </div>
                  <button 
                    onClick={() => onAddToCart && onAddToCart(item)}
                    style={{ width: '100%', padding: '8px', background: isDarkMode ? '#3a2d24' : '#f0ebe3', color: isDarkMode ? '#fff' : '#1A0E06', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexDirection: isArabic ? 'row-reverse' : 'row' }}
                  >
                    <ShoppingCart size={16} />
                    <span style={{ fontSize: '13px' }}>{t('Ajouter', 'أضف للسلة', 'Add')}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Featured Artisans */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexDirection: isArabic ? 'row-reverse' : 'row' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                {t('Artisans remarquables', 'صناع متميزون', 'Featured Artisans')}
              </h3>
            </div>
            
            <div className="pie-home-grid-artisans" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
              {[
                { name: 'Abdelkader', ar: 'عبد القادر، خياط من مراكش', img: 'artisan1.png' },
                { name: 'Fatima', ar: 'فاطمة، خياطة من فاس', img: 'artisan1.png' },
                { name: 'Hassan', ar: 'حسن، خياط من مراكش', img: 'artisan1.png' }
              ].map((artisan, idx) => {
                const isFollowed = followedArtisans.includes(idx);
                return (
                <div key={idx} style={{ background: isDarkMode ? '#2a201a' : '#fff', borderRadius: '20px', padding: '16px', border: `1px solid ${isDarkMode ? '#3a2d24' : '#E8DDD3'}`, textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `url(/assets/${artisan.img}) center/cover, #ccc`, margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', minHeight: '40px' }}>
                    {t(artisan.name, artisan.ar, artisan.name)}
                  </h4>
                  <button 
                    onClick={() => handleFollow(idx)}
                    style={{ 
                      padding: '6px 20px', 
                      background: isFollowed ? 'transparent' : 'var(--pie-terra)', 
                      color: isFollowed ? 'var(--pie-terra)' : '#fff', 
                      border: isFollowed ? '1px solid var(--pie-terra)' : '1px solid transparent', 
                      borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isFollowed ? t('Suivi', 'مُتَابَع', 'Following') : t('Suivre', 'تابع', 'Follow')}
                  </button>
                </div>
              )})}
            </div>
          </div>
        </div>
      </div>
  );
}
