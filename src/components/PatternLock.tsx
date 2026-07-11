import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShieldCheck, Lock, RotateCcw, ShieldAlert, KeyRound, Touchpad } from 'lucide-react';

interface PatternLockProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PatternLock({ onSuccess, onCancel }: PatternLockProps) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ x: number; y: number } | null>(null);
  const [errorState, setErrorState] = useState(false);
  const [failedAttempt, setFailedAttempt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Get coordinates of a dot relative to the SVG container
  const getDotCoords = useCallback((num: number) => {
    const element = dotsRef.current[num];
    const container = containerRef.current;
    if (!element || !container) return { x: 0, y: 0 };
    
    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2
    };
  }, []);

  // Check if coordinates overlap with any dot
  const checkDotCollision = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return null;

    for (let i = 1; i <= 9; i++) {
      const element = dotsRef.current[i];
      if (!element) continue;

      const rect = element.getBoundingClientRect();
      const radius = rect.width * 0.8; // expanded radius for easy touch targeting

      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        return i;
      }
    }
    return null;
  }, []);

  // Sequential click / tap fallback: clicking a dot directly appends it to the pattern!
  const handleDotTap = (num: number) => {
    if (errorState) return;
    
    if (!pattern.includes(num)) {
      const newPattern = [...pattern, num];
      setPattern(newPattern);
      
      // Check immediately if we have collected 6 digits
      if (newPattern.length === 6) {
        verifyPatternCode(newPattern);
      }
    }
  };

  const startTracking = (e: React.MouseEvent | React.TouchEvent) => {
    setErrorState(false);
    setIsDrawing(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const collidedDot = checkDotCollision(clientX, clientY);
    if (collidedDot && !pattern.includes(collidedDot)) {
      setPattern([collidedDot]);
    }
    
    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setCurrentPosition({
        x: clientX - containerRect.left,
        y: clientY - containerRect.top
      });
    }
  };

  const trackMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const collidedDot = checkDotCollision(clientX, clientY);
    if (collidedDot && !pattern.includes(collidedDot)) {
      const newPattern = [...pattern, collidedDot];
      setPattern(newPattern);
      if (newPattern.length === 6) {
        setIsDrawing(false);
        verifyPatternCode(newPattern);
        return;
      }
    }

    const container = containerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setCurrentPosition({
        x: clientX - containerRect.left,
        y: clientY - containerRect.top
      });
    }
  }, [isDrawing, pattern, checkDotCollision]);

  const verifyPatternCode = (currentPattern: number[]) => {
    // Equation check for 8,5,7,3,6,4
    // 8 + 50 + 700 + 3000 + 60000 + 400000 = 463758
    const sumCheck = currentPattern.reduce((acc, val, idx) => acc + val * Math.pow(10, idx), 0);
    const lengthCheck = currentPattern.length === 6;
    const sumDigitCheck = currentPattern.reduce((acc, val) => acc + val, 0) === 33;
    const matchesTarget = lengthCheck && sumCheck === 463758 && sumDigitCheck;

    if (matchesTarget) {
      onSuccess();
    } else {
      setErrorState(true);
      // Automatically show the warning screen after a small delay
      setTimeout(() => {
        setPattern([]);
        setErrorState(false);
        setFailedAttempt(true);
      }, 600);
    }
  };

  const stopTracking = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentPosition(null);

    if (pattern.length > 0) {
      verifyPatternCode(pattern);
    }
  }, [isDrawing, pattern]);

  useEffect(() => {
    if (isDrawing) {
      window.addEventListener('mousemove', trackMove);
      window.addEventListener('mouseup', stopTracking);
      window.addEventListener('touchmove', trackMove, { passive: false });
      window.addEventListener('touchend', stopTracking);
    }

    return () => {
      window.removeEventListener('mousemove', trackMove);
      window.removeEventListener('mouseup', stopTracking);
      window.removeEventListener('touchmove', trackMove);
      window.removeEventListener('touchend', stopTracking);
    };
  }, [isDrawing, trackMove, stopTracking]);

  const resetPattern = () => {
    setPattern([]);
    setErrorState(false);
  };

  if (failedAttempt) {
    return (
      <div className="flex flex-col items-center justify-center p-4 w-full max-w-sm mx-auto">
        <div className="relative w-full bg-slate-900 border-2 border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.3)] rounded-3xl p-6 text-center flex flex-col gap-4 animate-fade-in">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest font-sans">
              OGOHLANTIRISH!
            </h3>
            <p className="text-[11px] text-slate-300 font-bold leading-relaxed px-1">
              Admin tasdiqlanmadi, urinish befoyda!
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-full mt-2 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 text-[10px] font-black rounded-xl transition-all shadow-md active:scale-98 uppercase tracking-wider"
          >
            Asosiy oynaga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-md mx-auto">
      {/* 3.1 modern neon border design */}
      <div className={`relative w-full bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 border transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${
        errorState 
          ? 'border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.3)] animate-shake' 
          : pattern.length > 0 
            ? 'border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.2)]' 
            : 'border-slate-800'
      }`}>
        
        {/* Abstract 3D Orbs */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center mb-5">
          <div className="mx-auto w-14 h-14 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-slate-800 mb-3 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)]">
            {errorState ? (
              <ShieldAlert className="w-7 h-7 text-rose-500 animate-pulse" />
            ) : pattern.length > 0 ? (
              <Lock className="w-7 h-7 text-cyan-400 animate-bounce" />
            ) : (
              <KeyRound className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <h3 className="text-lg font-black tracking-tight text-white font-sans">Master Ruxsat Kaliti</h3>
          <p className="text-xs text-rose-400 font-extrabold mt-1 max-w-[280px] mx-auto leading-relaxed">
            Admin bo'lmasangiz urinishga harakat qilmang
          </p>

          {/* Connected state display indicator */}
          <div className="mt-2.5 flex justify-center gap-1.5 min-h-[16px]">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  errorState 
                    ? 'bg-rose-500 scale-95 shadow-[0_0_8px_rgba(244,63,94,0.8)]' 
                    : idx < pattern.length 
                      ? 'bg-cyan-400 scale-110 shadow-[0_0_8px_rgba(6,182,212,0.8)]' 
                      : 'bg-slate-800 border border-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Interactive drawing canvas area */}
        <div 
          ref={containerRef}
          onMouseDown={startTracking}
          onTouchStart={startTracking}
          className="relative w-full aspect-square bg-slate-950/60 rounded-2xl border border-slate-800/80 p-6 select-none cursor-pointer overflow-hidden shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)]"
        >
          {/* SVG Canvas for drawing connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Connecting Lines */}
            {pattern.map((num, idx) => {
              if (idx === 0) return null;
              const start = getDotCoords(pattern[idx - 1]);
              const end = getDotCoords(num);
              return (
                <line
                  key={`line-${idx}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={errorState ? "#f43f5e" : "url(#lineGrad)"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  className="transition-all duration-150"
                />
              );
            })}

            {/* Active drawing line to cursor */}
            {isDrawing && pattern.length > 0 && currentPosition && (
              <line
                x1={getDotCoords(pattern[pattern.length - 1]).x}
                y1={getDotCoords(pattern[pattern.length - 1]).y}
                x2={currentPosition.x}
                y2={currentPosition.y}
                stroke={errorState ? "#f43f5e" : "#22d3ee"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="4 4"
                className="opacity-70"
              />
            )}
          </svg>

          {/* 3x3 Grid of Premium Dots */}
          <div className="grid grid-cols-3 gap-6 h-full items-center justify-items-center">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => {
              const isActive = pattern.includes(num);
              const isLast = pattern[pattern.length - 1] === num;
              
              let dotClass = "bg-slate-800 border-slate-700 text-slate-400";
              if (isActive) {
                if (errorState) {
                  dotClass = "bg-rose-600 border-rose-400 text-white scale-110 shadow-[0_0_20px_rgba(244,63,94,0.7)]";
                } else {
                  dotClass = "bg-cyan-500 border-cyan-400 text-slate-950 scale-110 shadow-[0_0_20px_rgba(6,182,212,0.7)]";
                }
              }

              return (
                <button
                  key={num}
                  type="button"
                  ref={(el) => { dotsRef.current[num] = el; }}
                  onClick={() => handleDotTap(num)}
                  className={`relative w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 z-20 font-bold ${dotClass} hover:border-slate-500/50 active:scale-90`}
                >
                  {/* Subtle blur background */}
                  <div className="absolute inset-[-4px] bg-slate-900/40 rounded-2xl blur-xs -z-10" />
                  
                  {/* Pulsing visual for active states */}
                  {isActive && !errorState && (
                    <div className="absolute inset-[-6px] border border-cyan-500/40 rounded-2xl animate-ping pointer-events-none" />
                  )}

                  <span className="text-xs font-mono select-none">
                    {num}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Control Actions */}
        <div className="mt-5 flex justify-between gap-3 z-10">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-slate-950/60 border border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-all duration-200"
          >
            Yopish
          </button>
          <button
            onClick={resetPattern}
            disabled={pattern.length === 0}
            className="flex-1 py-3 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-bold text-white rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tozalash
          </button>
        </div>
      </div>
    </div>
  );
}

