/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, AppLanguage } from '../types';
import { Store, Plus, Camera, Mic, CheckCircle2, Heart, ShieldCheck, X, Volume2, Sparkles, Upload } from 'lucide-react';
import { AudioHover } from './AudioHover';
import { speakPhrase, speakText } from '../utils/speech';
import { fetchProducts, addUserProduct } from '../lib/firebase';

interface MarketplaceCenterProps {
  currentLanguage: AppLanguage;
  isOffline: boolean;
  onQueueOfflineAction: (type: 'add_to_marketplace', payload: any) => void;
  products: Product[];
  onProductsUpdated: (prods: Product[]) => void;
}

export const MarketplaceCenter: React.FC<MarketplaceCenterProps> = ({
  currentLanguage,
  isOffline,
  onQueueOfflineAction,
  products,
  onProductsUpdated
}) => {
  const [isListOpen, setIsListOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  
  // Camera & voice capture simulation states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');
  const [voiceRecorded, setVoiceRecorded] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Load products from Firebase Firestore
  useEffect(() => {
    fetchProducts()
      .then((data) => onProductsUpdated(data))
      .catch((err) => console.error("Error loading products", err));
  }, []);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = products.map((prod) => {
      if (prod.id === id) {
        return { ...prod, likes: prod.likes + 1 };
      }
      return prod;
    });
    onProductsUpdated(updated);
    speakText(currentLanguage === AppLanguage.DARIJA ? "مزيان، عجبك هاد الكروشي !" : "Magnifique création !", currentLanguage);
  };

  const handleProductSpeak = (prod: Product) => {
    let text = `${prod.title}. ${prod.description}. ${currentLanguage === AppLanguage.DARIJA ? "ثمن ديالها" : "Prix :"} ${prod.price} Dirhams.`;
    speakText(text, currentLanguage);
  };

  // Simulate Camera Snap using lovely crochet high quality templates
  const triggerCamera = () => {
    setCameraActive(true);
    speakText(currentLanguage === AppLanguage.DARIJA ? "حليت الكاميرا. تصوري العمل ديالك دابا." : "Appuyez sur le bouton rond pour photographier votre travail.", currentLanguage);
  };

  const snapPhoto = () => {
    // Select a lovely preset handcrafted catalog photo
    const presets = [
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=600"
    ];
    const picked = presets[Math.floor(Math.random() * presets.length)];
    setCapturedPhotoUrl(picked);
    setCameraActive(false);
    
    speakText(currentLanguage === AppLanguage.DARIJA ? "مزيان، صورنا العمل ديالك !" : "Photo capturée avec succès !", currentLanguage);
  };

  // Simulate Speak recording
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setVoiceRecorded(true);
      speakText(currentLanguage === AppLanguage.DARIJA ? "مزيان، سجلنا الوصف الصوتي ديالك !" : "Description vocale enregistrée !", currentLanguage);
    } else {
      setIsRecording(true);
      setVoiceRecorded(false);
      speakText(currentLanguage === AppLanguage.DARIJA ? "قولي دابا شنو صنعتي وشحال بغيتي تبيعيها." : "Parlez maintenant... Décrivez votre travail et son prix.", currentLanguage);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalTitle = newTitle.trim() || (currentLanguage === AppLanguage.DARIJA ? "إبداع الحرفية ديالتنا" : "Création d'Artisane");
    const finalPrice = parseFloat(newPrice) || 150;
    const finalDesc = newDesc.trim() || (currentLanguage === AppLanguage.DARIJA ? "وصف صوتي مسجّل في المتجر" : "Création fait-main avec description vocale enregistrée.");
    const finalImage = capturedPhotoUrl || "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=600";

    const localProductPayload = {
      id: `prod-user-${Date.now()}`,
      title: finalTitle,
      price: finalPrice,
      description: finalDesc,
      imageUrl: finalImage,
      sellerName: currentLanguage === AppLanguage.DARIJA ? "الحرفية الكريمة" : "Une Artisane du Projet Pie",
      isCertified: false,
      likes: 0,
      isUserAdded: true,
      voiceMemoUrl: "simulated_memo_url"
    };

    if (isOffline) {
      // Put in client-side sync queue
      onQueueOfflineAction('add_to_marketplace', localProductPayload);
      onProductsUpdated([localProductPayload, ...products]);
      speakPhrase("btn_offline", currentLanguage);
    } else {
      try {
        const saved = await addUserProduct(localProductPayload);
        onProductsUpdated([saved, ...products]);
        speakText(currentLanguage === AppLanguage.DARIJA ? "مزيان بزااف! كمل الخيط ونزلنا الكروشي ديالك فالمارشي المفتوح." : "Félicitations, votre création est en ligne !", currentLanguage);
      } catch (err) {
        console.error("Online publishing failed, fallback to sync queue", err);
        onQueueOfflineAction('add_to_marketplace', localProductPayload);
        onProductsUpdated([localProductPayload, ...products]);
      }
    }

    // Reset setup form
    setNewTitle('');
    setNewPrice('');
    setNewDesc('');
    setCapturedPhotoUrl('');
    setVoiceRecorded(false);
    setIsListOpen(false);
  };

  const speakHelperUpload = () => {
    speakPhrase("vocal_upload_creation", currentLanguage);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 animate-fadeIn" id="marketplace">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="text-center md:text-left space-y-1">
          <AudioHover phraseKey="btn_marketplace" lang={currentLanguage} showIcon={true}>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
              🛍️
              <span>
                {currentLanguage === AppLanguage.DARIJA ? "سوق الحرفيات للتضامن" :
                 currentLanguage === AppLanguage.TAMAZIGHT ? "Souk lmou'alafat n'krouchi" :
                 currentLanguage === AppLanguage.FRENCH ? "Marché Solidaire de l'Artisanat" :
                 "Solidarity Crafts Marketplace"}
              </span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
                P2P
              </span>
            </h2>
          </AudioHover>
          <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
            {currentLanguage === AppLanguage.DARIJA ? "هنا الحرفيات كيعرضو الكروشي والطرز للي صنعو بيدهوم. بركي باش تسمعي ثمن." :
             currentLanguage === AppLanguage.FRENCH ? "Ici, les apprenantes vendent leurs créations. Cliquez sur un article pour entendre sa description et encourager l'artisane !" :
             "Here apprentice girls sell their crochet creations directly. Click on any item card to hear its vocal value!"}
          </p>
        </div>

        {/* Plus Button - Giant triggering target for listing work */}
        <button
          onClick={() => {
            setIsListOpen(true);
            speakHelperUpload();
          }}
          className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 focus:ring-4 focus:ring-amber-200 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg flex items-center gap-2 transform active:scale-95 transition-all w-full md:w-auto justify-center cursor-pointer uppercase font-mono"
        >
          <Plus size={18} />
          <span>
            {currentLanguage === AppLanguage.DARIJA ? "بيعي الخدمة ديالك" : "Vendre un Article"}
          </span>
        </button>
      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((prod) => (
          <div
            key={prod.id}
            onClick={() => handleProductSpeak(prod)}
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-amber-300"
          >
            {/* Image Box */}
            <div className="relative h-52 bg-slate-50 overflow-hidden">
              <img
                src={prod.imageUrl}
                alt={prod.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-gray-100 shadow-md">
                <span className="text-black font-black font-mono text-base">
                  {prod.price} <span className="text-xs font-sans">DH</span>
                </span>
              </div>

              {/* Certified Badge */}
              {prod.isCertified && (
                <div className="absolute top-4 left-4 bg-emerald-500/90 text-white px-3 py-1.5 rounded-2xl flex items-center gap-1 text-[10px] font-black tracking-widest font-mono uppercase shadow-md leading-none">
                  <ShieldCheck size={12} />
                  <span>
                    {currentLanguage === AppLanguage.DARIJA ? "معلّمة مصادقة" : "Certifié Maâlma"}
                  </span>
                </div>
              )}
            </div>

            {/* Profile contents */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-extrabold text-slate-900 leading-snug group-hover:text-amber-500 transition-colors">
                    {prod.title}
                  </h4>
                  <button
                    onClick={(e) => handleLike(prod.id, e)}
                    className="flex items-center gap-1 p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100/50 text-xs font-bold transition-transform active:scale-90 cursor-pointer"
                  >
                    <Heart size={14} className="fill-rose-500" />
                    <span>{prod.likes}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8">
                  {prod.description}
                </p>
              </div>

              {/* Seller details with Audio trigger indicator */}
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 pt-3 border-t border-gray-50 uppercase font-mono">
                <span className="text-amber-600 truncate max-w-[150px]">👵 {prod.sellerName}</span>
                <span className="text-teal-600 flex items-center gap-1 shrink-0">
                  <Volume2 size={12} className="animate-bounce" />
                  {currentLanguage === AppLanguage.DARIJA ? "برك باش تسمع" : "Écouter"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SELL WORK OVERLAY FORM - Custom Voice and Picture trigger */}
      {isListOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative border border-gray-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close */}
            <button
              onClick={() => setIsListOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full cursor-pointer transition-transform hover:rotate-90"
            >
              <X size={18} />
            </button>

            <form onSubmit={handlePublish} className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <span className="text-3xl">👵</span>
                <h3 className="text-xl font-black text-slate-900">
                  {currentLanguage === AppLanguage.DARIJA ? "دخلي كروشي ديالك للبيع" : "Publier ma création"}
                </h3>
                <p className="text-xs text-gray-500">
                  {currentLanguage === AppLanguage.DARIJA ? "صوري العمل ديالك وسجلي صوتك باش الزبناء يديرو الشراء." :
                   "Prenez une photo et enregistrez votre voix pour décrire votre création facilement."}
                </p>
              </div>

              {/* STEP 1: Capture Photo */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-gray-400 font-mono tracking-wider block">
                  1. {currentLanguage === AppLanguage.DARIJA ? "صورة العمل" : "Photo de votre travail"}
                </span>
                
                {capturedPhotoUrl ? (
                  <div className="relative h-44 rounded-2xl overflow-hidden shadow border border-gray-200">
                    <img src={capturedPhotoUrl} alt="Captured crochet" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCapturedPhotoUrl('')}
                      className="absolute top-2.5 right-2.5 bg-black/70 text-white rounded-full p-2 hover:bg-rose-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : cameraActive ? (
                  <div className="h-44 bg-slate-950 rounded-2xl flex flex-col items-center justify-center p-4 border border-slate-800 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 animate-pulse">
                      <Camera size={28} className="text-amber-500 mb-1" />
                      <span className="text-xs text-stone-400 font-bold tracking-wider font-mono uppercase">
                        {currentLanguage === AppLanguage.DARIJA ? "الكاميرا مفتوحة..." : "CAMÉRA ACTIVE..."}
                      </span>
                    </div>
                    {/* Capture button */}
                    <button
                      type="button"
                      onClick={snapPhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-white hover:bg-amber-400 rounded-full border-4 border-slate-700 shadow-md transform active:scale-95 transition-transform"
                    ></button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={triggerCamera}
                    className="w-full h-44 border-2 border-dashed border-gray-200 hover:border-amber-400 rounded-2xl bg-gray-50 hover:bg-amber-50/20 text-gray-600 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <div className="p-4 bg-white text-amber-500 rounded-full shadow border border-gray-100">
                      <Camera size={26} />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700">
                      {currentLanguage === AppLanguage.DARIJA ? "برك وصور العمل الكروشي" : "cliquer pour photographier"}
                    </span>
                  </button>
                )}
              </div>

              {/* STEP 2: Record Voice description */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-gray-400 font-mono tracking-wider block">
                  2. {currentLanguage === AppLanguage.DARIJA ? "وصف صوتي للثمن" : "Description vocale & Prix"}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`flex-1 py-4 px-4 rounded-2xl border flex items-center justify-center gap-2 text-xs font-black select-none transform transition-transform duration-200 cursor-pointer ${
                      isRecording 
                        ? 'bg-rose-500 text-white border-rose-500 animate-pulse' 
                        : voiceRecorded 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Mic size={18} className={isRecording ? "animate-bounce" : ""} />
                    <span>
                      {isRecording 
                        ? (currentLanguage === AppLanguage.DARIJA ? "راني كانسمع..." : "Enregistrement en cours...") 
                        : voiceRecorded 
                        ? (currentLanguage === AppLanguage.DARIJA ? "تسجل الصوت !" : "Enregistré avec succès") 
                        : (currentLanguage === AppLanguage.DARIJA ? "برك وهضري" : "Enregistrer ma description")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Optional Written fields (if helper is assisting) */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-450 block mb-1">
                    {currentLanguage === AppLanguage.DARIJA ? "الاسم" : "Titre de l'objet"}
                  </label>
                  <input
                    type="text"
                    placeholder="Écharpe d'or"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-450 block mb-1">
                    {currentLanguage === AppLanguage.DARIJA ? "الثمن" : "Prix (DH)"}
                  </label>
                  <input
                    type="number"
                    placeholder="200"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={!capturedPhotoUrl && !voiceRecorded}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 disabled:opacity-40 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>
                  {currentLanguage === AppLanguage.DARIJA ? "نزل للبيع دابا دابا" : "Publier Maintenant"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
