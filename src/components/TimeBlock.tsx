import React, { useState, useEffect, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useDayStore, TimeBlock as TimeBlockType } from "../store/useDayStore";
import { minutesToTimeStr, durationToLabel, ROW_HEIGHT, PIXELS_PER_MINUTE, snapTo15Mins } from "../lib/blockUtils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { GripVertical, MoreVertical, Trash2, Copy, Palette, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TimeBlockProps {
  block: TimeBlockType;
  isReadOnly?: boolean;
  onEditBlock?: (block: TimeBlockType) => void;
}

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

export const TimeBlock: React.FC<TimeBlockProps> = ({ block, isReadOnly = false, onEditBlock }) => {
  const { updateBlock, deleteBlock, duplicateBlock } = useDayStore();
  const [localDuration, setLocalDuration] = useState(block.durationMinutes);
  const [isResizing, setIsResizing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);

  // Sync local duration when block duration changes in store
  useEffect(() => {
    if (!isResizing) {
      setLocalDuration(block.durationMinutes);
    }
  }, [block.durationMinutes, isResizing]);

  // Set up rich-text inline editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-accent underline cursor-pointer",
        },
      }),
    ],
    content: block.title,
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      updateBlock(block.id, { title: editor.getHTML() });
    },
  });

  // Sync editor content with block updates
  useEffect(() => {
    if (editor && editor.getHTML() !== block.title) {
      editor.commands.setContent(block.title);
    }
  }, [block.title, editor]);

  // Sync editor editability
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  // Context Menu handlers
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowColorPicker(false);
  };

  // Close context menu on outside clicks
  useEffect(() => {
    const closeMenu = () => {
      setShowMenu(false);
      setShowColorPicker(false);
    };
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  // Drag handles (dnd-kit)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    disabled: isReadOnly || isResizing,
  });

  // Resize Handler (Pointer events)
  const handleResizeStart = (e: React.PointerEvent) => {
    if (isReadOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const startY = e.clientY;
    const startDuration = block.durationMinutes;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaMinutes = deltaY / PIXELS_PER_MINUTE;
      // Snap to 15 mins grid, minimum 15 mins duration, maximum that fits in the day
      const newDuration = Math.max(15, snapTo15Mins(startDuration + deltaMinutes));
      const maxRemaining = 1440 - block.startMinutes;
      const cappedDuration = Math.min(maxRemaining, newDuration);
      
      setLocalDuration(cappedDuration);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      // Final write to Zustand store
      updateBlock(block.id, { durationMinutes: localDuration });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const yPos = block.startMinutes * PIXELS_PER_MINUTE;
  const height = localDuration * PIXELS_PER_MINUTE;

  const dragStyle = transform
    ? {
        transform: `translate3d(0, ${transform.y}px, 0)`,
      }
    : undefined;

  const style: React.CSSProperties = {
    top: `${yPos}px`,
    height: `${height}px`,
    zIndex: isDragging || isResizing ? 40 : 10,
    borderLeftColor: block.category === "custom" && block.customColor ? block.customColor : undefined,
    touchAction: "none",
    ...dragStyle,
  };

  // Determine category border/bg classes
  const getCategoryClass = () => {
    if (block.category === "custom") return "category-custom";
    return `category-${block.category}`;
  };

  const getCustomColorBg = () => {
    if (block.category === "custom" && block.customColor) {
      // Apply alpha opacity for background
      return `${block.customColor}1E`; // hex + opacity
    }
    return undefined;
  };

  const endMinutes = block.startMinutes + localDuration;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onContextMenu={handleContextMenu}
        onDoubleClick={() => !isReadOnly && onEditBlock?.(block)}
        className={`absolute left-0 right-0 border-l-[4px] border-y border-r border-border hover:border-border/80 rounded flex flex-col justify-between p-3 select-none overflow-hidden group transition-shadow ${getCategoryClass()} ${
          isDragging ? "shadow-2xl scale-[1.02] opacity-80 cursor-grabbing" : ""
        } ${isResizing ? "shadow-lg cursor-ns-resize border-accent" : ""}`}
      >
        <div className="flex flex-col gap-1 h-full overflow-hidden">
          {/* Top Row: Drag handle, title/editor, and duration */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-grow overflow-hidden">
              {/* Drag Handle Icon (lucide) */}
              {!isReadOnly && (
                <div
                  {...attributes}
                  {...listeners}
                  className="mt-0.5 text-textMuted hover:text-accent cursor-grab active:cursor-grabbing flex-shrink-0"
                >
                  <GripVertical size={13} />
                </div>
              )}

              {/* Tiptap Inline Title Editor */}
              <div className="flex-grow flex flex-col overflow-hidden">
                <span 
                  className="font-mono text-[8px] tracking-widest leading-none uppercase mb-1 block"
                  style={{ color: block.category === "custom" && block.customColor ? block.customColor : "var(--accent)" }}
                >
                  {block.category === "custom" ? block.categoryName || "CUSTOM" : block.category}
                </span>
                <div className="font-display font-semibold text-[13px] text-textPrimary leading-tight overflow-hidden">
                  {editor ? (
                    <EditorContent editor={editor} className="w-full focus:outline-none" />
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: block.title }} />
                  )}
                </div>
              </div>
            </div>

            {/* Duration and Menu trigger */}
            <div className="flex items-center gap-1.5 flex-shrink-0 select-none">
              <span className="font-mono text-[9px] text-textMuted uppercase">
                {durationToLabel(localDuration)}
              </span>
              {!isReadOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-textMuted hover:text-textPrimary transition-opacity"
                >
                  <MoreVertical size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Time range labels (IBM Plex Mono) */}
          <div className="font-mono text-[10px] text-textMuted mt-1">
            {minutesToTimeStr(block.startMinutes)} – {minutesToTimeStr(endMinutes)}
          </div>
        </div>

        {/* Bottom Resize Grip */}
        {!isReadOnly && (
          <div
            onPointerDown={handleResizeStart}
            className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize bg-transparent hover:bg-accent/20 flex items-center justify-center transition-colors"
          />
        )}
      </div>

      {/* Floating Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <div className="fixed inset-0 z-50 pointer-events-auto">
            <div className="absolute inset-0" onClick={() => setShowMenu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              style={{ top: `${menuPos.y}px`, left: `${menuPos.x}px` }}
              className="absolute bg-surface border border-border rounded p-1 shadow-2xl min-w-[130px] font-mono text-[9px] tracking-wider uppercase text-textPrimary select-none z-50"
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEditBlock?.(block);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-border/50 hover:text-accent flex items-center gap-2 rounded transition-colors"
              >
                <Sparkles size={11} /> Block Settings
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  editor?.commands.focus();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-border/50 hover:text-accent flex items-center gap-2 rounded transition-colors"
              >
                <Sparkles size={11} /> Edit Text Inline
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  duplicateBlock(block.id);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-border/50 hover:text-accent flex items-center gap-2 rounded transition-colors"
              >
                <Copy size={11} /> Duplicate
              </button>
              
              {/* Color Customizer */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-border/50 hover:text-accent flex items-center justify-between rounded transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Palette size={11} /> Color
                  </span>
                  <span>▶</span>
                </button>

                {/* Sub Color Picker */}
                {showColorPicker && (
                  <div className="absolute left-[125px] -top-1 bg-surface border border-border p-2 rounded shadow-2xl grid grid-cols-4 gap-1.5 min-w-[100px]">
                    {CUSTOM_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          updateBlock(block.id, { category: "custom", customColor: color });
                          setShowMenu(false);
                          setShowColorPicker(false);
                        }}
                        className="w-4 h-4 rounded-full border border-black hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-border my-1" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  deleteBlock(block.id);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 hover:text-red-400 flex items-center gap-2 rounded transition-colors text-red-500"
              >
                <Trash2 size={11} /> Delete
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
