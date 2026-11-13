/**
 * FlowDay Analytics & Productivity Calculation Service
 * Pure, deterministic, timezone-aware analytics engine shared by Statistics and Dashboard.
 * Zero dummy data, zero duplicate counting, and safe zero-division handling.
 */

import { Task, normalizePriority } from '../../domain/entities/task';
import { FocusSession, FocusSessionType } from '../../domain/entities/focus_session';
import { Category } from '../../domain/entities/category';
import { Schedule } from '../../domain/entities/schedule';
import {
  ProductivityGoals,
  DEFAULT_PRODUCTIVITY_GOALS,
} from '../../domain/entities/productivity_goal';
import { expandSchedulesForDate } from '../../core/utils/calendar';

export type TimeRangeKey =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'custom';

export type ComparisonPeriodKey =
  | 'this_week_vs_last_week'
  | 'this_month_vs_last_month'
  | 'last_7_vs_prev_7'
  | 'last_30_vs_prev_30';

export interface ResolvedDateRange {
  key: TimeRangeKey;
  startDate: string; // YYYY-MM-DD local
  endDate: string; // YYYY-MM-DD local
  daysCount: number;
  label: string;
  bucketMode: 'day' | 'week' | 'month';
  isValid: boolean;
  error?: string;
}

export interface TrendBucket {
  key: string;
  label: string;
  fullLabel: string;
  value: number;
  secondaryValue?: number;
}

export interface TaskAnalyticsResult {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  statusDistribution: {
    key: 'completed' | 'in_progress' | 'pending' | 'overdue';
    label: string;
    count: number;
    percent: number;
    color: string;
  }[];
  priorityDistribution: {
    key: 'high' | 'medium' | 'low';
    label: string;
    total: number;
    completed: number;
    percent: number;
    color: string;
  }[];
  categoryDistribution: {
    categoryId: string;
    name: string;
    color: string;
    total: number;
    completed: number;
    active: number;
    percent: number;
  }[];
  completionTrend: TrendBucket[];
  bestDay: { dateKey: string; label: string; completedCount: number } | null;
}

export interface FocusAnalyticsResult {
  totalFocusSeconds: number;
  totalFocusMinutes: number;
  totalCompletedSessions: number;
  allCompletedLogsCount: number;
  averageSessionSeconds: number;
  averageSessionMinutes: number;
  longestSessionSeconds: number;
  longestSessionMinutes: number;
  dailyFocusGoalMinutes: number | null;
  goalAchievementPercent: number | null;
  dailyFocusTrend: TrendBucket[];
  sessionCountTrend: TrendBucket[];
  modeDistribution: {
    mode: FocusSessionType;
    label: string;
    sessions: number;
    minutes: number;
    percent: number;
    color: string;
  }[];
  longestDay: { dateKey: string; label: string; minutes: number } | null;
}

export interface ProductivityScoreResult {
  available: boolean;
  score: number | null;
  levelLabel: string;
  taskComponent: number;
  focusComponent: number;
  maxTaskComponent: number;
  maxFocusComponent: number;
  explanation: string;
  disclaimer: string;
}

export interface GoalProgressItem {
  key: 'dailyTask' | 'weeklyTask' | 'dailyFocus' | 'weeklyFocus';
  label: string;
  unit: 'tasks' | 'mins';
  enabled: boolean;
  current: number;
  target: number;
  percent: number;
  achieved: boolean;
  periodLabel: string;
}

export interface GoalProgressResult {
  hasAnyEnabledGoal: boolean;
  enabledCount: number;
  achievedCount: number;
  items: GoalProgressItem[];
}

export interface ComparisonMetric {
  key: string;
  label: string;
  unit: string;
  current: number;
  previous: number;
  deltaValue: number;
  deltaPercent: number | null;
  trend: 'up' | 'down' | 'neutral';
  displayChange: string;
}

export interface PeriodComparisonResult {
  key: ComparisonPeriodKey;
  currentLabel: string;
  previousLabel: string;
  hasPreviousData: boolean;
  metrics: ComparisonMetric[];
}

export interface ProductivityInsight {
  id: string;
  title: string;
  description: string;
  tone: 'lavender' | 'mint' | 'blue' | 'pink';
  metricHighlight?: string;
}

// ============================================================================
// 1. LOCAL TIMEZONE DATE HELPERS (NO UTC SHIFT BUGS)
// ============================================================================

export function toLocalDateKey(input: Date | string | undefined): string {
  if (!input) return '';
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return '';
    return formatDateParts(parsed);
  }
  if (isNaN(input.getTime())) return '';
  return formatDateParts(input);
}

function formatDateParts(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const d = parseLocalDateKey(dateKey);
  d.setDate(d.getDate() + deltaDays);
  return formatDateParts(d);
}

export function getStartOfWeekKey(
  anchorKey: string,
  startOfWeek: 'monday' | 'sunday' = 'monday'
): string {
  const d = parseLocalDateKey(anchorKey);
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const diff =
    startOfWeek === 'sunday' ? -day : day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDateParts(d);
}

export function getStartOfMonthKey(anchorKey: string): string {
  const [y, m] = anchorKey.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

export function getEndOfMonthKey(anchorKey: string): string {
  const [y, m] = anchorKey.split('-').map(Number);
  const lastDay = new Date(y, m, 0);
  return formatDateParts(lastDay);
}

export function diffDaysInclusive(startKey: string, endKey: string): number {
  const s = parseLocalDateKey(startKey).getTime();
  const e = parseLocalDateKey(endKey).getTime();
  if (e < s) return 0;
  return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

export function enumerateDateKeys(startKey: string, endKey: string): string[] {
  const count = diffDaysInclusive(startKey, endKey);
  const keys: string[] = [];
  const cap = Math.min(count, 366);
  for (let i = 0; i < cap; i++) {
    keys.push(addDaysToDateKey(startKey, i));
  }
  return keys;
}

function formatShortDateLabel(dateKey: string): string {
  const d = parseLocalDateKey(dateKey);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

function formatWeekdayShortLabel(dateKey: string): string {
  const d = parseLocalDateKey(dateKey);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  }).format(d);
}

// ============================================================================
// 2. DEDUPLICATION & RANGE RESOLUTION
// ============================================================================

export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

export function resolveDateRange(
  key: TimeRangeKey,
  options?: {
    now?: Date;
    startOfWeek?: 'monday' | 'sunday';
    customStart?: string;
    customEnd?: string;
  }
): ResolvedDateRange {
  const now = options?.now || new Date();
  const todayKey = toLocalDateKey(now);
  const startOfWeekPref = options?.startOfWeek || 'monday';

  let startDate = todayKey;
  let endDate = todayKey;
  let label = 'Today';

  switch (key) {
    case 'today': {
      startDate = todayKey;
      endDate = todayKey;
      label = 'Today';
      break;
    }
    case 'this_week': {
      startDate = getStartOfWeekKey(todayKey, startOfWeekPref);
      endDate = addDaysToDateKey(startDate, 6);
      label = 'This Week';
      break;
    }
    case 'this_month': {
      startDate = getStartOfMonthKey(todayKey);
      endDate = getEndOfMonthKey(todayKey);
      label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);
      break;
    }
    case 'last_7_days': {
      startDate = addDaysToDateKey(todayKey, -6);
      endDate = todayKey;
      label = 'Last 7 Days';
      break;
    }
    case 'last_30_days': {
      startDate = addDaysToDateKey(todayKey, -29);
      endDate = todayKey;
      label = 'Last 30 Days';
      break;
    }
    case 'last_90_days': {
      startDate = addDaysToDateKey(todayKey, -89);
      endDate = todayKey;
      label = 'Last 90 Days';
      break;
    }
    case 'custom': {
      const s = options?.customStart ? toLocalDateKey(options.customStart) : todayKey;
      const e = options?.customEnd ? toLocalDateKey(options.customEnd) : todayKey;
      if (!s || !e) {
        return {
          key,
          startDate: todayKey,
          endDate: todayKey,
          daysCount: 1,
          label: 'Custom Range',
          bucketMode: 'day',
          isValid: false,
          error: 'Please select both start and end dates.',
        };
      }
      if (e < s) {
        return {
          key,
          startDate: s,
          endDate: e,
          daysCount: 0,
          label: 'Invalid Range',
          bucketMode: 'day',
          isValid: false,
          error: 'End date cannot be earlier than start date.',
        };
      }
      startDate = s;
      endDate = e;
      label = `${formatShortDateLabel(s)} – ${formatShortDateLabel(e)}`;
      break;
    }
  }

  const daysCount = diffDaysInclusive(startDate, endDate);
  const bucketMode: 'day' | 'week' | 'month' =
    daysCount > 60 ? 'week' : 'day';

  return {
    key,
    startDate,
    endDate,
    daysCount,
    label,
    bucketMode,
    isValid: true,
  };
}

function buildTrendBuckets(
  range: ResolvedDateRange,
  startOfWeekPref: 'monday' | 'sunday' = 'monday'
): { key: string; label: string; fullLabel: string; start: string; end: string }[] {
  const days = enumerateDateKeys(range.startDate, range.endDate);
  if (range.bucketMode === 'day') {
    return days.map((dayKey) => ({
      key: dayKey,
      label:
        days.length <= 7
          ? formatWeekdayShortLabel(dayKey)
          : formatShortDateLabel(dayKey),
      fullLabel: formatShortDateLabel(dayKey),
      start: dayKey,
      end: dayKey,
    }));
  }

  // Group into weekly buckets for > 60 day ranges
  const bucketsMap = new Map<
    string,
    { key: string; label: string; fullLabel: string; start: string; end: string }
  >();
  for (const dayKey of days) {
    const wkStart = getStartOfWeekKey(dayKey, startOfWeekPref);
    if (!bucketsMap.has(wkStart)) {
      const wkEnd = addDaysToDateKey(wkStart, 6);
      bucketsMap.set(wkStart, {
        key: wkStart,
        label: formatShortDateLabel(wkStart),
        fullLabel: `${formatShortDateLabel(wkStart)} – ${formatShortDateLabel(wkEnd)}`,
        start: wkStart,
        end: wkEnd,
      });
    }
  }
  return Array.from(bucketsMap.values());
}

// ============================================================================
// 3. TASK ANALYTICS
// ============================================================================

export function isTaskOverdueAt(task: Task, now: Date = new Date()): boolean {
  if (task.isCompleted || !task.dueDate) return false;
  const todayKey = toLocalDateKey(now);
  if (task.dueDate < todayKey) return true;
  if (task.dueDate === todayKey && task.endTime) {
    const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    return task.endTime < currentHM;
  }
  return false;
}

export function getTaskCompletionDateKey(task: Task): string {
  return toLocalDateKey(task.completedAt || task.updatedAt || task.createdAt);
}

export function calculateTaskStats(
  rawTasks: Task[],
  categories: Category[],
  range: ResolvedDateRange,
  options?: { now?: Date; startOfWeek?: 'monday' | 'sunday' }
): TaskAnalyticsResult {
  const now = options?.now || new Date();
  const todayKey = toLocalDateKey(now);
  const startOfWeekPref = options?.startOfWeek || 'monday';
  const tasks = deduplicateById(rawTasks);

  // Mutually exclusive task classification within the selected period
  const scopedCompleted: Task[] = [];
  const scopedOverdue: Task[] = [];
  const scopedInProgress: Task[] = [];
  const scopedPending: Task[] = [];

  for (const task of tasks) {
    if (task.isCompleted) {
      const compDate = getTaskCompletionDateKey(task);
      if (compDate >= range.startDate && compDate <= range.endDate) {
        scopedCompleted.push(task);
      }
      continue;
    }

    // Incomplete tasks: determine whether they belong to the period scope
    const createdDate = toLocalDateKey(task.createdAt);
    const dueDate = task.dueDate ? toLocalDateKey(task.dueDate) : '';

    if (isTaskOverdueAt(task, now)) {
      // Overdue if due on or before endDate (and for historical-only ranges, within range or up to endDate)
      const inRange =
        range.endDate >= todayKey
          ? dueDate <= range.endDate
          : dueDate >= range.startDate && dueDate <= range.endDate;
      if (inRange) {
        scopedOverdue.push(task);
      }
      continue;
    }

    // Not completed and not overdue: check if due in range, or if undated check created in range
    const belongsToPeriod = dueDate
      ? dueDate >= range.startDate && dueDate <= range.endDate
      : createdDate >= range.startDate && createdDate <= range.endDate;

    if (belongsToPeriod) {
      if (task.status === 'in_progress') {
        scopedInProgress.push(task);
      } else {
        scopedPending.push(task);
      }
    }
  }

  const allScoped = [
    ...scopedCompleted,
    ...scopedOverdue,
    ...scopedInProgress,
    ...scopedPending,
  ];
  const total = allScoped.length;
  const completed = scopedCompleted.length;
  const overdue = scopedOverdue.length;
  const inProgress = scopedInProgress.length;
  const pending = scopedPending.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const statusDistribution = [
    {
      key: 'completed' as const,
      label: 'Completed',
      count: completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      color: '#B5DCCB',
    },
    {
      key: 'in_progress' as const,
      label: 'In Progress',
      count: inProgress,
      percent: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      color: '#A9C8E8',
    },
    {
      key: 'pending' as const,
      label: 'Pending',
      count: pending,
      percent: total > 0 ? Math.round((pending / total) * 100) : 0,
      color: '#A995D8',
    },
    {
      key: 'overdue' as const,
      label: 'Overdue',
      count: overdue,
      percent: total > 0 ? Math.round((overdue / total) * 100) : 0,
      color: '#E07A5F',
    },
  ];

  // Priority Distribution
  const priorityCounts: Record<'high' | 'medium' | 'low', { total: number; completed: number }> = {
    high: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 },
  };

  for (const t of allScoped) {
    const p = normalizePriority(t.priority);
    priorityCounts[p].total += 1;
    if (t.isCompleted) priorityCounts[p].completed += 1;
  }

  const priorityDistribution = [
    {
      key: 'high' as const,
      label: 'High Priority',
      total: priorityCounts.high.total,
      completed: priorityCounts.high.completed,
      percent: total > 0 ? Math.round((priorityCounts.high.total / total) * 100) : 0,
      color: '#E07A5F',
    },
    {
      key: 'medium' as const,
      label: 'Medium Priority',
      total: priorityCounts.medium.total,
      completed: priorityCounts.medium.completed,
      percent: total > 0 ? Math.round((priorityCounts.medium.total / total) * 100) : 0,
      color: '#A995D8',
    },
    {
      key: 'low' as const,
      label: 'Low Priority',
      total: priorityCounts.low.total,
      completed: priorityCounts.low.completed,
      percent: total > 0 ? Math.round((priorityCounts.low.total / total) * 100) : 0,
      color: '#A9C8E8',
    },
  ];

  // Category Distribution
  const catMap = new Map<string, Category>();
  categories.forEach((c) => catMap.set(c.id, c));

  const catTotals = new Map<
    string,
    { categoryId: string; name: string; color: string; total: number; completed: number }
  >();

  for (const t of allScoped) {
    const cat = catMap.get(t.categoryId);
    const id = cat ? cat.id : 'uncategorized';
    const entry = catTotals.get(id) || {
      categoryId: id,
      name: cat ? cat.name : 'Other',
      color: cat ? cat.color : '#898493',
      total: 0,
      completed: 0,
    };
    entry.total += 1;
    if (t.isCompleted) entry.completed += 1;
    catTotals.set(id, entry);
  }

  const categoryDistribution = Array.from(catTotals.values())
    .map((entry) => ({
      ...entry,
      active: entry.total - entry.completed,
      percent: total > 0 ? Math.round((entry.total / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Completion Trend & Best Day
  const buckets = buildTrendBuckets(range, startOfWeekPref);
  const completedByDay = new Map<string, number>();
  for (const t of scopedCompleted) {
    const dayKey = getTaskCompletionDateKey(t);
    completedByDay.set(dayKey, (completedByDay.get(dayKey) || 0) + 1);
  }

  const completionTrend: TrendBucket[] = buckets.map((b) => {
    let sum = 0;
    for (const [dayKey, count] of completedByDay.entries()) {
      if (dayKey >= b.start && dayKey <= b.end) {
        sum += count;
      }
    }
    return {
      key: b.key,
      label: b.label,
      fullLabel: b.fullLabel,
      value: sum,
    };
  });

  let bestDay: { dateKey: string; label: string; completedCount: number } | null = null;
  for (const [dayKey, count] of completedByDay.entries()) {
    if (!bestDay || count > bestDay.completedCount) {
      bestDay = {
        dateKey: dayKey,
        label: formatShortDateLabel(dayKey),
        completedCount: count,
      };
    }
  }

  return {
    total,
    completed,
    pending,
    inProgress,
    overdue,
    completionRate,
    statusDistribution,
    priorityDistribution,
    categoryDistribution,
    completionTrend,
    bestDay,
  };
}

// ============================================================================
// 4. FOCUS ANALYTICS
// ============================================================================

export function getSessionActualSeconds(session: FocusSession): number {
  if (!session.completed || !session.duration || session.duration <= 0) return 0;
  return Math.max(0, session.duration - (session.pausedDuration || 0));
}

export function isWorkFocusMode(type: FocusSessionType): boolean {
  return type === 'pomodoro' || type === 'deep_work';
}

export function getSessionDateKey(session: FocusSession): string {
  return toLocalDateKey(session.endTime || session.startTime || session.createdAt);
}

export function calculateFocusStats(
  rawSessions: FocusSession[],
  range: ResolvedDateRange,
  goals?: ProductivityGoals | null,
  options?: { startOfWeek?: 'monday' | 'sunday' }
): FocusAnalyticsResult {
  const startOfWeekPref = options?.startOfWeek || 'monday';
  const sessions = deduplicateById(rawSessions);

  // Only completed sessions with positive actual duration inside date range
  const completedInRange = sessions.filter((s) => {
    if (!s.completed) return false;
    const actual = getSessionActualSeconds(s);
    if (actual <= 0) return false;
    const dateKey = getSessionDateKey(s);
    return dateKey >= range.startDate && dateKey <= range.endDate;
  });

  const workSessions = completedInRange.filter((s) => isWorkFocusMode(s.sessionType));

  let totalFocusSeconds = 0;
  let longestSessionSeconds = 0;
  const focusSecondsByDay = new Map<string, number>();
  const sessionsCountByDay = new Map<string, number>();

  for (const s of workSessions) {
    const actual = getSessionActualSeconds(s);
    totalFocusSeconds += actual;
    if (actual > longestSessionSeconds) longestSessionSeconds = actual;

    const dKey = getSessionDateKey(s);
    focusSecondsByDay.set(dKey, (focusSecondsByDay.get(dKey) || 0) + actual);
    sessionsCountByDay.set(dKey, (sessionsCountByDay.get(dKey) || 0) + 1);
  }

  const totalCompletedSessions = workSessions.length;
  const totalFocusMinutes = Math.round(totalFocusSeconds / 60);
  const averageSessionSeconds =
    totalCompletedSessions > 0 ? Math.round(totalFocusSeconds / totalCompletedSessions) : 0;
  const averageSessionMinutes = Math.round(averageSessionSeconds / 60);
  const longestSessionMinutes = Math.round(longestSessionSeconds / 60);

  // Goal achievement
  const dailyGoalConfig = goals?.dailyFocusGoalMinutes;
  const dailyFocusGoalMinutes = dailyGoalConfig?.enabled ? dailyGoalConfig.target : null;
  let goalAchievementPercent: number | null = null;
  if (dailyFocusGoalMinutes && dailyFocusGoalMinutes > 0) {
    const periodTargetMinutes = dailyFocusGoalMinutes * Math.max(1, range.daysCount);
    goalAchievementPercent = Math.min(
      100,
      Math.round((totalFocusMinutes / periodTargetMinutes) * 100)
    );
  }

  // Trends
  const buckets = buildTrendBuckets(range, startOfWeekPref);
  const dailyFocusTrend: TrendBucket[] = buckets.map((b) => {
    let secSum = 0;
    for (const [dKey, sec] of focusSecondsByDay.entries()) {
      if (dKey >= b.start && dKey <= b.end) secSum += sec;
    }
    return {
      key: b.key,
      label: b.label,
      fullLabel: b.fullLabel,
      value: Math.round(secSum / 60),
    };
  });

  const sessionCountTrend: TrendBucket[] = buckets.map((b) => {
    let countSum = 0;
    for (const [dKey, cnt] of sessionsCountByDay.entries()) {
      if (dKey >= b.start && dKey <= b.end) countSum += cnt;
    }
    return {
      key: b.key,
      label: b.label,
      fullLabel: b.fullLabel,
      value: countSum,
    };
  });

  // Mode Distribution across all completed session types
  const modeDefinitions: {
    mode: FocusSessionType;
    label: string;
    color: string;
  }[] = [
    { mode: 'pomodoro', label: 'Pomodoro', color: '#A995D8' },
    { mode: 'deep_work', label: 'Deep Work', color: '#F1B8CC' },
    { mode: 'short_break', label: 'Short Break', color: '#B5DCCB' },
    { mode: 'long_break', label: 'Long Break', color: '#A9C8E8' },
  ];

  const allCompletedCount = completedInRange.length;
  const modeDistribution = modeDefinitions
    .map((def) => {
      const matching = completedInRange.filter((s) => s.sessionType === def.mode);
      const mins = Math.round(
        matching.reduce((acc, s) => acc + getSessionActualSeconds(s), 0) / 60
      );
      return {
        mode: def.mode,
        label: def.label,
        sessions: matching.length,
        minutes: mins,
        percent:
          allCompletedCount > 0 ? Math.round((matching.length / allCompletedCount) * 100) : 0,
        color: def.color,
      };
    })
    .filter((m) => m.sessions > 0);

  let longestDay: { dateKey: string; label: string; minutes: number } | null = null;
  for (const [dKey, sec] of focusSecondsByDay.entries()) {
    const mins = Math.round(sec / 60);
    if (!longestDay || mins > longestDay.minutes) {
      longestDay = {
        dateKey: dKey,
        label: formatShortDateLabel(dKey),
        minutes: mins,
      };
    }
  }

  return {
    totalFocusSeconds,
    totalFocusMinutes,
    totalCompletedSessions,
    allCompletedLogsCount: allCompletedCount,
    averageSessionSeconds,
    averageSessionMinutes,
    longestSessionSeconds,
    longestSessionMinutes,
    dailyFocusGoalMinutes,
    goalAchievementPercent,
    dailyFocusTrend,
    sessionCountTrend,
    modeDistribution,
    longestDay,
  };
}

// ============================================================================
// 5. PRODUCTIVITY SCORE (TRANSPARENT & NON-PUNITIVE)
// ============================================================================

export function calculateProductivityScore(
  taskStats: TaskAnalyticsResult,
  focusStats: FocusAnalyticsResult,
  range: ResolvedDateRange,
  goals?: ProductivityGoals | null
): ProductivityScoreResult {
  const disclaimer =
    'Activity indicator calculated solely from your recorded FlowDay tasks and focus sessions.';

  // Insufficient data guard
  if (taskStats.total === 0 && focusStats.totalCompletedSessions === 0) {
    return {
      available: false,
      score: null,
      levelLabel: 'Insufficient Data',
      taskComponent: 0,
      focusComponent: 0,
      maxTaskComponent: 60,
      maxFocusComponent: 40,
      explanation:
        'Complete at least one task or focus session in this period to calculate your activity score.',
      disclaimer,
    };
  }

  const dailyFocusBaseline = goals?.dailyFocusGoalMinutes?.enabled
    ? Math.max(15, goals.dailyFocusGoalMinutes.target)
    : 50; // Gentle baseline (two 25m pomodoros/day)
  const periodFocusTarget = dailyFocusBaseline * Math.max(1, range.daysCount);

  // If user has focus sessions but no tasks scheduled/due in this period, do not penalize empty task list
  if (taskStats.total === 0 && focusStats.totalCompletedSessions > 0) {
    const focusRatio = Math.min(1, focusStats.totalFocusMinutes / periodFocusTarget);
    const focusOnlyScore = Math.round(focusRatio * 100);
    const levelLabel =
      focusOnlyScore >= 80
        ? 'Peak Flow'
        : focusOnlyScore >= 50
        ? 'Steady Momentum'
        : 'Building Rhythm';
    return {
      available: true,
      score: focusOnlyScore,
      levelLabel,
      taskComponent: 0,
      focusComponent: Math.round(focusRatio * 40),
      maxTaskComponent: 0,
      maxFocusComponent: 100,
      explanation: `Calculated from ${focusStats.totalFocusMinutes}m of completed focus vs ${periodFocusTarget}m target (no tasks due in this period).`,
      disclaimer,
    };
  }

  const taskRatio = taskStats.completionRate / 100;
  const focusRatio =
    periodFocusTarget > 0 ? Math.min(1, focusStats.totalFocusMinutes / periodFocusTarget) : 0;

  const taskComponent = Math.round(taskRatio * 60);
  const focusComponent = Math.round(focusRatio * 40);
  const score = Math.min(100, Math.max(0, taskComponent + focusComponent));

  const levelLabel =
    score >= 80 ? 'Peak Flow' : score >= 50 ? 'Steady Momentum' : 'Starting Out';

  return {
    available: true,
    score,
    levelLabel,
    taskComponent,
    focusComponent,
    maxTaskComponent: 60,
    maxFocusComponent: 40,
    explanation: `Task completion (${taskStats.completionRate}% = ${taskComponent}/60 pts) + Focus investment (${focusStats.totalFocusMinutes}m = ${focusComponent}/40 pts).`,
    disclaimer,
  };
}

// ============================================================================
// 6. PRODUCTIVITY GOALS PROGRESS
// ============================================================================

export function calculateGoalProgress(
  rawTasks: Task[],
  rawSessions: FocusSession[],
  goals: ProductivityGoals | null,
  options?: { now?: Date; startOfWeek?: 'monday' | 'sunday' }
): GoalProgressResult {
  const now = options?.now || new Date();
  const todayKey = toLocalDateKey(now);
  const weekStartKey = getStartOfWeekKey(todayKey, options?.startOfWeek || 'monday');
  const weekEndKey = addDaysToDateKey(weekStartKey, 6);

  const tasks = deduplicateById(rawTasks);
  const sessions = deduplicateById(rawSessions).filter(
    (s) => s.completed && isWorkFocusMode(s.sessionType) && getSessionActualSeconds(s) > 0
  );

  const todayCompletedTasks = tasks.filter(
    (t) => t.isCompleted && getTaskCompletionDateKey(t) === todayKey
  ).length;
  const weekCompletedTasks = tasks.filter((t) => {
    if (!t.isCompleted) return false;
    const dk = getTaskCompletionDateKey(t);
    return dk >= weekStartKey && dk <= weekEndKey;
  }).length;

  const todayFocusMinutes = Math.round(
    sessions
      .filter((s) => getSessionDateKey(s) === todayKey)
      .reduce((acc, s) => acc + getSessionActualSeconds(s), 0) / 60
  );
  const weekFocusMinutes = Math.round(
    sessions
      .filter((s) => {
        const dk = getSessionDateKey(s);
        return dk >= weekStartKey && dk <= weekEndKey;
      })
      .reduce((acc, s) => acc + getSessionActualSeconds(s), 0) / 60
  );

  const cfg = goals || {
    ...DEFAULT_PRODUCTIVITY_GOALS,
  };

  const makeItem = (
    key: GoalProgressItem['key'],
    label: string,
    unit: 'tasks' | 'mins',
    config: { enabled: boolean; target: number },
    current: number,
    periodLabel: string
  ): GoalProgressItem => {
    const safeTarget = Math.max(1, config.target || 1);
    const percent = Math.min(100, Math.round((current / safeTarget) * 100));
    return {
      key,
      label,
      unit,
      enabled: !!config.enabled,
      current,
      target: safeTarget,
      percent,
      achieved: current >= safeTarget,
      periodLabel,
    };
  };

  const items: GoalProgressItem[] = [
    makeItem('dailyTask', 'Daily Task Goal', 'tasks', cfg.dailyTaskGoal, todayCompletedTasks, 'Today'),
    makeItem('weeklyTask', 'Weekly Task Goal', 'tasks', cfg.weeklyTaskGoal, weekCompletedTasks, 'This Week'),
    makeItem('dailyFocus', 'Daily Focus Goal', 'mins', cfg.dailyFocusGoalMinutes, todayFocusMinutes, 'Today'),
    makeItem('weeklyFocus', 'Weekly Focus Goal', 'mins', cfg.weeklyFocusGoalMinutes, weekFocusMinutes, 'This Week'),
  ];

  const enabledItems = items.filter((i) => i.enabled);

  return {
    hasAnyEnabledGoal: enabledItems.length > 0,
    enabledCount: enabledItems.length,
    achievedCount: enabledItems.filter((i) => i.achieved).length,
    items,
  };
}

// ============================================================================
// 7. PERIOD COMPARISON (ZERO-SAFE PERCENTAGE DELTAS)
// ============================================================================

export function calculatePeriodComparison(
  rawTasks: Task[],
  rawSessions: FocusSession[],
  categories: Category[],
  comparisonKey: ComparisonPeriodKey,
  options?: { now?: Date; startOfWeek?: 'monday' | 'sunday' }
): PeriodComparisonResult {
  const now = options?.now || new Date();
  const todayKey = toLocalDateKey(now);
  const startOfWeekPref = options?.startOfWeek || 'monday';

  let currentStart = todayKey;
  let currentEnd = todayKey;
  let prevStart = todayKey;
  let prevEnd = todayKey;
  let currentLabel = '';
  let previousLabel = '';

  switch (comparisonKey) {
    case 'this_week_vs_last_week': {
      currentStart = getStartOfWeekKey(todayKey, startOfWeekPref);
      currentEnd = addDaysToDateKey(currentStart, 6);
      prevStart = addDaysToDateKey(currentStart, -7);
      prevEnd = addDaysToDateKey(currentStart, -1);
      currentLabel = 'This Week';
      previousLabel = 'Last Week';
      break;
    }
    case 'this_month_vs_last_month': {
      currentStart = getStartOfMonthKey(todayKey);
      currentEnd = getEndOfMonthKey(todayKey);
      const prevMonthAnchor = addDaysToDateKey(currentStart, -1);
      prevStart = getStartOfMonthKey(prevMonthAnchor);
      prevEnd = getEndOfMonthKey(prevMonthAnchor);
      currentLabel = 'This Month';
      previousLabel = 'Last Month';
      break;
    }
    case 'last_7_vs_prev_7': {
      currentEnd = todayKey;
      currentStart = addDaysToDateKey(todayKey, -6);
      prevEnd = addDaysToDateKey(currentStart, -1);
      prevStart = addDaysToDateKey(prevEnd, -6);
      currentLabel = 'Last 7 Days';
      previousLabel = 'Previous 7 Days';
      break;
    }
    case 'last_30_vs_prev_30': {
      currentEnd = todayKey;
      currentStart = addDaysToDateKey(todayKey, -29);
      prevEnd = addDaysToDateKey(currentStart, -1);
      prevStart = addDaysToDateKey(prevEnd, -29);
      currentLabel = 'Last 30 Days';
      previousLabel = 'Previous 30 Days';
      break;
    }
  }

  const currentRange: ResolvedDateRange = {
    key: 'custom',
    startDate: currentStart,
    endDate: currentEnd,
    daysCount: diffDaysInclusive(currentStart, currentEnd),
    label: currentLabel,
    bucketMode: 'day',
    isValid: true,
  };

  const prevRange: ResolvedDateRange = {
    key: 'custom',
    startDate: prevStart,
    endDate: prevEnd,
    daysCount: diffDaysInclusive(prevStart, prevEnd),
    label: previousLabel,
    bucketMode: 'day',
    isValid: true,
  };

  const currTasks = calculateTaskStats(rawTasks, categories, currentRange, options);
  const prevTasks = calculateTaskStats(rawTasks, categories, prevRange, options);
  const currFocus = calculateFocusStats(rawSessions, currentRange, null, options);
  const prevFocus = calculateFocusStats(rawSessions, prevRange, null, options);

  const buildMetric = (
    key: string,
    label: string,
    unit: string,
    current: number,
    previous: number
  ): ComparisonMetric => {
    const deltaValue = current - previous;
    if (previous === 0) {
      if (current === 0) {
        return {
          key,
          label,
          unit,
          current,
          previous,
          deltaValue: 0,
          deltaPercent: null,
          trend: 'neutral',
          displayChange: 'No prior data',
        };
      }
      return {
        key,
        label,
        unit,
        current,
        previous,
        deltaValue,
        deltaPercent: null,
        trend: 'up',
        displayChange: `+${current}${unit ? ` ${unit}` : ''} new`,
      };
    }

    const pct = Math.round((deltaValue / previous) * 100);
    return {
      key,
      label,
      unit,
      current,
      previous,
      deltaValue,
      deltaPercent: pct,
      trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral',
      displayChange: `${pct > 0 ? '+' : ''}${pct}%`,
    };
  };

  const metrics: ComparisonMetric[] = [
    buildMetric('completed_tasks', 'Tasks Completed', '', currTasks.completed, prevTasks.completed),
    buildMetric('focus_time', 'Focus Time', 'm', currFocus.totalFocusMinutes, prevFocus.totalFocusMinutes),
    buildMetric(
      'focus_sessions',
      'Focus Sessions',
      '',
      currFocus.totalCompletedSessions,
      prevFocus.totalCompletedSessions
    ),
    buildMetric(
      'completion_rate',
      'Completion Rate',
      '%',
      currTasks.completionRate,
      prevTasks.completionRate
    ),
  ];

  const hasPreviousData =
    prevTasks.total > 0 || prevFocus.totalCompletedSessions > 0;

  return {
    key: comparisonKey,
    currentLabel,
    previousLabel,
    hasPreviousData,
    metrics,
  };
}

// ============================================================================
// 8. PRODUCTIVITY INSIGHTS (FACTUAL, DATA-BACKED ONLY)
// ============================================================================

export function generateProductivityInsights(
  taskStats: TaskAnalyticsResult,
  focusStats: FocusAnalyticsResult,
  comparison: PeriodComparisonResult,
  goalProgress: GoalProgressResult
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];

  if (taskStats.bestDay && taskStats.bestDay.completedCount > 0) {
    insights.push({
      id: 'insight_best_task_day',
      title: 'Most Productive Task Day',
      description: `${taskStats.bestDay.label} recorded your highest completion output with ${taskStats.bestDay.completedCount} task${taskStats.bestDay.completedCount === 1 ? '' : 's'} finished.`,
      tone: 'mint',
      metricHighlight: `${taskStats.bestDay.completedCount} done`,
    });
  }

  if (focusStats.longestDay && focusStats.longestDay.minutes > 0) {
    insights.push({
      id: 'insight_longest_focus_day',
      title: 'Longest Focus Day',
      description: `On ${focusStats.longestDay.label}, you logged ${focusStats.longestDay.minutes} minutes of uninterrupted focus work.`,
      tone: 'pink',
      metricHighlight: `${focusStats.longestDay.minutes}m`,
    });
  }

  if (taskStats.categoryDistribution.length > 0) {
    const topCat = taskStats.categoryDistribution[0];
    insights.push({
      id: 'insight_top_category',
      title: 'Most Active Category',
      description: `${topCat.name} accounts for ${topCat.percent}% of your tasks in this period (${topCat.completed}/${topCat.total} completed).`,
      tone: 'lavender',
      metricHighlight: topCat.name,
    });
  }

  if (focusStats.totalCompletedSessions > 0) {
    insights.push({
      id: 'insight_avg_focus',
      title: 'Average Focus Session',
      description: `Across ${focusStats.totalCompletedSessions} completed session${focusStats.totalCompletedSessions === 1 ? '' : 's'}, your average session lasted ${focusStats.averageSessionMinutes} minutes (longest: ${focusStats.longestSessionMinutes}m).`,
      tone: 'blue',
      metricHighlight: `${focusStats.averageSessionMinutes}m avg`,
    });
  }

  if (comparison.hasPreviousData) {
    const taskComp = comparison.metrics.find((m) => m.key === 'completed_tasks');
    const focusComp = comparison.metrics.find((m) => m.key === 'focus_time');
    if (taskComp && taskComp.deltaPercent !== null) {
      const direction =
        taskComp.deltaPercent > 0
          ? `up ${taskComp.deltaPercent}%`
          : taskComp.deltaPercent < 0
          ? `down ${Math.abs(taskComp.deltaPercent)}%`
          : 'steady';
      insights.push({
        id: 'insight_comparison',
        title: `${comparison.currentLabel} vs ${comparison.previousLabel}`,
        description: `Task completions are ${direction} (${taskComp.current} vs ${taskComp.previous}), and focus time is ${focusComp?.current || 0}m vs ${focusComp?.previous || 0}m.`,
        tone: taskComp.deltaPercent >= 0 ? 'mint' : 'lavender',
        metricHighlight: taskComp.displayChange,
      });
    }
  }

  if (goalProgress.hasAnyEnabledGoal) {
    insights.push({
      id: 'insight_goals',
      title: 'Target Achievement Progress',
      description: `You have reached ${goalProgress.achievedCount} of ${goalProgress.enabledCount} active productivity target${goalProgress.enabledCount === 1 ? '' : 's'}.`,
      tone: goalProgress.achievedCount === goalProgress.enabledCount ? 'mint' : 'blue',
      metricHighlight: `${goalProgress.achievedCount}/${goalProgress.enabledCount}`,
    });
  }

  return insights;
}

// ============================================================================
// 9. UNIFIED DASHBOARD SUMMARY (SINGLE SOURCE OF TRUTH)
// ============================================================================

export function calculateTodayDashboardSummary(
  rawTasks: Task[],
  rawSchedules: Schedule[],
  rawSessions: FocusSession[],
  categories: Category[],
  goals: ProductivityGoals | null,
  options?: { now?: Date; startOfWeek?: 'monday' | 'sunday' }
) {
  const now = options?.now || new Date();
  const todayKey = toLocalDateKey(now);

  const tasks = deduplicateById(rawTasks);
  const todayRange = resolveDateRange('today', { now });
  const weekRange = resolveDateRange('this_week', {
    now,
    startOfWeek: options?.startOfWeek,
  });

  const todayTaskStats = calculateTaskStats(tasks, categories, todayRange, options);
  const weekTaskStats = calculateTaskStats(tasks, categories, weekRange, options);
  const todayFocusStats = calculateFocusStats(rawSessions, todayRange, goals, options);
  const todayScore = calculateProductivityScore(todayTaskStats, todayFocusStats, todayRange, goals);
  const goalProgress = calculateGoalProgress(tasks, rawSessions, goals, options);

  // Today's tasks specifically scheduled/due today for Dashboard's "Today's Tasks" metric
  const tasksDueToday = tasks.filter((t) => t.dueDate === todayKey);
  const todayTasksTotal = tasksDueToday.length;
  const todayTasksCompleted = tasksDueToday.filter((t) => t.isCompleted).length;
  const todayTasksPending = Math.max(0, todayTasksTotal - todayTasksCompleted);
  const todayCompletionRate =
    todayTasksTotal > 0 ? Math.round((todayTasksCompleted / todayTasksTotal) * 100) : 0;

  const todaySchedulesList = expandSchedulesForDate(rawSchedules, todayKey);
  const overdueTasksCount = tasks.filter((t) => isTaskOverdueAt(t, now)).length;
  const urgentImportantCount = tasks.filter(
    (t) => !t.isCompleted && (t.priority === 'urgent_important' || t.priority === 'high')
  ).length;

  return {
    todayTasksTotal,
    todayTasksCompleted,
    todayTasksPending,
    todayCompletionRate,
    todayFocusSeconds: todayFocusStats.totalFocusSeconds,
    todayFocusMinutes: todayFocusStats.totalFocusMinutes,
    todayFocusSessionsCount: todayFocusStats.totalCompletedSessions,
    totalFocusSessions: deduplicateById(rawSessions).filter(
      (s) => s.completed && isWorkFocusMode(s.sessionType)
    ).length,
    todaySchedulesCount: todaySchedulesList.length,
    upcomingSchedulesCount: rawSchedules.filter((s) => (s.startDate || s.date) >= todayKey).length,
    overdueTasksCount,
    urgentImportantCount,
    activeTasksTotal: tasks.filter((t) => !t.isCompleted).length,
    completedTasksTotal: tasks.filter((t) => t.isCompleted).length,
    weeklyTasksCompleted: weekTaskStats.completed,
    weeklyCompletionRate: weekTaskStats.completionRate,
    todayProductivityScore: todayScore.score,
    goalProgress,
  };
}
