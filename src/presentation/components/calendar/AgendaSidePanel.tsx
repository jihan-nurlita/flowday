import React from 'react';
import { Schedule, ScheduleOccurrence } from '../../../domain/entities/schedule';
import { Task } from '../../../domain/entities/task';
import { Category } from '../../../domain/entities/category';
import { expandSchedulesForDate } from '../../../core/utils/calendar';
import { formatFullDate, formatTime, getTodayDateString } from '../../../core/utils/date';
import { CategoryBadge } from '../CategoryBadge';
import { PriorityBadge } from '../PriorityBadge';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Plus,
  Repeat,
  ArrowRight,
} from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../buttons/AppButtons';
import { EmptyState } from '../feedback/AppFeedback';

interface AgendaSidePanelProps {
  selectedDate: string;
  schedules: Schedule[];
  tasks: Task[];
  categories: Category[];
  onSelectSchedule: (occurrence: ScheduleOccurrence) => void;
  onSelectTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onAddSchedule: (dateStr: string) => void;
  onAddTask: (dateStr: string) => void;
  onSwitchToDayView: (dateStr: string) => void;
}

export const AgendaSidePanel: React.FC<AgendaSidePanelProps> = ({
  selectedDate,
  schedules,
  tasks,
  categories,
  onSelectSchedule,
  onSelectTask,
  onToggleTaskComplete,
  onAddSchedule,
  onAddTask,
  onSwitchToDayView,
}) => {
  const occurrences = expandSchedulesForDate(schedules, selectedDate);
  const dayTasks = tasks.filter((t) => t.dueDate === selectedDate);
  const isToday = selectedDate === getTodayDateString();

  const getCategoryColor = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.color || '#A995D8';
  };

  const isEmpty = occurrences.length === 0 && dayTasks.length === 0;

  return (
    <div className="bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
      {/* 1. Header & Stats */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A995D8]">
              {isToday ? 'Today’s Agenda' : 'Day Agenda'}
            </span>
            {isToday && (
              <span className="w-2 h-2 rounded-full bg-[#B5DCCB] animate-pulse" />
            )}
          </div>
          <button
            type="button"
            onClick={() => onSwitchToDayView(selectedDate)}
            className="text-xs font-semibold text-[#A995D8] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[#34313D] dark:text-[#F4F2F7]">
          {formatFullDate(selectedDate)}
        </h3>

        <div className="flex items-center gap-2 mt-2 font-mono text-[11px] text-[#898493] dark:text-[#9E99A8]">
          <span className="px-2 py-0.5 rounded-md bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
            {occurrences.length} Schedule{occurrences.length === 1 ? '' : 's'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
            {dayTasks.length} Task Deadline{dayTasks.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* 2. Agenda Content List */}
      <div className="space-y-4 flex-1 overflow-y-auto max-h-[460px] pr-1">
        {isEmpty ? (
          <EmptyState
            icon={CalendarIcon}
            title="No events on this day"
            description="Keep your day structured by adding focus blocks or tasks."
            actionLabel="+ Add Schedule"
            onAction={() => onAddSchedule(selectedDate)}
          />
        ) : (
          <>
            {/* Schedules Section */}
            {occurrences.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#898493] dark:text-[#9E99A8]">
                  Schedules & Events
                </div>
                {occurrences.map((occ) => {
                  const catColor = getCategoryColor(occ.schedule.categoryId);
                  return (
                    <div
                      key={occ.occurrenceId}
                      onClick={() => onSelectSchedule(occ)}
                      className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8]/50 hover:shadow-2xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <CategoryBadge categoryId={occ.schedule.categoryId} />
                        {occ.schedule.isAllDay ? (
                          <span className="text-[10px] font-semibold text-[#898493]">
                            All Day
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-[#898493] dark:text-[#9E99A8] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#A9C8E8]" />
                            {formatTime(occ.schedule.startTime)} – {formatTime(occ.schedule.endTime)}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7] group-hover:text-[#A995D8] transition-colors truncate">
                        {occ.schedule.title}
                      </h4>

                      {occ.schedule.location && (
                        <div className="flex items-center gap-1 text-[10px] text-[#898493] mt-1 truncate">
                          <MapPin className="w-3 h-3 text-[#B5DCCB] shrink-0" />
                          <span className="truncate">{occ.schedule.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Task Deadlines Section */}
            {dayTasks.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#EEEAF2] dark:border-[#2D2838]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#898493] dark:text-[#9E99A8]">
                  Tasks Due ({dayTasks.length})
                </div>
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8]/50 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTaskComplete(t.id);
                        }}
                        className="shrink-0 text-[#898493] hover:text-[#A995D8] transition-colors cursor-pointer"
                        aria-label={t.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {t.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#B5DCCB]" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#898493]" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold truncate ${
                            t.isCompleted
                              ? 'line-through text-[#898493]'
                              : 'text-[#34313D] dark:text-[#F4F2F7]'
                          }`}
                        >
                          {t.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <PriorityBadge priority={t.priority} />
                          {t.startTime && (
                            <span className="text-[10px] font-mono text-[#898493]">
                              {formatTime(t.startTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838]">
        <SecondaryButton
          size="sm"
          icon={Plus}
          onClick={() => onAddTask(selectedDate)}
        >
          Add Task
        </SecondaryButton>
        <PrimaryButton
          size="sm"
          icon={Plus}
          onClick={() => onAddSchedule(selectedDate)}
        >
          Add Schedule
        </PrimaryButton>
      </div>
    </div>
  );
};
