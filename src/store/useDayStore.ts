import { create } from "zustand";
import { persist } from "zustand/middleware";
import { formatDateKey } from "../lib/dateUtils";

export interface TimeBlock {
  id: string;
  title: string;
  category: "sleep" | "work" | "gym" | "food" | "leisure" | "study" | "custom";
  categoryName?: string;
  customColor?: string;
  startMinutes: number; // minutes from midnight (0 - 1440)
  durationMinutes: number; // duration in minutes
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DayData {
  blocks: TimeBlock[];
  metrics: {
    focus: number; // 0 to 5
    energy: number; // 0 to 5
    mood: number; // 0 to 5
  };
  mits: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  notes: string;
  reflection: {
    win: string;
    improve: string;
  };
  tasks: TaskItem[];
}

interface DayStore {
  days: Record<string, DayData>;
  activeDate: string; // YYYY-MM-DD
  appStartDate: string | null; // YYYY-MM-DD
  isSaving: boolean;
  themeAccent: "lime" | "purple" | "cyan" | "magenta" | "orange" | "green";
  metricLabels: { focus: string; energy: string; mood: string };
  undoStack: Record<string, DayData[]>; // date keyed undo stacks
  
  // Actions
  init: () => void;
  setActiveDate: (dateKey: string) => void;
  createDayIfNotExist: (dateKey: string) => void;
  
  // Block Actions
  addBlock: (block: Omit<TimeBlock, "id">) => void;
  updateBlock: (blockId: string, updates: Partial<TimeBlock>) => void;
  deleteBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  
  // Sidebar Actions
  setMetrics: (metrics: Partial<DayData["metrics"]>) => void;
  setMITText: (index: number, text: string) => void;
  toggleMITCompleted: (index: number) => void;
  setNotes: (notes: string) => void;
  setReflection: (reflection: Partial<DayData["reflection"]>) => void;
  addTaskItem: (text: string) => void;
  setMetricLabel: (key: "focus" | "energy" | "mood", label: string) => void;
  toggleTaskItem: (taskId: string) => void;
  deleteTaskItem: (taskId: string) => void;
  setThemeAccent: (theme: "lime" | "purple" | "cyan" | "magenta" | "orange" | "green") => void;
  
  // Undo & UI
  pushUndo: (dateKey: string) => void;
  undo: () => void;
  triggerSaveIndicator: () => void;
}

const createBlankDay = (): DayData => ({
  blocks: [],
  metrics: { focus: 0, energy: 0, mood: 0 },
  mits: [
    { id: "mit-1", text: "", completed: false },
    { id: "mit-2", text: "", completed: false },
    { id: "mit-3", text: "", completed: false },
  ],
  notes: "",
  reflection: { win: "", improve: "" },
  tasks: [],
});

// Prepopulated standard day blocks for the very first load to demonstrate the design
const createDemoDay = (): DayData => ({
  blocks: [
    { id: "demo-1", title: "Restful Sleep", category: "sleep", startMinutes: 0, durationMinutes: 450 }, // 12:00 AM - 7:30 AM
    { id: "demo-2", title: "Morning Run & Breakfast", category: "gym", startMinutes: 480, durationMinutes: 90 }, // 8:00 AM - 9:30 AM
    { id: "demo-3", title: "Deep Work: Core Architecture", category: "work", startMinutes: 600, durationMinutes: 180 }, // 10:00 AM - 1:00 PM
    { id: "demo-4", title: "Lunch & Walk", category: "food", startMinutes: 780, durationMinutes: 60 }, // 1:00 PM - 2:00 PM
    { id: "demo-5", title: "Project Sync & Code Reviews", category: "work", startMinutes: 840, durationMinutes: 120 }, // 2:00 PM - 4:00 PM
    { id: "demo-6", title: "Study: Advanced Framer Motion", category: "study", startMinutes: 990, durationMinutes: 90 }, // 4:30 PM - 6:00 PM
    { id: "demo-7", title: "Dinner & Movie", category: "leisure", startMinutes: 1140, durationMinutes: 150 }, // 7:00 PM - 9:30 PM
  ],
  metrics: { focus: 4, energy: 3, mood: 5 },
  mits: [
    { id: "mit-1", text: "Complete Next.js routing", completed: true },
    { id: "mit-2", text: "Verify drag-resize snapping", completed: false },
    { id: "mit-3", text: "Polish neon pulse line CSS", completed: false },
  ],
  notes: "<p>Remember to check the custom 12-dot color picker for block customization.</p>",
  reflection: { win: "Extremely smooth drag interaction is working!", improve: "Ensure snapping transitions feel responsive." },
  tasks: [
    { id: "demo-t-1", text: "Drink 3L of water", completed: false },
    { id: "demo-t-2", text: "Commit recent planner updates to git", completed: true },
    { id: "demo-t-3", text: "Configure minimal background animations", completed: false },
  ],
});

let saveTimeout: NodeJS.Timeout | null = null;

export const useDayStore = create<DayStore>()(
  persist(
    (set, get) => ({
      days: {},
      activeDate: formatDateKey(new Date()),
      appStartDate: null,
      isSaving: false,
      themeAccent: "lime",
      metricLabels: { focus: "FOCUS", energy: "ENERGY", mood: "MOOD" },
      undoStack: {},

      init: () => {
        const today = formatDateKey(new Date());
        const state = get();
        let updatedDays = { ...state.days };
        let updatedStartDate = state.appStartDate;

        // If app hasn't been opened before, set start date to today
        if (!updatedStartDate) {
          updatedStartDate = today;
        }

        // Check if today exists, if not initialize it
        if (!updatedDays[today]) {
          // If this is the absolute first day (no days recorded at all), give them the demo day!
          const isBrandNewApp = Object.keys(updatedDays).length === 0;
          updatedDays[today] = isBrandNewApp ? createDemoDay() : createBlankDay();
        }

        set({
          days: updatedDays,
          activeDate: today,
          appStartDate: updatedStartDate,
        });
      },

      setActiveDate: (dateKey) => {
        const state = get();
        state.createDayIfNotExist(dateKey);
        set({ activeDate: dateKey });
      },

      createDayIfNotExist: (dateKey) => {
        const state = get();
        if (!state.days[dateKey]) {
          set((prev) => ({
            days: {
              ...prev.days,
              [dateKey]: createBlankDay(),
            },
          }));
        }
      },

      pushUndo: (dateKey) => {
        const state = get();
        const currentDayData = state.days[dateKey];
        if (!currentDayData) return;

        // Deep copy of day data
        const dayCopy = JSON.parse(JSON.stringify(currentDayData)) as DayData;
        const history = state.undoStack[dateKey] || [];
        
        // Limit undo stack size to 20 to preserve memory
        const newHistory = [...history, dayCopy].slice(-20);

        set((prev) => ({
          undoStack: {
            ...prev.undoStack,
            [dateKey]: newHistory,
          },
        }));
      },

      undo: () => {
        const state = get();
        const dateKey = state.activeDate;
        const history = state.undoStack[dateKey] || [];

        if (history.length === 0) return; // nothing to undo

        const previousDayData = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        set((prev) => ({
          days: {
            ...prev.days,
            [dateKey]: previousDayData,
          },
          undoStack: {
            ...prev.undoStack,
            [dateKey]: newHistory,
          },
        }));

        state.triggerSaveIndicator();
      },

      triggerSaveIndicator: () => {
        set({ isSaving: true });
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          set({ isSaving: false });
        }, 1500);
      },

      // Block Actions
      addBlock: (block) => {
        const state = get();
        const dateKey = state.activeDate;
        state.pushUndo(dateKey);

        const newBlock: TimeBlock = {
          ...block,
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        set((prev) => {
          const day = prev.days[dateKey] || createBlankDay();
          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                blocks: [...day.blocks, newBlock],
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      updateBlock: (blockId, updates) => {
        const state = get();
        const dateKey = state.activeDate;
        state.pushUndo(dateKey);

        set((prev) => {
          const day = prev.days[dateKey];
          if (!day) return {};
          
          const updatedBlocks = day.blocks.map((block) => {
            if (block.id === blockId) {
              return { ...block, ...updates };
            }
            return block;
          });

          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                blocks: updatedBlocks,
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      deleteBlock: (blockId) => {
        const state = get();
        const dateKey = state.activeDate;
        state.pushUndo(dateKey);

        set((prev) => {
          const day = prev.days[dateKey];
          if (!day) return {};

          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                blocks: day.blocks.filter((b) => b.id !== blockId),
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      duplicateBlock: (blockId) => {
        const state = get();
        const dateKey = state.activeDate;
        const day = state.days[dateKey];
        if (!day) return;

        const target = day.blocks.find((b) => b.id === blockId);
        if (!target) return;

        state.pushUndo(dateKey);

        // Position the duplicated block right after the target block
        let newStart = target.startMinutes + target.durationMinutes;
        if (newStart >= 1440) {
          newStart = 0; // Wrap around if overflows day
        }

        const duplicate: TimeBlock = {
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: `${target.title} (Copy)`,
          category: target.category,
          customColor: target.customColor,
          startMinutes: newStart,
          durationMinutes: target.durationMinutes,
        };

        set((prev) => ({
          days: {
            ...prev.days,
            [dateKey]: {
              ...day,
              blocks: [...day.blocks, duplicate],
            },
          },
        }));

        state.triggerSaveIndicator();
      },

      // Sidebar Actions
      setMetrics: (metrics) => {
        const state = get();
        const dateKey = state.activeDate;

        set((prev) => {
          const day = prev.days[dateKey] || createBlankDay();
          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                metrics: { ...day.metrics, ...metrics },
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      setMITText: (index, text) => {
        const state = get();
        const dateKey = state.activeDate;

        set((prev) => {
          const day = prev.days[dateKey] || createBlankDay();
          const newMITS = [...day.mits];
          if (newMITS[index]) {
            newMITS[index] = { ...newMITS[index], text };
          }
          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                mits: newMITS,
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      toggleMITCompleted: (index) => {
        const state = get();
        const dateKey = state.activeDate;

        set((prev) => {
          const day = prev.days[dateKey] || createBlankDay();
          const newMITS = [...day.mits];
          if (newMITS[index]) {
            newMITS[index] = { ...newMITS[index], completed: !newMITS[index].completed };
          }
          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                mits: newMITS,
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      setNotes: (notes) => {
        const state = get();
        const dateKey = state.activeDate;

        set((prev) => {
          const day = prev.days[dateKey] || createBlankDay();
          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                notes,
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      setReflection: (reflection) => {
        const state = get();
        const dateKey = state.activeDate;

        set((prev) => {
          const day = prev.days[dateKey] || createBlankDay();
          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                reflection: { ...day.reflection, ...reflection },
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      addTaskItem: (text) => {
        const state = get();
        const dateKey = state.activeDate;
        state.pushUndo(dateKey);

        const newItem = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text,
          completed: false,
        };

        set((prev) => {
          const day = prev.days[dateKey] || createBlankDay();
          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                tasks: [...(day.tasks || []), newItem],
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      toggleTaskItem: (taskId) => {
        const state = get();
        const dateKey = state.activeDate;

        set((prev) => {
          const day = prev.days[dateKey];
          if (!day) return {};
          const updatedTasks = (day.tasks || []).map((t) => {
            if (t.id === taskId) {
              return { ...t, completed: !t.completed };
            }
            return t;
          });
          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                tasks: updatedTasks,
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      deleteTaskItem: (taskId) => {
        const state = get();
        const dateKey = state.activeDate;
        state.pushUndo(dateKey);

        set((prev) => {
          const day = prev.days[dateKey];
          if (!day) return {};
          return {
            days: {
              ...prev.days,
              [dateKey]: {
                ...day,
                tasks: (day.tasks || []).filter((t) => t.id !== taskId),
              },
            },
          };
        });

        state.triggerSaveIndicator();
      },

      setThemeAccent: (theme) => {
        set({ themeAccent: theme });
      },

      setMetricLabel: (key, label) => {
        set((prev) => ({
          metricLabels: {
            ...prev.metricLabels,
            [key]: label,
          },
        }));
      },
    }),
    {
      name: "chronos-day-store",
      // Exclude saving indicators and undo stack from local storage persistence
      partialize: (state) => {
        const { isSaving, undoStack, ...rest } = state;
        return rest;
      },
    }
  )
);
