import React, { useState, useMemo } from 'react';
import { useFlow } from '../../state/FlowContext';
import { Task, Subtask, TaskPriority, TaskStatus, normalizePriority } from '../../../domain/entities/task';
import { PriorityBadge } from '../PriorityBadge';
import { CategoryBadge } from '../CategoryBadge';
import { ConfirmationDialog } from '../feedback/AppFeedback';
import { formatReadableDate, formatFullDate, formatTime } from '../../../core/utils/date';
import {
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Bell,
  CheckSquare,
  FileText,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { toggleTaskComplete, updateTask, deleteTask, categories } = useFlow();

  const [isDeletingConfirmOpen, setIsDeletingConfirmOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!isOpen || !task) return null;

  // Overdue detection
  const isOverdue = !task.isCompleted && task.dueDate && (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    if (task.dueDate < todayStr) return true;
    if (task.dueDate === todayStr && task.endTime) {
      const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return task.endTime < currentHM;
    }
    return false;
  })();

  // Subtask progress
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const subtaskProgress =
    subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  // Quick Priority Change
  const handlePriorityChange = async (newPriority: TaskPriority) => {
    await updateTask(task.id, { priority: newPriority });
  };

  // Quick Status Change
  const handleStatusChange = async (newStatus: TaskStatus) => {
    const isCompleted = newStatus === 'completed';
    await updateTask(task.id, {
      status: newStatus,
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    });
  };

  // Inline Subtask Toggle
  const handleToggleSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    await updateTask(task.id, { subtasks: updatedSubtasks });
  };

  // Inline Subtask Add
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: newSubtaskTitle.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    const updatedSubtasks = [...subtasks, newSubtask];
    await updateTask(task.id, { subtasks: updatedSubtasks });
    setNewSubtaskTitle('');
  };

  // Inline Subtask Delete
  const handleDeleteSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.filter((s) => s.id !== subtaskId);
    await updateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleConfirmDelete = async () => {
    await deleteTask(task.id);
    setIsDeletingConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34313D]/40 backdrop-blur-xs">
        <div
          className="w-full max-w-xl bg-white dark:bg-[#201D27] rounded-3xl shadow-2xl border border-[#EEEAF2] dark:border-[#2D2838] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEAF2] dark:border-[#2D2838]">
            <div className="flex items-center gap-2">
              <CategoryBadge categoryId={task.categoryId} />
              <PriorityBadge priority={task.priority} />
              {isOverdue && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCF3F0] text-[#E07A5F] dark:bg-[#381E19] dark:text-[#F29479]">
                  Overdue
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="p-2 text-[#898493] hover:text-[#A995D8] rounded-xl hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633] transition-colors cursor-pointer"
                title="Edit task"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsDeletingConfirmOpen(true)}
                className="p-2 text-[#898493] hover:text-[#E07A5F] rounded-xl hover:bg-[#FCF3F0] transition-colors cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-xl hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & Complete Toggle */}
            <div className="flex items-start gap-3.5">
              <button
                type="button"
                onClick={() => toggleTaskComplete(task.id)}
                className="mt-1 text-[#898493] hover:text-[#A995D8] transition-colors shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
              >
                {task.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-[#B5DCCB] shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-[#898493] shrink-0" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <h2
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    task.isCompleted
                      ? 'line-through text-[#898493] dark:text-[#9E99A8]'
                      : 'text-[#34313D] dark:text-[#F4F2F7]'
                  }`}
                >
                  {task.title}
                </h2>
                {task.description && (
                  <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-1.5 whitespace-pre-line">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            {/* Overdue alert banner if overdue */}
            {isOverdue && (
              <div className="p-3 rounded-2xl bg-[#FCF3F0] dark:bg-[#381E19] border border-[#E07A5F]/20 flex items-center gap-2.5 text-[#E07A5F]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-semibold">
                  This task passed its deadline ({formatReadableDate(task.dueDate)}
                  {task.endTime ? ` at ${formatTime(task.endTime)}` : ''}).
                </span>
              </div>
            )}

            {/* Quick Status & Priority Bar */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
              <div>
                <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                  Status
                </label>
                <select
                  value={task.status || (task.isCompleted ? 'completed' : 'todo')}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl font-semibold cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                  Change Priority
                </label>
                <select
                  value={normalizePriority(task.priority)}
                  onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl font-semibold cursor-pointer"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Schedule & Timing Info */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                Timing & Deadlines
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#A9C8E8]" />
                  <div>
                    <span className="text-[10px] text-[#898493] block">Due Date</span>
                    <span className="font-semibold font-mono text-[#34313D] dark:text-[#F4F2F7]">
                      {task.dueDate ? formatFullDate(task.dueDate) : 'No deadline'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#F1B8CC]" />
                  <div>
                    <span className="text-[10px] text-[#898493] block">Time Window</span>
                    <span className="font-semibold font-mono text-[#34313D] dark:text-[#F4F2F7]">
                      {task.startTime
                        ? `${formatTime(task.startTime)} ${task.endTime ? `- ${formatTime(task.endTime)}` : ''}`
                        : 'No specific time slot'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtasks Section with Interactive Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7] flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-[#A995D8]" />
                  Subtasks ({subtasks.length})
                </span>

                {subtasks.length > 0 && (
                  <span className="text-xs font-mono font-semibold text-[#A995D8]">
                    {completedSubtasks}/{subtasks.length} ({subtaskProgress}%)
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div className="w-full bg-[#EEEAF2] dark:bg-[#2D2838] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-[#A995D8]"
                    style={{ width: `${subtaskProgress}%` }}
                  />
                </div>
              )}

              {/* Subtasks list */}
              <div className="space-y-1.5">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]"
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

              {/* Add Subtask input inline */}
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add another subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#A995D8] hover:bg-[#9680C9] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Reminder Info */}
            {task.reminderSettings?.enabled && (
              <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center gap-2.5 text-xs">
                <Bell className="w-4 h-4 text-[#F1B8CC] shrink-0" />
                <div>
                  <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                    Reminder Scheduled
                  </span>
                  <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                    {task.reminderSettings.reminderType === 'at_deadline'
                      ? 'At task deadline'
                      : task.reminderSettings.reminderType === 'before_15m'
                      ? '15 minutes before deadline'
                      : task.reminderSettings.reminderType === 'before_1h'
                      ? '1 hour before deadline'
                      : task.reminderSettings.reminderType === 'before_1d'
                      ? '1 day before deadline'
                      : `Custom: ${task.reminderSettings.customDateTime || 'Set'}`}
                  </p>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {task.notes && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#B5DCCB]" />
                  Notes & Reference
                </span>
                <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] text-xs text-[#34313D] dark:text-[#F4F2F7] whitespace-pre-line leading-relaxed">
                  {task.notes}
                </div>
              </div>
            )}

            {/* Audit Timestamps */}
            <div className="pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between text-[11px] text-[#898493] dark:text-[#9E99A8]">
              <span>Created {formatReadableDate(task.createdAt)}</span>
              {task.completedAt ? (
                <span className="text-[#B5DCCB] font-medium">
                  Completed {formatReadableDate(task.completedAt)}
                </span>
              ) : (
                <span>Updated {formatReadableDate(task.updatedAt)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Task Deletion */}
      <ConfirmationDialog
        isOpen={isDeletingConfirmOpen}
        title="Delete Task?"
        message={`Are you sure you want to delete "${task.title}"? This action will permanently remove this task and its subtasks.`}
        confirmLabel="Delete Task"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeletingConfirmOpen(false)}
      />
    </>
  );
};
