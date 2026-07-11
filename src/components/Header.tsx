import React from 'react';
import { Menu, Bell, Trophy, Zap, Shield } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onOpenSidebar: () => void;
  onNavigateNotifications: () => void;
  notificationCount: number;
}

export default function Header({ user, onOpenSidebar, onNavigateNotifications, notificationCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* 3D gradient glowing bar at top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-cyan-500 via-purple-500 to-amber-500 shadow-[0_1px_15px_rgba(6,182,212,0.8)]" />

      {/* Left side: Hamburger menu and Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2.5 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/60 rounded-xl transition-all duration-200 text-slate-300 hover:text-cyan-400 active:scale-95 shadow-md"
          title="Menyuni ochish"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-wider bg-linear-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(6,182,212,0.3)] select-none">
              QuizLogic
            </span>
            <span className="text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded-full select-none">
              v3.1
            </span>
          </div>
          <div className="flex items-center gap-1.5 leading-none mt-0.5">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest font-mono select-none">
              Adaptive Testing AI
            </span>
            <span className="text-[9px] font-bold text-amber-400 tracking-wider select-none font-mono">
              • ERKINOV.I
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Level stats and Notification bell */}
      <div className="flex items-center gap-3">
        {/* User Mini Level Widget */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-850 border border-slate-800 rounded-xl py-1 px-3 shadow-sm">
          <div className="relative flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200 font-sans">{user.rank}</span>
            <span className="text-[10px] text-slate-400 font-mono">Daraja: {user.level} ({user.xp} XP)</span>
          </div>
        </div>

        {/* Notifications Icon with glowing dot */}
        <button
          onClick={onNavigateNotifications}
          className="p-2.5 hover:bg-slate-800 border border-slate-850 hover:border-slate-700/60 rounded-xl relative transition-all duration-200 text-slate-300 hover:text-cyan-400 active:scale-95 shadow-md"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-linear-to-r from-rose-500 to-red-600 rounded-full border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
