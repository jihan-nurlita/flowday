export type TaskPriority =
  | 'high'
  | 'medium'
  | 'low'
  | 'urgent_important'
  | 'important'
  | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

export type ReminderType =
  | 'at_deadline'
  | 'before_15m'
  | 'before_1h'
  | 'before_1d'
  | 'custom';

export interface TaskReminderSettings {
  enabled: boolean;
  remindAt?: string;
  reminderType: ReminderType;
  customDateTime?: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  categoryId: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD (optional for no deadline)
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  subtasks?: Subtask[];
  reminderSettings?: TaskReminderSettings;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Normalizes any TaskPriority into High / Medium / Low for presentation and sorting
 */
export function normalizePriority(priority: TaskPriority): 'high' | 'medium' | 'low' {
  if (priority === 'high' || priority === 'urgent_important') return 'high';
  if (priority === 'medium' || priority === 'important' || priority === 'urgent') return 'medium';
  return 'low';
}
