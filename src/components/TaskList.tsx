import React, { useState } from "react";
import { useDayStore } from "../store/useDayStore";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

interface TaskListProps {
  isReadOnly?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ isReadOnly = false }) => {
  const { activeDate, days, addTaskItem, toggleTaskItem, deleteTaskItem } = useDayStore();
  const dayData = days[activeDate];
  const tasks = dayData?.tasks || [];

  const [input, setInput] = useState("");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isReadOnly) return;
    addTaskItem(input.trim());
    setInput("");
  };

  return (
    <div className="w-full bg-surface border border-border p-4 rounded flex flex-col gap-4">
      {/* Title */}
      <h3 className="font-display font-bold text-[10px] tracking-[0.15em] text-textMuted uppercase border-b border-border pb-2 select-none">
        DAILY TASKS
      </h3>

      {/* Task Input (only in read-write mode) */}
      {!isReadOnly && (
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add new task..."
            className="flex-grow bg-bg border border-border px-3 py-1.5 rounded font-sans text-xs text-textPrimary placeholder-textMuted/60 focus:border-accent focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-accent text-bg hover:opacity-90 transition-opacity rounded flex items-center justify-center flex-shrink-0"
          >
            <Plus size={14} className="stroke-[3]" />
          </button>
        </form>
      )}

      {/* Tasks List */}
      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center justify-between gap-3 group/item py-1"
            >
              <div className="flex items-center gap-3 relative flex-grow min-w-0">
                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => !isReadOnly && toggleTaskItem(task.id)}
                  disabled={isReadOnly}
                  className={`w-4 h-4 border flex items-center justify-center relative focus:outline-none flex-shrink-0 transition-colors duration-200 ${
                    task.completed
                      ? "border-accent"
                      : "border-border hover:border-textMuted"
                  } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
                >
                  {task.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-accent"
                    />
                  )}
                </button>

                {/* Task Text with inline strikethrough */}
                <div className="relative flex-grow min-w-0 flex items-center">
                  <span
                    className={`font-sans text-xs text-textPrimary select-none truncate transition-opacity duration-200 ${
                      task.completed ? "opacity-45" : "opacity-100"
                    }`}
                  >
                    {task.text}
                  </span>
                  
                  {/* Strikethrough Animation */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: task.completed ? 1 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="absolute left-0 right-0 h-px bg-textMuted origin-left pointer-events-none"
                  />
                </div>
              </div>

              {/* Delete Action (only in read-write mode) */}
              {!isReadOnly && (
                <button
                  onClick={() => deleteTaskItem(task.id)}
                  className="opacity-0 group-hover/item:opacity-100 text-textMuted hover:text-red-400 transition-opacity p-0.5 flex-shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <span className="font-mono text-[9px] text-textMuted py-4 text-center select-none">
            NO TASKS RECORDED FOR THIS DAY
          </span>
        )}
      </div>
    </div>
  );
};
