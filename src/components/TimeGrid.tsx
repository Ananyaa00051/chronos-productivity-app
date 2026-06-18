import React, { useState } from "react";
import { DndContext, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useDayStore, TimeBlock as TimeBlockType } from "../store/useDayStore";
import { TimeBlock } from "./TimeBlock";
import { NowLine } from "./NowLine";
import { BlockPicker } from "./BlockPicker";
import { ROW_HEIGHT, PIXELS_PER_MINUTE, yToMinutes, snapTo15Mins, minutesToTimeStr } from "../lib/blockUtils";

interface TimeGridProps {
  isReadOnly?: boolean;
}

export const TimeGrid: React.FC<TimeGridProps> = ({ isReadOnly = false }) => {
  const { activeDate, days, addBlock, updateBlock, deleteBlock } = useDayStore();
  const dayData = days[activeDate];
  const blocks = dayData?.blocks || [];

  // Picker Popover State
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    startMinutes: number;
  } | null>(null);

  // Editing Block Modal State
  const [editingBlock, setEditingBlock] = useState<TimeBlockType | null>(null);

  // DnD Kit sensors configuration
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 4, // drag 4px to start
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // hold 200ms to start drag on touch
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    if (isReadOnly) return;
    const { active, delta } = event;
    const blockId = active.id as string;

    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    // Convert pixel delta Y to minutes delta
    const deltaMinutes = delta.y / PIXELS_PER_MINUTE;
    
    // Calculate new start position, snapped to 15-minute increments
    let newStart = snapTo15Mins(block.startMinutes + deltaMinutes);
    // Boundary checks (0 to 1440 - duration)
    newStart = Math.max(0, Math.min(1440 - block.durationMinutes, newStart));

    updateBlock(blockId, { startMinutes: newStart });
  };

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    
    // Ignore clicks on blocks, buttons, inputs or editors
    const target = e.target as HTMLElement;
    const isBlockClick = target.closest(".category-sleep, .category-work, .category-gym, .category-food, .category-leisure, .category-study, .category-custom") ||
                         target.closest("button") || 
                         target.closest("input") || 
                         target.closest(".ProseMirror");
    if (isBlockClick) return;

    // Calculate vertical offset relative to the timeline grid container
    const rect = e.currentTarget.getBoundingClientRect();
    const clickedY = e.clientY - rect.top;

    // Convert Y position to minutes and snap to 15 mins
    const rawMins = yToMinutes(clickedY);
    const clickedMinutes = Math.min(1380, snapTo15Mins(rawMins)); // max 11:00 PM start for 1-hour block

    // Open Picker popover
    setPickerState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      startMinutes: clickedMinutes,
    });
  };

  const handleCreateBlock = (
    title: string,
    category: "sleep" | "work" | "gym" | "food" | "leisure" | "study" | "custom",
    customColor?: string,
    categoryName?: string,
    startMinutes?: number,
    durationMinutes?: number
  ) => {
    if (!pickerState) return;

    const finalStart = startMinutes !== undefined ? startMinutes : pickerState.startMinutes;
    const finalDuration = durationMinutes !== undefined ? durationMinutes : 60;
    
    addBlock({
      title: title.trim() || `New ${category.charAt(0).toUpperCase() + category.slice(1)} Session`,
      category,
      customColor,
      categoryName,
      startMinutes: finalStart,
      durationMinutes: finalDuration,
    });

    setPickerState(null);
  };

  // Generate 24 hours labels
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="w-full relative select-none">
      <DndContext
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        {/* Scrollable Container */}
        <div className="w-full overflow-y-auto max-h-[calc(100vh-220px)] border border-border bg-surface rounded pr-1.5 relative">
          <div className="flex relative" style={{ height: `${24 * ROW_HEIGHT}px` }}>
            
            {/* Left Sticky Time Axis */}
            <div className="w-16 flex-shrink-0 border-r border-border/80 bg-surface/95 sticky left-0 z-30 font-mono text-[10px] text-textMuted text-right pr-3 pt-1 select-none">
              {hours.map((h) => {
                const ampm = h >= 12 ? "PM" : "AM";
                const displayH = h % 12 === 0 ? 12 : h % 12;
                return (
                  <div
                    key={h}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    className="flex items-start justify-end"
                  >
                    <span>{`${displayH} ${ampm}`}</span>
                  </div>
                );
              })}
            </div>

            {/* Main Interactive Grid Track */}
            <div
              onClick={handleGridClick}
              className="flex-grow relative grid-track cursor-cell"
            >
              {/* Hour Grid Lines */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    className="border-b border-border/30 hour-row flex flex-col justify-end"
                  >
                    {/* Dotted half-hour marker line */}
                    <div className="h-1/2 border-b border-dashed border-border/15 half-hour-row" />
                  </div>
                ))}
              </div>

              {/* Time Blocks Layer */}
              <div className="absolute inset-0 z-10 pl-2 pr-4">
                {blocks.map((block) => (
                  <TimeBlock
                    key={block.id}
                    block={block}
                    isReadOnly={isReadOnly}
                    onEditBlock={setEditingBlock}
                  />
                ))}
              </div>

              {/* Current Hour Pulse Line */}
              <NowLine />
            </div>

          </div>
        </div>
      </DndContext>

      {/* Floating Picker Popover Modal */}
      {pickerState && pickerState.isOpen && (
        <BlockPicker
          x={pickerState.x}
          y={pickerState.y}
          startMinutes={pickerState.startMinutes}
          onSelect={handleCreateBlock}
          onClose={() => setPickerState(null)}
        />
      )}

      {/* Editing Settings Modal */}
      {editingBlock && (
        <BlockPicker
          x={0}
          y={0}
          startMinutes={editingBlock.startMinutes}
          blockToEdit={editingBlock}
          onSelect={(title, category, customColor, categoryName, startMinutes, durationMinutes) => {
            updateBlock(editingBlock.id, {
              title,
              category,
              customColor,
              categoryName,
              startMinutes: startMinutes ?? editingBlock.startMinutes,
              durationMinutes: durationMinutes ?? editingBlock.durationMinutes,
            });
            setEditingBlock(null);
          }}
          onDelete={(blockId) => {
            deleteBlock(blockId);
            setEditingBlock(null);
          }}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
};
