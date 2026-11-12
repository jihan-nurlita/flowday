import React from 'react';
import { Schedule, ScheduleOccurrence } from '../../../domain/entities/schedule';
import { Task } from '../../../domain/entities/task';
import { Category } from '../../../domain/entities/category';
import { getMonthMatrix, MonthGridDay, expandSchedulesForDate } from '../../../core/utils/calendar';
import { formatTime } from '../../../core/utils/date';
import { CheckCircle2, Circle, Clock, CheckSquare } from 'lucide-react';

interface CalendarMonthGridProps {
  currentDate: Date;
  selectedDate: string;
  schedules: Schedule[];
  tasks: Task[];
  categories: Category[];
  onSelectDate: (dateStr: string) => void;
  onSelectSchedule: (occurrence: ScheduleOccurrence) => void;
  onSelectTask: (task: Task) => void;
}

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  currentDate,
  selectedDate,
  schedules,
  tasks,
  categories,
  onSelectDate,
  onSelectSchedule,
  onSelectTask,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const matrix = getMonthMatrix(year, month);

  const getCategoryColor = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.color || '#A995D8';
  };

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] overflow-hidden shadow-xs">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823]">
        {weekdays.map((day, idx) => (
          <div
            key={day}
            className={`py-2.5 text-center text-[11px] font-bold uppercase tracking-wider ${
              idx >= 5 ? 'text-[#F1B8CC]' : 'text-[#898493] dark:text-[#9E99A8]'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[#EEEAF2] dark:divide-[#2D2838]">
        {matrix.map((row, rIdx) =>
          row.map((dayObj: MonthGridDay, cIdx: number) => {
            const isSelected = dayObj.dateString === selectedDate;
            const daySchedules = expandSchedulesForDate(schedules, dayObj.dateString);
            const dayTasks = tasks.filter((t) => t.dueDate === dayObj.dateString);

            const totalItems = daySchedules.length + dayTasks.length;
            const visibleSchedules = daySchedules.slice(0, 2);
            const remainingSlots = Math.max(0, 3 - visibleSchedules.length);
            const visibleTasks = dayTasks.slice(0, remainingSlots);
            const hiddenCount = totalItems - (visibleSchedules.length + visibleTasks.length);

            return (
              <div
                key={dayObj.dateString}
                onClick={() => onSelectDate(dayObj.dateString)}
                className={`min-h-[92px] sm:min-h-[115px] p-1.5 sm:p-2 transition-all flex flex-col justify-between cursor-pointer group ${
                  !dayObj.isCurrentMonth
                    ? 'bg-[#FAF9FC]/40 dark:bg-[#17151F]/40 text-[#898493]/60'
                    : 'bg-white dark:bg-[#201D27]'
                } ${
                  isSelected
                    ? 'ring-2 ring-inset ring-[#A995D8] bg-[#FAF9FC]/90 dark:bg-[#252130]'
                    : 'hover:bg-[#FAF9FC] dark:hover:bg-[#252130]'
                }`}
              >
                {/* Cell Header: Day Number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold transition-all ${
                      dayObj.isToday
                        ? 'bg-[#A995D8] text-white shadow-xs'
                        : isSelected
                        ? 'bg-[#EEEAF2] dark:bg-[#2D2838] text-[#A995D8]'
                        : dayObj.isCurrentMonth
                        ? 'text-[#34313D] dark:text-[#F4F2F7]'
                        : 'text-[#898493]/50'
                    }`}
                  >
                    {dayObj.dayNumber}
                  </span>

                  {totalItems > 0 && (
                    <span className="text-[10px] font-mono text-[#898493] dark:text-[#9E99A8] hidden sm:inline">
                      {totalItems}
                    </span>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {/* Schedules */}
                  {visibleSchedules.map((occ) => {
                    const catColor = getCategoryColor(occ.schedule.categoryId);
                    return (
                      <div
                        key={occ.occurrenceId}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSchedule(occ);
                        }}
                        className="truncate text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-medium transition-all hover:opacity-80 flex items-center gap-1 cursor-pointer"
                        style={{
                          backgroundColor: `${catColor}20`,
                          color: '#34313D',
                          borderLeft: `2.5px solid ${catColor}`,
                        }}
                        title={`${occ.schedule.title} (${occ.schedule.isAllDay ? 'All Day' : occ.schedule.startTime})`}
                      >
                        {!occ.schedule.isAllDay && (
                          <span className="font-mono text-[9px] text-[#898493] shrink-0">
                            {occ.schedule.startTime.slice(0, 5)}
                          </span>
                        )}
                        <span className="truncate">{occ.schedule.title}</span>
                      </div>
                    );
                  })}

                  {/* Task Deadlines */}
                  {visibleTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(t);
                      }}
                      className={`truncate text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-medium transition-all hover:opacity-80 flex items-center gap-1 cursor-pointer ${
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

                  {/* Hidden items badge */}
                  {hiddenCount > 0 && (
                    <div className="text-[9px] font-mono font-semibold text-[#898493] dark:text-[#9E99A8] px-1 pt-0.5">
                      +{hiddenCount} more
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
