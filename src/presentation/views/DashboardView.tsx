import React, { useMemo, useState } from 'react';
import { useFlow } from '../state/FlowContext';
import { BaseCard, ScheduleCard, TaskCard, NoteCard } from '../components/cards/AppCards';
import { NoteEditorModal } from '../components/notes/NoteEditorModal';
import { NoteDetailModal } from '../components/notes/NoteDetailModal';
import { Note } from '../../domain/entities/note';
import { PrimaryButton, SecondaryButton } from '../components/buttons/AppButtons';
import { EmptyState } from '../components/feedback/AppFeedback';
import { formatFullDate, getTodayDateString, formatRelativeTime } from '../../core/utils/date';
import { expandSchedulesForDate } from '../../core/utils/calendar';
import {
  CheckCircle2,
  CalendarDays,
  Flame,
  Target,
  ArrowRight,
  Plus,
  Sparkles,
  Calendar,
  CheckSquare,
  Bell,
  Clock,
  StickyNote,
  Timer,
  CalendarPlus,
  Activity,
  User as UserIcon,
  Circle,
  FileText,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';

// Curated rotating motivational quotes (no external API call)
const MOTIVATIONAL_QUOTES = [
  { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { quote: "Plan your day, find your flow, and celebrate the small wins.", author: "FlowDay" },
  { quote: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "Your focus determines your reality.", author: "Daniel Goleman" },
  { quote: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
];

export const DashboardView: React.FC = () => {
  const {
    user,
    tasks,
    schedules,
    notes,
    stats,
    activities,
    notifications,
    setActiveTab,
    toggleTaskComplete,
    deleteTask,
    deleteSchedule,
    toggleNotePin,
    toggleNoteFavorite,
    deleteNote,
    openQuickCapture,
    openNotifications,
    openProfile,
    timerState,
    t,
    language,
  } = useFlow();

  const [activeDetailNote, setActiveDetailNote] = useState<Note | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

  const today = getTodayDateString();

  // 1. Time-based Greeting & Device Date
  const currentHour = new Date().getHours();
  const greetingText =
    currentHour < 12
      ? t.dashboard.goodMorning
      : currentHour < 17
      ? t.dashboard.goodAfternoon
      : t.dashboard.goodEvening;

  const userDisplayName = user?.fullName || user?.name || 'FlowDay Explorer';
  const firstName = userDisplayName.trim().split(' ')[0] || 'Explorer';

  // Initials fallback generator
  const userInitials = useMemo(() => {
    if (!userDisplayName) return 'FD';
    const parts = userDisplayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [userDisplayName]);

  // Unread notifications count
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  // 2. Curated daily motivational message based on day of year
  const dailyQuote = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  }, []);

  // 3. Today's Agenda (Chronological order)
  const todaySchedules = useMemo(() => {
    return expandSchedulesForDate(schedules, today).map((o) => o.schedule);
  }, [schedules, today]);

  // Next upcoming event for today
  const nextSchedule = useMemo(() => {
    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    return (
      todaySchedules.find((s) => s.endTime >= currentHourMin) ||
      todaySchedules[todaySchedules.length - 1] ||
      null
    );
  }, [todaySchedules]);

  // 4. Priority Tasks (High Priority / Urgent & Important not completed)
  const priorityTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          !t.isCompleted &&
          (t.priority === 'high' || t.priority === 'urgent_important' || t.priority === 'urgent')
      )
      .sort((a, b) => {
        // Sort by closest due date first
        const dateA = a.dueDate || '9999-99-99';
        const dateB = b.dueDate || '9999-99-99';
        return dateA.localeCompare(dateB);
      });
  }, [tasks]);

  // 5. Recent Active Notes (ordered by last updated or created)
  const recentActiveNotes = useMemo(() => {
    return notes
      .filter((n) => !n.isDeleted)
      .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
  }, [notes]);

  // 6. SVG Ring Progress calculations for Productivity Summary (unified with analytics_service)
  const summaryDisplayPercent =
    stats.todayProductivityScore !== null
      ? stats.todayProductivityScore
      : stats.todayCompletionRate;
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset =
    ringCircumference - (summaryDisplayPercent / 100) * ringCircumference;

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. DASHBOARD HEADER                                            */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-[0_2px_16px_rgba(52,49,61,0.02)]">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
          

          {/* Greeting, User Name, and Today's Local Date */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A995D8]">
                {formatFullDate(new Date(), language)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7] mt-0.5 truncate">
              {greetingText}, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5 line-clamp-1">
              {t.dashboard.subtitle}
            </p>
          </div>
        </div>

        {/* Header Quick Actions: Notifications & Profile Trigger */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Notifications Button with badge */}
          <button
            type="button"
            onClick={openNotifications}
            className="relative p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#A995D8] hover:border-[#A995D8]/40 transition-all cursor-pointer"
            title="View Notifications"
            aria-label="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#A995D8] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Profile Shortcut Button */}
          <button
            type="button"
            onClick={openProfile}
            className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#A995D8] hover:border-[#A995D8]/40 transition-all cursor-pointer"
            title="User Profile"
            aria-label="User Profile"
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      

      {/* ============================================================== */}
      {/* 2. DAILY OVERVIEW (4 Metric Cards with Real Computed Values)  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today's Tasks */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="p-4 sm:p-5 bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8]/50 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] mb-2.5">
            <span className="text-xs font-semibold">{t.dashboard.todaysTasks}</span>
            <div className="w-8 h-8 rounded-xl bg-[#F4F1FA] dark:bg-[#2C253B] flex items-center justify-center text-[#A995D8] group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#34313D] dark:text-[#F4F2F7] tabular-nums">
              {stats.todayTasksCompleted}
              <span className="text-sm font-normal text-[#898493] dark:text-[#9E99A8] font-sans">
                /{stats.todayTasksTotal}
              </span>
            </span>
            <span className="text-xs text-[#898493] dark:text-[#9E99A8] font-medium">
              {stats.todayTasksPending} {t.dashboard.pendingLabel}
            </span>
          </div>
          {/* Real progress bar */}
          <div className="w-full bg-[#EEEAF2] dark:bg-[#2D2838] h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[#A995D8]"
              style={{
                width: `${stats.todayCompletionRate}%`,
              }}
            />
          </div>
        </div>

        {/* Card 2: Upcoming Schedule */}
        <div
          onClick={() => setActiveTab('calendar')}
          className="p-4 sm:p-5 bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A9C8E8]/60 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] mb-2.5">
            <span className="text-xs font-semibold">{t.dashboard.upcomingSchedule}</span>
            <div className="w-8 h-8 rounded-xl bg-[#EEF5FC] dark:bg-[#1E2C3D] flex items-center justify-center text-[#A9C8E8] group-hover:scale-105 transition-transform">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#34313D] dark:text-[#F4F2F7] tabular-nums">
              {todaySchedules.length}
            </span>
            <span className="text-xs text-[#898493] dark:text-[#9E99A8] font-medium truncate">
              {t.dashboard.eventsToday}
            </span>
          </div>
          <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-2.5 truncate font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#A9C8E8] shrink-0" />
            {nextSchedule
              ? `${t.dashboard.nextEventPrefix}: ${nextSchedule.startTime} (${nextSchedule.title})`
              : t.dashboard.noMoreEvents}
          </p>
        </div>

        {/* Card 3: Focus Time */}
        <div
          onClick={() => setActiveTab('focus')}
          className="p-4 sm:p-5 bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#F1B8CC]/60 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] mb-2.5">
            <span className="text-xs font-semibold">{t.dashboard.focusTime}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FDF2F6] dark:bg-[#331E2A] flex items-center justify-center text-[#F1B8CC] group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#34313D] dark:text-[#F4F2F7] tabular-nums">
              {stats.todayFocusMinutes}
              <span className="text-sm font-normal text-[#898493] dark:text-[#9E99A8] font-sans">
                m
              </span>
            </span>
            <span className="text-xs text-[#898493] dark:text-[#9E99A8] font-medium">
              {t.dashboard.loggedToday}
            </span>
          </div>
          <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-2.5 font-medium flex items-center gap-1">
            <Timer className="w-3 h-3 text-[#F1B8CC] shrink-0" />
            {stats.todayFocusSessionsCount} {t.dashboard.sessionsCompleted}
          </p>
        </div>

        {/* Card 4: Productivity Progress */}
        <div
          onClick={() => setActiveTab('analytics')}
          className="p-4 sm:p-5 bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#B5DCCB]/60 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] mb-2.5">
            <span className="text-xs font-semibold">{t.dashboard.productivityProgress}</span>
            <div className="w-8 h-8 rounded-xl bg-[#EBF7F2] dark:bg-[#1E3329] flex items-center justify-center text-[#B5DCCB] group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#34313D] dark:text-[#F4F2F7] tabular-nums">
              {stats.todayCompletionRate}%
            </span>
            <span className="text-xs text-[#898493] dark:text-[#9E99A8] font-medium">
              {t.dashboard.completionLabel}
            </span>
          </div>
          <div className="w-full bg-[#EEEAF2] dark:bg-[#2D2838] h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[#B5DCCB]"
              style={{
                width: `${stats.todayCompletionRate}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN DASHBOARD WORKSPACE GRID                              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================ */}
        {/* LEFT 2 COLUMNS: Priority Tasks & Today's Schedule            */}
        {/* ============================================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION A: Priority Tasks (Eisenhower Matrix / Do First) */}
          <BaseCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E07A5F]" />
                <h2 className="text-sm sm:text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.dashboard.priorityTasksTitle}
                </h2>
                {priorityTasks.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCF3F0] text-[#E07A5F] dark:bg-[#331C18] dark:text-[#F29479]">
                    {priorityTasks.length} {t.dashboard.pendingLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openQuickCapture('task')}
                  className="text-xs font-semibold text-[#A995D8] hover:text-[#9680C9] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.dashboard.addTask}</span>
                </button>
                <span className="text-[#898493] text-xs">·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs font-semibold text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{t.dashboard.viewAll}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {priorityTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title={t.dashboard.noUrgentTitle}
                description={t.dashboard.noUrgentDesc}
                actionLabel={t.dashboard.addPriorityTask}
                onAction={() => openQuickCapture('task')}
                iconColor="#A995D8"
              />
            ) : (
              <div className="space-y-2.5">
                {priorityTasks.slice(0, 5).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={toggleTaskComplete}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            )}
          </BaseCard>

          {/* SECTION B: Today's Schedule & Agenda */}
          <BaseCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-[#A9C8E8]" />
                <h2 className="text-sm sm:text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.dashboard.todaysScheduleTitle}
                </h2>
                {todaySchedules.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF5FC] text-[#2B5885] dark:bg-[#1E2C3D] dark:text-[#A9C8E8]">
                    {todaySchedules.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openQuickCapture('schedule')}
                  className="text-xs font-semibold text-[#A995D8] hover:text-[#9680C9] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.dashboard.addSchedule}</span>
                </button>
                <span className="text-[#898493] text-xs">·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className="text-xs font-semibold text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{t.dashboard.viewCalendar}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {todaySchedules.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={t.dashboard.noEventsTitle}
                description={t.dashboard.noEventsDesc}
                actionLabel={t.dashboard.addTimeBlock}
                onAction={() => openQuickCapture('schedule')}
                iconColor="#A9C8E8"
              />
            ) : (
              <div className="space-y-2.5">
                {todaySchedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onDelete={deleteSchedule}
                    showStatus={true}
                  />
                ))}
              </div>
            )}
          </BaseCard>

          {/* SECTION C: Recent Notes & Quick Ideas */}
          <BaseCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <StickyNote className="w-4 h-4 text-[#F1B8CC]" />
                <h2 className="text-sm sm:text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.dashboard.recentNotesTitle}
                </h2>
                {recentActiveNotes.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F7] text-[#D96B91] dark:bg-[#301E26] dark:text-[#F1B8CC]">
                    {recentActiveNotes.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNoteToEdit(null);
                    setIsEditorOpen(true);
                  }}
                  className="text-xs font-semibold text-[#A995D8] hover:text-[#9680C9] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.dashboard.addNote}</span>
                </button>
                <span className="text-[#898493] text-xs">·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className="text-xs font-semibold text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{t.dashboard.viewAll}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {recentActiveNotes.length === 0 ? (
              <EmptyState
                icon={StickyNote}
                title={t.dashboard.noNotesTitle}
                description={t.dashboard.noNotesDesc}
                actionLabel={t.dashboard.createFirstNote}
                onAction={() => {
                  setNoteToEdit(null);
                  setIsEditorOpen(true);
                }}
                iconColor="#F1B8CC"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentActiveNotes.slice(0, 4).map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onTogglePin={toggleNotePin}
                    onToggleFavorite={toggleNoteFavorite}
                    onDelete={deleteNote}
                    onClick={(n) => {
                      setActiveDetailNote(n);
                      setIsDetailOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </BaseCard>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Quick Actions, Productivity Summary, Activity  */}
        {/* ============================================================ */}
        <div className="space-y-6">
          {/* 5. QUICK ACTIONS PANEL (4 Distinct Functional Pastel Actions) */}
          <BaseCard>
            <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7] mb-3">
              {t.dashboard.quickActions}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Action 1: Add Task */}
              <button
                type="button"
                onClick={() => openQuickCapture('task')}
                className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#1E1B26] border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8] hover:bg-[#F4F1FA]/70 dark:hover:bg-[#2C253B]/70 transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#262033] border border-[#EEEAF2] dark:border-[#383047] flex items-center justify-center text-[#A995D8] mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.dashboard.addTask}
                </div>
                <div className="text-[10px] text-[#898493] dark:text-[#9E99A8] line-clamp-1">
                  {t.dashboard.createNewTodo}
                </div>
              </button>

              {/* Action 2: Add Schedule */}
              <button
                type="button"
                onClick={() => openQuickCapture('schedule')}
                className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#1E1B26] border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A9C8E8] hover:bg-[#EEF5FC]/70 dark:hover:bg-[#1E2C3D]/70 transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#262033] border border-[#EEEAF2] dark:border-[#383047] flex items-center justify-center text-[#A9C8E8] mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.dashboard.addSchedule}
                </div>
                <div className="text-[10px] text-[#898493] dark:text-[#9E99A8] line-clamp-1">
                  {t.dashboard.blockYourTime}
                </div>
              </button>

              {/* Action 3: Start Focus */}
              <button
                type="button"
                onClick={() => {
                  if (!timerState.isRunning) {
                    timerState.start();
                  }
                  setActiveTab('focus');
                }}
                className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#1E1B26] border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#F1B8CC] hover:bg-[#FDF2F6]/70 dark:hover:bg-[#331E2A]/70 transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#262033] border border-[#EEEAF2] dark:border-[#383047] flex items-center justify-center text-[#F1B8CC] mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {timerState.isRunning ? t.dashboard.viewFocus : t.dashboard.startFocus}
                </div>
                <div className="text-[10px] text-[#898493] dark:text-[#9E99A8] line-clamp-1">
                  {timerState.isRunning
                    ? t.dashboard.activeSession
                    : `${user?.preferences?.pomodoroDurationMinutes ?? 25}m ${t.focus.pomodoro}`}
                </div>
              </button>

              {/* Action 4: Create Note */}
              <button
                type="button"
                onClick={() => openQuickCapture('note')}
                className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#1E1B26] border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#B5DCCB] hover:bg-[#EBF7F2]/70 dark:hover:bg-[#1E3329]/70 transition-all text-left group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#262033] border border-[#EEEAF2] dark:border-[#383047] flex items-center justify-center text-[#B5DCCB] mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.dashboard.createNote}
                </div>
                <div className="text-[10px] text-[#898493] dark:text-[#9E99A8] line-clamp-1">
                  {t.dashboard.captureIdeas}
                </div>
              </button>
            </div>
          </BaseCard>

          {/* 6. PRODUCTIVITY SUMMARY (Circular Progress Ring & Real Breakdown) */}
          <BaseCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                {t.dashboard.productivitySummary}
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="text-xs font-semibold text-[#A995D8] hover:underline cursor-pointer"
              >
                {t.dashboard.details}
              </button>
            </div>

            {/* Circular Progress Display */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-[#EEEAF2] dark:text-[#2D2838]"
                  />
                  {/* Animated Progress Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    fill="transparent"
                    stroke="#A995D8"
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold font-mono tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
                    {stats.todayProductivityScore !== null
                      ? stats.todayProductivityScore
                      : `${stats.todayCompletionRate}%`}
                  </span>
                  <span className="text-[10px] font-medium text-[#898493] dark:text-[#9E99A8]">
                    {stats.todayProductivityScore !== null ? t.dashboard.flowScore : t.dashboard.completionLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Real Stats Breakdown List */}
            <div className="mt-4 pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B5DCCB]" />
                  {t.dashboard.tasksCompleted}
                </span>
                <span className="font-mono font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {stats.todayTasksCompleted}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E9C46A]" />
                  {t.dashboard.tasksPending}
                </span>
                <span className="font-mono font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {stats.todayTasksPending}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F1B8CC]" />
                  {t.dashboard.focusDuration}
                </span>
                <span className="font-mono font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {stats.todayFocusMinutes} mins
                </span>
              </div>

              <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A9C8E8]" />
                  {t.dashboard.focusSessions}
                </span>
                <span className="font-mono font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {stats.todayFocusSessionsCount}
                </span>
              </div>

              {stats.goalProgress.hasAnyEnabledGoal && (
                <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] pt-1 border-t border-dashed border-[#EEEAF2] dark:border-[#2D2838]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#A995D8]" />
                    {t.dashboard.goalsReached}
                  </span>
                  <span className="font-mono font-bold text-[#34313D] dark:text-[#F4F2F7]">
                    {stats.goalProgress.achievedCount}/{stats.goalProgress.enabledCount}
                  </span>
                </div>
              )}
            </div>
          </BaseCard>

          {/* 7. RECENT ACTIVITY LOG STREAM */}
          <BaseCard>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#A995D8]" />
                <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.dashboard.recentActivity}
                </h3>
              </div>
              {activities.length > 0 && (
                <span className="text-[11px] font-mono text-[#898493] dark:text-[#9E99A8]">
                  {activities.length} total
                </span>
              )}
            </div>

            {activities.length === 0 ? (
              <p className="text-xs text-[#898493] dark:text-[#9E99A8] py-4 text-center">
                {t.dashboard.noRecentActivity}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {activities.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#1E1B26] border border-[#EEEAF2] dark:border-[#2D2838]"
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${item.color || '#A995D8'}20`,
                        color: item.color || '#A995D8',
                      }}
                    >
                      {item.type.includes('task') ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : item.type.includes('schedule') ? (
                        <Calendar className="w-3.5 h-3.5" />
                      ) : item.type.includes('focus') ? (
                        <Flame className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] truncate">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] text-[#898493] dark:text-[#9E99A8] shrink-0 font-medium whitespace-nowrap">
                      {formatRelativeTime(item.timestamp, language)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </BaseCard>
        </div>
      </div>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
      />

      {/* Note Detail Modal */}
      <NoteDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setActiveDetailNote(null);
        }}
        note={activeDetailNote}
        onEdit={(note) => {
          setIsDetailOpen(false);
          setNoteToEdit(note);
          setIsEditorOpen(true);
        }}
      />
    </div>
  );
};
