import React, { useState } from 'react';
import { useFlow } from '../../state/FlowContext';
import { Schedule, ScheduleOccurrence } from '../../../domain/entities/schedule';
import { CategoryBadge } from '../CategoryBadge';
import { formatTime, formatFullDate } from '../../../core/utils/date';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Bell,
  Repeat,
  FileText,
  Copy,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../buttons/AppButtons';

interface ScheduleDetailModalProps {
  occurrence: ScheduleOccurrence | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (schedule: Schedule) => void;
}

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  occurrence,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { deleteSchedule, updateSchedule, duplicateSchedule } = useFlow();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'this' | 'all'>('this');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  if (!isOpen || !occurrence) return null;

  const { schedule, occurrenceDate, isOccurrence } = occurrence;
  const isRecurring =
    schedule.recurrenceRule && schedule.recurrenceRule.frequency !== 'none';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isRecurring && deleteMode === 'this') {
        // Add occurrenceDate to recurrenceExceptions so this day is skipped
        const existingExceptions = schedule.recurrenceExceptions || [];
        if (!existingExceptions.includes(occurrenceDate)) {
          await updateSchedule(schedule.id, {
            recurrenceExceptions: [...existingExceptions, occurrenceDate],
          });
        }
      } else {
        // Delete entire schedule series
        await deleteSchedule(schedule.id);
      }
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await duplicateSchedule(schedule.id);
      onClose();
    } finally {
      setIsDuplicating(false);
    }
  };

  const getRecurrenceText = () => {
    const rule = schedule.recurrenceRule;
    if (!rule || rule.frequency === 'none') return 'Does not repeat';
    const interval = rule.interval && rule.interval > 1 ? `every ${rule.interval} ` : 'every ';
    if (rule.frequency === 'daily') return `Repeats ${interval}day(s)`;
    if (rule.frequency === 'weekly') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const daysStr = rule.daysOfWeek?.map((d) => dayNames[d]).join(', ');
      return `Repeats ${interval}week(s) on ${daysStr || 'weekdays'}`;
    }
    if (rule.frequency === 'monthly') return `Repeats ${interval}month(s)`;
    if (rule.frequency === 'yearly') return `Repeats ${interval}year(s)`;
    if (rule.frequency === 'custom') return `Custom repeat schedule`;
    return 'Repeats';
  };

  const getReminderText = () => {
    if (!schedule.reminderSettings?.enabled) return 'No reminder';
    const type = schedule.reminderSettings.type;
    if (type === 'at_event') return 'At time of event';
    if (type === '5m') return '5 minutes before';
    if (type === '10m') return '10 minutes before';
    if (type === '15m') return '15 minutes before';
    if (type === '30m') return '30 minutes before';
    if (type === '1h') return '1 hour before';
    if (type === 'custom')
      return `Custom: ${schedule.reminderSettings.customDateTime || 'Set'}`;
    return 'Reminder active';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#EEEAF2] dark:border-[#2D2838]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#F0F6FC] dark:bg-[#1E2530] flex items-center justify-center text-[#A9C8E8] shrink-0 mt-0.5">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <CategoryBadge categoryId={schedule.categoryId} />
                {schedule.isAllDay ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF9FC] dark:bg-[#1A1823] text-[#898493] border border-[#EEEAF2] dark:border-[#2D2838]">
                    All Day
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#FAF9FC] dark:bg-[#1A1823] text-[#898493] border border-[#EEEAF2] dark:border-[#2D2838]">
                    {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
                  </span>
                )}
                {isRecurring && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4F1FA] text-[#A995D8] dark:bg-[#2C253B]">
                    <Repeat className="w-2.5 h-2.5" />
                    Repeating
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#34313D] dark:text-[#F4F2F7] leading-snug break-words">
                {schedule.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#898493] hover:text-[#34313D] dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="py-4 space-y-4 text-xs">
          {/* Date & Occurrence */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
            <Calendar className="w-4 h-4 text-[#A995D8] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                {formatFullDate(occurrenceDate)}
              </p>
              {isOccurrence && (
                <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-0.5">
                  Occurrence of series starting {formatFullDate(schedule.startDate || schedule.date)}
                </p>
              )}
            </div>
          </div>

          {/* Time & Duration */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
            <Clock className="w-4 h-4 text-[#A9C8E8] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                {schedule.isAllDay ? 'All Day Event' : `${formatTime(schedule.startTime)} to ${formatTime(schedule.endTime)}`}
              </p>
              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-0.5">
                Local Device Timezone
              </p>
            </div>
          </div>

          {/* Location */}
          {schedule.location && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
              <MapPin className="w-4 h-4 text-[#B5DCCB] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">Location</p>
                <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-0.5 break-words">
                  {schedule.location}
                </p>
              </div>
            </div>
          )}

          {/* Recurrence Rule */}
          {isRecurring && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
              <Repeat className="w-4 h-4 text-[#A995D8] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">Recurrence</p>
                <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-0.5">
                  {getRecurrenceText()}
                </p>
              </div>
            </div>
          )}

          {/* Reminder */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
            <Bell className="w-4 h-4 text-[#F1B8CC] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">Reminder</p>
              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-0.5">
                {getReminderText()}
              </p>
            </div>
          </div>

          {/* Description & Notes */}
          {(schedule.description || schedule.notes) && (
            <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                <FileText className="w-3.5 h-3.5 text-[#898493]" />
                <span>Notes & Agenda</span>
              </div>
              {schedule.description && (
                <p className="text-xs text-[#34313D] dark:text-[#F4F2F7] whitespace-pre-wrap leading-relaxed">
                  {schedule.description}
                </p>
              )}
              {schedule.notes && (
                <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] whitespace-pre-wrap pt-1 border-t border-[#EEEAF2] dark:border-[#2D2838]">
                  {schedule.notes}
                </p>
              )}
            </div>
          )}

          {/* Meta timestamps */}
          <div className="text-[10px] text-[#898493] dark:text-[#9E99A8] font-mono flex items-center justify-between pt-1">
            <span>Created: {new Date(schedule.createdAt).toLocaleDateString()}</span>
            {schedule.updatedAt && (
              <span>Updated: {new Date(schedule.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Delete Confirmation Sub-Dialog */}
        {showDeleteConfirm ? (
          <div className="p-4 rounded-2xl bg-[#FCF3F0] dark:bg-[#381E19] border border-[#F7C5BA] dark:border-[#522923] space-y-3 mb-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#E07A5F] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#E07A5F]">
                  Delete {isRecurring ? 'Recurring Schedule' : 'Schedule'}?
                </h4>
                <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-0.5">
                  Are you sure you want to remove &quot;{schedule.title}&quot;?
                </p>
              </div>
            </div>

            {isRecurring && (
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-xs text-[#34313D] dark:text-[#F4F2F7] cursor-pointer">
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteMode === 'this'}
                    onChange={() => setDeleteMode('this')}
                    className="text-[#E07A5F] focus:ring-[#E07A5F]"
                  />
                  <span>Delete only this occurrence ({occurrenceDate})</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#34313D] dark:text-[#F4F2F7] cursor-pointer">
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteMode === 'all'}
                    onChange={() => setDeleteMode('all')}
                    className="text-[#E07A5F] focus:ring-[#E07A5F]"
                  />
                  <span>Delete all events in this repeating series</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <SecondaryButton
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </SecondaryButton>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E07A5F] text-white hover:bg-[#D0694E] transition-colors cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        ) : (
          /* Bottom Action Buttons */
          <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838]">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E07A5F] hover:bg-[#FCF3F0] dark:hover:bg-[#381E19] transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <SecondaryButton
                size="sm"
                icon={Copy}
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                {isDuplicating ? 'Copying...' : 'Duplicate'}
              </SecondaryButton>

              <PrimaryButton
                size="sm"
                icon={Edit2}
                onClick={() => {
                  onClose();
                  onEdit(schedule);
                }}
              >
                Edit
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
