import React, { useState } from 'react';
import { Bell, Trophy, Zap, MessageSquare, Play, Users, Award, ShieldAlert, Globe, Layers, Sparkles, Trash2 } from 'lucide-react';
import { NotificationItem, Quiz, User } from '../types';
import { RANKINGS } from '../data';

interface NotificationFeedProps {
  notifications: NotificationItem[];
  quizzes: Quiz[];
  user: User;
  onStartQuiz: (quizId: string, mode: 'solo' | 'group') => void;
  onDeleteNotification: (notificationId: string) => void;
  onUnshareQuiz: (quizId: string) => void;
  onSetUnreadCount: (count: number) => void;
}

export default function NotificationFeed({ notifications, quizzes, user, onStartQuiz, onDeleteNotification, onUnshareQuiz, onSetUnreadCount }: NotificationFeedProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'rankings' | 'shared'>('notifications');
  
  React.useEffect(() => {
    onSetUnreadCount(0);
  }, [onSetUnreadCount]);

  // Find a valid quiz to launch on challenge click
  const mathQuiz = quizzes.find(q => q.id === 'math-101') || quizzes[0];

  // Filter quizzes that have been shared with the group
  const sharedQuizzes = quizzes.filter(q => q.isShared);

  return (
    <div className="flex flex-col gap-5 w-full max-w-xl mx-auto px-1 animate-fade-in">
      
      {/* Tab Selectors */}
      <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-800 shadow-inner gap-1">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
            activeTab === 'notifications'
              ? 'bg-linear-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 text-cyan-400 font-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Xabarnomalar
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
            activeTab === 'shared'
              ? 'bg-linear-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 text-cyan-400 font-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Globe className="w-3.5 h-3.5 animate-pulse" />
          Shared Lobbies
        </button>
        <button
          onClick={() => setActiveTab('rankings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
            activeTab === 'rankings'
              ? 'bg-linear-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 text-cyan-400 font-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          A'zolar Ro'yxati
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === 'notifications' ? (
        /* 1. NOTIFICATIONS LIST */
        <div className="flex flex-col gap-4">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden bg-slate-850 border border-slate-800 p-4 rounded-2xl shadow-md flex flex-col gap-2.5 transition-all duration-300 hover:border-slate-700/60"
            >
              <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                item.type === 'challenge'
                  ? 'bg-amber-500 shadow-[2px_0_10px_rgba(245,158,11,0.5)]'
                  : item.type === 'achievement'
                    ? 'bg-purple-500 shadow-[2px_0_10px_rgba(139,92,246,0.5)]'
                    : 'bg-cyan-500'
              }`} />

              {/* Delete button */}
              <button
                onClick={() => {
                  if (window.confirm(`"${item.title}" xabarnomasini o'chirmoqchimisiz?`)) {
                    onDeleteNotification(item.id);
                  }
                }}
                className="absolute top-2 right-2 p-1.5 bg-slate-900/50 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20"
                title="Xabarnomani o'chirish"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="flex justify-between items-center pl-2">
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  item.type === 'challenge'
                    ? 'text-amber-400'
                    : item.type === 'achievement'
                      ? 'text-purple-400'
                      : 'text-cyan-400'
                }`}>
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
              </div>

              <div className="pl-2">
                <p className="text-sm font-semibold text-slate-200 leading-snug">
                  {item.text}
                </p>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">Yuboruvchi: {item.sender}</span>
              </div>

              {/* Challenge quick interaction buttons */}
              {item.type === 'challenge' && mathQuiz && (
                <div className="grid grid-cols-2 gap-2 mt-1 pl-2 z-10">
                  <button
                    onClick={() => onStartQuiz(mathQuiz.id, 'solo')}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 text-cyan-400" />
                    Yakka Duel
                  </button>
                  <button
                    onClick={() => onStartQuiz(mathQuiz.id, 'group')}
                    className="py-2 px-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <Users className="w-3 h-3 text-slate-950" />
                    Lobbyga Kirish
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : activeTab === 'shared' ? (
        /* 2. SHARED LOBBIES TAB */
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
          <div className="text-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-200">Guruhda Ulashilgan Test Loyihalari</h3>
            <p className="text-[10px] text-slate-400 mt-1">Sozlamalar (Master API) bo'limidan guruh uchun ulashilgan barcha sinov loyihalari.</p>
          </div>

          {sharedQuizzes.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2">
              <Globe className="w-8 h-8 text-slate-600 animate-pulse" />
              <p className="text-xs font-bold text-slate-400">Hech qanday test hozircha guruhga ulashilmagan</p>
              <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                Yangi testlarni sozlamalar panelidagi <span className="text-cyan-400 font-semibold">"Guruh uchun ulashish"</span> bo'limi orqali shu erga yuklashingiz mumkin.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sharedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="group bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3 transition-all duration-200 hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-lg font-mono">
                      {quiz.subject}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {quiz.questionsCount} ta savol
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm(`"${quiz.title}" testini guruhdan olib tashlamoqchimisiz? Bu testni butunlay o'chirmaydi, faqat ulashishni bekor qiladi.`)) {
                            onUnshareQuiz(quiz.id);
                          }
                        }}
                        className="p-1.5 bg-slate-950/50 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Guruhdan olib tashlash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-sm font-black text-slate-200">{quiz.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Yuklovchi: <strong className="text-cyan-400 font-bold">{quiz.sharedBy === user.name ? `${quiz.sharedBy} (Siz)` : quiz.sharedBy}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1 border-t border-slate-800/60 pt-3">
                    <button
                      onClick={() => onStartQuiz(quiz.id, 'solo')}
                      className="py-2.5 px-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-cyan-400" />
                      Yakka Tartibda
                    </button>
                    <button
                      onClick={() => onStartQuiz(quiz.id, 'group')}
                      className="py-2.5 px-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-slate-950" />
                      Guruh xonasi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 3. LEADERBOARD RANKINGS */
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
          <div className="text-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-200">Global Foydalanuvchilar Reytingi</h3>
            <p className="text-[10px] text-slate-400 mt-1">Eng ko'p savollarga javob topgan va XP unvoniga ega bo'lganlar ro'yxati.</p>
          </div>

          <div className="flex flex-col gap-2">
            {RANKINGS.map((entry) => {
              const isSelfRank = entry.name === user.name;
              let medalClass = "text-slate-400 bg-slate-900 border-slate-800";
              if (entry.rank === 1) medalClass = "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
              if (entry.rank === 2) medalClass = "text-slate-200 bg-slate-300/10 border-slate-300/30";
              if (entry.rank === 3) medalClass = "text-amber-600 bg-amber-700/10 border-amber-700/30";

              return (
                <div
                  key={entry.rank}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                    isSelfRank
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Index / Medal */}
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black font-mono ${medalClass}`}>
                      {entry.rank}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold font-sans ${isSelfRank ? 'text-cyan-400' : 'text-slate-200'}`}>
                        {entry.name} {isSelfRank && '(Siz)'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                        {entry.rank === 1 ? 'Chempion' : entry.rank === 2 ? 'Katta Ekspert' : 'Faol a\'zo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 animate-pulse" />
                    <span className="font-extrabold text-slate-200">{isSelfRank ? user.xp : entry.xp}</span>
                    <span className="text-slate-500 text-[10px]">XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
