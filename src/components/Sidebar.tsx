import React, { useState, useEffect } from 'react';
import { X, BookOpen, Bell, Settings, LogIn, ShieldCheck, Mail, Zap, Users } from 'lucide-react';
import { User, ScreenType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  user: User;
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onClose: () => void;
}

export default function Sidebar({ isOpen, user, currentScreen, onNavigate, onClose }: SidebarProps) {
  // Level progression calculations
  const nextLevelXp = user.level * 1000;
  const currentLevelXp = user.xp % 1000;
  const xpPercent = Math.min(100, Math.floor((currentLevelXp / 1000) * 100));

  // Google Auth State to sync with ProfilePanel
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; picture: string } | null>(() => {
    try {
      const saved = localStorage.getItem('google_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('google_user_profile');
      setGoogleUser(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener('storage', handleStorageChange);
    // Initial check
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sidebar drawer content */}
      <aside
        className={`absolute top-0 left-0 bottom-0 w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-out shadow-[10px_0_50px_rgba(0,0,0,0.8)] z-10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Header & close action */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                <span className="text-lg font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  QuizLogic Control
                </span>
              </div>
              <div className="text-[10px] font-black tracking-[0.2em] text-amber-400 mt-1 pl-8">
                ADMIN: ERKINOV
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Premium profile card inside menu */}
          <div className="relative overflow-hidden bg-linear-to-br from-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-3">
              {googleUser?.picture ? (
                <img src={googleUser.picture} alt={user.name} className="w-12 h-12 rounded-xl shadow-[0_4px_15px_rgba(6,182,212,0.3)]" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-[0_4px_15px_rgba(6,182,212,0.3)]">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-slate-100 text-sm truncate font-sans">{user.name}</h4>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      onClose();
                    }}
                    className="p-1 hover:bg-slate-800 rounded-md text-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
                    title="Profilni tahrirlash"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
                {googleUser ? (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 truncate">
                    <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{googleUser.email}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => { onNavigate('profile'); onClose(); }}
                    className="flex items-center gap-1 mt-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg transition-all"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Kirish</span>
                  </button>
                )}
                {user.uid && (
                  <div className="text-[10px] font-mono font-bold text-cyan-500 mt-1 uppercase tracking-wider bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 inline-block">
                    UID: {user.uid}
                  </div>
                )}
              </div>
            </div>

            {/* Level & XP info inside profile card */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1.5">
                <span>Daraja: {user.level} ({user.rank})</span>
                <span>{currentLevelXp}/1000 XP</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden p-[1px] border border-slate-800">
                <div
                  className="bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Links with custom active states */}
          <nav className="flex flex-col gap-1.5 mt-2">
            <button
              onClick={() => {
                onNavigate('dashboard');
                onClose();
              }}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm text-left transition-all duration-200 border ${
                currentScreen === 'dashboard' || currentScreen === 'solo-quiz' || currentScreen === 'group-quiz' || currentScreen === 'result'
                  ? 'bg-linear-to-r from-cyan-500/10 to-blue-500/5 border-cyan-500/30 text-cyan-400 shadow-sm'
                  : 'hover:bg-slate-800 border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Mening Testlarim</span>
            </button>

            <button
              onClick={() => {
                onNavigate('notifications');
                onClose();
              }}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm text-left transition-all duration-200 border ${
                currentScreen === 'notifications'
                  ? 'bg-linear-to-r from-cyan-500/10 to-blue-500/5 border-cyan-500/30 text-cyan-400 shadow-sm'
                  : 'hover:bg-slate-800 border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Xabarnomalar Feed</span>
            </button>

            <button
              onClick={() => {
                onNavigate('settings');
                onClose();
              }}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm text-left transition-all duration-200 border ${
                currentScreen === 'settings'
                  ? 'bg-linear-to-r from-cyan-500/10 to-blue-500/5 border-cyan-500/30 text-cyan-400 shadow-sm'
                  : 'hover:bg-slate-800 border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Master API Panel</span>
            </button>

            <button
              onClick={() => {
                onNavigate('sharing');
                onClose();
              }}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm text-left transition-all duration-200 border ${
                currentScreen === 'sharing'
                  ? 'bg-linear-to-r from-cyan-500/10 to-blue-500/5 border-cyan-500/30 text-cyan-400 shadow-sm'
                  : 'hover:bg-slate-800 border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Guruhga Ulashish</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with modern styling */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            <div className="flex flex-col font-mono">
              <span className="text-[10px] text-slate-400 leading-none">TIZIM STATUSI</span>
              <span className="text-[9px] text-emerald-400 font-bold tracking-wider mt-0.5">● FAOL / ONLINE</span>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-500 font-mono tracking-wider select-none">
            v3.1 Stable Mobile Edition
          </p>
        </div>
      </aside>
    </div>
  );
}
