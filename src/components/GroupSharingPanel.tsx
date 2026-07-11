import React, { useState } from 'react';
import { Quiz, User } from '../types';
import { Globe, CheckCircle, Share2, Copy, Check, QrCode, ExternalLink, Sparkles, Shield, UserCheck, Search, UserPlus, UserMinus, Play, Flame, BookOpen, Clock } from 'lucide-react';
import { ALL_VIRTUAL_MEMBERS, VirtualMember } from '../data';

interface GroupSharingPanelProps {
  quizzes: Quiz[];
  user: User;
  onShareQuiz: (quizId: string) => void;
  initialTab?: 'my-quizzes' | 'shared-feed' | 'members';
  followedMembers?: string[];
  onFollowMember?: (memberName: string) => void;
  onUnfollowMember?: (memberName: string) => void;
  onStartQuiz?: (quizId: string, mode: 'solo' | 'group') => void;
}

export default function GroupSharingPanel({
  quizzes,
  user,
  onShareQuiz,
  initialTab,
  followedMembers = [],
  onFollowMember,
  onUnfollowMember,
  onStartQuiz
}: GroupSharingPanelProps) {
  const [activeTab, setActiveTab] = useState<'my-quizzes' | 'shared-feed' | 'members'>(initialTab || 'shared-feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>(ALL_VIRTUAL_MEMBERS);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(ALL_VIRTUAL_MEMBERS);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data.users && data.users.length > 0) {
            setSearchResults(data.users);
          } else {
            // fallback to virtual members if no real users found
            const filtered = ALL_VIRTUAL_MEMBERS.filter(m =>
              m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.nickname.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(filtered);
          }
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => setIsSearching(false));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleCopyLink = (quizId: string) => {
    const inviteLink = `${window.location.origin}/lobby?join=${quizId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedId(quizId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. My own quizzes (created by user)
  const myQuizzes = quizzes.filter(q => q.creator === user.name);

  // 2. Shared feed quizzes: Quizzes shared by creators that I follow
  const sharedFeedQuizzes = quizzes.filter(q => {
    // Shared and not created by current user
    const isSharedNotMine = q.isShared && q.creator !== user.name;
    // Creator is in my followed list
    const isCreatorFollowed = followedMembers.includes(q.creator);
    return isSharedNotMine && isCreatorFollowed;
  });

  // 3. Search results are now managed by state `searchResults`

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto px-1 animate-fade-in">
      {/* Visual Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-blue-700 to-cyan-600 p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="absolute top-[-45px] right-[-45px] w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 bg-cyan-400/20 rounded-full blur-lg pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-2.5 py-1 self-start text-[9px] font-black tracking-widest uppercase text-cyan-200">
            <Globe className="w-3 h-3 text-cyan-200 animate-pulse" />
            QuizLogic Share Network
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mt-1 drop-shadow-sm font-sans">
            A'zolar & Testlar Alvohi
          </h2>
          <p className="text-xs text-indigo-100/90 leading-relaxed font-medium max-w-lg">
            A'zolar bilan do'stlik (obuna) o'rnating, bir-biringizning testlaringizni kuzating, va ulashilgan test loyihalarini to'g'ridan-to'g'ri birgalikda yeching.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 gap-1 select-none">
        <button
          onClick={() => setActiveTab('shared-feed')}
          className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-black tracking-wide uppercase transition-all duration-200 relative ${
            activeTab === 'shared-feed'
              ? 'bg-linear-to-r from-indigo-600 to-blue-600 border border-indigo-500/30 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          Tasma (Ulashilganlar)
          {sharedFeedQuizzes.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my-quizzes')}
          className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-black tracking-wide uppercase transition-all duration-200 ${
            activeTab === 'my-quizzes'
              ? 'bg-linear-to-r from-indigo-600 to-blue-600 border border-indigo-500/30 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          Mening Testlarim
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2.5 rounded-xl text-[10px] sm:text-xs font-black tracking-wide uppercase transition-all duration-200 ${
            activeTab === 'members'
              ? 'bg-linear-to-r from-indigo-600 to-blue-600 border border-indigo-500/30 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          A'zolar & Obunalar ({followedMembers.length})
        </button>
      </div>

      {/* Tab Content 1: SHARED FEED (FILTERED BY FOLLOWS) */}
      {activeTab === 'shared-feed' && (
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-wider">Siz Obuna bo'lgan a'zolar testlari</span>
            </div>
            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold rounded-md font-mono">
              OBUNA TASMASI
            </span>
          </div>

          {sharedFeedQuizzes.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col gap-3.5 items-center">
              <BookOpen className="w-10 h-10 text-slate-600 animate-pulse" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400">Hech qanday ulashilgan test mavjud emas</span>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
                  Ulashilgan testlar faqat siz obuna bo'lgan (kuzatuvchi) guruh a'zolariga tegishli bo'lsa ko'rinadi. Do'stlar orttirish uchun a'zolar bo'limiga o'ting!
                </p>
              </div>
              <button
                onClick={() => setActiveTab('members')}
                className="py-1.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-cyan-400 hover:text-cyan-300 transition-all text-[10px] font-black"
              >
                A'zolarni qidirish va obuna bo'lish 🔎
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sharedFeedQuizzes.map((quiz) => {
                // Find matching member to show details
                const author = ALL_VIRTUAL_MEMBERS.find(m => m.name === quiz.creator);
                return (
                  <div
                    key={quiz.id}
                    className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col gap-3.5"
                  >
                    {/* Author badge header */}
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg bg-linear-to-tr ${author?.avatarColor || 'from-slate-600 to-slate-700'} flex items-center justify-center text-slate-950 font-black text-[9px]`}>
                          {quiz.creator.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-100">{quiz.creator}</span>
                          <span className="text-[8px] text-cyan-400 font-mono leading-none">{author?.nickname || '@username'} • {author?.role || 'Abituriyent'}</span>
                        </div>
                      </div>
                      
                      <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[8px] font-black rounded-md font-mono uppercase tracking-wider">
                        DO'STINGIZ ULASHDI 🤝
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-slate-100">{quiz.title}</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        {quiz.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-850">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-850 rounded text-[9px] text-slate-400 font-bold uppercase">
                          {quiz.subject}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">{quiz.questionsCount} ta savol</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onStartQuiz?.(quiz.id, 'solo')}
                          className="py-1 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-[10px] font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5" />
                          YAKKA YECHISH
                        </button>
                        <button
                          onClick={() => onStartQuiz?.(quiz.id, 'group')}
                          className="py-1 px-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-[10px] font-black rounded-lg transition-all active:scale-95 flex items-center gap-1 shadow-md"
                        >
                          <Globe className="w-2.5 h-2.5 text-slate-950" />
                          GURUH (LOBBY)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: MY OWN QUIZZES FOR SHARING */}
      {activeTab === 'my-quizzes' && (
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-cyan-400" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-wider">O'zingiz yaratgan test loyihalar</span>
            </div>
            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold rounded-md font-mono">
              YUKLASH VA ULASHISH
            </span>
          </div>

          {myQuizzes.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col gap-2 items-center">
              <Share2 className="w-10 h-10 text-slate-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-400">Sizda hali tahlil qilingan shaxsiy testlar yo'q</span>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                Asosiy oynaga o'ting, matn yoki material faylini yuklab yangi test tuzing. Keyin bu yerda uni ulashishingiz mumkin bo'ladi.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myQuizzes.map((quiz) => {
                const inviteLink = `${window.location.origin}/lobby?join=${quiz.id}`;
                return (
                  <div
                    key={quiz.id}
                    className="p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-750 rounded-2xl flex flex-col gap-3 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-slate-100 truncate">{quiz.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Mavzu: {quiz.subject} • {quiz.questionsCount} ta savol
                        </span>
                      </div>

                      {quiz.isShared ? (
                        <span className="shrink-0 flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl uppercase font-mono">
                          <CheckCircle className="w-3.5 h-3.5" />
                          ULASHILGAN
                        </span>
                      ) : (
                        <button
                          onClick={() => onShareQuiz(quiz.id)}
                          className="shrink-0 py-1.5 px-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 shadow-md active:scale-95"
                        >
                          <Share2 className="w-3 h-3" />
                          ULASHISH
                        </button>
                      )}
                    </div>

                    {quiz.isShared && (
                      <div className="mt-1 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Ulashilgan guruh havolasi (Invite Link):</span>
                          <span className="text-cyan-400 font-bold">Online</span>
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={inviteLink}
                            className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-[10px] font-mono text-slate-400 select-all outline-none"
                          />
                          <button
                            onClick={() => handleCopyLink(quiz.id)}
                            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all text-[10px] font-bold shrink-0 flex items-center gap-1"
                            title="Nusxalash"
                          >
                            {copiedId === quiz.id ? (
                              <>
                               <Check className="w-3 h-3 text-emerald-400" />
                               <span>Nusxalandi</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Nusxa olish</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: MEMBERS DIRECTORY & FOLLOW LOGIC */}
      {activeTab === 'members' && (
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4.5 h-4.5 text-cyan-400" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-wider">A'zolar qidiruvi va obunalar</span>
            </div>
            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold rounded-md font-mono">
              USER DISCOVERY
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="A'zo ismi yoki taxallusi (username) orqali qidiring..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500/40 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px] font-bold font-mono"
              >
                TOZALASH
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {isSearching ? (
              <div className="p-8 text-center text-slate-500 text-xs animate-pulse">
                Qidirilmoqda...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Siz kiritgan so'rov bo'yicha hech qanday a'zo topilmadi.
              </div>
            ) : (
              searchResults.map((member) => {
                const isFollowed = followedMembers.includes(member.name);
                return (
                  <div
                    key={member.name}
                    className="p-3 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-900/70 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${member.avatarColor} flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow-md`}>
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-200 truncate">{member.name}</span>
                          <span className="px-1.5 py-0.2 bg-slate-950 text-slate-400 text-[8px] font-bold rounded font-mono">
                            Lvl {member.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono mt-0.5">
                          <span className="text-cyan-400/90 font-semibold">{member.nickname}</span>
                          <span>•</span>
                          <span>{member.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isFollowed ? (
                        <button
                          onClick={() => onUnfollowMember?.(member.name)}
                          className="py-1.5 px-3 bg-emerald-500/10 hover:bg-rose-500/10 border border-emerald-500/30 hover:border-rose-500/30 text-emerald-400 hover:text-rose-400 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 group"
                        >
                          <span className="group-hover:hidden flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Obunadasiz
                          </span>
                          <span className="hidden group-hover:flex items-center gap-1">
                            <UserMinus className="w-3 h-3" />
                            Bekor qilish
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onFollowMember?.(member.name)}
                          className="py-1.5 px-3 bg-linear-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white text-[10px] font-black rounded-lg transition-all shadow active:scale-95 flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3 text-indigo-100" />
                          Obuna bo'lish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
