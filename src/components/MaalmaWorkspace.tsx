import React, { useState, useEffect, useRef } from 'react';
import { AppLanguage } from '../types';
import { speakText, speakPhrase } from '../utils/speech';
import { Send, Scissors, Sparkles, MessageSquare, Briefcase, Camera, LogOut } from 'lucide-react';

interface MaalmaWorkspaceProps {
  currentLanguage: AppLanguage;
}

export const MaalmaWorkspace: React.FC<MaalmaWorkspaceProps> = ({ currentLanguage }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'maalma' | 'admin'; text: string; time: string }[]>(() => {
    const saved = localStorage.getItem('projet_pie_chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [newMsg, setNewMsg] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'projet_pie_chat_messages') {
        const messages = JSON.parse(e.newValue || '[]');
        setChatMessages(messages);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'maalma') {
      setIsAuthenticated(true);
      const welcome = {
        [AppLanguage.DARIJA]: "مرحبا بك أستاذة",
        [AppLanguage.TAMAZIGHT]: "Azul a lmou'allamat",
        [AppLanguage.FRENCH]: "Bienvenue Maâlma",
        [AppLanguage.ENGLISH]: "Welcome Maâlma"
      }[currentLanguage];
      speakText(welcome, currentLanguage);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const msg = { sender: 'maalma' as const, text: newMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    localStorage.setItem('projet_pie_chat_messages', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setNewMsg('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-sm w-full border border-white/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-500"></div>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <Scissors size={32} className="text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">Espace Maâlma</h1>
            <p className="text-xs text-stone-400 mt-2">Portail exclusif des artisanes</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="password"
              placeholder="Code Secret (maalma)"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-5 py-4 bg-black/30 border border-white/10 text-white placeholder-stone-500 rounded-2xl focus:outline-none focus:border-amber-400 font-mono text-center tracking-widest transition-colors"
            />
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-900 rounded-2xl font-black tracking-widest uppercase text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              Entrer
            </button>
          </form>
          <button onClick={() => window.location.href = '/'} className="w-full mt-6 py-2 text-stone-500 hover:text-white text-xs font-bold transition-colors">
            Retourner au Souk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-stone-900 leading-none">Studio Maâlma</h1>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-1">Niveau: Experte</p>
          </div>
        </div>
        <button onClick={() => window.location.href = '/'} className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
          <LogOut size={20} />
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Dashboard Metrics */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-300/80 mb-6">Mes Revenus</h3>
            <div className="text-4xl font-black tracking-tight mb-1">4 500 <span className="text-xl text-emerald-400">DH</span></div>
            <p className="text-xs font-medium text-emerald-200/60">+12% ce mois-ci</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4 flex items-center gap-2">
              <Briefcase size={14} /> Tâches en cours
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100/50">
                <strong className="block text-sm text-stone-800 mb-1">Coussin Fès - Broderie</strong>
                <span className="inline-block px-2 py-0.5 bg-amber-200/50 text-amber-700 text-[10px] font-bold rounded-md">En cours de confection</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                <strong className="block text-sm text-stone-800 mb-1">Tapis Moyen Atlas</strong>
                <span className="inline-block px-2 py-0.5 bg-emerald-200/50 text-emerald-700 text-[10px] font-bold rounded-md">Terminé • Prêt pour livraison</span>
              </div>
            </div>
            <button className="w-full mt-4 py-3 border-2 border-dashed border-stone-200 text-stone-500 rounded-2xl font-bold text-xs hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-2">
              <Camera size={14} /> Soumettre une nouvelle création
            </button>
          </div>
        </div>

        {/* Right Col: Live Chat with Admin */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <h2 className="text-sm font-black text-stone-800 uppercase tracking-widest">Contact Direct PIE</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/30">
            {chatMessages.length === 0 && (
              <div className="text-center text-stone-400 text-xs italic mt-10">
                Aucun message. Envoyez un message à la direction.
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'maalma' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm relative ${
                  msg.sender === 'maalma' 
                    ? 'bg-amber-500 text-white rounded-tr-sm' 
                    : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm'
                }`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <span className={`block text-[9px] mt-1.5 font-bold tracking-wider ${msg.sender === 'maalma' ? 'text-amber-100' : 'text-stone-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-stone-100">
            <form onSubmit={sendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Écrivez à la direction..."
                className="flex-1 bg-stone-100 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={!newMsg.trim()}
                className="w-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-stone-900 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
