import React, { useState, useEffect } from 'react';
import { useFlow } from '../../state/FlowContext';
import { Task, TaskPriority, TaskStatus, Subtask, TaskReminderSettings, ReminderType, normalizePriority } from '../../../domain/entities/task';
import { generateId } from '../../../core/utils/id';
import { getTodayDateString } from '../../../core/utils/date';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Bell,
  CheckSquare,
  FileText,
  AlertCircle,
  Tag,
  Flag,
} from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  initialDueDate?: string;
  onSuccess?: (task: Task) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialDueDate,
  onSuccess,
}) => {
  const { categories, createTask, updateTask } = useFlow();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');

  // Dates & Times
  const [hasDeadline, setHasDeadline] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Subtasks & Reminders & Notes
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderType, setReminderType] = useState<ReminderType>('before_1h');
  const [customReminderDateTime, setCustomReminderDateTime] = useState('');
  const [notes, setNotes] = useState('');

  // Validation & Submission
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset when modal opens or taskToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setCategoryId(taskToEdit.categoryId || (categories[0]?.id ?? 'cat_1'));
        setPriority(normalizePriority(taskToEdit.priority));
        setStatus(taskToEdit.status || (taskToEdit.isCompleted ? 'completed' : 'todo'));
        setStartDate(taskToEdit.startDate || '');
        setHasDeadline(!!taskToEdit.dueDate);
        setDueDate(taskToEdit.dueDate || getTodayDateString());
        setStartTime(taskToEdit.startTime || '');
        setEndTime(taskToEdit.endTime || '');
        setSubtasks(taskToEdit.subtasks || []);
        setNotes(taskToEdit.notes || '');
        if (taskToEdit.reminderSettings) {
          setReminderEnabled(taskToEdit.reminderSettings.enabled);
          setReminderType(taskToEdit.reminderSettings.reminderType || 'before_1h');
          setCustomReminderDateTime(taskToEdit.reminderSettings.customDateTime || '');
        } else {
          setReminderEnabled(false);
          setReminderType('before_1h');
          setCustomReminderDateTime('');
        }
      } else {
        // Create new task defaults
        setTitle('');
        setDescription('');
        setCategoryId(categories[0]?.id ?? 'cat_1');
        setPriority('medium');
        setStatus('todo');
        setStartDate('');
        setHasDeadline(true);
        setDueDate(initialDueDate || getTodayDateString());
        setStartTime('');
        setEndTime('');
        setSubtasks([]);
        setNotes('');
        setReminderEnabled(false);
        setReminderType('before_1h');
        setCustomReminderDateTime('');
      }
      setNewSubtaskTitle('');
      setError(null);
    }
  }, [isOpen, taskToEdit, categories]);

  if (!isOpen) return null;

  // Subtask handlers
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const item: Subtask = {
      id: generateId('sub'),
      title: newSubtaskTitle.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    setSubtasks((prev) => [...prev, item]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isCompleted: !s.isCompleted } : s))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  // Validation logic
  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Task title is required.');
      return false;
    }

    if (hasDeadline && startDate && dueDate && dueDate < startDate) {
      setError('Due date cannot be earlier than start date.');
      return false;
    }

    if (startTime && endTime) {
      // If times are set on the same day
      if (!startDate || !dueDate || startDate === dueDate) {
        if (endTime <= startTime) {
          setError('End time must be later than start time.');
          return false;
        }
      }
    }

    if (reminderEnabled && reminderType === 'custom' && !customReminderDateTime) {
      setError('Please choose a valid custom reminder date & time.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const isCompleted = status === 'completed';
      const reminderSettings: TaskReminderSettings | undefined = reminderEnabled
        ? {
            enabled: true,
            reminderType,
            customDateTime: customReminderDateTime || undefined,
            remindAt:
              reminderType === 'custom'
                ? customReminderDateTime
                : dueDate
                ? `${dueDate}T${startTime || '09:00'}:00`
                : undefined,
          }
        : undefined;

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || (categories[0]?.id ?? 'cat_1'),
        priority,
        status,
        startDate: startDate || undefined,
        dueDate: hasDeadline ? dueDate : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        subtasks,
        reminderSettings,
        notes: notes.trim() || undefined,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };

      let savedTask: Task;
      if (taskToEdit) {
        savedTask = await updateTask(taskToEdit.id, payload);
      } else {
        savedTask = await createTask(payload);
      }

      if (onSuccess) {
        onSuccess(savedTask);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save task:', err);
      setError(err?.message || 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34313D]/40 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#201D27] rounded-3xl shadow-2xl border border-[#EEEAF2] dark:border-[#2D2838] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEAF2] dark:border-[#2D2838]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4F1FA] dark:bg-[#2C253B] flex items-center justify-center text-[#A995D8]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
                {taskToEdit ? 'Edit Task' : 'Create New Task'}
              </h3>
              <p className="text-xs text-[#898493] dark:text-[#9E99A8]">
                {taskToEdit ? 'Update details, subtasks & schedule' : 'Organize your day with clarity'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-lg hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-[#FCF3F0] dark:bg-[#381E19] text-[#E07A5F] text-xs font-semibold flex items-center gap-2 border border-[#E07A5F]/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Basic Info: Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#34313D] dark:text-[#F4F2F7] mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Finalize project architecture proposal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Add context, specifications, or key deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] transition-colors resize-none"
              />
            </div>
          </div>

          {/* 2. Categorization: Category, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                Category
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority Selector (High, Medium, Low) */}
            <div>
              <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] cursor-pointer"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] cursor-pointer"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* 3. Dates & Times Section */}
          <div className="p-4 bg-[#FAF9FC] dark:bg-[#1A1823] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#A9C8E8]" />
                Date & Schedule
              </span>

              <label className="flex items-center gap-2 text-xs text-[#898493] dark:text-[#9E99A8] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!hasDeadline}
                  onChange={(e) => setHasDeadline(!e.target.checked)}
                  className="rounded text-[#A995D8] focus:ring-0 cursor-pointer"
                />
                <span>No deadline</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                  Due Date {hasDeadline && '*'}
                </label>
                <input
                  type="date"
                  disabled={!hasDeadline}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border rounded-xl ${
                    !hasDeadline
                      ? 'opacity-50 cursor-not-allowed border-[#EEEAF2] dark:border-[#2D2838]'
                      : 'border-[#EEEAF2] dark:border-[#2D2838]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-[#898493] dark:text-[#9E99A8] mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#F1B8CC]" />
                  Start Time (Optional)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#898493] dark:text-[#9E99A8] mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#A9C8E8]" />
                  End Time (Optional)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* 4. Subtasks Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7] flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#A995D8]" />
                Subtasks ({subtasks.length})
              </span>
              {subtasks.length > 0 && (
                <span className="text-[11px] font-mono text-[#898493]">
                  {subtasks.filter((s) => s.isCompleted).length}/{subtasks.length} done
                </span>
              )}
            </div>

            {/* Subtask input bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add subtask step..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 text-xs font-semibold text-white bg-[#A995D8] hover:bg-[#9680C9] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Subtasks list */}
            {subtasks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]"
                  >
                    <label className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={st.isCompleted}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="rounded text-[#B5DCCB] focus:ring-0 cursor-pointer"
                      />
                      <span
                        className={`text-xs truncate ${
                          st.isCompleted ? 'line-through text-[#898493]' : 'text-[#34313D] dark:text-[#F4F2F7]'
                        }`}
                      >
                        {st.title}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="p-1 text-[#898493] hover:text-[#E07A5F] rounded-md transition-colors cursor-pointer"
                      title="Remove subtask"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Reminder Settings */}
          <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7] flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#F1B8CC]" />
                Task Reminder
              </span>

              <label className="flex items-center gap-2 text-xs text-[#898493] dark:text-[#9E99A8] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="rounded text-[#F1B8CC] focus:ring-0 cursor-pointer"
                />
                <span>Enable Reminder</span>
              </label>
            </div>

            {reminderEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                    When to remind
                  </label>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value as ReminderType)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8]"
                  >
                    <option value="at_deadline">At deadline time</option>
                    <option value="before_15m">15 minutes before</option>
                    <option value="before_1h">1 hour before</option>
                    <option value="before_1d">1 day before</option>
                    <option value="custom">Custom date & time</option>
                  </select>
                </div>

                {reminderType === 'custom' && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                      Custom Reminder Time
                    </label>
                    <input
                      type="datetime-local"
                      value={customReminderDateTime}
                      onChange={(e) => setCustomReminderDateTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6. Notes field */}
          <div>
            <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#B5DCCB]" />
              Personal Notes
            </label>
            <textarea
              rows={3}
              placeholder="Store reference links, checklist reminders, or reflections..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-xl hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#A995D8] hover:bg-[#9680C9] active:scale-98 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
