/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppLanguage } from '../types';
import { PIEUser, isRealFirebase, signInWithGoogle, getIsRealFirebase } from '../lib/firebase';
import { speakText } from '../utils/speech';
import { ShieldCheck, User as UserIcon, LogOut, Volume2, Sparkles, MapPin, Award, Navigation, Briefcase } from 'lucide-react';

interface AuthCenterProps {
  currentLanguage: AppLanguage;
  user: PIEUser | null;
  onLogin: (user: PIEUser) => void;
  onLogout: () => void;
}

export const AuthCenter: React.FC<AuthCenterProps> = ({
  currentLanguage,
  user,
  onLogin,
  onLogout
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'foyer' | 'jeune' | 'etudiant' | 'rural'>('foyer');
  const [location, setLocation] = useState('Tafraout');
  const [isRegistering, setIsRegistering] = useState(false);

  const locationsList = [
    { name: 'Tafraout (Souss)', labelAr: 'تافراوت (سوس)' },
    { name: 'Chefchaouen (Nord)', labelAr: 'شفشاون (الشمال)' },
    { name: 'Sefrou (Moyen Atlas)', labelAr: 'صفرو (الأطلس المتوسط)' },
    { name: 'Fès (Artesanal Centro)', labelAr: 'فاس (المدينة العتيقة)' },
    { name: 'Goulmima (Sud-Est)', labelAr: 'كلميمة (الجنوب الشرقي)' },
    { name: 'Marrakech (Haouz)', labelAr: 'مراكش (الحوز)' }
  ];

  const roles = [
    {
      id: 'foyer' as const,
      emoji: '🏠',
      title: {
        ar: 'صناع وصانعات بالبيت',
        fr: 'Artisan(e) au foyer (H/F)',
        en: 'Home crafter (M/F)'
      },
      desc: {
        ar: 'باغي(ة) نتعلم الصنعة ونخدم من الدار باش نربح مدخول مستقل بلا ما نخرج.',
        fr: 'Apprendre un métier artisanal de chez soi et générer un revenu autonome sans contrainte.',
        en: 'Learn a traditional craft at home and secure extra income for your household.'
      }
    },
    {
      id: 'jeune' as const,
      emoji: '👦',
      title: {
        ar: 'شباب بدون عمل',
        fr: 'Jeune sans emploi',
        en: 'Unemployed Youth'
      },
      desc: {
        ar: 'باغي ندوز للتكوين المهني والتطبيقي باش نفتح مشروع ديالي ونستقل ماليا.',
        fr: 'Se lancer dans l’entrepreneuriat artisanal rapide pour créer une micro-entreprise.',
        en: 'Acquire high-value manual techniques to build your micro-enterprise.'
      }
    },
    {
      id: 'etudiant' as const,
      emoji: '🎓',
      title: {
        ar: 'طلبة وطالبات',
        fr: 'Étudiant / Étudiante',
        en: 'Student'
      },
      desc: {
        ar: 'باغي نتعلم صنعة الحرف التقليدية د الليد باش نمول القراية ديالي.',
        fr: 'Soutien de scolarité par de la vente d’articles faits main authentiques de haute valeur.',
        en: 'Generate auxiliary tuition funds while keeping Morocco’s local heritage alive.'
      }
    },
    {
      id: 'rural' as const,
      emoji: '🛖',
      title: {
        ar: 'سكان العالم القروي',
        fr: 'Habitant rural',
        en: 'Rural Crafter'
      },
      desc: {
        ar: 'باغي نوصل للدروس والتعليم بلا ما نسافر للمدينة، ونبيع منتوجاتي نيشان.',
        fr: 'Accéder aux modules sans contrainte de transport ni frais de déplacement ruraux.',
        en: 'Gain premium digital workshop access without the cost of traveling to urban centers.'
      }
    }
  ];

  const speakProfileInfo = (roleId: 'foyer' | 'jeune' | 'etudiant' | 'rural') => {
    const r = roles.find(item => item.id === roleId);
    if (r) {
      const textToSpeak = currentLanguage === AppLanguage.DARIJA 
        ? `${r.title.ar}. ${r.desc.ar}`
        : `${r.title.fr}. ${r.desc.fr}`;
      speakText(textToSpeak, currentLanguage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        fbUser.role = role;
        fbUser.location = location;
        fbUser.level = role === 'foyer' ? 'Apprenti(e) Maâlem/Maâlma' : 'Artisan(e) Passionné(e)';
        onLogin(fbUser);
        const welcomeMsg = currentLanguage === AppLanguage.DARIJA
          ? `تم تسجيل الدخول بجوجل بنجاح! مرحبا بيك يا ${fbUser.displayName}.`
          : `Authentification réussie avec Google ! Bienvenue ${fbUser.displayName}.`;
        speakText(welcomeMsg, currentLanguage);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (role === 'foyer' ? 'Khadija' : 'Yassir');
    const finalEmail = email.trim() || `${finalName.toLowerCase().replace(/\s+/g, '')}@hirfa.ma`;

    const simulatedUser: PIEUser = {
      uid: `uid-${Date.now()}`,
      displayName: finalName,
      email: finalEmail,
      role: role,
      location: location,
      earnings: role === 'foyer' ? 1200 : role === 'jeune' ? 850 : 0,
      coursesCompleted: role === 'foyer' ? 1 : 0,
      level: role === 'foyer' ? 'Apprenti(e) Maâlem/Maâlma' : 'Artisan(e) Passionné(e)',
      xp: role === 'foyer' ? 350 : 120,
      streak: 1
    };

    onLogin(simulatedUser);

    const welcomeMsg = currentLanguage === AppLanguage.DARIJA
      ? `تم التسجيل بنجاح! مرحبا بيك يا ${finalName} فساحة العمل ديالك.`
      : `Connexion réussie ! Bienvenue ${finalName} dans votre espace d'apprentissage et de vente.`;
    speakText(welcomeMsg, currentLanguage);
  };

  const handleQuickLogin = (preset: 'khadija' | 'yassir') => {
    if (preset === 'khadija') {
      const user: PIEUser = {
        uid: 'user-lma-1',
        displayName: 'Khadija Soussia',
        email: 'khadija@hirfa.ma',
        role: 'foyer',
        location: 'Tafraout',
        earnings: 4800,
        coursesCompleted: 3,
        level: 'Maâlma Confirmée',
        xp: 1250,
        streak: 12
      };
      onLogin(user);
      speakText("Marhaban bik Khadija! Vous êtes connectée.", currentLanguage);
    } else {
      const user: PIEUser = {
        uid: 'user-lma-2',
        displayName: 'Yassir Gherbi',
        email: 'yassir@hirfa.ma',
        role: 'jeune',
        location: 'Sefrou',
        earnings: 2300,
        coursesCompleted: 2,
        level: 'Maâlem Passionné',
        xp: 850,
        streak: 5
      };
      onLogin(user);
      speakText("Marhaban bik Yassir! Vous êtes connecté.", currentLanguage);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 text-slate-900 animate-fadeIn" id="auth-center-view">
      {user ? (
        /* LOGGED IN USER STATISTICS AND GAMIFICATION PROFILE CARD */
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-100 shadow-xl space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-orange-50 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-3xl font-black shadow-md shadow-amber-600/20">
                {user.role === 'foyer' ? '👵' : user.role === 'jeune' ? '👦' : user.role === 'etudiant' ? '🎓' : '🛖'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black tracking-tight text-slate-950">{user.displayName}</h3>
                  <span className="bg-orange-100 text-orange-850 text-xs font-black px-2 py-0.5 rounded-full uppercase font-mono tracking-wider">
                    {user.level}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1 font-mono">
                  <MapPin size={12} className="text-orange-600 shrink-0" />
                  <span>{user.location}</span>
                  <span className="mx-1">•</span>
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                speakText(
                  currentLanguage === AppLanguage.DARIJA 
                    ? "تم الخروج بنجاح. مع السلامة يا معلّم(ة) !" 
                    : "Déconnexion réussie ! À bientôt sur la plateforme Hirfa.", 
                  currentLanguage
                );
              }}
              className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>{currentLanguage === AppLanguage.DARIJA ? "خروج" : "Déconnexion"}</span>
            </button>
          </div>

          {/* METRICS GRID - HIGH CONTRAST & INTUITIVE FOR FINANCIAL AUTONOMY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Earnings / Financial Autonomy */}
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-100/50 border border-orange-200/40 rounded-3xl space-y-2 relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-4xl opacity-10 group-hover:scale-110 transition-transform">🪙</div>
              <p className="text-xs font-black uppercase tracking-widest text-orange-900/60 font-mono">
                {currentLanguage === AppLanguage.DARIJA ? "المدخول المالي" : "Autonomie Financière"}
              </p>
              <h4 className="text-3xl font-black text-amber-905">{user.earnings} DH</h4>
              <p className="text-xs text-gray-500 font-sans">
                {currentLanguage === AppLanguage.DARIJA ? "الأرباح ديالك من بيع الكروشي فالسوق" : "Gains cumulés grâce aux ventes de vos créations."}
              </p>
            </div>

            {/* Courses / Skills completed */}
            <div className="p-6 bg-gradient-to-br from-teal-50 to-emerald-100/50 border border-teal-250/35 rounded-3xl space-y-2 relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-4xl opacity-10 group-hover:scale-110 transition-transform">🎓</div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-900/60 font-mono">
                {currentLanguage === AppLanguage.DARIJA ? "الدروس المكتملة" : "Apprentissage"}
              </p>
              <h4 className="text-3xl font-black text-teal-950">{user.coursesCompleted} {user.coursesCompleted > 1 ? 'Cours' : 'Cours'}</h4>
              <p className="text-xs text-gray-500 font-sans">
                {currentLanguage === AppLanguage.DARIJA ? "الحرف التقليدية اللي كملتي تمرينها بنجاح" : "Formations complètes suivies à domicile."}
              </p>
            </div>

            {/* Gamified Streak & XP Continuous Engagement */}
            <div className="p-6 bg-gradient-to-br from-rose-50 to-rose-100/40 border border-rose-200/30 rounded-3xl space-y-2 relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-4xl opacity-10 group-hover:scale-110 transition-transform">🔥</div>
              <p className="text-xs font-black uppercase tracking-widest text-rose-900/60 font-mono">
                {currentLanguage === AppLanguage.DARIJA ? "نشاطك اليومي" : "Activité journalière"}
              </p>
              <h4 className="text-3xl font-black text-rose-700">{user.streak} {currentLanguage === AppLanguage.DARIJA ? 'أيام' : 'Jours'}</h4>
              <p className="text-xs text-gray-500 font-sans">
                {currentLanguage === AppLanguage.DARIJA ? "أيام متتالية ديال الخدمة والتدريب" : "Jours consécutifs de connexion et d'autonomie."}
              </p>
            </div>

          </div>

          {/* USER PROGRESS ACCORDING TO USER ROLE */}
          <div className="p-6 bg-stone-50 border border-slate-100 rounded-3xl space-y-4">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Award size={18} className="text-amber-600" />
              <span>
                {currentLanguage === AppLanguage.DARIJA ? "مستوى تقدم الحرفية" : "Objectif d'autonomie pour votre profil"}
              </span>
            </h4>
            
            <div className="space-y-4 font-sans text-xs text-gray-600 leading-relaxed">
              {user.role === 'foyer' && (
                <div className="space-y-2">
                  <p>
                    <strong>🎯 Spécial Femmes au foyer :</strong> Votre but principal est d'harmoniser activités domestiques et entrepreneuriat. Grâce à notre kit et cours vidéo, vous avez déjà validé votre premier point. Continuez pour obtenir le badge <strong>"Maâlma du Souss"</strong> !
                  </p>
                  <div className="w-full bg-gray-250 rounded-full h-2.5">
                    <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-mono tracking-widest mt-1">
                    <span>40% Vers Maâlma Confirmée</span>
                    <span>1,200 / 3,000 DH visés</span>
                  </div>
                </div>
              )}

              {user.role === 'jeune' && (
                <div className="space-y-2">
                  <p>
                    <strong>🎯 Spécial Jeune sans emploi :</strong> Vous accélérez votre employabilité en apprenant le tissage de tapis et la broderie de luxe. Prochaine étape : soumettez 2 nouveaux travaux certifiés sur la marketplace pour débloquer votre subvention de démarrage !
                  </p>
                  <div className="w-full bg-gray-250 rounded-full h-2.5">
                    <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-mono tracking-widest mt-1">
                    <span>25% Vers Micro-coopérative</span>
                    <span>2,300 / 10,000 DH visés</span>
                  </div>
                </div>
              )}

              {user.role === 'etudiant' && (
                <div className="space-y-2">
                  <p>
                    <strong>🎯 Spécial Étudiant :</strong> Vous apprenez les arts traditionnels modernes pour générer de l'argent de poche tout en assurant vos études. Le marché solidaire vous connecte avec des acheteurs français et espagnols de crochet bohème.
                  </p>
                  <div className="w-full bg-gray-250 rounded-full h-2.5">
                    <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-mono tracking-widest mt-1">
                    <span>10% Vers Financement Scolaire</span>
                    <span>0 / 5,000 DH visés</span>
                  </div>
                </div>
              )}

              {user.role === 'rural' && (
                <div className="space-y-2">
                  <p>
                    <strong>🎯 Spécial Zones Rurales :</strong> Vous contournez l'éloignement physique. Vos œuvres sont collectées directement par nos partenaires de transport solidaires et acheminées au port de Casablanca pour exportation.
                  </p>
                  <div className="w-full bg-gray-250 rounded-full h-2.5">
                    <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 uppercase font-mono tracking-widest mt-1">
                    <span>50% Vers Exportation Locale</span>
                    <span>0 / 6,000 DH visés</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DISCONNECTED STATE - DETAILED EXPLANATION AND AUTH FORM */
        <div className="space-y-12">
          
          {/* Header Description */}
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              {currentLanguage === AppLanguage.DARIJA ? "مرحبا بك في فضاء التسجيل والريادة" : "Espace d'Inscription & Connexion"}
            </h3>
            <p className="text-sm text-gray-500 max-w-xl mx-auto font-sans leading-relaxed">
              {currentLanguage === AppLanguage.DARIJA 
                ? "سجل الإسم ديالك وحسابك الشخصي باش تبدأ التعلم والبيع وتبع شحال ربحتي وتواصل مع الناس."
                : "Choisissez votre profil pour débloquer votre curriculum personnalisé et suivre en temps réel vos ventes, vos certificats et vos gains."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Form & Preset Selectors */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-slate-100 shadow-xl space-y-6">
              <h4 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <ShieldCheck className="text-orange-600" size={20} />
                <span>
                  {currentLanguage === AppLanguage.DARIJA ? "معلومات الحساب" : "Créer mon espace Hirfa"}
                </span>
              </h4>

              <form onSubmit={handleAuthSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 font-mono tracking-widest mb-1.5">
                    {currentLanguage === AppLanguage.DARIJA ? "الإسم الكامل" : "Nom complet / Surnom"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={currentLanguage === AppLanguage.DARIJA ? "مثال: خديجة أو يوسف" : "Ex: Khadija ou Youssef"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-amber-550 rounded-2xl p-3 text-xs outline-none focus:bg-white font-sans transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 font-mono tracking-widest mb-1.5">
                    {currentLanguage === AppLanguage.DARIJA ? "البريد الإلكتروني (إختياري)" : "Email (Simulé ou réel)"}
                  </label>
                  <input
                    type="email"
                    placeholder="khadija@hirfa.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-amber-550 rounded-2xl p-3 text-xs outline-none focus:bg-white font-sans transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 font-mono tracking-widest mb-1.5">
                    {currentLanguage === AppLanguage.DARIJA ? "الجهة أو المدينة" : "Localisation ou Commune rurale"}
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-amber-550 rounded-2xl p-3 text-xs outline-none focus:bg-white font-sans transition-all cursor-pointer"
                  >
                    {locationsList.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {currentLanguage === AppLanguage.DARIJA ? `${loc.labelAr} (${loc.name})` : loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submitting Form */}
                <button
                  type="submit"
                  className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-600/10 transition-colors uppercase flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Sparkles size={16} />
                  <span>
                    {currentLanguage === AppLanguage.DARIJA ? "دخول وفتح الحساب" : "Créer mon espace & ouvrir"}
                  </span>
                </button>
              </form>

              {getIsRealFirebase() && (
                <div className="pt-2">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-mono uppercase tracking-widest">Ou / أو</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-250 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>{currentLanguage === AppLanguage.DARIJA ? "دخول سريع ب حساب Google" : "Dossier direct Google"}</span>
                  </button>
                </div>
              )}

              {/* DEMO ACCOUNTS QUICK TESTERS */}
              <div className="pt-6 border-t border-gray-100 space-y-3">
                <span className="block text-[10px] font-black uppercase text-gray-400 font-mono tracking-widest">
                  {currentLanguage === AppLanguage.DARIJA ? "الدخول السريع للتجريب" : "Comptes de démonstration (Accès rapide)"}
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleQuickLogin('khadija')}
                    className="p-3 bg-orange-50 hover:bg-amber-100 text-orange-900 border border-orange-200/50 rounded-2xl flex flex-col items-center text-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="text-2xl">👵</span>
                    <span className="text-xs font-bold font-sans">Khadija</span>
                    <span className="text-[9px] text-orange-500 uppercase font-mono font-black">Foyère Tafraout</span>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('yassir')}
                    className="p-3 bg-stone-50 hover:bg-slate-100 text-stone-850 border border-slate-250/50 rounded-2xl flex flex-col items-center text-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="text-2xl">👦</span>
                    <span className="text-xs font-bold font-sans">Yassir</span>
                    <span className="text-[9px] text-gray-500 uppercase font-mono font-black">Jeune Sefrou</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Profile Selection & Voice Descriptions */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase text-gray-400 font-mono tracking-widest block">
                {currentLanguage === AppLanguage.DARIJA ? "اختر طبيعة الملف ديالك للملائمة" : "Choisissez votre profil pour écouter l'explication vocale"}
              </span>

              <div className="grid grid-cols-1 gap-4">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id);
                      speakProfileInfo(r.id);
                    }}
                    className={`p-4 rounded-3xl border-2 text-left flex items-start gap-4 transition-all duration-300 select-none cursor-pointer ${
                      role === r.id 
                        ? 'bg-amber-50/50 border-amber-550 shadow-md scale-[1.02]' 
                        : 'bg-white border-slate-100 hover:border-orange-200 shadow-sm'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-sm shrink-0">
                      {r.emoji}
                    </div>
                    
                    <div className="flex-grow space-y-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-black text-slate-900">
                          {currentLanguage === AppLanguage.DARIJA ? r.title.ar : r.title.fr}
                        </h5>
                        <div className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                          <Volume2 size={12} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-sans">
                        {currentLanguage === AppLanguage.DARIJA ? r.desc.ar : r.desc.fr}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
