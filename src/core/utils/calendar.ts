/**
 * Calendar, Recurrence & Conflict Calculation Utilities
 * High performance, zero external dependency, timezone-safe calculation engine.
 */

import { Schedule, ScheduleOccurrence, RecurrenceRule } from '../../domain/entities/schedule';
import { getTodayDateString } from './date';

export interface MonthGridDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Converts "HH:mm" time string into minutes from midnight (0..1439).
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':');
  const hours = parseInt(h, 10) || 0;
  const minutes = parseInt(m, 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight into "HH:mm" 24h format.
 */
export function minutesToTime(mins: number): string {
  const bounded = Math.max(0, Math.min(1439, mins));
  const h = Math.floor(bounded / 60);
  const m = bounded % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Checks whether two time intervals [s1, e1] and [s2, e2] overlap.
 */
export function doTimesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  // Overlap condition: max(startA, startB) < min(endA, endB)
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

/**
 * Detects overlapping schedules on candidate's date.
 * Excludes candidate itself and all-day schedules.
 */
export function detectScheduleConflicts(
  candidate: {
    id?: string;
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    isAllDay?: boolean;
  },
  existingSchedules: Schedule[]
): Schedule[] {
  if (candidate.isAllDay) return [];

  const candidateDate = candidate.startDate;

  return existingSchedules.filter((s) => {
    if (candidate.id && s.id === candidate.id) return false;
    if (s.isAllDay) return false;

    // Check if s occurs on candidateDate
    const sDate = s.startDate || s.date;
    const occurrences = expandSchedulesForDate([s], candidateDate);
    if (occurrences.length === 0) return false;

    // Check if time ranges collide
    return doTimesOverlap(
      candidate.startTime,
      candidate.endTime,
      s.startTime,
      s.endTime
    );
  });
}

/**
 * Checks if a specific schedule occurs on a given date (YYYY-MM-DD).
 */
export function doesScheduleOccurOnDate(schedule: Schedule, targetDateStr: string): boolean {
  const startDateStr = schedule.startDate || schedule.date;
  if (!startDateStr) return false;

  // If excluded in recurrence exceptions
  if (schedule.recurrenceExceptions && schedule.recurrenceExceptions.includes(targetDateStr)) {
    return false;
  }

  const rule = schedule.recurrenceRule;
  const isRecurring = rule && rule.frequency && rule.frequency !== 'none';

  if (!isRecurring) {
    const endDateStr = schedule.endDate || startDateStr;
    return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
  }

  // Target date must be on or after start date
  if (targetDateStr < startDateStr) return false;

  // If recurrence rule has an end date
  if (rule.endDate && targetDateStr > rule.endDate) return false;

  const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(tYear, tMonth - 1, tDay);

  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  const startDate = new Date(sYear, sMonth - 1, sDay);

  const diffTime = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const interval = Math.max(1, rule.interval || 1);

  switch (rule.frequency) {
    case 'daily': {
      if (diffDays % interval !== 0) return false;
      if (rule.count) {
        const occurrenceIndex = Math.floor(diffDays / interval) + 1;
        if (occurrenceIndex > rule.count) return false;
      }
      return true;
    }

    case 'weekly':
    case 'custom': {
      // Days of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
      const allowedDays =
        rule.daysOfWeek && rule.daysOfWeek.length > 0
          ? rule.daysOfWeek
          : [startDate.getDay()];

      const targetDayOfWeek = targetDate.getDay();
      if (!allowedDays.includes(targetDayOfWeek)) return false;

      // Check weekly interval
      const diffWeeks = Math.floor(diffDays / 7);
      if (diffWeeks % interval !== 0) return false;

      if (rule.count) {
        // Approximate occurrence count check
        const occurrencesSoFar = diffWeeks * allowedDays.length;
        if (occurrencesSoFar >= rule.count) return false;
      }
      return true;
    }

    case 'monthly': {
      // Must match day of month
      if (targetDate.getDate() !== startDate.getDate()) return false;
      const monthDiff =
        (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
        (targetDate.getMonth() - startDate.getMonth());
      if (monthDiff < 0 || monthDiff % interval !== 0) return false;
      if (rule.count && Math.floor(monthDiff / interval) + 1 > rule.count) return false;
      return true;
    }

    case 'yearly': {
      if (
        targetDate.getMonth() !== startDate.getMonth() ||
        targetDate.getDate() !== startDate.getDate()
      ) {
        return false;
      }
      const yearDiff = targetDate.getFullYear() - startDate.getFullYear();
      if (yearDiff < 0 || yearDiff % interval !== 0) return false;
      if (rule.count && Math.floor(yearDiff / interval) + 1 > rule.count) return false;
      return true;
    }

    default:
      return targetDateStr === startDateStr;
  }
}

/**
 * Expands a list of schedules for a single date.
 */
export function expandSchedulesForDate(
  schedules: Schedule[],
  targetDateStr: string
): ScheduleOccurrence[] {
  const result: ScheduleOccurrence[] = [];

  for (const s of schedules) {
    if (doesScheduleOccurOnDate(s, targetDateStr)) {
      const isBase = (s.startDate || s.date) === targetDateStr;
      result.push({
        schedule: s,
        occurrenceDate: targetDateStr,
        isOccurrence: !isBase,
        occurrenceId: isBase ? s.id : `${s.id}_${targetDateStr}`,
      });
    }
  }

  // Sort by startTime
  return result.sort((a, b) => {
    if (a.schedule.isAllDay && !b.schedule.isAllDay) return -1;
    if (!a.schedule.isAllDay && b.schedule.isAllDay) return 1;
    return a.schedule.startTime.localeCompare(b.schedule.startTime);
  });
}

/**
 * Generates the full month grid days (including leading/trailing days from adjacent months).
 * Supports starting on Monday (default) or Sunday.
 */
export function getMonthMatrix(
  year: number,
  month: number,
  startOfWeek: 'monday' | 'sunday' = 'monday'
): MonthGridDay[][] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const jsDay = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const leadingDaysCount =
    startOfWeek === 'sunday' ? jsDay : jsDay === 0 ? 6 : jsDay - 1;

  const totalCurrentMonthDays = lastDayOfMonth.getDate();
  const todayStr = getTodayDateString();

  const days: MonthGridDay[] = [];

  // 1. Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = leadingDaysCount - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const date = new Date(year, month - 1, d);
    const dateString = formatDateToYMD(date);
    days.push({
      date,
      dateString,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
    });
  }

  // 2. Current month days
  for (let d = 1; d <= totalCurrentMonthDays; d++) {
    const date = new Date(year, month, d);
    const dateString = formatDateToYMD(date);
    days.push({
      date,
      dateString,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateString === todayStr,
    });
  }

  // 3. Next month leading days (fill row up to multiple of 7, usually 35 or 42 cells)
  const remainingCells = (7 - (days.length % 7)) % 7;
  // Ensure we display at least 5 rows (35 days) or 6 rows if needed
  const targetTotal = days.length + remainingCells < 35 ? 35 : days.length + remainingCells;
  const trailingNeeded = targetTotal - days.length;

  for (let d = 1; d <= trailingNeeded; d++) {
    const date = new Date(year, month + 1, d);
    const dateString = formatDateToYMD(date);
    days.push({
      date,
      dateString,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
    });
  }

  // Chunk into rows of 7
  const matrix: MonthGridDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    matrix.push(days.slice(i, i + 7));
  }

  return matrix;
}

/**
 * Format Date to YYYY-MM-DD in local time
 */
export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates whether a schedule occurrence is currently ongoing, upcoming, or passed.
 */
export function getScheduleTimeStatus(
  schedule: Schedule,
  occurrenceDate: string
): 'ongoing' | 'upcoming' | 'passed' {
  const todayStr = getTodayDateString();
  if (occurrenceDate < todayStr) return 'passed';
  if (occurrenceDate > todayStr) return 'upcoming';

  if (schedule.isAllDay) return 'ongoing';

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const startMins = timeToMinutes(schedule.startTime);
  const endMins = timeToMinutes(schedule.endTime);

  if (currentMins >= startMins && currentMins <= endMins) return 'ongoing';
  if (currentMins < startMins) return 'upcoming';
  return 'passed';
}

/**
 * Schedules a local browser notification with permission check.
 */
export async function scheduleBrowserReminder(
  title: string,
  body: string,
  scheduledTimeMs: number
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;
  }

  const delay = scheduledTimeMs - Date.now();
  if (delay <= 0) {
    // If within 2 minutes past, still show notification
    if (delay > -120000) {
      new Notification(title, { body, icon: '/favicon.ico' });
      return true;
    }
    return false;
  }

  setTimeout(() => {
    new Notification(title, { body, icon: '/favicon.ico' });
  }, Math.min(delay, 2147483647));

  return true;
}
