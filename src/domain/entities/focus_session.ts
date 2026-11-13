export type FocusSessionType = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work';

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  startTime: string; // ISO
  endTime: string; // ISO
  duration: number; // actual elapsed duration in seconds
  plannedDuration?: number; // planned duration in seconds
  pausedDuration?: number; // paused seconds subtracted from active focus time
  sessionType: FocusSessionType;
  completed: boolean;
  createdAt: string;
}
