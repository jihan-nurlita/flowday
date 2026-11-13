import { UserPreferences } from '../../domain/entities/user';

/**
 * Default configurations and identifiers for FlowDay
 */

export type NavigationTab =
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'focus'
  | 'notes'
  | 'analytics'
  | 'notifications'
  | 'settings'
  | 'profile';

export const APP_INFO = {
  name: 'FlowDay',
  tagline: 'Plan Your Day, Find Your Flow.',
  version: '1.0.0',
  buildNumber: '2026.11.12',
  description:
    'Smart Daily Planner & Productivity Manager built with Premium Soft Pastel clarity to help you organize tasks, plan schedules, stay focused, capture notes, and track genuine productivity.',
  privacyPolicyUrl: null as string | null,
  termsOfServiceUrl: null as string | null,
  openSourceLicenses: [
    { name: 'React', version: '19.0.1', license: 'MIT' },
    { name: 'Firebase Web SDK', version: '13.2.0', license: 'Apache-2.0' },
    { name: 'Tailwind CSS', version: '4.3.3', license: 'MIT' },
    { name: 'Lucide React', version: '0.546.0', license: 'ISC' },
    { name: 'Motion', version: '12.23.24', license: 'MIT' },
  ],
} as const;

export const APP_ROUTES = [
  { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'tasks' as NavigationTab, label: 'Tasks', icon: 'CheckSquare' },
  { id: 'calendar' as NavigationTab, label: 'Schedule', icon: 'Calendar' },
  { id: 'focus' as NavigationTab, label: 'Focus', icon: 'Timer' },
  { id: 'notes' as NavigationTab, label: 'Notes', icon: 'StickyNote' },
  { id: 'analytics' as NavigationTab, label: 'Review', icon: 'BarChart3' },
  { id: 'notifications' as NavigationTab, label: 'Notifications', icon: 'Bell' },
  { id: 'settings' as NavigationTab, label: 'Settings', icon: 'Settings' },
];

export const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    subLabel: 'Urgent & Important',
    color: '#E07A5F',
    bgColor: '#FCF3F0',
    order: 1,
  },
  urgent_important: {
    label: 'High',
    subLabel: 'Do First',
    color: '#E07A5F',
    bgColor: '#FCF3F0',
    order: 1,
  },
  medium: {
    label: 'Medium',
    subLabel: 'Important',
    color: '#A995D8',
    bgColor: '#F4F1FA',
    order: 2,
  },
  important: {
    label: 'Medium',
    subLabel: 'Schedule',
    color: '#A995D8',
    bgColor: '#F4F1FA',
    order: 2,
  },
  urgent: {
    label: 'Medium',
    subLabel: 'Delegate',
    color: '#E9C46A',
    bgColor: '#FDF8EC',
    order: 2,
  },
  low: {
    label: 'Low',
    subLabel: 'Low Impact',
    color: '#898493',
    bgColor: '#F4F3F7',
    order: 3,
  },
} as const;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  themeMode: 'system',
  theme: 'system',
  language: 'en',
  dateFormat: 'MMM d, yyyy',
  timeFormat: '24h',
  startOfWeek: 'monday',
  firstDayOfWeek: 1,
  timezone:
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC',
  notificationEnabled: true,
  taskRemindersEnabled: true,
  scheduleRemindersEnabled: true,
  focusNotificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  dailySummaryEnabled: true,
  dailySummaryTime: '08:00',
  taskCompletionCelebration: true,
  defaultTaskPriority: 'medium',
  defaultTaskCategory: '',
  defaultTaskView: 'list',
  defaultTaskSort: 'newest',
  startOfDay: '08:00',
  pomodoroDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  timerSoundEnabled: true,
  timerHapticsEnabled: true,
  calendarDefaultView: 'month',
  defaultScheduleReminder: '15m',
  showCompletedTasksInCalendar: true,
  showTaskDeadlinesInCalendar: true,
  showScheduleEventsInCalendar: true,
  defaultEventDurationMinutes: 60,
  offlineSyncEnabled: true,
};

export const DEFAULT_USER = {
  uid: 'usr_flowday_default',
  fullName: 'FlowDay Explorer',
  name: 'FlowDay Explorer',
  email: 'user@flowday.app',
  photoUrl: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  preferences: DEFAULT_USER_PREFERENCES,
};
