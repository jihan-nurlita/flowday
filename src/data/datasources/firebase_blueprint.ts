/**
 * Firebase Firestore Blueprint & Architecture Specification
 * Prepares the schema definitions and synchronization contracts for cloud sync.
 */

export interface FirebaseSyncState {
  isConfigured: boolean;
  isOnline: boolean;
  lastSyncedAt?: string;
  pendingSyncCount: number;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  errorMessage?: string;
}

export const FIRESTORE_BLUEPRINT = {
  version: '1.0.0',
  collections: {
    users: {
      path: 'users/{uid}',
      fields: ['uid', 'name', 'email', 'photoUrl', 'createdAt', 'updatedAt', 'preferences'],
      rules: 'allow read, write: if request.auth != null && request.auth.uid == uid;',
    },
    tasks: {
      path: 'tasks/{taskId}',
      fields: ['id', 'userId', 'title', 'description', 'categoryId', 'priority', 'status', 'dueDate', 'startTime', 'endTime', 'isCompleted', 'createdAt', 'updatedAt'],
      rules: 'allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;',
    },
    categories: {
      path: 'categories/{categoryId}',
      fields: ['id', 'userId', 'name', 'color', 'icon', 'createdAt'],
      rules: 'allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;',
    },
    schedules: {
      path: 'schedules/{scheduleId}',
      fields: ['id', 'userId', 'title', 'description', 'date', 'startTime', 'endTime', 'categoryId', 'reminderEnabled', 'createdAt'],
      rules: 'allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;',
    },
    notes: {
      path: 'notes/{noteId}',
      fields: ['id', 'userId', 'title', 'content', 'categoryId', 'color', 'isPinned', 'createdAt', 'updatedAt'],
      rules: 'allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;',
    },
    focus_sessions: {
      path: 'focus_sessions/{sessionId}',
      fields: ['id', 'userId', 'taskId', 'startTime', 'endTime', 'duration', 'sessionType', 'completed', 'createdAt'],
      rules: 'allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;',
    },
    notifications: {
      path: 'notifications/{notificationId}',
      fields: ['id', 'userId', 'title', 'message', 'type', 'relatedId', 'isRead', 'scheduledAt', 'createdAt'],
      rules: 'allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;',
    },
    daily_reviews: {
      path: 'daily_reviews/{reviewId}',
      fields: ['id', 'userId', 'date', 'completedTasks', 'totalTasks', 'focusDuration', 'reflection', 'createdAt'],
      rules: 'allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;',
    },
    productivity_goals: {
      path: 'productivity_goals/{goalId}',
      fields: ['id', 'userId', 'dailyTaskGoal', 'weeklyTaskGoal', 'dailyFocusGoalMinutes', 'weeklyFocusGoalMinutes', 'createdAt', 'updatedAt'],
      rules: 'allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;',
    },
  },
};
