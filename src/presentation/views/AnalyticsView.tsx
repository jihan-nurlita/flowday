import React, { useState, useEffect, useMemo } from 'react';
import { useFlow } from '../state/FlowContext';
import { BaseCard, SummaryCard, StatisticsCard } from '../components/cards/AppCards';
import { PrimaryButton, SecondaryButton } from '../components/buttons/AppButtons';
import {
  TrendLineChart,
  PastelBarChart,
  PastelDonutChart,
  ProductivityScoreCard,
} from '../components/analytics/AnalyticsCharts';
import { GoalSettingsModal } from '../components/analytics/GoalSettingsModal';
import {
  TimeRangeKey,
  ComparisonPeriodKey,
  resolveDateRange,
  calculateTaskStats,
  calculateFocusStats,
  calculateProductivityScore,
  calculateGoalProgress,
  calculatePeriodComparison,
  generateProductivityInsights,
  toLocalDateKey,
} from '../../data/services/analytics_service';
import { getTodayDateString } from '../../core/utils/date';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Percent,
  Flame,
  Timer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Lightbulb,
  BookOpen,
  SlidersHorizontal,
  WifiOff,
  BarChart3,
  Award,
  ArrowUpRight,
} from 'lucide-react';

const TIME_RANGE_OPTIONS: { key: TimeRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_7_days', label: 'Last 7 Days' },
  { key: 'last_30_days', label: 'Last 30 Days' },
  { key: 'last_90_days', label: 'Last 90 Days' },
  { key: 'custom', label: 'Custom' },
];

const COMPARISON_OPTIONS: { key: ComparisonPeriodKey; label: string }[] = [
  { key: 'this_week_vs_last_week', label: 'This Week vs Last Week' },
  { key: 'this_month_vs_last_month', label: 'This Month vs Last Month' },
  { key: 'last_7_vs_prev_7', label: 'Last 7 Days vs Prev 7 Days' },
  { key: 'last_30_vs_prev_30', label: 'Last 30 Days vs Prev 30 Days' },
];

function formatDurationHuman(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export const AnalyticsView: React.FC = () => {
  const {
    user,
    tasks,
    focusSessions,
    categories,
    todayReview,
    productivityGoals,
    syncState,
    stats,
    saveDailyReview,
    saveProductivityGoals,
    setActiveTab,
    openQuickCapture,
    t,
  } = useFlow();

  const todayKey = toLocalDateKey(new Date());
  const startOfWeekPref = user?.preferences?.startOfWeek || 'monday';

  // Filter & Comparison State
  const [selectedRangeKey, setSelectedRangeKey] = useState<TimeRangeKey>('last_7_days');
  const [customStartDate, setCustomStartDate] = useState<string>(todayKey);
  const [customEndDate, setCustomEndDate] = useState<string>(todayKey);
  const [comparisonKey, setComparisonKey] = useState<ComparisonPeriodKey>('this_week_vs_last_week');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Reflection Journal State
  const [reflectionInput, setReflectionInput] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (todayReview) {
      setReflectionInput(todayReview.reflection || '');
    }
  }, [todayReview]);

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionInput.trim()) return;
    setIsSavingReflection(true);
    try {
      await saveDailyReview(reflectionInput.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save reflection:', err);
    } finally {
      setIsSavingReflection(false);
    }
  };

  // Resolve Active Date Range
  const resolvedRange = useMemo(
    () =>
      resolveDateRange(selectedRangeKey, {
        startOfWeek: startOfWeekPref,
        customStart: customStartDate,
        customEnd: customEndDate,
      }),
    [selectedRangeKey, startOfWeekPref, customStartDate, customEndDate]
  );

  // Fallback safe range if custom dates are temporarily invalid so charts don't crash
  const calculationRange = useMemo(() => {
    if (resolvedRange.isValid) return resolvedRange;
    return resolveDateRange('last_7_days', { startOfWeek: startOfWeekPref });
  }, [resolvedRange, startOfWeekPref]);

  // Real Analytics Computations
  const taskStats = useMemo(
    () =>
      calculateTaskStats(tasks, categories, calculationRange, {
        startOfWeek: startOfWeekPref,
      }),
    [tasks, categories, calculationRange, startOfWeekPref]
  );

  const focusStats = useMemo(
    () =>
      calculateFocusStats(focusSessions, calculationRange, productivityGoals, {
        startOfWeek: startOfWeekPref,
      }),
    [focusSessions, calculationRange, productivityGoals, startOfWeekPref]
  );

  const productivityScore = useMemo(
    () =>
      calculateProductivityScore(
        taskStats,
        focusStats,
        calculationRange,
        productivityGoals
      ),
    [taskStats, focusStats, calculationRange, productivityGoals]
  );

  const goalProgress = useMemo(
    () =>
      calculateGoalProgress(tasks, focusSessions, productivityGoals, {
        startOfWeek: startOfWeekPref,
      }),
    [tasks, focusSessions, productivityGoals, startOfWeekPref]
  );

  const periodComparison = useMemo(
    () =>
      calculatePeriodComparison(tasks, focusSessions, categories, comparisonKey, {
        startOfWeek: startOfWeekPref,
      }),
    [tasks, focusSessions, categories, comparisonKey, startOfWeekPref]
  );

  const insights = useMemo(
    () =>
      generateProductivityInsights(
        taskStats,
        focusStats,
        periodComparison,
        goalProgress
      ),
    [taskStats, focusStats, periodComparison, goalProgress]
  );

  // Weekly Focus total for Overview card (consistent with unified engine)
  const weeklyFocusStats = useMemo(() => {
    const wkRange = resolveDateRange('this_week', { startOfWeek: startOfWeekPref });
    return calculateFocusStats(focusSessions, wkRange, productivityGoals, {
      startOfWeek: startOfWeekPref,
    });
  }, [focusSessions, startOfWeekPref, productivityGoals]);

  const hasAnyWorkspaceData = tasks.length > 0 || focusSessions.length > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* ==================================================================== */}
      {/* 1. HEADER & TIME RANGE FILTER BAR                                    */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
            {t.analytics.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
            {t.analytics.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <SecondaryButton
            size="sm"
            onClick={() => setIsGoalModalOpen(true)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#A995D8]" />
            <span>{t.analytics.configureGoals}</span>
          </SecondaryButton>
        </div>
      </div>

      {/* Offline Awareness Notice */}
      {!syncState.isOnline && (
        <div className="p-3.5 rounded-2xl bg-[#EEF5FC] dark:bg-[#1E2C3D] border border-[#A9C8E8]/50 flex items-center gap-2.5 text-xs text-[#2B5885] dark:text-[#A9C8E8]">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            {t.analytics.offlineNotice}
          </span>
        </div>
      )}

      {/* Time Range Selector Bar */}
      <div className="p-3 sm:p-4 bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {TIME_RANGE_OPTIONS.map((opt) => {
              const active = selectedRangeKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedRangeKey(opt.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#A995D8] text-white shadow-xs'
                      : 'bg-[#FAF9FC] dark:bg-[#17151D] text-[#898493] dark:text-[#9E99A8] hover:text-[#34313D] dark:hover:text-[#F4F2F7] border border-[#EEEAF2] dark:border-[#2D2838]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#898493] dark:text-[#9E99A8] shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#A995D8]" />
            <span className="font-medium text-[#34313D] dark:text-[#F4F2F7]">
              {calculationRange.label}
            </span>
            <span className="font-mono tabular-nums text-[11px]">
              ({calculationRange.startDate} → {calculationRange.endDate})
            </span>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {selectedRangeKey === 'custom' && (
          <div className="pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838] flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#898493] dark:text-[#9E99A8]">
                Start:
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] focus:outline-none focus:border-[#A995D8]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#898493] dark:text-[#9E99A8]">
                End:
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] focus:outline-none focus:border-[#A995D8]"
              />
            </div>

            {!resolvedRange.isValid && resolvedRange.error && (
              <span className="text-xs font-medium text-[#E07A5F] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {resolvedRange.error}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Empty Workspace Banner (if brand-new user with 0 tasks & 0 sessions) */}
      {!hasAnyWorkspaceData && (
        <BaseCard className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-[#F4F1FA] dark:bg-[#2C253B] text-[#A995D8] flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
            No Productivity Data Yet
          </h3>
          <p className="text-xs text-[#898493] dark:text-[#9E99A8] max-w-md mx-auto mt-1 mb-4">
            FlowDay calculates all statistics strictly from your real activity. Create a task or complete a focus session to unlock live trends and insights.
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <PrimaryButton size="sm" onClick={() => openQuickCapture('task')}>
              Add First Task
            </PrimaryButton>
            <SecondaryButton size="sm" onClick={() => setActiveTab('focus')}>
              Start Focus Timer
            </SecondaryButton>
          </div>
        </BaseCard>
      )}

      {/* ==================================================================== */}
      {/* 2. STATISTICS OVERVIEW (8 GENUINE KPI CARDS)                         */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          label={t.analytics.tasksCompleted}
          value={taskStats.completed}
          subValue={`of ${taskStats.total} in range`}
          icon={CheckCircle2}
          iconColor="#B5DCCB"
          progressPercent={taskStats.completionRate}
          progressColor="#B5DCCB"
        />

        <SummaryCard
          label={t.analytics.tasksPending}
          value={taskStats.pending + taskStats.inProgress}
          subValue={
            taskStats.inProgress > 0
              ? `${taskStats.inProgress} in progress`
              : 'remaining'
          }
          icon={Clock}
          iconColor="#A995D8"
        />

        <SummaryCard
          label={t.analytics.tasksOverdue}
          value={taskStats.overdue}
          subValue={taskStats.overdue === 0 ? 'All on track' : 'need attention'}
          icon={AlertTriangle}
          iconColor={taskStats.overdue > 0 ? '#E07A5F' : '#A9C8E8'}
        />

        <SummaryCard
          label={t.analytics.completionRate}
          value={`${taskStats.completionRate}%`}
          subValue={calculationRange.label}
          icon={Percent}
          iconColor="#A995D8"
          progressPercent={taskStats.completionRate}
          progressColor="#A995D8"
        />

        <SummaryCard
          label={t.analytics.totalFocusTime}
          value={formatDurationHuman(focusStats.totalFocusMinutes)}
          subValue={`${focusStats.totalFocusMinutes} mins`}
          icon={Flame}
          iconColor="#F1B8CC"
        />

        <SummaryCard
          label={t.analytics.focusSessions}
          value={focusStats.totalCompletedSessions}
          subValue={
            focusStats.averageSessionMinutes > 0
              ? `${focusStats.averageSessionMinutes}m avg`
              : 'completed'
          }
          icon={Timer}
          iconColor="#A9C8E8"
        />

        <SummaryCard
          label={t.analytics.dailyProductivity}
          value={`${stats.todayTasksCompleted}/${stats.todayTasksTotal}`}
          subValue={`${stats.todayFocusMinutes}m focus today`}
          icon={Award}
          iconColor="#B5DCCB"
          progressPercent={stats.todayCompletionRate}
          progressColor="#B5DCCB"
        />

        <SummaryCard
          label={t.analytics.weeklyProductivity}
          value={`${stats.weeklyTasksCompleted}`}
          subValue={`done · ${formatDurationHuman(weeklyFocusStats.totalFocusMinutes)} focus`}
          icon={TrendingUp}
          iconColor="#A995D8"
          progressPercent={stats.weeklyCompletionRate}
          progressColor="#A995D8"
        />
      </div>

      {/* ==================================================================== */}
      {/* 3. PRODUCTIVITY SCORE & PRODUCTIVITY GOALS                           */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductivityScoreCard scoreResult={productivityScore} />

        {/* Productivity Goals Card */}
        <BaseCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EBF7F2] dark:bg-[#1E3329] flex items-center justify-center text-[#B5DCCB]">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                    Productivity Goals
                  </h3>
                  <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                    {goalProgress.hasAnyEnabledGoal
                      ? `${goalProgress.achievedCount} of ${goalProgress.enabledCount} active targets reached`
                      : 'Define daily and weekly targets to track progress'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGoalModalOpen(true)}
                className="text-xs font-semibold text-[#A995D8] hover:underline cursor-pointer"
              >
                Edit Targets
              </button>
            </div>

            {!goalProgress.hasAnyEnabledGoal ? (
              <div className="py-8 px-4 text-center rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-dashed border-[#EEEAF2] dark:border-[#2D2838]">
                <Target className="w-6 h-6 text-[#898493]/60 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                  No Active Goals Configured
                </p>
                <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-1 mb-3">
                  Enable daily or weekly task and focus goals to monitor your target achievement.
                </p>
                <SecondaryButton size="sm" onClick={() => setIsGoalModalOpen(true)}>
                  Set Productivity Goals
                </SecondaryButton>
              </div>
            ) : (
              <div className="space-y-3.5">
                {goalProgress.items
                  .filter((item) => item.enabled)
                  .map((item) => {
                    const barColor = item.achieved
                      ? '#B5DCCB'
                      : item.key.includes('Focus')
                      ? '#F1B8CC'
                      : '#A995D8';
                    return (
                      <div key={item.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                              {item.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FAF9FC] dark:bg-[#17151D] text-[#898493] dark:text-[#9E99A8] border border-[#EEEAF2] dark:border-[#2D2838]">
                              {item.periodLabel}
                            </span>
                            {item.achieved && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF7F2] text-[#28634B] dark:bg-[#1E3329] dark:text-[#B5DCCB]">
                                Achieved
                              </span>
                            )}
                          </div>

                          <span className="font-mono tabular-nums font-bold text-[#34313D] dark:text-[#F4F2F7]">
                            {item.current} / {item.target} {item.unit}
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.percent}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </BaseCard>
      </div>

      {/* ==================================================================== */}
      {/* 4. TASK ANALYTICS SECTION                                            */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
              Task Analytics
            </h3>
            <p className="text-xs text-[#898493] dark:text-[#9E99A8]">
              Completion trends, mutually exclusive status breakdown, priority mix, and category share
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatisticsCard
            title="Task Completion Trend"
            subtitle={`Completed tasks over ${calculationRange.label}`}
            action={
              taskStats.bestDay && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EBF7F2] text-[#28634B] dark:bg-[#1E3329] dark:text-[#B5DCCB]">
                  Peak: {taskStats.bestDay.label} ({taskStats.bestDay.completedCount})
                </span>
              )
            }
          >
            <TrendLineChart
              data={taskStats.completionTrend}
              color="#A995D8"
              unitLabel=" tasks"
              emptyMessage="No completed tasks recorded in this date range."
            />
          </StatisticsCard>

          <StatisticsCard
            title="Task Status Distribution"
            subtitle="Each scoped task belongs to one exclusive status bucket"
          >
            <PastelDonutChart
              segments={taskStats.statusDistribution.map((s) => ({
                key: s.key,
                label: s.label,
                value: s.count,
                percent: s.percent,
                color: s.color,
              }))}
              centerValue={taskStats.total}
              centerLabel="Scoped Tasks"
              emptyMessage="No tasks due or completed within this date range."
            />
          </StatisticsCard>

          {/* Priority Distribution */}
          <StatisticsCard
            title="Priority Distribution"
            subtitle="Task workload grouped by priority level"
          >
            {taskStats.total === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-[#898493] dark:text-[#9E99A8] rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-dashed border-[#EEEAF2] dark:border-[#2D2838]">
                No tasks in this period to break down by priority.
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {taskStats.priorityDistribution.map((p) => (
                  <div key={p.key}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                          {p.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] text-[#898493] dark:text-[#9E99A8]">
                        <span>
                          {p.completed}/{p.total} done
                        </span>
                        <span className="font-bold text-[#34313D] dark:text-[#F4F2F7]">
                          ({p.percent}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[#FAF9FC] dark:bg-[#17151D] h-2 rounded-full overflow-hidden border border-[#EEEAF2] dark:border-[#2D2838]">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${p.percent}%`,
                          backgroundColor: p.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StatisticsCard>

          {/* Category Distribution */}
          <StatisticsCard
            title="Category Distribution"
            subtitle="Tasks grouped by workspace category"
          >
            {taskStats.categoryDistribution.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-[#898493] dark:text-[#9E99A8] rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-dashed border-[#EEEAF2] dark:border-[#2D2838]">
                No categorized tasks in this date range.
              </div>
            ) : (
              <div className="space-y-3.5 pt-1 max-h-60 overflow-y-auto pr-1">
                {taskStats.categoryDistribution.map((cat) => (
                  <div key={cat.categoryId}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7] truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] text-[#898493] dark:text-[#9E99A8] shrink-0">
                        <span>
                          {cat.completed}/{cat.total} done
                        </span>
                        <span className="font-bold text-[#34313D] dark:text-[#F4F2F7]">
                          ({cat.percent}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[#FAF9FC] dark:bg-[#17151D] h-2 rounded-full overflow-hidden border border-[#EEEAF2] dark:border-[#2D2838]">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StatisticsCard>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. FOCUS ANALYTICS SECTION                                           */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
              Focus Analytics
            </h3>
            <p className="text-xs text-[#898493] dark:text-[#9E99A8]">
              Includes completed work sessions with paused duration subtracted; cancelled timers excluded
            </p>
          </div>
          {focusStats.goalAchievementPercent !== null && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FDF2F6] text-[#B84A73] dark:bg-[#331E2A] dark:text-[#F1B8CC] self-start sm:self-auto">
              Focus Goal Achievement: {focusStats.goalAchievementPercent}%
            </span>
          )}
        </div>

        {/* Focus Mini-KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-[11px] font-medium text-[#898493] dark:text-[#9E99A8]">
              Average Session
            </span>
            <p className="text-xl font-bold font-mono tabular-nums text-[#34313D] dark:text-[#F4F2F7] mt-1">
              {focusStats.averageSessionMinutes}m
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-[11px] font-medium text-[#898493] dark:text-[#9E99A8]">
              Longest Session
            </span>
            <p className="text-xl font-bold font-mono tabular-nums text-[#34313D] dark:text-[#F4F2F7] mt-1">
              {focusStats.longestSessionMinutes}m
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-[11px] font-medium text-[#898493] dark:text-[#9E99A8]">
              Daily Focus Target
            </span>
            <p className="text-xl font-bold font-mono tabular-nums text-[#34313D] dark:text-[#F4F2F7] mt-1">
              {focusStats.dailyFocusGoalMinutes ? `${focusStats.dailyFocusGoalMinutes}m` : 'Off'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-[11px] font-medium text-[#898493] dark:text-[#9E99A8]">
              Goal Achievement
            </span>
            <p className="text-xl font-bold font-mono tabular-nums text-[#34313D] dark:text-[#F4F2F7] mt-1">
              {focusStats.goalAchievementPercent !== null
                ? `${focusStats.goalAchievementPercent}%`
                : '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatisticsCard
            title="Daily Focus Time"
            subtitle="Completed focus minutes per bucket"
          >
            <PastelBarChart
              data={focusStats.dailyFocusTrend}
              color="#F1B8CC"
              unitLabel="m"
              emptyMessage="No completed Pomodoro or Deep Work sessions in this range."
            />
          </StatisticsCard>

          <StatisticsCard
            title="Focus Session Trend"
            subtitle="Number of completed sessions over time"
          >
            <TrendLineChart
              data={focusStats.sessionCountTrend}
              color="#A9C8E8"
              unitLabel=" sessions"
              emptyMessage="Complete a focus session to view session frequency trends."
            />
          </StatisticsCard>

          <StatisticsCard
            title="Focus Mode Distribution"
            subtitle="Sessions split by timer mode"
          >
            <PastelDonutChart
              segments={focusStats.modeDistribution.map((m) => ({
                key: m.mode,
                label: m.label,
                value: m.sessions,
                percent: m.percent,
                color: m.color,
              }))}
              centerValue={focusStats.allCompletedLogsCount}
              centerLabel="All Logs"
              emptyMessage="No completed timer logs in this period."
            />
          </StatisticsCard>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. PERIOD COMPARISON & PRODUCTIVITY INSIGHTS                         */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Period Comparison */}
        <BaseCard>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                Period Comparison
              </h3>
              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                {periodComparison.currentLabel} vs {periodComparison.previousLabel}
              </p>
            </div>

            <select
              value={comparisonKey}
              onChange={(e) => setComparisonKey(e.target.value as ComparisonPeriodKey)}
              aria-label="Select comparison period"
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] focus:outline-none focus:border-[#A995D8] cursor-pointer"
            >
              {COMPARISON_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {periodComparison.metrics.map((m) => {
              const badgeClass =
                m.trend === 'up'
                  ? 'bg-[#EBF7F2] text-[#28634B] dark:bg-[#1E3329] dark:text-[#B5DCCB]'
                  : m.trend === 'down'
                  ? 'bg-[#FCF3F0] text-[#E07A5F] dark:bg-[#331C18] dark:text-[#F29479]'
                  : 'bg-[#FAF9FC] text-[#898493] dark:bg-[#17151D] dark:text-[#9E99A8]';

              return (
                <div
                  key={m.key}
                  className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-medium text-[#898493] dark:text-[#9E99A8]">
                      {m.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums ${badgeClass}`}
                    >
                      {m.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : m.trend === 'down' ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      {m.displayChange}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono tabular-nums text-[#34313D] dark:text-[#F4F2F7]">
                      {m.current}
                      {m.unit}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-[#898493] dark:text-[#9E99A8]">
                      prev: {m.previous}
                      {m.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </BaseCard>

        {/* Productivity Insights */}
        <BaseCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F4F1FA] dark:bg-[#2C253B] flex items-center justify-center text-[#A995D8]">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  Productivity Insights
                </h3>
                <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                  Factual observations from your selected period
                </p>
              </div>
            </div>
          </div>

          {insights.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-dashed border-[#EEEAF2] dark:border-[#2D2838]">
              <Lightbulb className="w-6 h-6 text-[#898493]/50 mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                Not Enough Data for Insights Yet
              </p>
              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-1 max-w-xs mx-auto">
                Complete tasks or focus sessions to generate meaningful patterns about your peak hours, categories, and trends.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {insights.map((insight) => {
                const toneClasses = {
                  mint: 'bg-[#EBF7F2]/70 dark:bg-[#1E3329]/50 border-[#B5DCCB]/40',
                  pink: 'bg-[#FDF2F6]/70 dark:bg-[#331E2A]/50 border-[#F1B8CC]/40',
                  blue: 'bg-[#EEF5FC]/70 dark:bg-[#1E2C3D]/50 border-[#A9C8E8]/40',
                  lavender: 'bg-[#F4F1FA]/70 dark:bg-[#2C253B]/50 border-[#A995D8]/40',
                }[insight.tone];

                return (
                  <div
                    key={insight.id}
                    className={`p-3.5 rounded-xl border ${toneClasses} flex items-start justify-between gap-3`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#A995D8] shrink-0" />
                        <h4 className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                          {insight.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-1 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                    {insight.metricHighlight && (
                      <span className="shrink-0 px-2 py-0.5 rounded-lg bg-white/80 dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] text-[10px] font-mono font-bold text-[#34313D] dark:text-[#F4F2F7]">
                        {insight.metricHighlight}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </BaseCard>
      </div>

      {/* ==================================================================== */}
      {/* 7. TODAY'S REFLECTION JOURNAL (PRESERVED FEATURE)                    */}
      {/* ==================================================================== */}
      <BaseCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#A995D8]" />
            <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
              {t.analytics.reflectionTitle}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#898493] dark:text-[#9E99A8]">
            Date: {getTodayDateString()}
          </span>
        </div>

        <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-3">
          Evaluate what went well, obstacles encountered, and your top priority for tomorrow.
        </p>

        <form onSubmit={handleSaveReflection}>
          <textarea
            rows={4}
            placeholder="What went well today? What distracted you? What is your single top priority for tomorrow morning?"
            value={reflectionInput}
            onChange={(e) => setReflectionInput(e.target.value)}
            className="w-full p-3.5 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] resize-none transition-colors text-[#34313D] dark:text-[#F4F2F7]"
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-[#898493]">
              {saveSuccess && (
                <span className="text-[#28634B] dark:text-[#B5DCCB] font-semibold">
                  Reflection saved!
                </span>
              )}
            </span>

            <PrimaryButton
              type="submit"
              size="sm"
              disabled={isSavingReflection || !reflectionInput.trim()}
              isLoading={isSavingReflection}
            >
              {t.analytics.saveReflection}
            </PrimaryButton>
          </div>
        </form>
      </BaseCard>

      {/* Goal Configuration Modal */}
      <GoalSettingsModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goals={productivityGoals}
        onSave={async (updates) => {
          await saveProductivityGoals(updates);
        }}
      />
    </div>
  );
};
