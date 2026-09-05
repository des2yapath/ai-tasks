const MS_PER_DAY = 86_400_000;

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((parseISODate(toISO).getTime() - parseISODate(fromISO).getTime()) / MS_PER_DAY);
}

export function isOverdue(dueISO: string | null): boolean {
  return dueISO !== null && dueISO < todayISO();
}

export function formatDueLabel(dueISO: string): string {
  const diff = daysBetween(todayISO(), dueISO);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDateMedium(dueISO);
}

export function formatDateMedium(iso: string): string {
  const d = parseISODate(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function formatWeekday(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: "short" });
}

export interface CalendarCell {
  iso: string;
  inMonth: boolean;
  isToday: boolean;
}

export function monthGrid(year: number, month: number): CalendarCell[][] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const today = todayISO();
  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
      const iso = toISODate(cell);
      week.push({ iso, inMonth: cell.getMonth() === month, isToday: iso === today });
    }
    weeks.push(week);
  }
  return weeks;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
