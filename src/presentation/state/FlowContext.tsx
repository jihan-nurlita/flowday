/**
 * FlowDay Reactive State Management
 * Clean Provider & Hook Architecture for instantaneous reactive updates
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { NavigationTab } from '../../core/constants/defaults';
import { Task } from '../../domain/entities/task';
import { Schedule, ScheduleOccurrence } from '../../domain/entities/schedule';
import { Category } from '../../domain/entities/category';
import { Note } from '../../domain/entities/note';
import { FocusSession, FocusSessionType } from '../../domain/entities/focus_session';
import { AppNotification } from '../../domain/entities/notification';
import { DailyReview } from '../../domain/entities/daily_review';
import { ProductivityGoals } from '../../domain/entities/productivity_goal';
import { AppLanguageCode, User } from '../../domain/entities/user';
import { FirebaseSyncState } from '../../data/datasources/firebase_blueprint';
import { storageEngine } from '../../data/datasources/storage_engine';
import {
  taskRepo,
  scheduleRepo,
  categoryRepo,
  noteRepo,
  focusRepo,
  notificationRepo,
  dailyReviewRepo,
  productivityGoalRepo,
  userRepo,
} from '../../data/repositories/repository_impl';
import { ActivityItem, ActivityType } from '../../domain/entities/activity';
import { generateId } from '../../core/utils/id';
import { getTodayDateString, setActiveDateFormattingConfig } from '../../core/utils/date';
import { getTranslations, TranslationDictionary } from '../../core/i18n/translations';
import {
  calculateTodayDashboardSummary,
  GoalProgressResult,
} from '../../data/services/analytics_service';
import { notificationService, PlatformPermission } from '../../data/services/notification_service';
import { PrefSyncStatus, useAuth } from './AuthContext';

interface QuickCaptureState {
  isOpen: boolean;
  type: 'task' | 'schedule' | 'note';
}

interface FlowContextValue {
  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Domain data
  user: User | null;
  tasks: Task[];
  schedules: Schedule[];
  categories: Category[];
  notes: Note[];
  trashNotes: Note[];
  focusSessions: FocusSession[];
  notifications: AppNotification[];
  todayReview: DailyReview | null;
  productivityGoals: ProductivityGoals | null;
  activities: ActivityItem[];
  syncState: FirebaseSyncState;

  // Real Computed Statistics (calculated dynamically from actual database records)
  stats: {
    todayTasksTotal: number;
    todayTasksCompleted: number;
    todayTasksPending: number;
    todayCompletionRate: number;
    todayFocusSeconds: number;
    todayFocusMinutes: number;
    todayFocusSessionsCount: number;
    totalFocusSessions: number;
    activeNotesCount: number;
    pinnedNotesCount: number;
    favoriteNotesCount: number;
    trashNotesCount: number;
    upcomingSchedulesCount: number;
    todaySchedulesCount: number;
    urgentImportantCount: number;
    overdueTasksCount: number;
    activeTasksTotal: number;
    completedTasksTotal: number;
    weeklyTasksCompleted: number;
    weeklyCompletionRate: number;
    todayProductivityScore: number | null;
    goalProgress: GoalProgressResult;
  };

  // Overlays state
  isNotificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;

  // Quick Capture Modal
  quickCapture: QuickCaptureState;
  openQuickCapture: (type?: 'task' | 'schedule' | 'note') => void;
  closeQuickCapture: () => void;

  // Focus Timer active running state
  timerState: {
    timeLeft: number;
    totalDuration: number;
    isRunning: boolean;
    mode: FocusSessionType;
    activeTaskId: string | null;
    completedFocusCycles: number;
    start: () => void;
    pause: () => void;
    reset: () => void;
    setMode: (mode: FocusSessionType) => void;
    setActiveTaskId: (id: string | null) => void;
  };

  // Action methods
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleTaskComplete: (id: string) => Promise<Task>;

  createSchedule: (data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Schedule>;
  updateSchedule: (id: string, updates: Partial<Schedule>) => Promise<Schedule>;
  deleteSchedule: (id: string) => Promise<boolean>;
  duplicateSchedule: (id: string) => Promise<Schedule>;

  createCategory: (data: Omit<Category, 'id' | 'createdAt' | 'userId'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;

  createNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<boolean>;
  restoreNote: (id: string) => Promise<Note>;
  deleteNotePermanently: (id: string) => Promise<boolean>;
  emptyTrashNotes: () => Promise<boolean>;
  toggleNotePin: (id: string) => Promise<Note>;
  toggleNoteFavorite: (id: string) => Promise<Note>;

  recordFocusSession: (session: {
    duration: number;
    sessionType: FocusSessionType;
    taskId?: string;
  }) => Promise<FocusSession>;

  saveDailyReview: (reflection: string) => Promise<DailyReview>;
  saveProductivityGoals: (
    updates: Partial<
      Pick<
        ProductivityGoals,
        'dailyTaskGoal' | 'weeklyTaskGoal' | 'dailyFocusGoalMinutes' | 'weeklyFocusGoalMinutes'
      >
    >
  ) => Promise<ProductivityGoals>;

  // Notifications & Reminders
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markNotificationUnread: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  sendTestNotification: () => void;
  permissionStatus: PlatformPermission;
  requestNotificationPermission: () => Promise<PlatformPermission>;

  // Global modal deep-link state
  globalTaskModal: {
    task: Task | null;
    isOpen: boolean;
    open: (taskOrId: Task | string) => void;
    close: () => void;
  };
  globalScheduleModal: {
    occurrence: ScheduleOccurrence | null;
    isOpen: boolean;
    open: (scheduleOrId: Schedule | string) => void;
    close: () => void;
  };

  logActivity: (type: ActivityType, title: string, description?: string, color?: string) => void;

  // Language & Preferences
  language: AppLanguageCode;
  t: TranslationDictionary;
  prefSyncStatus: PrefSyncStatus;
  prefSaveError: string | null;
  hasPendingPrefSync: boolean;
  retrySyncPreferences: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<User['preferences']>) => Promise<void>;
  clearLocalCache: () => { clearedKeys: number };
  exportPersonalData: () => string;
  exportBackup: () => string;
  importBackup: (json: string) => boolean;
  resetDatabase: () => void;
  triggerManualSync: () => void;
}

const FlowContext = createContext<FlowContextValue | undefined>(undefined);

export const FlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [todayReview, setTodayReview] = useState<DailyReview | null>(null);
  const [productivityGoals, setProductivityGoals] = useState<ProductivityGoals | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Sync state
  const [syncState, setSyncState] = useState<FirebaseSyncState>({
    isConfigured: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingSyncCount: 0,
    syncStatus: 'synced',
    lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // Quick Capture Modal
  const [quickCapture, setQuickCapture] = useState<QuickCaptureState>({
    isOpen: false,
    type: 'task',
  });

  // Overlays (Notifications & Profile)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Platform Notification Permission
  const [permissionStatus, setPermissionStatus] = useState<PlatformPermission>(() =>
    notificationService.getPermissionStatus()
  );

  // Global modal deep-link state
  const [globalTaskModalTask, setGlobalTaskModalTask] = useState<Task | null>(null);
  const [globalTaskModalOpen, setGlobalTaskModalOpen] = useState(false);

  const [globalScheduleModalOccurrence, setGlobalScheduleModalOccurrence] = useState<ScheduleOccurrence | null>(null);
  const [globalScheduleModalOpen, setGlobalScheduleModalOpen] = useState(false);

  const openNotifications = useCallback(() => setIsNotificationsOpen(true), []);
  const closeNotifications = useCallback(() => setIsNotificationsOpen(false), []);
  const openProfile = useCallback(() => setIsProfileOpen(true), []);
  const closeProfile = useCallback(() => setIsProfileOpen(false), []);

  const openQuickCapture = useCallback((type: 'task' | 'schedule' | 'note' = 'task') => {
    setQuickCapture({ isOpen: true, type });
  }, []);

  const closeQuickCapture = useCallback(() => {
    setQuickCapture((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Timer State (Pomodoro)
  const getDurationSecondsForMode = useCallback(
    (mode: FocusSessionType, prefs?: User['preferences']): number => {
      if (mode === 'short_break') {
        return Math.max(1, prefs?.shortBreakMinutes ?? 5) * 60;
      }
      if (mode === 'long_break') {
        return Math.max(1, prefs?.longBreakMinutes ?? 15) * 60;
      }
      if (mode === 'deep_work') {
        return 45 * 60;
      }
      return Math.max(1, prefs?.pomodoroDurationMinutes ?? 25) * 60;
    },
    []
  );

  const defaultPomodoroSeconds = 25 * 60;
  const [timerMode, setTimerMode] = useState<FocusSessionType>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(defaultPomodoroSeconds);
  const [totalDuration, setTotalDuration] = useState<number>(defaultPomodoroSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);
  const [completedFocusCycles, setCompletedFocusCycles] = useState<number>(0);

  // Load and refresh all collections for current authenticated user
  const {
    currentUser: authUser,
    updatePreferences: authUpdatePreferences,
    prefSyncStatus,
    prefSaveError,
    hasPendingPrefSync,
    retrySyncPreferences,
  } = useAuth();

  const refreshAllData = useCallback(async () => {
    const currentUid = authUser?.uid || 'usr_flowday_default';
    const loadedUser = authUser || await userRepo.getUser(currentUid);
    setUser(loadedUser);

    // Ensure categories exist for this user with Part 8 required defaults (Personal, Work, Study, Ideas, Projects, Other)
    let c = await categoryRepo.getAll(currentUid);
    const standardCategories = [
      { name: 'Personal', color: '#F1B8CC' },
      { name: 'Work', color: '#A995D8' },
      { name: 'Study', color: '#A9C8E8' },
      { name: 'Ideas', color: '#FDE2B8' },
      { name: 'Projects', color: '#B5DCCB' },
      { name: 'Health', color: '#A8DADC' },
      { name: 'Shopping', color: '#F7D0BA' },
      { name: 'Other', color: '#898493' },
    ];
    if (c.length === 0) {
      for (const cat of standardCategories) {
        await categoryRepo.create({ ...cat, userId: currentUid });
      }
      c = await categoryRepo.getAll(currentUid);
    } else {
      // Add any missing standard categories
      for (const cat of standardCategories) {
        if (!c.some((existing) => existing.name.toLowerCase() === cat.name.toLowerCase())) {
          await categoryRepo.create({ ...cat, userId: currentUid });
        }
      }
      c = await categoryRepo.getAll(currentUid);
    }

    const [t, s, allNotes, f, notifs, review, loadedGoals] = await Promise.all([
      taskRepo.getAll(currentUid),
      scheduleRepo.getAll(currentUid),
      noteRepo.getAll(currentUid, true),
      focusRepo.getAll(currentUid),
      notificationRepo.getAll(currentUid),
      dailyReviewRepo.getByDate(currentUid, getTodayDateString()),
      productivityGoalRepo.getByUserId(currentUid),
    ]);

    const acts = storageEngine
      .getCollection<ActivityItem>('activities')
      .filter((a) => a.userId === currentUid)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    setTasks(t);
    setSchedules(s);
    setCategories(c);
    setNotes(allNotes.filter((n) => !n.isDeleted));
    setTrashNotes(allNotes.filter((n) => n.isDeleted));
    setFocusSessions(f);
    setNotifications(notifs);
    setTodayReview(review);
    setProductivityGoals(loadedGoals);
    setActivities(acts);

    // Apply theme, language & date formatting config
    const prefs = loadedUser?.preferences;
    const theme = prefs?.themeMode || prefs?.theme || 'system';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    }
    if (prefs) {
      document.documentElement.lang = prefs.language === 'id' ? 'id' : 'en';
      setActiveDateFormattingConfig({
        language: prefs.language || 'en',
        dateFormat: prefs.dateFormat || 'MMM d, yyyy',
        timeFormat: prefs.timeFormat || '24h',
        startOfWeek: prefs.startOfWeek || 'monday',
      });
    }
  }, [authUser]);

  // Apply idle focus duration changes only when timer is unstarted & not running
  useEffect(() => {
    if (!isTimerRunning && timeLeft === totalDuration) {
      const nextSeconds = getDurationSecondsForMode(timerMode, user?.preferences);
      if (nextSeconds !== totalDuration) {
        setTimeLeft(nextSeconds);
        setTotalDuration(nextSeconds);
      }
    }
  }, [
    user?.preferences?.pomodoroDurationMinutes,
    user?.preferences?.shortBreakMinutes,
    user?.preferences?.longBreakMinutes,
    timerMode,
    isTimerRunning,
    timeLeft,
    totalDuration,
    getDurationSecondsForMode,
  ]);

  // Initial load and subscriptions
  useEffect(() => {
    refreshAllData();

    // Subscribe to internal database engine events for multi-window/multi-component sync
    const unsubs = [
      storageEngine.subscribe('tasks', refreshAllData),
      storageEngine.subscribe('schedules', refreshAllData),
      storageEngine.subscribe('categories', refreshAllData),
      storageEngine.subscribe('notes', refreshAllData),
      storageEngine.subscribe('focus_sessions', refreshAllData),
      storageEngine.subscribe('notifications', refreshAllData),
      storageEngine.subscribe('users', refreshAllData),
      storageEngine.subscribe('daily_reviews', refreshAllData),
      storageEngine.subscribe('productivity_goals', refreshAllData),
      storageEngine.subscribe('activities', refreshAllData),
    ];

    // Online/offline listeners
    const handleOnline = () => setSyncState((prev) => ({ ...prev, isOnline: true, syncStatus: 'synced' }));
    const handleOffline = () => setSyncState((prev) => ({ ...prev, isOnline: false, syncStatus: 'offline' }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubs.forEach((unsub) => unsub());
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshAllData]);

  // Pomodoro countdown ticker with Focus Preferences (sound, haptics, auto-start, long break interval)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      const finishedMode = timerMode;
      const finishedDuration = totalDuration;
      const prefs = user?.preferences;

      // Record session completion
      if (user) {
        focusRepo
          .create({
            userId: user.uid,
            taskId: activeFocusTaskId || undefined,
            startTime: new Date(Date.now() - finishedDuration * 1000).toISOString(),
            endTime: new Date().toISOString(),
            duration: finishedDuration,
            sessionType: finishedMode,
            completed: true,
          })
          .then(() => {
            const act: ActivityItem = {
              id: generateId('act'),
              userId: user.uid,
              type: 'focus_completed',
              title: `Completed ${Math.round(finishedDuration / 60)}m Focus Session`,
              description: finishedMode.replace('_', ' '),
              color: '#F1B8CC',
              timestamp: new Date().toISOString(),
            };
            const list = storageEngine.getCollection<ActivityItem>('activities');
            storageEngine.setCollection<ActivityItem>(
              'activities',
              [act, ...list.filter((a) => a.userId === user.uid)].slice(0, 30)
            );
          });

        const focusNotifTitle =
          finishedMode === 'short_break' || finishedMode === 'long_break'
            ? 'Break completed!'
            : 'Focus session completed!';
        const focusNotifMsg = `Great job! You finished a ${Math.round(finishedDuration / 60)}-minute ${finishedMode.replace('_', ' ')} flow session.`;

        notificationRepo.create({
          userId: user.uid,
          title: focusNotifTitle,
          message: focusNotifMsg,
          body: focusNotifMsg,
          type: 'focus',
          relatedEntityType: 'focus',
          isRead: false,
          status: 'delivered',
        });

        const inQuietHours = notificationService.isQuietHours(prefs);
        if (!inQuietHours) {
          if (prefs?.timerSoundEnabled !== false) {
            notificationService.playGentleChime();
          }
          if (prefs?.timerHapticsEnabled !== false) {
            notificationService.triggerVibration();
          }
          if (prefs?.notificationEnabled !== false && prefs?.focusNotificationsEnabled !== false) {
            notificationService.showSystemNotification(focusNotifTitle, {
              body: focusNotifMsg,
            });
          }
        }
      }

      // Transition to next phase & honor auto-start preferences
      if (finishedMode === 'pomodoro' || finishedMode === 'deep_work') {
        const nextCycles = completedFocusCycles + 1;
        const intervalCount = Math.max(1, prefs?.longBreakInterval ?? 4);
        const nextMode: FocusSessionType =
          nextCycles % intervalCount === 0 ? 'long_break' : 'short_break';
        const nextSeconds = getDurationSecondsForMode(nextMode, prefs);
        setCompletedFocusCycles(nextCycles);
        setTimerMode(nextMode);
        setTotalDuration(nextSeconds);
        setTimeLeft(nextSeconds);
        setIsTimerRunning(Boolean(prefs?.autoStartBreaks));
      } else {
        const nextMode: FocusSessionType = 'pomodoro';
        const nextSeconds = getDurationSecondsForMode(nextMode, prefs);
        setTimerMode(nextMode);
        setTotalDuration(nextSeconds);
        setTimeLeft(nextSeconds);
        setIsTimerRunning(Boolean(prefs?.autoStartFocus));
      }
    }
    return () => clearInterval(interval);
  }, [
    isTimerRunning,
    timeLeft,
    totalDuration,
    timerMode,
    activeFocusTaskId,
    user,
    completedFocusCycles,
    getDurationSecondsForMode,
  ]);

  const setTimerModeHandler = useCallback(
    (mode: FocusSessionType) => {
      setIsTimerRunning(false);
      setTimerMode(mode);
      const seconds = getDurationSecondsForMode(mode, user?.preferences);
      setTimeLeft(seconds);
      setTotalDuration(seconds);
    },
    [getDurationSecondsForMode, user?.preferences]
  );

  // Real Computed Statistics (calculated dynamically via analytics_service single source of truth)
  const stats = useMemo(() => {
    const summary = calculateTodayDashboardSummary(
      tasks,
      schedules,
      focusSessions,
      categories,
      productivityGoals,
      {
        startOfWeek: user?.preferences?.startOfWeek || 'monday',
      }
    );

    const activeNotesCount = notes.filter((n) => !n.isDeleted).length;
    const pinnedNotesCount = notes.filter((n) => !n.isDeleted && n.isPinned).length;
    const favoriteNotesCount = notes.filter((n) => !n.isDeleted && n.isFavorite).length;
    const trashNotesCount = trashNotes.length;

    return {
      ...summary,
      activeNotesCount,
      pinnedNotesCount,
      favoriteNotesCount,
      trashNotesCount,
    };
  }, [tasks, focusSessions, schedules, categories, productivityGoals, user?.preferences?.startOfWeek, notes, trashNotes]);

  const logActivity = useCallback(
    (type: ActivityType, title: string, description?: string, color?: string) => {
      const uid = user ? user.uid : 'usr_flowday_default';
      const act: ActivityItem = {
        id: generateId('act'),
        userId: uid,
        type,
        title,
        description,
        color,
        timestamp: new Date().toISOString(),
      };
      const list = storageEngine.getCollection<ActivityItem>('activities');
      const updated = [act, ...list.filter((a) => a.userId === uid)].slice(0, 30);
      storageEngine.setCollection<ActivityItem>('activities', updated);
      setActivities(updated);
    },
    [user]
  );

  // Actions
  const createTask = useCallback(
    async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      const uid = user ? user.uid : 'usr_flowday_default';
      const created = await taskRepo.create({ ...data, userId: uid });
      logActivity('task_created', `Added task: "${created.title}"`, created.priority === 'urgent_important' ? 'Priority: Do First' : undefined, '#A995D8');
      await refreshAllData();
      return created;
    },
    [user, refreshAllData, logActivity]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      const updated = await taskRepo.update(id, updates);
      await refreshAllData();
      return updated;
    },
    [refreshAllData]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const res = await taskRepo.delete(id);
      await refreshAllData();
      return res;
    },
    [refreshAllData]
  );

  const toggleTaskComplete = useCallback(
    async (id: string) => {
      const updated = await taskRepo.toggleComplete(id);
      logActivity(
        updated.isCompleted ? 'task_completed' : 'task_reopened',
        updated.isCompleted ? `Completed task: "${updated.title}"` : `Reopened task: "${updated.title}"`,
        undefined,
        updated.isCompleted ? '#B5DCCB' : '#E9C46A'
      );

      // Celebrate task completion if enabled in preferences
      if (updated.isCompleted && user?.preferences?.taskCompletionCelebration !== false) {
        const title = 'Task Completed!';
        const message = `Great progress! You finished "${updated.title}".`;
        await notificationRepo.create({
          userId: updated.userId,
          title,
          message,
          body: message,
          type: 'task',
          relatedId: updated.id,
          relatedEntityId: updated.id,
          relatedEntityType: 'task',
          isRead: false,
          status: 'delivered',
        });
        notificationService.dispatchNotification({
          title,
          message,
          type: 'task',
          preferences: user?.preferences,
          relatedId: updated.id,
        });
      }

      await refreshAllData();
      return updated;
    },
    [user, refreshAllData, logActivity]
  );

  const createSchedule = useCallback(
    async (data: Omit<Schedule, 'id' | 'createdAt' | 'userId'>) => {
      const uid = user ? user.uid : 'usr_flowday_default';
      const created = await scheduleRepo.create({ ...data, userId: uid });
      logActivity('schedule_created', `Scheduled: "${created.title}"`, `${created.startTime} - ${created.endTime}`, '#A9C8E8');
      await refreshAllData();
      return created;
    },
    [user, refreshAllData, logActivity]
  );

  const updateSchedule = useCallback(
    async (id: string, updates: Partial<Schedule>) => {
      const updated = await scheduleRepo.update(id, updates);
      await refreshAllData();
      return updated;
    },
    [refreshAllData]
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      const res = await scheduleRepo.delete(id);
      await refreshAllData();
      return res;
    },
    [refreshAllData]
  );

  const duplicateSchedule = useCallback(
    async (id: string) => {
      const cloned = await scheduleRepo.duplicate(id);
      logActivity(
        'schedule_created',
        `Duplicated schedule: "${cloned.title}"`,
        `${cloned.startTime} - ${cloned.endTime}`,
        '#A9C8E8'
      );
      await refreshAllData();
      return cloned;
    },
    [refreshAllData, logActivity]
  );

  const createCategory = useCallback(
    async (data: Omit<Category, 'id' | 'createdAt' | 'userId'>) => {
      const uid = user ? user.uid : 'usr_flowday_default';
      const created = await categoryRepo.create({ ...data, userId: uid });
      await refreshAllData();
      return created;
    },
    [user, refreshAllData]
  );

  const updateCategory = useCallback(
    async (id: string, updates: Partial<Category>) => {
      const updated = await categoryRepo.update(id, updates);
      await refreshAllData();
      return updated;
    },
    [refreshAllData]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const res = await categoryRepo.delete(id);
      await refreshAllData();
      return res;
    },
    [refreshAllData]
  );

  const createNote = useCallback(
    async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
      const uid = user ? user.uid : 'usr_flowday_default';
      const created = await noteRepo.create({ ...data, userId: uid });
      logActivity('note_created', `Created note: "${created.title}"`, undefined, '#D4B8E8');
      await refreshAllData();
      return created;
    },
    [user, refreshAllData, logActivity]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      const updated = await noteRepo.update(id, updates);
      await refreshAllData();
      return updated;
    },
    [refreshAllData]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const target = await noteRepo.getById(id);
      await noteRepo.softDelete(id);
      logActivity(
        'note_deleted',
        `Moved to trash: "${target?.title || 'Note'}"`,
        undefined,
        '#F1B8CC'
      );
      await refreshAllData();
      return true;
    },
    [refreshAllData, logActivity]
  );

  const restoreNote = useCallback(
    async (id: string) => {
      const restored = await noteRepo.restore(id);
      logActivity('note_created', `Restored note: "${restored.title}"`, undefined, '#B5DCCB');
      await refreshAllData();
      return restored;
    },
    [refreshAllData, logActivity]
  );

  const deleteNotePermanently = useCallback(
    async (id: string) => {
      const res = await noteRepo.deletePermanently(id);
      await refreshAllData();
      return res;
    },
    [refreshAllData]
  );

  const emptyTrashNotes = useCallback(
    async () => {
      const uid = user ? user.uid : 'usr_flowday_default';
      const res = await noteRepo.emptyTrash(uid);
      logActivity('note_deleted', 'Emptied notes trash', undefined, '#F1B8CC');
      await refreshAllData();
      return res;
    },
    [user, refreshAllData, logActivity]
  );

  const toggleNotePin = useCallback(
    async (id: string) => {
      const updated = await noteRepo.togglePin(id);
      await refreshAllData();
      return updated;
    },
    [refreshAllData]
  );

  const toggleNoteFavorite = useCallback(
    async (id: string) => {
      const updated = await noteRepo.toggleFavorite(id);
      await refreshAllData();
      return updated;
    },
    [refreshAllData]
  );

  const recordFocusSession = useCallback(
    async (sessionData: {
      duration: number;
      sessionType: FocusSessionType;
      taskId?: string;
    }) => {
      const uid = user ? user.uid : 'usr_flowday_default';
      const created = await focusRepo.create({
        userId: uid,
        taskId: sessionData.taskId,
        startTime: new Date(Date.now() - sessionData.duration * 1000).toISOString(),
        endTime: new Date().toISOString(),
        duration: sessionData.duration,
        sessionType: sessionData.sessionType,
        completed: true,
      });
      logActivity(
        'focus_completed',
        `Completed ${Math.round(created.duration / 60)}m Focus Session`,
        created.sessionType.replace('_', ' '),
        '#F1B8CC'
      );
      await refreshAllData();
      return created;
    },
    [user, refreshAllData, logActivity]
  );

  const saveDailyReview = useCallback(
    async (reflection: string) => {
      const uid = user ? user.uid : 'usr_flowday_default';
      const today = getTodayDateString();
      const saved = await dailyReviewRepo.saveReview({
        userId: uid,
        date: today,
        completedTasks: stats.todayTasksCompleted,
        totalTasks: stats.todayTasksTotal,
        focusDuration: stats.todayFocusSeconds,
        reflection,
      });
      await refreshAllData();
      return saved;
    },
    [user, stats, refreshAllData]
  );

  const saveProductivityGoals = useCallback(
    async (
      updates: Partial<
        Pick<
          ProductivityGoals,
          'dailyTaskGoal' | 'weeklyTaskGoal' | 'dailyFocusGoalMinutes' | 'weeklyFocusGoalMinutes'
        >
      >
    ) => {
      const uid = user ? user.uid : 'usr_flowday_default';
      const saved = await productivityGoalRepo.saveGoals(uid, updates);
      setProductivityGoals(saved);
      await refreshAllData();
      return saved;
    },
    [user, refreshAllData]
  );

  // Notifications & Reminders
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      await notificationRepo.markAsRead(id);
      await refreshAllData();
    },
    [refreshAllData]
  );

  const markNotificationUnread = useCallback(
    async (id: string) => {
      await notificationRepo.markAsUnread(id);
      await refreshAllData();
    },
    [refreshAllData]
  );

  const markAllNotificationsRead = useCallback(async () => {
    const uid = user ? user.uid : 'usr_flowday_default';
    await notificationRepo.markAllAsRead(uid);
    await refreshAllData();
  }, [user, refreshAllData]);

  const deleteNotification = useCallback(
    async (id: string) => {
      await notificationRepo.delete(id);
      await refreshAllData();
    },
    [refreshAllData]
  );

  const clearNotifications = useCallback(async () => {
    const uid = user ? user.uid : 'usr_flowday_default';
    await notificationRepo.clearAll(uid);
    await refreshAllData();
  }, [user, refreshAllData]);

  const sendTestNotification = useCallback(() => {
    if (!user) return;
    const testTitle = 'FlowDay Preview Notification';
    const testMsg = 'Your notification system and calming chime are configured and active.';
    notificationRepo
      .create({
        userId: user.uid,
        title: testTitle,
        message: testMsg,
        body: testMsg,
        type: 'system',
        relatedEntityType: 'system',
        isRead: false,
        status: 'delivered',
      })
      .then(() => {
        refreshAllData();
      });

    notificationService.dispatchNotification({
      title: testTitle,
      message: testMsg,
      type: 'system',
      preferences: user.preferences,
    });
  }, [user, refreshAllData]);

  const requestNotificationPermission = useCallback(async () => {
    const res = await notificationService.requestPermission();
    setPermissionStatus(res);
    return res;
  }, []);

  // Global deep linking modal open/close
  const openGlobalTaskModal = useCallback(
    (taskOrId: Task | string) => {
      if (typeof taskOrId === 'string') {
        const found = tasks.find((t) => t.id === taskOrId);
        if (found) {
          setGlobalTaskModalTask(found);
          setGlobalTaskModalOpen(true);
        }
      } else {
        setGlobalTaskModalTask(taskOrId);
        setGlobalTaskModalOpen(true);
      }
    },
    [tasks]
  );

  const closeGlobalTaskModal = useCallback(() => {
    setGlobalTaskModalOpen(false);
    setGlobalTaskModalTask(null);
  }, []);

  const openGlobalScheduleModal = useCallback(
    (scheduleOrId: Schedule | string) => {
      let targetSchedule: Schedule | undefined;
      if (typeof scheduleOrId === 'string') {
        targetSchedule = schedules.find((s) => s.id === scheduleOrId);
      } else {
        targetSchedule = scheduleOrId;
      }

      if (targetSchedule) {
        const occ: ScheduleOccurrence = {
          schedule: targetSchedule,
          occurrenceDate: targetSchedule.startDate || targetSchedule.date || getTodayDateString(),
          isOccurrence: false,
          occurrenceId: targetSchedule.id,
        };
        setGlobalScheduleModalOccurrence(occ);
        setGlobalScheduleModalOpen(true);
      }
    },
    [schedules]
  );

  const closeGlobalScheduleModal = useCallback(() => {
    setGlobalScheduleModalOpen(false);
    setGlobalScheduleModalOccurrence(null);
  }, []);

  // Periodic Reminder Evaluation Engine (checks tasks, schedules, daily summary every 20s)
  useEffect(() => {
    if (!user) return;

    const runCheck = () => {
      notificationService.evaluateReminders({
        userId: user.uid,
        tasks,
        schedules,
        existingNotifications: notifications,
        preferences: user.preferences,
        onNotify: async (notifData) => {
          await notificationRepo.create(notifData);
          await refreshAllData();
        },
      });
    };

    runCheck();
    const interval = setInterval(runCheck, 20000);
    return () => clearInterval(interval);
  }, [user, tasks, schedules, notifications, refreshAllData]);

  const language: AppLanguageCode = user?.preferences?.language === 'id' ? 'id' : 'en';
  const t = useMemo(() => getTranslations(language), [language]);

  const updateUserPreferences = useCallback(
    async (prefs: Partial<User['preferences']>) => {
      const uid = user ? user.uid : 'usr_flowday_default';
      if (authUser) {
        await authUpdatePreferences(prefs);
        // Keep local repository synced without masking AuthContext errors
        await userRepo.updatePreferences(uid, prefs).catch(() => undefined);
      } else {
        const updated = await userRepo.updatePreferences(uid, prefs);
        setUser(updated);
      }

      const nextLanguage = prefs.language || user?.preferences?.language || 'en';
      const nextDateFormat = prefs.dateFormat || user?.preferences?.dateFormat || 'MMM d, yyyy';
      const nextTimeFormat = prefs.timeFormat || user?.preferences?.timeFormat || '24h';
      const nextStartOfWeek = prefs.startOfWeek || user?.preferences?.startOfWeek || 'monday';

      document.documentElement.lang = nextLanguage === 'id' ? 'id' : 'en';
      setActiveDateFormattingConfig({
        language: nextLanguage,
        dateFormat: nextDateFormat,
        timeFormat: nextTimeFormat,
        startOfWeek: nextStartOfWeek,
      });

      const themeVal = prefs.themeMode || prefs.theme;
      if (themeVal) {
        if (themeVal === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (themeVal === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle('dark', isDark);
        }
      }
    },
    [user, authUser, authUpdatePreferences]
  );

  const clearLocalCache = useCallback(() => {
    return storageEngine.clearLocalCache();
  }, []);

  const exportPersonalData = useCallback(() => {
    return storageEngine.exportPersonalData(user);
  }, [user]);

  const exportBackup = useCallback(() => {
    return storageEngine.exportBackup();
  }, []);

  const importBackup = useCallback(
    (json: string) => {
      const res = storageEngine.importBackup(json);
      if (res) refreshAllData();
      return res;
    },
    [refreshAllData]
  );

  const resetDatabase = useCallback(() => {
    storageEngine.clearAllData();
    refreshAllData();
  }, [refreshAllData]);

  const triggerManualSync = useCallback(() => {
    setSyncState((prev) => ({
      ...prev,
      syncStatus: 'syncing',
    }));
    if (authUser && hasPendingPrefSync) {
      retrySyncPreferences().catch(() => undefined);
    }
    setTimeout(() => {
      setSyncState((prev) => ({
        ...prev,
        syncStatus: navigator.onLine ? 'synced' : 'offline',
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
    }, 600);
  }, [authUser, hasPendingPrefSync, retrySyncPreferences]);

  const timerControls = {
    timeLeft,
    totalDuration,
    isRunning: isTimerRunning,
    mode: timerMode,
    activeTaskId: activeFocusTaskId,
    completedFocusCycles,
    start: () => setIsTimerRunning(true),
    pause: () => setIsTimerRunning(false),
    reset: () => {
      setIsTimerRunning(false);
      setTimerModeHandler(timerMode);
    },
    setMode: setTimerModeHandler,
    setActiveTaskId: setActiveFocusTaskId,
  };

  const value = {
    activeTab,
    setActiveTab,
    user,
    tasks,
    schedules,
    categories,
    notes,
    trashNotes,
    focusSessions,
    notifications,
    todayReview,
    productivityGoals,
    activities,
    syncState,
    stats,
    isNotificationsOpen,
    openNotifications,
    closeNotifications,
    isProfileOpen,
    openProfile,
    closeProfile,
    quickCapture,
    openQuickCapture,
    closeQuickCapture,
    timerState: timerControls,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    duplicateSchedule,
    createCategory,
    updateCategory,
    deleteCategory,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    deleteNotePermanently,
    emptyTrashNotes,
    toggleNotePin,
    toggleNoteFavorite,
    recordFocusSession,
    saveDailyReview,
    saveProductivityGoals,
    unreadNotificationsCount,
    markNotificationRead,
    markNotificationUnread,
    markAllNotificationsRead,
    deleteNotification,
    clearNotifications,
    sendTestNotification,
    permissionStatus,
    requestNotificationPermission,
    globalTaskModal: {
      task: globalTaskModalTask,
      isOpen: globalTaskModalOpen,
      open: openGlobalTaskModal,
      close: closeGlobalTaskModal,
    },
    globalScheduleModal: {
      occurrence: globalScheduleModalOccurrence,
      isOpen: globalScheduleModalOpen,
      open: openGlobalScheduleModal,
      close: closeGlobalScheduleModal,
    },
    logActivity,
    language,
    t,
    prefSyncStatus,
    prefSaveError,
    hasPendingPrefSync,
    retrySyncPreferences,
    updateUserPreferences,
    clearLocalCache,
    exportPersonalData,
    exportBackup,
    importBackup,
    resetDatabase,
    triggerManualSync,
  };

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
};

export const useFlow = (): FlowContextValue => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
};
