export const ROW_HEIGHT = 80; // height of 1 hour in pixels
export const MINUTES_IN_HOUR = 60;
export const PIXELS_PER_MINUTE = ROW_HEIGHT / MINUTES_IN_HOUR; // 1.333px per minute

export function minutesToTimeStr(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, minutes));
  const hrs = Math.floor(normalized / 60);
  const mins = Math.floor(normalized % 60);
  const ampm = hrs >= 12 ? "PM" : "AM";
  const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
  const displayMins = mins.toString().padStart(2, "0");
  return `${displayHrs}:${displayMins} ${ampm}`;
}

export function durationToLabel(durationMinutes: number): string {
  const hrs = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function snapTo15Mins(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

export function minutesToTimeY(minutes: number): number {
  return minutes * PIXELS_PER_MINUTE;
}

export function minutesToY(minutes: number): number {
  return minutes * PIXELS_PER_MINUTE;
}

export function minutesToTimeInputVal(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, minutes));
  const hrs = Math.floor(normalized / 60);
  const mins = Math.floor(normalized % 60);
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function timeInputValToMinutes(val: string): number {
  if (!val) return 0;
  const [hrsStr, minsStr] = val.split(":");
  const hrs = parseInt(hrsStr, 10) || 0;
  const mins = parseInt(minsStr, 10) || 0;
  return Math.max(0, Math.min(1439, hrs * 60 + mins));
}

export function yToMinutes(y: number): number {
  return Math.max(0, Math.min(1440, Math.round(y / PIXELS_PER_MINUTE)));
}
