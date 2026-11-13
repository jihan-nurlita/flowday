export type AppThemeMode = 'light' | 'dark' | 'system';
export type AppLanguageCode = 'en' | 'id';
export type DateFormatOption = 'MMM d, yyyy' | 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
export type TimeFormatOption = '12h' | '24h';
export type StartOfWeekOption = 'monday' | 'sunday';
export type DefaultTaskPriorityOption = 'high' | 'medium' | 'low';
export type DefaultTaskViewOption = 'list' | 'grid';
export type DefaultTaskSortOption = 'newest' | 'oldest' | 'due_date' | 'priority' | 'alphabetical';
export type DefaultCalendarViewOption = 'month' | 'week' | 'day';
export type DefaultScheduleReminderOption = 'none' | 'at_time' | '5m' | '15m' | '30m' | '1h' | '1d';

export interface UserPreferences {
  // Appearance
  themeMode: AppThemeMode;
  theme?: AppThemeMode;

  // Language & Region
  language: AppLanguageCode;
  dateFormat?: DateFormatOption;
  timeFormat: TimeFormatOption;
  startOfWeek: StartOfWeekOption;
  firstDayOfWeek?: number;
  timezone?: string;

  // Notifications
  notificationEnabled: boolean;
  taskRemindersEnabled?: boolean;
  scheduleRemindersEnabled?: boolean;
  focusNotificationsEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  dailySummaryEnabled?: boolean;
  dailySummaryTime?: string;
  taskCompletionCelebration?: boolean;

  // Productivity Preferences
  defaultTaskPriority?: DefaultTaskPriorityOption;
  defaultTaskCategory?: string;
  defaultTaskView?: DefaultTaskViewOption;
  defaultTaskSort?: DefaultTaskSortOption;
  startOfDay?: string;

  // Focus Preferences
  pomodoroDurationMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  longBreakInterval?: number;
  autoStartBreaks?: boolean;
  autoStartFocus?: boolean;
  timerSoundEnabled?: boolean;
  timerHapticsEnabled?: boolean;

  // Calendar Preferences
  calendarDefaultView?: DefaultCalendarViewOption;
  defaultScheduleReminder?: DefaultScheduleReminderOption;
  showCompletedTasksInCalendar?: boolean;
  showTaskDeadlinesInCalendar?: boolean;
  showScheduleEventsInCalendar?: boolean;
  defaultEventDurationMinutes?: number;

  // Sync & Timestamp
  offlineSyncEnabled?: boolean;
  updatedAt?: string;
}

export interface User {
  uid: string;
  fullName: string;
  name?: string; // alias for compatibility
  email: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}
