import React, { useState, useMemo } from 'react';
import { useFlow } from '../state/FlowContext';
import { Task, normalizePriority } from '../../domain/entities/task';
import { TaskCard } from '../components/cards/AppCards';
import { PrimaryButton, SecondaryButton } from '../components/buttons/AppButtons';
import { SearchField } from '../components/inputs/AppInputs';
import { EmptyState } from '../components/feedback/AppFeedback';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { CategoryManagerModal } from '../components/tasks/CategoryManagerModal';
import { getTodayDateString } from '../../core/utils/date';
import {
  Plus,
  CheckSquare,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  Tag,
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    categories,
    stats,
    toggleTaskComplete,
    deleteTask,
    openQuickCapture,
  } = useFlow();

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'no_deadline'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'due_date' | 'priority' | 'alphabetical'>('newest');

  // UI View Mode (List vs Grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Modals state
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const today = getTodayDateString();

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (dateFilter !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [statusFilter, priorityFilter, categoryFilter, dateFilter, searchQuery]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
    setSortBy('newest');
  };

  // Helper to map category IDs to names for search
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name.toLowerCase()));
    return map;
  }, [categories]);

  // Filtering & Sorting pipeline
  const filteredAndSortedTasks = useMemo(() => {
    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    return tasks
      .filter((task) => {
        // 1. Search Query (title, description, category name)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const titleMatch = task.title.toLowerCase().includes(query);
          const descMatch = task.description?.toLowerCase().includes(query) ?? false;
          const catName = categoryMap.get(task.categoryId) || '';
          const catMatch = catName.includes(query);
          if (!titleMatch && !descMatch && !catMatch) return false;
        }

        // 2. Status Filter
        if (statusFilter === 'todo') {
          if (task.isCompleted || task.status === 'in_progress') return false;
        } else if (statusFilter === 'in_progress') {
          if (task.status !== 'in_progress') return false;
        } else if (statusFilter === 'completed') {
          if (!task.isCompleted && task.status !== 'completed') return false;
        }

        // 3. Priority Filter
        if (priorityFilter !== 'all') {
          const normPriority = normalizePriority(task.priority);
          if (normPriority !== priorityFilter) return false;
        }

        // 4. Category Filter
        if (categoryFilter !== 'all' && task.categoryId !== categoryFilter) {
          return false;
        }

        // 5. Date Filter
        if (dateFilter === 'today') {
          if (task.dueDate !== today) return false;
        } else if (dateFilter === 'upcoming') {
          if (!task.dueDate || task.dueDate <= today) return false;
        } else if (dateFilter === 'overdue') {
          if (task.isCompleted || !task.dueDate) return false;
          if (task.dueDate > today) return false;
          if (task.dueDate === today && (!task.endTime || task.endTime >= currentHourMin)) {
            return false;
          }
        } else if (dateFilter === 'no_deadline') {
          if (task.dueDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sorting options
        if (sortBy === 'newest') {
          return b.createdAt.localeCompare(a.createdAt);
        }
        if (sortBy === 'oldest') {
          return a.createdAt.localeCompare(b.createdAt);
        }
        if (sortBy === 'due_date') {
          const dateA = a.dueDate || '9999-99-99';
          const dateB = b.dueDate || '9999-99-99';
          return dateA.localeCompare(dateB);
        }
        if (sortBy === 'priority') {
          const orderMap: Record<string, number> = { high: 1, medium: 2, low: 3 };
          const pA = orderMap[normalizePriority(a.priority)] || 4;
          const pB = orderMap[normalizePriority(b.priority)] || 4;
          return pA - pB;
        }
        if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [
    tasks,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    dateFilter,
    sortBy,
    today,
    categoryMap,
  ]);

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. PAGE HEADER & TITLE                                         */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
            My Tasks
          </h1>
          <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
            Organize your work, prioritize essentials, and find your daily flow.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Tag className="w-3.5 h-3.5 text-[#A995D8]" />
            <span>Categories</span>
          </button>

          <PrimaryButton
            icon={Plus}
            onClick={() => {
              setTaskToEdit(null);
              setIsCreateTaskModalOpen(true);
            }}
            size="md"
          >
            Add Task
          </PrimaryButton>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. REAL SUMMARY METRICS CARDS                                  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Active Tasks */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'todo' ? 'all' : 'todo')}
          className={`p-4 bg-white dark:bg-[#201D27] rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'todo'
              ? 'border-[#A995D8] ring-2 ring-[#A995D8]/20'
              : 'border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8]/40'
          }`}
        >
          <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] mb-1.5">
            <span className="text-xs font-semibold">Active Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-[#F4F1FA] dark:bg-[#2C253B] flex items-center justify-center text-[#A995D8]">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#34313D] dark:text-[#F4F2F7]">
              {stats.activeTasksTotal}
            </span>
            <span className="text-xs text-[#898493] dark:text-[#9E99A8]">to accomplish</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`p-4 bg-white dark:bg-[#201D27] rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'completed'
              ? 'border-[#B5DCCB] ring-2 ring-[#B5DCCB]/20'
              : 'border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#B5DCCB]/40'
          }`}
        >
          <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] mb-1.5">
            <span className="text-xs font-semibold">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-[#EBF7F2] dark:bg-[#1E3329] flex items-center justify-center text-[#B5DCCB]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#34313D] dark:text-[#F4F2F7]">
              {stats.completedTasksTotal}
            </span>
            <span className="text-xs text-[#898493] dark:text-[#9E99A8]">finished</span>
          </div>
        </div>

        {/* Due Today */}
        <div
          onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
          className={`p-4 bg-white dark:bg-[#201D27] rounded-2xl border transition-all cursor-pointer ${
            dateFilter === 'today'
              ? 'border-[#A9C8E8] ring-2 ring-[#A9C8E8]/20'
              : 'border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A9C8E8]/40'
          }`}
        >
          <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] mb-1.5">
            <span className="text-xs font-semibold">Due Today</span>
            <div className="w-7 h-7 rounded-lg bg-[#EEF5FC] dark:bg-[#1E2C3D] flex items-center justify-center text-[#A9C8E8]">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#34313D] dark:text-[#F4F2F7]">
              {stats.todayTasksTotal}
            </span>
            <span className="text-xs text-[#898493] dark:text-[#9E99A8]">scheduled</span>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div
          onClick={() => setDateFilter(dateFilter === 'overdue' ? 'all' : 'overdue')}
          className={`p-4 bg-white dark:bg-[#201D27] rounded-2xl border transition-all cursor-pointer ${
            dateFilter === 'overdue'
              ? 'border-[#E07A5F] ring-2 ring-[#E07A5F]/20'
              : stats.overdueTasksCount > 0
              ? 'border-[#F7C5BA] dark:border-[#522923]'
              : 'border-[#EEEAF2] dark:border-[#2D2838]'
          }`}
        >
          <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] mb-1.5">
            <span className="text-xs font-semibold">Overdue</span>
            <div className="w-7 h-7 rounded-lg bg-[#FCF3F0] dark:bg-[#381E19] flex items-center justify-center text-[#E07A5F]">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono ${
                stats.overdueTasksCount > 0 ? 'text-[#E07A5F]' : 'text-[#34313D] dark:text-[#F4F2F7]'
              }`}
            >
              {stats.overdueTasksCount}
            </span>
            <span className="text-xs text-[#898493] dark:text-[#9E99A8]">needs attention</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. TOOLBAR (Search, Filter Drawer Toggle, Sort, View Mode)    */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-4 bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838]">
        {/* Search Field */}
        <div className="flex-1 max-w-md">
          <SearchField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or category..."
          />
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              isFilterDrawerOpen || activeFiltersCount > 0
                ? 'bg-[#F4F1FA] dark:bg-[#2C253B] border-[#A995D8] text-[#A995D8]'
                : 'bg-[#FAF9FC] dark:bg-[#1A1823] border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#34313D]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#A995D8] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 text-xs bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl text-[#898493]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#A995D8] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent focus:outline-none font-semibold text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle (List vs Grid) */}
          <div className="flex items-center p-1 bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#2A2633] text-[#A995D8] shadow-xs'
                  : 'text-[#898493] hover:text-[#34313D]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#2A2633] text-[#A995D8] shadow-xs'
                  : 'text-[#898493] hover:text-[#34313D]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="p-2 text-[#898493] hover:text-[#E07A5F] rounded-xl hover:bg-[#FCF3F0] transition-colors cursor-pointer"
              title="Clear all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. EXPANDABLE FILTER DRAWER (Status, Priority, Category, Date) */}
      {/* ============================================================== */}
      {isFilterDrawerOpen && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
              Filter Criteria
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-[#A995D8] hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                Task Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'todo', label: 'To Do' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'completed', label: 'Completed' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatusFilter(s.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      statusFilter === s.id
                        ? 'bg-[#A995D8] text-white'
                        : 'bg-[#FAF9FC] dark:bg-[#1A1823] text-[#898493] border border-[#EEEAF2] dark:border-[#2D2838]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                Priority Level
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'high', label: 'High' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'low', label: 'Low' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriorityFilter(p.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      priorityFilter === p.id
                        ? 'bg-[#A995D8] text-white'
                        : 'bg-[#FAF9FC] dark:bg-[#1A1823] text-[#898493] border border-[#EEEAF2] dark:border-[#2D2838]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl font-medium cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                Timeline & Deadline
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'today', label: 'Today' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'overdue', label: 'Overdue' },
                  { id: 'no_deadline', label: 'No Deadline' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDateFilter(d.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      dateFilter === d.id
                        ? 'bg-[#A995D8] text-white'
                        : 'bg-[#FAF9FC] dark:bg-[#1A1823] text-[#898493] border border-[#EEEAF2] dark:border-[#2D2838]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TASK CONTENT AREA (List or Grid View)                       */}
      {/* ============================================================== */}
      <div>
        {filteredAndSortedTasks.length === 0 ? (
          <div className="bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] p-8">
            {searchQuery.trim() ? (
              <EmptyState
                icon={CheckSquare}
                title="No search results found"
                description={`No tasks match "${searchQuery}". Try searching with another keyword or clear your query.`}
                actionLabel="Clear Search"
                onAction={() => setSearchQuery('')}
                iconColor="#A995D8"
              />
            ) : dateFilter === 'overdue' ? (
              <EmptyState
                icon={CheckCircle2}
                title="No overdue tasks!"
                description="Fantastic work! All of your deadlines are on track or already completed."
                actionLabel="View All Tasks"
                onAction={() => setDateFilter('all')}
                iconColor="#B5DCCB"
              />
            ) : statusFilter === 'completed' ? (
              <EmptyState
                icon={CheckSquare}
                title="No completed tasks yet"
                description="Check off tasks as you finish them to build momentum and see your productivity grow."
                actionLabel="View Active Tasks"
                onAction={() => setStatusFilter('todo')}
                iconColor="#A995D8"
              />
            ) : (
              <EmptyState
                icon={CheckSquare}
                title="No tasks in this view"
                description="Create a task with clear priorities, subtasks, and deadlines to find your daily flow."
                actionLabel="+ Create New Task"
                onAction={() => {
                  setTaskToEdit(null);
                  setIsCreateTaskModalOpen(true);
                }}
                iconColor="#A995D8"
              />
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                layout="grid"
                onToggleComplete={toggleTaskComplete}
                onDelete={deleteTask}
                onEdit={(t) => {
                  setTaskToEdit(t);
                  setIsCreateTaskModalOpen(true);
                }}
                onClick={(t) => setSelectedTaskForDetail(t)}
              />
            ))}
          </div>
        ) : (
          /* List View Layout */
          <div className="space-y-2.5">
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                layout="list"
                onToggleComplete={toggleTaskComplete}
                onDelete={deleteTask}
                onEdit={(t) => {
                  setTaskToEdit(t);
                  setIsCreateTaskModalOpen(true);
                }}
                onClick={(t) => setSelectedTaskForDetail(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. MODALS & OVERLAYS                                           */}
      {/* ============================================================== */}
      {/* Task Creation & Edit Modal */}
      <TaskFormModal
        isOpen={isCreateTaskModalOpen}
        taskToEdit={taskToEdit}
        onClose={() => {
          setIsCreateTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSuccess={(saved) => {
          // If we had this task open in detail, update it
          if (selectedTaskForDetail?.id === saved.id) {
            setSelectedTaskForDetail(saved);
          }
        }}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={!!selectedTaskForDetail}
        task={
          selectedTaskForDetail
            ? tasks.find((t) => t.id === selectedTaskForDetail.id) || selectedTaskForDetail
            : null
        }
        onClose={() => setSelectedTaskForDetail(null)}
        onEdit={(task) => {
          setTaskToEdit(task);
          setIsCreateTaskModalOpen(true);
        }}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </div>
  );
};
