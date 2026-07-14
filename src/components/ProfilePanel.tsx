import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { User as UserIcon, Shield, CheckCircle, Award, Zap, LogIn, LogOut, Save, RefreshCw } from 'lucide-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

interface ProfilePanelProps {
  user: User;
  onUpdateName: (newName: string) => void;
  onGoogleLoginSuccess: (profile: { name: string; email: string }) => void;
}

function ProfilePanelContent({ user, onUpdateName, onGoogleLoginSuccess }: ProfilePanelProps) {
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Google Auth State
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; picture: string } | null>(() => {
    const saved = localStorage.getItem('google_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // Editable name state
  const [editableName, setEditableName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditableName(user.name);
  }, [user.name]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      localStorage.setItem('google_access_token', tokenResponse.access_token);
      // Fetch user profile
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const profile = await profileRes.json();
      setGoogleUser(profile);
      localStorage.setItem('google_user_profile', JSON.stringify(profile));
      onGoogleLoginSuccess(profile); // Pass profile up to App.tsx
      // Xotiraga ism va emailni yozib qo'yamiz
      const updatedUser = { ...user, name: profile.name, email: profile.email };
      localStorage.setItem('quiz_logic_user', JSON.stringify(updatedUser));
      showStatus('success', `${profile.name} hisobi orqali tizimga kirildi!`);
    },
    onError: () => {
      showStatus('error', "Google orqali kirishda xatolik yuz berdi.");
    },
  });

  const handleGoogleLogout = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_user_profile');
    setGoogleUser(null);
    showStatus('success', "Google hisobidan chiqildi.");
  };

 const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editableName.trim();
    if (!trimmedName || trimmedName === user.name) return;

    setIsSaving(true);
    setTimeout(() => {
      onUpdateName(trimmedName);
      // Yangi ismni xotiraga yozamiz
      const updatedUser = { ...user, name: trimmedName };
      localStorage.setItem('quiz_logic_user', JSON.stringify(updatedUser));
      
      setIsSaving(false);
      showStatus('success', "Ismingiz muvaffaqiyatli yangilandi!");
    }, 800);
  };
  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto px-1 animate-fade-in">
      {/* Visual profile summary banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-850 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col gap-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          {googleUser?.picture ? (
            <img src={googleUser.picture} alt={user.name} className="w-16 h-16 rounded-2xl shadow-[0_4px_20px_rgba(6,182,212,0.35)]" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-[0_4px_20px_rgba(6,182,212,0.35)]">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base text-slate-100 truncate">{user.name}</h3>
            <span className="text-xs text-slate-400 block truncate mt-0.5">
              {googleUser ? googleUser.email : 'Hisob ulanmagan (Google orqali kiring)'}
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                googleUser ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {googleUser ? 'RASMIY A\'ZO' : 'MEHMON'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">UID: {user.uid}</span>
            </div>
          </div>
        </div>

        {/* Level metrics summary */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3 shadow-inner">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            <span>Progressiya ko'rsatkichlari:</span>
            <span className="text-cyan-400 font-black">Lvl {user.level}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-mono">JAMI XP</span>
              <span className="text-sm font-black text-amber-400 mt-1 flex items-center justify-center gap-0.5">
                <Zap className="w-4.5 h-4.5 text-amber-400 fill-amber-400/20 shrink-0" />
                {user.xp} XP
              </span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-mono">MAQOM</span>
              <span className="text-[11px] font-black text-cyan-400 mt-1.5 block truncate">
                {user.rank}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Name Editor */}
      <form onSubmit={handleSaveName} className="bg-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <UserIcon className="w-4 h-4 text-cyan-400" />
          <h3 className="font-black text-xs text-slate-200 uppercase tracking-wider">Profil Ismini Tahrirlash</h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          Bu ism o'yinlarda va reyting jadvallarida ko'rinadi. Google hisobingizdan farqli nom tanlashingiz mumkin.
        </p>
        <div className="flex items-center gap-2">
         <input
            type="text"
            // Agar ism kiritilmagan bo'lsa, ichini bo'sh ko'rsatadi (placeholder chiqishi uchun)
            value={editableName === "Mehmon Foydalanuvchi" ? "" : editableName}
            onChange={(e) => setEditableName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500/50 transition-colors"
            placeholder="O'z nikingizni kiriting..."
          />
          <button type="submit" disabled={isSaving || editableName.trim() === user.name} className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed">
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* 👤 Google Account Box */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <img src="/google.svg" alt="Google" className="w-4 h-4" />
            <h3 className="font-black text-xs text-slate-200 uppercase tracking-wider">Google Hisobi Bilan Ulanish</h3>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          O'z shaxsiy API kalitingizni kiritmasdan, to'g'ridan-to'g'ri Google hisobingiz limiti orqali test generatsiya qiling. Bu xavfsiz va qulay.
        </p>

        {statusMsg && (
          <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Shield className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {googleUser ? (
          <div className="flex flex-col gap-2">
            <div className="bg-slate-900/60 p-3 border border-emerald-500/30 rounded-xl flex items-center gap-3">
              <img src={googleUser.picture} alt={googleUser.name} className="w-9 h-9 rounded-lg" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-emerald-400 truncate">{googleUser.name}</span>
                <span className="text-xs text-slate-500 font-mono truncate">{googleUser.email}</span>
              </div>
            </div>
            <button
              onClick={handleGoogleLogout}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-black rounded-lg text-xs tracking-wide transition-all uppercase shadow-sm flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Hisobdan Chiqish
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleGoogleLogin()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-black rounded-lg text-xs tracking-wide transition-all uppercase shadow-sm flex items-center justify-center gap-2"
          >
            <img src="/google.svg" alt="Google" className="w-4 h-4" />
            Google Orqali Kirish
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePanel(props: ProfilePanelProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return <div className="text-rose-400 text-center p-4">Google Client ID topilmadi. Iltimos, .env faylini tekshiring.</div>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ProfilePanelContent {...props} onUpdateName={props.onUpdateName} onGoogleLoginSuccess={props.onGoogleLoginSuccess} />
    </GoogleOAuthProvider>
  );
}
