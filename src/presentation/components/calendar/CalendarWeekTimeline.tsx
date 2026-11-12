import React from 'react';
import { Schedule, ScheduleOccurrence } from '../../../domain/entities/schedule';
import { Task } from '../../../domain/entities/task';
import { Category } from '../../../domain/entities/category';
import { getWeekDays, formatTime, getTodayDateString } from '../../../core/utils/date';
import { expandSchedulesForDate, timeToMinutes, formatDateToYMD } from '../../../core/utils/calendar';
import { Clock, Calendar, CheckCircle2, Circle, Plus } from 'lucide-react';

interface CalendarWeekTimelineProps {
  currentWeekAnchor: Date;
  selectedDate: string;
  schedules: Schedule[];
  tasks: Task[];
  categories: Category[];
  onSelectDate: (dateStr: string) => void;
  onSelectSchedule: (occurrence: ScheduleOccurrence) => void;
  onSelectTask: (task: Task) => void;
  onAddScheduleAt: (dateStr: string, timeStr: string) => void;
}

export const CalendarWeekTimeline: React.FC<CalendarWeekTimelineProps> = ({
  currentWeekAnchor,
  selectedDate,
  schedules,
  tasks,
  categories,
  onSelectDate,
  onSelectSchedule,
  onSelectTask,
  onAddScheduleAt,
}) => {
  const weekDays = getWeekDays(currentWeekAnchor);
  const todayStr = getTodayDateString();

  const getCategoryColor = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.color || '#A995D8';
  };

  // Hours: 07:00 to 22:00
  const startHour = 7;
  const endHour = 22;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  const hourHeight = 64; // px per hour

  // Current time position
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const timelineStartMinutes = startHour * 60;
  const timelineEndMinutes = (endHour + 1) * 60;
  const isNowInTimeline =
    currentMinutes >= timelineStartMinutes && currentMinutes <= timelineEndMinutes;
  const nowTopPosition = ((currentMinutes - timelineStartMinutes) / 60) * hourHeight;

  return (
    <div className="bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-xs overflow-hidden">
      {/* 1. Header with Weekdays and Dates */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] sticky top-0 z-20">
        <div className="p-3 text-[10px] font-bold text-[#898493] uppercase tracking-wider text-center border-r border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-center">
          <Clock className="w-3.5 h-3.5" />
        </div>

        {weekDays.map((d) => {
          const dateStr = formatDateToYMD(d);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`p-2 sm:p-2.5 text-center cursor-pointer transition-colors border-r border-[#EEEAF2] dark:border-[#2D2838] last:border-r-0 ${
                isSelected
                  ? 'bg-[#FAF9FC] dark:bg-[#252130]'
                  : 'hover:bg-[#FAF9FC]/70 dark:hover:bg-[#252130]/70'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-[#898493] dark:text-[#9E99A8]">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-mono font-bold mt-0.5 ${
                  isToday
                    ? 'bg-[#A995D8] text-white shadow-xs'
                    : isSelected
                    ? 'border-2 border-[#A995D8] text-[#A995D8]'
                    : 'text-[#34313D] dark:text-[#F4F2F7]'
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. All-Day Events & Task Deadlines Row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC]/50 dark:bg-[#17151F]/50">
        <div className="p-2 text-[10px] font-bold text-[#898493] dark:text-[#9E99A8] text-center border-r border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-center">
          All-Day / Due
        </div>

        {weekDays.map((d) => {
          const dateStr = formatDateToYMD(d);
          const dayAllDaySchedules = expandSchedulesForDate(schedules, dateStr).filter(
            (o) => o.schedule.isAllDay
          );
          const dayTasks = tasks.filter((t) => t.dueDate === dateStr);

          return (
            <div
              key={dateStr}
              className="p-1 sm:p-1.5 space-y-1 min-h-[44px] border-r border-[#EEEAF2] dark:border-[#2D2838] last:border-r-0"
            >
              {dayAllDaySchedules.map((occ) => {
                const color = getCategoryColor(occ.schedule.categoryId);
                return (
                  <div
                    key={occ.occurrenceId}
                    onClick={() => onSelectSchedule(occ)}
                    className="truncate text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: `${color}25`,
                      color: '#34313D',
                      borderLeft: `2px solid ${color}`,
                    }}
                    title={occ.schedule.title}
                  >
                    {occ.schedule.title}
                  </div>
                );
              })}

              {dayTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className={`truncate text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1 ${
                    t.isCompleted
                      ? 'bg-[#EBF7F2] text-[#2D6A4F] line-through dark:bg-[#1E3329] dark:text-[#B5DCCB]'
                      : 'bg-[#FCF3F0] text-[#B8573E] dark:bg-[#381E19] dark:text-[#F7C5BA]'
                  }`}
                  title={`Task Due: ${t.title}`}
                >
                  {t.isCompleted ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#B5DCCB] shrink-0" />
                  ) : (
                    <Circle className="w-2.5 h-2.5 text-[#E07A5F] shrink-0" />
                  )}
                  <span className="truncate">{t.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* 3. Hourly Scrollable Timeline */}
      <div className="relative overflow-x-auto max-h-[640px] overflow-y-auto">
        <div
          className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[720px] relative"
          style={{ height: `${hours.length * hourHeight}px` }}
        >
          {/* Time Labels Column */}
          <div className="border-r border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC]/40 dark:bg-[#1A1823]/40 select-none">
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: `${hourHeight}px` }}
                className="text-right pr-2 pt-1 border-b border-[#EEEAF2]/60 dark:border-[#2D2838]/60 text-[11px] font-mono text-[#898493] dark:text-[#9E99A8]"
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 7 Day Columns */}
          {weekDays.map((d) => {
            const dateStr = formatDateToYMD(d);
            const isToday = dateStr === todayStr;
            const dayTimedSchedules = expandSchedulesForDate(schedules, dateStr).filter(
              (o) => !o.schedule.isAllDay
            );

            return (
              <div
                key={dateStr}
                className="relative border-r border-[#EEEAF2] dark:border-[#2D2838] last:border-r-0 group"
              >
                {/* Horizontal hour lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${hourHeight}px` }}
                    onClick={() =>
                      onAddScheduleAt(dateStr, `${String(hour).padStart(2, '0')}:00`)
                    }
                    className="border-b border-[#EEEAF2]/60 dark:border-[#2D2838]/60 hover:bg-[#FAF9FC]/80 dark:hover:bg-[#252130]/80 transition-colors cursor-pointer relative"
                  />
                ))}

                {/* Current time line if today */}
                {isToday && isNowInTimeline && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                    style={{ top: `${nowTopPosition}px` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#A995D8] -ml-1.5 shadow-xs" />
                    <div className="h-[2px] flex-1 bg-[#A995D8]" />
                  </div>
                )}

                {/* Timed Schedules */}
                {dayTimedSchedules.map((occ) => {
                  const sMins = timeToMinutes(occ.schedule.startTime);
                  const eMins = timeToMinutes(occ.schedule.endTime);
                  const duration = Math.max(30, eMins - sMins);

                  const top = Math.max(
                    0,
                    ((sMins - timelineStartMinutes) / 60) * hourHeight
                  );
                  const height = Math.max(26, (duration / 60) * hourHeight - 2);

                  const color = getCategoryColor(occ.schedule.categoryId);

                  return (
                    <div
                      key={occ.occurrenceId}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSchedule(occ);
                      }}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: `${color}25`,
                        borderColor: color,
                      }}
                      className="absolute left-1 right-1 rounded-xl p-1.5 sm:p-2 border-l-4 shadow-2xs overflow-hidden cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md z-10"
                    >
                      <div className="font-semibold text-xs text-[#34313D] dark:text-[#F4F2F7] truncate leading-tight">
                        {occ.schedule.title}
                      </div>
                      <div className="text-[10px] font-mono text-[#898493] dark:text-[#9E99A8] truncate mt-0.5">
                        {formatTime(occ.schedule.startTime)} - {formatTime(occ.schedule.endTime)}
                      </div>
                      {occ.schedule.location && (
                        <div className="text-[9px] text-[#898493] truncate hidden sm:block">
                          {occ.schedule.location}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
