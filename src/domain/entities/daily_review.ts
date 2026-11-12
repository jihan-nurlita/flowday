export interface DailyReview {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedTasks: number;
  totalTasks: number;
  focusDuration: number; // in seconds
  reflection: string;
  createdAt: string;
}
