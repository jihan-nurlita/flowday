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

export const DEFAULT_USER = {
  uid: 'usr_flowday_default',
  fullName: 'FlowDay Explorer',
  name: 'FlowDay Explorer',
  email: 'user@flowday.app',
  photoUrl: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  preferences: {
    themeMode: 'system' as const,
    theme: 'system' as const,
    language: 'en' as const,
    startOfWeek: 'monday' as const,
    timeFormat: '24h' as const,
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
    pomodoroDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartBreaks: false,
    firstDayOfWeek: 1, // Monday
    offlineSyncEnabled: true,
  },
};

