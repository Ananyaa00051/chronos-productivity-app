"use client";

import React, { useState } from "react";
import { useDayStore } from "../store/useDayStore";
import { format, subDays, isToday } from "date-fns";
import { Flame, Check, BarChart2, TrendingUp } from "lucide-react";

interface PerformanceGraphsProps {
  days: Record<string, any>;
}

export const PerformanceGraphs: React.FC<PerformanceGraphsProps> = ({ days }) => {
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly">("weekly");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Helper: check if day has activity
  const isDateActive = (dateKey: string) => {
    const day = days[dateKey];
    if (!day) return false;
    const hasBlocks = day.blocks && day.blocks.length > 0;
    const hasNotes = day.notes && day.notes.trim() !== "" && day.notes !== "<p></p>" && day.notes !== "<p></p><p></p>";
    const hasMits = day.mits && day.mits.some((m: any) => m.text.trim() !== "");
    const hasMetrics = day.metrics && (day.metrics.focus > 0 || day.metrics.energy > 0 || day.metrics.mood > 0);
    const hasTasks = day.tasks && day.tasks.length > 0;
    return hasBlocks || hasNotes || hasMits || hasMetrics || hasTasks;
  };

  // Helper: calculate streak for a specific historical date
  const getStreakForDate = (date: Date) => {
    let count = 0;
    let check = date;
    let key = format(check, "yyyy-MM-dd");
    const todayKey = format(new Date(), "yyyy-MM-dd");

    // Carry over yesterday's streak for today if today isn't logged yet
    if (key === todayKey && !isDateActive(todayKey)) {
      const yesterdayKey = format(subDays(new Date(), 1), "yyyy-MM-dd");
      if (isDateActive(yesterdayKey)) {
        check = subDays(new Date(), 1);
        key = yesterdayKey;
      }
    }

    while (isDateActive(key)) {
      count++;
      check = subDays(check, 1);
      key = format(check, "yyyy-MM-dd");
    }
    return count;
  };

  // 1. Calculate Weekly Data (Last 7 Days)
  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const key = format(date, "yyyy-MM-dd");
    const label = format(date, "EEE").toUpperCase();
    const dayData = days[key];

    // Focus hours = work + study + gym + custom block durations
    const focusMins = dayData?.blocks?.reduce((acc: number, b: any) => {
      if (["work", "study", "gym", "custom"].includes(b.category)) {
        return acc + (b.durationMinutes || 0);
      }
      return acc;
    }, 0) || 0;
    const focusHours = Math.round((focusMins / 60) * 10) / 10;

    // Completed tasks = completed MITs + completed checklist tasks
    const completedMITs = dayData?.mits?.filter((m: any) => m.text.trim() !== "" && m.completed).length || 0;
    const completedTasks = dayData?.tasks?.filter((t: any) => t.completed).length || 0;
    const totalTasks = completedMITs + completedTasks;

    return {
      key,
      label,
      focusHours,
      totalTasks,
    };
  });

  // 2. Calculate Monthly Data (Last 30 Days)
  const monthlyData = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(new Date(), 29 - i);
    const key = format(date, "yyyy-MM-dd");
    const label = format(date, "d");
    const streak = getStreakForDate(date);

    return {
      key,
      label,
      date,
      streak,
    };
  });

  // SVG parameters
  const svgWidth = 270;
  const svgHeight = 120;
  const paddingLeft = 25;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 20;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Render Weekly SVG
  const renderWeeklyChart = () => {
    const maxHours = Math.max(...weeklyData.map(d => d.focusHours), 4);
    const maxTasks = Math.max(...weeklyData.map(d => d.totalTasks), 4);

    // Grid coordinates
    const barWidth = 14;
    const xStep = chartWidth / 6;

    // Build polyline points for tasks
    const taskPoints = weeklyData.map((d, i) => {
      const x = paddingLeft + i * xStep;
      const y = paddingTop + chartHeight - (d.totalTasks / maxTasks) * chartHeight;
      return { x, y };
    });

    const polylinePath = taskPoints.map(p => `${p.x},${p.y}`).join(" ");

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
          <defs>
            {/* Grid Line Filter */}
            <linearGradient id="weekly-bar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const hourLabel = Math.round((1 - ratio) * maxHours);
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  className="font-mono text-[7px] font-bold"
                >
                  {hourLabel}h
                </text>
              </g>
            );
          })}

          {/* Bars: Focus Hours */}
          {weeklyData.map((d, i) => {
            const x = paddingLeft + i * xStep;
            const barHeight = (d.focusHours / maxHours) * chartHeight;
            const y = paddingTop + chartHeight - barHeight;

            return (
              <g key={i}>
                <rect
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#weekly-bar-grad)"
                  className="stroke-accent stroke-[1] cursor-pointer hover:opacity-90 transition-opacity"
                  rx="1"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Line: Completed Tasks */}
          <polyline
            points={polylinePath}
            fill="none"
            stroke="var(--accent-2)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Nodes: Tasks */}
          {taskPoints.map((p, i) => {
            const d = weeklyData[i];
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4.5 : 3}
                  fill="var(--bg)"
                  stroke="var(--accent-2)"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* X Labels */}
          {weeklyData.map((d, i) => {
            const x = paddingLeft + i * xStep;
            const isTod = isToday(subDays(new Date(), 6 - i));
            return (
              <text
                key={i}
                x={x}
                y={svgHeight - 4}
                textAnchor="middle"
                fill={isTod ? "var(--accent)" : "var(--text-muted)"}
                className={`font-mono text-[8px] font-bold ${isTod ? "underline" : ""}`}
              >
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Weekly Tooltip */}
        {hoveredIndex !== null && (
          <div className="absolute top-0 right-0 bg-surface border border-border px-2.5 py-1.5 rounded font-mono text-[8px] flex flex-col gap-0.5 shadow-xl pointer-events-none select-none z-10">
            <span className="text-textPrimary font-bold">
              {format(subDays(new Date(), 6 - hoveredIndex), "MMM d").toUpperCase()}
            </span>
            <div className="flex items-center gap-1 text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Focus: {weeklyData[hoveredIndex].focusHours} hrs</span>
            </div>
            <div className="flex items-center gap-1 text-accent2">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Tasks: {weeklyData[hoveredIndex].totalTasks} completed</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Monthly SVG
  const renderMonthlyChart = () => {
    const maxStreak = Math.max(...monthlyData.map(d => d.streak), 4);
    const xStep = chartWidth / 29;

    // Generate path points
    const points = monthlyData.map((d, i) => {
      const x = paddingLeft + i * xStep;
      const y = paddingTop + chartHeight - (d.streak / maxStreak) * chartHeight;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    
    // Closed path for fill area
    const areaPath = `
      ${linePath} 
      L ${paddingLeft + 29 * xStep} ${paddingTop + chartHeight} 
      L ${paddingLeft} ${paddingTop + chartHeight} 
      Z
    `;

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
          <defs>
            {/* Glow Area Gradient */}
            <linearGradient id="monthly-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const streakLabel = Math.round((1 - ratio) * maxStreak);
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  className="font-mono text-[7px] font-bold"
                >
                  {streakLabel}d
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#monthly-area-grad)" />

          {/* Outline Line */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_0_2px_var(--accent)]"
          />

          {/* Interactive Invisible hover circles */}
          {points.map((p, i) => {
            const d = monthlyData[i];
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="var(--accent)"
                    className="filter drop-shadow-[0_0_3px_var(--accent)]"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* X labels (First and Last Date) */}
          <text
            x={paddingLeft}
            y={svgHeight - 4}
            textAnchor="start"
            fill="var(--text-muted)"
            className="font-mono text-[8px] font-bold"
          >
            {format(monthlyData[0].date, "MMM d").toUpperCase()}
          </text>

          <text
            x={svgWidth - paddingRight}
            y={svgHeight - 4}
            textAnchor="end"
            fill="var(--accent)"
            className="font-mono text-[8px] font-bold"
          >
            TODAY
          </text>
        </svg>

        {/* Monthly Tooltip */}
        {hoveredIndex !== null && (
          <div className="absolute top-0 right-0 bg-surface border border-border px-2.5 py-1.5 rounded font-mono text-[8px] flex flex-col gap-0.5 shadow-xl pointer-events-none select-none z-10">
            <span className="text-textPrimary font-bold">
              {format(monthlyData[hoveredIndex].date, "MMMM d, yyyy").toUpperCase()}
            </span>
            <div className="flex items-center gap-1 text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Streak: {monthlyData[hoveredIndex].streak} days</span>
            </div>
            <div className="flex items-center gap-1 text-textMuted">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Status: {isDateActive(format(monthlyData[hoveredIndex].date, "yyyy-MM-dd")) ? "Logged Active" : "No Activity"}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-surface border border-border p-4 rounded flex flex-col">
      {/* Header and Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-textPrimary">
          {activeTab === "weekly" ? <BarChart2 size={13} className="text-accent2" /> : <TrendingUp size={13} className="text-accent" />}
          <span className="font-mono text-[9px] font-bold tracking-wider uppercase">
            Performance Analytics
          </span>
        </div>

        {/* Toggle Pills */}
        <div className="flex bg-bg/50 border border-border p-0.5 rounded text-[8px] font-mono font-bold select-none">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-2 py-1 rounded-sm transition-all duration-200 ${
              activeTab === "weekly"
                ? "bg-accent text-bg"
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            WEEKLY
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-2 py-1 rounded-sm transition-all duration-200 ${
              activeTab === "monthly"
                ? "bg-accent text-bg"
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            MONTHLY
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div className="w-full flex items-center justify-center p-1 bg-bg/20 rounded border border-border/20">
        {activeTab === "weekly" ? renderWeeklyChart() : renderMonthlyChart()}
      </div>

      {/* Legend / Stats Summaries */}
      <div className="mt-3.5 pt-3 border-t border-border/30 flex justify-between font-mono text-[8px] text-textMuted">
        {activeTab === "weekly" ? (
          <>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-accent/30 border border-accent rounded-sm" />
              <span>Focus Hours (Bars)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-accent2 border-t border-dashed border-accent2" />
              <span>Completed Tasks (Line)</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-accent/20 border border-accent rounded-sm" />
              <span>Streak Progression Trend</span>
            </div>
            <span>30-Day Span</span>
          </>
        )}
      </div>
    </div>
  );
};
