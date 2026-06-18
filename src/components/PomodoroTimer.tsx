"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, Timer, Sparkles } from "lucide-react";

type TimerMode = "work" | "shortBreak" | "longBreak";
type TimerStatus = "idle" | "running" | "paused";

export const PomodoroTimer: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>("work");
  const [status, setStatus] = useState<TimerStatus>("idle");
  
  // Customizable durations (in minutes)
  const [workLength, setWorkLength] = useState(25);
  const [shortBreakLength, setShortBreakLength] = useState(5);
  const [longBreakLength, setLongBreakLength] = useState(15);
  
  // Time state (seconds left)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synced default updates
  useEffect(() => {
    if (status === "idle") {
      if (mode === "work") setTimeLeft(workLength * 60);
      else if (mode === "shortBreak") setTimeLeft(shortBreakLength * 60);
      else if (mode === "longBreak") setTimeLeft(longBreakLength * 60);
    }
  }, [workLength, shortBreakLength, longBreakLength, mode, status]);

  // Audio synthesize cue using Web Audio API
  const playAlertChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Chime note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.6);
      
      // Chime note 2: A5 (880 Hz) after 150ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.85);
    } catch (e) {
      console.warn("Web Audio chime failed to play:", e);
    }
  };

  // Timer Tick Core Logic
  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer expired
            clearInterval(timerRef.current!);
            setStatus("idle");
            playAlertChime();
            
            // Auto transitions to next logical mode
            if (mode === "work") {
              setMode("shortBreak");
              return shortBreakLength * 60;
            } else {
              setMode("work");
              return workLength * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, mode, workLength, shortBreakLength]);

  // Adjust timers
  const adjustLength = (targetMode: TimerMode, amount: number) => {
    const minVal = 1;
    const maxVal = 120;
    
    if (targetMode === "work") {
      setWorkLength((prev) => Math.min(maxVal, Math.max(minVal, prev + amount)));
    } else if (targetMode === "shortBreak") {
      setShortBreakLength((prev) => Math.min(maxVal, Math.max(minVal, prev + amount)));
    } else if (targetMode === "longBreak") {
      setLongBreakLength((prev) => Math.min(maxVal, Math.max(minVal, prev + amount)));
    }
  };

  const handleInputChange = (targetMode: TimerMode, val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      if (targetMode === "work") setWorkLength(0);
      else if (targetMode === "shortBreak") setShortBreakLength(0);
      else if (targetMode === "longBreak") setLongBreakLength(0);
      return;
    }
    const clamped = Math.min(120, Math.max(0, parsed)); // Allow 0 while typing
    if (targetMode === "work") setWorkLength(clamped);
    else if (targetMode === "shortBreak") setShortBreakLength(clamped);
    else if (targetMode === "longBreak") setLongBreakLength(clamped);
  };

  const handleInputBlur = (targetMode: TimerMode) => {
    if (targetMode === "work" && workLength < 1) setWorkLength(25);
    else if (targetMode === "shortBreak" && shortBreakLength < 1) setShortBreakLength(5);
    else if (targetMode === "longBreak" && longBreakLength < 1) setLongBreakLength(15);
  };

  const toggleTimer = () => {
    if (status === "running") setStatus("paused");
    else setStatus("running");
  };

  const resetTimer = () => {
    setStatus("idle");
    if (mode === "work") setTimeLeft(workLength * 60);
    else if (mode === "shortBreak") setTimeLeft(shortBreakLength * 60);
    else if (mode === "longBreak") setTimeLeft(longBreakLength * 60);
  };

  const skipTimer = () => {
    setStatus("idle");
    if (mode === "work") {
      setMode("shortBreak");
      setTimeLeft(shortBreakLength * 60);
    } else if (mode === "shortBreak") {
      setMode("longBreak");
      setTimeLeft(longBreakLength * 60);
    } else {
      setMode("work");
      setTimeLeft(workLength * 60);
    }
  };

  const selectMode = (newMode: TimerMode) => {
    setStatus("idle");
    setMode(newMode);
    if (newMode === "work") setTimeLeft(workLength * 60);
    else if (newMode === "shortBreak") setTimeLeft(shortBreakLength * 60);
    else if (newMode === "longBreak") setTimeLeft(longBreakLength * 60);
  };

  // Format countdown string
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Progress calculations
  const getInitialSeconds = () => {
    if (mode === "work") return workLength * 60;
    if (mode === "shortBreak") return shortBreakLength * 60;
    return longBreakLength * 60;
  };
  const totalSecs = getInitialSeconds();
  const progressPercent = totalSecs > 0 ? ((totalSecs - timeLeft) / totalSecs) * 100 : 0;

  return (
    <div className="w-full bg-surface border border-border p-4 rounded select-none flex flex-col relative overflow-hidden">
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-textPrimary">
          <Timer size={13} className="text-accent" />
          <span className="font-mono text-[9px] font-bold tracking-wider uppercase">
            Pomodoro Focus
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-1 h-1 rounded-full ${status === "running" ? "bg-accent animate-ping" : "bg-textMuted"}`} />
          <span className="font-mono text-[7px] font-bold text-textMuted uppercase tracking-widest">
            {status}
          </span>
        </div>
      </div>

      {/* Mode selectors */}
      <div className="grid grid-cols-3 gap-1 mb-3 bg-bg/50 border border-border/80 p-0.5 rounded text-[8px] font-mono font-bold">
        {(["work", "shortBreak", "longBreak"] as TimerMode[]).map((m) => {
          const labels = { work: "FOCUS", shortBreak: "SHORT", longBreak: "LONG" };
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => selectMode(m)}
              className={`py-1 rounded-sm transition-all duration-200 uppercase ${
                isActive
                  ? "bg-accent text-bg font-black"
                  : "text-textMuted hover:text-textPrimary"
              }`}
            >
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* Timer Display */}
      <div className="flex items-center justify-between py-1 px-2">
        <h2 className="font-display font-black text-4xl text-textPrimary tracking-tight leading-none tabular-nums filter drop-shadow-[0_0_2px_rgba(255,255,255,0.1)]">
          {formatTime(timeLeft)}
        </h2>

        {/* Buttons Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTimer}
            className={`w-7 h-7 rounded border flex items-center justify-center transition-all ${
              status === "running"
                ? "border-accent2 bg-accent2/10 text-accent2 hover:bg-accent2 hover:text-bg"
                : "border-accent bg-accent/10 text-accent hover:bg-accent hover:text-bg shadow-[0_0_8px_rgba(200,255,0,0.1)]"
            }`}
          >
            {status === "running" ? <Pause size={12} className="stroke-[3]" /> : <Play size={12} className="stroke-[3]" />}
          </button>

          <button
            onClick={resetTimer}
            className="w-7 h-7 rounded border border-border bg-surface hover:border-textMuted text-textMuted hover:text-textPrimary flex items-center justify-center transition-colors"
            title="Reset"
          >
            <RotateCcw size={12} />
          </button>

          <button
            onClick={skipTimer}
            className="w-7 h-7 rounded border border-border bg-surface hover:border-textMuted text-textMuted hover:text-textPrimary flex items-center justify-center transition-colors"
            title="Skip Mode"
          >
            <SkipForward size={12} />
          </button>
        </div>
      </div>

      {/* Progress ring/bar line */}
      <div className="w-full h-1 bg-bg border border-border/30 rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-accent filter drop-shadow-[0_0_2px_var(--accent)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Configuration Sliders inline */}
      <div className="mt-3.5 pt-3 border-t border-border/30 flex flex-col gap-2 font-mono text-[8px] text-textMuted">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1 font-bold text-textPrimary uppercase">
            <Sparkles size={8} className="text-accent" /> Durations (m)
          </span>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <span>WORK:</span>
              <div className="flex items-center gap-1 bg-bg/60 border border-border/60 rounded px-1">
                <button
                  onClick={() => adjustLength("work", -1)}
                  className="hover:text-accent font-bold px-0.5"
                  disabled={status === "running"}
                >
                  -
                </button>
                <input
                  type="number"
                  value={workLength === 0 ? "" : workLength}
                  onChange={(e) => handleInputChange("work", e.target.value)}
                  onBlur={() => handleInputBlur("work")}
                  disabled={status === "running"}
                  className="w-5 bg-transparent text-textPrimary font-bold text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 focus:text-accent font-mono text-[8px]"
                  min="1"
                  max="120"
                />
                <button
                  onClick={() => adjustLength("work", 1)}
                  className="hover:text-accent font-bold px-0.5"
                  disabled={status === "running"}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span>BREAK:</span>
              <div className="flex items-center gap-1 bg-bg/60 border border-border/60 rounded px-1">
                <button
                  onClick={() => adjustLength("shortBreak", -1)}
                  className="hover:text-accent font-bold px-0.5"
                  disabled={status === "running"}
                >
                  -
                </button>
                <input
                  type="number"
                  value={shortBreakLength === 0 ? "" : shortBreakLength}
                  onChange={(e) => handleInputChange("shortBreak", e.target.value)}
                  onBlur={() => handleInputBlur("shortBreak")}
                  disabled={status === "running"}
                  className="w-5 bg-transparent text-textPrimary font-bold text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 focus:text-accent font-mono text-[8px]"
                  min="1"
                  max="120"
                />
                <button
                  onClick={() => adjustLength("shortBreak", 1)}
                  className="hover:text-accent font-bold px-0.5"
                  disabled={status === "running"}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
