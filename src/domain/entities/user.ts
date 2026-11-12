export interface UserPreferences {
  themeMode: 'light' | 'dark' | 'system';
  theme?: 'light' | 'dark' | 'system';
  language: 'en' | 'id';
  startOfWeek: 'monday' | 'sunday';
  timeFormat: '12h' | '24h';
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
  pomodoroDurationMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  autoStartBreaks?: boolean;
  firstDayOfWeek?: number;
  offlineSyncEnabled?: boolean;
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
