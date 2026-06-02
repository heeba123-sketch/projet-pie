/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppLanguage, CommunityPost, LocalizedText } from '../types';
import { speakText } from '../utils/speech';
import { AudioHover } from './AudioHover';
import { Play, Flame, Heart, Sparkles, Mic, MapPin, Check, Plus, User, Info, Smartphone, Eye } from 'lucide-react';

interface CommunityCenterProps {
  currentLanguage: AppLanguage;
}

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    authorName: 'Khadija El Horra',
    authorRole: 'foyer',
    authorLocation: 'Demnate 🏔️',
    imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=450&auto=format&fit=crop&q=80',
    category: 'crochet',
    likes: 42,
    cheersCount: 28,
    timeAgo: {
      ar: "ساعة وحدة هادي",
      tmz: "Yan ssaâ",
      fr: "Il y a 1 heure",
      en: "1 hour ago"
    },
    voicePhrase: {
      ar: "تبارك الله عليكم يا لعيالات! أول غرزة كروشي تعلمتها ف حياتي، شوفو الكسوة اللي صوبت لبنتي الصغيرة.",
      tmz: "Tbarkellah fellawent! Tawlaft n wefroukh inou s tixri tamezwarut.",
      fr: "Regardez ma toute première robe au crochet tricotée pour ma petite fille grâce aux leçons de la Maâlma !",
      en: "Look at my very first crochet dress knitted for my little girl using the Maâlma's tactile guide!"
    }
  },
  {
    id: 'post-2',
    authorName: 'Malika Ait Ouargh',
    authorRole: 'rural',
    authorLocation: 'Imilchil 🛖',
    imageUrl: 'https://images.unsplash.com/photo-1528892951291-001cc1009a0c?w=450&auto=format&fit=crop&q=80',
    category: 'tissage',
    likes: 89,
    cheersCount: 57,
    timeAgo: {
      ar: "البارح مع العشية",
      tmz: "Idgam d tmeddit",
      fr: "Hier soir",
      en: "Yesterday evening"
    },
    voicePhrase: {
      ar: "الزربية الأمازيغية ديالي واجدة دابا للبيع! تعلمت نجمع خيوط المنسج خطوة خطوة، هاد اللوحة تخدمت باليد.",
      tmz: "Tazribt inou t'mda s lmensaj d lmounassama n ssof tmda.",
      fr: "Mon tapis en laine pure de l'Atlas est enfin prêt ! J'ai appris à monter le métier à tisser traditionnel par commande vocale.",
      en: "My pure Atlas wool rug is finished! I learned to mount the traditional loom block entirely via voice commands."
    }
  },
  {
    id: 'post-3',
    authorName: 'Anass El Fassi',
    authorRole: 'etudiant',
    authorLocation: 'Fès 🏺',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=450&auto=format&fit=crop&q=80',
    category: 'broderie',
    likes: 24,
    cheersCount: 12,
    timeAgo: {
      ar: "يومين هادي",
      tmz: "Sin wussan",
      fr: "Il y a 2 jours",
      en: "2 days ago"
    },
    voicePhrase: {
      ar: "أنا طالب و هاد البلاتفورم عاونتني نتعلم طرز الغرزة الفاسية الذهبية باش نخلص قرايتي. شكرا بالزاف المعلمة فاطمة.",
      tmz: "Tlemmedgh tarzgout n Fâs bac ad arigh s l'bureau inou.",
      fr: "Je suis étudiant et j'ai appris la broderie de Fès dorée pour financer mes études. C'est incroyable !",
      en: "I am a student and learned Fès embroidery patterns to finance my semesters. Amazing platform !"
    }
  },
  {
    id: 'post-4',
    authorName: 'Aicha Sefrioui',
    authorRole: 'jeune',
    authorLocation: 'Sefrou 🍒',
    imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=450&auto=format&fit=crop&q=80',
    category: 'couture',
    likes: 67,
    cheersCount: 46,
    timeAgo: {
      ar: "دقيقة وحدة هادي",
      tmz: "Yan dqiqa",
      fr: "Il y a 1 minute",
      en: "Just now"
    },
    voicePhrase: {
      ar: "ماكانش عندي خدمة، دابا وليت نبيع القفاطن المطروزة بيدي من الدار بلما نخرج. تهنيت من التنقال.",
      tmz: "Awid ghassa caftan n l'yed d n tlemmedgh f taddart inou.",
      fr: "Je n'avais pas de travail, maintenant je vends des caftans perlés faits-maison sans voyage fatiguant !",
      en: "I didn't have a job, now I stitch and sell beaded caftans directly from home with zero traveling cost."
    }
  }
];

export const CommunityCenter: React.FC<CommunityCenterProps> = ({ currentLanguage }) => {
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'foyer' | 'rural' | 'jeune' | 'etudiant'>('all');
  
  // Custom Voice Recording checkin simulation states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVoiceText, setRecordedVoiceText] = useState<string>('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<'foyer' | 'rural' | 'etudiant' | 'jeune'>('foyer');
  const [selectedCategory, setSelectedCategory] = useState<'crochet' | 'broderie' | 'tissage' | 'couture'>('crochet');
  const [authorName, setAuthorName] = useState<string>('');
  const [authorLoc, setAuthorLoc] = useState<string>('');
  
  // Audio state feedback
  const [activeSpeechPostId, setActiveSpeechPostId] = useState<string | null>(null);

  const playPostAudio = async (post: CommunityPost) => {
    setActiveSpeechPostId(post.id);
    const textMsg = `${post.authorName} : ${post.voicePhrase[currentLanguage]}`;
    await speakText(textMsg, currentLanguage);
    setActiveSpeechPostId(null);
  };

  // Moroccan iconic cheer trigger
  const triggerZghroutaCheer = async (postId: string) => {
    // 1. Increment on frontend state
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, cheersCount: p.cheersCount + 1, likes: p.likes + 1 };
      }
      return p;
    }));

    // 2. Synthesize joyful traditional ululation cheer prayer
    let zghroutaSlog = "";
    if (currentLanguage === AppLanguage.DARIJA) {
      zghroutaSlog = "يووو يو يو يووو! الله يعطيك الصحة يا معلمة! تبارك الله عليك وصلاة على النبي!";
    } else if (currentLanguage === AppLanguage.TAMAZIGHT) {
      zghroutaSlog = "Yuyuyuyuyuy! Tanemmirt nnek a tasebbaht, aflla n lmellem.";
    } else if (currentLanguage === AppLanguage.FRENCH) {
      zghroutaSlog = "You-You-You-You ! Félicitations chaleureuses, que Dieu bénisse vos mains de Maâlma !";
    } else {
      zghroutaSlog = "Yoo-Yoo-Yoo-Yoo-Yoo! Amazing handcrafted work, blessings of the Maâlma upon your fingers!";
    }
    
    await speakText(zghroutaSlog, currentLanguage);
  };

  const startVoiceRecordingSim = () => {
    setIsRecording(true);
    speakText(
      currentLanguage === AppLanguage.DARIJA 
        ? "أنا كانسمعك دابا، هضري و عاودي لينا على المنتوج اللي خدمتي بيدك." 
        : "Je vous écoute, décrivez votre création textile à haute voix.",
      currentLanguage
    );

    // After 4.5 seconds auto wrap simulation
    setTimeout(() => {
      setIsRecording(false);
      const randomTexts: Record<AppLanguage, string[]> = {
        [AppLanguage.DARIJA]: [
          "شوفي يا أختي، هادي شيلان كروشي دافيين صاوبتهم بالصوف الحرة ديال تافراوت.",
          "كملت اليوم الزواقة د الوردة د الأطلس فالجلابة ديالي، الخدمة جات فنة.",
          "صاوبت هاد اللعبة ب خيط الكروشي الغليظ ف جوج سوايع د المكالمة، مدرسة واعرة."
        ],
        [AppLanguage.TAMAZIGHT]: [
          "Tazribt tacelhyt s ssof tamezwarut tmda.",
          "Kmmelgh tajellabt n tixri n imilchil, flla tamaynut.",
          "Tawlaft d krouchi n drous tamezwarut isehlan bzzaf."
        ],
        [AppLanguage.FRENCH]: [
          "J'ai fabriqué de jolies mitaines en laine jaune d'Ouzoud ce matin, le point est super souple !",
          "C'est ma première broderie florale sur de la soie traditionnelle marocaine, j'adore le relief.",
          "Inspirée par la Maâlma Fatima, j'ai confectionné ces dessous de tasse traditionnels."
        ],
        [AppLanguage.ENGLISH]: [
          "I handcrafted these cute crochet coasters this morning, the double loop stitch is super elastic!",
          "First time experimenting with Moroccan Berber embroidery patterns, lovely texture.",
          "Under the guidance of Maâlma Fatima, I finally completed my first wool sash garment."
        ]
      };

      const options = randomTexts[currentLanguage] || randomTexts[AppLanguage.FRENCH];
      const selectedStr = options[Math.floor(Math.random() * options.length)];
      setRecordedVoiceText(selectedStr);

      speakText(
        currentLanguage === AppLanguage.DARIJA 
          ? "مزيان! سجلت الهضرة ديالك." 
          : "Super ! J'ai bien enregistré votre voix.",
        currentLanguage
      );
    }, 4500);
  };

  const submitCustomPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !recordedVoiceText) {
      speakText("S'il vous plaît, dites votre nom complet et enregistrez votre message.", currentLanguage);
      return;
    }

    const newPost: CommunityPost = {
      id: `custom-post-${Date.now()}`,
      authorName: authorName,
      authorRole: selectedRole,
      authorLocation: authorLoc.trim() || (currentLanguage === AppLanguage.DARIJA ? "مغربية فخورة" : "Maroc"),
      imageUrl: selectedCategory === 'crochet' 
        ? 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=450&auto=format&fit=crop&q=80'
        : selectedCategory === 'broderie'
        ? 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=450&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1528892951291-001cc1009a0c?w=450&auto=format&fit=crop&q=80',
      category: selectedCategory,
      likes: 1,
      cheersCount: 0,
      timeAgo: {
        ar: "دابا عاد",
        tmz: "Ghassa",
        fr: "À l'instant",
        en: "Just now"
      },
      voicePhrase: {
        ar: recordedVoiceText,
        tmz: recordedVoiceText,
        fr: recordedVoiceText,
        en: recordedVoiceText
      }
    };

    setPosts([newPost, ...posts]);
    setIsRecordModalOpen(false);
    setAuthorName('');
    setAuthorLoc('');
    setRecordedVoiceText('');
    
    speakText(
      currentLanguage === AppLanguage.DARIJA 
        ? "فرحنا بيك بالزاف! التشاركية تبارطاجات دابا ف الساحة." 
        : "Votre publication vocale est partagée sur le mur d'entraide !",
      currentLanguage
    );
  };

  const getRoleLabel = (role: 'foyer' | 'rural' | 'etudiant' | 'jeune') => {
    switch (role) {
      case 'foyer':
        return currentLanguage === AppLanguage.DARIJA ? "🏠 صانع(ة) بالبيت" : "🏠 Artisan(e) au Foyer";
      case 'rural':
        return currentLanguage === AppLanguage.DARIJA ? "🏔️ مناطق قروية" : "🏔️ Artisan(e) Rural(e)";
      case 'etudiant':
        return currentLanguage === AppLanguage.DARIJA ? "🎒 طالبة / طالب" : "🎒 Étudiante / Étudiant";
      case 'jeune':
        return currentLanguage === AppLanguage.DARIJA ? "🚀 باحث(ة) عن الصنعة" : "🚀 Jeune en Apprentissage";
    }
  };

  const getRoleTagColor = (role: 'foyer' | 'rural' | 'etudiant' | 'jeune') => {
    switch (role) {
      case 'foyer': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'rural': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'etudiant': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'jeune': return 'bg-teal-100 text-teal-800 border-teal-200';
    }
  };

  const filteredPosts = activeFilter === 'all' 
    ? posts 
    : posts.filter(p => p.authorRole === activeFilter);

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-1" id="community-hub">
      
      {/* Dynamic Intro */}
      <div className="text-center space-y-3 mb-8">
        <AudioHover phraseKey="btn_learn" lang={currentLanguage} showIcon={false}>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            🤝 
            <span>
              {currentLanguage === AppLanguage.DARIJA ? "ساحة المعلمات والتضامن" :
               currentLanguage === AppLanguage.TAMAZIGHT ? "Agraw n l'Maâlmates" :
               currentLanguage === AppLanguage.FRENCH ? "Espace Entraide & Coopératives" :
               "Mutual-Aid Artisan Wall"}
            </span>
          </h2>
        </AudioHover>
        
        <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
          {currentLanguage === AppLanguage.DARIJA ? "جيرة الحرفيات تواصلو بالقرص المباشر والسمع بلا كتابة، عاونو بعضياتكم ب تفاعل الزغاريد والتشجيع !" :
           currentLanguage === AppLanguage.FRENCH ? "Échangez avec d'autres artisanes marocaines : écoutez leurs messages vocaux croisés et envoyez des encouragements oraux d'un seul clic tactile (You-You) !" :
           "Support each other: click to listen to voice check-ins from mothers and student artisans, and fire Moroccan congratulations."}
        </p>

        {/* Big tactile checkout block to add your voice post */}
        <button
          onClick={() => {
            setIsRecordModalOpen(true);
            speakText("Marhaban! Tsajli post ssaouty dyalk s'tefrah.", currentLanguage);
          }}
          className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-black rounded-2xl flex items-center gap-3.5 mx-auto shadow-lg transition-transform hover:scale-105 group border-2 border-amber-400 cursor-pointer text-sm"
        >
          <div className="w-8 h-8 rounded-full bg-slate-950 text-amber-500 flex items-center justify-center animate-pulse">
            <Mic size={16} />
          </div>
          <span className="font-sans">
            {currentLanguage === AppLanguage.DARIJA ? "سجلي زواقتك الجديدة بالصوت 🗣️" : "Publier ma Création Vocale 🗣️"}
          </span>
        </button>
      </div>

      {/* FILTER BUTTONS (HUGE AND ACCESSIBLE) */}
      <div className="flex flex-wrap gap-2 justify-center mb-8 bg-slate-50 p-2 rounded-2xl max-w-3xl mx-auto border border-gray-100">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-5 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-200 cursor-pointer ${
            activeFilter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          {currentLanguage === AppLanguage.DARIJA ? "الكل" : "🌍 Tout"}
        </button>
        <button
          onClick={() => setActiveFilter('foyer')}
          className={`px-5 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-200 cursor-pointer ${
            activeFilter === 'foyer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-indigo-100/50 hover:text-indigo-800'
          }`}
        >
          {currentLanguage === AppLanguage.DARIJA ? "صناع المنازل" : "🏠 Artisan(e) Foyer"}
        </button>
        <button
          onClick={() => setActiveFilter('rural')}
          className={`px-5 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-200 cursor-pointer ${
            activeFilter === 'rural' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-amber-100/50 hover:text-amber-800'
          }`}
        >
          {currentLanguage === AppLanguage.DARIJA ? "القرية والريف" : "🏔️ Zones Rurales"}
        </button>
        <button
          onClick={() => setActiveFilter('etudiant')}
          className={`px-5 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-200 cursor-pointer ${
            activeFilter === 'etudiant' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-blue-100/50 hover:text-blue-800'
          }`}
        >
          {currentLanguage === AppLanguage.DARIJA ? "الطلبة" : "🎒 Étudiants"}
        </button>
        <button
          onClick={() => setActiveFilter('jeune')}
          className={`px-5 py-3 rounded-xl text-xs font-black tracking-wide uppercase transition-all duration-200 cursor-pointer ${
            activeFilter === 'jeune' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-teal-100/50 hover:text-teal-800'
          }`}
        >
          {currentLanguage === AppLanguage.DARIJA ? "الباحثين عن عمل" : "🚀 Recherche d'Emploi"}
        </button>
      </div>

      {/* RENDER POSTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-3xl border border-gray-100 p-5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative"
          >
            {/* Top Info section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-sm border border-white">
                  {post.authorName[0]}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1">
                    {post.authorName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin size={11} className="text-amber-500 shrink-0" />
                    <span className="font-medium truncate">{post.authorLocation}</span>
                    <span className="font-mono text-[9px] font-bold text-slate-300">|</span>
                    <span className="text-[10px] text-gray-400 font-bold">{post.timeAgo[currentLanguage]}</span>
                  </div>
                </div>
              </div>

              {/* Tag role representation */}
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getRoleTagColor(post.authorRole)}`}>
                {getRoleLabel(post.authorRole)}
              </span>
            </div>

            {/* Middle Image & Interactive voice player */}
            <div className="relative rounded-2xl h-52 overflow-hidden bg-slate-950 group/img">
              <img
                src={post.imageUrl}
                alt={post.authorName}
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 brightness-95"
                referrerPolicy="no-referrer"
              />

              {/* Beautiful Wool Overlay indicator */}
              <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-lg text-[9px] font-mono tracking-widest font-black uppercase">
                {post.category}
              </span>

              {/* Micro-Controller Play Voice Note Button - huge and visual in center */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                <button
                  onClick={() => playPostAudio(post)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
                    activeSpeechPostId === post.id 
                      ? 'bg-emerald-500 text-white rotate-12 scale-110' 
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950 hover:scale-105'
                  }`}
                >
                  {activeSpeechPostId === post.id ? (
                    <div className="flex items-center gap-0.5 animate-pulse">
                      <div className="w-1.5 h-6 bg-white rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-8 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  ) : (
                    <Play size={28} className="ml-1" />
                  )}
                </button>
              </div>

              {/* Sub-label explaining that clicking play synthesizes speech guidance */}
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md p-1.5 px-3 rounded-lg border border-white/10 text-white font-bold text-[10px] tracking-wide flex items-center gap-1.5 select-none">
                <Smartphone size={10} className="text-amber-500" />
                <span>{currentLanguage === AppLanguage.DARIJA ? "سمعي الحكاية" : "Écouter l'Artisane"}</span>
              </div>
            </div>

            {/* Translated transcription snippet for literate children/students assisting their parents */}
            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl text-left">
              <span className="text-[9px] tracking-wider font-extrabold uppercase text-amber-700 font-mono block mb-1">
                📝 {currentLanguage === AppLanguage.DARIJA ? "ترجمة كتابية" : "Transcription interactive"}
              </span>
              <p className="text-xs text-amber-950 font-bold leading-relaxed line-clamp-3">
                "{post.voicePhrase[currentLanguage]}"
              </p>
            </div>

            {/* Interactive Actions - Beautiful Moroccan "Zghrouta" cheerleader */}
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-700">
                  <Heart size={14} className="text-rose-500 fill-rose-500" />
                  <span className="text-xs font-mono font-black">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700">
                  <Flame size={14} className="text-orange-500" />
                  <span className="text-xs font-mono font-black">{post.cheersCount} YouYou</span>
                </div>
              </div>

              {/* Celebration Cheering Button */}
              <button
                onClick={() => triggerZghroutaCheer(post.id)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 text-white hover:text-white rounded-xl shadow-md font-black text-[11px] tracking-wide cursor-pointer transition-transform hover:scale-95 flex items-center gap-1.5 uppercase border-b-2 border-emerald-700"
              >
                <Sparkles size={12} className="animate-spin" />
                <span>
                  {currentLanguage === AppLanguage.DARIJA ? "زغرتي ليها 🧕" : "Soutenir (YouYou) 🧕"}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* RECORD POST CHECK-IN LIGHTBOX SIMULATION */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-center text-slate-950 relative">
              <h3 className="text-lg font-black tracking-tight">
                {currentLanguage === AppLanguage.DARIJA ? "مرحبا بك فالساحة التشاركية" : "Ajouter votre voix au Mur d'Entraide"}
              </h3>
              <p className="text-xs font-bold opacity-90 mt-1">
                {currentLanguage === AppLanguage.DARIJA ? "بلا ما تكتبي، وركي على الميكرو العريض و قولي لينا زواقتك !" : "Partagez votre réussite artisane en enregistrant une note vocale."}
              </p>
            </div>

            <form onSubmit={submitCustomPost} className="p-6 space-y-5 text-center">

              {/* Giant Recording Mic button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={startVoiceRecordingSim}
                  className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
                    isRecording 
                      ? 'bg-rose-500 text-white animate-ping scale-110' 
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-600 border-4 border-amber-300'
                  }`}
                >
                  <Mic size={40} className={isRecording ? "animate-pulse" : ""} />
                </button>
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider block font-mono">
                  {isRecording 
                    ? (currentLanguage === AppLanguage.DARIJA ? "جاري الاستماع... هضري دابا" : "Listening... Talk now") 
                    : (currentLanguage === AppLanguage.DARIJA ? "بركي هنا وبداي الهضرة 💡" : "Cliquez pour enregistrer votre voix 💡")
                  }
                </span>
              </div>

              {/* Spoken voice feedback summary box */}
              {recordedVoiceText && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 text-left text-xs text-emerald-950 font-bold space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-700 font-mono font-black flex items-center gap-1.5">
                    <Check size={12} />
                    {currentLanguage === AppLanguage.DARIJA ? "تأكيد الصوت الذكي" : "Texte compris de votre voix"}
                  </span>
                  <p className="leading-relaxed">
                    "{recordedVoiceText}"
                  </p>
                </div>
              )}

              {/* Informative form fields */}
              <div className="space-y-3.5 pt-2 border-t border-gray-100 text-left">
                {/* 1. Name */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700">
                    {currentLanguage === AppLanguage.DARIJA ? "الاسم ديالك لحلو :" : "Nom complet :"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={currentLanguage === AppLanguage.DARIJA ? "مثال: فاطمة الزهراء" : "Ex: Fatima Zehra"}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                {/* 2. Location */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700">
                    {currentLanguage === AppLanguage.DARIJA ? "القرية أو المدينة ديالك :" : "Adresse / Ville / Village :"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={currentLanguage === AppLanguage.DARIJA ? "مثال: شفشاون" : "Ex: Chefchaouen, Tafraout, Imilchil"}
                    value={authorLoc}
                    onChange={(e) => setAuthorLoc(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                {/* 3. Category Choice (Using Big Emojis) */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700">
                    {currentLanguage === AppLanguage.DARIJA ? "شنو كاطرزي ديما :" : "Discipline artisanale :"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { id: 'crochet', val: '🧶' },
                      { id: 'broderie', val: '🧵' },
                      { id: 'tissage', val: '🪵' },
                      { id: 'couture', val: '🏺' }
                    ] as const).map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`py-3.5 text-2xl rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          selectedCategory === cat.id 
                            ? 'bg-amber-500 border-amber-500 shadow-inner scale-105' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {cat.val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Target Group Category choice */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700">
                    {currentLanguage === AppLanguage.DARIJA ? "الوضعية ديالك :" : "Votre catégorie :"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'foyer', label: '🏠 Artisan(e) Foyer' },
                      { id: 'rural', label: '🏔️ Rural(e)' },
                      { id: 'etudiant', label: '🎒 Étudiant(e)' },
                      { id: 'jeune', label: '🚀 Jeune' }
                    ] as const).map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setSelectedRole(r.id)}
                        className={`py-2 px-3 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                          selectedRole === r.id 
                            ? 'bg-slate-900 text-white border-slate-950 scale-[1.02]' 
                            : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Command Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  {currentLanguage === AppLanguage.DARIJA ? "رجوع" : "Retour"}
                </button>
                <button
                  type="submit"
                  disabled={!recordedVoiceText || !authorName.trim()}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-white rounded-xl font-black text-xs cursor-pointer shadow-md"
                >
                  {currentLanguage === AppLanguage.DARIJA ? "نشر دابا" : "Publier ma Voix"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
