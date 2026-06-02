/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Kit, AppLanguage, CartItem } from '../types';
import { ShoppingBag, X, Phone, CheckCircle, Package, ArrowRight, User, ShoppingCart, Info } from 'lucide-react';
import { AudioHover } from './AudioHover';
import { speakPhrase, speakText } from '../utils/speech';
import { fetchKits, submitClientOrder } from '../lib/firebase';

interface KitCenterProps {
  currentLanguage: AppLanguage;
  cart: CartItem[];
  onUpdateCart: (newCart: CartItem[]) => void;
  isOffline: boolean;
  onQueueOfflineAction: (type: 'submit_order', payload: any) => void;
}

export const KitCenter: React.FC<KitCenterProps> = ({
  currentLanguage,
  cart,
  onUpdateCart,
  isOffline,
  onQueueOfflineAction
}) => {
  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [orderCompleted, setOrderCompleted] = useState<boolean>(false);

  useEffect(() => {
    fetchKits()
      .then((data) => setKits(data))
      .catch((err) => console.error("Error loading kits", err));
  }, []);

  const totalCartItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const addToCart = (kit: Kit) => {
    const existing = cart.find(item => item.kitId === kit.id);
    let newCart: CartItem[] = [];
    if (existing) {
      newCart = cart.map(item => item.kitId === kit.id ? { ...item, quantity: item.quantity + 1 } : item);
    } else {
      newCart = [...cart, { kitId: kit.id, quantity: 1 }];
    }
    onUpdateCart(newCart);

    // Speak success speech feedback
    speakPhrase("success_cart", currentLanguage);
  };

  const getKitCartDetails = (kitId: string) => {
    return kits.find(k => k.id === kitId);
  };

  const currentCartTotal = cart.reduce((acc, curr) => {
    const kit = getKitCartDetails(curr.kitId);
    return acc + (kit ? kit.price * curr.quantity : 0);
  }, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      let voiceAlert = currentLanguage === AppLanguage.DARIJA 
        ? "عافاك كتبي نمرة التليفون ديالك باش نتصلو بيك." 
        : "S'il vous plaît, saisissez votre numéro de téléphone pour l'expédition.";
      speakText(voiceAlert, currentLanguage);
      return;
    }

    const orderPayload = {
      items: cart,
      phone: phoneNumber,
      customerNotes: `Commande par ${customerName || 'Artisane'}`,
      date: new Date().toISOString(),
      userLanguage: currentLanguage
    };

    if (isOffline) {
      // Offline mode caching queue
      onQueueOfflineAction('submit_order', orderPayload);
      setOrderCompleted(true);
      speakPhrase("btn_offline", currentLanguage);
    } else {
      try {
        const savedOrder = await submitClientOrder(orderPayload);
        if (savedOrder) {
          setOrderCompleted(true);
          speakPhrase("success_checkout", currentLanguage);
          onUpdateCart([]);
        }
      } catch (err) {
        console.error("Failed online checkout, putting in offline queue", err);
        onQueueOfflineAction('submit_order', orderPayload);
        setOrderCompleted(true);
      }
    }
  };

  const handleNumPadClick = (num: string) => {
    if (num === 'C') {
      setPhoneNumber('');
    } else {
      setPhoneNumber(prev => prev + num);
    }
    speakText(num === 'C' ? "Correction" : num, currentLanguage);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4" id="kits-gallery">
      {/* Intro section */}
      <div className="text-center space-y-2 mb-8">
        <AudioHover phraseKey="btn_kits" lang={currentLanguage} showIcon={true}>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-2">
            📦
            <span>
              {currentLanguage === AppLanguage.DARIJA ? "صناديق لتعليم كروشي مجهّزة" :
               currentLanguage === AppLanguage.TAMAZIGHT ? "Box n'soof s tghawsiwin" :
               currentLanguage === AppLanguage.FRENCH ? "Expédition de Kits à Domicile" :
               "Complete Materials Kits"}
            </span>
          </h2>
        </AudioHover>
        <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
          {currentLanguage === AppLanguage.DARIJA ? "صندوق فيه كلشي للي غايخصك: الصوف، الإبر والقدوة. كيوصل تال الباب الدار." :
           currentLanguage === AppLanguage.FRENCH ? "Chaque module comprend un coffret complet livré chez vous contenant la laine adéquate, votre crochet ergonomique et le patron en relief." :
           "Every course project includes a physical materials kit containing premium yarn, matching hook, and tactile patterns."}
        </p>

        {/* Float active Cart indicator */}
        {totalCartItems > 0 && (
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="mt-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white rounded-full flex items-center gap-2 mx-auto font-black shadow-lg transition-transform hover:scale-105"
          >
            <ShoppingCart size={18} />
            <span>
              {totalCartItems} {currentLanguage === AppLanguage.DARIJA ? "صناديق" : "Coffret(s)"} ({currentCartTotal} DH)
            </span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Grid of Kits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kits.map((kit) => (
          <div
            key={kit.id}
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group justify-between"
          >
            {/* Image Box */}
            <div className="relative h-48 overflow-hidden bg-slate-100">
              <img
                src={kit.imageUrl}
                alt={kit.title[currentLanguage]}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-100 shadow-md">
                <span className="text-lg font-black text-amber-600 font-mono">
                  {kit.price} <span className="text-xs font-sans">DH</span>
                </span>
              </div>
              <div 
                className="absolute bottom-4 left-4 w-7 h-7 rounded-full shadow border-2 border-white"
                style={{ backgroundColor: kit.colorHex }}
                title="Couleur primaire de la laine"
              ></div>
            </div>

            {/* Contents info */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {kit.title[currentLanguage]}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {kit.description[currentLanguage]}
                </p>
              </div>

              {/* Visualized list of ingredients/items inside with custom dot colors */}
              <div className="space-y-1.5 pt-2 border-t border-gray-50">
                <span className="text-[10px] font-black uppercase text-gray-400 font-mono tracking-wider flex items-center gap-1">
                  <Package size={12} />
                  {currentLanguage === AppLanguage.DARIJA ? "شنو كاين داخل الصندوق" : "Contenu de la Boite"}
                </span>
                <div className="space-y-1">
                  {kit.whatsInside.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      <span className="truncate">{item[currentLanguage]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Button - Large and tactile */}
              <button
                onClick={() => {
                  addToCart(kit);
                  setSelectedKit(kit);
                }}
                className="w-full py-4.5 bg-gray-900 hover:bg-amber-500 hover:text-white text-white rounded-2xl font-black text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer uppercase font-mono"
              >
                <ShoppingBag size={18} />
                <span>
                  {currentLanguage === AppLanguage.DARIJA ? "شرا الصندوق" : "Ajouter au panier"}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SOLID CHECKOUT OVERLAY (WITH PHONE NUMBER REGISTER USING KEYPAD) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative border border-gray-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close */}
            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                setOrderCompleted(false);
              }}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full cursor-pointer transition-transform hover:rotate-90"
            >
              <X size={18} />
            </button>

            {!orderCompleted ? (
              <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-5">
                <div className="text-center space-y-2">
                  <span className="text-3xl">🛍️</span>
                  <h3 className="text-xl font-black text-slate-900">
                    {currentLanguage === AppLanguage.DARIJA ? "تأكيد الطلب ديالم" : "Enregistrer la Commande"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {currentLanguage === AppLanguage.DARIJA ? "كتبي غير نمرة التليفون ديالك باش نتصلو بيك ونصيفطو ليك الصندوق تال للدار." :
                     "Saisissez votre numéro de téléphone. Nous vous appellerons pour arranger le paiement et la livraison."}
                  </p>
                </div>

                {/* Input Fields with large displays */}
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder={currentLanguage === AppLanguage.DARIJA ? "الاسم الكامل (اختياري)" : "Votre Nom Complet"}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-sm rounded-2xl focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      readOnly
                      placeholder="06 XX XX XX XX"
                      value={phoneNumber}
                      className="w-full pl-12 pr-4 py-4 bg-amber-50/50 border-2 border-amber-300 text-lg font-black tracking-widest text-slate-950 rounded-2xl focus:outline-none text-center"
                    />
                  </div>
                </div>

                {/* VISUAL TOUCH NUMPAD - Critical for non-writers / Illiterate design */}
                <div className="grid grid-cols-3 gap-2 py-2 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (key === '✓') {
                          handleCheckoutSubmit({ preventDefault: () => {} } as any);
                        } else {
                          handleNumPadClick(key);
                        }
                      }}
                      className={`h-12 text-sm font-black rounded-xl border flex items-center justify-center shadow-sm select-none transition-transform hover:scale-95 cursor-pointer ${
                        key === 'C' 
                          ? 'bg-rose-50 text-rose-600 border-rose-200' 
                          : key === '✓' 
                          ? 'bg-emerald-500 text-white border-emerald-500 text-base' 
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:text-black font-mono'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {/* Big submission trigger */}
                <button
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle size={18} />
                  <span>
                    {currentLanguage === AppLanguage.DARIJA ? "صيفط الطلب دابا" : "Confirmer ma Commande"}
                  </span>
                </button>
              </form>
            ) : (
              // Order completed view
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-md">
                  🎉
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">
                    {currentLanguage === AppLanguage.DARIJA ? "تم تسجيل الطلب!" : "Félicitations !"}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {isOffline ? (
                      currentLanguage === AppLanguage.DARIJA 
                        ? "راكي خارج النت دباب، ولكن سجلنا طلب ديالك فتيليفون. غانيفطوه لمقرنا غير ينزل الريزو."
                        : "Vous êtes hors-ligne. Votre commande est enregistrée dans l'appareil et sera synchronisée dès retour d'Internet !"
                    ) : (
                      currentLanguage === AppLanguage.DARIJA 
                        ? "سجلنا طلب ديالك بنجاح! الأستاذة الحرفية ديالتنا غاتعيط ليك فنمرة تليفون باش تطمن معاك."
                        : "Votre commande est bien enregistrée ! Notre conseillère de broderie vous appellera très vite par téléphone pour livrer votre box."
                    )}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setOrderCompleted(false);
                    onUpdateCart([]);
                  }}
                  className="px-6 py-2.5 bg-gray-900 border border-gray-900 hover:bg-amber-500 hover:text-white text-white rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
                >
                  {currentLanguage === AppLanguage.DARIJA ? "سد الصفحة" : "Fermer l'Atelier"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
