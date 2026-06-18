import React, { useState, useEffect } from "react";
import { useDayStore } from "../store/useDayStore";
import { motion, AnimatePresence } from "framer-motion";

interface ReflectionPanelProps {
  isReadOnly?: boolean;
}

export const ReflectionPanel: React.FC<ReflectionPanelProps> = ({ isReadOnly = false }) => {
  const { activeDate, days, setReflection } = useDayStore();
  const dayData = days[activeDate];
  const winVal = dayData?.reflection.win || "";
  const improveVal = dayData?.reflection.improve || "";

  const [win, setWin] = useState(winVal);
  const [improve, setImprove] = useState(improveVal);

  const [winFocused, setWinFocused] = useState(false);
  const [improveFocused, setImproveFocused] = useState(false);

  // Sync with store active date updates
  useEffect(() => {
    setWin(winVal);
    setImprove(improveVal);
  }, [winVal, improveVal, activeDate]);

  const handleWinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    setWin(e.target.value);
    setReflection({ win: e.target.value });
  };

  const handleImproveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    setImprove(e.target.value);
    setReflection({ improve: e.target.value });
  };

  return (
    <div className="w-full bg-surface border border-border p-4 rounded flex flex-col gap-4">
      {/* Title */}
      <h3 className="font-display font-bold text-[10px] tracking-[0.15em] text-textMuted uppercase border-b border-border pb-2 select-none">
        REFLECTION
      </h3>

      <div className="flex flex-col gap-4">
        {/* WIN */}
        <div className="flex flex-col gap-1.5 relative">
          <span className="font-mono text-[9px] text-textMuted tracking-wider uppercase select-none">
            01 / WIN
          </span>
          <div className="relative w-full h-8 flex items-center border border-border/80 px-3 rounded bg-bg/50">
            {/* Custom Floating Placeholder */}
            <AnimatePresence>
              {!win && !winFocused && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-3 font-sans text-xs text-textMuted pointer-events-none select-none"
                >
                  What was your biggest win today?
                </motion.span>
              )}
            </AnimatePresence>
            <input
              type="text"
              value={win}
              onChange={handleWinChange}
              onFocus={() => setWinFocused(true)}
              onBlur={() => setWinFocused(false)}
              disabled={isReadOnly}
              className="w-full bg-transparent border-none outline-none focus:outline-none font-sans text-xs text-textPrimary"
            />
          </div>
        </div>

        {/* IMPROVE */}
        <div className="flex flex-col gap-1.5 relative">
          <span className="font-mono text-[9px] text-textMuted tracking-wider uppercase select-none">
            02 / IMPROVE
          </span>
          <div className="relative w-full h-8 flex items-center border border-border/80 px-3 rounded bg-bg/50">
            {/* Custom Floating Placeholder */}
            <AnimatePresence>
              {!improve && !improveFocused && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-3 font-sans text-xs text-textMuted pointer-events-none select-none"
                >
                  How could you have optimized this day?
                </motion.span>
              )}
            </AnimatePresence>
            <input
              type="text"
              value={improve}
              onChange={handleImproveChange}
              onFocus={() => setImproveFocused(true)}
              onBlur={() => setImproveFocused(false)}
              disabled={isReadOnly}
              className="w-full bg-transparent border-none outline-none focus:outline-none font-sans text-xs text-textPrimary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
