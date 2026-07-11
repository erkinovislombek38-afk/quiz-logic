import React, { useState, useRef } from 'react';
import { Sparkles, FileText, Upload, BrainCircuit, Play, Users, Trophy, ChevronRight, AlertCircle, RefreshCw, BarChart2, FolderOpen, Layers, Info, Clock, X, Pencil, Trash2, UserCheck, Globe } from 'lucide-react';
import { Quiz, User, ActiveRoom, Question } from '../types';
import { ALL_VIRTUAL_MEMBERS } from '../data';

interface DashboardProps {
  quizzes: Quiz[];
  user: User;
  chunkingMode: 'module' | 'all-at-once';
  onSetChunkingMode: (mode: 'module' | 'all-at-once') => void;
  onStartQuiz: (quizId: string, mode: 'solo' | 'group', timerSetting?: number) => void;
  onAddNewQuiz: (newQuiz: Quiz) => void;
  onDeleteQuiz?: (quizId: string) => void;
  onUpdateQuiz?: (updatedQuiz: Quiz) => void;
  onGenerationStart?: (fileName: string) => void;
  onGenerationEnd?: () => void;
  onNavigateToMembers?: () => void;
  onStartMultiplayer?: (quizId?: string) => void;
}

const generateUzbekQuestions = (subject: string, count: number): Question[] => {
  const normSubject = subject.toLowerCase();
  
  // 1. Programming / IT questions
  const itPool = [
    {
      question: "C++ tilida klass va struktura (struct) o'rtasidagi asosiy farq nimada?",
      options: [
        "A) Klass a'zolari standart bo'yicha private, struktura a'zolari esa public bo'ladi",
        "B) Struktura faqat raqamlarni, klass esa matnlarni saqlaydi",
        "C) Klass xotiradan joy olmaydi, struktura esa joy oladi",
        "D) C++ tilida ular o'rtasida mutlaqo hech qanday farq yo'q"
      ],
      correctAnswer: "A) Klass a'zolari standart bo'yicha private, struktura a'zolari esa public bo'ladi"
    },
    {
      question: "JavaScript dasturlash tilidagi 'closure' tushunchasining ta'rifi qaysi javobda to'g'ri ko'rsatilgan?",
      options: [
        "A) Bu tashqi funksiya bajarilib bo'lgandan keyin ham uning o'zgaruvchilariga ichki funksiyadan murojaat qilish imkoniyatidir",
        "B) Bu barcha global o'zgaruvchilarni avtomatik tarzda o'chirib yuboradigan maxsus xotira tozalash algoritmidir",
        "C) Bu sahifani qayta yuklamasdan serverga so'rov yuborish uchun ishlatiladigan sinxron funksiyadir",
        "D) Klass ichida e'lon qilingan va faqat static murojaatga ega bo'lgan o'zgaruvchilardir"
      ],
      correctAnswer: "A) Bu tashqi funksiya bajarilib bo'lgandan keyin ham uning o'zgaruvchilariga ichki funksiyadan murojaat qilish imkoniyatidir"
    },
    {
      question: "REST API va SOAP protokoli o'rtasidagi farq haqidagi to'g'ri fikrni aniqlang.",
      options: [
        "A) REST odatda JSON va HTTP bilan ishlaydi, SOAP esa asosan XML va qat'iy standartlar to'plamiga asoslangan",
        "B) REST faqat local tarmoqlarda ishlaydi, SOAP esa faqat global internet tarmoqlarida ishlaydi",
        "C) SOAP faqat JavaScript brauzerlarida qo'llaniladi, REST esa mobil ilovalar uchungina mo'ljallangan",
        "D) REST ma'lumotlarni shifrlay olmaydi, SOAP esa barcha ma'lumotlarni avtomatik shifrlaydi"
      ],
      correctAnswer: "A) REST odatda JSON va HTTP bilan ishlaydi, SOAP esa asosan XML va qat'iy standartlar to'plamiga asoslangan"
    },
    {
      question: "Node.js platformasida 'Event Loop' asosan nima uchun xizmat qiladi?",
      options: [
        "A) Kirish-chiqish (I/O) amallarini asinxron va bloklanmagan (non-blocking) tarzda bajarishni ta'minlaydi",
        "B) Grafik interfeyslarni (GUI) render qilish va ularni animatsiya ko'rinishida taqdim etish uchun",
        "C) Kod tarkibidagi baksiya xatoliklarni avtomatik ravishda tuzatib, qayta kompilyatsiya qilish uchun",
        "D) Ma'lumotlar bazasidagi jadvallarni o'zaro bog'lash va SQL so'rovlarini optimallashtirish uchun"
      ],
      correctAnswer: "A) Kirish-chiqish (I/O) amallarini asinxron va bloklanmagan (non-blocking) tarzda bajarishni ta'minlaydi"
    },
    {
      question: "Git versiya boshqaruv tizimida 'rebase' va 'merge' buyruqlarining asosiy farqi nimada?",
      options: [
        "A) 'Rebase' commitlar tarixini to'g'ri chiziqli qilib qayta yozadi, 'merge' esa tarmoqlarni birlashtirib yangi commit yaratadi",
        "B) 'Merge' faqat local commitlarni o'chiradi, 'rebase' esa ularni masofaviy serverga yuboradi",
        "C) 'Rebase' faqat fayllarni o'chirish uchun, 'merge' esa yangi fayllarni qo'shish uchun ishlatiladi",
        "D) Ular mutlaqo bir xil vazifani bajaradi va faqat sintaksisi bilan farq qiladi"
      ],
      correctAnswer: "A) 'Rebase' commitlar tarixini to'g'ri chiziqli qilib qayta yozadi, 'merge' esa tarmoqlarni birlashtirib yangi commit yaratadi"
    },
    {
      question: "Dasturlashda polimorfizm tamoyili nimani anglatadi?",
      options: [
        "A) Bir xil nomli metodlarning turli klasslarda turlicha ishlashi yoki turli xil argumentlarni qabul qila olishi",
        "B) Ma'lumotlar strukturasini xavfsiz tarzda foydalanuvchidan berkitib qo'yish jarayoni",
        "C) Klass xususiyatlarining merosxo'r klassga avtomatik o'tib qolishi",
        "D) Dastur kodini bir necha tillarga avtomatik tarzda tarjima qilish mexanizmi"
      ],
      correctAnswer: "A) Bir xil nomli metodlarning turli klasslarda turlicha ishlashi yoki turli xil argumentlarni qabul qila olishi"
    },
    {
      question: "SQL-da LEFT JOIN va INNER JOIN o'rtasidagi asosiy farq nima?",
      options: [
        "A) LEFT JOIN chap jadvaldagi barcha qatorlarni va o'ng jadvaldagi mos kelgan qatorlarni qaytaradi, INNER JOIN esa faqat mos qatorlarni",
        "B) INNER JOIN faqat sonli ma'lumotlarni birlashtiradi, LEFT JOIN esa matnli ma'lumotlarni",
        "C) LEFT JOIN ma'lumotlarni o'chirish uchun, INNER JOIN esa yangilash uchun xizmat qiladi",
        "D) LEFT JOIN jadvalni o'ngdan chapga, INNER JOIN esa tepadan pastga qarab o'qiydi"
      ],
      correctAnswer: "A) LEFT JOIN chap jadvaldagi barcha qatorlarni va o'ng jadvaldagi mos kelgan qatorlarni qaytaradi, INNER JOIN esa faqat mos qatorlarni"
    },
    {
      question: "Python tilidagi dekoratorlar (decorators) qanday vazifani bajaradi?",
      options: [
        "A) Mavjud funksiya kodini o'zgartirmasdan, unga qo'shimcha mantiq yoki xatti-harakatlar qo'shish imkonini beradi",
        "B) Kod sintaksisidagi xatoliklarni chiroyli tarzda rangli qilib ko'rsatish uchun foydalaniladi",
        "C) Ma'lumotlarni grafik shaklga o'tkazuvchi maxsus vizualizatsiya kutubxonasidir",
        "D) Python dasturlarini mobil ilovalarga aylantirib beradigan kompilyatordir"
      ],
      correctAnswer: "A) Mavjud funksiya kodini o'zgartirmasdan, unga qo'shimcha mantiq yoki xatti-harakatlar qo'shish imkonini beradi"
    }
  ];

  // 2. Math questions
  const mathPool = [
    {
      question: "y = x^3 + 5x funksiyaning x = 2 nuqtadagi hosilasini hisoblang.",
      options: ["A) 12", "B) 17", "C) 8", "D) 15"],
      correctAnswer: "B) 17"
    },
    {
      question: "Determinant qiymatini toping: | 2  3 | / | 1  4 |",
      options: ["A) 5", "B) 8", "C) 11", "D) -1"],
      correctAnswer: "A) 5"
    },
    {
      question: "Ikki to'g'ri chiziqning perpendikulyarlik sharti qaysi javobda ko'rsatilgan?",
      options: ["A) k1 * k2 = -1", "B) k1 = k2", "C) k1 + k2 = 0", "D) k1 * k2 = 1"],
      correctAnswer: "A) k1 * k2 = -1"
    },
    {
      question: "lim (x -> 0) (sin x) / x limitining qiymati nimaga teng?",
      options: ["A) 0", "B) 1", "C) cheksizlik", "D) mavjud emas"],
      correctAnswer: "B) 1"
    },
    {
      question: "Nyuton-Leybnits formulasining asosiy vazifasi nima?",
      options: [
        "A) Aniq integralni boshlang'ich funksiyalar ayirmasi orqali hisoblash",
        "B) Matematik qatorlarning yaqinlashuvchanligini tekshirish",
        "C) Chiziqli tenglamalar sistemasini determinant usulida yechish",
        "D) Matritsaning teskari matritsasini hisoblash"
      ],
      correctAnswer: "A) Aniq integralni boshlang'ich funksiyalar ayirmasi orqali hisoblash"
    },
    {
      question: "∫ (1 / (1 + x^2)) dx integralining qiymati qaysi funksiyaga teng?",
      options: ["A) arctg(x) + C", "B) arcsin(x) + C", "C) ln|1 + x^2| + C", "D) tg(x) + C"],
      correctAnswer: "A) arctg(x) + C"
    }
  ];

  // 3. History questions
  const historyPool = [
    {
      question: "Sohibqiron Amir Temur nechanchi yilda va qayerda tavallud topgan?",
      options: [
        "A) 1336-yil 9-aprelda Kesh (Shahrisabz) yaqinidagi Xoja Ilg'or qishlog'ida",
        "B) 1342-yil 12-avgustda Samarqand shahrining chekkasidagi Bog'ishamol mavzesida",
        "C) 1330-yil 1-mayda Buxoro yaqinidagi G'ijduvon tumanida",
        "D) 1356-yil 15-aprelda Xorazm viloyatining Gurganj shahrida"
      ],
      correctAnswer: "A) 1336-yil 9-aprelda Kesh (Shahrisabz) yaqinidagi Xoja Ilg'or qishlog'ida"
    },
    {
      question: "Amir Temur asos solgan saltanatning poytaxti qaysi shahar bo'lgan?",
      options: ["A) Buxoro", "B) Samarqand", "C) Toshkent", "D) Shahrisabz"],
      correctAnswer: "B) Samarqand"
    },
    {
      question: "Jaloliddin Manguberdi qaysi sulolaning so'nggi va eng qudratli hukmdori bo'lgan?",
      options: ["A) Somoniylar", "B) Xorazmshohlar", "C) G'aznaviylar", "D) Qoraxoniylar"],
      correctAnswer: "B) Xorazmshohlar"
    },
    {
      question: "Mirzo Ulug'bek tomonidan barpo etilgan rasadxona qaysi shaharda joylashgan va u yerda qanday asar yozilgan?",
      options: [
        "A) Samarqandda, 'Ziji jadidi Ko'ragoniy' astronomik asari",
        "B) Buxoroda, 'Tibbiyot qonunlari' asari",
        "C) Xivada, 'Shajarayi turk' tarixiy asari",
        "D) Andijonda, 'Boburnoma' asari"
      ],
      correctAnswer: "A) Samarqandda, 'Ziji jadidi Ko'ragoniy' astronomik asari"
    },
    {
      question: "Buyuk Ipak yo'li o'z taraqqiyotining eng yuqori cho'qqisiga qaysi davrda erishgan?",
      options: [
        "A) Kushon imperiyasi va Somoniylar davrida",
        "B) Faqat XIX asrda Qo'qon xonligi davrida",
        "C) Miloddan avvalgi V asrda qadimgi Misr davrida",
        "D) Ikkinchi Jahon urushi arafasida"
      ],
      correctAnswer: "A) Kushon imperiyasi va Somoniylar davrida"
    }
  ];

  // 4. Default general questions
  const defaultPool = [
    {
      question: "Mantiqiy izchillik va tahlil qilish tizimida 'gipoteza' so'zining asl ma'nosi nima?",
      options: [
        "A) Hali tasdiqlanmagan yoki rad etilmagan, isbot talab qiladigan ilmiy faraz",
        "B) Mutlaqo o'zgarmas va hamma tomonidan qabul qilingan qat'iy qonun",
        "C) Tajriba jarayonida yo'l qo'yilgan matematik xatolik va og'ish",
        "D) Ma'lumotlarni jadval ko'rinishida guruhlash uslubi"
      ],
      correctAnswer: "A) Hali tasdiqlanmagan yoki rad etilmagan, isbot talab qiladigan ilmiy faraz"
    },
    {
      question: "Foydali ish koeffitsientini oshirishda asosiy mantiqiy maqsad nima hisoblanadi?",
      options: [
        "A) Sarf qilingan energiyaning minimal yo'qotishlar bilan foydali ishga aylanishini ta'minlash",
        "B) Ishchilar sonini ko'paytirish va ish vaqtini uzaytirish",
        "C) Dastur kodining hajmini ikki barobarga qisqartirish",
        "D) Tizimdagi barcha ma'lumotlarni arxivlab qo'yish"
      ],
      correctAnswer: "A) Sarf qilingan energiyaning minimal yo'qotishlar bilan foydali ishga aylanishini ta'minlash"
    },
    {
      question: "Inson intellekti va sun'iy intellekt (AI) o'rtasidagi eng fundamental farq nima?",
      options: [
        "A) Inson hissiyot, intuitiv munosabat va ong asosida qaror qabul qiladi, AI esa matematik mantiq va o'rgatilgan algoritmlar orqali",
        "B) Sun'iy intellekt xotirasi insondan kichikroq bo'ladi",
        "C) Sun'iy intellekt faqat ingliz tilida javob bera oladi, inson esa barcha tillarda",
        "D) Ular o'rtasida hech qanday farq yo'q"
      ],
      correctAnswer: "A) Inson hissiyot, intuitiv munosabat va ong asosida qaror qabul qiladi, AI esa matematik mantiq va o'rgatilgan algoritmlar orqali"
    }
  ];

  // Pick appropriate pool
  let selectedPool = defaultPool;
  if (normSubject.includes('matematika') || normSubject.includes('fizika') || normSubject.includes('analiz') || normSubject.includes('integral')) {
    selectedPool = mathPool;
  } else if (normSubject.includes('dastur') || normSubject.includes('cpp') || normSubject.includes('it') || normSubject.includes('komp') || normSubject.includes('python') || normSubject.includes('web') || normSubject.includes('kod')) {
    selectedPool = itPool;
  } else if (normSubject.includes('tarix') || normSubject.includes('temur') || normSubject.includes('hukm') || normSubject.includes('yurt')) {
    selectedPool = historyPool;
  }

  // Generate requested count of questions by cycling through selectedPool and customizing them so they are distinct
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const template = selectedPool[i % selectedPool.length];
    
    // Customize slightly to make it look unique for each index if we cycle
    const cycleNum = Math.floor(i / selectedPool.length);
    let customizedQuestion = template.question;
    let customizedOptions = [...template.options];
    let customizedAnswer = template.correctAnswer;

    if (cycleNum > 0) {
      customizedQuestion = `${template.question} (Ssenariy variant #${cycleNum + 1})`;
      customizedOptions = template.options.map((opt, oIdx) => {
        const letter = opt.substring(0, 3);
        const rest = opt.substring(3);
        return `${letter}${rest} (Tahliliy qo'shimcha ${cycleNum + 1})`;
      });
      const correctIdx = template.options.findIndex(opt => opt === template.correctAnswer);
      customizedAnswer = customizedOptions[correctIdx >= 0 ? correctIdx : 0];
    }

    questions.push({
      question: customizedQuestion,
      options: customizedOptions,
      correctAnswer: customizedAnswer
    });
  }

  return questions;
};

const isLikelyQuestionLine = (line: string): boolean => {
  return /^\d+[\s.)]/.test(line) && !/^[A-D]\s*[\).\s]\s*/i.test(line);
};

const parseTextToQuestions = (text: string): Question[] => {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
      return parsed.map(q => ({
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer || q.options?.[0] || ""
      }));
    }
  } catch (e) {
    // Not JSON
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const parsedQuestions: Question[] = [];
  
  let currentQuestion = "";
  let currentOptions: string[] = [];
  let correctAnswer = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isOptionLine = /^[A-D]\s*[\).\s]\s*/i.test(line.replace(/^[+*]/, '').trim());
    const isNewQuestion = isLikelyQuestionLine(line);

    if (isNewQuestion && currentQuestion && currentOptions.length > 0) {
      // Save the previous question before starting a new one
      if (!correctAnswer && currentOptions.length > 0) correctAnswer = currentOptions[0];
      parsedQuestions.push({
        question: currentQuestion,
        options: currentOptions,
        correctAnswer,
      });
      // Reset for the new question
      currentQuestion = "";
      currentOptions = [];
      correctAnswer = "";
    }

    if (isOptionLine) {
      let cleanOpt = line;
      let isCorrect = false;
      if (line.startsWith('+') || line.startsWith('*')) {
        isCorrect = true;
        cleanOpt = line.substring(1).trim();
      }
      
      currentOptions.push(cleanOpt);
      if (isCorrect) {
        correctAnswer = cleanOpt;
      }
    } else if (line) { // It's part of a question
      currentQuestion = (currentQuestion ? currentQuestion + " " + line : line).replace(/^\d+[\).\s]\s*/, "");
    }
  }

  if (currentQuestion && currentOptions.length > 0) {
    if (!correctAnswer) {
      correctAnswer = currentOptions[0];
    }
    parsedQuestions.push({
      question: currentQuestion,
      options: currentOptions,
      correctAnswer
    });
  }
  // Word fayllar uchun maxsus tahlil
  if (text.includes('+++') && text.includes('---')) {
    const regex = /(\d+[\s.)].*?)(?=\d+[\s.)]|$)/gs;
    // Bu yerga Word'dan kelgan `+++` va `---` belgilari bilan ishlash logikasi qo'shiladi.
    // Hozircha bu qismni keyingi bosqichda to'ldiramiz.
  }

  return parsedQuestions;
};

export default function Dashboard({ 
  quizzes, 
  user, 
  chunkingMode, 
  onSetChunkingMode, 
  onStartQuiz, 
  onAddNewQuiz,
  onDeleteQuiz,
  onUpdateQuiz,
  onGenerationStart,
  onGenerationEnd,
  onNavigateToMembers,
  onStartMultiplayer,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('file');
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editLevel, setEditLevel] = useState<'Oson' | 'O\'rta' | 'Qiyin'>('Oson');

  // Timer selection modal state
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [pendingQuizId, setPendingQuizId] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<'solo' | 'group'>('solo');
  const [chosenTimer, setChosenTimer] = useState<number>(30); // Default 30s

  const triggerStartQuiz = (quizId: string, mode: 'solo' | 'group') => {
    setPendingQuizId(quizId);
    setPendingMode(mode);
    setChosenTimer(30); // Reset to 30s
    setShowTimerModal(true);
  };

  const [pasteText, setPasteText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [chunkAlert, setChunkAlert] = useState<{
    show: boolean;
    quizId: string;
    totalQuestions: number;
    partsCount: number;
    partSize: number;
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.docx') || name.endsWith('.txt') || name.endsWith('.json')) {
      setSelectedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE'
      });
      setErrorMsg(null);
      setRawFile(file);
      setActiveTab('file'); // Fayl tanlanganda avtomatik o'tish
    } else {
      setErrorMsg("Faqat DOCX, TXT yoki JSON formatidagi fayllarni yuklashingiz mumkin.");
    }
  };

  const handleGenerateQuiz = async () => {
    const isFileMode = activeTab === 'file';
    const textContent = pasteText.trim();

    if (isFileMode && !rawFile) {
      setErrorMsg("Iltimos, avval fayl tanlang yoki uni maydonga tashlang.");
      return;
    }
    if (!isFileMode && !textContent) {
      setErrorMsg("Iltimos, matn maydoniga savollarni joylashtiring.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    onGenerationStart?.(isFileMode ? rawFile!.name : "Matndan Test");

    const genSubject = isFileMode ? rawFile!.name.split('.')[0] : "Matndan Olingan Test";
    const requestedCount = -1; // Har doim barcha savollarni olish

    try {
      let finalQuestions: Question[] = [];
      let textToParse = textContent;

      if (isFileMode && rawFile) {
        const fileName = rawFile.name.toLowerCase();
        if (fileName.endsWith('.docx')) {
          const formData = new FormData();
          formData.append('file', rawFile);
          const response = await fetch('/api/parse-docx', { method: 'POST', body: formData });
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Word faylni tahlil qilishda xatolik.");
          }
          const data = await response.json();
          textToParse = data.text;
        } else {
          textToParse = await rawFile.text();
        }
      }

      const parsedQuestions = parseTextToQuestions(textToParse);

      if (parsedQuestions.length > 0) {
        finalQuestions = parsedQuestions;
      } else {
        // Agar to'g'ridan-to'g'ri tahlil qilish muvaffaqiyatsiz bo'lsa, AIga murojaat qilish
        const googleToken = localStorage.getItem('google_access_token');
        const customApiKey = localStorage.getItem('custom_gemini_api_key') || '';
        const model = localStorage.getItem('custom_gemini_model') || 'gemini-1.5-flash';

        const genResponse = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToParse,
            count: requestedCount,
            subject: genSubject,
            customApiKey,
            model,
            accessToken: googleToken,
          }),
        });

        if (!genResponse.ok) {
          let err = { error: `AI serveridan xatolik (${genResponse.status})` };
          try {
            err = await genResponse.json();
          } catch (e) { 
            console.warn("Could not parse JSON from AI error response.");
          }
          throw new Error(err.error || "AI test generatsiya qila olmadi.");
        }
        const data = await genResponse.json();
        finalQuestions = data.questions;
      }

      if (!finalQuestions || finalQuestions.length === 0) {
        throw new Error("Tizim ushbu fayldan test savollarini yarata olmadi.");
      }

      const finalQuestionsCount = finalQuestions.length;

      let chunkedParts: typeof generatedQuestions[] | undefined = undefined;
      const shouldChunk = chunkingMode === 'module' && finalQuestionsCount > 30;
      if (shouldChunk) {
        chunkedParts = [];
        for (let i = 0; i < finalQuestionsCount; i += 30) {
          chunkedParts.push(finalQuestions.slice(i, i + 30));
        }
      }

      const generatedQuiz: Quiz = {
        id: `gen-quiz-${Date.now()}`,
        title: `Matndan: ${genSubject}`,
        creator: user.name,
        questionsCount: finalQuestionsCount,
        subject: genSubject,
        description: `Hujjatdan muvaffaqiyatli o'qib olingan ${finalQuestionsCount} talik testlar to'plami.`,
        level: 'O\'rta',
        questions: finalQuestions,
        parts: chunkedParts,
      };

      onAddNewQuiz(generatedQuiz);
      if (chunkedParts && chunkedParts.length > 0) {
        setChunkAlert({
          show: true,
          quizId: generatedQuiz.id,
          totalQuestions: finalQuestionsCount,
          partsCount: chunkedParts.length,
          partSize: chunkedParts[0].length
        });
      }

      setPasteText('');
      setRawFile(null);
      setSelectedFile(null);

    } catch (apiError: any) {
      console.error("Parsing/Generation error:", apiError);
      setErrorMsg(`Xatolik yuz berdi: ${apiError.message}`);
    } finally {
      setIsGenerating(false);
      onGenerationEnd?.();
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-1">
      {/* 3D Glassmorphism Premium Banner */}
      <div className="relative overflow-hidden bg-linear-to-br from-cyan-600/90 via-blue-700/80 to-purple-800/80 p-5 sm:p-6 rounded-3xl border border-white/10 shadow-[0_10px_40px_rgba(6,182,212,0.15)] select-none">
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-7.5 -left-7.5 w-20 h-20 bg-cyan-400/20 rounded-full blur-lg pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-2.5 py-1 self-start text-[10px] font-black tracking-widest uppercase text-cyan-200">
            <BrainCircuit className="w-3 h-3 text-cyan-200 animate-pulse" />
            QuizLogic Engine v3.1
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mt-2 drop-shadow-sm font-sans">
            Fayllar va Matndan Test Generatsiya Tizimi
          </h2>
          <p className="text-xs sm:text-sm text-cyan-100/90 mt-1.5 leading-relaxed font-medium">
            O'quv materiallari, PDF yoki kitoblardan testlar yarating. Agar savollar ko'p bo'lsa, tizim ularni 30 talik modullarga ajratib beradi.
          </p>
        </div>
      </div>

      {/* Workspace Area: File upload only */}
      <div className="bg-slate-850 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
        
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 gap-1">
            <button onClick={() => setActiveTab('file')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all ${activeTab === 'file' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
              <Upload className="w-3.5 h-3.5" /> Fayldan Yaratish
            </button>
            <button onClick={() => setActiveTab('text')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all ${activeTab === 'text' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
              <FileText className="w-3.5 h-3.5" /> Matndan Yaratish
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {activeTab === 'file' ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 ${
                isDragActive ? 'border-cyan-500 bg-cyan-500/5' : selectedFile ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700/60'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".docx,.txt,.json" onChange={handleFileSelect} className="hidden" />
              <FolderOpen className={`w-10 h-10 ${selectedFile ? 'text-emerald-400' : 'text-slate-500'}`} />
              {selectedFile ? (
                <div className="text-center">
                  <span className="text-xs font-black text-slate-100 block">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Hajmi: {selectedFile.size} • Turi: {selectedFile.type}</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-xs font-black text-slate-300 block">Test faylini (DOCX, TXT) sudrab bu yerga tashlang</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">To'g'ri javobni rang bilan belgilang (Word uchun)</span>
                </div>
              )}
            </div>
          ) : (
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Test savollarini shu yerga joylashtiring (copy-paste)...&#10;&#10;Masalan:&#10;1. Savol matni?&#10;A) Variant 1&#10;B) Variant 2&#10;C) Variant 3&#10;*D) To'g'ri variant&#10;&#10;2. Keyingi savol...&#10;+A) To'g'ri javob&#10;B) Boshqa variant"
              rows={10}
              className="w-full bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-2xl p-4 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-cyan-500 focus:bg-slate-900/70 transition-all duration-200 resize-y"
            />
          )}
        </div>


        {errorMsg && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleGenerateQuiz}
          disabled={isGenerating || (activeTab === 'file' ? !rawFile : !pasteText.trim())}
          className="self-end px-6 py-2.5 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-850 text-slate-950 disabled:text-slate-500 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md disabled:shadow-none active:scale-98"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
              <span>TAHLIL QILINMOQDA...</span>
            </>
          ) : (
            <>
              <BrainCircuit className="w-3.5 h-3.5 text-slate-950" />
              <span>TUZISH</span>
            </>
          )}
        </button>
      </div>

      {/* Chunking Alert Notification Box */}
      {chunkAlert && chunkAlert.show && (
        <div className="relative overflow-hidden bg-slate-900 border-2 border-cyan-500/40 p-5 rounded-2xl shadow-2xl flex flex-col gap-3.5 animate-fade-in">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-widest font-mono">Modulli Sinov Tizimi</span>
              <h4 className="text-sm font-black text-slate-100 mt-1">1-qism tayyor ({chunkAlert.partSize} ta savol). Boshlaymizmi?</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Hujjatda jami {chunkAlert.totalQuestions} ta savol aniqlandi. Tizim ularni avtomatik ravishda {chunkAlert.partsCount} ta qismga bo'lib chiqdi. Har bir modul yakunida ovoz berish imkoniyati ochiladi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <button
              onClick={() => {
                setChunkAlert(null);
                triggerStartQuiz(chunkAlert.quizId, 'solo');
              }}
              className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 rounded-xl transition-all"
            >
              Yakka Tartibda
            </button>
            <button
              onClick={() => { 
                setChunkAlert(null);
                triggerStartQuiz(chunkAlert.quizId, 'group');
              }}
              className="py-2.5 px-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-[11px] font-black rounded-xl transition-all"
            >
              Lobbyga Kirish
            </button>
          </div>
        </div>
      )}

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 mt-2 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="text-center">
            <span className="text-sm font-bold text-slate-300">Test tahlil qilinmoqda...</span>
            <p className="text-xs text-slate-500 mt-1">Iltimos kuting, bu bir necha daqiqa vaqt olishi mumkin.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Available Quiz Cards Header */}
          <div className="flex items-center justify-between px-1 mt-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              Mavjud Test Loyihalari ({quizzes.length})
            </h3>
          </div>

          {/* Grid List of Cards (Compact Rows) */}
          <div className="flex flex-col gap-2">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group relative overflow-hidden bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/60 p-3 rounded-xl transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm hover:bg-slate-900/90"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-linear-to-bl from-cyan-500/5 to-purple-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />

                {/* Left Info Column */}
                <div className="flex flex-col gap-1 min-w-0 flex-1 z-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-black uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">
                      {quiz.subject}
                    </span>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      quiz.level === 'Oson'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : quiz.level === 'O\'rta'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {quiz.level}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Tuzuvchi: {quiz.creator}</span>
                  </div>

                  <div className="flex flex-col">
                    <h4 className="text-xs font-black text-slate-200 group-hover:text-cyan-400 transition-colors duration-200">
                      {quiz.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal truncate max-w-lg">
                      {quiz.description}
                    </p>
                  </div>
                </div>

                {/* Right Action Column */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 z-10">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {quiz.parts ? `${quiz.questionsCount} ta test (${quiz.parts.length} modul)` : `${quiz.questionsCount} ta test`}
                  </span>

                  <div className="flex items-center gap-1.5"> 
                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setEditingQuiz(quiz);
                        setEditTitle(quiz.title);
                        setEditDescription(quiz.description);
                        setEditSubject(quiz.subject);
                        setEditLevel(quiz.level);
                      }}
                      className="p-1 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-cyan-400 rounded-lg transition-all"
                      title="Tahrirlash"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        if (window.confirm(`"${quiz.title}" testini butunlay o'chirmoqchimisiz?`)) {
                          onDeleteQuiz?.(quiz.id);
                        }
                      }}
                      className="p-1 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => triggerStartQuiz(quiz.id, 'solo')}
                      className="py-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-[9px] font-bold text-cyan-400 hover:text-cyan-300 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                      title="Yakka ishlash"
                    >
                      <Play className="w-2.5 h-2.5" />
                      <span>YAKKA</span>
                    </button>
                    
                    <button
                      onClick={() => triggerStartQuiz(quiz.id, 'group')}
                      className="py-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-[9px] font-bold text-purple-400 hover:text-purple-300 rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                      title="Guruh bilan (Sun'iy AI)"
                    >
                      <Users className="w-2.5 h-2.5 text-purple-400" />
                      <span>DUEL AI</span>
                    </button>
                    <button
                      onClick={() => onStartMultiplayer?.(quiz.id)}
                      className="py-1 px-2.5 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-[9px] font-black rounded-lg transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                      title="Haqiqiy Multiplayer Lobby"
                    >
                      <Globe className="w-2.5 h-2.5 text-white" />
                      <span>LOBBY</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ⏱️ TAYMER TANLASH OYNASI (MODAL) */}
      {showTimerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-slate-850 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-scale-up">
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="font-black text-sm text-slate-200 font-sans">Vaqt Limiti Tanlovi</h3>
              </div>
              <button 
                onClick={() => setShowTimerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400 leading-relaxed font-medium">
                Har bir savol uchun ajratiladigan vaqtni belgilang. {pendingMode === 'group' ? "Ushbu limit barcha guruh a'zolari uchun amal qiladi." : "Ushbu limit solo yechish tezligingizni oshirishga yordam beradi."}
              </span>
            </div>

            {/* Timer Options Grid */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[10, 15, 20, 30, 35].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setChosenTimer(time)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border ${ 
                    chosenTimer === time
                      ? 'bg-linear-to-r from-cyan-500/20 to-blue-500/25 border-cyan-500/50 text-cyan-300 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {time} soniya
                </button>
              ))}
              <button
                type="button"
                onClick={() => setChosenTimer(99999)}
                className={`col-span-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border ${ 
                  chosenTimer === 99999
                    ? 'bg-linear-to-r from-cyan-500/20 to-blue-500/25 border-cyan-500/50 text-cyan-300 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Cheksiz vaqt (Taymersiz)
              </button>
            </div>
            <div className="flex gap-2.5 mt-3 pt-3 border-t border-slate-850">
              <button
                onClick={() => setShowTimerModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl transition-all"
              >
                BEKOR QILISH
              </button>
              <button
                onClick={() => {
                  if (pendingQuizId) {
                    onStartQuiz(pendingQuizId, pendingMode, chosenTimer);
                    setShowTimerModal(false);
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md active:scale-95"
              >
                BOSHLASH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📝 TEST LOYIHASINI TAHRIRLASH (MODAL) */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-slate-850 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-sm text-slate-200 font-sans">Testni Tahrirlash</h3>
              </div>
              <button 
                onClick={() => setEditingQuiz(null)}
                className="p-1 text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Test Sarlavhasi</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/50 transition-all"
                  placeholder="Yangi sarlavha..."
                />
              </div>

              {/* Subject Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fani / Mavzusi</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/50 transition-all"
                  placeholder="Masalan: Oliy Matematika..."
                />
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tavsifi</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/50 transition-all resize-none font-sans"
                  placeholder="Tavsif bering..."
                />
              </div>

              {/* Level Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Qiyinchilik Darajasi</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Oson', 'O\'rta', 'Qiyin'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEditLevel(lvl)}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                        editLevel === lvl
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 mt-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingQuiz(null)}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl transition-all"
              >
                BEKOR QILISH
              </button>
              <button
                onClick={() => {
                  if (editTitle.trim()) {
                    onUpdateQuiz?.({
                      ...editingQuiz,
                      title: editTitle.trim(),
                      description: editDescription.trim(),
                      subject: editSubject.trim(),
                      level: editLevel
                    });
                    setEditingQuiz(null);
                  }
                }}
                className="flex-1 py-2.5 px-4 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md active:scale-95"
              >
                SAQLASH
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
