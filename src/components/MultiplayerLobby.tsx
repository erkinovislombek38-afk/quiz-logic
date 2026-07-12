import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameRoomSummary, RoomPlayer, ChatMsg, Quiz, User } from '../types';
import {
  Users, Copy, Check, Crown, Wifi, WifiOff, MessageSquare, Send,
  Play, LogIn, X, Loader2, AlertCircle, Globe, Zap, Clock
} from 'lucide-react';

interface MultiplayerLobbyProps {
  user: User;
  quizzes: Quiz[];
  initialRoomId?: string | null;    // from URL ?room=XXXXX
  initialQuizId?: string | null;    // if coming from "Start Group"
  onGameStart: (socket: Socket, room: GameRoomSummary, quiz: Quiz) => void;
  onBack: () => void;
}

const AVATAR_COLORS = [
  'from-cyan-400 to-blue-500',
  'from-purple-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-red-500',
  'from-indigo-400 to-violet-500',
  'from-lime-400 to-green-500',
  'from-sky-400 to-blue-600',
];

function pickColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MultiplayerLobby({
  user,
  quizzes,
  initialRoomId,
  initialQuizId,
  onGameStart,
  onBack,
}: MultiplayerLobbyProps) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>(
    initialRoomId ? 'join' : initialQuizId ? 'create' : 'choose'
  );

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<GameRoomSummary | null>(null);
  const [roomQuizQuestions, setRoomQuizQuestions] = useState<any[]>([]); // ← Server'dan kelgan quiz savollari
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [timerSetting, setTimerSetting] = useState(30);
  const [joinRoomId, setJoinRoomId] = useState(initialRoomId || '');
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizId || '');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isStartingGameRef = useRef(false);

  // Connect socket
  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:3001';

   const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      path: '/socket.io',
    });

    s.on('connect', () => {
      setConnected(true);
      setError(null);
      console.log('[Socket] Connected:', s.id);

      // If coming from URL with room ID, auto-join
      if (initialRoomId) {
        setIsLoading(true);
        s.emit('joinRoom', {
          roomId: initialRoomId.toUpperCase(),
          playerName: user.name,
          playerColor: pickColor(user.name),
        });
      }
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('connect_error', () => {
      setError('Serverga ulanib bo\'lmadi. Sahifani yangilang.');
      setConnected(false);
    });

    s.on('error', (data: { message: string }) => {
      setError(data.message);
      setIsLoading(false);
    });

    s.on('roomCreated', (data: { roomId: string; room: GameRoomSummary & { quizQuestions?: any[] } }) => {
      const me = Object.values(data.room.players)[0];
      setMyPlayerId(me?.id || '');
      // Server'dan kelgan quiz savollarini saqlash
      if (data.room.quizQuestions && data.room.quizQuestions.length > 0) {
        setRoomQuizQuestions(data.room.quizQuestions);
      }
      setRoom(data.room);
      setIsLoading(false);
      setError(null);
    });

    s.on('roomJoined', (data: { roomId: string; room: GameRoomSummary & { quizQuestions?: any[] } }) => {
      const mySocketId = s.id;
      // Find my player by socket-based ID pattern
      const me = data.room.players.find(p => p.id.includes(mySocketId?.slice(-6) || ''));
      setMyPlayerId(me?.id || data.room.players[data.room.players.length - 1]?.id || '');
      // Server'dan kelgan quiz savollarini saqlash
      if (data.room.quizQuestions && data.room.quizQuestions.length > 0) {
        setRoomQuizQuestions(data.room.quizQuestions);
      }
      setRoom(data.room);
      setIsLoading(false);
      setError(null);
    });

    s.on('playerJoined', (data: { player: RoomPlayer; room: GameRoomSummary }) => {
      setRoom(data.room);
      setChatMsgs(prev => [...prev, {
        senderId: 'system',
        senderName: 'Tizim',
        text: `${data.player.name} xonaga qo'shildi 🎉`,
        time: new Date().toLocaleTimeString('uz'),
      }]);
    });

    s.on('playerLeft', (data: { playerName: string; room: GameRoomSummary }) => {
      setRoom(data.room);
      setChatMsgs(prev => [...prev, {
        senderId: 'system',
        senderName: 'Tizim',
        text: `${data.playerName} xonadan chiqdi`,
        time: new Date().toLocaleTimeString('uz'),
      }]);
    });

    s.on('roomUpdated', (data: { room: GameRoomSummary }) => {
      setRoom(data.room);
    });

    s.on('chatMessage', (msg: ChatMsg) => {
      setChatMsgs(prev => [...prev, msg]);
    });

    s.on('gameStarted', (data: { room: GameRoomSummary & { quizQuestions?: any[] }; questionIndex: number }) => {
      // Mahalliy quizdan topishga urinsak
      let quiz = quizzes.find(q => q.id === data.room.quizId);

      // Topilmadi (boshqa qurilmadan URL orqali kelgan) — server'dan kelgan savollarni ishlat
      if (!quiz && data.room.quizQuestions && data.room.quizQuestions.length > 0) {
        quiz = {
          id: data.room.quizId,
          title: data.room.quizTitle,
          creator: 'Server',
          questionsCount: data.room.quizQuestionsCount,
          subject: 'Multiplayer',
          description: '',
          level: "O'rta" as const,
          questions: data.room.quizQuestions,
        };
      } else if (!quiz && roomQuizQuestions.length > 0) {
        // roomJoined eventida saqlangan savollarni ishlat
        quiz = {
          id: data.room.quizId,
          title: data.room.quizTitle,
          creator: 'Server',
          questionsCount: data.room.quizQuestionsCount,
          subject: 'Multiplayer',
          description: '',
          level: "O'rta" as const,
          questions: roomQuizQuestions,
        };
      }

      if (quiz) {
        isStartingGameRef.current = true;
        onGameStart(s, data.room, quiz);
      } else {
        setError('Quiz topilmadi. Xona egasi boshqa quiz tanlagan bo\'lishi mumkin.');
      }
    });

    setSocket(s);
    return () => {
      if (!isStartingGameRef.current) {
        s.disconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  const handleCreateRoom = () => {
    if (!socket || !connected) { setError('Server bilan aloqa yo\'q.'); return; }
    const quiz = quizzes.find(q => q.id === selectedQuizId);
    if (!quiz) { setError('Iltimos, bitta test tanlang.'); return; }

    setIsLoading(true);
    setError(null);
    socket.emit('createRoom', {
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizQuestionsCount: quiz.questionsCount,
      quizQuestions: quiz.questions, // ← Quiz savollari server'ga yuboriladi
      playerName: user.name,
      playerColor: pickColor(user.name),
      timerSeconds: timerSetting,
    });
  };

  const handleJoinRoom = () => {
    if (!socket || !connected) { setError('Server bilan aloqa yo\'q.'); return; }
    if (!joinRoomId.trim()) { setError('Xona ID sini kiriting.'); return; }

    setIsLoading(true);
    setError(null);
    socket.emit('joinRoom', {
      roomId: joinRoomId.trim().toUpperCase(),
      playerName: user.name,
      playerColor: pickColor(user.name),
    });
  };

  const handleStartGame = () => {
    if (!socket || !room) return;
    socket.emit('startGame', { roomId: room.id });
  };

  const handleCopyLink = () => {
    if (!room) return;
    const link = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendChat = () => {
    if (!socket || !room || !chatInput.trim()) return;
    socket.emit('chatMessage', { roomId: room.id, text: chatInput.trim() });
    setChatInput('');
  };

  const isHost = room ? room.hostId === myPlayerId : false;
  const inviteLink = room ? `${window.location.origin}?room=${room.id}` : '';

  // ── LOBBY UI (after joining/creating room) ──
  if (room) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col gap-4 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-blue-700 to-cyan-600 p-5 rounded-3xl border border-white/10 shadow-xl">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-200">
                  {connected ? 'REAL-TIME ULANISH FAOL' : 'UZILDI'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">🎮 Guruh Xonasi</h2>
              <p className="text-xs text-indigo-100/80 font-medium">{room.quizTitle}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-white font-mono tracking-widest">{room.id}</div>
              <span className="text-[9px] text-indigo-200 font-bold uppercase">Xona ID</span>
            </div>
          </div>
        </div>

        {/* Invite link */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-black uppercase text-slate-300 tracking-wider">Do'stlarga Havola Ulash</span>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-400 select-all outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-[10px] font-black rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Nusxalandi!' : 'Nusxalash'}
            </button>
          </div>
          <p className="text-[9px] text-slate-500 font-mono">
            Ushbu havolani do'stlaringizga yuboring. Ular bosishi bilan bu xonaga avtomatik qo'shiladi.
          </p>
        </div>

        {/* Players */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-black uppercase text-slate-300 tracking-wider">
                Ishtirokchilar ({room.players.length}/10)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-amber-400 font-bold">{room.timerSeconds}s / savol</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {room.players.map((player) => {
              const isMe = player.id === myPlayerId;
              const isRoomHost = player.id === room.hostId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-linear-to-tr ${pickColor(player.name)} flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow`}>
                    {player.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold truncate ${isMe ? 'text-cyan-400' : 'text-slate-200'}`}>
                        {player.name} {isMe && '(Siz)'}
                      </span>
                      {isRoomHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {player.ready ? '✅ Tayyor' : '⏳ Kutmoqda'}
                    </span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
              );
            })}

            {room.players.length < 2 && (
              <div className="p-3 border border-dashed border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-500">
                  ⏳ Kamida 2 kishi kerak. Do'stlaringiz qo'shilishini kuting...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Xona Chati</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
            {chatMsgs.length === 0 && (
              <span className="text-[10px] text-slate-600 italic py-2 text-center">Hali xabar yo'q...</span>
            )}
            {chatMsgs.map((msg, i) => (
              <div key={i} className={`text-[10px] ${msg.senderId === 'system' ? 'text-slate-500 italic text-center' : ''}`}>
                {msg.senderId !== 'system' && (
                  <span className={`font-bold ${msg.senderId === myPlayerId ? 'text-cyan-400' : 'text-indigo-400'}`}>
                    {msg.senderName}:{' '}
                  </span>
                )}
                <span className="text-slate-300">{msg.text}</span>
                <span className="text-slate-600 ml-1 text-[8px]">{msg.time}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 pt-1">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Xabar yozing..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-colors"
            />
            <button
              onClick={handleSendChat}
              className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-400 rounded-xl transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Start button (host only) */}
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={room.players.length < 1}
            className="w-full py-4 bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98"
          >
            <Play className="w-5 h-5" />
            O'YINNI BOSHLASH 🚀
          </button>
        ) : (
          <div className="w-full py-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs font-bold">
            ⏳ Xona egasi o'yinni boshlaguncha kuting...
          </div>
        )}

        <button
          onClick={onBack}
          className="text-[10px] text-slate-500 hover:text-slate-300 font-bold text-center transition-colors"
        >
          ← Chiqish va Asosiy sahifaga qaytish
        </button>
      </div>
    );
  }

  // ── CHOOSE MODE or CREATE/JOIN FORM ──
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-purple-700 to-pink-600 p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-white/10 rounded-full blur-xl" />
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">
              {connected ? 'SERVER BILAN ULANGAN' : 'ULANMOQDA...'}
            </span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">🌐 Multiplayer Rejim</h2>
          <p className="text-xs text-indigo-100/80">Do'stlar bilan birgalikda test ishlang!</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {mode === 'choose' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode('create')}
            className="p-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/30 rounded-2xl text-left flex items-center gap-4 transition-all group"
          >
            <div className="w-12 h-12 bg-linear-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-100">Yangi Xona Yaratish</span>
              <span className="text-[10px] text-slate-400 font-medium">Siz host bo'lasiz va do'stlarni taklif qilasiz</span>
            </div>
          </button>

          <button
            onClick={() => setMode('join')}
            className="p-5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 rounded-2xl text-left flex items-center gap-4 transition-all group"
          >
            <div className="w-12 h-12 bg-linear-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-100">Xonaga Qo'shilish</span>
              <span className="text-[10px] text-slate-400 font-medium">Havola yoki xona ID orqali kiring</span>
            </div>
          </button>

          <button onClick={onBack} className="text-[10px] text-slate-500 hover:text-slate-300 font-bold text-center pt-1 transition-colors">
            ← Orqaga
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-300 tracking-wider">Yangi Xona Sozlamalari</span>
            <button onClick={() => setMode('choose')} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
          </div>

          {/* Quiz select */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Test Tanlang</label>
            <select
              value={selectedQuizId}
              onChange={e => setSelectedQuizId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="">— Test tanlang —</option>
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>{q.title} ({q.questionsCount} ta savol)</option>
              ))}
            </select>
          </div>

          {/* Timer */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Savol Boshiga Vaqt</label>
            <div className="flex gap-2">
              {[15, 20, 30, 45, 60].map(s => (
                <button
                  key={s}
                  onClick={() => setTimerSetting(s)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                    timerSetting === s
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isLoading || !selectedQuizId || !connected}
            className="w-full py-3.5 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isLoading ? 'Xona yaratilmoqda...' : 'XONA YARATISH'}
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-300 tracking-wider">Xonaga Qo'shilish</span>
            <button onClick={() => setMode('choose')} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wide">Xona ID (6 ta harf/raqam)</label>
            <input
              value={joinRoomId}
              onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
              placeholder="Masalan: ABC123"
              maxLength={6}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 font-mono tracking-widest outline-none focus:border-indigo-500/50 transition-colors uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600"
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={isLoading || joinRoomId.trim().length < 4 || !connected}
            className="w-full py-3.5 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {isLoading ? 'Qo\'shilmoqda...' : 'XONAGA KIRISH'}
          </button>

          <p className="text-[9px] text-slate-500 text-center font-mono">
            Havola orqali kirgan bo'lsangiz, bu maydon avtomatik to'lgan bo'ladi.
          </p>
        </div>
      )}
    </div>
  );
}
