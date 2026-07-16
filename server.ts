import express from "express";
import path from "path";
import multer from 'multer';
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import * as pdf from 'pdf-parse';
import mammoth from 'mammoth';

dotenv.config();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────────
// SOCKET.IO — Real-time Multiplayer Game Rooms
// ─────────────────────────────────────────────

// server.ts Netlify Functions'da ishga tushganda, yangi server yaratish o'rniga
// mavjud HTTP serverni ishlatishimiz kerak.
const httpServer = createHttpServer(app);

const io = new SocketIOServer(httpServer, { // httpServer'ni bu yerda ishlatamiz
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["websocket", "polling"],
});

interface RoomPlayer {
  id: string;
  name: string;
  avatarColor: string;
  score: number;
  ready: boolean;
  answers: { [questionIdx: number]: string };
  finishedAt?: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface GameRoom {
  id: string;
  quizId: string;
  quizTitle: string;
  quizQuestionsCount: number;
  quizQuestions: QuizQuestion[]; // ← Quiz savollari serverda saqlanadi
  hostId: string;
  hostSocketId: string;
  players: { [socketId: string]: RoomPlayer };
  status: "lobby" | "playing" | "finished";
  currentQuestion: number;
  answers: { [questionIdx: number]: { [playerId: string]: string } };
  timerSeconds: number;
  questionTimer?: NodeJS.Timeout; // Savol uchun taymer
  startedAt?: number;
  rematchVotes?: { [playerId: string]: 'rematch' | 'finish' };
}

const rooms = new Map<string, GameRoom>();

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  rank: string;
  avatarColor?: string;
  nickname?: string;
  role?: string;
}
const registeredUsers = new Map<string, UserProfile>();

const sharedQuizzes: { quizId: string, quizTitle: string, senderName: string, sharedAt: number }[] = [];

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(id) ? generateRoomId() : id;
}

function getRoomSummary(room: GameRoom) {
  const currentAnswersStats: Record<string, number> = {};
  if (room.answers[room.currentQuestion]) {
    for (const ans of Object.values(room.answers[room.currentQuestion])) {
      currentAnswersStats[ans] = (currentAnswersStats[ans] || 0) + 1;
    }
  }

  return {
    id: room.id,
    quizId: room.quizId,
    quizTitle: room.quizTitle,
    quizQuestionsCount: room.quizQuestionsCount,
    hostId: room.hostId,
    status: room.status,
    currentQuestion: room.currentQuestion,
    timerSeconds: room.timerSeconds,
    currentAnswersStats,
    rematchVotes: room.rematchVotes || {},
    players: Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      avatarColor: p.avatarColor,
      score: p.score,
      ready: p.ready,
      finishedAt: p.finishedAt,
    })),
  };
}

function getRoomWithQuiz(room: GameRoom) {
  return {
    ...getRoomSummary(room),
    quizQuestions: room.quizQuestions,
  };
}

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // 1. Foydalanuvchini identifikatsiya qilish
    socket.on("identify", (userData: { uid: string, name: string }) => {
      socket.join(`user-${userData.uid}`); // Har bir foydalanuvchi uchun kanal
      console.log(`[User] Identified: ${userData.name} (${userData.uid})`);
    });

    // 2. Obuna bo'lganda real-time xabar yuborish
    socket.on("followUser", (data: { follower: any, targetUid: string }) => {
      io.to(`user-${data.targetUid}`).emit("newNotification", {
        id: `follow-${Date.now()}`,
        title: "Yangi Obunachi! 👤",
        sender: data.follower.name,
        text: `${data.follower.name} sizga obuna bo'ldi.`,
        type: 'system',
        time: "Hozirgina",
        data: { followerUid: data.follower.uid }
      });
    });

    // 3. Test ulashilganda hamma onlayn foydalanuvchilarga xabar berish
    socket.on("shareQuiz", (data: { quizId: string, senderName: string, quizTitle: string }) => {
      const newSharedQuiz = {
        quizId: data.quizId,
        quizTitle: data.quizTitle,
        senderName: data.senderName,
        sharedAt: Date.now(),
      };
      sharedQuizzes.unshift(newSharedQuiz); // Add to the beginning of the array

      // Barcha ulangan klientlarga, shu jumladan yuboruvchiga ham xabar berish
      io.emit("newNotification", {
        id: `share-${Date.now()}`,
        title: "Yangi Test Ulashildi 🚀",
        sender: data.senderName,
        text: `${data.senderName} yangi "${data.quizTitle}" testini guruhga tashladi!`,
        type: 'system',
        time: "Hozirgina",
        quizId: data.quizId, // Include quizId for direct access
      });
    });
    socket.on('getSharedQuizzes', (callback) => { callback(sharedQuizzes); });

    // ── CREATE ROOM ──
    socket.on(
      "createRoom",
      (data: {
        quizId: string;
        quizTitle: string;
        quizQuestionsCount: number;
        quizQuestions: QuizQuestion[]; // ← Yangi: quiz savollari
        playerName: string;
        playerColor: string;
        timerSeconds: number;
      }) => {
        const roomId = generateRoomId();
        const playerId = `player-${socket.id}`;

        const room: GameRoom = {
          id: roomId,
          quizId: data.quizId,
          quizTitle: data.quizTitle,
          quizQuestionsCount: data.quizQuestionsCount,
          quizQuestions: data.quizQuestions || [], // ← Savolllarni saqlash
          hostId: playerId,
          hostSocketId: socket.id,
          status: "lobby",
          currentQuestion: 0,
          timerSeconds: Number(data.timerSeconds) || 30,
          answers: {},
          players: {
            [socket.id]: {
              id: playerId,
              name: data.playerName || "Xost",
              avatarColor: data.playerColor || "bg-cyan-500",
              score: 0,
              ready: true,
              answers: {},
            },
          },
        };

        rooms.set(roomId, room);
        socket.join(roomId);
        // Xona yaratuvchiga quiz savollari bilan birga yuborish
        socket.emit("roomCreated", { roomId, room: getRoomWithQuiz(room) });
        console.log(`[Room] Created: ${roomId} by ${data.playerName} (${data.quizQuestions?.length || 0} savol)`);
      }
    );

    // ── JOIN ROOM ──
    socket.on(
      "joinRoom",
      (data: {
        roomId: string;
        playerName: string;
        playerColor: string;
      }) => {
        const room = rooms.get(data.roomId.toUpperCase());
        if (!room) {
          socket.emit("error", { message: "Xona topilmadi. ID ni tekshiring." });
          return;
        }
        if (Object.keys(room.players).length >= 30) {
          socket.emit("error", { message: "Xona to'ldi (maksimal 30 ta o'yinchi)." });
          return;
        }

        const playerId = `player-${socket.id}`;
        room.players[socket.id] = {
          id: playerId,
          name: data.playerName || "Mehmon",
          avatarColor: data.playerColor || "bg-purple-500",
          score: 0,
          ready: false,
          answers: {}
        };

        socket.join(data.roomId.toUpperCase());
        // Yangi o'yinchiga quiz savollari bilan birga yuborish
        socket.emit("roomJoined", { roomId: room.id, room: getRoomWithQuiz(room) });
        io.to(room.id).emit("playerJoined", {
          player: room.players[socket.id],
          room: getRoomSummary(room),
        });
        console.log(`[Room] ${data.playerName} joined: ${room.id}`);
      }
    );

    // ── PLAYER READY ──
    socket.on("playerReady", (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.players[socket.id]) return;
      room.players[socket.id].ready = true;
      io.to(room.id).emit("roomUpdated", { room: getRoomSummary(room) });
    });

    // ── START GAME (host only) ──
    socket.on("startGame", (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      if (room.hostSocketId !== socket.id) {
        socket.emit("error", { message: "Faqat xona egasi o'yinni boshlashi mumkin." });
        return;
      }
      if (Object.keys(room.players).length < 1) return;

      room.status = "playing";
      room.currentQuestion = 0;
      room.startedAt = Date.now();

      // Avtomatik keyingi savolga o'tish funksiyasi
      const advanceQuestion = () => {
        if (room.questionTimer) clearTimeout(room.questionTimer);
        if (room.status !== 'playing') return;

        room.currentQuestion++;

        if (room.currentQuestion >= room.quizQuestionsCount) {
          // O'YIN TUGADI - OVOZ BERISHNI BOSHLASH
          room.status = "finished";
          room.rematchVotes = {}; // Ovoz berishni tozalash
          io.to(room.id).emit("gameFinished", { room: getRoomSummary(room) });
          console.log(`[Room] Game finished automatically: ${room.id}`);

          // Ovoz berish uchun 30 soniya taymer
          room.questionTimer = setTimeout(() => {
            const currentRoom = rooms.get(room.id);
            if (!currentRoom || currentRoom.status !== 'finished') return;

            const votes = Object.values(currentRoom.rematchVotes || {});
            const rematchCount = votes.filter(v => v === 'rematch').length;
            const finishCount = votes.filter(v => v === 'finish').length;

            if (rematchCount > finishCount) {
              // Qayta o'ynash
              currentRoom.status = 'playing';
              currentRoom.currentQuestion = 0;
              currentRoom.answers = {};
              currentRoom.rematchVotes = {};
              Object.values(currentRoom.players).forEach(p => {
                p.score = 0;
                p.answers = {};
                p.finishedAt = undefined;
              });
              io.to(room.id).emit("gameRestarted", { room: getRoomWithQuiz(currentRoom) });
              console.log(`[Room] Rematch started: ${room.id}`);
              advanceQuestion(); // Start the question timer again
            } else {
              // Yakunlash
              io.to(room.id).emit("lobbyClosed");
              rooms.delete(room.id);
              console.log(`[Room] Lobby closed after voting: ${room.id}`);
            }
          }, 30000);
        } else {
          io.to(room.id).emit("questionChanged", {
            questionIndex: room.currentQuestion,
            room: getRoomSummary(room),
          });
          // Keyingi savol uchun yangi taymerni o'rnatish
          room.questionTimer = setTimeout(advanceQuestion, (room.timerSeconds + 2) * 1000); // +2s bufer
        }
      };
      room.questionTimer = setTimeout(advanceQuestion, (room.timerSeconds + 2) * 1000);

      // gameStarted eventida quiz savollari ham yuboriladi — URL orqali kelgan o'yinchilar uchun
      io.to(room.id).emit("gameStarted", {
        room: getRoomWithQuiz(room),
        questionIndex: 0,
      });
      console.log(`[Room] Game started: ${room.id}`);
    });

    // ── SUBMIT ANSWER ──
    socket.on(
      "submitAnswer",
      (data: { roomId: string; questionIndex: number; answer: string }) => {
        const room = rooms.get(data.roomId);
        if (!room || !room.players[socket.id]) return;
        if (room.status !== "playing") return;

        const player = room.players[socket.id];

        // Don't allow re-submission
        if (player.answers[data.questionIndex] !== undefined) return;

        // Javobni saqlash
        player.answers[data.questionIndex] = data.answer;

        // Ballarni serverda xavfsiz hisoblash
        const question = room.quizQuestions[data.questionIndex];
        if (question && question.correctAnswer === data.answer) {
          player.score += 10; // To'g'ri javob uchun 10 ball
        }

        // Barcha o'yinchilarga yangilangan ballarni yuborish
        io.to(room.id).emit("scoresUpdated", { room: getRoomSummary(room) });

        // Boshqa o'yinchilarga kim javob berganini bildirish
        io.to(room.id).emit("playerAnswered", { playerId: player.id, room: getRoomSummary(room) });
      }
    );

    // Xavfsiz bo'lmagan 'updateScore' hodisasi olib tashlandi
    /*
    socket.on("updateScore", ...);
    */

    // ── CHANGE TIME DYNAMICALLY ──
    socket.on("changeTime", (data: { roomId: string; delta: number }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      if (room.hostSocketId !== socket.id) return;
      io.to(room.id).emit("timeChanged", { delta: data.delta });
    });

    // ── PLAYER STATUS UPDATE (typing, answered, etc.) ──
    socket.on("playerStatus", (data: { roomId: string; status: 'typing' | 'answered' | 'thinking' }) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.players[socket.id]) return;
      const player = room.players[socket.id];
      // Boshqa o'yinchilarga ushbu o'yinchining holati haqida xabar berish
      socket.to(data.roomId).emit("playerStatusChanged", { playerId: player.id, status: data.status });
    });

    // ── NEXT QUESTION (host advances) ──
    socket.on("nextQuestion", (data: { roomId: string }) => {
      // Bu endi ishlatilmaydi, chunki server avtomatik o'tkazadi.
      // Lekin xavfsizlik uchun qoldiramiz, agar eski klientlar bo'lsa.
      const room = rooms.get(data.roomId);
      if (!room || room.hostSocketId !== socket.id) return;
      console.log(`[Room] Host tried to manually advance question in ${data.roomId}. This is now automatic.`);
    });

    // ── FINISH (player done — for last question) ──
    socket.on("playerFinished", (data: { roomId: string; score: number }) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.players[socket.id]) return;
      room.players[socket.id].score = data.score;
      room.players[socket.id].finishedAt = Date.now();
      io.to(room.id).emit("scoresUpdated", { room: getRoomSummary(room) });
    });

    // ── VOTE FOR REMATCH ──
    socket.on("voteForRematch", (data: { roomId: string; vote: 'rematch' | 'finish' }) => {
      const room = rooms.get(data.roomId);
      if (!room || room.status !== 'finished' || !room.players[socket.id]) return;

      const player = room.players[socket.id];
      if (!room.rematchVotes) room.rematchVotes = {};

      // Faqat bitta ovoz berishga ruxsat
      if (room.rematchVotes[player.id]) return;
      room.rematchVotes[player.id] = data.vote;
      io.to(room.id).emit("roomUpdated", { room: getRoomSummary(room) });
    });

    // ── CHAT MESSAGE ──
    socket.on("chatMessage", (data: { roomId: string; text: string }) => {
      const room = rooms.get(data.roomId);
      if (!room || !room.players[socket.id]) return;
      const player = room.players[socket.id];
      io.to(room.id).emit("chatMessage", {
        senderId: player.id,
        senderName: player.name,
        text: data.text.substring(0, 200),
        time: new Date().toLocaleTimeString("uz"),
      });
    });

    // ── DISCONNECT ──
    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      for (const [roomId, room] of rooms.entries()) {
        if (room.players[socket.id]) {
          const playerName = room.players[socket.id].name;
          delete room.players[socket.id];

          if (Object.keys(room.players).length === 0) {
            if (room.questionTimer) clearTimeout(room.questionTimer); // Taymerni faqat xona bo'shaganda tozalash
            rooms.delete(roomId);
            console.log(`[Room] Deleted empty room: ${roomId}`);
          } else {
            // If host left, assign new host
            if (room.hostSocketId === socket.id) {
              const newHostSocketId = Object.keys(room.players)[0];
              room.hostSocketId = newHostSocketId;
              room.hostId = room.players[newHostSocketId].id;
            }
            io.to(roomId).emit("playerLeft", {
              playerName,
              room: getRoomSummary(room),
            });
          }
          break;
        }
      }
    });
});

// ─────────────────────────────────────────────
// GEMINI AI CLIENT
// ─────────────────────────────────────────────
const DAILY_LIMIT_PER_EMAIL = 5;
const emailStorage = new Map<string, { count: number; resetTime: number }>();

async function getUserEmailFromToken(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const profile = await response.json();
    return profile.email;
  } catch (error) {
    return null;
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    activeRooms: rooms.size,
    activePlayers: Array.from(rooms.values()).reduce(
      (sum, r) => sum + Object.keys(r.players).length,
      0
    ),
    registeredUsers: registeredUsers.size
  });
});

app.post("/api/users/register", (req, res) => {
  const user = req.body as UserProfile;
  if (user && user.uid) {
    // Add default mock profile fields if missing, to match VirtualMember UI
    const profile = {
      ...user,
      nickname: user.nickname || `@${user.name.toLowerCase().replace(/\s+/g, '')}`,
      role: user.role || user.rank || "Foydalanuvchi",
      avatarColor: user.avatarColor || "from-cyan-400 to-blue-500"
    };
    registeredUsers.set(user.uid, profile);
    res.json({ success: true, user: profile });
  } else {
    res.status(400).json({ error: "Yaroqsiz foydalanuvchi ma'lumotlari" });
  }
});

app.get("/api/users/search", (req, res) => {
  const query = (req.query.q as string || "").toLowerCase().trim();
  if (!query) return res.json({ users: [] });

  const results: UserProfile[] = [];
  for (const user of registeredUsers.values()) {
    if (
      user.uid.toLowerCase() === query ||
      user.email.toLowerCase() === query ||
      user.name.toLowerCase().includes(query) ||
      (user.nickname && user.nickname.toLowerCase().includes(query))
    ) {
      results.push(user);
    }
  }
  res.json({ users: results });
});

app.get("/api/room/:roomId", (req, res) => {
  const room = rooms.get(req.params.roomId.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: "Xona topilmadi yoki o'yin tugagan." });
  }
  // Quiz savollari bilan birga qaytarish
  res.json({
    room: getRoomWithQuiz(room),
  });
});

/**
 * Cleans text by normalizing answer keys and protecting fractions.
 * @param text The raw text to clean.
 * @returns The sanitized text.
 */
function sanitizeText(text: string): string {
  let cleanedText = text;

  // Protect fractions like "2/7" from being misinterpreted as dates
  // by adding a non-breaking space.
  cleanedText = cleanedText.replace(/(\d+)\/(\d+)/g, "$1 / $2");

  // Normalize various "Javob:" formats to a single one
  cleanedText = cleanedText.replace(/Javob\s*vob:|Javob\s*lb:|Javob\s*:/gi, "Javob:");

  // Remove or replace special characters that might confuse the parser or LLM
  cleanedText = cleanedText.replace(/[\u201C\u201D]/g, '"'); // Replace curly quotes
  cleanedText = cleanedText.replace(/[\u2018\u2019]/g, "'"); // Replace curly single quotes

  return cleanedText; // This was a semicolon, it should be a brace for the function
}

app.post("/api/parse-docx", upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Fayl yuklanmadi." });
  }

  try {
    const styleMap = [
      "p[style-name='Correct Answer'] => strong",
      "r[style-name='Correct Answer'] => strong"
    ];

    const result = await mammoth.convertToHtml({ buffer: req.file.buffer }, { styleMap });
    const html = result.value;

    // HTML-dan matnni va rangli qismlarni ajratib olish
    // Bu yerda biz oddiyroq yondashuvni qo'llaymiz: strong tegi rangni bildiradi deb hisoblaymiz
    // Yoki rangni to'g'ridan-to'g'ri `style` atributidan qidiramiz.
    const textWithMarkers = html
      .replace(/<strong[^>]*>/g, '+++') // Rangli matn boshlanishi
      .replace(/<\/strong>/g, '---')   // Rangli matn tugashi
      .replace(/<[^>]+>/g, ' ')       // Boshqa HTML teglarni olib tashlash
      .replace(/\s+/g, ' ')
      .trim();

    res.status(200).json({ text: textWithMarkers });
  } catch (error: any) {
    console.error("[/api/parse-docx] ERROR:", error);
    res.status(500).json({ error: "Word faylni tahlil qilishda xatolik yuz berdi." });
  }
});

app.post("/api/generate-quiz", async (req, res) => {
  try {
    const {
      text,
      count = 5,
      subject = "Umumiy",
      customApiKey,
      model = "gemini-2.0-flash", // model from frontend
      accessToken, // Google OAuth token to get email
    } = req.body;

    if (!text || text.trim().length < 10) { // fileData from user request
      return res.status(400).json({
        error: "Iltimos, test generatsiya qilish uchun yetarli matn yuboring (kamida 10 ta belgi).",
      });
    }

    let apiKeyToUse = customApiKey || process.env.GEMINI_API_KEY;

    // If a specific user API key is NOT provided, try to use the email-based daily limit.
    if (!customApiKey && accessToken) { // Only check email limit if no specific user key is being used
      const email = await getUserEmailFromToken(accessToken);
      if (email) {
        const now = Date.now();
        let usage = emailStorage.get(email);

        // Reset count if 24 hours have passed
        if (!usage || now > usage.resetTime) {
          usage = { count: 0, resetTime: now + 24 * 60 * 60 * 1000 };
        }

        if (usage.count >= DAILY_LIMIT_PER_EMAIL) {
          // Email limiti tugagan. Frontendga maxsus xabar yuborish.
          return res.status(429).json({
            error: `Sizning "${email}" uchun kunlik bepul limit (${DAILY_LIMIT_PER_EMAIL} ta) tugadi.`,
            isEmailLimitError: true,
          });
        }

        // Limit yetarli. Hisoblagichni oshirish va serverning asosiy kalitidan foydalanish.
        usage.count++;
        emailStorage.set(email, usage);
        apiKeyToUse = process.env.GEMINI_API_KEY; // Majburiy ravishda serverning asosiy kalitini ishlatish
      }
    }
    const prompt = `Senga berilgan matndan savol, variantlar (A, B, C, D) va to'g'ri javoblarni ajratib ol. LaTeX formulalarini ($...$ yoki \\(...\\) kabi) funksiya holatida qanday bo'lsa shunday saqla. Kasr sonlarni ("1 / 2" kabi) sana deb o'ylama, qanday bo'lsa shunday saqla!
${count > 0 ? `Taxminan ${count} ta savol kutilmoqda, lekin matnda qancha bo'lsa, hammasini oling.` : ''}
Matn: 
${text}

Har bir savolda:
- To'liq va tushunarli savol matni.
- 4 ta variant (A, B, C, D harflari bilan boshlanadigan variant matnlari, masalan "A) Variant matni").
- To'g'ri javob matni (variantlar ichidan biri bilan to'liq mos bo'lishi shart).

Natija faqat quyidagi JSON massiv formatida bo'lsin:
[
  {
    "question": "Savol matni (LaTeX formulalari toza holatda)",
    "options": ["A) 1-variant", "B) 2-variant", "C) 3-variant", "D) 4-variant"],
    "answer": "A) 1-variant"
  }
]
Boshqa hech qanday matn qo'shma.`;

    const modelsToTry: string[] = Array.from(
      new Set([
        model, // User's choice first
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
        'gemini-2.5-flash',
      ])
    ).filter(Boolean) as string[];

    if (!apiKeyToUse) {
      throw new Error("API kaliti topilmadi. .env faylini yoki shaxsiy kalitingizni tekshiring.");
    }

    let response = null;
    let lastError: any = null;
    let success = false;
    let finalUsedModel = model;
    for (const currentModel of modelsToTry) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[Gemini] Trying model: ${currentModel} (attempt ${attempt}/3)`);
          
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKeyToUse}`;

          const apiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3, // Qat'iy mantiq uchun
                // maxOutputTokens olib tashlandi, model o'zi hal qiladi
              },
              safetySettings: [ // Katta hajmdagi kontentni bloklamaslik uchun
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
              ]
            }),
          });

          if (!apiResponse.ok) {
            const errorBody = await apiResponse.json();
            throw { response: apiResponse, body: errorBody };
          }

          const responseData = await apiResponse.json();
          if (responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
            response = responseData.candidates[0].content.parts[0].text;
            success = true;
            finalUsedModel = currentModel;
            console.log(`[Gemini] Success with model: ${currentModel}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.body?.error?.message || err.message || JSON.stringify(err);
          console.warn(`[Gemini] Attempt ${attempt} failed on ${currentModel}:`, errMsg);

          const isQuotaExceeded =
            errMsg.toLowerCase().includes("quota") ||
            errMsg.includes("RESOURCE_EXHAUSTED") ||
            errMsg.toLowerCase().includes("limit exceeded") ||
            errMsg.toLowerCase().includes("exceeded your current quota") ||
            err?.response?.status === 429;

          const isRetryable =
            err.status === 503 ||
            err.status === 429 ||
            errMsg.includes("503") ||
            errMsg.includes("429") ||
            errMsg.includes("UNAVAILABLE");

          if (isQuotaExceeded || !isRetryable) {
            console.warn(`[Gemini] Switching to next model from: ${currentModel}`);
            break;
          }

          if (attempt < 3) {
            const delay = attempt * 1200;
            console.log(`[Gemini] Waiting ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
      if (success) break;
    }

    if (!success || !response) {
      const errMsg = lastError?.body?.error?.message || lastError?.message || "Barcha model urinishlari muvaffaqiyatsiz.";
      throw new Error(errMsg);
    }

    const quizQuestions = JSON.parse(response.replace(/```json|```/g, '').trim());
    res.json({ questions: quizQuestions, modelUsed: finalUsedModel });
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    const errMsg = error.message || JSON.stringify(error);
    const isQuotaExceeded =
      errMsg.toLowerCase().includes("quota") ||
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.toLowerCase().includes("limit exceeded") ||
      errMsg.toLowerCase().includes("user rate limit") || error.message === 'email_limit_exceeded';

    if (isQuotaExceeded) {
      return res.status(429).json({ // 429 status kodi bilan qaytarish
        error:
          "Sizning Google hisobingiz yoki API kalitingiz limiti tugagan. Boshqa hisobga kiring yoki yangi kalit qo'shing.",
        isQuotaError: true,
        details: error.stack,
      });
    }

    res.status(500).json({
      error: error.message || "Test generatsiya qilishda xatolik yuz berdi.",
      details: error.stack,
    });
  }
});

// ─────────────────────────────────────────────
// STATIC FAYLLAR VA SERVERNI ISHGA TUSHIRISH
// ─────────────────────────────────────────────

// Bu qism serverga frontend fayllarni qayerdan olishni o'rgatadi
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
// Serverni tinglash
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 QuizLogic Server ishga tushdi: port ${PORT}`);
  console.log(`📡 Socket.IO (Multiplayer) faol.`);
});
export default app;