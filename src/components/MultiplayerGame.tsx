import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { GameRoomSummary, RoomPlayer, ChatMsg, Quiz } from '../types';
import {
  Crown, Check, X, Clock, MessageSquare, Send, Users, ArrowLeft, CheckCircle, AlertCircle
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MultiplayerGameProps {
  socket: Socket;
  room: GameRoomSummary;
  quiz: Quiz;
  myPlayerId: string;
  onFinish: (room: GameRoomSummary) => void;
  onBack: () => void;
}

// Helper function to preserve spaces in KaTeX
const formatTextForKatex = (text: string) => {
  // Replace multiple spaces with a single space and then replace single spaces with KaTeX's space command `\ `
  return (text || "").replace(/\s+/g, ' ').replace(/ /g, '\\ ');
};

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
  const [timeLeft, setTimeLeft] = useState(initialRoom.timerSeconds);  
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [newChatMsg, setNewChatMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isHost = room.hostId === myPlayerId;
  const totalQ = room.quizQuestionsCount;
  const currentQ = quiz.questions[currentQIdx];
  const myPlayerData = room.players.find(p => p.id === myPlayerId);
  const answered = !!selectedAnswer;

  
  // Refs for socket callbacks
  const showChatRef = useRef(showChat);
  const roomRef = useRef(room);

  useEffect(() => { showChatRef.current = showChat; }, [showChat]);
  useEffect(() => { roomRef.current = room; }, [room]);

  // Timer interval
  useEffect(() => {
    const timerId = setTimeout(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timerId);
  }, []);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    const handleScores = (data: { room: GameRoomSummary }) => {
      setRoom(data.room);
    };
    
    const handlePlayerAnswered = (data: {
      playerId: string;
      room: GameRoomSummary;
    }) => {
      setRoom(data.room);
    };

    const handleQuestionChanged = (data: { questionIndex: number; room: GameRoomSummary }) => {
      setRoom(data.room);
      setCurrentQIdx(data.questionIndex);
      setSelectedAnswer(null);
      setTimeLeft(data.room.timerSeconds); // Reset timer from server data
    };

    const handleGameFinished = (data: { room: GameRoomSummary }) => {
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
        text: `🚫 ${data.playerName} testni tark etdi`,
        time: new Date().toLocaleTimeString('uz'),
      }]);
    };

    const handleTimeChanged = (data: { delta: number }) => {
      setTimeLeft(prev => Math.max(0, prev + data.delta));
    };

    const handlePlayerStatusChanged = (data: { playerId: string; status: 'typing' | 'answered' | 'thinking' }) => {
      setRoom(prev => {
        const newPlayers = prev.players.map(p => p.id === data.playerId ? { ...p, status: data.status } : p);
        return { ...prev, players: newPlayers };
      });
    };

    socket.on('scoresUpdated', handleScores);
    socket.on('playerAnswered', handlePlayerAnswered);
    socket.on('questionChanged', handleQuestionChanged);
    socket.on('gameFinished', handleGameFinished);
    socket.on('chatMessage', handleChat);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('timeChanged', handleTimeChanged);
    socket.on('playerStatusChanged', handlePlayerStatusChanged);

    return () => {
      socket.off('scoresUpdated', handleScores);
      socket.off('playerAnswered', handlePlayerAnswered);
      socket.off('questionChanged', handleQuestionChanged);
      socket.off('gameFinished', handleGameFinished);
      socket.off('chatMessage', handleChat);
      socket.off('playerLeft', handlePlayerLeft);
      socket.off('timeChanged', handleTimeChanged);
      socket.off('playerStatusChanged', handlePlayerStatusChanged);
    };
  }, [socket, onFinish]);

  useEffect(() => {
    if (showChat) setNewChatMsg(false);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs, showChat]);

  const handleAnswer = (option: string) => {
    if (answered) return;
    setSelectedAnswer(option);
    
    // Serverga javobni yuborish (ballarni server hisoblaydi)
    socket.emit('submitAnswer', {
      roomId: room.id,
      questionIndex: currentQIdx,
      answer: option,
    });

    // Boshqalarga holatni bildirish
    socket.emit('playerStatus', { roomId: room.id, status: 'answered' });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('chatMessage', { roomId: room.id, text: chatInput.trim() });
    socket.emit('playerStatus', { roomId: room.id, status: 'thinking' }); // Yozib bo'lgandan keyin
    setChatInput('');
  };

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

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
              MULTIPLAYER DUEL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 font-mono">
              Savol: {room.currentQuestion + 1}/{totalQ}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-900/60 rounded-2xl px-3.5 py-2.5 border border-slate-800 mb-4 select-none">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-amber-400'}`} />
            <span className={`text-xs font-mono font-black ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
              Qolgan vaqt: {timeLeft} soniya
            </span>
          </div>
          
          {isHost && (
            <div className="flex items-center gap-1">
              <button title="10s qo'shish" onClick={() => socket.emit('changeTime', { roomId: room.id, delta: 10 })} className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 flex items-center justify-center font-black text-xs transition-all border border-slate-700 shadow-sm leading-none">+</button>
              <button title="10s ayirish" onClick={() => socket.emit('changeTime', { roomId: room.id, delta: -10 })} className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-400 flex items-center justify-center font-black text-xs transition-all border border-slate-700 shadow-sm leading-none">-</button>
            </div>
          )}
        </div>

        {/* Question content */}
        <div className="relative py-1">
          <div className="text-base sm:text-lg font-black leading-relaxed text-slate-100 font-sans select-none w-full break-word">
            <BlockMath math={formatTextForKatex(currentQ?.question)} />
          </div>
        </div>
      </div>

      {/* Options Deck */}
      <div className="flex flex-col gap-3">
          {currentQ?.options.map((option, idx) => {
            let btnStyle = "bg-slate-850 hover:bg-slate-800 border-slate-800 hover:border-slate-700/60 text-slate-200";
            const isCorrect = option === currentQ.correctAnswer;

            if (answered) {
              if (isCorrect) {
                btnStyle = "bg-emerald-500/20 border-emerald-500/80 text-emerald-400 font-black shadow-[0_0_15px_rgba(16,185,129,0.15)]";
              } else if (selectedAnswer === option) {
                btnStyle = "bg-rose-500/20 border-rose-500/80 text-rose-400 font-semibold";
              } else {
                btnStyle = "bg-slate-900/40 border-slate-850 text-slate-500 opacity-60";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                disabled={!!answered}
                className={`w-full text-left p-4 rounded-2xl border text-sm sm:text-base transition-all duration-200 flex items-center justify-between active:scale-[0.99] select-none ${btnStyle}`}
              >
                <div className="min-w-0 flex-1 break-word">
                  <InlineMath math={formatTextForKatex(option)} />
                </div>
                {answered && isCorrect && (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 ml-2 animate-pulse" />
                )}
                {answered && selectedAnswer === option && !isCorrect && (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
      </div>

      {/* Real-time Player Statuses */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-md">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          Xonadagi ishtirokchilar ({room.players.length})
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sortedPlayers.map((player) => {
            const isMe = player.id === myPlayerId;
            let statusText = "O'ylamoqda... 🤔";
            let statusClass = "text-amber-400";
            if (player.status === 'answered') {
              statusText = "Belgiladi! ✅";
              statusClass = "text-emerald-400 font-bold";
            } else if (player.status === 'typing') {
              statusText = "Xabar yozmoqda... 💬";
              statusClass = "text-cyan-400";
            } else if (player.status === 'joined') {
              statusText = "Qo'shildi ⚡";
              statusClass = "text-cyan-400 font-bold";
            }

            return (
              <div 
                key={player.id} 
                className={`border rounded-2xl p-2 flex items-center gap-2.5 shadow-inner ${isMe ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-900/60 border-slate-800/80'}`}
              >
                <div className={`w-8 h-8 rounded-xl bg-linear-to-br ${player.avatarColor} flex items-center justify-center text-slate-950 font-bold text-xs shadow-md`}>
                  {player.name.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-[11px] font-bold truncate leading-none mb-1 ${isMe ? 'text-cyan-400' : 'text-slate-200'}`}>{isMe ? `${player.name} (Siz)` : player.name}</span>
                  <span className={`text-[9px] font-mono leading-none ${statusClass}`}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-lg">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          Lobby Jonli Chat xonasi
        </h4>
        <div className="h-32 overflow-y-auto flex flex-col gap-2.5 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          {chatMsgs.map((msg, i) => (
            <div key={i} className={`flex flex-col max-w-[85%] ${msg.senderId === myPlayerId ? 'self-end items-end' : 'self-start items-start'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[9px] font-bold ${msg.senderId === myPlayerId ? 'text-cyan-400' : 'text-indigo-400'}`}>{msg.senderName}</span>
                <span className="text-[8px] text-slate-500 font-mono">{msg.time}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-2xl text-xs leading-normal ${msg.senderId === myPlayerId ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-100 rounded-tr-none' : 'bg-slate-800 border border-slate-750 text-slate-200 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSendChat(); }} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onFocus={() => socket.emit('playerStatus', { roomId: room.id, status: 'typing' })}
            onBlur={() => socket.emit('playerStatus', { roomId: room.id, status: 'thinking' })}
            onChange={e => setChatInput(e.target.value)}
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
    </div>
  );
}``