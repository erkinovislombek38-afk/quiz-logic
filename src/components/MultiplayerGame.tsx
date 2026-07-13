import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { GameRoomSummary, RoomPlayer, ChatMsg, Quiz } from '../types';
import {
  Crown, Check, X, Clock, MessageSquare, Send,
  Zap, Trophy, Shield, Users
} from 'lucide-react';

interface MultiplayerGameProps {
  socket: Socket;
  room: GameRoomSummary;
  quiz: Quiz;
  myPlayerId: string;
  onFinish: (room: GameRoomSummary) => void;
  onBack: () => void;
}

function pickGradient(name: string) {
  const colors = [
    'from-cyan-400 to-blue-500',
    'from-purple-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-rose-400 to-red-500',
    'from-indigo-400 to-violet-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function MultiplayerGame({
  socket,
  room: initialRoom,
  quiz,
  myPlayerId,
  onFinish,
  onBack,
}: MultiplayerGameProps) {
  const [room, setRoom] = useState<GameRoomSummary>(initialRoom);
  const [currentQIdx, setCurrentQIdx] = useState(initialRoom.currentQuestion);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialRoom.timerSeconds);
  const [myScore, setMyScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [newChatMsg, setNewChatMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isHost = room.hostId === myPlayerId;
  const questions = quiz.questions;
  const totalQ = questions.length;
  const currentQ = questions[currentQIdx];

  // Refs for socket callbacks
  const showChatRef = useRef(showChat);
  const myScoreRef = useRef(myScore);
  const roomRef = useRef(room);

  useEffect(() => { showChatRef.current = showChat; }, [showChat]);
  useEffect(() => { myScoreRef.current = myScore; }, [myScore]);
  useEffect(() => { roomRef.current = room; }, [room]);

  // Timer interval
  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    const handleScores = (data: { room: GameRoomSummary }) => setRoom(data.room);

    const handlePlayerAnswered = (data: {
      playerId: string;
      questionIndex: number;
      totalAnswered: number;
      totalPlayers: number;
    }) => {
      setAnsweredCount(data.totalAnswered);
    };

    const handleQuestionChanged = (data: { questionIndex: number; room: GameRoomSummary }) => {
      setRoom(data.room);
      setCurrentQIdx(data.questionIndex);
      setSelectedAnswer(null);
      setAnswered(false);
      setAnsweredCount(0);
      setTimeLeft(data.room.timerSeconds); // Reset timer from server data
    };

    const handleGameFinished = (data: { room: GameRoomSummary }) => {
      // Update my score in the room before finishing
      socket.emit('playerFinished', { roomId: roomRef.current.id, score: myScoreRef.current });
      setTimeout(() => onFinish(data.room), 500);
    };

    const handleChat = (msg: ChatMsg) => {
      setChatMsgs(prev => [...prev, msg]);
      if (!showChatRef.current) setNewChatMsg(true);
    };

    const handlePlayerLeft = (data: { playerName: string; room: GameRoomSummary }) => {
      setRoom(data.room);
      setChatMsgs(prev => [...prev, {
        senderId: 'system',
        senderName: 'Tizim',
        text: `${data.playerName} o'yindan chiqdi`,
        time: new Date().toLocaleTimeString('uz'),
      }]);
    };

    const handleTimeChanged = (data: { delta: number }) => {
      setTimeLeft(prev => Math.max(0, prev + data.delta));
    };

    socket.on('scoresUpdated', handleScores);
    socket.on('playerAnswered', handlePlayerAnswered);
    socket.on('questionChanged', handleQuestionChanged);
    socket.on('gameFinished', handleGameFinished);
    socket.on('chatMessage', handleChat);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('timeChanged', handleTimeChanged);

    return () => {
      socket.off('scoresUpdated', handleScores);
      socket.off('playerAnswered', handlePlayerAnswered);
      socket.off('questionChanged', handleQuestionChanged);
      socket.off('gameFinished', handleGameFinished);
      socket.off('chatMessage', handleChat);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('timeChanged', handleTimeChanged);
    };
  }, [socket, onFinish]);

  useEffect(() => {
    if (showChat) setNewChatMsg(false);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs, showChat]);

  const handleAnswer = (option: string) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    const isCorrect = option === currentQ.correctAnswer;
    const newCorrect = correctAnswers + (isCorrect ? 1 : 0);
    const newScore = myScore + (isCorrect ? 10 : 0);

    if (isCorrect) setCorrectAnswers(newCorrect);
    setMyScore(newScore);

    socket.emit('submitAnswer', {
      roomId: room.id,
      questionIndex: currentQIdx,
      answer: option,
    });

    socket.emit('updateScore', { roomId: room.id, score: newScore });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('chatMessage', { roomId: room.id, text: chatInput.trim() });
    setChatInput('');
  };

  const timerPct = (timeLeft / room.timerSeconds) * 100;
  const timerColor = timeLeft > room.timerSeconds * 0.5
    ? 'from-emerald-500 to-cyan-500'
    : timeLeft > room.timerSeconds * 0.25
      ? 'from-amber-500 to-orange-500'
      : 'from-rose-500 to-red-600';

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3 animate-fade-in">
      {/* Top bar: progress + timer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-400 uppercase tracking-wide font-black">
              Savol {currentQIdx + 1} / {totalQ}
            </span>
            <span className="text-cyan-400 font-mono">{myScore} ball</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${((currentQIdx) / totalQ) * 100}%` }}
            />
          </div>
        </div>

        {/* Timer & Host Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isHost && (
            <div className="flex flex-col gap-1">
              <button title="10s qo'shish" onClick={() => socket.emit('changeTime', { roomId: room.id, delta: 10 })} className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-400 flex items-center justify-center font-black text-xs transition-all border border-slate-700 shadow-sm leading-none">+</button>
              <button title="10s ayirish" onClick={() => socket.emit('changeTime', { roomId: room.id, delta: -10 })} className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-rose-400 flex items-center justify-center font-black text-xs transition-all border border-slate-700 shadow-sm leading-none">-</button>
            </div>
          )}
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#1e293b" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="24"
                fill="none"
                stroke="url(#timerGrad)"
                strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - timerPct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={timeLeft <= room.timerSeconds * 0.25 ? '#f43f5e' : timeLeft <= room.timerSeconds * 0.5 ? '#f59e0b' : '#06b6d4'} />
                  <stop offset="100%" stopColor={timeLeft <= room.timerSeconds * 0.25 ? '#ef4444' : timeLeft <= room.timerSeconds * 0.5 ? '#f97316' : '#3b82f6'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-black font-mono ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Leaderboard */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {sortedPlayers.slice(0, 5).map((p, i) => {
          const isMe = p.id === myPlayerId;
          return (
            <div
              key={p.id}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] transition-all ${
                isMe
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <span className={`font-black font-mono text-[9px] ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                #{i + 1}
              </span>
              {i === 0 && <Crown className="w-3 h-3 text-amber-400" />}
              <span className="font-bold truncate max-w-16">{isMe ? 'Siz' : p.name}</span>
              <span className="font-mono font-black ml-auto">{p.score}</span>
            </div>
          );
        })}
      </div>

      {/* Question card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-5 shadow-xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-[11px] font-black text-slate-950 shrink-0">
              {currentQIdx + 1}
            </div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
              {answeredCount}/{room.players.length} ta javob berdi
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed break-words">
            {currentQ?.question}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {currentQ?.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQ.correctAnswer;
            const showResult = answered;
            
            // Calculate percentage
            const stats = room.currentAnswersStats || {};
            const totalStats = (Object.values(stats) as any[]).reduce((a, b) => (a as any) + (b as any), 0);            const pickCount = stats[option] || 0;
            const pct = totalStats > 0 ? Math.round((pickCount / totalStats) * 100) : 0;

            let btnClass = 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-600 hover:bg-slate-950';
            if (showResult) {
              if (isCorrect) btnClass = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
              else if (isSelected && !isCorrect) btnClass = 'bg-rose-500/15 border-rose-500/50 text-rose-300';
              else btnClass = 'bg-slate-950/40 border-slate-800/50 text-slate-500';
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={answered}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs font-semibold transition-all duration-200 flex items-center gap-3 relative overflow-hidden ${btnClass} ${!answered ? 'active:scale-98 cursor-pointer' : 'cursor-default'}`}
              >
                {/* Percentage Progress Bar Background */}
                {showResult && (
                  <div 
                    className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ${
                      isCorrect ? 'bg-emerald-500/10' : 'bg-slate-500/10'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border relative z-10 ${
                  showResult && isCorrect ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                  showResult && isSelected ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' :
                  'bg-slate-900 border-slate-700 text-slate-400'
                }`}>
                  {['A', 'B', 'C', 'D'][idx]}
                </span>
                <span className="flex-1 leading-snug relative z-10 break-words">{option}</span>
                
                {/* Stats Text */}
                {showResult && (
                  <span className={`text-[10px] font-black relative z-10 ${isCorrect ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {pct}%
                  </span>
                )}

                {showResult && isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0 relative z-10" />}
                {showResult && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-400 shrink-0 relative z-10" />}
              </button>
            );
          })}
        </div>

        {/* Status after answering */}
        {answered && (
          <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            selectedAnswer === currentQ.correctAnswer
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
          }`}>
            {selectedAnswer === currentQ.correctAnswer
              ? <><Check className="w-4 h-4" /> To'g'ri! +10 ball</>
              : <><X className="w-4 h-4" /> Noto'g'ri. To'g'ri: {currentQ.correctAnswer.substring(0, 60)}...</>
            }
            <span className="ml-auto text-[9px] text-slate-500">
              Keyingi savolni kuting...
            </span>
          </div>
        )}

      </div>

      {/* Chat toggle + panel */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowChat(p => !p)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black transition-all relative ${
            showChat ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
          {newChatMsg && !showChat && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
          )}
        </button>
        <button
          onClick={onBack}
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-rose-400 text-[10px] font-black rounded-xl transition-all"
        >
          Chiqish
        </button>
      </div>

      {showChat && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 animate-fade-in">
          <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
            {chatMsgs.length === 0 && (
              <span className="text-[10px] text-slate-600 italic text-center py-2">Hali xabar yo'q...</span>
            )}
            {chatMsgs.map((msg, i) => (
              <div key={i} className={`text-[10px] ${msg.senderId === 'system' ? 'text-slate-500 italic text-center' : ''}`}>
                {msg.senderId !== 'system' && (
                  <span className={`font-bold ${msg.senderId === myPlayerId ? 'text-cyan-400' : 'text-indigo-400'}`}>
                    {msg.senderName}:{' '}
                  </span>
                )}
                <span className="text-slate-300">{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent form submission if it's in a form
                  handleSendChat();
                }
              }}
              placeholder="Xabar..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/40 transition-colors"
            />
            <button onClick={handleSendChat} className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
