export type FocusSessionType = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work';

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  duration: number; // in seconds
  sessionType: FocusSessionType;
  completed: boolean;
  createdAt: string;
}
