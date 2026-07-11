export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  title: string;
  creator: string;
  questionsCount: number;
  subject: string;
  description: string;
  level: 'Oson' | 'O\'rta' | 'Qiyin';
  questions: Question[];
  parts?: Question[][]; // Chunked parts of 30 questions each
  isShared?: boolean;
  sharedBy?: string;
}

export type ScreenType =
  | 'dashboard'
  | 'solo-quiz'
  | 'group-quiz'
  | 'notifications'
  | 'settings'
  | 'result'
  | 'sharing'
  | 'profile'
  | 'multiplayer-lobby'
  | 'multiplayer-game'
  | 'multiplayer-result';

export interface User {
  uid: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  rank: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  sender: string;
  time: string;
  text: string;
  type: 'challenge' | 'system' | 'achievement';
}

export interface VirtualPlayer {
  id: string;
  name: string;
  avatarColor: string;
  score: number;
  lastChoice: string | null;
  status: 'thinking' | 'answered' | 'idle';
  accuracy: number; // probability of choosing correct answer
  votedFor?: 'next' | 'retry' | null;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSelf?: boolean;
}

export interface ActiveRoom {
  id: string;
  title: string;
  creator: string;
  activePlayers: number;
  maxPlayers: number;
  status: 'lobby' | 'playing';
  subject: string;
  quizId: string;
}

// ─── MULTIPLAYER TYPES ────────────────────────────────────────────

export interface RoomPlayer {
  id: string;
  name: string;
  avatarColor: string;
  score: number;
  ready: boolean;
  finishedAt?: number;
  rank?: number;
}

export interface GameRoomSummary {
  id: string;
  quizId: string;
  quizTitle: string;
  quizQuestionsCount: number;
  hostId: string;
  status: 'lobby' | 'playing' | 'finished';
  currentQuestion: number;
  timerSeconds: number;
  players: RoomPlayer[];
  currentAnswersStats?: Record<string, number>;
}

export interface ChatMsg {
  senderId: string;
  senderName: string;
  text: string;
  time: string;
}
