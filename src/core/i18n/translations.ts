import { AppLanguageCode } from '../../domain/entities/user';

export interface TranslationDictionary {
  common: {
    save: string;
    saving: string;
    saved: string;
    saveFailed: string;
    retry: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    close: string;
    enabled: string;
    disabled: string;
    offlineNotice: string;
    quickCapture: string;
    newItem: string;
    dailyGoal: string;
    tasksDoneOf: string;
    synced: string;
    syncing: string;
    offline: string;
    more: string;
    moreOptions: string;
  };
  nav: {
    mainMenu: string;
    accountSystem: string;
    dashboard: string;
    calendar: string;
    tasks: string;
    focus: string;
    notes: string;
    statistics: string;
    notifications: string;
    profile: string;
    settings: string;
    home: string;
    statsShort: string;
  };
  pageTitles: {
    dashboard: string;
    calendar: string;
    tasks: string;
    focus: string;
    notes: string;
    analytics: string;
    notifications: string;
    settings: string;
    profile: string;
  };
  dashboard: {
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    subtitle: string;
    dailyInspiration: string;
    todaysTasks: string;
    pendingLabel: string;
    upcomingSchedule: string;
    eventsToday: string;
    noMoreEvents: string;
    nextEventPrefix: string;
    focusTime: string;
    loggedToday: string;
    sessionsCompleted: string;
    productivityProgress: string;
    completionLabel: string;
    priorityTasksTitle: string;
    addTask: string;
    viewAll: string;
    noUrgentTitle: string;
    noUrgentDesc: string;
    addPriorityTask: string;
    todaysScheduleTitle: string;
    addSchedule: string;
    viewCalendar: string;
    noEventsTitle: string;
    noEventsDesc: string;
    addTimeBlock: string;
    recentNotesTitle: string;
    addNote: string;
    noNotesTitle: string;
    noNotesDesc: string;
    createFirstNote: string;
    quickActions: string;
    createNewTodo: string;
    blockYourTime: string;
    startFocus: string;
    viewFocus: string;
    activeSession: string;
    createNote: string;
    captureIdeas: string;
    productivitySummary: string;
    details: string;
    flowScore: string;
    tasksCompleted: string;
    tasksPending: string;
    focusDuration: string;
    focusSessions: string;
    goalsReached: string;
    recentActivity: string;
    noRecentActivity: string;
  };
  tasks: {
    title: string;
    subtitle: string;
    activeCount: string;
    completedCount: string;
    searchPlaceholder: string;
    filters: string;
    addTask: string;
    categories: string;
    clearFilters: string;
  };
  calendar: {
    title: string;
    subtitle: string;
    today: string;
    addSchedule: string;
    month: string;
    week: string;
    day: string;
    searchPlaceholder: string;
    filters: string;
  };
  focus: {
    title: string;
    subtitle: string;
    pomodoro: string;
    shortBreak: string;
    longBreak: string;
    deepWork: string;
    activeState: string;
    pausedState: string;
    targetTask: string;
    generalFlow: string;
    startFlow: string;
    pauseSession: string;
    focusMetrics: string;
    sessions: string;
    totalTime: string;
    recordedHistory: string;
    noHistoryTitle: string;
    noHistoryDesc: string;
    cycleProgress: string;
  };
  notes: {
    title: string;
    subtitle: string;
    newNote: string;
    allNotes: string;
    pinned: string;
    favorites: string;
    trash: string;
    searchPlaceholder: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    markAllRead: string;
    clearAll: string;
    today: string;
    yesterday: string;
    earlier: string;
    all: string;
    unread: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    configureGoals: string;
    offlineNotice: string;
    tasksCompleted: string;
    tasksPending: string;
    tasksOverdue: string;
    completionRate: string;
    totalFocusTime: string;
    focusSessions: string;
    dailyProductivity: string;
    weeklyProductivity: string;
    reflectionTitle: string;
    saveReflection: string;
  };
  settings: {
    title: string;
    subtitle: string;
    sections: {
      account: string;
      appearance: string;
      languageRegion: string;
      notifications: string;
      productivity: string;
      calendar: string;
      focus: string;
      dataPrivacy: string;
      about: string;
    };
    status: {
      saving: string;
      saved: string;
      savedOffline: string;
      saveError: string;
      conflictNotice: string;
    };
    account: {
      title: string;
      desc: string;
      displayName: string;
      emailAddress: string;
      updateName: string;
      changePhoto: string;
      removePhoto: string;
      changeEmailTitle: string;
      changeEmailDesc: string;
      newEmail: string;
      sendEmailVerification: string;
      emailVerificationSent: string;
      changePasswordTitle: string;
      changePasswordDesc: string;
      newPassword: string;
      confirmPassword: string;
      updatePassword: string;
      securityTitle: string;
      authProvider: string;
      emailVerified: string;
      verifiedYes: string;
      verifiedNo: string;
      reauthPrompt: string;
      currentPassword: string;
      logout: string;
      deleteAccount: string;
      deleteConfirmTitle: string;
      deleteConfirmMsg: string;
      googleAccountPasswordNote: string;
    };
    appearance: {
      title: string;
      desc: string;
      light: string;
      dark: string;
      system: string;
      previewNote: string;
    };
    languageRegion: {
      title: string;
      desc: string;
      appLanguage: string;
      dateFormat: string;
      timeFormat: string;
      timeFormat24: string;
      timeFormat12: string;
      firstDayOfWeek: string;
      monday: string;
      sunday: string;
      timezoneDisplay: string;
      timezoneHint: string;
      previewLabel: string;
    };
    notifications: {
      title: string;
      desc: string;
      masterToggle: string;
      taskReminders: string;
      taskRemindersDesc: string;
      scheduleReminders: string;
      scheduleRemindersDesc: string;
      focusAlerts: string;
      focusAlertsDesc: string;
      celebrations: string;
      celebrationsDesc: string;
      sound: string;
      soundDesc: string;
      vibration: string;
      vibrationDesc: string;
      vibrationUnsupported: string;
      quietHours: string;
      quietHoursDesc: string;
      quietStart: string;
      quietEnd: string;
      dailySummary: string;
      dailySummaryDesc: string;
      deliveryTime: string;
      osPermission: string;
      permissionGranted: string;
      permissionDenied: string;
      permissionDefault: string;
      permissionUnsupported: string;
      permissionDeniedHint: string;
      requestPermission: string;
      previewAlert: string;
    };
    productivity: {
      title: string;
      desc: string;
      goalsHeader: string;
      dailyTaskGoal: string;
      weeklyTaskGoal: string;
      dailyFocusGoal: string;
      weeklyFocusGoal: string;
      saveGoals: string;
      defaultsHeader: string;
      defaultPriority: string;
      defaultCategory: string;
      defaultView: string;
      defaultSort: string;
      startOfDay: string;
      listView: string;
      gridView: string;
      autoCategory: string;
      validationError: string;
    };
    calendar: {
      title: string;
      desc: string;
      defaultView: string;
      firstDayOfWeek: string;
      defaultReminder: string;
      defaultDuration: string;
      showCompletedTasks: string;
      showCompletedTasksDesc: string;
      showTaskDeadlines: string;
      showTaskDeadlinesDesc: string;
      showScheduleEvents: string;
      showScheduleEventsDesc: string;
      minutesUnit: string;
    };
    focus: {
      title: string;
      desc: string;
      focusDuration: string;
      shortBreakDuration: string;
      longBreakDuration: string;
      longBreakInterval: string;
      sessionsUnit: string;
      minutesUnit: string;
      autoStartBreak: string;
      autoStartBreakDesc: string;
      autoStartFocus: string;
      autoStartFocusDesc: string;
      timerSound: string;
      timerSoundDesc: string;
      timerHaptics: string;
      timerHapticsDesc: string;
      runningSessionNote: string;
      validationError: string;
    };
    dataPrivacy: {
      title: string;
      desc: string;
      storedSummary: string;
      syncStatusLabel: string;
      pendingSyncLabel: string;
      lastSyncedLabel: string;
      syncNow: string;
      clearCache: string;
      clearCacheDesc: string;
      clearCacheConfirmTitle: string;
      clearCacheConfirmMsg: string;
      cacheClearedNotice: string;
      exportData: string;
      importBackup: string;
      importSuccess: string;
      importFailed: string;
      privacyTitle: string;
      privacyBullets: string[];
      resetDatabase: string;
      resetConfirmTitle: string;
      resetConfirmMsg: string;
    };
    about: {
      title: string;
      desc: string;
      version: string;
      buildNumber: string;
      legalTitle: string;
      privacyPolicy: string;
      termsOfService: string;
      notConfigured: string;
      openSourceTitle: string;
    };
  };
}

export const TRANSLATIONS: Record<AppLanguageCode, TranslationDictionary> = {
  en: {
    common: {
      save: 'Save',
      saving: 'Saving...',
      saved: 'Saved',
      saveFailed: 'Failed to save changes',
      retry: 'Retry',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      enabled: 'Enabled',
      disabled: 'Disabled',
      offlineNotice: 'You are currently offline. Changes are saved locally and will sync when reconnected.',
      quickCapture: 'Quick Capture',
      newItem: 'New Item',
      dailyGoal: 'Daily Goal',
      tasksDoneOf: 'of',
      synced: 'Synced',
      syncing: 'Syncing',
      offline: 'Offline',
      more: 'More',
      moreOptions: 'More Options',
    },
    nav: {
      mainMenu: 'Main Menu',
      accountSystem: 'Account & System',
      dashboard: 'Dashboard',
      calendar: 'Calendar',
      tasks: 'My Tasks',
      focus: 'Focus',
      notes: 'My Notes',
      statistics: 'Statistics',
      notifications: 'Notifications',
      profile: 'My Profile',
      settings: 'Settings',
      home: 'Home',
      statsShort: 'Stats',
    },
    pageTitles: {
      dashboard: 'Dashboard',
      calendar: 'Calendar & Agenda',
      tasks: 'My Tasks',
      focus: 'Focus & Pomodoro',
      notes: 'My Notes',
      analytics: 'Statistics & Review',
      notifications: 'Notifications',
      settings: 'Settings',
      profile: 'My Profile',
    },
    dashboard: {
      goodMorning: 'Good Morning',
      goodAfternoon: 'Good Afternoon',
      goodEvening: 'Good Evening',
      subtitle: 'Plan your day, prioritize essentials, and find your flow.',
      dailyInspiration: 'Daily Inspiration',
      todaysTasks: "Today's Tasks",
      pendingLabel: 'pending',
      upcomingSchedule: 'Upcoming Schedule',
      eventsToday: 'events today',
      noMoreEvents: 'No more events scheduled',
      nextEventPrefix: 'Next',
      focusTime: 'Focus Time',
      loggedToday: 'logged today',
      sessionsCompleted: 'sessions completed',
      productivityProgress: 'Productivity Progress',
      completionLabel: 'completion',
      priorityTasksTitle: 'Priority Tasks · Do First',
      addTask: 'Add Task',
      viewAll: 'View All',
      noUrgentTitle: 'No urgent tasks pending',
      noUrgentDesc: 'Your high-priority Eisenhower matrix is completely clear! Add high-impact tasks to keep momentum.',
      addPriorityTask: '+ Add Priority Task',
      todaysScheduleTitle: "Today's Schedule & Agenda",
      addSchedule: 'Add Schedule',
      viewCalendar: 'View Calendar',
      noEventsTitle: 'No events scheduled for today',
      noEventsDesc: 'Set specific time blocks for deep work, meetings, or personal routines to stay structured.',
      addTimeBlock: '+ Add Time Block',
      recentNotesTitle: 'Recent Notes & Ideas',
      addNote: 'Add Note',
      noNotesTitle: 'No notes recorded yet',
      noNotesDesc: 'Jot down quick thoughts, project brainstorms, or study notes with beautiful pastel cards.',
      createFirstNote: '+ Create First Note',
      quickActions: 'Quick Actions',
      createNewTodo: 'Create new to-do',
      blockYourTime: 'Block your time',
      startFocus: 'Start Focus',
      viewFocus: 'View Focus',
      activeSession: 'Active session',
      createNote: 'Create Note',
      captureIdeas: 'Capture ideas',
      productivitySummary: 'Productivity Summary',
      details: 'Details',
      flowScore: 'Flow Score',
      tasksCompleted: 'Tasks Completed',
      tasksPending: 'Tasks Pending',
      focusDuration: 'Focus Duration',
      focusSessions: 'Focus Sessions',
      goalsReached: 'Goals Reached',
      recentActivity: 'Recent Activity',
      noRecentActivity: 'No recent activity recorded yet today. Complete a task or start a focus session to see your progress here!',
    },
    tasks: {
      title: 'My Tasks',
      subtitle: 'Organize your work and stay productive.',
      activeCount: 'Active',
      completedCount: 'Completed',
      searchPlaceholder: 'Search tasks by title, description, or category...',
      filters: 'Filters',
      addTask: 'Add Task',
      categories: 'Categories',
      clearFilters: 'Clear Filters',
    },
    calendar: {
      title: 'Calendar',
      subtitle: 'Plan your time and stay organized.',
      today: 'Today',
      addSchedule: 'Add Schedule',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      searchPlaceholder: 'Search schedules or tasks...',
      filters: 'Filters',
    },
    focus: {
      title: 'Focus & Pomodoro',
      subtitle: 'Eliminate digital noise, focus on one intention, and track real completed flow blocks.',
      pomodoro: 'Pomodoro',
      shortBreak: 'Short Break',
      longBreak: 'Long Break',
      deepWork: 'Deep Work',
      activeState: 'Flow state active',
      pausedState: 'Paused / Ready',
      targetTask: 'Target Task for this Session:',
      generalFlow: 'General Flow / No Task Attached',
      startFlow: 'Start Flow',
      pauseSession: 'Pause Session',
      focusMetrics: 'Focus Metrics',
      sessions: 'Sessions',
      totalTime: 'Total Time',
      recordedHistory: 'Recorded Focus History',
      noHistoryTitle: 'No focus history yet',
      noHistoryDesc: 'Complete your first flow session to record duration and streak progress.',
      cycleProgress: 'Cycle until Long Break',
    },
    notes: {
      title: 'My Notes',
      subtitle: 'Capture ideas, thoughts, and structured references in one calm space.',
      newNote: 'New Note',
      allNotes: 'All Notes',
      pinned: 'Pinned',
      favorites: 'Favorites',
      trash: 'Trash',
      searchPlaceholder: 'Search notes, tags, or content...',
    },
    notifications: {
      title: 'Notifications & Reminders',
      subtitle: 'Stay aware of upcoming schedules, deadlines, and focus milestones.',
      markAllRead: 'Mark All Read',
      clearAll: 'Clear All',
      today: 'Today',
      yesterday: 'Yesterday',
      earlier: 'Earlier',
      all: 'All',
      unread: 'Unread',
    },
    analytics: {
      title: 'Statistics & Productivity Analytics',
      subtitle: 'Track real task progress, focus duration, goals, and period trends from your workspace records.',
      configureGoals: 'Configure Goals',
      offlineNotice: 'You are currently offline. Analytics are computed directly from your locally persisted database.',
      tasksCompleted: 'Tasks Completed',
      tasksPending: 'Tasks Pending',
      tasksOverdue: 'Tasks Overdue',
      completionRate: 'Completion Rate',
      totalFocusTime: 'Total Focus Time',
      focusSessions: 'Focus Sessions',
      dailyProductivity: 'Daily Productivity',
      weeklyProductivity: 'Weekly Productivity',
      reflectionTitle: "Today's Reflection Journal",
      saveReflection: 'Save Reflection',
    },
    settings: {
      title: 'Settings & Preferences',
      subtitle: 'Customize your FlowDay workspace, theme, language, productivity defaults, and account security.',
      sections: {
        account: 'Account',
        appearance: 'Appearance',
        languageRegion: 'Language & Region',
        notifications: 'Notifications',
        productivity: 'Productivity',
        calendar: 'Calendar',
        focus: 'Focus Timer',
        dataPrivacy: 'Data & Privacy',
        about: 'About FlowDay',
      },
      status: {
        saving: 'Saving preferences...',
        saved: 'Preferences saved & synced',
        savedOffline: 'Saved locally (pending cloud sync)',
        saveError: 'Failed to save preferences. Please retry.',
        conflictNotice: 'Synced latest preferences using timestamp resolution.',
      },
      account: {
        title: 'Account & Security',
        desc: 'Manage your profile identity, Firebase Authentication credentials, and active session.',
        displayName: 'Full Name',
        emailAddress: 'Current Email',
        updateName: 'Save Profile',
        changePhoto: 'Upload Photo',
        removePhoto: 'Remove Photo',
        changeEmailTitle: 'Change Email Address',
        changeEmailDesc: 'Firebase sends a verification link to your new email before applying the change.',
        newEmail: 'New Email Address',
        sendEmailVerification: 'Send Verification Email',
        emailVerificationSent: 'Verification email sent to your new address. Confirm it to complete the update.',
        changePasswordTitle: 'Change Password',
        changePasswordDesc: 'Update your account password. Recent authentication may be required.',
        newPassword: 'New Password',
        confirmPassword: 'Confirm New Password',
        updatePassword: 'Update Password',
        securityTitle: 'Account Security',
        authProvider: 'Sign-in Provider',
        emailVerified: 'Email Verification',
        verifiedYes: 'Verified',
        verifiedNo: 'Not Verified',
        reauthPrompt: 'For your security, enter your current password to verify your identity.',
        currentPassword: 'Current Password',
        logout: 'Log Out',
        deleteAccount: 'Delete Account',
        deleteConfirmTitle: 'Delete FlowDay Account',
        deleteConfirmMsg: 'This action permanently removes your Firebase Authentication account, cloud profile, and local workspace data. This cannot be undone.',
        googleAccountPasswordNote: 'You signed in with Google. Password management is handled through your Google Account.',
      },
      appearance: {
        title: 'Appearance & Theme',
        desc: 'Select Light, Dark, or follow your operating system setting automatically across all views.',
        light: 'Light',
        dark: 'Dark',
        system: 'System Default',
        previewNote: 'Applied globally to dashboard, charts, dialogs, forms, and navigation.',
      },
      languageRegion: {
        title: 'Language & Region',
        desc: 'Control interface language, date formatting, 12/24-hour clock, and week boundaries.',
        appLanguage: 'App Language',
        dateFormat: 'Date Format',
        timeFormat: 'Time Format',
        timeFormat24: '24-hour (14:30)',
        timeFormat12: '12-hour (2:30 PM)',
        firstDayOfWeek: 'First Day of Week',
        monday: 'Monday',
        sunday: 'Sunday',
        timezoneDisplay: 'Device Timezone',
        timezoneHint: 'Historical timestamps remain preserved regardless of display format changes.',
        previewLabel: 'Live Format Preview',
      },
      notifications: {
        title: 'Notification Preferences',
        desc: 'Uses the centralized FlowDay Notification Service for reminders, chimes, and quiet hours.',
        masterToggle: 'Enable Notifications',
        taskReminders: 'Task Reminders',
        taskRemindersDesc: 'Due date alerts and overdue notifications',
        scheduleReminders: 'Schedule Reminders',
        scheduleRemindersDesc: 'Agenda & recurring event alerts',
        focusAlerts: 'Focus Notifications',
        focusAlertsDesc: 'Work & break completion notices',
        celebrations: 'Task Celebrations',
        celebrationsDesc: 'Encouraging notice when completing tasks',
        sound: 'Notification Sound',
        soundDesc: 'Soft 528Hz harmonic chime',
        vibration: 'Vibration',
        vibrationDesc: 'Subtle haptic pulse on supported devices',
        vibrationUnsupported: 'Vibration is not supported by this browser/device.',
        quietHours: 'Quiet Hours',
        quietHoursDesc: 'Silences sound and system alerts while still logging in-app',
        quietStart: 'Start Time',
        quietEnd: 'End Time',
        dailySummary: 'Daily Summary',
        dailySummaryDesc: 'Morning briefing of tasks and schedules',
        deliveryTime: 'Summary Time',
        osPermission: 'System / Browser Permission',
        permissionGranted: 'Granted',
        permissionDenied: 'Denied',
        permissionDefault: 'Not Requested',
        permissionUnsupported: 'Unsupported',
        permissionDeniedHint: 'Notifications are blocked in your browser settings. Enable site notifications in browser preferences to receive OS alerts.',
        requestPermission: 'Enable System Alerts',
        previewAlert: 'Send Test Alert',
      },
      productivity: {
        title: 'Productivity Preferences',
        desc: 'Configure shared goals (synced with Statistics) and default values when creating new tasks.',
        goalsHeader: 'Daily & Weekly Targets',
        dailyTaskGoal: 'Daily Task Goal',
        weeklyTaskGoal: 'Weekly Task Goal',
        dailyFocusGoal: 'Daily Focus Goal (mins)',
        weeklyFocusGoal: 'Weekly Focus Goal (mins)',
        saveGoals: 'Save Targets',
        defaultsHeader: 'Task Creation & View Defaults',
        defaultPriority: 'Default Task Priority',
        defaultCategory: 'Default Task Category',
        defaultView: 'Default Task View',
        defaultSort: 'Default Sorting',
        startOfDay: 'Start of Day',
        listView: 'List View',
        gridView: 'Grid View',
        autoCategory: 'First Available Category',
        validationError: 'Enabled targets must be positive numbers (at least 1).',
      },
      calendar: {
        title: 'Calendar Preferences',
        desc: 'Customize default view, reminder defaults, event duration, and visible calendar items.',
        defaultView: 'Default Calendar View',
        firstDayOfWeek: 'First Day of Week',
        defaultReminder: 'Default Event Reminder',
        defaultDuration: 'Default Event Duration',
        showCompletedTasks: 'Show Completed Tasks',
        showCompletedTasksDesc: 'Display finished tasks inside calendar views',
        showTaskDeadlines: 'Show Task Deadlines',
        showTaskDeadlinesDesc: 'Display task due dates on month, week, and day views',
        showScheduleEvents: 'Show Schedule Events',
        showScheduleEventsDesc: 'Display timed and all-day agenda blocks',
        minutesUnit: 'mins',
      },
      focus: {
        title: 'Focus Timer Preferences',
        desc: 'Applies to your next focus session without interrupting any currently active timer.',
        focusDuration: 'Default Focus Duration',
        shortBreakDuration: 'Short Break Duration',
        longBreakDuration: 'Long Break Duration',
        longBreakInterval: 'Long Break Interval',
        sessionsUnit: 'sessions',
        minutesUnit: 'mins',
        autoStartBreak: 'Auto-Start Break',
        autoStartBreakDesc: 'Automatically start break countdown after a work block finishes',
        autoStartFocus: 'Auto-Start Next Focus Session',
        autoStartFocusDesc: 'Automatically transition back to focus after a break ends',
        timerSound: 'Timer Completion Sound',
        timerSoundDesc: 'Play gentle chime when timer hits 00:00',
        timerHaptics: 'Timer Haptic Feedback',
        timerHapticsDesc: 'Trigger device vibration on timer completion when supported',
        runningSessionNote: 'A focus timer is currently running. New durations will apply after you reset or complete the active session.',
        validationError: 'Durations and intervals must be at least 1.',
      },
      dataPrivacy: {
        title: 'Data & Privacy',
        desc: 'Inspect stored data, sync status, export your actual records, or safely clear ephemeral cache.',
        storedSummary: 'Stored Workspace Records',
        syncStatusLabel: 'Connection & Sync Status',
        pendingSyncLabel: 'Pending Preferences Sync',
        lastSyncedLabel: 'Last Synced',
        syncNow: 'Sync Now',
        clearCache: 'Clear Local Cache',
        clearCacheDesc: 'Clears temporary UI cache only. Your tasks, schedules, notes, focus logs, and unsynced changes remain intact.',
        clearCacheConfirmTitle: 'Clear Temporary Cache',
        clearCacheConfirmMsg: 'This removes temporary UI cache keys only. Your primary database records and unsynced preferences will not be deleted.',
        cacheClearedNotice: 'Temporary local cache cleared safely without touching your database records.',
        exportData: 'Export Personal Data (JSON)',
        importBackup: 'Restore JSON Backup',
        importSuccess: 'Backup restored successfully!',
        importFailed: 'Failed to restore backup: invalid file format.',
        privacyTitle: 'What FlowDay Stores & Protects',
        privacyBullets: [
          'Your tasks, schedules, notes, focus sessions, notifications, and productivity goals are stored locally for offline access and scoped by your user ID.',
          'Account profile and preferences sync with Cloud Firestore under owner-only security rules.',
          'Passwords are never stored in Firestore or browser storage; authentication is handled exclusively by Firebase Authentication.',
        ],
        resetDatabase: 'Reset Local Database',
        resetConfirmTitle: 'Reset Local Workspace Database',
        resetConfirmMsg: 'Warning: This clears all local tasks, schedules, notes, and focus sessions on this device. Export a backup first if needed.',
      },
      about: {
        title: 'About FlowDay',
        desc: 'Smart Daily Planner & Productivity Manager designed for calm, focused daily execution.',
        version: 'Application Version',
        buildNumber: 'Build Number',
        legalTitle: 'Policies & Legal',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        notConfigured: 'Official URL not yet configured',
        openSourceTitle: 'Open Source Dependencies',
      },
    },
  },
  id: {
    common: {
      save: 'Simpan',
      saving: 'Menyimpan...',
      saved: 'Tersimpan',
      saveFailed: 'Gagal menyimpan perubahan',
      retry: 'Coba Lagi',
      cancel: 'Batal',
      confirm: 'Konfirmasi',
      delete: 'Hapus',
      edit: 'Ubah',
      close: 'Tutup',
      enabled: 'Aktif',
      disabled: 'Nonaktif',
      offlineNotice: 'Anda sedang offline. Perubahan disimpan secara lokal dan akan disinkronkan saat terhubung kembali.',
      quickCapture: 'Tambah Cepat',
      newItem: 'Item Baru',
      dailyGoal: 'Target Harian',
      tasksDoneOf: 'dari',
      synced: 'Tersinkron',
      syncing: 'Menyinkronkan',
      offline: 'Offline',
      more: 'Lainnya',
      moreOptions: 'Menu Lainnya',
    },
    nav: {
      mainMenu: 'Menu Utama',
      accountSystem: 'Akun & Sistem',
      dashboard: 'Beranda',
      calendar: 'Kalender',
      tasks: 'Tugas Saya',
      focus: 'Fokus',
      notes: 'Catatan',
      statistics: 'Statistik',
      notifications: 'Notifikasi',
      profile: 'Profil Saya',
      settings: 'Pengaturan',
      home: 'Beranda',
      statsShort: 'Statistik',
    },
    pageTitles: {
      dashboard: 'Beranda',
      calendar: 'Kalender & Agenda',
      tasks: 'Tugas Saya',
      focus: 'Fokus & Pomodoro',
      notes: 'Catatan Saya',
      analytics: 'Statistik & Evaluasi',
      notifications: 'Notifikasi',
      settings: 'Pengaturan',
      profile: 'Profil Saya',
    },
    dashboard: {
      goodMorning: 'Selamat Pagi',
      goodAfternoon: 'Selamat Siang',
      goodEvening: 'Selamat Malam',
      subtitle: 'Rencanakan harimu, prioritaskan hal penting, dan temukan ritmemu.',
      dailyInspiration: 'Inspirasi Harian',
      todaysTasks: 'Tugas Hari Ini',
      pendingLabel: 'tertunda',
      upcomingSchedule: 'Jadwal Mendatang',
      eventsToday: 'agenda hari ini',
      noMoreEvents: 'Tidak ada jadwal tersisa',
      nextEventPrefix: 'Berikutnya',
      focusTime: 'Waktu Fokus',
      loggedToday: 'tercatat hari ini',
      sessionsCompleted: 'sesi selesai',
      productivityProgress: 'Progres Produktivitas',
      completionLabel: 'penyelesaian',
      priorityTasksTitle: 'Tugas Prioritas · Kerjakan Dulu',
      addTask: 'Tambah Tugas',
      viewAll: 'Lihat Semua',
      noUrgentTitle: 'Tidak ada tugas mendesak',
      noUrgentDesc: 'Matriks prioritas tinggi Anda bersih! Tambahkan tugas penting untuk menjaga momentum.',
      addPriorityTask: '+ Tambah Tugas Prioritas',
      todaysScheduleTitle: 'Jadwal & Agenda Hari Ini',
      addSchedule: 'Tambah Jadwal',
      viewCalendar: 'Lihat Kalender',
      noEventsTitle: 'Belum ada jadwal hari ini',
      noEventsDesc: 'Atur blok waktu khusus untuk kerja mendalam, rapat, atau rutinitas harian agar tetap terstruktur.',
      addTimeBlock: '+ Tambah Blok Waktu',
      recentNotesTitle: 'Catatan & Ide Terbaru',
      addNote: 'Tambah Catatan',
      noNotesTitle: 'Belum ada catatan',
      noNotesDesc: 'Catat ide cepat, rangkuman belajar, atau rencana proyek dalam kartu pastel yang rapi.',
      createFirstNote: '+ Buat Catatan Pertama',
      quickActions: 'Aksi Cepat',
      createNewTodo: 'Buat tugas baru',
      blockYourTime: 'Atur blok waktu',
      startFocus: 'Mulai Fokus',
      viewFocus: 'Lihat Fokus',
      activeSession: 'Sesi aktif',
      createNote: 'Buat Catatan',
      captureIdeas: 'Simpan ide cepat',
      productivitySummary: 'Ringkasan Produktivitas',
      details: 'Detail',
      flowScore: 'Skor Flow',
      tasksCompleted: 'Tugas Selesai',
      tasksPending: 'Tugas Tertunda',
      focusDuration: 'Durasi Fokus',
      focusSessions: 'Sesi Fokus',
      goalsReached: 'Target Tercapai',
      recentActivity: 'Aktivitas Terbaru',
      noRecentActivity: 'Belum ada aktivitas tercatat hari ini. Selesaikan tugas atau mulai sesi fokus untuk melihat progres Anda!',
    },
    tasks: {
      title: 'Tugas Saya',
      subtitle: 'Atur pekerjaan Anda dan tetap produktif.',
      activeCount: 'Aktif',
      completedCount: 'Selesai',
      searchPlaceholder: 'Cari tugas berdasarkan judul, deskripsi, atau kategori...',
      filters: 'Filter',
      addTask: 'Tambah Tugas',
      categories: 'Kategori',
      clearFilters: 'Reset Filter',
    },
    calendar: {
      title: 'Kalender',
      subtitle: 'Rencanakan waktu Anda dan tetap terorganisir.',
      today: 'Hari Ini',
      addSchedule: 'Tambah Jadwal',
      month: 'Bulan',
      week: 'Minggu',
      day: 'Hari',
      searchPlaceholder: 'Cari jadwal atau tugas...',
      filters: 'Filter',
    },
    focus: {
      title: 'Fokus & Pomodoro',
      subtitle: 'Hilangkan distraksi digital, fokus pada satu tujuan, dan catat blok kerja nyata.',
      pomodoro: 'Pomodoro',
      shortBreak: 'Istirahat Singkat',
      longBreak: 'Istirahat Panjang',
      deepWork: 'Fokus Mendalam',
      activeState: 'Sesi fokus aktif',
      pausedState: 'Dijeda / Siap',
      targetTask: 'Tugas Target untuk Sesi Ini:',
      generalFlow: 'Fokus Umum / Tanpa Tugas',
      startFlow: 'Mulai Fokus',
      pauseSession: 'Jeda Sesi',
      focusMetrics: 'Metrik Fokus',
      sessions: 'Sesi',
      totalTime: 'Total Waktu',
      recordedHistory: 'Riwayat Fokus Tercatat',
      noHistoryTitle: 'Belum ada riwayat fokus',
      noHistoryDesc: 'Selesaikan sesi fokus pertama Anda untuk mencatat durasi dan konsistensi.',
      cycleProgress: 'Siklus menuju Istirahat Panjang',
    },
    notes: {
      title: 'Catatan Saya',
      subtitle: 'Simpan ide, pemikiran, dan referensi terstruktur dalam satu ruang tenang.',
      newNote: 'Catatan Baru',
      allNotes: 'Semua Catatan',
      pinned: 'Disematkan',
      favorites: 'Favorit',
      trash: 'Sampah',
      searchPlaceholder: 'Cari catatan, tag, atau isi...',
    },
    notifications: {
      title: 'Notifikasi & Pengingat',
      subtitle: 'Pantau jadwal mendatang, tenggat tugas, dan pencapaian fokus Anda.',
      markAllRead: 'Tandai Semua Dibaca',
      clearAll: 'Hapus Semua',
      today: 'Hari Ini',
      yesterday: 'Kemarin',
      earlier: 'Sebelumnya',
      all: 'Semua',
      unread: 'Belum Dibaca',
    },
    analytics: {
      title: 'Statistik & Analitik Produktivitas',
      subtitle: 'Pantau progres tugas nyata, durasi fokus, target, dan tren periode dari data workspace Anda.',
      configureGoals: 'Atur Target',
      offlineNotice: 'Anda sedang offline. Analitik dihitung langsung dari database lokal perangkat Anda.',
      tasksCompleted: 'Tugas Selesai',
      tasksPending: 'Tugas Tertunda',
      tasksOverdue: 'Tugas Terlambat',
      completionRate: 'Tingkat Penyelesaian',
      totalFocusTime: 'Total Waktu Fokus',
      focusSessions: 'Sesi Fokus',
      dailyProductivity: 'Produktivitas Harian',
      weeklyProductivity: 'Produktivitas Mingguan',
      reflectionTitle: 'Jurnal Refleksi Hari Ini',
      saveReflection: 'Simpan Refleksi',
    },
    settings: {
      title: 'Pengaturan & Preferensi',
      subtitle: 'Sesuaikan workspace FlowDay, tema, bahasa, preferensi produktivitas, dan keamanan akun.',
      sections: {
        account: 'Akun',
        appearance: 'Tampilan',
        languageRegion: 'Bahasa & Wilayah',
        notifications: 'Notifikasi',
        productivity: 'Produktivitas',
        calendar: 'Kalender',
        focus: 'Timer Fokus',
        dataPrivacy: 'Data & Privasi',
        about: 'Tentang FlowDay',
      },
      status: {
        saving: 'Menyimpan preferensi...',
        saved: 'Preferensi tersimpan & tersinkron',
        savedOffline: 'Tersimpan lokal (menunggu sinkronisasi cloud)',
        saveError: 'Gagal menyimpan preferensi. Silakan coba lagi.',
        conflictNotice: 'Preferensi disinkronkan menggunakan pembaruan waktu terbaru.',
      },
      account: {
        title: 'Akun & Keamanan',
        desc: 'Kelola identitas profil, kredensial Firebase Authentication, dan sesi aktif Anda.',
        displayName: 'Nama Lengkap',
        emailAddress: 'Email Saat Ini',
        updateName: 'Simpan Profil',
        changePhoto: 'Unggah Foto',
        removePhoto: 'Hapus Foto',
        changeEmailTitle: 'Ubah Alamat Email',
        changeEmailDesc: 'Firebase akan mengirim tautan verifikasi ke email baru Anda sebelum perubahan diterapkan.',
        newEmail: 'Alamat Email Baru',
        sendEmailVerification: 'Kirim Verifikasi Email',
        emailVerificationSent: 'Email verifikasi telah dikirim ke alamat baru Anda. Konfirmasi tautan untuk menyelesaikan perubahan.',
        changePasswordTitle: 'Ubah Kata Sandi',
        changePasswordDesc: 'Perbarui kata sandi akun Anda. Autentikasi ulang mungkin diperlukan.',
        newPassword: 'Kata Sandi Baru',
        confirmPassword: 'Konfirmasi Kata Sandi Baru',
        updatePassword: 'Perbarui Kata Sandi',
        securityTitle: 'Keamanan Akun',
        authProvider: 'Metode Masuk',
        emailVerified: 'Verifikasi Email',
        verifiedYes: 'Terverifikasi',
        verifiedNo: 'Belum Terverifikasi',
        reauthPrompt: 'Demi keamanan Anda, masukkan kata sandi saat ini untuk verifikasi ulang.',
        currentPassword: 'Kata Sandi Saat Ini',
        logout: 'Keluar (Logout)',
        deleteAccount: 'Hapus Akun',
        deleteConfirmTitle: 'Hapus Akun FlowDay',
        deleteConfirmMsg: 'Tindakan ini menghapus akun Firebase Authentication, profil cloud, dan data lokal secara permanen dan tidak dapat dibatalkan.',
        googleAccountPasswordNote: 'Anda masuk menggunakan Google. Pengelolaan kata sandi dilakukan melalui Akun Google Anda.',
      },
      appearance: {
        title: 'Tampilan & Tema',
        desc: 'Pilih Light, Dark, atau ikuti tema sistem perangkat secara otomatis di seluruh halaman.',
        light: 'Terang (Light)',
        dark: 'Gelap (Dark)',
        system: 'Sistem Default',
        previewNote: 'Diterapkan secara global ke dashboard, grafik, dialog, form, dan navigasi.',
      },
      languageRegion: {
        title: 'Bahasa & Wilayah',
        desc: 'Atur bahasa antarmuka, format tanggal, format jam 12/24 jam, dan awal pekan.',
        appLanguage: 'Bahasa Aplikasi',
        dateFormat: 'Format Tanggal',
        timeFormat: 'Format Waktu',
        timeFormat24: '24 Jam (14:30)',
        timeFormat12: '12 Jam (2:30 PM)',
        firstDayOfWeek: 'Hari Pertama Pekan',
        monday: 'Senin',
        sunday: 'Minggu',
        timezoneDisplay: 'Zona Waktu Perangkat',
        timezoneHint: 'Timestamp historis tetap terjaga dan tidak berubah saat format tampilan diganti.',
        previewLabel: 'Pratinjau Format Langsung',
      },
      notifications: {
        title: 'Preferensi Notifikasi',
        desc: 'Menggunakan layanan FlowDay Notification Center terpusat untuk pengingat, suara, dan jam tenang.',
        masterToggle: 'Aktifkan Notifikasi',
        taskReminders: 'Pengingat Tugas',
        taskRemindersDesc: 'Peringatan tenggat dan tugas terlambat',
        scheduleReminders: 'Pengingat Jadwal',
        scheduleRemindersDesc: 'Notifikasi agenda dan jadwal berulang',
        focusAlerts: 'Notifikasi Fokus',
        focusAlertsDesc: 'Pemberitahuan sesi fokus & istirahat selesai',
        celebrations: 'Selebrasi Tugas',
        celebrationsDesc: 'Notifikasi apresiasi saat menyelesaikan tugas',
        sound: 'Suara Notifikasi',
        soundDesc: 'Nada lonceng lembut 528Hz',
        vibration: 'Getar (Vibration)',
        vibrationDesc: 'Getaran halus pada perangkat yang mendukung',
        vibrationUnsupported: 'Fitur getar tidak didukung pada browser/perangkat ini.',
        quietHours: 'Jam Tenang (Quiet Hours)',
        quietHoursDesc: 'Membisukan suara dan notifikasi sistem sambil tetap mencatat di aplikasi',
        quietStart: 'Waktu Mulai',
        quietEnd: 'Waktu Selesai',
        dailySummary: 'Ringkasan Harian',
        dailySummaryDesc: 'Ringkasan pagi tugas dan jadwal hari ini',
        deliveryTime: 'Waktu Pengiriman',
        osPermission: 'Izin Sistem / Browser',
        permissionGranted: 'Diizinkan',
        permissionDenied: 'Ditolak',
        permissionDefault: 'Belum Diminta',
        permissionUnsupported: 'Tidak Didukung',
        permissionDeniedHint: 'Izin notifikasi diblokir pada pengaturan browser Anda. Aktifkan izin notifikasi situs pada pengaturan browser.',
        requestPermission: 'Izinkan Notifikasi',
        previewAlert: 'Kirim Tes Notifikasi',
      },
      productivity: {
        title: 'Preferensi Produktivitas',
        desc: 'Atur target produktivitas (tersinkron dengan Statistik) serta nilai default pembuatan tugas.',
        goalsHeader: 'Target Harian & Mingguan',
        dailyTaskGoal: 'Target Tugas Harian',
        weeklyTaskGoal: 'Target Tugas Mingguan',
        dailyFocusGoal: 'Target Fokus Harian (menit)',
        weeklyFocusGoal: 'Target Fokus Mingguan (menit)',
        saveGoals: 'Simpan Target',
        defaultsHeader: 'Default Tugas & Tampilan',
        defaultPriority: 'Prioritas Tugas Default',
        defaultCategory: 'Kategori Tugas Default',
        defaultView: 'Tampilan Tugas Default',
        defaultSort: 'Urutan Tugas Default',
        startOfDay: 'Jam Mulai Hari',
        listView: 'Tampilan Daftar',
        gridView: 'Tampilan Grid',
        autoCategory: 'Kategori Pertama Tersedia',
        validationError: 'Target yang diaktifkan harus bernilai minimal 1.',
      },
      calendar: {
        title: 'Preferensi Kalender',
        desc: 'Sesuaikan tampilan kalender awal, pengingat default, durasi acara, dan visibilitas item.',
        defaultView: 'Tampilan Kalender Default',
        firstDayOfWeek: 'Hari Pertama Pekan',
        defaultReminder: 'Pengingat Acara Default',
        defaultDuration: 'Durasi Acara Default',
        showCompletedTasks: 'Tampilkan Tugas Selesai',
        showCompletedTasksDesc: 'Menampilkan tugas yang sudah selesai di kalender',
        showTaskDeadlines: 'Tampilkan Tenggat Tugas',
        showTaskDeadlinesDesc: 'Menampilkan tenggat tugas pada tampilan bulan, minggu, dan hari',
        showScheduleEvents: 'Tampilkan Acara Jadwal',
        showScheduleEventsDesc: 'Menampilkan blok waktu dan acara sepanjang hari',
        minutesUnit: 'menit',
      },
      focus: {
        title: 'Preferensi Timer Fokus',
        desc: 'Diterapkan pada sesi fokus berikutnya tanpa mengganggu sesi yang sedang berjalan.',
        focusDuration: 'Durasi Fokus Default',
        shortBreakDuration: 'Durasi Istirahat Singkat',
        longBreakDuration: 'Durasi Istirahat Panjang',
        longBreakInterval: 'Interval Istirahat Panjang',
        sessionsUnit: 'sesi',
        minutesUnit: 'menit',
        autoStartBreak: 'Mulai Istirahat Otomatis',
        autoStartBreakDesc: 'Otomatis memulai hitung mundur istirahat setelah sesi kerja selesai',
        autoStartFocus: 'Mulai Sesi Fokus Berikutnya Otomatis',
        autoStartFocusDesc: 'Otomatis kembali ke timer fokus setelah istirahat selesai',
        timerSound: 'Suara Timer Selesai',
        timerSoundDesc: 'Putar nada lembut saat timer mencapai 00:00',
        timerHaptics: 'Getar Timer Selesai',
        timerHapticsDesc: 'Aktifkan getaran perangkat saat timer selesai jika didukung',
        runningSessionNote: 'Sesi fokus sedang berjalan. Durasi baru akan diterapkan setelah sesi aktif direset atau selesai.',
        validationError: 'Durasi dan interval minimal harus bernilai 1.',
      },
      dataPrivacy: {
        title: 'Data & Privasi',
        desc: 'Periksa data tersimpan, status sinkronisasi, ekspor data pribadi, atau bersihkan cache sementara.',
        storedSummary: 'Ringkasan Data Workspace',
        syncStatusLabel: 'Status Koneksi & Sinkronisasi',
        pendingSyncLabel: 'Antrean Sinkronisasi Preferensi',
        lastSyncedLabel: 'Terakhir Disinkronkan',
        syncNow: 'Sinkronkan Sekarang',
        clearCache: 'Bersihkan Cache Lokal',
        clearCacheDesc: 'Hanya menghapus cache UI sementara. Tugas, jadwal, catatan, sesi fokus, dan perubahan yang belum tersinkron tetap aman.',
        clearCacheConfirmTitle: 'Bersihkan Cache Sementara',
        clearCacheConfirmMsg: 'Tindakan ini hanya menghapus cache sementara UI dan tidak akan menghapus database utama maupun preferensi yang belum tersinkron.',
        cacheClearedNotice: 'Cache sementara berhasil dibersihkan tanpa menghapus data utama Anda.',
        exportData: 'Ekspor Data Pribadi (JSON)',
        importBackup: 'Pulihkan Cadangan JSON',
        importSuccess: 'Cadangan berhasil dipulihkan!',
        importFailed: 'Gagal memulihkan cadangan: format berkas tidak valid.',
        privacyTitle: 'Data yang Disimpan & Dilindungi FlowDay',
        privacyBullets: [
          'Tugas, jadwal, catatan, sesi fokus, notifikasi, dan target produktivitas disimpan secara lokal untuk akses offline dan diisolasi berdasarkan ID pengguna Anda.',
          'Profil akun dan preferensi disinkronkan ke Cloud Firestore dengan aturan keamanan khusus pemilik akun.',
          'Kata sandi tidak pernah disimpan di Firestore maupun penyimpanan browser; autentikasi dikelola sepenuhnya oleh Firebase Authentication.',
        ],
        resetDatabase: 'Reset Database Lokal',
        resetConfirmTitle: 'Reset Database Workspace Lokal',
        resetConfirmMsg: 'Peringatan: Ini akan menghapus seluruh tugas, jadwal, catatan, dan sesi fokus lokal pada perangkat ini. Ekspor data terlebih dahulu jika diperlukan.',
      },
      about: {
        title: 'Tentang FlowDay',
        desc: 'Smart Daily Planner & Productivity Manager yang dirancang untuk ketenangan dan keteraturan kerja harian.',
        version: 'Versi Aplikasi',
        buildNumber: 'Nomor Build',
        legalTitle: 'Kebijakan & Ketentuan',
        privacyPolicy: 'Kebijakan Privasi',
        termsOfService: 'Syarat & Ketentuan Layanan',
        notConfigured: 'URL resmi belum dikonfigurasi',
        openSourceTitle: 'Lisensi Open Source',
      },
    },
  },
};

export function getTranslations(language: AppLanguageCode = 'en'): TranslationDictionary {
  return TRANSLATIONS[language] || TRANSLATIONS.en;
}
