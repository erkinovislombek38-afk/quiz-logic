import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Clock, Award, Trophy, ArrowRight, Zap, RefreshCw, BarChart2, CheckCircle, AlertCircle, HelpCircle, Users, Share2, QrCode, Send, MessageSquare, Flame, Check, RotateCcw } from 'lucide-react';
import { Quiz, Question, VirtualPlayer, ChatMessage, User } from '../types';
import { VIRTUAL_PLAYERS_POOL } from '../data';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface QuizEngineProps {
  quiz: Quiz;
  mode: 'solo' | 'group';
  groupTimerSetting: number;
  onFinish: (score: number, xpGain: number, players?: VirtualPlayer[]) => void;
  onBack: () => void;
  user: User;
}

// Helper function to preserve spaces in KaTeX
const formatTextForKatex = (text: string) => {
  // Replace multiple spaces with a single space and then replace single spaces with KaTeX's space command `\ `
  return (text || "").replace(/\s+/g, ' ').replace(/ /g, '\\ ');
};

export default function QuizEngine({ quiz, mode, groupTimerSetting, onFinish, onBack, user }: QuizEngineProps) {
  // Support chunked parts of 30 questions each
  const [currentPartIdx, setCurrentPartIdx] = useState(0);
  const activeQuestions = quiz.parts ? quiz.parts[currentPartIdx] : quiz.questions;

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  // Scoring
  const [partScore, setPartScore] = useState(0);
  const [totalAccumulatedScore, setTotalAccumulatedScore] = useState(0);

  // Group Mode Timer States
  const [timeLeft, setTimeLeft] = useState(groupTimerSetting);
  const [showGroupChart, setShowGroupChart] = useState(false);
  const [virtualPlayers, setVirtualPlayers] = useState<VirtualPlayer[]>([]);
  
  // Voting / Progress Modals
  const [showSoloVoteModal, setShowSoloVoteModal] = useState(false);
  const [showGroupVoteModal, setShowGroupVoteModal] = useState(false);
  const [userVote, setUserVote] = useState<'next' | 'retry' | null>(null);
  const [voteTimer, setVoteTimer] = useState(10);
  const [votingEnded, setVotingEnded] = useState(false);

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', sender: 'Sardor Olimov', text: 'Hammaga salom! O\'yinga tayyormisizlar?', time: '12:01' },
    { id: 'm2', sender: 'Nodira Rahimova', text: 'Salom, bugungi test juda qiziqarli ko\'rinadi.', time: '12:02' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Show Invite Link & QR Code
  const [showInviteDrawer, setShowInviteDrawer] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentQuestion = activeQuestions[currentQuestionIdx];

  // Dynamic option shuffling state to prevent A being always correct
  const [shuffledOptions, setShuffledOptions] = React.useState<string[]>([]);
  const [shuffledCorrectAnswer, setShuffledCorrectAnswer] = React.useState<string>('');

  React.useEffect(() => {
    if (currentQuestion) {
      const stripPrefix = (str: string) => (str || "").replace(/^([A-D])\s*[\).\s]\s*/i, "").trim();
      const pureOptions = (currentQuestion.options || []).map(o => stripPrefix(o));
      const pureCorrect = stripPrefix(currentQuestion.correctAnswer);
      
      const shuffledPure = [...pureOptions];
      // Fisher-Yates shuffle algorithm
      for (let i = shuffledPure.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPure[i], shuffledPure[j]] = [shuffledPure[j], shuffledPure[i]];
      }
      
      const letters = ['A', 'B', 'C', 'D'];
      const newOptions = shuffledPure.map((opt, idx) => {
        const prefix = letters[idx] || '';
        return `${prefix}) ${opt}`;
      });
      
      const correctIdx = shuffledPure.indexOf(pureCorrect);
      const newCorrect = correctIdx !== -1 ? newOptions[correctIdx] : newOptions[0];
      
      setShuffledOptions(newOptions);
      setShuffledCorrectAnswer(newCorrect);
    } else {
      setShuffledOptions([]);
      setShuffledCorrectAnswer('');
    }
  }, [currentQuestion]);

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initialize Virtual Players for Group Mode
  useEffect(() => {
    if (mode === 'group') {
      const players = VIRTUAL_PLAYERS_POOL.map((p, idx) => ({
        id: `p-${idx}`,
        ...p,
        score: 0,
        lastChoice: null,
        status: 'thinking' as const,
        votedFor: null
      }));
      setVirtualPlayers(players);
    }
  }, [mode]);

  // Handle Synchronized Timer and Auto Simulation
  useEffect(() => {
    if (showGroupVoteModal) return;
    if (groupTimerSetting === 99999) return;

    if (timeLeft === groupTimerSetting) {
      setShowGroupChart(false);
      setSelectedAnswer(null);
      if (mode === 'group') {
        setVirtualPlayers(prev => prev.map(p => ({
          ...p,
          lastChoice: null,
          status: 'thinking'
        })));
      }
    }

    // Simulate virtual players picking options over time in Group Mode
    let pickInterval: NodeJS.Timeout | null = null;
    if (mode === 'group') {
      pickInterval = setInterval(() => {
        setVirtualPlayers(prev => prev.map(player => {
          if (player.status === 'answered') return player;

          const shouldPick = Math.random() > 0.4 || timeLeft <= 3;
          if (!shouldPick) return player;

          const isCorrect = Math.random() < player.accuracy;
          let choice = '';
          if (isCorrect) {
            choice = shuffledCorrectAnswer;
          } else {
            const wrongOptions = shuffledOptions.filter(o => o !== shuffledCorrectAnswer);
            choice = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] || shuffledOptions[0];
          }

          return {
            ...player,
            lastChoice: choice,
            status: 'answered'
          };
        }));
      }, 1500);
    }

    // Timer countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          if (pickInterval) clearInterval(pickInterval);

          // Show chart for group mode, but immediately trigger next question for both modes.
          if (mode === 'group') setShowGroupChart(true);
          handleNext(); // Call for both solo and group modes
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pickInterval) clearInterval(pickInterval);
    };
  }, [timeLeft, currentQuestionIdx, currentPartIdx, mode, groupTimerSetting, currentQuestion, showGroupVoteModal, shuffledCorrectAnswer, shuffledOptions]);

  // Auto Chat responses based on quiz progression
  useEffect(() => {
    if (mode !== 'group') return;
    const randomMsgs = [
      "Voy, bu savol chalg'ituvchi ekan-ku!",
      "A variant to'g'ri bo'lsa kerak deb o'ylayman.",
      "Tezroq belgilaylik, vaqt tugayapti!",
      "Oson ekan bu savol, darslikda bor edi.",
      "Menda hammasi to'g'ri ketyapti shekilli, xursandman!"
    ];

    const chatTimeout = setTimeout(() => {
      if (Math.random() > 0.4) {
        const randomPlayer = VIRTUAL_PLAYERS_POOL[Math.floor(Math.random() * VIRTUAL_PLAYERS_POOL.length)];
        const msg = randomMsgs[Math.floor(Math.random() * randomMsgs.length)];
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages(prev => [...prev, {
          id: `msg-${Date.now()}`,
          sender: randomPlayer.name,
          text: msg,
          time
        }]);
      }
    }, 12000);

    return () => clearTimeout(chatTimeout);
  }, [currentQuestionIdx, mode]);

  // Award score when time ends in Group Mode
  useEffect(() => {
    // This effect now only handles scoring when the chart is shown, not navigation.
    if (mode === 'group' && timeLeft === 0) {
      setVirtualPlayers(prev => prev.map(p => {
        const isCorrect = p.lastChoice === shuffledCorrectAnswer;
        return {
          ...p,
          score: isCorrect ? p.score + 1 : p.score,
          // Ensure all players have 'answered' status when time is up
          status: 'answered'
        };
      }));

      const userCorrect = selectedAnswer === shuffledCorrectAnswer;
      if (userCorrect) {
        setPartScore(s => s + 1);
        setTotalAccumulatedScore(s => s + 1);
      }
    }
  }, [timeLeft, mode, selectedAnswer, shuffledCorrectAnswer]);

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);

    if (mode === 'solo' || (mode === 'group' && groupTimerSetting === 99999)) {
      const isCorrect = option === shuffledCorrectAnswer;
      if (isCorrect) {
        setPartScore(prev => prev + 1);
        setTotalAccumulatedScore(prev => prev + 1);
      }
      
      if (mode === 'group') {
        // Instantly pick answers for virtual players so the user can see them
        setVirtualPlayers(prev => prev.map(player => {
          const pCorrect = Math.random() < player.accuracy;
          const pureWrong = shuffledOptions.filter(o => o !== shuffledCorrectAnswer);
          const choice = pCorrect ? shuffledCorrectAnswer : (pureWrong[Math.floor(Math.random() * pureWrong.length)] || shuffledOptions[0]);
          return {
            ...player,
            lastChoice: choice,
            status: 'answered'
          };
        }));
      }
    }
  };

  const handleNext = () => {
    // Use a short delay to show results before moving on, especially for group mode chart
    const delay = mode === 'group' ? 4500 : 500;

    const transition = () => {
      setSelectedAnswer(null);
      setShowGroupChart(false); // Hide chart before next question

    if (currentQuestionIdx + 1 < activeQuestions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setTimeLeft(groupTimerSetting);
    } else {
      // Completed current module part!
      if (quiz.parts && currentPartIdx + 1 < quiz.parts.length) {
        // More parts remain, open voting modals!
        if (mode === 'solo') {
          setShowSoloVoteModal(true);
        } else {
          startGroupVoting();
        }
      } else {
        // Finished everything
        triggerFinishQuiz();
      }
    }
    };

    setTimeout(transition, delay);
  };

  const triggerFinishQuiz = () => {
    const finalXp = totalAccumulatedScore * 100 + (mode === 'group' ? 250 : 80);
    onFinish(totalAccumulatedScore, finalXp, virtualPlayers);
  };

  // Start Lobby Voting Simulation
  const startGroupVoting = () => {
    setUserVote(null);
    setVoteTimer(10);
    setVotingEnded(false);
    setShowGroupVoteModal(true);

    // Simulated virtual player votes after 2-5 seconds
    setVirtualPlayers(prev => prev.map(p => ({
      ...p,
      votedFor: Math.random() > 0.3 ? 'next' : 'retry'
    })));
  };

  // Handle countdown timer for group voting
  useEffect(() => {
    if (!showGroupVoteModal || votingEnded) return;

    if (voteTimer === 0) {
      resolveGroupVotes();
      return;
    }

    const interval = setInterval(() => {
      setVoteTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [voteTimer, showGroupVoteModal, votingEnded]);

  const resolveGroupVotes = () => {
    setVotingEnded(true);
    
    // Count votes
    let nextVotes = virtualPlayers.filter(p => p.votedFor === 'next').length;
    let retryVotes = virtualPlayers.filter(p => p.votedFor === 'retry').length;

    if (userVote === 'next') nextVotes++;
    else if (userVote === 'retry') retryVotes++;
    else {
      // Default fallback
      nextVotes++;
    }

    const totalVotes = nextVotes + retryVotes;
    const nextPercentage = (nextVotes / totalVotes) * 100;

    // Simulate final response text in chat
    setTimeout(() => {
      if (nextPercentage >= 50) {
        // Advance to next part!
        setChatMessages(prev => [...prev, {
          id: `sys-${Date.now()}`,
          sender: 'Tizim Bot',
          text: `🗳️ Ovoz berish yakunlandi: ${Math.round(nextPercentage)}% a'zolar "Keyingi qism" foydasiga ovoz berdi. Keyingi modulga o'tilmoqda...`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        setTimeout(() => {
          setShowGroupVoteModal(false);
          setCurrentPartIdx(prev => prev + 1);
          setCurrentQuestionIdx(0);
          setPartScore(0);
          setTimeLeft(groupTimerSetting);
          setShowGroupChart(false);
        }, 3000);
      } else {
        // Retry current part!
        setChatMessages(prev => [...prev, {
          id: `sys-${Date.now()}`,
          sender: 'Tizim Bot',
          text: `🗳️ Ovoz berish yakunlandi: Qayta ishlash varianti ko'p ovoz oldi (${Math.round(100 - nextPercentage)}%). Ushbu modul qaytadan boshlanadi!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        setTimeout(() => {
          setShowGroupVoteModal(false);
          setCurrentQuestionIdx(0);
          setPartScore(0);
          setTimeLeft(groupTimerSetting);
          setShowGroupChart(false);
        }, 3000);
      }
    }, 1500);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, {
      id: `self-${Date.now()}`,
      sender: `Siz (${user.name.split(' ')[0]})`,
      text: chatInput,
      time,
      isSelf: true
    }]);

    setChatInput('');

    // Generate simulated smart response
    setTimeout(() => {
      const answers = [
        "Siz juda tez yechyapsiz, ajoyib!",
        "Ha, men ham shu variantni tanlagandim.",
        "Qiyin mavzu bo'lishiga qaramay hamma faol.",
        "To'g'ri variant ajoyib tahlil qilingan.",
        "Yaxshi yuramiz!"
      ];
      const randomPlayer = VIRTUAL_PLAYERS_POOL[Math.floor(Math.random() * VIRTUAL_PLAYERS_POOL.length)];
      setChatMessages(prev => [...prev, {
        id: `reply-${Date.now()}`,
        sender: randomPlayer.name,
        text: answers[Math.floor(Math.random() * answers.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  const copyInviteLink = () => {
    setInviteCopied(true);
    const link = `${window.location.origin}?quiz=${quiz.id}`;
    navigator.clipboard?.writeText?.(link);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const getVoteDistribution = () => {
    const counts: { [key: string]: number } = {};
    shuffledOptions.forEach(o => { counts[o] = 0; });

    let totalVotes = 0;
    virtualPlayers.forEach(p => {
      if (p.lastChoice) {
        counts[p.lastChoice] = (counts[p.lastChoice] || 0) + 1;
        totalVotes++;
      }
    });

    if (selectedAnswer) {
      counts[selectedAnswer] = (counts[selectedAnswer] || 0) + 1;
      totalVotes++;
    }

    if (totalVotes === 0) totalVotes = 1;

    return shuffledOptions.map(option => ({
      option,
      percent: Math.round(((counts[option] || 0) / totalVotes) * 100),
      count: counts[option] || 0
    }));
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-xl mx-auto px-1 animate-fade-in pb-10">
      
      {/* Quiz Top status card */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onBack}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 font-mono">
              {mode === 'group' ? 'Lobby Duel' : 'Yakka Sinov'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {quiz.parts && (
              <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-md font-mono font-bold">
                Modul: {currentPartIdx + 1}/{quiz.parts.length}
              </span>
            )}
            <span className="text-xs font-bold text-slate-300 font-mono">
              Savol: {currentQuestionIdx + 1}/{activeQuestions.length}
            </span>
          </div>
        </div>

        {/* Dynamic header depending on mode */}
        {mode === 'group' && (
          <div className="flex justify-between items-center bg-slate-900/60 rounded-2xl px-3.5 py-2.5 border border-slate-800 mb-4 select-none">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${groupTimerSetting === 99999 ? 'text-cyan-400' : timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-amber-400'}`} />
              <span className={`text-xs font-mono font-black ${groupTimerSetting !== 99999 && timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                {groupTimerSetting === 99999 ? "Cheksiz vaqt (Taymersiz)" : `Qolgan vaqt: ${timeLeft} soniya`}
              </span>
            </div>
            
            <button
              onClick={() => setShowInviteDrawer(true)}
              className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-lg border border-cyan-500/20 flex items-center gap-1 transition-all"
            >
              <Share2 className="w-3 h-3" />
              Taklif qilish
            </button>
          </div>
        )}

        {mode === 'solo' && groupTimerSetting !== 99999 && (
          <div className="flex justify-between items-center bg-slate-900/60 rounded-2xl px-3.5 py-2.5 border border-slate-800 mb-4 select-none">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-amber-400'}`} />
              <span className={`text-xs font-mono font-black ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                Qolgan vaqt: {timeLeft} soniya
              </span>
            </div>
          </div>
        )}

        {/* Question content */}
        <div className="relative py-1">
          <div className="text-base sm:text-lg font-black leading-relaxed text-slate-100 font-sans select-none w-full break-words overflow-wrap-anywhere">
            <BlockMath math={formatTextForKatex(currentQuestion.question)} />
          </div>
        </div>
      </div>

      {/* Main interaction deck */}
      {showGroupChart && mode === 'group' ? (
        /* Real-Time distribution Chart for Group Mode */
        <div className="bg-slate-850/95 backdrop-blur-md border border-amber-500/30 p-5 rounded-3xl shadow-xl animate-fade-in flex flex-col gap-4">
          <div className="text-center">
            <h4 className="text-sm font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5 font-mono">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              Javoblar Taqsimoti
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-70 mx-auto">
              Kim qaysi javob variantini tanladi? Quyidagi taqsimotda yaqqol ko'rsatilgan.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 mt-2">
            {getVoteDistribution().map((dist, idx) => {
              const isCorrect = dist.option === shuffledCorrectAnswer;
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center gap-2 text-xs font-semibold">
                    <span className={`truncate ${isCorrect ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                      {dist.option} {isCorrect && '✓ (To\'g\'ri)'}
                    </span>
                    <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {dist.percent}% ({dist.count} ta ovoz)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full p-px border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isCorrect 
                          ? 'bg-linear-to-r from-emerald-500 to-green-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${dist.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 mt-2 py-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-medium font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            Keyingi savolga avtomatik yuklanmoqda...
          </div>
        </div>
      ) : (
        /* Standard Options Deck */
        <div className="flex flex-col gap-3">
          {shuffledOptions.map((option, idx) => {
            let btnStyle = "bg-slate-850 hover:bg-slate-800 border-slate-800 hover:border-slate-700/60 text-slate-200";
            
            if (selectedAnswer !== null) {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === shuffledCorrectAnswer;

              if (isCorrect) {
                btnStyle = "bg-emerald-500/20 border-emerald-500/80 text-emerald-400 font-black shadow-[0_0_15px_rgba(16,185,129,0.15)]";
              } else if (isSelected) {
                btnStyle = "bg-rose-500/20 border-rose-500/80 text-rose-400 font-semibold";
              } else {
                btnStyle = "bg-slate-900/40 border-slate-850 text-slate-500 opacity-60";
              }
            }

            return (
              <button
                key={idx}
                disabled={selectedAnswer !== null}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 rounded-2xl border text-sm sm:text-base transition-all duration-200 flex items-center justify-between active:scale-[0.99] select-none ${btnStyle}`}
              >
                <div className="min-w-0 flex-1 break-words overflow-wrap-anywhere">
                  <InlineMath math={formatTextForKatex(option)} />
                </div>
                {selectedAnswer !== null && option === shuffledCorrectAnswer && (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 ml-2 animate-pulse" />
                )}
                {selectedAnswer === option && option !== shuffledCorrectAnswer && (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Real-time Simulated Group Participants Status */}
      {mode === 'group' && !showGroupChart && (
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-md">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Xonadagi ishtirokchilar ({virtualPlayers.length + 1})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {virtualPlayers.map((player, index) => (
              <div 
                key={index} 
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2 flex items-center gap-2.5 shadow-inner"
              >
                <div className={`w-8 h-8 rounded-xl bg-linear-to-br ${player.avatarColor} flex items-center justify-center text-slate-950 font-bold text-xs shadow-md`}>
                  {player.name.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-slate-200 truncate leading-none mb-1">{player.name.split(' ')[0]}</span>
                  <span className={`text-[9px] font-mono leading-none ${
                    player.status === 'answered' ? 'text-emerald-400 font-bold' : 'text-amber-400 animate-pulse'
                  }`}>
                    {player.status === 'answered' ? 'Javob berdi' : 'Fikr qilmoqda...'}
                  </span>
                </div>
              </div>
            ))}

            {/* Current Real User block */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-2 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md">
                Siz
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-cyan-400 leading-none mb-1">{user.name.split(' ')[0]}</span>
                <span className={`text-[9px] font-mono leading-none ${
                  selectedAnswer ? 'text-emerald-400 font-bold' : 'text-slate-400 animate-pulse'
                }`}>
                  {selectedAnswer ? 'Javob berdi' : 'O\'ylamoqda...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual progression controls for Solo Mode or Unlimited Group Mode */}
      {((mode === 'solo') || (mode === 'group' && groupTimerSetting === 99999)) && selectedAnswer !== null && (
        <button
          onClick={handleNext}
          className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700/60 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white text-center transition-all duration-200 flex items-center justify-center gap-2 mt-1 active:scale-98 shadow-md"
        >
          {currentQuestionIdx + 1 === activeQuestions.length ? "Keyingi bosqich" : "Keyingi Savolga O'tish"}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {/* Group Mode Live Chat Panel */}
      {mode === 'group' && (
        <div className="bg-slate-850 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-lg">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            Lobby Jonli Chat xonasi
          </h4>

          {/* Messages Feed */}
          <div className="h-32 overflow-y-auto flex flex-col gap-2.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.isSelf ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-bold ${msg.isSelf ? 'text-cyan-400' : 'text-slate-400'}`}>{msg.sender}</span>
                  <span className="text-[8px] text-slate-500 font-mono">{msg.time}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-2xl text-xs leading-normal ${
                  msg.isSelf 
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-100 rounded-tr-none' 
                    : 'bg-slate-800 border border-slate-750 text-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendChatMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Xabaringizni yozing..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              className="px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center active:scale-95 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* SOLO VOTE/PROGRESS MODAL OVERLAY */}
      {showSoloVoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm text-center flex flex-col gap-5 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <Award className="w-6 h-6 text-cyan-400 animate-bounce" />
            </div>
            
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-black text-slate-100">Modul Yakunlandi</h3>
              <p className="text-xs text-slate-400 px-2 leading-relaxed mt-1">
                Siz {currentPartIdx + 1}-qismni ({activeQuestions.length} ta savol) muvaffaqiyatli yakunladingiz! Keyingi qadamni tanlang:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <button
                onClick={() => {
                  // Retry current part
                  setShowSoloVoteModal(false);
                  setCurrentQuestionIdx(0);
                  setPartScore(0);
                  setSelectedAnswer(null);
                }}
                className="py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Qayta ishlash
              </button>
              <button
                onClick={() => {
                  // Go to next part
                  setShowSoloVoteModal(false);
                  setCurrentPartIdx(prev => prev + 1);
                  setCurrentQuestionIdx(0);
                  setPartScore(0);
                  setSelectedAnswer(null);
                }}
                className="py-3 px-4 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                Next Modul
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GROUP VOTE/PROGRESS MODAL OVERLAY */}
      {showGroupVoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md text-center flex flex-col gap-5 shadow-2xl animate-fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-mono">Modul Yakunlandi Ovoz berish</span>
              <span className="text-xs font-bold font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                {voteTimer} soniya
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-black text-slate-100">Guruh bo'yicha keyingi qadam</h3>
              <p className="text-xs text-slate-400 px-4 leading-relaxed">
                Tizimda keyingi qismga o'tish yoki hozirgi 30 talik modulni qayta ishlash bo'yicha jamoaviy ovoz berish jarayoni ketmoqda. (Kamida 50% ovoz talab etiladi).
              </p>
            </div>

            {/* Voting distribution blocks */}
            <div className="flex flex-col gap-3 mt-1.5">
              {/* Option A: Next Part */}
              <button
                type="button"
                disabled={votingEnded}
                onClick={() => setUserVote('next')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  userVote === 'next'
                    ? 'bg-cyan-500/10 border-cyan-500/60 shadow-sm'
                    : 'bg-slate-950 border-slate-850 hover:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-200">Keyingi Qismga o'tish</span>
                  <span className="text-cyan-400 font-mono">
                    {virtualPlayers.filter(p => p.votedFor === 'next').length + (userVote === 'next' ? 1 : 0)} ovoz
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full mt-2">
                  <div 
                    className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${((virtualPlayers.filter(p => p.votedFor === 'next').length + (userVote === 'next' ? 1 : 0)) / 6) * 100}%` }}
                  />
                </div>
              </button>

              {/* Option B: Retry Part */}
              <button
                type="button"
                disabled={votingEnded}
                onClick={() => setUserVote('retry')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  userVote === 'retry'
                    ? 'bg-purple-500/10 border-purple-500/60 shadow-sm'
                    : 'bg-slate-950 border-slate-850 hover:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-200">Shu Qismni Qayta ishlash</span>
                  <span className="text-purple-400 font-mono">
                    {virtualPlayers.filter(p => p.votedFor === 'retry').length + (userVote === 'retry' ? 1 : 0)} ovoz
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full mt-2">
                  <div 
                    className="h-full bg-purple-400 rounded-full transition-all duration-300"
                    style={{ width: `${((virtualPlayers.filter(p => p.votedFor === 'retry').length + (userVote === 'retry' ? 1 : 0)) / 6) * 100}%` }}
                  />
                </div>
              </button>
            </div>

            {votingEnded && (
              <div className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-950 rounded-xl border border-slate-850 text-[10px] text-cyan-400 font-black uppercase tracking-wider font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Ovoz berish natijalari kiritilmoqda...
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHARE / INVITE DRAWER */}
      {showInviteDrawer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-t-3xl sm:rounded-3xl w-full max-w-sm text-center flex flex-col gap-5 shadow-2xl animate-slide-up">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-sm font-black text-slate-100">Hamkorlar Taklif qilish</span>
              <button onClick={() => setShowInviteDrawer(false)} className="text-xs text-slate-400 hover:text-white font-bold">Yopish</button>
            </div>

            <div className="w-32 h-32 bg-white rounded-2xl p-2.5 mx-auto border border-slate-200 flex items-center justify-center shadow-md">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}?quiz=${quiz.id}`)}`} 
                alt="QR Kod" 
                className="w-full h-full object-contain" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-black text-slate-200">Taklif havolasi yoki QR Kod</span>
              <p className="text-[11px] text-slate-400 px-2 leading-relaxed">
                Do'stlaringizga ushbu linkni yuboring, ular QR kodni skanerlash orqali real-time lobbyga qo'shilishlari mumkin.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}?quiz=${quiz.id}`} 
                className="flex-1 bg-transparent px-3 py-2 text-[10px] text-slate-300 font-mono focus:outline-none"
              />
              <button
                onClick={copyInviteLink}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black rounded-lg transition-all"
              >
                {inviteCopied ? 'Nusxalandi' : 'Nusxalash'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
