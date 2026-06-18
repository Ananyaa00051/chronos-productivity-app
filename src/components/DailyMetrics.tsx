import React, { useState } from "react";
import { useDayStore } from "../store/useDayStore";
import { motion } from "framer-motion";
import { Edit2 } from "lucide-react";

interface DailyMetricsProps {
  isReadOnly?: boolean;
}

export const DailyMetrics: React.FC<DailyMetricsProps> = ({ isReadOnly = false }) => {
  const { activeDate, days, setMetrics, metricLabels, setMetricLabel } = useDayStore();
  const dayData = days[activeDate];

  const focus = dayData?.metrics.focus || 0;
  const energy = dayData?.metrics.energy || 0;
  const mood = dayData?.metrics.mood || 0;

  // Inline label editing states
  const [editingKey, setEditingKey] = useState<"focus" | "energy" | "mood" | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const labels = metricLabels || { focus: "FOCUS", energy: "ENERGY", mood: "MOOD" };

  const handleMetricClick = (type: "focus" | "energy" | "mood", val: number) => {
    if (isReadOnly) return;
    const currentVal = type === "focus" ? focus : type === "energy" ? energy : mood;
    const newVal = currentVal === val ? val - 1 : val;
    setMetrics({ [type]: Math.max(0, newVal) });
  };

  const startEditingLabel = (key: "focus" | "energy" | "mood") => {
    if (isReadOnly) return;
    setEditingKey(key);
    setEditingValue(labels[key] || "");
  };

  const saveLabel = () => {
    if (editingKey) {
      const finalVal = editingValue.trim().toUpperCase() || 
        (editingKey === "focus" ? "FOCUS" : editingKey === "energy" ? "ENERGY" : "MOOD");
      setMetricLabel(editingKey, finalVal);
    }
    setEditingKey(null);
  };

  const renderLabel = (key: "focus" | "energy" | "mood") => {
    const isEditing = editingKey === key;
    const labelText = labels[key] || key.toUpperCase();

    if (isEditing) {
      return (
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={saveLabel}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveLabel();
          }}
          className="bg-transparent border-b border-accent text-[10px] w-20 outline-none uppercase font-mono text-accent"
          autoFocus
        />
      );
    }

    return (
      <span
        onClick={() => startEditingLabel(key)}
        className={`flex items-center gap-1 hover:text-accent font-mono text-[10px] tracking-wider transition-colors ${
          isReadOnly ? "cursor-default" : "cursor-pointer"
        }`}
        title={isReadOnly ? "" : "Click to edit metric label"}
      >
        {labelText}
        {!isReadOnly && (
          <Edit2 size={8} className="opacity-0 group-hover:opacity-60 transition-opacity" />
        )}
      </span>
    );
  };

  const renderCheckboxes = (type: "focus" | "energy" | "mood", currentValue: number) => {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((val) => {
          const isFilled = val <= currentValue;
          return (
            <button
              key={val}
              onClick={() => handleMetricClick(type, val)}
              disabled={isReadOnly}
              className={`w-4 h-4 border transition-colors duration-200 relative focus:outline-none ${
                isFilled
                  ? "border-accent"
                  : "border-border hover:border-textMuted"
              } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
            >
              {isFilled && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute inset-0.5 bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full bg-surface border border-border p-4 rounded select-none flex flex-col gap-4">
      {/* Title */}
      <h3 className="font-display font-bold text-[10px] tracking-[0.15em] text-textMuted uppercase border-b border-border pb-2">
        DAILY METRICS
      </h3>

      <div className="flex flex-col gap-3 text-textPrimary">
        {/* Focus */}
        <div className="flex items-center justify-between group h-6">
          {renderLabel("focus")}
          {renderCheckboxes("focus", focus)}
        </div>

        {/* Energy */}
        <div className="flex items-center justify-between group h-6">
          {renderLabel("energy")}
          {renderCheckboxes("energy", energy)}
        </div>

        {/* Mood */}
        <div className="flex items-center justify-between group h-6">
          {renderLabel("mood")}
          {renderCheckboxes("mood", mood)}
        </div>
      </div>
    </div>
  );
};
