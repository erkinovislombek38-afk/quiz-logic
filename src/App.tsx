import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuizEngine from './components/QuizEngine';
import ApiPanel from './components/ApiPanel';
import NotificationFeed from './components/NotificationFeed';
import PatternLock from './components/PatternLock';
import GroupSharingPanel from './components/GroupSharingPanel';
import ProfilePanel from './components/ProfilePanel';
import MultiplayerLobby from './components/MultiplayerLobby';
import MultiplayerGame from './components/MultiplayerGame';
import { ScreenType, Quiz, User, NotificationItem, VirtualPlayer, GameRoomSummary } from './types';
import { INITIAL_QUIZZES, INITIAL_NOTIFICATIONS } from './data';
import { Award, Trophy, Zap, Sparkles, BookOpen, ChevronRight, RefreshCw, AlertTriangle, ArrowLeft, Crown, Check, X, Users } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [user, setUser] = useState<User>(() => {
    const savedUser = localStorage.getItem('quiz_logic_user');
    if (savedUser) return JSON.parse(savedUser);

    // Agar yangi foydalanuvchi bo'lsa, unga avtomatik yangi ID beramiz
    const randomID = Math.floor(100000 + Math.random() * 900000);
    return {
      uid: `QL-${randomID}`,
      name: "Mehmon Foydalanuvchi", // Default ism
      email: "email@kiritilmagan.com",
      xp: 0,
      level: 1,
      rank: "Yangi Abituriyent"
    };
  });

  // Profil o'zgarganda har doim xotiraga saqlash
  useEffect(() => {
    localStorage.setItem('quiz_logic_user', JSON.stringify(user));
  }, [user]);
  // Foydalanuvchini server ro'yxatiga (Search uchun) qo'shish
  useEffect(() => {
    // Serverdan real-time xabarlarni kutib olish
  useEffect(() => {
    if (mpSocket) {
      // 1. Serverga o'zimizni tanitish
      mpSocket.emit("identify", { uid: user.uid, name: user.name });

      // 2. Yangi xabar kelganda qabul qilish
      mpSocket.on("newNotification", (newNotify: NotificationItem) => {
        setNotifications(prev => [newNotify, ...prev]);
        setUnreadCount(prev => prev + 1); // Qong'iroqchaga +1 qo'shish
      });
    }
    return () => { mpSocket?.off("newNotification"); };
  }, [mpSocket, user.uid, user.name]);
    const registerUserOnServer = async () => {
      try {
        await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });
      } catch (e) {
        console.error("Serverga ulanishda xato:", e);
      }
    };
    registerUserOnServer();
  }, [user]);
  const [quizzes, setQuizzes] = useState<Quiz[]>(INITIAL_QUIZZES);

  // ── URL Parametrlarini o'qish (multiplayer room join) ──
  const [urlRoomId, setUrlRoomId] = useState<string | null>(null);
  const [urlQuizId, setUrlQuizId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    const quizId = params.get('quiz');
    if (roomId) {
      setUrlRoomId(roomId.toUpperCase());
      setCurrentScreen('multiplayer-lobby');
    }
    if (quizId) {
      setUrlQuizId(quizId);
    }
  }, []);

  // ── Multiplayer state ──
  const [mpSocket, setMpSocket] = useState<Socket | null>(null);
  const [mpRoom, setMpRoom] = useState<GameRoomSummary | null>(null);
  const [mpQuiz, setMpQuiz] = useState<Quiz | null>(null);
  const [mpMyPlayerId, setMpMyPlayerId] = useState<string>('');
  const [mpFinalRoom, setMpFinalRoom] = useState<GameRoomSummary | null>(null);
  const [myRematchVote, setMyRematchVote] = useState<'rematch' | 'finish' | null>(null);
  const [mpLobbyQuizId, setMpLobbyQuizId] = useState<string | null>(null);

  // Followed virtual members state
  const [followedMembers, setFollowedMembers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('followed_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return ["Prof. Axmedov"];
  });

  const handleFollowMember = (memberName: string) => {
    setFollowedMembers(prev => {
      if (prev.includes(memberName)) return prev;
      const next = [...prev, memberName];
      localStorage.setItem('followed_members', JSON.stringify(next));
      return next;
    });
  };

  const handleUnfollowMember = (memberName: string) => {
    setFollowedMembers(prev => {
      const next = prev.filter(name => name !== memberName);
      localStorage.setItem('followed_members', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    const matched = quizzes.find(q => q.id === quizId);
    if (matched) {
      const newNotify: NotificationItem = {
        id: `sys-deleted-${Date.now()}`,
        title: "Test O'chirildi 🗑️",
        sender: "Tizim",
        time: "Hozirgina",
        text: `"${matched.title}" test loyihasi muvaffaqiyatli o'chirildi.`,
        type: 'system'
      };
      setNotifications(prev => [newNotify, ...prev]);
    }
  };

  const handleUpdateQuiz = (updatedQuiz: Quiz) => {
    setQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? { ...q, ...updatedQuiz } : q));
    const newNotify: NotificationItem = {
      id: `sys-updated-${Date.now()}`,
      title: "Test Tahrirlandi 📝",
      sender: "Tizim",
      time: "Hozirgina",
      text: `"${updatedQuiz.title}" loyihasi muvaffaqiyatli tahrirlandi va yangilandi.`,
      type: 'system'
    };
    setNotifications(prev => [newNotify, ...prev]);
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleUnshareQuiz = (quizId: string) => {
    setQuizzes(prev => prev.map(q => {
      if (q.id === quizId) return { ...q, isShared: false, sharedBy: undefined };
      return q;
    }));
    const matched = quizzes.find(q => q.id === quizId);
    if (matched) {
      const newNotify: NotificationItem = {
        id: `sys-unshared-${Date.now()}`,
        title: "Ulashish Bekor Qilindi 🚫",
        sender: "Tizim",
        time: "Hozirgina",
        text: `"${matched.title}" loyihasi guruhdan muvaffaqiyatli olib tashlandi.`,
        type: 'system'
      };
      setNotifications(prev => [newNotify, ...prev]);
    }
  };

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeQuizMode, setActiveQuizMode] = useState<'solo' | 'group'>('solo');
  const [score, setScore] = useState(0);
  const [xpGain, setXpGain] = useState(0);
  const [groupLeaderboardPlayers, setGroupLeaderboardPlayers] = useState<VirtualPlayer[]>([]);
  const [groupTimerSetting, setGroupTimerSetting] = useState(30);
  const [chunkingMode, setChunkingMode] = useState<'module' | 'all-at-once'>('module');
  const [sharingInitialTab, setSharingInitialTab] = useState<'my-quizzes' | 'shared-feed' | 'members'>('shared-feed');
  const [globalGeneratingName, setGlobalGeneratingName] = useState<string | null>(null);
  const [isPatternUnlocked, setIsPatternUnlocked] = useState(false);
const [notifications, setNotifications] = useState<NotificationItem[]>([]); 
const [unreadCount, setUnreadCount] = useState(0);
  const handleShareQuiz = (quizId: string) => {
    setQuizzes(prev => prev.map(q => {
      if (q.id === quizId) return { ...q, isShared: true, sharedBy: user.name };
      return q;
    }));
    const matchedQuiz = quizzes.find(q => q.id === quizId);
    if (matchedQuiz) {
      const newNotify: NotificationItem = {
        id: `sys-shared-${Date.now()}`,
        title: "Guruhda Ulashildi 🚀",
        sender: "Tizim",
        time: "Hozirgina",
        text: `"${matchedQuiz.title}" loyihasi guruhda muvaffaqiyatli ulashildi.`,
        type: 'system'
      };
      setNotifications(prev => [newNotify, ...prev]);
    }
  };

  // Auto-rank
  useEffect(() => {
    let rank = "Abituriyent";
    if (user.xp >= 3000) rank = "Akademik Magistr";
    else if (user.xp >= 2000) rank = "Ekspert Dotsent";
    else if (user.xp >= 1000) rank = "Zukko Talaba";
    setUser(prev => {
      if (prev.rank !== rank) return { ...prev, rank };
      return prev;
    });
  }, [user.xp]);

  const handleStartQuiz = (quizId: string, mode: 'solo' | 'group', timerSetting?: number) => {
    setActiveQuizId(quizId);
    setActiveQuizMode(mode);
    if (timerSetting !== undefined) setGroupTimerSetting(timerSetting);
    setCurrentScreen(mode === 'solo' ? 'solo-quiz' : 'group-quiz');
  };

  const handleFinishQuiz = (finalScore: number, earnedXp: number, players?: VirtualPlayer[]) => {
    setScore(finalScore);
    setXpGain(earnedXp);
    setGroupLeaderboardPlayers(players || []);
    setUser(prev => {
      const newXp = prev.xp + earnedXp;
      const newLevel = Math.floor(newXp / 1000) + 1;
      return { ...prev, xp: newXp, level: newLevel };
    });
    setCurrentScreen('result');
  };

  const handleAddNewQuiz = (newQuiz: Quiz) => {
    setQuizzes(prev => [newQuiz, ...prev]);
    const newNotify: NotificationItem = {
      id: `sys-gen-${Date.now()}`,
      title: "Yangi Test Tayyor! 🎉",
      sender: "AI Tizim",
      time: "Hozirgina",
      text: `"${newQuiz.title}" loyihasi muvaffaqiyatli tahlil qilindi va ro'yxatga qo'shildi.`,
      type: 'system'
    };
    setNotifications(prev => [newNotify, ...prev]);
  };

  const handleUpdateName = (newName: string) => {
    setUser(prev => ({ ...prev, name: newName }));
  };

  const handleGoogleLoginSuccess = (profile: { name: string; email: string }) => {
    setUser(prev => ({
      ...prev,
      name: profile.name,
      email: profile.email,
    }));
  };

  // ── Multiplayer handlers ──
  const handleStartMultiplayer = (quizId?: string) => {
    setMpLobbyQuizId(quizId || null);
    setCurrentScreen('multiplayer-lobby');
  };

  const handleMpGameStart = (socket: Socket, room: GameRoomSummary, quiz: Quiz) => {
    // Detect my player ID: the socket connects as the last player added, or we can track via socket.id
    const mySocketSuffix = socket.id?.slice(-6) || '';
    const me = room.players.find(p => p.id.includes(mySocketSuffix));
    setMpMyPlayerId(me?.id || room.players[room.players.length - 1]?.id || '');
    setMpSocket(socket);
    setMpRoom(room);
    setMpQuiz(quiz);
    setCurrentScreen('multiplayer-game');
  };

  const handleMpGameFinish = (finalRoom: GameRoomSummary) => {
    setMpFinalRoom(finalRoom);
    setMyRematchVote(null); // Ovoz berishni tozalash
    // Add XP
    const myPlayer = finalRoom.players.find(p => p.id === mpMyPlayerId);
    if (myPlayer) {
      const earnedXp = myPlayer.score * 10;
      setUser(prev => ({
        ...prev,
        xp: prev.xp + earnedXp,
        level: Math.floor((prev.xp + earnedXp) / 1000) + 1
      }));
    }
    setCurrentScreen('multiplayer-result');
  };

  // Multiplayer natija ekranidan keyingi harakatlar
  useEffect(() => {
    if (!mpSocket) return;

    const handleGameRestarted = (data: { room: GameRoomSummary & { quizQuestions?: any[] } }) => {
      // O'yinni qayta boshlash
      handleMpGameStart(mpSocket, data.room, mpQuiz!);
    };

    const handleLobbyClosed = () => {
      setMpSocket(null); setMpRoom(null); setMpQuiz(null); setMpFinalRoom(null);
      setCurrentScreen('dashboard');
    };

    mpSocket.on('gameRestarted', handleGameRestarted);
    mpSocket.on('lobbyClosed', handleLobbyClosed);

    return () => {
      mpSocket.off('gameRestarted', handleGameRestarted);
      mpSocket.off('lobbyClosed', handleLobbyClosed);
    };
  }, [mpSocket, mpQuiz]);

  const activeQuiz = quizzes.find(q => q.id === activeQuizId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased select-none pb-8">

      {/* Dynamic Header Component */}
      <Header
        user={user}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onNavigateNotifications={() => setCurrentScreen('notifications')}
        notificationCount={notifications.length}
      />

      {/* Background generation status bar */}
      {globalGeneratingName && (
        <div className="w-full max-w-xl mx-auto px-4 mt-4 animate-pulse">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-3 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Tizim Orqa Fonda Ishlamoqda</span>
                <span className="text-[11px] text-slate-200 font-semibold max-w-70 sm:max-w-90 truncate">
                  "{globalGeneratingName}" tahlil qilinmoqda. Boshqa sahifalarni bemalol ishlating.
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md font-mono hidden sm:inline">
              Fonda faol
            </span>
          </div>
        </div>
      )}

      {/* Floating Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        user={user}
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Back to Dashboard widget */}
      {currentScreen !== 'dashboard'
        && currentScreen !== 'solo-quiz'
        && currentScreen !== 'group-quiz'
        && currentScreen !== 'multiplayer-lobby'
        && currentScreen !== 'multiplayer-game'
        && currentScreen !== 'multiplayer-result' && (
        <div className="max-w-xl w-full mx-auto px-4 mt-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-cyan-400 bg-slate-900 border border-slate-800 hover:border-cyan-500/20 px-3.5 py-2.5 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Asosiy Sahifaga Qaytish (Nazad)
          </button>
        </div>
      )}

      {/* Main Screen Router */}
      <main className="flex-1 p-4 flex flex-col items-center justify-start">

        {/* 1. DASHBOARD */}
        <div className={currentScreen === 'dashboard' ? 'w-full flex flex-col items-center justify-start' : 'hidden'}>
          <Dashboard
            quizzes={quizzes}
            user={user}
            chunkingMode={chunkingMode}
            onSetChunkingMode={setChunkingMode}
            onStartQuiz={handleStartQuiz}
            onAddNewQuiz={handleAddNewQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onUpdateQuiz={handleUpdateQuiz}
            onGenerationStart={(name) => setGlobalGeneratingName(name)}
            onGenerationEnd={() => setGlobalGeneratingName(null)}
            onNavigateToMembers={() => {
              setSharingInitialTab('members');
              setCurrentScreen('sharing');
            }}
            onStartMultiplayer={handleStartMultiplayer}
          />
        </div>

        {/* 2. SOLO QUIZ */}
        {currentScreen === 'solo-quiz' && activeQuiz && (
          <QuizEngine
            quiz={activeQuiz}
            user={user}
            mode="solo"
            groupTimerSetting={groupTimerSetting}
            onFinish={handleFinishQuiz}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {/* 3. GROUP QUIZ (Virtual bots) */}
        {currentScreen === 'group-quiz' && activeQuiz && (
          <QuizEngine
            quiz={activeQuiz}
            user={user}
            mode="group"
            groupTimerSetting={groupTimerSetting}
            onFinish={handleFinishQuiz}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {/* 4. NOTIFICATIONS */}
        {currentScreen === 'notifications' && (
          <NotificationFeed
            notifications={notifications}
            quizzes={quizzes}
            user={user}
            onStartQuiz={handleStartQuiz}
            onDeleteNotification={handleDeleteNotification}
            onUnshareQuiz={handleUnshareQuiz}
          />
        )}

        {/* 5. SETTINGS (Pattern locked) */}
        {currentScreen === 'settings' && (
          <>
            {!isPatternUnlocked ? (
              <PatternLock
                onSuccess={() => setIsPatternUnlocked(true)}
                onCancel={() => setCurrentScreen('dashboard')}
              />
            ) : (
              <ApiPanel
                chunkingMode={chunkingMode}
                onSetChunkingMode={setChunkingMode}
                quizzes={quizzes}
                onShareQuiz={handleShareQuiz}
                onLock={() => setIsPatternUnlocked(false)}
              />
            )}
          </>
        )}

        {/* 6. SOLO RESULT */}
        {currentScreen === 'result' && activeQuiz && (
          activeQuizMode === 'group' ? (
            <div className="relative overflow-hidden w-full max-w-lg bg-slate-900 border-2 border-cyan-500/30 p-5 sm:p-7 rounded-3xl text-center flex flex-col gap-5 shadow-2xl animate-fade-in mt-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/25 rounded-2xl flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-2 uppercase tracking-wider font-sans">GURUH BILAN ISHLASH NATIJALARI</h2>
                <p className="text-[11px] text-slate-400 max-w-[320px] leading-relaxed">
                  Guruh a'zolari o'rtasidagi to'liq reyting va har bir ishtirokchining to'g'ri/noto'g'ri javoblari soni.
                </p>
              </div>
              {(() => {
                const totalQ = activeQuiz.questionsCount;
                const userAsPlayer = { id: 'user-id', name: `Siz (${user.name})`, score, avatarColor: 'bg-cyan-500', isUser: true };
                const bots = groupLeaderboardPlayers.map(p => ({ id: p.id, name: p.name, score: p.score, avatarColor: p.avatarColor || 'bg-slate-700', isUser: false }));
                const allPlayers = [userAsPlayer, ...bots].sort((a, b) => b.score - a.score);
                const first = allPlayers[0], second = allPlayers[1], third = allPlayers[2];
                return (
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-3 items-end justify-center gap-2 pt-6 pb-2 border-b border-slate-800/60 max-w-sm mx-auto w-full">
                      {second && (
                        <div className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-850 border-2 border-slate-400 flex items-center justify-center text-[10px] sm:text-xs font-extrabold text-slate-200">{second.name.slice(0, 2).toUpperCase()}</div>
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black bg-slate-400 text-slate-950 px-1.5 py-0.2 rounded-full font-mono border border-slate-300">2</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 truncate w-20 sm:w-24 text-center">{second.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-extrabold">{second.score} ball</span>
                          <div className="w-full bg-slate-800/80 border-t border-slate-700/50 rounded-t-lg h-12 mt-2 flex items-center justify-center shadow-inner"><span className="text-xs font-black text-slate-400 font-mono">II</span></div>
                        </div>
                      )}
                      {first && (
                        <div className="flex flex-col items-center z-10 scale-105 -translate-y-1">
                          <div className="relative mb-2">
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce"><Crown className="w-5 h-5 text-amber-400 fill-amber-400/20" /></div>
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-850 border-2 border-amber-400 flex items-center justify-center text-xs sm:text-sm font-extrabold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">{first.name.slice(0, 2).toUpperCase()}</div>
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-mono border border-amber-300">1</span>
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-black text-amber-300 truncate w-20 sm:w-24 text-center">{first.name}</span>
                          <span className="text-[10px] sm:text-[11px] font-mono text-amber-400 font-black">{first.score} ball</span>
                          <div className="w-full bg-linear-to-b from-amber-500/20 to-amber-600/10 border-t-2 border-amber-500/40 rounded-t-xl h-16 mt-2 flex items-center justify-center shadow-[0_4px_25px_rgba(245,158,11,0.1)]"><span className="text-sm font-black text-amber-400 font-mono">I</span></div>
                        </div>
                      )}
                      {third && (
                        <div className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-850 border-2 border-amber-700 flex items-center justify-center text-[10px] sm:text-xs font-extrabold text-amber-600">{third.name.slice(0, 2).toUpperCase()}</div>
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black bg-amber-700 text-slate-100 px-1.5 py-0.2 rounded-full font-mono border border-amber-600">3</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 truncate w-20 sm:w-24 text-center">{third.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-extrabold">{third.score} ball</span>
                          <div className="w-full bg-slate-800/60 border-t border-slate-750 rounded-t-lg h-9 mt-2 flex items-center justify-center shadow-inner"><span className="text-xs font-black text-amber-700 font-mono">III</span></div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 text-left max-h-56 overflow-y-auto pr-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider font-mono px-1 mb-1 block">Ishtirokchilarning To'liq Reytingi</span>
                      {allPlayers.map((player, index) => {
                        const correctCount = player.score;
                        const wrongCount = totalQ - correctCount;
                        const isSelf = player.isUser;
                        return (
                          <div key={player.id} className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${isSelf ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm' : 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/60'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-4 text-center font-mono text-[11px] font-black ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>{index + 1}</span>
                              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-300 shrink-0 border border-slate-750">{player.name.slice(0, 2).toUpperCase()}</div>
                              <div className="flex flex-col min-w-0">
                                <span className={`text-[11px] font-bold truncate ${isSelf ? 'text-cyan-400 font-black' : 'text-slate-200'}`}>{player.name}</span>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold">
                                  <span className="text-emerald-400 flex items-center gap-0.5 font-bold"><Check className="w-2.5 h-2.5" /> {correctCount} ta to'g'ri</span>
                                  <span className="text-slate-700">•</span>
                                  <span className="text-rose-400 flex items-center gap-0.5 font-bold"><X className="w-2.5 h-2.5" /> {wrongCount} ta xato</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0"><span className={`text-[11px] font-black font-mono ${isSelf ? 'text-cyan-400' : 'text-slate-300'}`}>{player.score} ball</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-2xl text-left text-xs text-slate-400 leading-relaxed font-semibold">
                <span className="text-cyan-400 font-black block mb-0.5">Guruh Mukofoti:</span>
                Guruh duelida g'alaba qozonish orqali sizning hisobingizga qo'shimcha <span className="text-amber-400 font-bold">+{xpGain} XP</span> ball qo'shildi va bilim darajangiz yangilandi.
              </div>
              <button onClick={() => { setActiveQuizId(null); setCurrentScreen('dashboard'); }} className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black py-3 rounded-xl transition-all shadow-md active:scale-98">Asosiy oynaga qaytish</button>
            </div>
          ) : (
            <div className="relative overflow-hidden w-full max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl text-center flex flex-col gap-5 shadow-2xl animate-fade-in mt-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="w-16 h-16 bg-linear-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_8px_25px_rgba(245,158,11,0.3)] animate-bounce">
                <Trophy className="w-8 h-8 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 font-sans">Sinov Yakunlandi</h2>
                <p className="text-xs text-slate-400 font-sans px-4 leading-relaxed">
                  Tabriklaymiz! Siz "{activeQuiz.title}" loyihasi bo'yicha to'liq sinovlarni muvaffaqiyatli yakunladingiz.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-center items-center shadow-inner">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">To'plangan Ball</span>
                  <span className="text-3xl font-black text-cyan-400 font-sans mt-1">{score} <span className="text-slate-500 text-xs font-semibold">/ {activeQuiz.questionsCount}</span></span>
                </div>
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-center items-center shadow-inner">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Mukofot XP</span>
                  <span className="text-3xl font-black text-amber-400 font-sans mt-1 flex items-center gap-1"><Zap className="w-6 h-6 text-amber-400 fill-amber-400/20" />+{xpGain}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400 font-semibold bg-slate-950/50 rounded-2xl p-4 border border-slate-850 text-left leading-relaxed">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1"><Sparkles className="w-4 h-4" />Maslahat va Keyingi qadamlar:</div>
                Olingan reytinglar sizning global hisobingizga kiritildi. Master API panelini ochib, yangi taymer yoki generatsiya sozlamalarini sozlashingiz mumkin.
              </div>
              <button onClick={() => { setActiveQuizId(null); setCurrentScreen('dashboard'); }} className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black py-3.5 rounded-xl shadow-lg transition-all duration-300 mt-2 active:scale-98">Asosiy oynaga qaytish</button>
            </div>
          )
        )}

        {/* 7. GROUP SHARING PANEL */}
        {currentScreen === 'sharing' && (
          <GroupSharingPanel
            quizzes={quizzes}
            initialTab={sharingInitialTab}
            user={user}
            onShareQuiz={handleShareQuiz}
            followedMembers={followedMembers}
            onFollowMember={handleFollowMember}
            onUnfollowMember={handleUnfollowMember}
            onStartQuiz={handleStartQuiz}
            onStartMultiplayer={handleStartMultiplayer}
            mpSocket={mpSocket}
          />
        )}

        {/* 8. PROFILE EDITOR */}
        {currentScreen === 'profile' && (
          <ProfilePanel
            user={user}
            onUpdateName={handleUpdateName}
            onGoogleLoginSuccess={handleGoogleLoginSuccess}
          />
        )}

        {/* 9. MULTIPLAYER LOBBY */}
        {currentScreen === 'multiplayer-lobby' && (
          <MultiplayerLobby
            user={user}
            quizzes={quizzes}
            initialRoomId={urlRoomId}
            initialQuizId={mpLobbyQuizId || urlQuizId}
            onGameStart={(socket, room, quiz) => {
              // Store socket ID before state update
              const socketId = socket.id || '';
              const mySocketSuffix = socketId.slice(-6);
              const me = room.players.find(p => p.id.includes(mySocketSuffix));
              setMpMyPlayerId(me?.id || room.players[room.players.length - 1]?.id || '');
              setMpSocket(socket);
              setMpRoom(room);
              setMpQuiz(quiz);
              setCurrentScreen('multiplayer-game');
            }}
            onBack={() => {
              setUrlRoomId(null);
              setCurrentScreen('dashboard');
            }}
          />
        )}

        {/* 10. MULTIPLAYER GAME */}
        {currentScreen === 'multiplayer-game' && mpSocket && mpRoom && mpQuiz && (
          <MultiplayerGame
            socket={mpSocket}
            room={mpRoom}
            quiz={mpQuiz}
            myPlayerId={mpMyPlayerId}
            onFinish={(finalRoom) => {
              setMpFinalRoom(finalRoom);
              const myPlayer = finalRoom.players.find(p => p.id === mpMyPlayerId);
              if (myPlayer) {
                const earnedXp = myPlayer.score * 10;
                setUser(prev => ({
                  ...prev,
                  xp: prev.xp + earnedXp,
                  level: Math.floor((prev.xp + earnedXp) / 1000) + 1
                }));
              }
              setCurrentScreen('multiplayer-result');
            }}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {/* 11. MULTIPLAYER RESULT */}
        {currentScreen === 'multiplayer-result' && mpFinalRoom && (
          <div className="relative overflow-hidden w-full max-w-lg bg-slate-900 border-2 border-indigo-500/30 p-5 sm:p-7 rounded-3xl text-center flex flex-col gap-5 shadow-2xl animate-fade-in mt-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">🏆 O'yin Yakunlandi!</h2>
              <p className="text-[11px] text-slate-400 max-w-sm">Real-time multiplayer o'yin natijalari</p>
            </div>

            {/* Podium */}
            {(() => {
              const sorted = [...mpFinalRoom.players].sort((a, b) => b.score - a.score);
              return (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 items-end gap-2 pt-4 pb-2 border-b border-slate-800 max-w-sm mx-auto w-full">
                    {sorted[1] && (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-400 flex items-center justify-center text-xs font-black text-slate-200 bg-slate-900">{sorted[1].name.slice(0,2).toUpperCase()}</div>
                        <span className="text-[10px] font-bold text-slate-300 truncate w-20 text-center mt-1">{sorted[1].name}</span>
                        <span className="text-[9px] font-mono text-slate-400">{sorted[1].score} ball</span>
                        <div className="w-full bg-slate-800 rounded-t-lg h-10 mt-1 flex items-center justify-center"><span className="text-[10px] font-black text-slate-400 font-mono">II</span></div>
                      </div>
                    )}
                    {sorted[0] && (
                      <div className="flex flex-col items-center scale-105">
                        <Crown className="w-5 h-5 text-amber-400 mb-1 animate-bounce" />
                        <div className="w-12 h-12 rounded-full border-2 border-amber-400 flex items-center justify-center text-sm font-black text-amber-400 bg-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.2)]">{sorted[0].name.slice(0,2).toUpperCase()}</div>
                        <span className="text-[11px] font-black text-amber-300 truncate w-20 text-center mt-1">{sorted[0].name}</span>
                        <span className="text-[10px] font-mono text-amber-400 font-black">{sorted[0].score} ball</span>
                        <div className="w-full bg-linear-to-b from-amber-500/20 to-transparent border-t-2 border-amber-500/30 rounded-t-xl h-14 mt-1 flex items-center justify-center"><span className="text-sm font-black text-amber-400 font-mono">I</span></div>
                      </div>
                    )}
                    {sorted[2] && (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full border-2 border-amber-700 flex items-center justify-center text-xs font-black text-amber-600 bg-slate-900">{sorted[2].name.slice(0,2).toUpperCase()}</div>
                        <span className="text-[10px] font-bold text-slate-300 truncate w-20 text-center mt-1">{sorted[2].name}</span>
                        <span className="text-[9px] font-mono text-slate-400">{sorted[2].score} ball</span>
                        <div className="w-full bg-slate-800/60 rounded-t-lg h-8 mt-1 flex items-center justify-center"><span className="text-[10px] font-black text-amber-700 font-mono">III</span></div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {sorted.map((p, i) => {
                      const isMe = p.id === mpMyPlayerId;
                      return (
                        <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${isMe ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-950/60 border-slate-800'}`}>
                          <span className={`w-5 text-center font-mono text-[11px] font-black ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>{i+1}</span>
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold">{p.name.slice(0,2).toUpperCase()}</div>
                          <span className={`flex-1 text-xs font-bold ${isMe ? 'text-cyan-400' : 'text-slate-200'}`}>{p.name}{isMe && ' (Siz)'}</span>
                          <span className={`font-mono text-xs font-black ${isMe ? 'text-cyan-400' : 'text-slate-300'}`}>{p.score} ball</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* OVOZ BERISH BLOKI */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Keyingi Harakat Uchun Ovoz Berish</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (!myRematchVote) {
                      setMyRematchVote('rematch');
                      mpSocket?.emit('voteForRematch', { roomId: mpFinalRoom.id, vote: 'rematch' });
                    }
                  }}
                  disabled={!!myRematchVote}
                  className={`py-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    myRematchVote === 'rematch' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-50'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Qayta O'ynash
                </button>
                <button
                  onClick={() => {
                    if (!myRematchVote) {
                      setMyRematchVote('finish');
                      mpSocket?.emit('voteForRematch', { roomId: mpFinalRoom.id, vote: 'finish' });
                    }
                  }}
                  disabled={!!myRematchVote}
                  className={`py-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    myRematchVote === 'finish' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-50'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  Yakunlash
                </button>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Ko'pchilik ovoziga qarab o'yin qayta boshlanadi yoki yakunlanadi.
              </div>

              {/* Ovoz berganlar ro'yxati */}
              <div className="flex flex-col gap-1 text-left text-[10px] font-mono max-h-20 overflow-y-auto pr-1">
                {mpFinalRoom.players.map(p => {
                  const vote = mpFinalRoom.rematchVotes?.[p.id];
                  return (
                    <div key={p.id} className="flex justify-between items-center">
                      <span className="text-slate-400">{p.name}:</span>
                      <span className={`font-bold ${vote === 'rematch' ? 'text-emerald-400' : vote === 'finish' ? 'text-rose-400' : 'text-slate-600'}`}>
                        {vote === 'rematch' ? 'Qayta o\'ynash' : vote === 'finish' ? 'Yakunlash' : '...kutmoqda'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
