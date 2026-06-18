import React, { useState } from "react";
import { useDayStore } from "../store/useDayStore";
import { getCalendarGrid, formatDateKey, parseDateKey, calculateStreaks } from "../lib/dateUtils";
import { format, addMonths, subMonths, isToday, isSameMonth, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export const MiniCalendar: React.FC = () => {
  const router = useRouter();
  const { activeDate, days, setActiveDate } = useDayStore();
  const activeParsed = parseDateKey(activeDate);

  const { streakDays } = calculateStreaks(days);

  const [currentMonth, setCurrentMonth] = useState<Date>(activeParsed);
  const grid = getCalendarGrid(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDayClick = (date: Date) => {
    const dateKey = formatDateKey(date);
    const todayKey = formatDateKey(new Date());

    if (dateKey !== todayKey) {
      // It's a past or future day, route to the subpage so it slides in
      router.push(`/day/${dateKey}`);
    } else {
      // It's today, make sure we go back to the home page (which is today's active editable view)
      setActiveDate(dateKey);
      router.push("/");
    }
  };

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="w-full bg-surface border border-border p-4 rounded select-none">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-display font-bold text-xs tracking-wider text-textPrimary uppercase">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-textMuted hover:text-accent transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 text-textMuted hover:text-accent transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="grid grid-cols-7 text-center mb-2">
        {weekdays.map((day, idx) => (
          <span
            key={idx}
            className="font-mono text-[9px] font-bold text-textMuted tracking-[0.1em]"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-mono">
        {grid.map((date, idx) => {
          const dateKey = formatDateKey(date);
          const hasHistory = !!days[dateKey];
          const isActDate = isSameDay(date, activeParsed);
          const isTod = isToday(date);
          const inMonth = isSameMonth(date, currentMonth);
          const isStreakDay = streakDays.includes(dateKey);

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(date)}
              disabled={!inMonth}
              className={`relative py-1.5 flex flex-col items-center justify-center transition-colors group ${
                inMonth ? "cursor-pointer text-textPrimary" : "text-border cursor-default"
              }`}
            >
              {/* Day Number Grid Box */}
              <span
                className={`w-6 h-6 flex items-center justify-center rounded transition-all ${
                  isActDate
                    ? "border border-accent text-accent font-bold"
                    : inMonth
                    ? "hover:bg-border/40 hover:text-accent"
                    : ""
                }`}
              >
                {format(date, "d")}
              </span>

              {/* Fire Emoji for active streak days */}
              {isStreakDay && inMonth && (
                <span className="absolute top-0 right-0 text-[9px] select-none leading-none animate-pulse">
                  🔥
                </span>
              )}

              {/* Dots Container */}
              <div className="h-1 flex items-center justify-center gap-0.5 mt-0.5">
                {/* Today Acid Lime Pulse Dot */}
                {isTod && (
                  <span className="w-1 h-1 rounded-full bg-accent relative calendar-today-ring" />
                )}
                {/* Saved History Magenta Dot */}
                {hasHistory && !isTod && (
                  <span className="w-1 h-1 rounded-full bg-accent2" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
