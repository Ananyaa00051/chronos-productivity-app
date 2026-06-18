import { 
  format, 
  parse, 
  differenceInDays, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  subDays
} from "date-fns";

export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date {
  return parse(key, "yyyy-MM-dd", new Date());
}

export function getDaysDifference(startKey: string, currentKey: string): number {
  try {
    const start = parseDateKey(startKey);
    const current = parseDateKey(currentKey);
    return differenceInDays(current, start);
  } catch (error) {
    return 0;
  }
}

export function getCalendarGrid(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function getFormattedDateLabel(dateKey: string): {
  dayNumber: string;
  weekday: string;
  dateStr: string;
} {
  try {
    const date = parseDateKey(dateKey);
    return {
      dayNumber: format(date, "d"),
      weekday: format(date, "EEEE").toUpperCase(),
      dateStr: format(date, "MMMM yyyy").toUpperCase(),
    };
  } catch (e) {
    return {
      dayNumber: "1",
      weekday: "MONDAY",
      dateStr: "JANUARY 2026",
    };
  }
}

export function calculateStreaks(days: Record<string, any>): {
  currentStreak: number;
  bestStreak: number;
  streakDays: string[];
} {
  // Filter date keys that have any actual user input/activity
  const dateKeys = Object.keys(days).filter((key) => {
    const day = days[key];
    const hasBlocks = day?.blocks && day.blocks.length > 0;
    const hasNotes = day?.notes && day.notes.trim() !== "" && day.notes !== "<p></p>" && day.notes !== "<p></p><p></p>";
    const hasMits = day?.mits && day.mits.some((m: any) => m.text.trim() !== "");
    const hasMetrics = day?.metrics && (day.metrics.focus > 0 || day.metrics.energy > 0 || day.metrics.mood > 0);
    const hasTasks = day?.tasks && day.tasks.length > 0;
    return hasBlocks || hasNotes || hasMits || hasMetrics || hasTasks;
  }).sort();

  if (dateKeys.length === 0) {
    return { currentStreak: 0, bestStreak: 0, streakDays: [] };
  }

  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");
  const yesterday = subDays(today, 1);
  const yesterdayKey = format(yesterday, "yyyy-MM-dd");

  let currentStreak = 0;
  const streakDays: string[] = [];
  
  // Decide start pointer for current streak (today or yesterday)
  let checkDate = today;
  if (!dateKeys.includes(todayKey)) {
    if (dateKeys.includes(yesterdayKey)) {
      checkDate = yesterday;
    } else {
      // Streak broken
      checkDate = today;
    }
  }

  let checkKey = format(checkDate, "yyyy-MM-dd");
  while (dateKeys.includes(checkKey)) {
    currentStreak++;
    streakDays.push(checkKey);
    checkDate = subDays(checkDate, 1);
    checkKey = format(checkDate, "yyyy-MM-dd");
  }

  // Calculate best streak (longest consecutive segment ever)
  let bestStreak = 0;
  let tempStreak = 0;

  if (dateKeys.length > 0) {
    tempStreak = 1;
    bestStreak = 1;
    for (let i = 1; i < dateKeys.length; i++) {
      const currentD = parseDateKey(dateKeys[i]);
      const prevD = parseDateKey(dateKeys[i - 1]);
      const diff = differenceInDays(currentD, prevD);
      
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
  }

  return {
    currentStreak,
    bestStreak,
    streakDays,
  };
}
