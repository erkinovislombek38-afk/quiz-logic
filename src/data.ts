import { Quiz, NotificationItem } from './types';

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'math-101',
    title: 'Matematika Analiz - Integral Hisobi',
    creator: 'Islombek Erkinov',
    questionsCount: 5,
    subject: 'Oliy Matematika',
    description: 'Integral hisobi, aniq va aniqmas integrallar, ularning fizik tatbiqlari hamda d-darajali tenglamalar.',
    level: 'O\'rta',
    questions: [
      {
        question: "Integralni hisoblang: ∫ x dx",
        options: ["A) x^2 + C", "B) x^2 / 2 + C", "C) ln|x| + C", "D) e^x + C"],
        correctAnswer: "B) x^2 / 2 + C"
      },
      {
        question: "Qaysi formula Nyuton-Leybnits formulasi deb ataladi?",
        options: [
          "A) ∫[a,b] f(x)dx = F(b) - F(a)",
          "B) ∫ f(x)dx = F(x) + C",
          "C) d/dx ∫ f(t)dt = f(x)",
          "D) ∫ u dv = uv - ∫ v du"
        ],
        correctAnswer: "A) ∫[a,b] f(x)dx = F(b) - F(a)"
      },
      {
        question: "∫ (1/x) dx integralining qiymati nimaga teng?",
        options: ["A) x + C", "B) ln|x| + C", "C) -1/x^2 + C", "D) e^x + C"],
        correctAnswer: "B) ln|x| + C"
      },
      {
        question: "∫ sin(x) dx integralini hisoblang.",
        options: ["A) cos(x) + C", "B) -cos(x) + C", "C) tg(x) + C", "D) ctg(x) + C"],
        correctAnswer: "B) -cos(x) + C"
      },
      {
        question: "∫ e^x dx integralining boshlang'ich funksiyasi qaysi?",
        options: ["A) e^x + C", "B) ln|x| + C", "C) x*e^(x-1) + C", "D) e^(-x) + C"],
        correctAnswer: "A) e^x + C"
      }
    ]
  },
  {
    id: 'cpp-basics',
    title: 'C++ Algoritmik Tillar va Dasturlash',
    creator: 'Prof. Axmedov',
    questionsCount: 5,
    subject: 'Kompyuter Ilmlari',
    description: 'C++ tilida turlar, massivlar, ko\'rsatkichlar hamda OOP asoslari bo\'yicha mukammal sinov.',
    level: 'Qiyin',
    questions: [
      {
        question: "C++ tilida massiv indeksatsiyasi qaysi sondan boshlanadi?",
        options: ["A) 1 dan", "B) -1 dan", "C) 0 dan", "D) Ixtiyoriy"],
        correctAnswer: "C) 0 dan"
      },
      {
        question: "C++ da 'pointers' (ko'rsatkichlar) qaysi belgi orqali e'lon qilinadi?",
        options: ["A) &", "B) *", "C) #", "D) @"],
        correctAnswer: "B) *"
      },
      {
        question: "Quyidagilardan qaysi biri OOP ning asosiy tamoyillaridan biri emas?",
        options: ["A) Inkapsulyatsiya", "B) Polimorfizm", "C) Kompilyatsiya", "D) Abstraksiya"],
        correctAnswer: "C) Kompilyatsiya"
      },
      {
        question: "C++ da xotirani dinamik ajratish uchun qaysi kalit so'zdan foydalaniladi?",
        options: ["A) malloc", "B) alloc", "C) new", "D) create"],
        correctAnswer: "C) new"
      },
      {
        question: "Klass ichidagi elementlarga faqat shu klass a'zolari murojaat qilishi uchun qaysi ruxsat kaliti ishlatiladi?",
        options: ["A) public", "B) protected", "C) private", "D) global"],
        correctAnswer: "C) private"
      }
    ]
  },
  {
    id: 'ai-ethics',
    title: 'Sun\'iy Intellekt va Neyron Tarmoqlar',
    creator: 'Yaxshiboyev Elbek',
    questionsCount: 4,
    subject: 'AI Texnologiyalari',
    description: 'Mashinali o\'rganish asoslari, neyron tarmoq qatlamlari va optimizatorlar tahlili.',
    level: 'Oson',
    questions: [
      {
        question: "Neyron tarmoqlarda faollashtirish funksiyasi (Activation Function) nima uchun kerak?",
        options: [
          "A) Tarmoqqa chiziqsizlik qo'shish uchun",
          "B) Xatolikni hisoblash uchun",
          "C) Ma'lumotlarni saralash uchun",
          "D) Tezlikni oshirish uchun"
        ],
        correctAnswer: "A) Tarmoqqa chiziqsizlik qo'shish uchun"
      },
      {
        question: "Qaysi optimizator gradient tushish tezligini adaptiv ravishda sozlaydi?",
        options: ["A) SGD", "B) Adam", "C) Momentum", "D) Batch-GD"],
        correctAnswer: "B) Adam"
      },
      {
        question: "Neyron tarmoqlarning o'rganish tezligini belgilovchi parametr nima deb ataladi?",
        options: ["A) Epoch", "B) Batch size", "C) Learning Rate", "D) Weight initialization"],
        correctAnswer: "C) Learning Rate"
      },
      {
        question: "Chiziqli regressiya modelining asosiy maqsadi nima?",
        options: [
          "A) Ma'lumotlarni klassifikatsiya qilish",
          "B) Uzluksiz sonli qiymatni bashorat qilish",
          "C) Tasvirlarni klasterlash",
          "D) Matnlarni tarjima qilish"
        ],
        correctAnswer: "B) Uzluksiz sonli qiymatni bashorat qilish"
      }
    ]
  },
  {
    id: 'ielts-grammar',
    title: 'Ingliz Tili IELTS - Grammatika va Sinonimlar',
    creator: 'Nodira Rahimova',
    questionsCount: 5,
    subject: 'IELTS English',
    description: 'IELTS darajasidagi eng ko\'p uchraydigan grammatik qoidalar, sinonimlar va gap tuzilishi sinovlari.',
    level: 'O\'rta',
    isShared: true,
    questions: [
      {
        question: "Choose the correct synonym for the word 'ABUNDANT':",
        options: ["A) Scarce", "B) Plentiful", "C) Lacking", "D) Rare"],
        correctAnswer: "B) Plentiful"
      },
      {
        question: "By the time the manager arrived, the team ________ the project.",
        options: ["A) finished", "B) will finish", "C) had finished", "D) has finished"],
        correctAnswer: "C) had finished"
      },
      {
        question: "If I ________ you, I would study for the exam earlier.",
        options: ["A) am", "B) was", "C) were", "D) would be"],
        correctAnswer: "C) were"
      },
      {
        question: "Which of the following is a noun form of the verb 'Analyze'?",
        options: ["A) Analytical", "B) Analysis", "C) Analytically", "D) Analyst"],
        correctAnswer: "B) Analysis"
      },
      {
        question: "Identify the correct sentence:",
        options: [
          "A) Neither the teacher nor the students was present.",
          "B) Neither the teacher nor the students were present.",
          "C) Neither the teacher nor the students has been present.",
          "D) Neither the teacher nor the students is present."
        ],
        correctAnswer: "B) Neither the teacher nor the students were present."
      }
    ]
  },
  {
    id: 'physics-dynamics',
    title: 'Fizika - Mexanika va Dinamika Asoslari',
    creator: 'Sardor Olimov',
    questionsCount: 4,
    subject: 'Klassik Fizika',
    description: 'Nyuton qonunlari, kuchlar, impuls va energiyaning saqlanish qonunlari bo\'yicha mukammal sinov.',
    level: 'Qiyin',
    isShared: true,
    questions: [
      {
        question: "Inersiya qonuni Nyutonning nechanchi qonuni hisoblanadi?",
        options: ["A) 1-qonuni", "B) 2-qonuni", "C) 3-qonuni", "D) Butunjahon tortishish qonuni"],
        correctAnswer: "A) 1-qonuni"
      },
      {
        question: "Kuch formulasini ko'rsating (Nyutonning ikkinchi qonuni):",
        options: ["A) F = m/a", "B) F = m*a", "C) F = p*v", "D) F = m*v^2"],
        correctAnswer: "B) F = m*a"
      },
      {
        question: "Ishning o'lchov birligi nima?",
        options: ["A) Joul (J)", "B) Vatt (W)", "C) Nyuton (N)", "D) Paskal (Pa)"],
        correctAnswer: "A) Joul (J)"
      },
      {
        question: "Yopiq tizimda qanday kattalik saqlanadi?",
        options: ["A) Faqat tezlik", "B) Faqat massa", "C) Impuls va to'liq energiya", "D) Faqat ishqalanish kuchi"],
        correctAnswer: "C) Impuls va to'liq energiya"
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Yangi Duel Chaqiruvi',
    sender: 'Sardorbek Olimov',
    time: '3 daqiqa oldin',
    text: 'Sardorbek sizni "Matematika Analiz - Integral Hisobi" bo\'yicha guruh to\'qnashuviga taklif qildi.',
    type: 'challenge'
  },
  {
    id: 'n2',
    title: 'Darajangiz Oshdi!',
    sender: 'Tizim',
    time: '2 soat oldin',
    text: 'Tabriklaymiz! Siz 500 XP to\'plab, 4-daraja (Professional) unvonini qo\'lga kiritdingiz.',
    type: 'achievement'
  },
  {
    id: 'n3',
    title: 'Yangi Test Yuklandi',
    sender: 'Erkinov Islombek',
    time: '1 kun oldin',
    text: '"C++ Algoritmik Tillar" mavzusida yangi, qiyin darajadagi test sinovlari yuklandi. O\'z kuchingizni sinab ko\'ring!',
    type: 'system'
  }
];

export const RANKINGS = [
  { name: "Islombek Erkinov", xp: 2450, rank: 1, isSelf: true },
  { name: "Sardor Olimov", xp: 2100, rank: 2, isSelf: false },
  { name: "Nodira Rahimova", xp: 1950, rank: 3, isSelf: false },
  { name: "Bobur Mirzo", xp: 1800, rank: 4, isSelf: false },
  { name: "Dilorom Ismoilova", xp: 1650, rank: 5, isSelf: false }
];

export const VIRTUAL_PLAYERS_POOL = [
  { name: "Sardor Olimov", avatarColor: "from-amber-400 to-orange-500", accuracy: 0.8 },
  { name: "Nodira Rahimova", avatarColor: "from-pink-400 to-purple-500", accuracy: 0.75 },
  { name: "Bobur Mirzo", avatarColor: "from-emerald-400 to-teal-500", accuracy: 0.65 },
  { name: "Dilorom Ismoilova", avatarColor: "from-blue-400 to-indigo-500", accuracy: 0.85 },
  { name: "Azizbek Karimov", avatarColor: "from-yellow-400 to-lime-500", accuracy: 0.7 }
];

export interface VirtualMember {
  name: string;
  nickname: string;
  avatarColor: string;
  role: string;
  xp: number;
  level: number;
}

export const ALL_VIRTUAL_MEMBERS: VirtualMember[] = [
  { name: "Sardor Olimov", nickname: "@sardor_olim", avatarColor: "from-amber-400 to-orange-500", role: "Abituriyent", xp: 2100, level: 3 },
  { name: "Nodira Rahimova", nickname: "@nodira_r", avatarColor: "from-pink-400 to-purple-500", role: "Talaba", xp: 1950, level: 3 },
  { name: "Bobur Mirzo", nickname: "@bobur_mirzo", avatarColor: "from-emerald-400 to-teal-500", role: "Abituriyent", xp: 1800, level: 2 },
  { name: "Dilorom Ismoilova", nickname: "@dilorom_i", avatarColor: "from-blue-400 to-indigo-500", role: "Talaba", xp: 1650, level: 2 },
  { name: "Azizbek Karimov", nickname: "@aziz_k", avatarColor: "from-yellow-400 to-lime-500", role: "Abituriyent", xp: 1400, level: 2 },
  { name: "Prof. Axmedov", nickname: "@prof_axmedov", avatarColor: "from-red-400 to-rose-600", role: "O'qituvchi", xp: 5400, level: 6 },
  { name: "Yaxshiboyev Elbek", nickname: "@elbek_y", avatarColor: "from-cyan-400 to-blue-600", role: "AI Mutaxassis", xp: 4800, level: 5 }
];
