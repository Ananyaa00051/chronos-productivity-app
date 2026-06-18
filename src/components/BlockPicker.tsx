import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { 
  minutesToTimeStr, 
  minutesToTimeInputVal, 
  timeInputValToMinutes 
} from "../lib/blockUtils";

interface BlockPickerProps {
  x: number;
  y: number;
  startMinutes: number;
  blockToEdit?: {
    id: string;
    title: string;
    category: "sleep" | "work" | "gym" | "food" | "leisure" | "study" | "custom";
    categoryName?: string;
    customColor?: string;
    startMinutes: number;
    durationMinutes: number;
  };
  onSelect: (
    title: string,
    category: "sleep" | "work" | "gym" | "food" | "leisure" | "study" | "custom",
    customColor?: string,
    categoryName?: string,
    startMinutes?: number,
    durationMinutes?: number
  ) => void;
  onDelete?: (blockId: string) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "sleep", label: "Sleep", color: "#6C63FF" },
  { value: "work", label: "Work", color: "#00D4FF" },
  { value: "gym", label: "Gym", color: "#FFD700" },
  { value: "food", label: "Food", color: "#FF6B35" },
  { value: "leisure", label: "Leisure", color: "#39FF14" },
  { value: "study", label: "Study", color: "#BF5FFF" },
  { value: "custom", label: "Custom", color: "#A0A0A0" },
] as const;

const CUSTOM_COLORS = [
  "#6C63FF", // Indigo
  "#00D4FF", // Electric Blue
  "#FFD700", // Gold
  "#FF6B35", // Orange
  "#39FF14", // Neon Green
  "#BF5FFF", // Violet
  "#C8FF00", // Acid Lime
  "#FF3CAC", // Magenta
  "#FF3C3C", // Crimson Red
  "#00F5D4", // Teal
  "#FFB7C5", // Soft Pink
  "#FF9F1C", // Warm Amber
];

export const BlockPicker: React.FC<BlockPickerProps> = ({
  x,
  y,
  startMinutes,
  blockToEdit,
  onSelect,
  onDelete,
  onClose,
}) => {
  const isEditMode = !!blockToEdit;

  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "sleep" | "work" | "gym" | "food" | "leisure" | "study" | "custom"
  >("work");
  const [categoryName, setCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(CUSTOM_COLORS[0]);

  // Start and End Time strings
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endTimeStr, setEndTimeStr] = useState("");

  // Initialize values
  useEffect(() => {
    if (blockToEdit) {
      setTitle(blockToEdit.title.replace(/<\/?[^>]+(>|$)/g, "")); // strip HTML for input field
      setSelectedCategory(blockToEdit.category);
      setCategoryName(blockToEdit.categoryName || "");
      setSelectedColor(blockToEdit.customColor || CUSTOM_COLORS[0]);
      setStartTimeStr(minutesToTimeInputVal(blockToEdit.startMinutes));
      setEndTimeStr(minutesToTimeInputVal(blockToEdit.startMinutes + blockToEdit.durationMinutes));
    } else {
      setTitle("Work Session");
      setSelectedCategory("work");
      setCategoryName("");
      setSelectedColor(CUSTOM_COLORS[0]);
      setStartTimeStr(minutesToTimeInputVal(startMinutes));
      setEndTimeStr(minutesToTimeInputVal(startMinutes + 60)); // 1 hour default
    }
  }, [blockToEdit, startMinutes]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleCategorySelect = (cat: typeof CATEGORIES[number]["value"]) => {
    setSelectedCategory(cat);
    
    // Auto-update title if empty or template-matched
    const defaultRegex = /^(Sleep|Work|Gym|Food|Leisure|Study|Custom|[\w\s]+)\sSession$/i;
    if (!title.trim() || defaultRegex.test(title.trim())) {
      const displayCat = cat === "custom" && categoryName.trim() 
        ? categoryName 
        : cat.charAt(0).toUpperCase() + cat.slice(1);
      setTitle(`${displayCat} Session`);
    }
  };

  const handleConfirm = () => {
    const startMins = timeInputValToMinutes(startTimeStr);
    let endMins = timeInputValToMinutes(endTimeStr);

    // If end time is before start time, assume next-day rollover or snap to start + 15 mins
    if (endMins <= startMins) {
      endMins = Math.min(1440, startMins + 15);
    }

    const duration = endMins - startMins;

    onSelect(
      title.trim() || `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Session`,
      selectedCategory,
      selectedCategory === "custom" ? selectedColor : undefined,
      selectedCategory === "custom" ? categoryName.trim() || "Custom" : undefined,
      startMins,
      duration
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Popover Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-[340px] bg-surface border border-border p-5 rounded relative shadow-2xl z-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-textMuted hover:text-textPrimary transition-colors"
        >
          <X size={14} />
        </button>

        {/* Header Title */}
        <div className="mb-4">
          <span className="font-mono text-[9px] text-accent tracking-widest uppercase">
            {isEditMode ? "Edit Block Settings" : "Create Block At"}
          </span>
          <h4 className="font-display font-bold text-lg text-textPrimary leading-none mt-1">
            {isEditMode ? "Block Settings" : minutesToTimeStr(startMinutes)}
          </h4>
        </div>

        {/* Title Input */}
        <div className="flex flex-col gap-1.5 mb-4">
          <span className="font-mono text-[9px] text-textMuted tracking-wider uppercase">
            Block Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter session details..."
            className="w-full bg-bg border border-border px-3 py-2 rounded font-sans text-xs text-textPrimary focus:border-accent focus:outline-none transition-colors"
            autoFocus={!isEditMode}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
            }}
          />
        </div>

        {/* Time Inputs (Time Editor) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-textMuted tracking-wider uppercase">
              Start Time
            </span>
            <input
              type="time"
              value={startTimeStr}
              onChange={(e) => setStartTimeStr(e.target.value)}
              className="bg-bg border border-border px-2 py-1.5 rounded font-mono text-xs text-textPrimary focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-textMuted tracking-wider uppercase">
              End Time
            </span>
            <input
              type="time"
              value={endTimeStr}
              onChange={(e) => setEndTimeStr(e.target.value)}
              className="bg-bg border border-border px-2 py-1.5 rounded font-mono text-xs text-textPrimary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Category Selection Grid */}
        <div className="flex flex-col gap-3">
          <span className="font-mono text-[9px] text-textMuted tracking-wider uppercase">
            Select Category
          </span>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`flex items-center gap-2.5 p-2 bg-bg border rounded transition-all text-left font-mono text-[10px] text-textPrimary ${
                    isSelected ? "border-accent bg-border/40" : "border-border hover:border-textMuted"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Category Input & Color Picker */}
        <AnimatePresence>
          {selectedCategory === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-3 mt-4 pt-3 border-t border-border overflow-hidden"
            >
              {/* Custom Category Name Input */}
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] text-textMuted tracking-wider uppercase">
                  Custom Category Name
                </span>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Gaming, Side Project"
                  className="w-full bg-bg border border-border px-3 py-1.5 rounded font-sans text-xs text-textPrimary focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {/* Color Grid */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] text-textMuted tracking-wider uppercase">
                  Choose Color
                </span>
                <div className="grid grid-cols-6 gap-2">
                  {CUSTOM_COLORS.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className="w-6 h-6 rounded-full flex items-center justify-center focus:outline-none border border-black/40 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      >
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full border border-bg bg-transparent" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions Button Panel */}
        <div className="flex items-center gap-2 mt-6">
          {isEditMode && onDelete && (
            <button
              onClick={() => {
                onDelete(blockToEdit.id);
                onClose();
              }}
              className="px-3 py-2.5 border border-red-500/40 hover:border-red-500 text-red-500 bg-red-950/10 hover:bg-red-950/20 rounded font-mono text-[10px] tracking-wider transition-all uppercase flex items-center justify-center gap-1.5 flex-shrink-0"
              title="Delete Block"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="flex-grow py-2.5 bg-accent text-bg font-bold font-mono text-[10px] tracking-wider rounded hover:opacity-90 transition-all uppercase"
          >
            {isEditMode ? "Save Changes" : "Create Block"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
