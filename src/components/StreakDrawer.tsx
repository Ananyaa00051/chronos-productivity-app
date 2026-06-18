"use client";

import React, { useState, useEffect } from "react";
import { useDayStore } from "../store/useDayStore";
import { calculateStreaks } from "../lib/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Info, X, ChevronRight, Check } from "lucide-react";
import { format, subDays, isToday } from "date-fns";
import { PerformanceGraphs } from "./PerformanceGraphs";

export const StreakDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { days, themeAccent } = useDayStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const { currentStreak, bestStreak, streakDays } = calculateStreaks(days);

  // Generate last 7 days (oldest to newest/today)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "EEE").toUpperCase();
    
    const dayData = days[key];
    const hasActivity = dayData && (
      (dayData.blocks && dayData.blocks.length > 0) ||
      (dayData.notes && dayData.notes.trim() !== "" && dayData.notes !== "<p></p>" && dayData.notes !== "<p></p><p></p>") ||
      (dayData.mits && dayData.mits.some((m: any) => m.text.trim() !== "")) ||
      (dayData.metrics && (dayData.metrics.focus > 0 || dayData.metrics.energy > 0 || dayData.metrics.mood > 0)) ||
      (dayData.tasks && dayData.tasks.length > 0)
    );

    const isStreak = streakDays.includes(key);

    return {
      date: d,
      key,
      label,
      hasActivity,
      isStreak,
    };
  });

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black z-40 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Drawer Container */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 w-[320px] bg-bg border-r border-border z-50 flex flex-col h-screen select-none shadow-[10px_0_30px_rgba(0,0,0,0.5)]"
      >
        {/* Peek Tab sticking out */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-[-40px] top-[30%] w-[40px] py-4 bg-surface border-t border-b border-r border-border rounded-r flex flex-col items-center gap-2 cursor-pointer shadow-[4px_0_10px_rgba(0,0,0,0.4)] group hover:border-accent transition-colors duration-300"
        >
          <motion.div
            animate={currentStreak > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
            className="text-lg"
          >
            🔥
          </motion.div>
          <span className="font-display font-black text-sm text-accent leading-none">
            {currentStreak}
          </span>
          <div className="h-4 w-px bg-border group-hover:bg-accent/40 transition-colors" />
          <div className="flex flex-col items-center gap-0.5 font-mono text-[8px] font-bold text-textMuted tracking-wider group-hover:text-accent transition-colors">
            <span>S</span>
            <span>T</span>
            <span>R</span>
            <span>E</span>
            <span>A</span>
            <span>K</span>
          </div>
          <motion.div
            animate={{ x: isOpen ? 0 : [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-1 text-textMuted group-hover:text-accent transition-colors"
          >
            <ChevronRight size={10} className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </motion.div>
        </button>

        {/* Drawer Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface/30">
          <div>
            <span className="font-mono text-[8px] tracking-[0.25em] text-accent font-bold uppercase">
              Chronos System
            </span>
            <h2 className="font-display font-bold text-base text-textPrimary tracking-wide mt-0.5">
              STREAK REGISTRY
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-border/40 text-textMuted hover:text-textPrimary transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          {/* Streak Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Streak */}
            <div className="bg-surface border border-border p-4 rounded flex flex-col items-center relative overflow-hidden group hover:border-accent/50 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
              <Flame className="w-6 h-6 text-accent mb-2" />
              <span className="font-display font-black text-3xl text-textPrimary leading-none">
                {currentStreak}
              </span>
              <span className="font-mono text-[8px] font-bold text-textMuted tracking-wider mt-1.5 uppercase">
                Current Streak
              </span>
            </div>

            {/* Best Streak */}
            <div className="bg-surface border border-border p-4 rounded flex flex-col items-center relative overflow-hidden group hover:border-accent2/50 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent2" />
              <Trophy className="w-6 h-6 text-accent2 mb-2" />
              <span className="font-display font-black text-3xl text-textPrimary leading-none">
                {bestStreak}
              </span>
              <span className="font-mono text-[8px] font-bold text-textMuted tracking-wider mt-1.5 uppercase">
                Best Streak
              </span>
            </div>
          </div>

          {/* 7-Day Consistency Tracker */}
          <div className="bg-surface border border-border p-4 rounded flex flex-col">
            <span className="font-mono text-[9px] font-bold text-textMuted tracking-wider uppercase mb-3.5">
              7-Day Consistency Grid
            </span>
            
            <div className="grid grid-cols-7 gap-2.5 text-center">
              {last7Days.map((day) => {
                const isTod = isToday(day.date);
                
                return (
                  <div key={day.key} className="flex flex-col items-center gap-1.5">
                    {/* Day label */}
                    <span className={`font-mono text-[8px] font-bold ${isTod ? "text-accent" : "text-textMuted"}`}>
                      {day.label}
                    </span>
                    
                    {/* Dot Indicator */}
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center border transition-all duration-300 ${
                        day.isStreak
                          ? "bg-accent/10 border-accent text-accent shadow-[0_0_8px_rgba(200,255,0,0.2)]"
                          : day.hasActivity
                          ? "bg-accent2/10 border-accent2/50 text-accent2"
                          : isTod
                          ? "border-dashed border-textMuted/40 bg-transparent animate-pulse text-textMuted/60"
                          : "border-border bg-bg/40 text-textMuted/30"
                      }`}
                      title={`${day.key}: ${
                        day.isStreak 
                          ? "Active Streak 🔥" 
                          : day.hasActivity 
                          ? "Active Day (Streak Broken)" 
                          : "No Logs"
                      }`}
                    >
                      {day.isStreak ? (
                        <span className="text-[11px] leading-none select-none">🔥</span>
                      ) : day.hasActivity ? (
                        <Check size={10} className="stroke-[3]" />
                      ) : isTod ? (
                        <span className="text-[9px] font-mono leading-none">?</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Analytics Graphs */}
          <PerformanceGraphs days={days} />

          {/* Consistency Rules */}
          <div className="bg-surface border border-border p-4 rounded flex gap-3.5">
            <div className="text-accent flex-shrink-0 mt-0.5">
              <Info size={16} />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[9px] font-bold text-textPrimary tracking-wide uppercase">
                Streak Registry Rules
              </span>
              <ul className="list-none font-sans text-[10px] text-textMuted leading-relaxed flex flex-col gap-2">
                <li className="flex gap-1.5 items-start">
                  <span className="text-accent mt-0.5">•</span>
                  <span>
                    <strong>Active Day:</strong> Any day where you log time blocks, checkbox tasks, focus metrics, or notes.
                  </span>
                </li>
                <li className="flex gap-1.5 items-start">
                  <span className="text-accent mt-0.5">•</span>
                  <span>
                    <strong>Streak Retention:</strong> If you miss even one day, the streak resets to 0 (and starts at Day 1 on your next activity).
                  </span>
                </li>
                <li className="flex gap-1.5 items-start">
                  <span className="text-accent mt-0.5">•</span>
                  <span>
                    <strong>Grace Period:</strong> Your streak stays alive during the current day. If yesterday was active, you have until midnight today to log activity before it resets.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface/10 text-center font-mono text-[8px] text-textMuted tracking-wider">
          CHRONOS ENGINE V1.0 // STREAK_DRAWER
        </div>
      </motion.div>
    </>
  );
};
