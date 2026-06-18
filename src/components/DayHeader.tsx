import React, { useEffect } from "react";
import { useDayStore } from "../store/useDayStore";
import { getFormattedDateLabel, getDaysDifference, formatDateKey, parseDateKey } from "../lib/dateUtils";
import { addDays, subDays } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface DayHeaderProps {
  isReadOnly?: boolean;
}

const ACCENT_OPTIONS = [
  { value: "lime", color: "#C8FF00", label: "Acid Lime" },
  { value: "purple", color: "#AF52FF", label: "Electric Purple" },
  { value: "cyan", color: "#00E5FF", label: "Cyan Blue" },
  { value: "magenta", color: "#FF3CAC", label: "Neon Magenta" },
  { value: "orange", color: "#FF6B35", label: "Cyber Orange" },
  { value: "green", color: "#39FF14", label: "Rave Green" },
] as const;

export const DayHeader: React.FC<DayHeaderProps> = ({ isReadOnly = false }) => {
  const { activeDate, appStartDate, days, setActiveDate, isSaving, themeAccent, setThemeAccent } = useDayStore();

  // Dynamically inject the CSS variable for theme accent color
  useEffect(() => {
    const accents = {
      lime: "#C8FF00",
      purple: "#AF52FF",
      cyan: "#00E5FF",
      magenta: "#FF3CAC",
      orange: "#FF6B35",
      green: "#39FF14",
    };
    const color = accents[themeAccent] || "#C8FF00";
    document.documentElement.style.setProperty("--accent", color);
  }, [themeAccent]);

  const formatted = getFormattedDateLabel(activeDate);
  const parsedActiveDate = parseDateKey(activeDate);

  // Calculate day counter (e.g. "DAY 01")
  const startKey = appStartDate || activeDate;
  const dayDiff = getDaysDifference(startKey, activeDate);
  const dayNumber = Math.max(1, dayDiff + 1);
  const paddedDayNum = dayNumber.toString().padStart(2, "0");

  const todayKey = formatDateKey(new Date());
  const todayExists = !!days[todayKey];

  const handlePrevDay = () => {
    const prev = subDays(parsedActiveDate, 1);
    setActiveDate(formatDateKey(prev));
  };

  const handleNextDay = () => {
    const next = addDays(parsedActiveDate, 1);
    setActiveDate(formatDateKey(next));
  };

  const handleJumpToToday = () => {
    setActiveDate(todayKey);
  };

  return (
    <div className="w-full flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-6 mb-8 relative select-none">
      {/* Save Status Tag and Theme Accent dots picker */}
      <div className="absolute right-0 top-0 flex flex-col items-end gap-1.5 md:gap-2">
        <div className="h-4 flex items-center">
          <AnimatePresence>
            {isSaving && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-[9px] font-mono tracking-widest text-accent"
              >
                ● SAVED
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 select-none">
          <span className="text-[8px] font-mono text-textMuted uppercase tracking-widest leading-none">
            theme
          </span>
          <div className="flex items-center gap-1">
            {ACCENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setThemeAccent(opt.value)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  themeAccent === opt.value
                    ? "ring-1 ring-offset-1 ring-offset-bg ring-textPrimary scale-110"
                    : "opacity-40 hover:opacity-100"
                }`}
                style={{ backgroundColor: opt.color }}
                title={opt.label}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-6">
        {/* BIG DAY NUMBER */}
        <h1 className="font-display font-black text-7xl md:text-8xl tracking-tighter text-textPrimary leading-none">
          DAY {paddedDayNum}
        </h1>

        <div className="h-px md:h-16 w-12 md:w-px bg-border my-2 md:my-0"></div>

        {/* DATE & DAY NAME */}
        <div className="flex flex-col justify-end">
          <span className="font-mono text-xs tracking-[0.2em] text-textMuted uppercase mb-1">
            {formatted.weekday}
          </span>
          <span className="font-display font-bold text-2xl md:text-3xl text-textPrimary">
            {formatted.dayNumber} {formatted.dateStr}
          </span>
        </div>
      </div>

      {/* NAVIGATION CONTROLS */}
      <div className="flex items-center gap-3 mt-6 md:mt-0 font-mono text-[10px] tracking-wider">
        <button
          onClick={handlePrevDay}
          className="flex items-center gap-1 text-textMuted hover:text-accent transition-colors duration-200 uppercase"
        >
          <ChevronLeft size={12} /> PREV
        </button>

        <span className="text-border">|</span>

        <button
          onClick={handleNextDay}
          className="flex items-center gap-1 text-textMuted hover:text-accent transition-colors duration-200 uppercase"
        >
          NEXT <ChevronRight size={12} />
        </button>

        {!todayExists && (
          <>
            <span className="text-border">|</span>
            <button
              onClick={handleJumpToToday}
              className="flex items-center gap-1 px-3 py-1 bg-accent text-bg font-bold rounded hover:opacity-90 transition-opacity duration-200"
            >
              <Plus size={10} /> NEW DAY
            </button>
          </>
        )}

        {isReadOnly && (
          <span className="ml-2 px-2 py-0.5 border border-accent2 text-accent2 rounded font-bold text-[9px] tracking-widest">
            ARCHIVED
          </span>
        )}
      </div>
    </div>
  );
};
