/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Course, AppLanguage, Kit } from '../types';
import { AudioHover } from './AudioHover';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  ArrowLeft, 
  Volume2, 
  Sparkles, 
  ShoppingBag, 
  Award, 
  CheckCircle2, 
  Layers, 
  Video, 
  PlusCircle, 
  Tag, 
  ExternalLink 
} from 'lucide-react';
import { speakText } from '../utils/speech';
import { fetchTutorials, fetchKits, addUserProduct } from '../lib/firebase';

interface LearnCenterProps {
  currentLanguage: AppLanguage;
  onAddToCart?: (kitId: string) => void;
}

export const LearnCenter: React.FC<LearnCenterProps> = ({ currentLanguage, onAddToCart }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedMetier, setSelectedMetier] = useState<'all' | 'crochet' | 'broderie' | 'tissage' | 'poterie'>('all');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1); // 1 = regular, 0.5 = slow motion
  const [activeTab, setActiveTab] = useState<'metiers' | 'path' | 'viewer'>('metiers');
  const [playerMode, setPlayerMode] = useState<'video' | 'simulation'>('video');
  const [stitchProgress, setStitchProgress] = useState<number>(0);
  const [marketplaceKits, setMarketplaceKits] = useState<Kit[]>([]);
  
  // Simulation and progress rewards
  const [isClassListingCompleted, setIsClassListingCompleted] = useState<boolean>(false);
  const [xpPoints, setXpPoints] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Fetch courses and kits from Firebase Firestore
  useEffect(() => {
    fetchTutorials()
      .then((data) => {
        setCourses(data);
      })
      .catch((err) => console.error("Error fetching courses", err));

    fetchKits()
      .then(data => setMarketplaceKits(data))
      .catch((err) => console.error("Error fetching marketplace kits", err));
  }, []);

  // Generic frame-rate simulation loops
  useEffect(() => {
    if (!isPlaying || activeTab !== 'viewer') {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setStitchProgress((prev) => {
        let increment = (deltaTime * 0.05) * animationSpeed;
        if (prev + increment >= 100) {
          return 0; // Rotate / Loop animation
        }
        return prev + increment;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, activeTab, animationSpeed]);

  const selectMetierType = (metier: 'all' | 'crochet' | 'broderie' | 'tissage' | 'poterie') => {
    setSelectedMetier(metier);
    setActiveTab('path');

    // Vocal prompt in Darija / French
    let metierMsg = "";
    if (metier === 'crochet') {
      metierMsg = currentLanguage === AppLanguage.DARIJA 
        ? "مزيان! اخترتي كروشي الصوف المعاصر. ها هو مسار التعلم خطوة بخطوة."
        : "Excellent choix ! Vous avez sélectionné le métier du Crochet. Apprenez à crocheter des mailles de A à Z.";
    } else if (metier === 'broderie') {
      metierMsg = currentLanguage === AppLanguage.DARIJA
        ? "مرحبا بيك في الطرز الفاسي ب خيط الحرير الملكي. تبعي الخطوات لتصنعي وسادة فاسية."
        : "Bienvenue dans l'atelier de Broderie de Fès. Apprenez à tracer le fil de soie royal fassi.";
    } else if (metier === 'tissage') {
      metierMsg = currentLanguage === AppLanguage.DARIJA
        ? "هذا تيسيج الزربية الأمازيغية د الأطلس الكبير. تعلّمي كيفاش تخدمي المنسج وتتحكمي فالخيط."
        : "Découvrez l'art du Tissage de tapis berbère. Apprenez à tendre les fils et à assembler la laine pure d'羊.";
    } else if (metier === 'poterie') {
      metierMsg = currentLanguage === AppLanguage.DARIJA
        ? "فن الفخار و الطين د مدينة سلا وآسفي. بركي على مسار التشكيل باش دوري لولب الطين."
        : "Bienvenue dans l'art de la Poterie d'Argile de Safi. Apprenez à tourner et modeler un tajine en terre cuite.";
    } else {
      metierMsg = "Voici tous nos métiers d'artisanat marocain.";
    }
    speakText(metierMsg, currentLanguage);
  };

  const selectCourse = (course: Course) => {
    setActiveCourse(course);
    setCurrentStepIdx(0);
    setActiveTab('viewer');
    setIsPlaying(true);
    setStitchProgress(0);
    setIsClassListingCompleted(false);

    // Read details of selected course in current language
    const title = course.title[currentLanguage];
    const desc = course.description[currentLanguage];
    const triggerMsg = `${title}. ${desc}.`;
    speakText(triggerMsg, currentLanguage);
  };

  const speakActiveStep = () => {
    if (!activeCourse) return;
    const step = activeCourse.steps[currentStepIdx];
    if (step) {
      speakText(step.instruction[currentLanguage], currentLanguage);
    }
  };

  useEffect(() => {
    if (activeCourse && activeTab === 'viewer') {
      speakActiveStep();
    }
  }, [currentStepIdx, activeCourse, activeTab]);

  const goNextStep = () => {
    if (!activeCourse) return;
    if (currentStepIdx < activeCourse.steps.length - 1) {
      setCurrentStepIdx((p) => p + 1);
    } else {
      // Completed last video lesson step: Speak a congratulations statement detailing the practical marketplace exercise!
      let congratulation = "";
      if (currentLanguage === AppLanguage.DARIJA) {
        congratulation = "تبارك الله عليك يا لالة المعلمة! كملتي الدروس البصرية بنجاح. دابا سيري لتحت باش تشوفي تمرين التطبيق في الماركت وتبيعي أول قطعة ديالك!";
      } else if (currentLanguage === AppLanguage.FRENCH) {
        congratulation = "Félicitations, vous venez de compléter la leçon théorique ! Passez maintenant à l'exercice d'application ci-dessous pour commander votre kit de laine ou inscrire votre création sur le marché du souk !";
      } else {
        congratulation = "Splendid job! You finished the video guides. Scroll down to take the practical challenge, order your craft supply kits or post your finished creation to the live marketplace!";
      }
      speakText(congratulation, currentLanguage);
      
      // Register completion
      if (!completedLessons.includes(activeCourse.id)) {
        setCompletedLessons([...completedLessons, activeCourse.id]);
        setXpPoints((prev) => prev + 35);
      }
    }
  };

  const goPrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((p) => p - 1);
    }
  };

  // Perform a Live listing of their completed exam craft to the peer-to-peer souk
  const handleListingToSouk = async () => {
    if (!activeCourse || !activeCourse.exercise) return;
    
    const exercise = activeCourse.exercise;
    
    // Choose product metadata depending on language
    let frenchName = "Création d'Apprentissage";
    let moroccanDesc = "عينة مصنوعة يدوياً بواسطة معلمة متدربة في أكاديمية بي.";
    
    if (activeCourse.id === 'course-1' || activeCourse.id === 'course-2' || activeCourse.id === 'course-3') {
      frenchName = "Napperon d'Artifice Dentelle - Fait Main";
    } else if (activeCourse.id === 'course-4') {
      frenchName = "Housse de Coussin Fès Pur Soie";
    } else if (activeCourse.id === 'course-5') {
      frenchName = "Mini Tapis de l'Atlas Royal Mur";
    } else if (activeCourse.id === 'course-6') {
      frenchName = "Authentique Tajine de Cuisson en Argile";
    }

    const payload = {
      title: frenchName,
      price: exercise.earnPrice,
      description: currentLanguage === AppLanguage.DARIJA 
        ? "قطعة غاية في الجمال مخدومة باليد والحرير من خريجة أكاديمية المعلمات."
        : "Magnifique pièce d'artisanat marocain fabriquée à la main par une artisane certifiée.",
      imageUrl: activeCourse.id === 'course-4' 
        ? "https://images.unsplash.com/photo-1605050295217-d7cf3f149c25?auto=format&fit=crop&q=80&w=600" // embroidered textile
        : activeCourse.id === 'course-5'
        ? "https://images.unsplash.com/photo-1598257006458-087169a1f08d?auto=format&fit=crop&q=80&w=600" // carpet
        : activeCourse.id === 'course-6'
        ? "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&q=80&w=600" // pottery tajine
        : "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=600", // crochet
      sellerName: "Artisane المعلمة (Aït Melloul)",
      voiceMemoUrl: ""
    };

    try {
      const saved = await addUserProduct(payload);
      if (saved) {
        setIsClassListingCompleted(true);
        setXpPoints((prev) => prev + 50);
        
        let successMsg = currentLanguage === AppLanguage.DARIJA
          ? `يا سلام! تهانينا، تم إدراج قطعتك بنجاح في سوق التعاونية ب ثمن ${exercise.earnPrice} درهم! تبارك الله عليك ونلت +50 نقطة تجربة.`
          : `Mabrouk ! Votre œuvre a été répertoriée dans le souk solidaire au prix de ${exercise.earnPrice} DH ! Vous obtenez +50 XP d'Artisane.`;
        speakText(successMsg, currentLanguage);
      }
    } catch (err) {
      console.error("Listing product failed", err);
    }
  };

  // Safe Cart additive wrapper
  const triggerAddToCart = (kitId: string) => {
    if (onAddToCart) {
      onAddToCart(kitId);
      
      let speechMsg = currentLanguage === AppLanguage.DARIJA
        ? "راني زدت صندوق الصوف واللوازم نيشان للسلة ديالك! تقدري دوزي للشرى فاش كتسالي."
        : "Le Kit de matières premières de cet exercice a été ajouté avec succès à votre panier d'achat !";
      speakText(speechMsg, currentLanguage);
    }
  };

  // CUSTOM SVG SIMULATIONS depending on selected métier
  const renderStitchAnimation = () => {
    if (!activeCourse) return null;
    const currentStep = activeCourse.steps[currentStepIdx];
    const animKey = currentStep?.animationKey || 'wrap';
    const craftType = activeCourse.metier || 'crochet';

    // Interactive trigonometric offset to make movements responsive to isPlaying
    const cycleWave = Math.sin((stitchProgress * Math.PI) / 50);
    const waveOffset = cycleWave * 15;
    const rotateAngle = stitchProgress * 3.6; // For rotating clay pottery wheel

    return (
      <div className="w-full h-72 bg-slate-900 rounded-3xl relative overflow-hidden flex flex-col justify-center items-center shadow-inner border-4 border-amber-600/25">
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:25px_25px] opacity-15"></div>

        {/* 1. CROCHET TEXTILE SIMULATION */}
        {craftType === 'crochet' && (
          <svg viewBox="0 0 400 250" className="w-full h-full max-w-[340px] drop-shadow-[0_4px_25px_rgba(247,148,29,0.3)] select-none">
            {animKey === 'wrap-finger' && (
              <g>
                <circle cx="150" cy="130" r="40" className="stroke-stone-500/30 fill-none" strokeWidth="8" strokeDasharray="5" />
                <text x="110" y="195" className="fill-stone-500 text-[10px] font-black tracking-widest font-mono uppercase">صبع اليد / Doigt</text>
              </g>
            )}

            {/* active crochet yellow thread */}
            <path
              d={
                animKey === 'wrap-finger'
                  ? `M 50,130 Q 150,${70 + waveOffset} 250,130 T 350,130`
                  : animKey === 'pull-loop'
                  ? `M 50,110 Q 180,${140 + waveOffset} 240,110 T 350,70`
                  : `M 50,120 Q 180,${70 + waveOffset} 210,120 C 240,${150 - (stitchProgress/100)*25} 280,120 350,95`
              }
              fill="none"
              stroke="#f59e0b" // beautiful wool yellow
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* Thread lock indicators */}
            <circle cx="280" cy="110" r="12" className="stroke-amber-400 fill-none" strokeWidth="5" opacity="0.5" />
            <circle cx="310" cy="100" r="12" className="stroke-amber-500 fill-none" strokeWidth="5" opacity="0.5" />

            {/* Crochet needle hook */}
            <g
              transform={
                animKey === 'wrap-finger'
                  ? `translate(${180 + Math.sin(stitchProgress/10)*15}, ${70 + Math.cos(stitchProgress/10)*12}) rotate(-35)`
                  : animKey === 'pull-loop'
                  ? `translate(${150 + (stitchProgress / 100) * 85}, ${90 - waveOffset}) rotate(-45)`
                  : `translate(${180 - waveOffset}, 100) rotate(-40)`
              }
            >
              <rect x="-80" y="-3" width="120" height="9" rx="3" fill="#d97706" />
              <path d="M 40,-2 L 75,-2 C 85,-2 88,3 85,8 C 82,12 76,8 75,5 C 73,3 65,3 65,3" fill="none" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
              {(animKey === 'pull-loop' || stitchProgress > 45) && (
                <circle cx="80" cy="5" r="8" className="fill-amber-500 stroke-amber-400" strokeWidth="2" />
              )}
            </g>
          </svg>
        )}

        {/* 2. BRODERIE DE FÈS (EMBROIDERY COUSSIN) SIMULATION */}
        {craftType === 'broderie' && (
          <svg viewBox="0 0 400 250" className="w-full h-full max-w-[340px] drop-shadow-[0_4px_25px_rgba(225,29,72,0.25)] select-none">
            {/* Fez Wood Hoop Frame */}
            <circle cx="200" cy="120" r="75" className="stroke-amber-700 fill-orange-50/5" strokeWidth="10" />
            <circle cx="200" cy="120" r="81" className="stroke-amber-800/60 fill-none" strokeWidth="2" />
            
            {/* Background pre-drawn floral layout dotted lines */}
            <polygon points="170,120 200,90 230,120 200,150" className="stroke-indigo-300 fill-none" strokeWidth="2" strokeDasharray="4" />
            <polygon points="145,120 200,70 255,120 200,170" className="stroke-indigo-200 fill-none" strokeWidth="1.5" strokeDasharray="3" />

            {/* Completed embroidery thread segments */}
            <polygon 
              points="170,120 200,90 230,120 200,150" 
              className="stroke-rose-600 fill-rose-50/10" 
              strokeWidth="6" 
              strokeLinejoin="round"
              opacity={stitchProgress > 30 ? 0.9 : 0.4} 
            />

            {/* Active stitch point where needle dives */}
            {stitchProgress > 50 && (
              <g transform="translate(200, 90)">
                <circle cx="0" cy="0" r="6" className="fill-amber-400 stroke-amber-200 animate-ping" strokeWidth="2" />
                <circle cx="0" cy="0" r="4.5" className="fill-amber-500" />
              </g>
            )}

            {/* Embroidery Metal Needle going vertical */}
            <g transform={`translate(${190 + cycleWave * 8}, ${80 + (stitchProgress / 100) * 80}) rotate(40)`}>
              {/* Shiny metal needle body */}
              <line x1="-10" y1="-45" x2="30" y2="-5" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
              {/* Sharp tip */}
              <polygon points="27,-8 34,-3 26,-2" fill="#94a3b8" />
              {/* Needle eye containing gorgeous red silk yarn */}
              <circle cx="-6" cy="-41" r="1.5" fill="#f43f5e" />
              <path d="M -15,-55 Q -10,-45 -6,-41 T 20,-30" fill="none" stroke="#f43f5e" strokeWidth="3" />
            </g>

            <text x="135" y="215" className="fill-slate-400 text-[9px] font-bold tracking-wider font-mono uppercase">
              Tambour n'Akchoud / قرص الطرز
            </text>
          </svg>
        )}

        {/* 3. TISSAGE DE TAPIS (RUG LOOMING) SIMULATION */}
        {craftType === 'tissage' && (
          <svg viewBox="0 0 400 250" className="w-full h-full max-w-[340px] drop-shadow-[0_4px_25px_rgba(249,115,22,0.3)] select-none">
            {/* Loom wooden bars */}
            <rect x="70" y="25" width="260" height="15" rx="3" fill="#78350f" />
            <rect x="70" y="200" width="260" height="15" rx="3" fill="#78350f" />

            {/* Vertical Warp strings thread */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <line
                key={i}
                x1={95 + i * 23}
                y1="40"
                x2={95 + i * 23}
                y2="200"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="4,2"
                opacity="0.6"
              />
            ))}

            {/* Completed woven bottom layers (Atlas geom pattern) */}
            <path d="M 95,160 L 302,160 L 302,200 L 95,200 Z" fill="url(#berberPattern)" opacity="0.8" />
            <line x1="95" y1="160" x2="302" y2="160" stroke="#ea580c" strokeWidth="8" strokeLinecap="round" />

            {/* Moving active shuttle sliding golden thread slider */}
            <g transform={`translate(${75 + (stitchProgress / 100) * 190}, 145)`}>
              {/* Shuttle boat case */}
              <path d="M -20,5 L 50,5 L 60,-5 L 50,-15 L -20,-15 L -30,-5 Z" fill="#d97706" stroke="#92400e" strokeWidth="2" />
              {/* Yarn wound inside the shuttle */}
              <ellipse cx="15" cy="-5" rx="25" ry="6" fill="#f59e0b" />
              {/* Back trailing golden yarn strand */}
              <path d="M -25,-5 Q -60,${10 + waveOffset} -90,-10" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Comb indicator pressing down vertical */}
            {animKey === 'snug-knot' && (
              <g transform="translate(200, 110)">
                <rect x="-45" y="-15" width="90" height="30" rx="4" fill="#a16207" />
                {[...Array(9)].map((_, idx) => (
                  <line key={idx} x1={-35 + idx * 9} y1="15" x2={-35 + idx * 9} y2="35" stroke="#334155" strokeWidth="2.5" />
                ))}
                <text x="-38" y="2" className="fill-white text-[8px] font-black font-mono tracking-widest uppercase">PEIGNE / مشط</text>
              </g>
            )}

            <defs>
              <pattern id="berberPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="#ea580c" />
                <path d="M 0,20 L 20,0 L 40,20 L 20,40 Z" fill="#9a3412" />
                <polygon points="12,20 20,12 28,20 20,28" fill="#f59e0b" />
                <circle cx="20" cy="20" r="3" fill="#fff" />
              </pattern>
            </defs>
          </svg>
        )}

        {/* 4. POTERIE & ARGILE DE SAFI (POTTERY CYLINDER) SIMULATION */}
        {craftType === 'poterie' && (
          <svg viewBox="0 0 400 250" className="w-full h-full max-w-[340px] drop-shadow-[0_4px_25px_rgba(217,119,6,0.35)] select-none">
            {/* Spinning metal base */}
            <ellipse cx="200" cy="200" rx="90" ry="16" className="fill-slate-700 stroke-slate-500" strokeWidth="4" />
            <ellipse cx="200" cy="195" rx="84" ry="12" className="fill-slate-600 stroke-slate-400" strokeWidth="2.5" />
            
            {/* Speed indicator lines radiating on the spinning disk */}
            <g transform={`rotate(${rotateAngle}, 200, 195)`}>
              <line x1="120" y1="195" x2="280" y2="195" stroke="#475569" strokeWidth="3" strokeDasharray="8,10" />
              <line x1="200" y1="184" x2="200" y2="206" stroke="#475569" strokeWidth="3" strokeDasharray="8,10" />
            </g>

            {/* Gray - Red Moroccan clay vase morphing based on stitch progress */}
            {animKey === 'wrap-finger' ? (
              // Initial thick mound
              <path 
                d="M 155,195 C 150,150 160,110 200,110 C 240,110 250,150 245,195 Z" 
                fill="#b45309" // Raw terra cotta mud brown color
                stroke="#d97706"
                strokeWidth="4"
              />
            ) : animKey === 'pull-loop' ? (
              // Emptying, heightening into a beautiful jar
              <path 
                d={`M 158,195 C 145,140 160,${95 + waveOffset} 185,${95 + waveOffset} L 215,${95 + waveOffset} C 240,${95 + waveOffset} 255,140 242,195 Z`} 
                fill="#a16207" // wet glaze look
                stroke="#d97706"
                strokeWidth="4"
              />
            ) : (
              // Polished Tajine with conical top cap form
              <g>
                {/* Traditional Tajine dish base */}
                <path d="M 140,195 C 140,175 160,170 200,170 C 240,170 260,175 260,195 Z" fill="#9a3412" stroke="#ea580c" strokeWidth="3.5" />
                {/* The conic lid being shaped dynamically */}
                <path 
                  d={`M 170,170 C 170,140 190,${85 + waveOffset} 195,${75 + waveOffset} L 205,${75 + waveOffset} C 210,${85 + waveOffset} 230,140 230,170 Z`} 
                  fill="#b45309" 
                  stroke="#fb923c" 
                  strokeWidth="3" 
                />
                <circle cx="200" cy={`${71 + waveOffset}`} r="7.5" fill="#f97316" />
              </g>
            )}

            {/* Hand fingers guiding lines (accessibility hint) */}
            <g opacity="0.6">
              <path d="M 120,125 Q 150,135 155,135" fill="none" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" />
              <path d="M 280,125 Q 250,135 245,135" fill="none" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" />
              <text x="110" y="225" className="fill-slate-450 text-[8px] font-black font-mono tracking-wider uppercase">
                Tour Rotatif / لولب الطين
              </text>
            </g>
          </svg>
        )}


      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-0 sm:px-4 lg:px-6">
      {/* 1. MÉTIERS SELECTION ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24,
        background: 'linear-gradient(135deg, #FAF5EE 0%, #F2E8DA 100%)',
        borderRadius: 'var(--r-xl)', padding: '20px', border: '1px solid rgba(184,82,48,0.10)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>🎓</span>
              <h1 style={{
                fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700,
                color: 'var(--pie-terra-dark)', lineHeight: 1.2, margin: 0,
              }}>
                {currentLanguage === AppLanguage.DARIJA ? 'مدرسة المعلمات' :
                 currentLanguage === AppLanguage.FRENCH ? 'Académie des Métiers' :
                 'Crafts Academy'}
              </h1>
              <Sparkles size={16} style={{ color: 'var(--pie-terra)', flexShrink: 0 }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--pie-brown-mid)', lineHeight: 1.5, margin: 0 }}>
              {currentLanguage === AppLanguage.DARIJA
                ? 'تعلّمي الصنعة المغربية خطوة بخطوة'
                : currentLanguage === AppLanguage.FRENCH
                ? 'Apprenez nos métiers ancestraux par guidage vocal & visuel'
                : 'Learn step-by-step with audio & visual guidance'}
            </p>
          </div>

          {/* XP Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--pie-terra)', color: '#fff',
            padding: '10px 16px', borderRadius: 'var(--r-lg)',
            flexShrink: 0, boxShadow: '0 4px 14px rgba(184,82,48,0.30)',
          }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.8 }}>
                {currentLanguage === AppLanguage.DARIJA ? 'رصيد' : 'Expérience'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-sans)' }}>
                {xpPoints} XP
                <span style={{ fontWeight: 500, fontSize: 11, opacity: 0.8, marginLeft: 4 }}>
                  Lv. {Math.floor(xpPoints / 100) + 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--pie-brown-mid)', marginBottom: 5 }}>
            <span>Niveau {Math.floor(xpPoints / 100) + 1}</span>
            <span>{xpPoints % 100}/100 XP</span>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${xpPoints % 100}%` }} />
          </div>
        </div>
      </div>

      {/* 1. MÉTIERS SELECTION ─────────────────────────────────────── */}
      {activeTab === 'metiers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fadeUp">

          {/* Label + title */}
          <div style={{ textAlign: 'center' }}>
            <span className="pie-badge badge-terra" style={{ marginBottom: 10, display: 'inline-flex' }}>
              {currentLanguage === AppLanguage.DARIJA ? 'اختر حرفتك' : 'Choisir un Métier'}
            </span>
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700,
              color: 'var(--pie-brown)', marginTop: 8, lineHeight: 1.3,
            }}>
              {currentLanguage === AppLanguage.DARIJA
                ? 'شنو بغيتي تتعلمي اليوم؟'
                : currentLanguage === AppLanguage.FRENCH
                ? "Quel métier souhaitez-vous apprendre ?"
                : 'Which craft will you master today?'}
            </h2>
          </div>

          {/* Metier Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }} className="stagger">

            {/* Crochet */}
            <button onClick={() => selectMetierType('crochet')} className="metier-card animate-fadeUp">
              <div style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 72, opacity: 0.07, pointerEvents: 'none' }}>🧶</div>
              <div className="metier-icon" style={{ background: 'rgba(184,82,48,0.12)' }}>🧶</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--pie-brown)', marginBottom: 4, lineHeight: 1.3 }}>
                  {currentLanguage === AppLanguage.DARIJA ? 'الكروشي العصري' : 'Crochet d\'Art'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--pie-brown-mid)', lineHeight: 1.5, margin: 0 }}>
                  {currentLanguage === AppLanguage.FRENCH
                    ? 'Maîtrisez nœuds & anneaux, confectionnez plaids et accessoires.'
                    : 'Knit patterns, blankets and modern accessories.'}
                </p>
              </div>
            </button>

            {/* Broderie */}
            <button onClick={() => selectMetierType('broderie')} className="metier-card animate-fadeUp">
              <div style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 72, opacity: 0.07, pointerEvents: 'none' }}>🪡</div>
              <div className="metier-icon" style={{ background: 'rgba(106,143,106,0.15)' }}>🪡</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--pie-brown)', marginBottom: 4, lineHeight: 1.3 }}>
                  {currentLanguage === AppLanguage.DARIJA ? 'طرز الغرزة الفاسية' : 'Broderie de Fès'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--pie-brown-mid)', lineHeight: 1.5, margin: 0 }}>
                  {currentLanguage === AppLanguage.FRENCH
                    ? 'Brodez motifs géométriques en fils de soie royaux fassis.'
                    : 'Fine silk embroidery on Fez-style cushions and napkins.'}
                </p>
              </div>
            </button>

            {/* Tissage */}
            <button onClick={() => selectMetierType('tissage')} className="metier-card animate-fadeUp">
              <div style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 72, opacity: 0.07, pointerEvents: 'none' }}>🛖</div>
              <div className="metier-icon" style={{ background: 'rgba(160,112,78,0.15)' }}>🛖</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--pie-brown)', marginBottom: 4, lineHeight: 1.3 }}>
                  {currentLanguage === AppLanguage.DARIJA ? 'نسج الزربية الأمازيغية' : 'Tissage de l\'Atlas'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--pie-brown-mid)', lineHeight: 1.5, margin: 0 }}>
                  {currentLanguage === AppLanguage.FRENCH
                    ? 'Montez votre trame et croisez les laines pour tisser des tapis berbères.'
                    : 'Weave geometric berber rugs on a traditional wood loom.'}
                </p>
              </div>
            </button>

            {/* Poterie */}
            <button onClick={() => selectMetierType('poterie')} className="metier-card animate-fadeUp">
              <div style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 72, opacity: 0.07, pointerEvents: 'none' }}>🏺</div>
              <div className="metier-icon" style={{ background: 'rgba(184,82,48,0.10)' }}>🏺</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--pie-brown)', marginBottom: 4, lineHeight: 1.3 }}>
                  {currentLanguage === AppLanguage.DARIJA ? 'فخار آسفي وسلا' : 'Poterie d\'Argile'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--pie-brown-mid)', lineHeight: 1.5, margin: 0 }}>
                  {currentLanguage === AppLanguage.FRENCH
                    ? 'Maîtrisez le tour rotatif pour façonner tajines et vases.'
                    : 'Mold Moroccan clay into beautiful functional pottery.'}
                </p>
              </div>
            </button>
          </div>

          {/* Expert tip card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(106,143,106,0.12) 0%, rgba(106,143,106,0.06) 100%)',
            border: '1px solid rgba(106,143,106,0.25)',
            borderRadius: 'var(--r-xl)', padding: '20px',
            display: 'flex', alignItems: 'flex-start', gap: 16,
          }}>
            <span style={{ fontSize: 36, flexShrink: 0 }}>👵</span>
            <div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 700, color: 'var(--pie-sage-dark)', marginBottom: 6 }}>
                {currentLanguage === AppLanguage.DARIJA ? 'بيت المعلمات' : 'Le Conseil des Maâlmates'}
              </h4>
              <p style={{ fontSize: 12, color: 'var(--pie-brown-mid)', lineHeight: 1.6, margin: 0 }}>
                {currentLanguage === AppLanguage.FRENCH
                  ? 'Chaque leçon complétée vous rapproche de l\'autosuffisance. Obtenez votre kit ou vendez votre création au souk solidaire !'
                  : 'Each completed lesson lets you order materials or sell your craft at the community market.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHOSEN CRAFT PATH TIMELINE */}
      {activeTab === 'path' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <button
              onClick={() => setActiveTab('metiers')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>
                {currentLanguage === AppLanguage.DARIJA ? 'رجوع للمهن' : 'Changer d’atelier'}
              </span>
            </button>

            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              {currentLanguage === AppLanguage.DARIJA ? `صنف: ${selectedMetier.toUpperCase()}` : `Atelier : ${selectedMetier.toUpperCase()}`}
            </span>
          </div>

          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-black text-gray-900 flex items-center justify-center gap-2 font-sans">
              📍
              <span>
                {currentLanguage === AppLanguage.DARIJA ? 'مسار الغرزة والخطوات الملكية' : 
                 currentLanguage === AppLanguage.FRENCH ? 'Le Chemin de votre Apprentissage' :
                 'Your Custom Training Map Path'}
              </span>
            </h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {currentLanguage === AppLanguage.DARIJA ? 'الأكاديمية صاوبات ليك لستة ديال الدروس البصرية. دورة تدرجية من البداية حتى الاحتراف.' :
               currentLanguage === AppLanguage.FRENCH ? 'Progressez à votre rythme. Sélectionnez une leçon pour lancer l\'assistant de couture interactif.' :
               'Choose a lesson step to launch the interactive tactile training studio.'}
            </p>
          </div>

          {/* ROADMAP TIMELINE FLOW - PLUS PRO */}
          <div className="relative border-l-4 border-dashed border-amber-300 pl-6 sm:pl-10 ml-4 sm:ml-8 space-y-6 py-2">
            {courses
              .filter(c => selectedMetier === 'all' || c.metier === selectedMetier)
              .map((course, idx) => {
                const isCompleted = completedLessons.includes(course.id);
                return (
                  <div key={course.id} className="relative group text-left">
                    {/* Circle Node pointer */}
                    <span className={`absolute -left-[38px] sm:-left-[54px] top-4 w-8 h-8 rounded-full border-4 flex items-center justify-center text-xs font-bold shadow-md z-10 transition-all ${
                      isCompleted 
                        ? 'bg-emerald-550 border-emerald-200 text-white' 
                        : 'bg-white border-amber-400 text-amber-700'
                    }`}>
                      {isCompleted ? '✓' : idx + 1}
                    </span>

                    <button
                      onClick={() => selectCourse(course)}
                      className="w-full p-6 bg-white hover:bg-amber-50/30 rounded-[2rem] border-2 border-gray-105 hover:border-amber-400 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer text-left"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded-full ${
                            course.difficulty === 'facile' ? 'bg-emerald-100 text-emerald-800' :
                            course.difficulty === 'moyen' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {course.difficulty}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">⌚ {course.duration}</span>
                          {isCompleted && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono flex items-center gap-1">
                              👑 Complété !
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition-colors font-sans pt-1">
                          {course.title[currentLanguage]}
                        </h3>
                        <p className="text-xs text-slate-550 max-w-xl leading-relaxed">
                          {course.description[currentLanguage]}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <div className="px-5 py-3 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md">
                          <Play size={13} fill="currentColor" />
                          <span>{currentLanguage === AppLanguage.DARIJA ? 'إبدأ الدرس' : "Lancer"}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. ACTIVE STEP-BY-STEP PLAYER & LINKED EXERCISES */}
      {activeTab === 'viewer' && activeCourse && (
        <div className="space-y-8" id="active-lesson-studio">
          
          {/* Header Controls */}
          <div className="flex flex-wrap justify-between items-center gap-2 bg-gray-50 border p-2.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('path')}
              className="px-4 py-2.5 bg-white hover:bg-gray-100 hover:text-black text-gray-700 rounded-xl border border-gray-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>{currentLanguage === AppLanguage.DARIJA ? 'رجوع للمسار' : 'Retour au Chemin'}</span>
            </button>

            <span className="bg-amber-100 text-amber-800 text-[10px] font-black tracking-widest font-mono uppercase px-3 py-1.5 rounded-full">
              {currentStepIdx + 1} / {activeCourse.steps.length}
            </span>

            <button
              onClick={speakActiveStep}
              className="p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow cursor-pointer transition-transform hover:scale-105 hover:rotate-2"
              title="Speak instruction"
            >
              <Volume2 size={16} />
            </button>
          </div>

          {/* Choice selector for Video vs. Simulation */}
          <div className="flex justify-center bg-slate-100 p-1 rounded-2xl w-full max-w-sm mx-auto border-2 border-slate-200/40">
            <button
              onClick={() => {
                setPlayerMode('video');
                speakText(
                  currentLanguage === AppLanguage.DARIJA 
                    ? "شاهد الفيديو التعليمي المباشر، طريقتنا الأسهل لتعلم الحرفة !" 
                    : "Regardez le tutoriel vidéo en direct, notre méthode la plus facile !",
                  currentLanguage
                );
              }}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                playerMode === 'video'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/65'
              }`}
            >
              <Video size={14} />
              <span>{currentLanguage === AppLanguage.DARIJA ? 'فيديو مباشر 📺' : 'Tuto Vidéo 📺'}</span>
            </button>
            <button
              onClick={() => {
                setPlayerMode('simulation');
                speakText(
                  currentLanguage === AppLanguage.DARIJA 
                    ? "شاهد محاكي الغرز التفاعلي للتدرب خطوة بخطوة !" 
                    : "Regardez le simulateur de couture interactif étape par étape !",
                  currentLanguage
                );
              }}
              className={`flex-1 py-2 px-3 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                playerMode === 'simulation'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/65'
              }`}
            >
              <Activity size={14} />
              <span>{currentLanguage === AppLanguage.DARIJA ? 'محاكي تفاعلي 🎨' : 'Schéma 2D 🎨'}</span>
            </button>
          </div>

          {/* Video Player or 2D Graphic simulation render */}
          {playerMode === 'video' ? (
            <div className="w-full aspect-video min-h-56 sm:min-h-72 bg-black rounded-3xl relative overflow-hidden shadow-2xl border-4 border-amber-600/35 flex flex-col justify-center items-center">
              {activeCourse.videoEmbedId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activeCourse.videoEmbedId}?rel=0&modestbranding=1&controls=1&showinfo=0`}
                  title={activeCourse.title[currentLanguage]}
                  className="w-full h-full border-0 absolute inset-0 rounded-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-white space-y-2">
                  <Video size={36} className="text-amber-500 animate-pulse" />
                  <p className="text-xs text-mono text-gray-400">Vidéo de démonstration en cours de chargement...</p>
                </div>
              )}
              {/* Overlay Badge guiding user in Moroccan spoken dialect context */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider p-1.5 px-3 rounded-full border border-amber-600/30 flex items-center gap-1 z-10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{currentLanguage === AppLanguage.DARIJA ? 'شرح بالصوت والصورة' : 'Tutoriel Vidéo Apprenti'}</span>
              </div>
            </div>
          ) : (
            renderStitchAnimation()
          )}

          {/* Stepper instructional texts */}
          <div className="bg-white rounded-[2rem] p-6 border shadow-sm space-y-4 text-center">
            <span className="text-[9px] font-black uppercase text-amber-500 font-mono tracking-widest block">
              {currentLanguage === AppLanguage.DARIJA ? 'الخطوة العملية للدرس' : 'Instruction Pratique de couture'}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-950 font-sans px-4 sm:px-12 leading-snug">
              {activeCourse.steps[currentStepIdx].instruction[currentLanguage]}
            </h3>

            {/* Speeds & Next commands */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-gray-100">
              
              {/* Play Pause Controls */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isPlaying ? 'bg-amber-500 text-white shadow' : 'bg-white text-gray-700 border hover:bg-zinc-50'
                  }`}
                  title="Pause simulation animation"
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
                </button>
                <button
                  onClick={() => setAnimationSpeed(1)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    animationSpeed === 1 ? 'bg-amber-500 text-white shadow' : 'hover:bg-amber-100 text-gray-600'
                  }`}
                >
                  {currentLanguage === AppLanguage.DARIJA ? 'سرعة عادية' : 'Normal (1.0x)'}
                </button>
                <button
                  onClick={() => setAnimationSpeed(0.5)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    animationSpeed === 0.5 ? 'bg-amber-500 text-white shadow' : 'hover:bg-amber-100 text-gray-600'
                  }`}
                >
                  {currentLanguage === AppLanguage.DARIJA ? 'حركة بطيئة' : 'Lent (0.5x)'}
                </button>
              </div>

              {/* Step navigations */}
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={goPrevStep}
                  disabled={currentStepIdx === 0}
                  className="flex-1 sm:flex-none p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronLeft size={22} strokeWidth={3} />
                </button>

                <button
                  onClick={goNextStep}
                  className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
                >
                  <span>
                    {currentStepIdx === activeCourse.steps.length - 1 ? (
                      <span className="flex items-center gap-1.5 uppercase font-mono tracking-widest font-black text-xs">
                        <Sparkles size={15} />
                        {currentLanguage === AppLanguage.DARIJA ? 'سالينا الدرس' : 'Terminer'}
                      </span>
                    ) : (
                      currentLanguage === AppLanguage.DARIJA ? 'الخطوة الجاية' : 'Étape suivante'
                    )}
                  </span>
                  <ChevronRight size={18} strokeWidth={3} />
                </button>
              </div>

            </div>
          </div>

          {/* DYNAMIC MARKETPLACE LINKED EXERCISES SECTION (Des exercices liés à ce qui est dans le marketplace) */}
          <div className="bg-gradient-to-br from-amber-600 via-orange-700 to-amber-700 rounded-[2.5rem] p-6 sm:p-8 text-white text-left space-y-6 shadow-xl relative overflow-hidden">
            
            {/* Background lighting flare */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="border-b border-white/10 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">🛠️</span>
                <div>
                  <span className="text-[10px] text-amber-205 font-black uppercase tracking-widest font-mono">
                    {currentLanguage === AppLanguage.DARIJA ? 'التطبيق المرتبط بالماركت' : 'Défi de la Coopérative'}
                  </span>
                  <h3 className="text-lg font-black font-sans leading-none mt-1">
                    {activeCourse.exercise ? activeCourse.exercise.title[currentLanguage] : "Exercice Pratique"}
                  </h3>
                </div>
              </div>
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full font-mono tracking-wide">
                100% Solidaire
              </span>
            </div>

            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-sans">
              {activeCourse.exercise ? activeCourse.exercise.desc[currentLanguage] : "Description de l'exercice"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              
              {/* Tâche 1: Order raw materials (Added directly to cart) */}
              <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    {currentLanguage === AppLanguage.DARIJA ? 'الحاجة الاولى: السلعة' : 'Étape 1 : Obtenir la matière'}
                  </span>
                  <h4 className="text-sm font-black mt-2">
                    {currentLanguage === AppLanguage.DARIJA ? 'صندوق اللوازم والصوف الأصيل' : 'Le Coffret de Matières Premières'}
                  </h4>
                  <p className="text-[11px] text-orange-200 mt-1 leading-normal">
                    {currentLanguage === AppLanguage.DARIJA ? 'لازمك الصوف الطبيعي والإبرة اللي فالصندوق باش تخدمي بيديك فالدار.' :
                     currentLanguage === AppLanguage.FRENCH ? "Pour pratiquer physiquement, commandez le kit de matériels certifiés utilisé dans cette leçon." :
                     "To practice at home, order the exact raw material package we designed for this project."}
                  </p>
                </div>

                <button
                  onClick={() => triggerAddToCart(activeCourse.linkedKitId || 'kit-1')}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  <ShoppingBag size={15} />
                  <span>
                    {currentLanguage === AppLanguage.DARIJA ? 'شراء الصندوق 🛒' : 'Ajouter le Kit au Panier 🛒'}
                  </span>
                </button>
              </div>

              {/* Tâche 2: Weave completed product to list on final Market */}
              <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    {currentLanguage === AppLanguage.DARIJA ? 'الحاجة الثانية: البيع' : 'Étape 2 : Vendre votre Œuvre'}
                  </span>
                  <h4 className="text-sm font-black mt-2">
                    {currentLanguage === AppLanguage.DARIJA ? 'طرح المنتوج الأصيل للبيع فالحين' : 'Mettez votre chef-d\'œuvre en vente !'}
                  </h4>
                  
                  {/* Earnings Estimator */}
                  <div className="my-2 p-3 bg-white/10 border border-white/5 rounded-2xl flex items-center justify-between">
                    <span className="text-xs text-orange-200">{currentLanguage === AppLanguage.DARIJA ? 'ربح تقديري للماركت' : 'Gain estimé au Souk'}</span>
                    <span className="text-lg font-black text-amber-305 font-mono">{activeCourse.exercise ? activeCourse.exercise.earnPrice : 200} DH</span>
                  </div>

                  <p className="text-[11px] text-orange-200 leading-normal">
                    {currentLanguage === AppLanguage.DARIJA ? 'كملتي التدريب؟ حطي هذ القطعة تصاوب فالحين للبيع فالسوق التعاوني!' :
                     currentLanguage === AppLanguage.FRENCH ? "Inscrivez immédiatement la pièce finie de votre travail sur notre marketplace pour générer un revenu immédiat !" :
                     "Directly showcase your completed assignment inside the live peer-to-peer souk list!"}
                  </p>
                </div>

                {isClassListingCompleted ? (
                  <div className="w-full py-3 bg-emerald-550 border border-emerald-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{currentLanguage === AppLanguage.DARIJA ? 'تم الإدراج فالماركت! 🏷️' : 'Œuvre listée avec succès !'}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleListingToSouk}
                    className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    <Award size={15} className="text-amber-500" />
                    <span>
                      {currentLanguage === AppLanguage.DARIJA ? 'تصدير للبيع فالماركت 🏷️' : 'Mettre en Vente au Souk 🏷️'}
                    </span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
