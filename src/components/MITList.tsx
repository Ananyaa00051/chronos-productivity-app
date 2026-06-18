import React, { useState } from "react";
import { useDayStore } from "../store/useDayStore";
import { motion, AnimatePresence } from "framer-motion";

interface MITListProps {
  isReadOnly?: boolean;
}

export const MITList: React.FC<MITListProps> = ({ isReadOnly = false }) => {
  const { activeDate, days, setMITText, toggleMITCompleted } = useDayStore();
  const dayData = days[activeDate];
  const mits = dayData?.mits || [
    { id: "mit-1", text: "", completed: false },
    { id: "mit-2", text: "", completed: false },
    { id: "mit-3", text: "", completed: false },
  ];

  // Store shaking index states
  const [shakingIdx, setShakingIdx] = useState<number | null>(null);

  const handleCheckboxClick = (index: number) => {
    if (isReadOnly) return;
    const mit = mits[index];
    
    // Shake if trying to check an empty MIT
    if (!mit.text.trim()) {
      setShakingIdx(index);
      setTimeout(() => setShakingIdx(null), 300);
      return;
    }
    
    toggleMITCompleted(index);
  };

  const handleTextChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    setMITText(index, e.target.value);
  };

  return (
    <div className="w-full bg-surface border border-border p-4 rounded flex flex-col gap-4">
      {/* Title */}
      <h3 className="font-display font-bold text-[10px] tracking-[0.15em] text-textMuted uppercase border-b border-border pb-2 select-none">
        TOP 3 MITs
      </h3>

      <div className="flex flex-col gap-4">
        {mits.map((mit, index) => {
          const numStr = (index + 1).toString().padStart(2, "0");
          const isShaking = shakingIdx === index;

          return (
            <motion.div
              key={mit.id || index}
              animate={isShaking ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 relative"
            >
              {/* Index Number */}
              <span className="font-mono text-[10px] text-textMuted select-none">
                {numStr}
              </span>

              {/* Custom Checkbox */}
              <button
                onClick={() => handleCheckboxClick(index)}
                disabled={isReadOnly}
                className={`w-4 h-4 border flex items-center justify-center relative focus:outline-none flex-shrink-0 transition-colors duration-200 ${
                  mit.completed
                    ? "border-accent"
                    : "border-border hover:border-textMuted"
                } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
              >
                {mit.completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-accent"
                  />
                )}
              </button>

              {/* Text Input with Inline Strikethrough Animation */}
              <div className="relative flex-grow h-6 flex items-center">
                <input
                  type="text"
                  value={mit.text}
                  onChange={(e) => handleTextChange(index, e)}
                  disabled={isReadOnly || mit.completed}
                  placeholder={`Task ${index + 1}...`}
                  className={`w-full bg-transparent border-none focus:outline-none font-sans text-xs text-textPrimary placeholder-textMuted/60 transition-opacity duration-200 ${
                    mit.completed ? "opacity-40" : "opacity-100"
                  }`}
                />
                
                {/* Horizontal Strikethrough Line Overlay */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: mit.completed ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-px bg-textMuted origin-left pointer-events-none"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
