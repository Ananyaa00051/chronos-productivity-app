"use client";

import React, { useEffect, useState } from "react";
import { useDayStore } from "../store/useDayStore";
import { DayHeader } from "../components/DayHeader";
import { TimeGrid } from "../components/TimeGrid";
import { MiniCalendar } from "../components/MiniCalendar";
import { DailyMetrics } from "../components/DailyMetrics";
import { MITList } from "../components/MITList";
import { NotesPanel } from "../components/NotesPanel";
import { ReflectionPanel } from "../components/ReflectionPanel";
import { TaskList } from "../components/TaskList";
import { StreakDrawer } from "../components/StreakDrawer";
import { PomodoroTimer } from "../components/PomodoroTimer";
import { snapTo15Mins } from "../lib/blockUtils";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, ArrowRight } from "lucide-react";

export default function Home() {
  const { init, undo, addBlock, activeDate, themeAccent } = useDayStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Handle client-side Zustand hydration
  useEffect(() => {
    setHasHydrated(true);
    init();

    // Check if the keyboard shortcuts tooltip has been dismissed
    const dismissed = localStorage.getItem("chronos-tooltip-dismissed");
    if (!dismissed) {
      setShowTooltip(true);
    }
  }, [init]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!hasHydrated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't trigger if the user is typing in inputs or tiptap rich editors
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest(".ProseMirror");

      if (isTyping) return;

      // Ctrl+Z or Cmd+Z -> Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }

      // N -> Add block at current hour
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        addBlock({
          title: "Quick Focus Block",
          category: "work",
          startMinutes: snapTo15Mins(currentMins),
          durationMinutes: 60,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasHydrated, undo, addBlock]);

  const dismissTooltip = () => {
    localStorage.setItem("chronos-tooltip-dismissed", "true");
    setShowTooltip(false);
  };

  // Rendering loading state during hydration
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center font-mono text-[10px] tracking-widest text-accent">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          CALIBRATING TIMELINE // CHRONOS...
        </motion.div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  const THEME_BLOBS = {
    lime: "rgba(200, 255, 0, 0.12)",
    purple: "rgba(175, 82, 255, 0.12)",
    cyan: "rgba(0, 229, 255, 0.12)",
    magenta: "rgba(255, 60, 172, 0.12)",
    orange: "rgba(255, 107, 53, 0.12)",
    green: "rgba(57, 255, 20, 0.12)",
  };

  return (
    <main className="min-h-screen bg-bg text-textPrimary px-4 py-8 md:px-12 md:py-16 select-none relative overflow-hidden">
      {/* Streak Registry Drawer */}
      <StreakDrawer />

      {/* Floating Glowing Neon Blobs for Background Motion */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] rounded-full blur-[120px] blob-1" style={{ backgroundColor: THEME_BLOBS[themeAccent] || THEME_BLOBS.lime }} />
        <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] rounded-full blur-[130px] blob-2" style={{ backgroundColor: "rgba(255, 60, 172, 0.12)" }} />
        <div className="absolute top-[45%] left-[40%] w-[380px] h-[380px] rounded-full blur-[120px] blob-3" style={{ backgroundColor: "rgba(108, 99, 255, 0.12)" }} />
        
        {/* Abstract animated wave lines grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100,250 Q250,120 600,350 T1300,150 T2000,450" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="wave-line-1" />
          <path d="M-100,550 Q350,420 800,650 T1700,350 T2400,750" fill="none" stroke="var(--accent-2)" strokeWidth="1.5" className="wave-line-2" />
          <path d="M-100,850 Q450,720 1000,950 T2100,650 T2800,1050" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="wave-line-3" />
        </svg>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10"
      >
        {/* Left Column: Grid Timeline & Bottom Panels */}
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col">
          <DayHeader />
          <TimeGrid />
          
          {/* Notes and Reflection Cards below the timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <NotesPanel />
            <ReflectionPanel />
          </div>
        </motion.div>

        {/* Right Column: Widgets */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6 lg:mt-[105px]">
          <PomodoroTimer />
          <MiniCalendar />
          <DailyMetrics />
          <MITList />
          <TaskList />
        </motion.div>
      </motion.div>

      {/* Keyboard Shortcuts Tooltip Banner */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-12 md:max-w-sm bg-surface border border-accent p-4 rounded shadow-2xl z-40 select-none"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="flex items-center gap-1.5 font-display font-bold text-xs text-accent tracking-wider uppercase">
                <Keyboard size={14} /> Shortcuts Guide
              </span>
              <button
                onClick={dismissTooltip}
                className="text-textMuted hover:text-textPrimary transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="font-mono text-[9px] text-textMuted flex flex-col gap-1.5 leading-normal">
              <div className="flex justify-between">
                <span>[N]</span>
                <span className="text-textPrimary">Quick block at current hour</span>
              </div>
              <div className="flex justify-between">
                <span>[Ctrl + Z]</span>
                <span className="text-textPrimary">Undo last block operation</span>
              </div>
              <div className="flex justify-between">
                <span>[ESC]</span>
                <span className="text-textPrimary">Close popup category picker</span>
              </div>
            </div>
            <button
              onClick={dismissTooltip}
              className="mt-3 w-full py-1 bg-accent/10 border border-accent/30 hover:bg-accent text-accent hover:text-bg font-mono text-[9px] font-bold rounded flex items-center justify-center gap-1 transition-all uppercase"
            >
              Acknowledge <ArrowRight size={10} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
