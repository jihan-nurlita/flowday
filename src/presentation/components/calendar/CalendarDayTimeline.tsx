import React from 'react';
import { Schedule, ScheduleOccurrence } from '../../../domain/entities/schedule';
import { Task } from '../../../domain/entities/task';
import { Category } from '../../../domain/entities/category';
import {
  expandSchedulesForDate,
  getScheduleTimeStatus,
  timeToMinutes,
} from '../../../core/utils/calendar';
import {
  formatFullDate,
  formatTime,
  getTodayDateString,
} from '../../../core/utils/date';
import { CategoryBadge } from '../CategoryBadge';
import { PriorityBadge } from '../PriorityBadge';
import {
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  Repeat,
  Bell,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PrimaryButton } from '../buttons/AppButtons';

interface CalendarDayTimelineProps {
  selectedDate: string;
  onDateChange: (dateStr: string) => void;
  schedules: Schedule[];
  tasks: Task[];
  categories: Category[];
  onSelectSchedule: (occurrence: ScheduleOccurrence) => void;
  onSelectTask: (task: Task) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onAddScheduleAt: (dateStr: string, timeStr?: string) => void;
}

export const CalendarDayTimeline: React.FC<CalendarDayTimelineProps> = ({
  selectedDate,
  onDateChange,
  schedules,
  tasks,
  categories,
  onSelectSchedule,
  onSelectTask,
  onToggleTaskComplete,
  onAddScheduleAt,
}) => {
  const occurrences = expandSchedulesForDate(schedules, selectedDate);
  const dayTasks = tasks.filter((t) => t.dueDate === selectedDate);
  const todayStr = getTodayDateString();
  const isSelectedToday = selectedDate === todayStr;

  const allDaySchedules = occurrences.filter((o) => o.schedule.isAllDay);
  const timedSchedules = occurrences.filter((o) => !o.schedule.isAllDay);

  // Navigate day by offset
  const shiftDay = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    onDateChange(`${ny}-${nm}-${nd}`);
  };

  // Hours: 06:00 to 23:00
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  return (
    <div className="bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-xs p-5 sm:p-6 space-y-6">
      {/* 1. Header with Day Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EEEAF2] dark:border-[#2D2838]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-[#34313D] dark:text-[#F4F2F7]">
              {formatFullDate(selectedDate)}
            </h3>
            {isSelectedToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A995D8] text-white">
                Today
              </span>
            )}
          </div>
          <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5">
            {occurrences.length} event{occurrences.length === 1 ? '' : 's'} scheduled · {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'} due
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="p-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] hover:bg-[#FAF9FC] dark:hover:bg-[#252130] text-[#898493] hover:text-[#34313D] transition-colors cursor-pointer"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDateChange(todayStr)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#EEEAF2] dark:border-[#2D2838] hover:bg-[#FAF9FC] dark:hover:bg-[#252130] text-[#34313D] dark:text-[#F4F2F7] transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="p-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] hover:bg-[#FAF9FC] dark:hover:bg-[#252130] text-[#898493] hover:text-[#34313D] transition-colors cursor-pointer"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <PrimaryButton
            size="sm"
            icon={Plus}
            onClick={() => onAddScheduleAt(selectedDate)}
          >
            Add Schedule
          </PrimaryButton>
        </div>
      </div>

      {/* 2. All-Day Section & Task Deadlines */}
      {(allDaySchedules.length > 0 || dayTasks.length > 0) && (
        <div className="p-4 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
          <div className="text-xs font-bold text-[#898493] dark:text-[#9E99A8] uppercase tracking-wider">
            All-Day Events & Tasks Due Today
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* All-Day Events */}
            {allDaySchedules.map((occ) => (
              <div
                key={occ.occurrenceId}
                onClick={() => onSelectSchedule(occ)}
                className="p-3 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between cursor-pointer hover:border-[#A995D8]/40 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-8 rounded-full bg-[#A995D8]" />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-[#34313D] dark:text-[#F4F2F7] truncate">
                      {occ.schedule.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CategoryBadge categoryId={occ.schedule.categoryId} />
                      <span className="text-[10px] text-[#898493]">All Day</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Tasks Due Today */}
            {dayTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="p-3 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between cursor-pointer hover:border-[#A995D8]/40 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTaskComplete(t.id);
                    }}
                    className="shrink-0 text-[#898493] hover:text-[#A995D8] transition-colors cursor-pointer"
                  >
                    {t.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#B5DCCB]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#898493]" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-semibold text-xs truncate ${
                        t.isCompleted
                          ? 'line-through text-[#898493]'
                          : 'text-[#34313D] dark:text-[#F4F2F7]'
                      }`}
                    >
                      {t.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PriorityBadge priority={t.priority} />
                      <span className="text-[10px] text-[#E07A5F]">Due Today</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Chronological Hourly Timeline */}
      <div className="space-y-1">
        {hours.map((hour) => {
          const hourStr = `${String(hour).padStart(2, '0')}:00`;
          const matchingSchedules = timedSchedules.filter((occ) => {
            const sHour = parseInt(occ.schedule.startTime.split(':')[0], 10);
            return sHour === hour;
          });

          return (
            <div
              key={hour}
              className="group flex items-start gap-4 py-2 border-b border-[#FAF9FC] dark:border-[#1E1B28] hover:bg-[#FAF9FC]/60 dark:hover:bg-[#1A1823]/60 transition-colors rounded-xl px-2.5"
            >
              {/* Hour Label */}
              <div className="w-14 shrink-0 text-xs font-mono font-medium text-[#898493] dark:text-[#9E99A8] pt-2">
                {hourStr}
              </div>

              {/* Event slot */}
              <div className="flex-1 min-h-[44px]">
                {matchingSchedules.length > 0 ? (
                  <div className="space-y-2">
                    {matchingSchedules.map((occ) => {
                      const status = getScheduleTimeStatus(occ.schedule, selectedDate);
                      const isOngoing = status === 'ongoing';

                      return (
                        <div
                          key={occ.occurrenceId}
                          onClick={() => onSelectSchedule(occ)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            isOngoing
                              ? 'bg-[#EBF7F2] dark:bg-[#1B2B23] border-[#B5DCCB] shadow-xs'
                              : 'bg-white dark:bg-[#201D27] border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8]/40 hover:shadow-2xs'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <CategoryBadge categoryId={occ.schedule.categoryId} />
                              {isOngoing && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B5DCCB] text-[#1E523A]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E523A] animate-pulse" />
                                  Ongoing Now
                                </span>
                              )}
                              {occ.schedule.recurrenceRule?.frequency &&
                                occ.schedule.recurrenceRule.frequency !== 'none' && (
                                  <span className="flex items-center gap-1 text-[10px] text-[#A995D8]">
                                    <Repeat className="w-3 h-3" />
                                    Series
                                  </span>
                                )}
                            </div>
                            <h4 className="text-sm font-semibold text-[#34313D] dark:text-[#F4F2F7] truncate">
                              {occ.schedule.title}
                            </h4>
                            {occ.schedule.description && (
                              <p className="text-xs text-[#898493] dark:text-[#9E99A8] line-clamp-1 mt-0.5">
                                {occ.schedule.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#898493] dark:text-[#9E99A8] shrink-0 font-mono">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#A9C8E8]" />
                              <span>
                                {formatTime(occ.schedule.startTime)} - {formatTime(occ.schedule.endTime)}
                              </span>
                            </div>
                            {occ.schedule.location && (
                              <div className="flex items-center gap-1 font-sans text-[11px] hidden sm:flex">
                                <MapPin className="w-3 h-3 text-[#B5DCCB]" />
                                <span className="truncate max-w-[120px]">
                                  {occ.schedule.location}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Empty slot with add schedule button */
                  <div
                    onClick={() => onAddScheduleAt(selectedDate, hourStr)}
                    className="h-10 border border-dashed border-[#EEEAF2] dark:border-[#2D2838] rounded-xl flex items-center justify-between px-3 text-[#898493]/60 hover:border-[#A995D8]/60 hover:text-[#A995D8] transition-colors cursor-pointer"
                  >
                    <span className="text-xs">Available slot</span>
                    <span className="text-[11px] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3" /> Add Block
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
