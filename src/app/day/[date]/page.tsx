"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDayStore } from "../../../store/useDayStore";
import { DayHeader } from "../../../components/DayHeader";
import { TimeGrid } from "../../../components/TimeGrid";
import { MiniCalendar } from "../../../components/MiniCalendar";
import { DailyMetrics } from "../../../components/DailyMetrics";
import { MITList } from "../../../components/MITList";
import { NotesPanel } from "../../../components/NotesPanel";
import { ReflectionPanel } from "../../../components/ReflectionPanel";
import { TaskList } from "../../../components/TaskList";
import { StreakDrawer } from "../../../components/StreakDrawer";
import { PomodoroTimer } from "../../../components/PomodoroTimer";
import { formatDateKey, parseDateKey } from "../../../lib/dateUtils";
import { addDays, subDays } from "date-fns";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function DayArchivePage() {
  const params = useParams();
  const router = useRouter();
  const { init, setActiveDate, activeDate, themeAccent } = useDayStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  const dateParam = params.date as string;

  // Initialize and load active date
  useEffect(() => {
    setHasHydrated(true);
    init();
    if (dateParam) {
      setActiveDate(dateParam);
      try {
        const parsedDate = parseDateKey(dateParam);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const compareDate = new Date(parsedDate);
        compareDate.setHours(0, 0, 0, 0);
        
        setIsReadOnly(compareDate < today);
      } catch (e) {
        setIsReadOnly(true);
      }
    }
  }, [dateParam, init, setActiveDate]);

  const handleBackToToday = () => {
    const today = formatDateKey(new Date());
    setActiveDate(today);
    router.push("/");
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center font-mono text-[10px] tracking-widest text-accent">
        CALIBRATING HISTORICAL ARCHIVE...
      </div>
    );
  }

  const THEME_BLOBS = {
    lime: "rgba(200, 255, 0, 0.12)",
    purple: "rgba(175, 82, 255, 0.12)",
    cyan: "rgba(0, 229, 255, 0.12)",
    magenta: "rgba(255, 60, 172, 0.12)",
    orange: "rgba(255, 107, 53, 0.12)",
    green: "rgba(57, 255, 20, 0.12)",
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="min-h-screen bg-bg/95 backdrop-blur-md text-textPrimary px-4 py-8 md:px-12 md:py-16 select-none relative z-50 overflow-hidden"
    >
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

      {/* Return Button */}
      <div className="max-w-7xl mx-auto mb-6 relative z-10">
        <button
          onClick={handleBackToToday}
          className="flex items-center gap-2 font-mono text-[10px] text-accent tracking-widest uppercase hover:opacity-85 transition-opacity"
        >
          <ArrowLeft size={12} /> Return to Today
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Column: Timeline & Bottom Panels */}
        <div className="lg:col-span-8 flex flex-col">
          <DayHeader isReadOnly={isReadOnly} />
          <TimeGrid isReadOnly={isReadOnly} />

          {/* Notes and Reflection Cards below timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <NotesPanel isReadOnly={isReadOnly} />
            <ReflectionPanel isReadOnly={isReadOnly} />
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:mt-[105px]">
          <PomodoroTimer />
          <MiniCalendar />
          <DailyMetrics isReadOnly={isReadOnly} />
          <MITList isReadOnly={isReadOnly} />
          <TaskList isReadOnly={isReadOnly} />
        </div>
      </div>
    </motion.div>
  );
}
