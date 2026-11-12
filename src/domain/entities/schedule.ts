export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g. 1, 2, 3
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  endDate?: string; // YYYY-MM-DD
  count?: number; // max occurrences count
}

export type ScheduleReminderType =
  | 'none'
  | 'at_event'
  | '5m'
  | '10m'
  | '15m'
  | '30m'
  | '1h'
  | 'custom';

export interface ScheduleReminderSettings {
  enabled: boolean;
  type: ScheduleReminderType;
  customDateTime?: string;
  minutesBefore?: number;
}

export interface Schedule {
  id: string;
  userId: string;
  title: string;
  description?: string;
  categoryId: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (defaults to startDate)
  date: string; // YYYY-MM-DD (mirrors startDate for backwards compatibility)
  startTime: string; // HH:mm (e.g., '09:00')
  endTime: string; // HH:mm (e.g., '10:30')
  isAllDay: boolean;
  reminderSettings?: ScheduleReminderSettings;
  reminderEnabled: boolean; // backwards compatibility
  recurrenceRule?: RecurrenceRule;
  recurrenceExceptions?: string[]; // YYYY-MM-DD dates excluded from recurring series
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScheduleOccurrence {
  schedule: Schedule;
  occurrenceDate: string; // YYYY-MM-DD
  isOccurrence: boolean;
  occurrenceId: string;
}
