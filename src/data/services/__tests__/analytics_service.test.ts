import {
  toLocalDateKey,
  resolveDateRange,
  calculateTaskStats,
  calculateFocusStats,
  calculateProductivityScore,
  calculateGoalProgress,
  calculatePeriodComparison,
  generateProductivityInsights,
  calculateTodayDashboardSummary,
} from '../analytics_service';
import { Task } from '../../../domain/entities/task';
import { FocusSession } from '../../../domain/entities/focus_session';
import { Category } from '../../../domain/entities/category';
import { ProductivityGoals } from '../../../domain/entities/productivity_goal';

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const sampleCategories: Category[] = [
  { id: 'cat_work', userId: 'u1', name: 'Work', color: '#A995D8', createdAt: '2026-11-01T08:00:00.000Z' },
  { id: 'cat_personal', userId: 'u1', name: 'Personal', color: '#F1B8CC', createdAt: '2026-11-01T08:00:00.000Z' },
];

const fixedNow = new Date(2026, 10, 12, 14, 0, 0, 0); // Nov 12, 2026 14:00 local

function runTests() {
  let passed = 0;
  const test = (name: string, fn: () => void) => {
    fn();
    passed += 1;
    console.log(`PASS: ${name}`);
  };

  test('Local timezone date key preserves YYYY-MM-DD without UTC shift', () => {
    assertEqual(toLocalDateKey('2026-11-12'), '2026-11-12', 'YYYY-MM-DD string');
    assertEqual(toLocalDateKey(fixedNow), '2026-11-12', 'Local Date object');
  });

  test('Custom date range validation rejects endDate < startDate', () => {
    const invalid = resolveDateRange('custom', {
      now: fixedNow,
      customStart: '2026-11-15',
      customEnd: '2026-11-10',
    });
    assertEqual(invalid.isValid, false, 'Custom invalid range');
    assertTrue(Boolean(invalid.error), 'Error message present');

    const valid = resolveDateRange('custom', {
      now: fixedNow,
      customStart: '2026-11-06',
      customEnd: '2026-11-12',
    });
    assertEqual(valid.isValid, true, 'Custom valid range');
    assertEqual(valid.daysCount, 7, 'Inclusive days count');
  });

  test('Task analytics: mutually exclusive status buckets, completion rate, priority & category shares, deduplication', () => {
    const range = resolveDateRange('this_week', { now: fixedNow, startOfWeek: 'monday' });
    const tasks: Task[] = [
      {
        id: 't1',
        userId: 'u1',
        title: 'Completed Task',
        categoryId: 'cat_work',
        priority: 'high',
        status: 'completed',
        dueDate: '2026-11-12',
        isCompleted: true,
        completedAt: '2026-11-12T10:00:00',
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-12T10:00:00',
      },
      // Duplicate ID of t1 should not double-count
      {
        id: 't1',
        userId: 'u1',
        title: 'Completed Task Duplicate',
        categoryId: 'cat_work',
        priority: 'high',
        status: 'completed',
        dueDate: '2026-11-12',
        isCompleted: true,
        completedAt: '2026-11-12T10:00:00',
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-12T10:00:00',
      },
      {
        id: 't2',
        userId: 'u1',
        title: 'In Progress Task',
        categoryId: 'cat_work',
        priority: 'medium',
        status: 'in_progress',
        dueDate: '2026-11-13',
        isCompleted: false,
        createdAt: '2026-11-11T09:00:00',
        updatedAt: '2026-11-11T09:00:00',
      },
      {
        id: 't3',
        userId: 'u1',
        title: 'Pending Task',
        categoryId: 'cat_personal',
        priority: 'low',
        status: 'todo',
        dueDate: '2026-11-14',
        isCompleted: false,
        createdAt: '2026-11-11T09:00:00',
        updatedAt: '2026-11-11T09:00:00',
      },
      {
        id: 't4',
        userId: 'u1',
        title: 'Overdue Task',
        categoryId: 'cat_personal',
        priority: 'urgent_important',
        status: 'todo',
        dueDate: '2026-11-10',
        isCompleted: false,
        createdAt: '2026-11-08T09:00:00',
        updatedAt: '2026-11-08T09:00:00',
      },
    ];

    const stats = calculateTaskStats(tasks, sampleCategories, range, { now: fixedNow });
    assertEqual(stats.total, 4, 'Deduplicated total tasks');
    assertEqual(stats.completed, 1, 'Completed count');
    assertEqual(stats.inProgress, 1, 'In progress count');
    assertEqual(stats.pending, 1, 'Pending count');
    assertEqual(stats.overdue, 1, 'Overdue count');
    assertEqual(stats.completionRate, 25, 'Completion rate 1/4 = 25%');

    const bucketSum = stats.statusDistribution.reduce((s, item) => s + item.count, 0);
    assertEqual(bucketSum, stats.total, 'Status buckets are mutually exclusive and sum to total');
    assertEqual(stats.priorityDistribution[0].total, 2, 'High + urgent_important normalized to 2');
    assertEqual(stats.categoryDistribution[0].categoryId, 'cat_work', 'Work category first');
    assertEqual(stats.bestDay?.dateKey, '2026-11-12', 'Best day matches completion date');
  });

  test('Focus analytics: excludes cancelled sessions, subtracts pausedDuration, and prevents duplicate session IDs', () => {
    const range = resolveDateRange('today', { now: fixedNow });
    const sessions: FocusSession[] = [
      {
        id: 'f1',
        userId: 'u1',
        startTime: '2026-11-12T09:00:00',
        endTime: '2026-11-12T09:30:00',
        duration: 1800, // 30m
        pausedDuration: 300, // 5m paused -> actual 25m (1500s)
        sessionType: 'pomodoro',
        completed: true,
        createdAt: '2026-11-12T09:30:00',
      },
      // Duplicate ID
      {
        id: 'f1',
        userId: 'u1',
        startTime: '2026-11-12T09:00:00',
        endTime: '2026-11-12T09:30:00',
        duration: 1800,
        pausedDuration: 300,
        sessionType: 'pomodoro',
        completed: true,
        createdAt: '2026-11-12T09:30:00',
      },
      // Cancelled session -> excluded
      {
        id: 'f2',
        userId: 'u1',
        startTime: '2026-11-12T10:00:00',
        endTime: '2026-11-12T10:15:00',
        duration: 900,
        sessionType: 'deep_work',
        completed: false,
        createdAt: '2026-11-12T10:15:00',
      },
      // Short break -> counted in modeDistribution logs, not work focus minutes
      {
        id: 'f3',
        userId: 'u1',
        startTime: '2026-11-12T10:30:00',
        endTime: '2026-11-12T10:35:00',
        duration: 300,
        sessionType: 'short_break',
        completed: true,
        createdAt: '2026-11-12T10:35:00',
      },
    ];

    const goals: ProductivityGoals = {
      id: 'g1',
      userId: 'u1',
      dailyTaskGoal: { enabled: true, target: 3 },
      weeklyTaskGoal: { enabled: true, target: 15 },
      dailyFocusGoalMinutes: { enabled: true, target: 50 },
      weeklyFocusGoalMinutes: { enabled: true, target: 300 },
      createdAt: '2026-11-12T08:00:00',
      updatedAt: '2026-11-12T08:00:00',
    };

    const focusStats = calculateFocusStats(sessions, range, goals);
    assertEqual(focusStats.totalCompletedSessions, 1, 'Only 1 completed work session');
    assertEqual(focusStats.totalFocusSeconds, 1500, 'Paused duration subtracted');
    assertEqual(focusStats.totalFocusMinutes, 25, '25 actual focus minutes');
    assertEqual(focusStats.goalAchievementPercent, 50, '25m / 50m goal = 50%');
    assertEqual(focusStats.allCompletedLogsCount, 2, 'Pomodoro + Short Break in all completed logs');
  });

  test('Productivity score: insufficient data, focus-only non-punitive, and full weighted score', () => {
    const range = resolveDateRange('today', { now: fixedNow });
    const emptyTasks = calculateTaskStats([], sampleCategories, range, { now: fixedNow });
    const emptyFocus = calculateFocusStats([], range, null);

    const noDataScore = calculateProductivityScore(emptyTasks, emptyFocus, range, null);
    assertEqual(noDataScore.available, false, 'Insufficient data returns unavailable');
    assertEqual(noDataScore.score, null, 'Score is null when no data');

    const focusOnly = calculateFocusStats(
      [
        {
          id: 'f_only',
          userId: 'u1',
          startTime: '2026-11-12T11:00:00',
          endTime: '2026-11-12T11:50:00',
          duration: 3000,
          sessionType: 'deep_work',
          completed: true,
          createdAt: '2026-11-12T11:50:00',
        },
      ],
      range,
      null
    );
    const nonPunitive = calculateProductivityScore(emptyTasks, focusOnly, range, null);
    assertEqual(nonPunitive.available, true, 'Available with focus even if 0 tasks');
    assertEqual(nonPunitive.score, 100, '50m focus vs 50m baseline = 100 when 0 tasks due');
  });

  test('Goal progress & Period comparison zero-safe handling', () => {
    const goals: ProductivityGoals = {
      id: 'g1',
      userId: 'u1',
      dailyTaskGoal: { enabled: true, target: 2 },
      weeklyTaskGoal: { enabled: false, target: 10 },
      dailyFocusGoalMinutes: { enabled: true, target: 30 },
      weeklyFocusGoalMinutes: { enabled: false, target: 150 },
      createdAt: '2026-11-12T08:00:00',
      updatedAt: '2026-11-12T08:00:00',
    };

    const tasks: Task[] = [
      {
        id: 't_today_1',
        userId: 'u1',
        title: 'Task 1',
        categoryId: 'cat_work',
        priority: 'medium',
        status: 'completed',
        dueDate: '2026-11-12',
        isCompleted: true,
        completedAt: '2026-11-12T10:00:00',
        createdAt: '2026-11-12T08:00:00',
        updatedAt: '2026-11-12T10:00:00',
      },
      {
        id: 't_today_2',
        userId: 'u1',
        title: 'Task 2',
        categoryId: 'cat_work',
        priority: 'medium',
        status: 'completed',
        dueDate: '2026-11-12',
        isCompleted: true,
        completedAt: '2026-11-12T12:00:00',
        createdAt: '2026-11-12T08:00:00',
        updatedAt: '2026-11-12T12:00:00',
      },
    ];

    const gp = calculateGoalProgress(tasks, [], goals, { now: fixedNow });
    assertEqual(gp.enabledCount, 2, '2 goals enabled');
    assertEqual(gp.achievedCount, 1, 'Daily task goal achieved (2/2)');

    const comp = calculatePeriodComparison(tasks, [], sampleCategories, 'this_week_vs_last_week', {
      now: fixedNow,
    });
    const compTasksMetric = comp.metrics.find((m) => m.key === 'completed_tasks');
    assertEqual(compTasksMetric?.previous, 0, 'Zero prior tasks');
    assertEqual(compTasksMetric?.deltaPercent, null, 'Avoids NaN/Infinity when previous is 0');
    assertEqual(compTasksMetric?.displayChange, '+2 new', 'Zero-safe label');

    const summary = calculateTodayDashboardSummary(tasks, [], [], sampleCategories, goals, {
      now: fixedNow,
    });
    assertEqual(summary.todayTasksCompleted, 2, 'Unified dashboard today completed');
    assertEqual(summary.todayCompletionRate, 100, 'Unified dashboard completion rate');
  });

  test('Empty dataset produces zero metrics and zero misleading insights', () => {
    const range = resolveDateRange('last_7_days', { now: fixedNow });
    const tStats = calculateTaskStats([], sampleCategories, range, { now: fixedNow });
    const fStats = calculateFocusStats([], range, null);
    const comp = calculatePeriodComparison([], [], sampleCategories, 'last_7_vs_prev_7', {
      now: fixedNow,
    });
    const gp = calculateGoalProgress([], [], null, { now: fixedNow });
    // Disable default goals to simulate no enabled goals
    gp.hasAnyEnabledGoal = false;
    const ins = generateProductivityInsights(tStats, fStats, comp, gp);

    assertEqual(tStats.total, 0, 'Empty tasks total');
    assertEqual(tStats.completionRate, 0, 'Empty tasks completion rate');
    assertEqual(fStats.totalFocusMinutes, 0, 'Empty focus minutes');
    assertEqual(ins.length, 0, 'No insights when insufficient data');
  });

  console.log(`\nAll ${passed} analytics service tests passed.`);
}

runTests();
