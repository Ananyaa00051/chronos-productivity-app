import React, { useEffect, useState } from "react";
import { useDayStore } from "../store/useDayStore";
import { formatDateKey } from "../lib/dateUtils";
import { minutesToY, minutesToTimeStr } from "../lib/blockUtils";
import { motion } from "framer-motion";

export const NowLine: React.FC = () => {
  const { activeDate } = useDayStore();
  const [currentMinutes, setCurrentMinutes] = useState<number>(0);
  const isTodayActive = activeDate === formatDateKey(new Date());

  useEffect(() => {
    if (!isTodayActive) return;

    const updateTime = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      setCurrentMinutes(mins);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // update every 30s for accuracy

    return () => clearInterval(interval);
  }, [isTodayActive]);

  if (!isTodayActive) return null;

  const yPos = minutesToY(currentMinutes);

  return (
    <motion.div
      layoutId="now-line"
      style={{ top: `${yPos}px` }}
      className="absolute left-0 right-0 h-[2px] bg-accent z-30 pointer-events-none flex items-center now-line-glow"
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Glow node circle on the left edge */}
      <div className="w-2.5 h-2.5 rounded-full bg-accent -ml-1 flex-shrink-0" />
      
      {/* Tiny live time stamp */}
      <div className="absolute left-3 -top-4 bg-bg border border-accent/40 text-accent font-mono text-[8px] font-bold px-1 py-0.5 rounded leading-none">
        {minutesToTimeStr(currentMinutes)}
      </div>
    </motion.div>
  );
};
