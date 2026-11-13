import React, { useState, useMemo, useEffect } from 'react';
import { useFlow } from '../state/FlowContext';
import { Schedule, ScheduleOccurrence } from '../../domain/entities/schedule';
import { Task } from '../../domain/entities/task';
import { getTodayDateString, formatMonthYear } from '../../core/utils/date';
import {
  CalendarMonthGrid,
} from '../components/calendar/CalendarMonthGrid';
import {
  CalendarWeekTimeline,
} from '../components/calendar/CalendarWeekTimeline';
import {
  CalendarDayTimeline,
} from '../components/calendar/CalendarDayTimeline';
import {
  AgendaSidePanel,
} from '../components/calendar/AgendaSidePanel';
import {
  ScheduleFormModal,
} from '../components/calendar/ScheduleFormModal';
import {
  ScheduleDetailModal,
} from '../components/calendar/ScheduleDetailModal';
import {
  TaskDetailModal,
} from '../components/tasks/TaskDetailModal';
import {
  TaskFormModal,
} from '../components/tasks/TaskFormModal';
import {
  CategoryManagerModal,
} from '../components/tasks/CategoryManagerModal';
import { PrimaryButton } from '../components/buttons/AppButtons';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  X,
  Settings,
} from 'lucide-react';

export type CalendarViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC = () => {
  const { user, schedules, tasks, categories, toggleTaskComplete, t, language } = useFlow();

  const prefCalendarView = user?.preferences?.calendarDefaultView || 'month';
  const startOfWeek = user?.preferences?.startOfWeek || 'monday';
  const showCompletedTasks = user?.preferences?.showCompletedTasksInCalendar !== false;
  const showTaskDeadlines = user?.preferences?.showTaskDeadlinesInCalendar !== false;
  const showScheduleEvents = user?.preferences?.showScheduleEventsInCalendar !== false;

  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<CalendarViewMode>(prefCalendarView);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  useEffect(() => {
    setViewMode(prefCalendarView);
  }, [prefCalendarView]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'schedules' | 'tasks'>('all');
  const [allDayFilter, setAllDayFilter] = useState<'all' | 'all_day' | 'timed'>('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'recurring' | 'single'>('all');
  const [sortBy, setSortBy] = useState<'earliest' | 'latest' | 'alphabetical'>('earliest');

  // Modals state
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null);
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>(undefined);
  const [formInitialTime, setFormInitialTime] = useState<string | undefined>(undefined);

  const [activeOccurrence, setActiveOccurrence] = useState<ScheduleOccurrence | null>(null);
  const [isScheduleDetailOpen, setIsScheduleDetailOpen] = useState(false);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskInitialDueDate, setTaskInitialDueDate] = useState<string | undefined>(undefined);

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(getTodayDateString());
  };

  // Month and Year string
  const monthYearLabel = formatMonthYear(currentDate, language);

  // Filtered schedules & tasks (honoring Calendar Preferences)
  const filteredSchedules = useMemo(() => {
    if (!showScheduleEvents) return [];

    return schedules.filter((s) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categories.find((c) => c.id === s.categoryId);
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesDesc = (s.description || '').toLowerCase().includes(q);
        const matchesLoc = (s.location || '').toLowerCase().includes(q);
        const matchesCat = cat?.name.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesCat) return false;
      }

      // Category filter
      if (selectedCategoryFilter !== 'all' && s.categoryId !== selectedCategoryFilter) {
        return false;
      }

      // Event Type
      if (eventTypeFilter === 'tasks') return false;

      // All day filter
      if (allDayFilter === 'all_day' && !s.isAllDay) return false;
      if (allDayFilter === 'timed' && s.isAllDay) return false;

      // Recurrence filter
      const isRec = s.recurrenceRule && s.recurrenceRule.frequency !== 'none';
      if (recurrenceFilter === 'recurring' && !isRec) return false;
      if (recurrenceFilter === 'single' && isRec) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      if (sortBy === 'latest') return b.startTime.localeCompare(a.startTime);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [
    showScheduleEvents,
    schedules,
    searchQuery,
    selectedCategoryFilter,
    eventTypeFilter,
    allDayFilter,
    recurrenceFilter,
    sortBy,
    categories,
  ]);

  const filteredTasks = useMemo(() => {
    if (!showTaskDeadlines) return [];
    if (eventTypeFilter === 'schedules') return [];

    return tasks.filter((taskItem) => {
      if (!taskItem.dueDate) return false;
      if (!showCompletedTasks && (taskItem.isCompleted || taskItem.status === 'completed')) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = categories.find((c) => c.id === taskItem.categoryId);
        const matchesTitle = taskItem.title.toLowerCase().includes(q);
        const matchesDesc = (taskItem.description || '').toLowerCase().includes(q);
        const matchesCat = cat?.name.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }

      if (selectedCategoryFilter !== 'all' && taskItem.categoryId !== selectedCategoryFilter) {
        return false;
      }

      return true;
    });
  }, [showTaskDeadlines, showCompletedTasks, tasks, searchQuery, selectedCategoryFilter, eventTypeFilter, categories]);

  // Handler helpers
  const handleOpenAddSchedule = (dateStr?: string, timeStr?: string) => {
    setScheduleToEdit(null);
    setFormInitialDate(dateStr || selectedDate);
    setFormInitialTime(timeStr);
    setIsScheduleFormOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setScheduleToEdit(schedule);
    setFormInitialDate(schedule.startDate || schedule.date);
    setFormInitialTime(schedule.startTime);
    setIsScheduleFormOpen(true);
  };

  const handleSelectSchedule = (occurrence: ScheduleOccurrence) => {
    setActiveOccurrence(occurrence);
    setIsScheduleDetailOpen(true);
  };

  const handleSelectTask = (task: Task) => {
    setActiveTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleOpenAddTask = (dateStr: string) => {
    setTaskInitialDueDate(dateStr);
    setIsTaskFormOpen(true);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategoryFilter !== 'all' ||
    eventTypeFilter !== 'all' ||
    allDayFilter !== 'all' ||
    recurrenceFilter !== 'all' ||
    sortBy !== 'earliest';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter('all');
    setEventTypeFilter('all');
    setAllDayFilter('all');
    setRecurrenceFilter('all');
    setSortBy('earliest');
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
            {t.calendar.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
            {t.calendar.subtitle}
          </p>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Month / Year Navigator */}
          <div className="flex items-center rounded-2xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] p-1 shadow-2xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-[#FAF9FC] dark:hover:bg-[#252130] text-[#898493] hover:text-[#34313D] transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-[#34313D] dark:text-[#F4F2F7] min-w-[130px] text-center select-none">
              {monthYearLabel}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-[#FAF9FC] dark:hover:bg-[#252130] text-[#898493] hover:text-[#34313D] transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={goToToday}
            className="px-3.5 py-2 rounded-2xl text-xs font-semibold bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8] text-[#34313D] dark:text-[#F4F2F7] shadow-2xs transition-colors cursor-pointer"
          >
            {t.calendar.today}
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#A995D8] text-white shadow-2xs'
                  : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7]'
              }`}
            >
              {t.calendar.month}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#A995D8] text-white shadow-2xs'
                  : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7]'
              }`}
            >
              {t.calendar.week}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-[#A995D8] text-white shadow-2xs'
                  : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7]'
              }`}
            >
              {t.calendar.day}
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              hasActiveFilters || isFilterOpen
                ? 'border-[#A995D8] bg-[#F4F1FA] text-[#A995D8] dark:bg-[#2C253B]'
                : 'border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-[#898493] hover:text-[#34313D]'
            }`}
            aria-label={t.calendar.filters}
            title={t.calendar.filters}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Categories Button */}
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="p-2.5 rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-[#898493] hover:text-[#34313D] transition-colors cursor-pointer"
            aria-label="Manage categories"
            title="Categories & Pastel Colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Add Schedule Button */}
          <PrimaryButton
            size="md"
            icon={Plus}
            onClick={() => handleOpenAddSchedule(selectedDate)}
          >
            {t.calendar.addSchedule}
          </PrimaryButton>
        </div>
      </div>

      {/* 2. Expandable Search & Filter Bar */}
      {isFilterOpen && (
        <div className="p-4 rounded-3xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#898493] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schedule title, location, category..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#898493] hover:text-[#34313D]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-[#E07A5F] hover:bg-[#FCF3F0] dark:hover:bg-[#381E19] transition-colors cursor-pointer shrink-0"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Filter Selectors Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {/* Category */}
            <div>
              <label className="block text-[10px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Category
              </label>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-[10px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Type
              </label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
              >
                <option value="all">All Items</option>
                <option value="schedules">Schedules Only</option>
                <option value="tasks">Tasks with Deadlines</option>
              </select>
            </div>

            {/* All Day */}
            <div>
              <label className="block text-[10px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Timing
              </label>
              <select
                value={allDayFilter}
                onChange={(e) => setAllDayFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
              >
                <option value="all">All Events</option>
                <option value="all_day">All-Day Only</option>
                <option value="timed">Timed Events</option>
              </select>
            </div>

            {/* Recurrence */}
            <div>
              <label className="block text-[10px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Recurrence
              </label>
              <select
                value={recurrenceFilter}
                onChange={(e) => setRecurrenceFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
              >
                <option value="all">All Recurrence</option>
                <option value="recurring">Repeating Series</option>
                <option value="single">Single Events</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-[10px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Sort Order
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
              >
                <option value="earliest">Earliest First</option>
                <option value="latest">Latest First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Views Layout */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Month Matrix (2 columns on Desktop) */}
          <div className="lg:col-span-2">
            <CalendarMonthGrid
              currentDate={currentDate}
              selectedDate={selectedDate}
              schedules={filteredSchedules}
              tasks={filteredTasks}
              categories={categories}
              startOfWeek={startOfWeek}
              language={language}
              onSelectDate={(d) => setSelectedDate(d)}
              onSelectSchedule={handleSelectSchedule}
              onSelectTask={handleSelectTask}
            />
          </div>

          {/* Agenda Side Panel (1 column on Desktop) */}
          <div className="lg:col-span-1">
            <AgendaSidePanel
              selectedDate={selectedDate}
              schedules={filteredSchedules}
              tasks={filteredTasks}
              categories={categories}
              onSelectSchedule={handleSelectSchedule}
              onSelectTask={handleSelectTask}
              onToggleTaskComplete={toggleTaskComplete}
              onAddSchedule={(d) => handleOpenAddSchedule(d)}
              onAddTask={(d) => handleOpenAddTask(d)}
              onSwitchToDayView={(d) => {
                setSelectedDate(d);
                setViewMode('day');
              }}
            />
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <CalendarWeekTimeline
          currentWeekAnchor={new Date(`${selectedDate}T00:00:00`)}
          selectedDate={selectedDate}
          schedules={filteredSchedules}
          tasks={filteredTasks}
          categories={categories}
          startOfWeek={startOfWeek}
          language={language}
          onSelectDate={(d) => setSelectedDate(d)}
          onSelectSchedule={handleSelectSchedule}
          onSelectTask={handleSelectTask}
          onAddScheduleAt={(d, timeStr) => handleOpenAddSchedule(d, timeStr)}
        />
      )}

      {viewMode === 'day' && (
        <CalendarDayTimeline
          selectedDate={selectedDate}
          onDateChange={(d) => setSelectedDate(d)}
          schedules={filteredSchedules}
          tasks={filteredTasks}
          categories={categories}
          onSelectSchedule={handleSelectSchedule}
          onSelectTask={handleSelectTask}
          onToggleTaskComplete={toggleTaskComplete}
          onAddScheduleAt={(d, timeStr) => handleOpenAddSchedule(d, timeStr)}
        />
      )}

      {/* 4. Modals */}
      {/* Schedule Form Modal */}
      <ScheduleFormModal
        isOpen={isScheduleFormOpen}
        onClose={() => {
          setIsScheduleFormOpen(false);
          setScheduleToEdit(null);
        }}
        editingSchedule={scheduleToEdit}
        initialDate={formInitialDate}
        initialTime={formInitialTime}
      />

      {/* Schedule Detail Modal */}
      <ScheduleDetailModal
        isOpen={isScheduleDetailOpen}
        onClose={() => {
          setIsScheduleDetailOpen(false);
          setActiveOccurrence(null);
        }}
        occurrence={activeOccurrence}
        onEdit={handleEditSchedule}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onEdit={(t) => {
          setIsTaskDetailOpen(false);
          setActiveTask(t);
          setIsTaskFormOpen(true);
        }}
      />

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setActiveTask(null);
          setTaskInitialDueDate(undefined);
        }}
        taskToEdit={activeTask}
        initialDueDate={taskInitialDueDate}
      />

      {/* Categories Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </div>
  );
};
