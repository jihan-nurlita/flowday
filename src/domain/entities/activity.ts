export type ActivityType =
  | 'task_created'
  | 'task_completed'
  | 'task_reopened'
  | 'schedule_created'
  | 'focus_completed'
  | 'note_created'
  | 'note_updated'
  | 'note_deleted';

export interface ActivityItem {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  iconName?: string;
  color?: string;
}
