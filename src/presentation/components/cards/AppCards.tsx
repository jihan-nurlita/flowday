import React from 'react';
import { LucideIcon, CheckCircle2, Circle, Clock, Calendar, Pin, Trash2, CheckSquare, Star, Heart, RotateCcw, Tag } from 'lucide-react';
import { Task } from '../../../domain/entities/task';
import { Schedule } from '../../../domain/entities/schedule';
import { Note } from '../../../domain/entities/note';
import { PriorityBadge } from '../PriorityBadge';
import { CategoryBadge } from '../CategoryBadge';
import { formatTime, formatReadableDate } from '../../../core/utils/date';

interface BaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'outlined' | 'pastel';
  pastelColor?: string;
  hoverEffect?: boolean;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  variant = 'default',
  pastelColor,
  hoverEffect = false,
  className = '',
  style = {},
  ...props
}) => {
  const variantClasses = {
    default: 'bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838]',
    subtle: 'bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]',
    outlined: 'bg-transparent border border-[#EEEAF2] dark:border-[#2D2838]',
    pastel: 'border border-[#EEEAF2] dark:border-[#2D2838]',
  }[variant];

  const hoverClass = hoverEffect
    ? 'transition-all duration-200 hover:shadow-[0_4px_20px_rgba(169,149,216,0.12)] hover:border-[#A995D8]/40'
    : '';

  const dynamicStyle = pastelColor
    ? { ...style, backgroundColor: pastelColor }
    : style;

  return (
    <div
      className={`rounded-2xl p-5 ${variantClasses} ${hoverClass} ${className}`}
      style={dynamicStyle}
      {...props}
    >
      {children}
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  iconColor?: string;
  progressPercent?: number;
  progressColor?: string;
  onClick?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor = '#A995D8',
  progressPercent,
  progressColor = '#A995D8',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-[0_2px_12px_rgba(52,49,61,0.03)] transition-all ${
        onClick ? 'cursor-pointer hover:border-[#A995D8]/40 hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-center justify-between text-[#898493] dark:text-[#9E99A8] mb-2.5">
        <span className="text-xs font-medium tracking-tight">{label}</span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#34313D] dark:text-[#F4F2F7] tabular-nums">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-[#898493] dark:text-[#9E99A8] font-medium">{subValue}</span>
        )}
      </div>

      {typeof progressPercent === 'number' && (
        <div className="w-full bg-[#EEEAF2] dark:bg-[#2D2838] h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%`, backgroundColor: progressColor }}
          />
        </div>
      )}
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onClick?: (task: Task) => void;
  layout?: 'list' | 'grid';
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  onClick,
  layout = 'list',
}) => {
  // Overdue detection
  const isOverdue = React.useMemo(() => {
    if (task.isCompleted || !task.dueDate) return false;
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
  }, [task.isCompleted, task.dueDate, task.endTime]);

  // Subtask progress
  const subtaskStats = React.useMemo(() => {
    if (!task.subtasks || task.subtasks.length === 0) return null;
    const total = task.subtasks.length;
    const completed = task.subtasks.filter((s) => s.isCompleted).length;
    const percent = Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [task.subtasks]);

  const statusLabel =
    task.status === 'in_progress' ? 'In Progress' : task.isCompleted ? 'Completed' : 'To Do';

  if (layout === 'grid') {
    return (
      <div
        onClick={() => onClick && onClick(task)}
        className={`p-4 rounded-2xl bg-white dark:bg-[#201D27] border transition-all flex flex-col justify-between group cursor-pointer ${
          task.isCompleted
            ? 'border-[#EEEAF2] dark:border-[#2D2838] opacity-75'
            : isOverdue
            ? 'border-[#F7C5BA] dark:border-[#522923] shadow-xs'
            : 'border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8]/50 hover:shadow-xs'
        }`}
      >
        <div>
          {/* Top Row: Category + Priority + Status */}
          <div className="flex items-center justify-between gap-1.5 mb-2.5 flex-wrap">
            <CategoryBadge categoryId={task.categoryId} />
            <div className="flex items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              {isOverdue && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FCF3F0] text-[#E07A5F] dark:bg-[#381E19] dark:text-[#F29479]">
                  Overdue
                </span>
              )}
            </div>
          </div>

          {/* Main Title & Checkbox */}
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(task.id);
              }}
              className="mt-0.5 text-[#898493] hover:text-[#A995D8] transition-colors shrink-0 min-w-[24px] min-h-[24px] flex items-center justify-center cursor-pointer"
              aria-label={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-[#B5DCCB] shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-[#898493] shrink-0" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <h4
                className={`text-sm font-semibold tracking-tight ${
                  task.isCompleted
                    ? 'line-through text-[#898493] dark:text-[#9E99A8]'
                    : 'text-[#34313D] dark:text-[#F4F2F7]'
                }`}
              >
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-[#898493] dark:text-[#9E99A8] line-clamp-2 mt-1">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Subtask progress bar in grid view */}
          {subtaskStats && (
            <div className="mt-3 pt-2 border-t border-[#EEEAF2] dark:border-[#2D2838]">
              <div className="flex items-center justify-between text-[11px] text-[#898493] dark:text-[#9E99A8] mb-1">
                <span>Subtasks</span>
                <span className="font-mono font-semibold">
                  {subtaskStats.completed}/{subtaskStats.total} ({subtaskStats.percent}%)
                </span>
              </div>
              <div className="w-full bg-[#EEEAF2] dark:bg-[#2D2838] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-[#A995D8]"
                  style={{ width: `${subtaskStats.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer: Dates & Actions */}
        <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-[#EEEAF2] dark:border-[#2D2838] text-[11px] text-[#898493] dark:text-[#9E99A8]">
          <div className="flex items-center gap-1.5 font-mono">
            {task.dueDate ? (
              <>
                <Calendar className="w-3 h-3 text-[#A9C8E8]" />
                <span className={isOverdue ? 'text-[#E07A5F] font-semibold' : ''}>
                  {formatReadableDate(task.dueDate)}
                </span>
              </>
            ) : (
              <span className="text-[#898493] italic font-sans">No deadline</span>
            )}
            {task.startTime && <span>· {formatTime(task.startTime)}</span>}
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-1 text-[#898493] hover:text-[#A995D8] transition-colors rounded-md hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633] cursor-pointer"
                title="Edit task"
                aria-label="Edit task"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-1 text-[#898493] hover:text-[#E07A5F] transition-colors rounded-md hover:bg-[#FCF3F0] cursor-pointer"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: List layout
  return (
    <div
      onClick={() => onClick && onClick(task)}
      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#201D27] border transition-all group cursor-pointer ${
        task.isCompleted
          ? 'border-[#EEEAF2] dark:border-[#2D2838] opacity-75'
          : isOverdue
          ? 'border-[#F7C5BA] dark:border-[#522923] shadow-xs'
          : 'border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8]/40 hover:bg-[#FAF9FC]/60 dark:hover:bg-[#252230]/60'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task.id);
          }}
          className="text-[#898493] hover:text-[#A995D8] transition-colors shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
          aria-label={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-[#B5DCCB] shrink-0" />
          ) : (
            <Circle className="w-5 h-5 text-[#898493] shrink-0" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-xs sm:text-sm font-medium truncate ${
                task.isCompleted
                  ? 'line-through text-[#898493] dark:text-[#9E99A8]'
                  : 'text-[#34313D] dark:text-[#F4F2F7]'
              }`}
            >
              {task.title}
            </p>
            {isOverdue && (
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-[#FCF3F0] text-[#E07A5F] dark:bg-[#381E19] dark:text-[#F29479]">
                Overdue
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-[#898493] dark:text-[#9E99A8] line-clamp-1 mt-0.5">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-[#898493] dark:text-[#9E99A8]">
            <CategoryBadge categoryId={task.categoryId} />
            <span aria-hidden="true">·</span>
            {task.dueDate ? (
              <span className={`flex items-center gap-1 font-mono ${isOverdue ? 'text-[#E07A5F] font-semibold' : ''}`}>
                <Calendar className="w-3 h-3 text-[#A9C8E8]" />
                {formatReadableDate(task.dueDate)}
              </span>
            ) : (
              <span className="italic">No deadline</span>
            )}

            {task.startTime && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-[#F1B8CC]" />
                  {formatTime(task.startTime)}
                </span>
              </>
            )}

            {subtaskStats && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 font-mono text-[#A995D8]">
                  <CheckSquare className="w-3 h-3" />
                  {subtaskStats.completed}/{subtaskStats.total} subtasks
                </span>
              </>
            )}

            <span aria-hidden="true">·</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                task.status === 'in_progress'
                  ? 'bg-[#EEF5FC] text-[#2B5885] dark:bg-[#1E2C3D] dark:text-[#A9C8E8]'
                  : task.isCompleted
                  ? 'bg-[#EBF7F2] text-[#2D6A4F] dark:bg-[#1E3329] dark:text-[#B5DCCB]'
                  : 'bg-[#F4F3F7] text-[#898493] dark:bg-[#252230] dark:text-[#9E99A8]'
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <PriorityBadge priority={task.priority} />
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-[#898493] hover:text-[#A995D8] rounded-lg hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633] transition-all min-w-[30px] min-h-[30px] flex items-center justify-center text-xs font-semibold cursor-pointer"
            title="Edit task"
            aria-label="Edit task"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-[#898493] hover:text-[#E07A5F] rounded-lg hover:bg-[#FCF3F0] transition-all min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
            title="Delete task"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface ScheduleCardProps {
  schedule: Schedule;
  onDelete?: (id: string) => void;
  onClick?: (schedule: Schedule) => void;
  showStatus?: boolean;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  schedule,
  onDelete,
  onClick,
  showStatus = true,
}) => {
  const now = new Date();
  const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  let status: 'ongoing' | 'upcoming' | 'past' = 'upcoming';
  if (schedule.startTime && schedule.endTime) {
    if (currentHourMin >= schedule.startTime && currentHourMin <= schedule.endTime) {
      status = 'ongoing';
    } else if (currentHourMin > schedule.endTime) {
      status = 'past';
    }
  }

  const borderLeftColor = 
    status === 'ongoing' ? 'border-l-[#B5DCCB]' :
    status === 'past' ? 'border-l-[#EEEAF2] dark:border-l-[#2D2838]' :
    'border-l-[#A9C8E8]';

  return (
    <div
      onClick={() => onClick && onClick(schedule)}
      className={`p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] border-l-4 ${borderLeftColor} relative group hover:shadow-xs transition-all cursor-pointer ${
        status === 'past' ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[#A995D8]">
            {schedule.startTime} - {schedule.endTime}
          </span>
          {showStatus && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                status === 'ongoing'
                  ? 'bg-[#EBF7F2] text-[#2D6A4F] dark:bg-[#1E3329] dark:text-[#B5DCCB]'
                  : status === 'upcoming'
                  ? 'bg-[#EEF5FC] text-[#2B5885] dark:bg-[#1E2C3D] dark:text-[#A9C8E8]'
                  : 'bg-[#F4F3F7] text-[#898493] dark:bg-[#252230] dark:text-[#9E99A8]'
              }`}
            >
              {status === 'ongoing' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#38B000] animate-pulse" />
              )}
              {status === 'ongoing' ? 'Ongoing' : status === 'upcoming' ? 'Upcoming' : 'Past'}
            </span>
          )}
        </div>
        <CategoryBadge categoryId={schedule.categoryId} />
      </div>

      <h4 className="text-xs sm:text-sm font-semibold text-[#34313D] dark:text-[#F4F2F7]">
        {schedule.title}
      </h4>

      {schedule.description && (
        <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-1 line-clamp-2">
          {schedule.description}
        </p>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(schedule.id);
          }}
          className="absolute top-2 right-2 p-1 text-[#898493] hover:text-[#E07A5F] opacity-0 group-hover:opacity-100 transition-opacity min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md cursor-pointer"
          title="Delete event"
          aria-label="Delete event"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

interface NoteCardProps {
  note: Note;
  layout?: 'grid' | 'list';
  isTrashView?: boolean;
  onTogglePin?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDeletePermanent?: (id: string) => void;
  onClick?: (note: Note) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  layout = 'grid',
  isTrashView = false,
  onTogglePin,
  onToggleFavorite,
  onDelete,
  onRestore,
  onDeletePermanent,
  onClick,
}) => {
  const cardColor = note.color || '#FFFFFF';

  if (layout === 'list') {
    return (
      <div
        onClick={() => onClick && onClick(note)}
        className="p-3.5 sm:p-4 rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] transition-all hover:shadow-[0_4px_20px_rgba(169,149,216,0.1)] relative group flex items-center justify-between gap-3 cursor-pointer"
        style={{ backgroundColor: cardColor }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-xs sm:text-sm font-bold text-[#34313D] truncate max-w-xs sm:max-w-md">
              {note.title}
            </h3>
            {note.isPinned && !isTrashView && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#A995D8]/20 text-[#A995D8]">
                <Pin className="w-2.5 h-2.5 fill-current" />
                Pinned
              </span>
            )}
            {note.isFavorite && !isTrashView && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F1B8CC]/30 text-[#D96B91]">
                <Star className="w-2.5 h-2.5 fill-current" />
              </span>
            )}
            <CategoryBadge categoryId={note.categoryId} />
          </div>

          <p className="text-xs text-[#34313D]/80 line-clamp-1 leading-relaxed">
            {note.content}
          </p>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {note.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[10px] font-medium text-[#898493]"
                >
                  #{tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-[10px] text-[#898493]">+{note.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0 text-[#898493]">
          <span className="text-[11px] font-mono mr-2 hidden sm:inline">
            {formatReadableDate(note.updatedAt || note.createdAt)}
          </span>

          {!isTrashView ? (
            <>
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(note.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    note.isFavorite
                      ? 'text-[#F1B8CC]'
                      : 'text-[#898493] opacity-0 group-hover:opacity-100 hover:text-[#D96B91]'
                  }`}
                  title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}

              {onTogglePin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(note.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    note.isPinned
                      ? 'text-[#A995D8]'
                      : 'text-[#898493] opacity-0 group-hover:opacity-100 hover:text-[#34313D]'
                  }`}
                  title={note.isPinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(note.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-[#898493] hover:text-[#E07A5F] transition-all rounded-lg hover:bg-black/5 cursor-pointer"
                  title="Move to trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <>
              {onRestore && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(note.id);
                  }}
                  className="p-1.5 text-[#34313D] hover:text-[#B5DCCB] transition-colors rounded-lg hover:bg-black/5 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Restore note"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restore</span>
                </button>
              )}

              {onDeletePermanent && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePermanent(note.id);
                  }}
                  className="p-1.5 text-[#E07A5F] hover:bg-[#FCF3F0] rounded-lg transition-colors cursor-pointer"
                  title="Delete permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Default Grid Layout
  return (
    <div
      onClick={() => onClick && onClick(note)}
      className="p-4 sm:p-5 rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] transition-all hover:shadow-[0_6px_24px_rgba(169,149,216,0.14)] hover:border-[#A995D8]/40 relative group flex flex-col justify-between cursor-pointer min-h-[180px]"
      style={{ backgroundColor: cardColor }}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-[#34313D] line-clamp-1 leading-snug">
              {note.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isTrashView ? (
              <>
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(note.id);
                    }}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      note.isFavorite
                        ? 'text-[#F1B8CC]'
                        : 'text-[#898493] opacity-0 group-hover:opacity-100 hover:text-[#D96B91]'
                    }`}
                    title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                )}

                {onTogglePin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(note.id);
                    }}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      note.isPinned
                        ? 'text-[#A995D8]'
                        : 'text-[#898493] opacity-0 group-hover:opacity-100 hover:text-[#34313D]'
                    }`}
                    title={note.isPinned ? 'Unpin note' : 'Pin note'}
                    aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Content excerpt */}
        <p className="text-xs text-[#34313D]/90 whitespace-pre-wrap line-clamp-5 leading-relaxed font-normal">
          {note.content}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {note.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-medium text-[#686371]"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] text-[#898493]">+{note.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-black/5 text-[11px] text-[#34313D]/70">
        <div className="flex items-center gap-1.5 min-w-0">
          <CategoryBadge categoryId={note.categoryId} />
          <span>·</span>
          <span className="font-mono text-[10px]">
            {formatReadableDate(note.updatedAt || note.createdAt)}
          </span>
        </div>

        <div>
          {!isTrashView ? (
            onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[#898493] hover:text-[#E07A5F] transition-opacity rounded-md cursor-pointer"
                title="Move to trash"
                aria-label="Move to trash"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <div className="flex items-center gap-1.5">
              {onRestore && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(note.id);
                  }}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-[#2D6A4F] bg-[#B5DCCB]/30 hover:bg-[#B5DCCB]/50 transition-colors cursor-pointer flex items-center gap-1"
                  title="Restore note"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore</span>
                </button>
              )}
              {onDeletePermanent && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePermanent(note.id);
                  }}
                  className="p-1 rounded-lg text-[#E07A5F] hover:bg-[#FCF3F0] transition-colors cursor-pointer"
                  title="Delete permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatisticsCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  subtitle,
  children,
  action,
}) => {
  return (
    <div className="bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] p-5 shadow-[0_2px_12px_rgba(52,49,61,0.03)]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#34313D] dark:text-[#F4F2F7] tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};
