import React, { useState, useEffect } from 'react';
import { useFlow } from '../../state/FlowContext';
import { Schedule, RecurrenceRule, ScheduleReminderType } from '../../../domain/entities/schedule';
import { detectScheduleConflicts, scheduleBrowserReminder } from '../../../core/utils/calendar';
import { getTodayDateString, formatTime } from '../../../core/utils/date';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Bell,
  Repeat,
  AlertTriangle,
  FileText,
  Tag,
  Check,
} from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../buttons/AppButtons';

interface ScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSchedule?: Schedule | null;
  initialDate?: string;
  initialTime?: string;
}

export const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({
  isOpen,
  onClose,
  editingSchedule,
  initialDate,
  initialTime,
}) => {
  const { user, schedules, categories, createSchedule, updateSchedule } = useFlow();

  const prefDurationMinutes = Math.max(5, user?.preferences?.defaultEventDurationMinutes ?? 60);
  const prefReminderRaw = user?.preferences?.defaultScheduleReminder || '15m';
  const mappedPrefReminder: ScheduleReminderType =
    prefReminderRaw === 'at_time'
      ? 'at_event'
      : prefReminderRaw === '1d'
      ? '1h'
      : (prefReminderRaw as ScheduleReminderType);

  const computeEndTimeFromStart = (startHHMM: string, durationMins: number): string => {
    const [hStr, mStr] = startHHMM.split(':');
    const totalStart = (parseInt(hStr, 10) || 9) * 60 + (parseInt(mStr, 10) || 0);
    const clampedEnd = Math.min(23 * 60 + 59, totalStart + durationMins);
    const eh = Math.floor(clampedEnd / 60);
    const em = clampedEnd % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  };

  const defaultDate = initialDate || getTodayDateString();
  const defaultStartTime = initialTime || '09:00';
  const defaultEndTime = computeEndTimeFromStart(defaultStartTime, prefDurationMinutes);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [isAllDay, setIsAllDay] = useState(false);

  // Reminders
  const [reminderType, setReminderType] = useState<ScheduleReminderType>('15m');
  const [customReminderTime, setCustomReminderTime] = useState('');

  // Recurrence
  const [repeatFreq, setRepeatFreq] = useState<RecurrenceRule['frequency']>('none');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1]); // Monday default
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [repeatCount, setRepeatCount] = useState<number | undefined>(undefined);

  // Notes
  const [notes, setNotes] = useState('');

  // UI state
  const [validationError, setValidationError] = useState('');
  const [conflicts, setConflicts] = useState<Schedule[]>([]);
  const [ignoreConflicts, setIgnoreConflicts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when opening or editing
  useEffect(() => {
    if (editingSchedule) {
      setTitle(editingSchedule.title);
      setDescription(editingSchedule.description || '');
      setCategoryId(editingSchedule.categoryId || categories[0]?.id || '');
      setLocation(editingSchedule.location || '');
      setStartDate(editingSchedule.startDate || editingSchedule.date || defaultDate);
      setEndDate(editingSchedule.endDate || editingSchedule.startDate || editingSchedule.date || defaultDate);
      setStartTime(editingSchedule.startTime || '09:00');
      setEndTime(editingSchedule.endTime || '10:00');
      setIsAllDay(Boolean(editingSchedule.isAllDay));
      setNotes(editingSchedule.notes || '');

      if (editingSchedule.reminderSettings?.enabled) {
        setReminderType(editingSchedule.reminderSettings.type || '15m');
        setCustomReminderTime(editingSchedule.reminderSettings.customDateTime || '');
      } else {
        setReminderType('none');
      }

      if (editingSchedule.recurrenceRule && editingSchedule.recurrenceRule.frequency !== 'none') {
        const rule = editingSchedule.recurrenceRule;
        setRepeatFreq(rule.frequency);
        setRepeatInterval(rule.interval || 1);
        setSelectedWeekdays(rule.daysOfWeek || [1]);
        setRepeatEndDate(rule.endDate || '');
        setRepeatCount(rule.count);
      } else {
        setRepeatFreq('none');
      }
    } else {
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setLocation('');
      setStartDate(initialDate || getTodayDateString());
      setEndDate(initialDate || getTodayDateString());
      setStartTime(initialTime || '09:00');
      setEndTime(defaultEndTime);
      setIsAllDay(false);
      setReminderType(mappedPrefReminder);
      setCustomReminderTime('');
      setRepeatFreq('none');
      setRepeatInterval(1);
      setSelectedWeekdays([1]);
      setRepeatEndDate('');
      setRepeatCount(undefined);
      setNotes('');
    }
    setValidationError('');
    setConflicts([]);
    setIgnoreConflicts(false);
  }, [editingSchedule, isOpen, categories, initialDate, initialTime, defaultEndTime, mappedPrefReminder]);

  // Check for conflicts in real-time
  useEffect(() => {
    if (!startDate || !startTime || !endTime || isAllDay) {
      setConflicts([]);
      return;
    }

    const detected = detectScheduleConflicts(
      {
        id: editingSchedule?.id,
        startDate,
        endDate,
        startTime,
        endTime,
        isAllDay,
      },
      schedules
    );
    setConflicts(detected);
  }, [startDate, endDate, startTime, endTime, isAllDay, editingSchedule, schedules]);

  if (!isOpen) return null;

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim()) {
      setValidationError('Schedule title is required.');
      return;
    }

    if (!startDate) {
      setValidationError('Start date is required.');
      return;
    }

    if (endDate < startDate) {
      setValidationError('End date cannot be earlier than start date.');
      return;
    }

    if (!isAllDay && startDate === endDate && endTime <= startTime) {
      setValidationError('End time must be after start time for same-day events.');
      return;
    }

    if (conflicts.length > 0 && !ignoreConflicts) {
      setValidationError('Please review the schedule conflict below or choose to save anyway.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build reminder settings
      const reminderSettings = {
        enabled: reminderType !== 'none',
        type: reminderType,
        customDateTime: reminderType === 'custom' ? customReminderTime : undefined,
      };

      // Build recurrence rule
      const recurrenceRule: RecurrenceRule | undefined =
        repeatFreq === 'none'
          ? undefined
          : {
              frequency: repeatFreq,
              interval: repeatInterval,
              daysOfWeek: repeatFreq === 'weekly' || repeatFreq === 'custom' ? selectedWeekdays : undefined,
              endDate: repeatEndDate || undefined,
              count: repeatCount ? Number(repeatCount) : undefined,
            };

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || categories[0]?.id || 'cat_default',
        location: location.trim() || undefined,
        startDate,
        endDate: endDate || startDate,
        date: startDate,
        startTime: isAllDay ? '00:00' : startTime,
        endTime: isAllDay ? '23:59' : endTime,
        isAllDay,
        reminderSettings,
        reminderEnabled: reminderSettings.enabled,
        recurrenceRule,
        notes: notes.trim() || undefined,
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, payload);
      } else {
        await createSchedule(payload);
      }

      // Schedule browser notification if enabled
      if (reminderSettings.enabled && !isAllDay) {
        const offsetMins =
          reminderType === 'at_event'
            ? 0
            : reminderType === '5m'
            ? 5
            : reminderType === '10m'
            ? 10
            : reminderType === '15m'
            ? 15
            : reminderType === '30m'
            ? 30
            : reminderType === '1h'
            ? 60
            : 0;

        const eventTime = new Date(`${startDate}T${startTime}:00`).getTime();
        const triggerTime = eventTime - offsetMins * 60 * 1000;
        scheduleBrowserReminder(
          `FlowDay Reminder: ${title.trim()}`,
          `Upcoming schedule at ${formatTime(startTime)}${location ? ` (${location})` : ''}`,
          triggerTime
        );
      }

      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const weekdays = [
    { label: 'M', day: 1 },
    { label: 'T', day: 2 },
    { label: 'W', day: 3 },
    { label: 'T', day: 4 },
    { label: 'F', day: 5 },
    { label: 'S', day: 6 },
    { label: 'S', day: 0 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EEEAF2] dark:border-[#2D2838] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0F6FC] dark:bg-[#1E2530] flex items-center justify-center text-[#A9C8E8]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#34313D] dark:text-[#F4F2F7]">
                {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
              </h3>
              <p className="text-xs text-[#898493] dark:text-[#9E99A8]">
                {editingSchedule ? 'Update schedule details and recurrence' : 'Add time block to your calendar'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#898493] hover:text-[#34313D] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error banner */}
        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-[#FCF3F0] dark:bg-[#381E19] border border-[#F7C5BA] dark:border-[#522923] text-xs text-[#E07A5F] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Schedule Conflicts Alert Box */}
        {conflicts.length > 0 && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF9E6] dark:bg-[#38311B] border border-[#F3E2A9] dark:border-[#5C502C] text-xs">
            <div className="flex items-start gap-2 text-[#9A7416] dark:text-[#F1D07A] font-semibold mb-1">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Schedule Conflict Detected</span>
            </div>
            <p className="text-[#846618] dark:text-[#D9BC6C] text-[11px] mb-2">
              This event overlaps with {conflicts.length} existing schedule{conflicts.length > 1 ? 's' : ''}:
            </p>
            <ul className="space-y-1 mb-2.5">
              {conflicts.map((c) => (
                <li
                  key={c.id}
                  className="px-2 py-1 rounded-md bg-white/60 dark:bg-black/30 text-[11px] font-mono text-[#34313D] dark:text-[#F4F2F7] flex items-center justify-between"
                >
                  <span className="font-sans font-medium">{c.title}</span>
                  <span>
                    {formatTime(c.startTime)} – {formatTime(c.endTime)}
                  </span>
                </li>
              ))}
            </ul>
            <label className="flex items-center gap-2 cursor-pointer text-[#846618] dark:text-[#D9BC6C]">
              <input
                type="checkbox"
                checked={ignoreConflicts}
                onChange={(e) => setIgnoreConflicts(e.target.checked)}
                className="rounded border-[#F3E2A9] text-[#A995D8] focus:ring-[#A995D8]"
              />
              <span className="text-[11px] font-medium">Save anyway despite time conflict</span>
            </label>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] mb-1.5">
              Schedule Title <span className="text-[#E07A5F]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Team Sync, Deep Work Block, Yoga"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-sm text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8] transition-colors"
              autoFocus
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8] transition-colors cursor-pointer appearance-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#898493]">
                  <Tag className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] mb-1.5">
                Location (optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Zoom, Office Room 3, Gym"
                  className="w-full px-3.5 py-2.5 pl-8 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8] transition-colors"
                />
                <MapPin className="w-3.5 h-3.5 text-[#898493] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#A995D8]" />
              <span className="text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                All Day Event
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#EEEAF2] dark:bg-[#2D2838] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A995D8]"></div>
            </label>
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF9FC]/60 dark:bg-[#1A1823]/60 border border-[#EEEAF2] dark:border-[#2D2838]">
            {/* Start Date & End Date */}
            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs font-mono text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs font-mono text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8]"
              />
            </div>

            {/* Start & End Times (hidden/disabled if All Day) */}
            {!isAllDay && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs font-mono text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs font-mono text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8]"
                  />
                </div>
              </>
            )}
          </div>

          {/* Recurrence Rule Builder */}
          <div className="p-3.5 rounded-2xl bg-[#FAF9FC]/60 dark:bg-[#1A1823]/60 border border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#A9C8E8]" />
                <span className="text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                  Repeat Schedule
                </span>
              </div>
              <select
                value={repeatFreq}
                onChange={(e) => setRepeatFreq(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8] cursor-pointer"
              >
                <option value="none">Does Not Repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Repeat</option>
              </select>
            </div>

            {/* Custom / Weekly Days of Week */}
            {(repeatFreq === 'weekly' || repeatFreq === 'custom') && (
              <div>
                <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                  Repeat on Days:
                </label>
                <div className="flex items-center gap-1.5">
                  {weekdays.map(({ label, day }) => {
                    const isSelected = selectedWeekdays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekday(day)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#A995D8] text-white shadow-xs'
                            : 'bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] text-[#898493]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Interval & Limits */}
            {repeatFreq !== 'none' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EEEAF2] dark:border-[#2D2838]">
                <div>
                  <label className="block text-[10px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                    Every (Interval)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 px-2 py-1 rounded-lg border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs font-mono text-center"
                    />
                    <span className="text-xs text-[#898493]">
                      {repeatFreq === 'daily'
                        ? 'day(s)'
                        : repeatFreq === 'weekly'
                        ? 'week(s)'
                        : repeatFreq === 'monthly'
                        ? 'month(s)'
                        : repeatFreq === 'yearly'
                        ? 'year(s)'
                        : 'period'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                    End Repeat (optional)
                  </label>
                  <input
                    type="date"
                    min={startDate}
                    value={repeatEndDate}
                    onChange={(e) => setRepeatEndDate(e.target.value)}
                    placeholder="No end"
                    className="w-full px-2.5 py-1 rounded-lg border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs font-mono text-[#34313D] dark:text-[#F4F2F7]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reminder Settings */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#F1B8CC]" />
              <span className="text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                Reminder
              </span>
            </div>
            <select
              value={reminderType}
              onChange={(e) => setReminderType(e.target.value as ScheduleReminderType)}
              className="px-2.5 py-1.5 rounded-lg border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8] cursor-pointer"
            >
              <option value="none">No Reminder</option>
              <option value="at_event">At Time of Event</option>
              <option value="5m">5 Minutes Before</option>
              <option value="10m">10 Minutes Before</option>
              <option value="15m">15 Minutes Before</option>
              <option value="30m">30 Minutes Before</option>
              <option value="1h">1 Hour Before</option>
              <option value="custom">Custom Date & Time</option>
            </select>
          </div>

          {reminderType === 'custom' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Custom Reminder Timestamp
              </label>
              <input
                type="datetime-local"
                value={customReminderTime}
                onChange={(e) => setCustomReminderTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs font-mono text-[#34313D] dark:text-[#F4F2F7]"
              />
            </div>
          )}

          {/* Description & Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] mb-1">
              Description & Notes (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add agenda topics, links, or notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838]">
            <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={isSubmitting} icon={Check}>
              {isSubmitting ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
