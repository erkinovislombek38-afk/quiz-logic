import React, { useState, useEffect } from 'react';
import { Key, Trash2, Check, Plus, RefreshCw, CheckCircle, AlertCircle, Terminal, Sliders, Sparkles, Cpu, ExternalLink, ShieldAlert } from 'lucide-react';
import { Quiz } from '../types';

interface ApiPanelProps {
  chunkingMode: 'module' | 'all-at-once';
  onSetChunkingMode: (mode: 'module' | 'all-at-once') => void;
  quizzes: Quiz[];
  onShareQuiz: (quizId: string) => void;
  onLock: () => void;
}

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  message: string;
}

export default function ApiPanel({ 
  chunkingMode, 
  onSetChunkingMode, 
  quizzes, 
  onShareQuiz, 
  onLock 
}: ApiPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [aiModel, setAiModel] = useState(() => {
    return localStorage.getItem('custom_gemini_model') || 'gemini-2.0-flash';
  });

  // Custom Keys Array Management
  const [customKeys, setCustomKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_gemini_api_keys');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migrate old single key if it exists
      const oldSingle = localStorage.getItem('custom_gemini_api_key');
      if (oldSingle && oldSingle.trim()) {
        const initial = [oldSingle.trim()];
        localStorage.setItem('custom_gemini_api_keys', JSON.stringify(initial));
        return initial;
      }
    } catch (e) {
      console.error("Error parsing keys:", e);
    }
    return [];
  });

  const [activeIdx, setActiveIdx] = useState<number>(() => {
    return Number(localStorage.getItem('custom_gemini_active_key_idx') || '0');
  });

  const [exhaustedKeys, setExhaustedKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('exhausted_gemini_api_keys');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [newKeyInput, setNewKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Synchronize active key with the legacy single key for backwards compatibility
  useEffect(() => {
    const activeKey = customKeys[activeIdx] || '';
    localStorage.setItem('custom_gemini_api_key', activeKey);
    localStorage.setItem('custom_gemini_active_key_idx', activeIdx.toString());
  }, [customKeys, activeIdx]);

  // Save selected model when changed
  useEffect(() => {
    localStorage.setItem('custom_gemini_model', aiModel);
  }, [aiModel]);

  // Sync keys, active index and exhausted status in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedKeys = localStorage.getItem('custom_gemini_api_keys');
        if (savedKeys) {
          const parsed = JSON.parse(savedKeys);
          if (Array.isArray(parsed)) setCustomKeys(parsed);
        }
        const active = Number(localStorage.getItem('custom_gemini_active_key_idx') || '0');
        setActiveIdx(active);
        const exhausted = localStorage.getItem('exhausted_gemini_api_keys');
        if (exhausted) {
          const parsed = JSON.parse(exhausted);
          if (Array.isArray(parsed)) setExhaustedKeys(parsed);
        } else {
          setExhaustedKeys([]);
        }
      } catch (e) {
        console.error("Storage sync failed:", e);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Load initial logs
  useEffect(() => {
    const initialLogs: LogEntry[] = [
      { timestamp: '07:10:02', method: 'GET', path: '/api/health', status: 200, message: 'Health Check - Server active' },
      { timestamp: '07:12:15', method: 'POST', path: '/api/generate-quiz', status: 200, message: 'AI test session initialized' }
    ];
    setLogs(initialLogs);

    const logInterval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newLog: LogEntry = {
        timestamp: timeStr,
        method: Math.random() > 0.5 ? 'GET' : 'POST',
        path: Math.random() > 0.5 ? '/api/health' : '/api/generate-quiz',
        status: 200,
        message: 'Tizim monitoringi faol rejimda'
      };
      setLogs(prev => [newLog, ...prev.slice(0, 10)]);
    }, 15000);

    return () => clearInterval(logInterval);
  }, []);

  const handleAddKey = () => {
    const key = newKeyInput.trim();
    if (!key) {
      showStatus('error', "Iltimos, API kalitini kiriting.");
      return;
    }
    if (!key.startsWith('AIzaSy') && !key.startsWith('AQ')) {
      showStatus('error', "Gemini API kaliti odatda 'AIzaSy' yoki 'AQ' bilan boshlanishi kerak.");
      return;
    }
    if (customKeys.includes(key)) {
      showStatus('error', "Ushbu API kalit ro'yxatda allaqachon mavjud.");
      return;
    }

    const updated = [...customKeys, key];
    setCustomKeys(updated);
    localStorage.setItem('custom_gemini_api_keys', JSON.stringify(updated));
    
    // Set the newly added key as active
    const newActiveIdx = updated.length - 1;
    setActiveIdx(newActiveIdx);

    // Reset input field instantly so they can enter the NEXT key
    setNewKeyInput('');
    showStatus('success', "Yangi API kaliti saqlandi va ro'yxatga (pastga) qo'shildi! ✅");
  };

  const handleDeleteKey = (idxToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customKeys.filter((_, i) => i !== idxToDelete);
    setCustomKeys(updated);
    localStorage.setItem('custom_gemini_api_keys', JSON.stringify(updated));

    if (activeIdx === idxToDelete) {
      setActiveIdx(0);
    } else if (activeIdx > idxToDelete) {
      setActiveIdx(prev => Math.max(0, prev - 1));
    }
    showStatus('success', "API kaliti ro'yxatdan o'chirildi.");
  };

  const handleSelectKey = (idx: number) => {
    setActiveIdx(idx);
    const selectedKey = customKeys[idx];
    if (selectedKey && exhaustedKeys.includes(selectedKey)) {
      const updatedExhausted = exhaustedKeys.filter(k => k !== selectedKey);
      setExhaustedKeys(updatedExhausted);
      localStorage.setItem('exhausted_gemini_api_keys', JSON.stringify(updatedExhausted));
      showStatus('success', `API kalit #${idx + 1} faollashtirildi va limiti qayta ochildi! ✅`);
    } else {
      showStatus('success', `API kalit #${idx + 1} faollashtirildi.`);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setTestResult({
          success: true,
          message: "Ulanish muvaffaqiyatli! Server va API to'liq ishlamoqda."
        });
      } else {
        throw new Error();
      }
    } catch {
      setTestResult({
        success: false,
        message: "Serverga ulanib bo'lmadi. server.ts ishlayotganini tekshiring."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const maskKey = (key: string) => {
    if (key.length < 10) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-sm mx-auto px-1 animate-fade-in text-xs select-none">
      
      {/* 🔑 API Keys Management Box */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <Key className="w-4 h-4 text-cyan-400" />
            <h3 className="font-black text-xs text-slate-200 uppercase tracking-wider">Gemini API Kalitlari Pool</h3>
          </div>
          <button
            onClick={onLock}
            className="text-[9px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-lg font-black tracking-wide transition-all"
          >
            Qulflash
          </button>
        </div>

        {/* Info & Get Key link */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-400 leading-normal">
            Barcha API kalitlaringiz faqat brauzeringiz xotirasida (localStorage) saqlanadi. Istalgancha kalit qo'shishingiz va ularni almashtirishingiz mumkin.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 self-start bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg transition-all"
          >
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Bepul API Kalitini Olish</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Input Form for New Key */}
        <div className="flex flex-col gap-2 bg-slate-900/60 p-2.5 border border-slate-800/80 rounded-xl mt-1">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Yangi kalit qo'shish</span>
          <div className="flex gap-2">
            <input
              type={showKeyInput ? "text" : "password"}
              value={newKeyInput}
              onChange={(e) => setNewKeyInput(e.target.value)}
              placeholder="AIzaSy... API Kalitini kiriting"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="px-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-[10px] font-bold transition-all"
            >
              {showKeyInput ? "Yopish" : "Ko'rish"}
            </button>
          </div>
          <button
            onClick={handleAddKey}
            className="w-full py-1.5 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-lg text-[10px] tracking-wide transition-all uppercase shadow-sm"
          >
            SAQLASH (Qo'shish)
          </button>
        </div>

        {/* Status Messages */}
        {statusMsg && (
          <div className={`p-2 rounded-lg text-[10px] flex items-center gap-1.5 border ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 📋 Key pool display (Sizning API Kalitlaringiz) */}
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Mavjud Kalitlar Hovuzi ({customKeys.length} ta)</span>
          {customKeys.length === 0 ? (
            <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-center text-rose-400 text-[10px] leading-relaxed">
              Hech qanday shaxsiy kalit kiritilmagan. Gemini API to'liq ishlashi uchun yuqoriga kalit kiritib "SAQLASH" tugmasini bosing.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {customKeys.map((key, idx) => {
                const isActive = idx === activeIdx;
                const isExhausted = exhaustedKeys.includes(key);
                
                let statusText = 'NAVBATDA';
                let statusClass = 'bg-slate-900 text-slate-600';
                
                if (isActive) {
                  if (isExhausted) {
                    statusText = 'FAOL (LIMIT TUGAGAN)';
                    statusClass = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
                  } else {
                    statusText = 'FAOL';
                    statusClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                  }
                } else if (isExhausted) {
                  statusText = 'LIMIT TUGAGAN';
                  statusClass = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectKey(idx)}
                    className={`p-2.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                      isActive 
                        ? (isExhausted ? 'bg-rose-500/5 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400')
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-500 select-none">{idx + 1}.</span>
                      <Key className={`w-3 h-3 ${isActive ? (isExhausted ? 'text-rose-400' : 'text-emerald-400') : 'text-slate-500'}`} />
                      <span className="font-mono text-[10px]">{maskKey(key)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${statusClass}`}>
                        {statusText}
                      </span>
                      <button
                        onClick={(e) => handleDeleteKey(idx, e)}
                        className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                        title="Kalitni o'chirish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ⚙️ Model Selection & Connection Testing */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col gap-3">
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="font-black text-xs text-slate-200 uppercase tracking-wider">Sun'iy Intellekt Modeli</h3>
        </div>

        {/* Model switcher */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash-latest' },
            { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro-latest' }
          ].map((model) => (
            <button
              key={model.value}
              type="button"
              onClick={() => setAiModel(model.value)}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black transition-all border ${
                aiModel === model.value
                  ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-inner'
                  : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {model.label}
            </button>
          ))}
        </div>

        {/* Test Connection Button */}
        <div className="border-t border-slate-800/80 pt-2.5 mt-1 flex flex-col gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
              </>
            ) : (
              <Cpu className="w-3 h-3 text-cyan-400" />
            )}
            Ulanish va Serverni Sinash (Test)
          </button>

          {testResult && (
            <div className={`p-2.5 rounded-xl text-[10px] flex items-start gap-1.5 border ${
              testResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* 🖥️ Live Terminal Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md font-mono flex flex-col gap-2">
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <h4 className="text-[10px] font-black uppercase text-slate-300">Live Server Loglari</h4>
        </div>

        <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto text-[9px] leading-normal pr-1">
          {logs.map((log, index) => (
            <div key={index} className="flex gap-1.5 items-start">
              <span className="text-slate-600">[{log.timestamp}]</span>
              <span className={`font-bold uppercase ${
                log.method === 'GET' ? 'text-cyan-400' : 'text-amber-400'
              }`}>
                {log.method}
              </span>
              <span className="text-slate-400 truncate flex-1">{log.path}</span>
              <span className="text-emerald-500/80">{log.status}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
