export type NotificationType = 'task' | 'schedule' | 'focus' | 'review' | 'system';
export type RelatedEntityType = 'task' | 'schedule' | 'focus' | 'note' | 'system';
export type NotificationStatus = 'pending' | 'delivered' | 'dismissed';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  body?: string; // alias for message
  type: NotificationType;
  relatedId?: string;
  relatedEntityId?: string; // alias for relatedId
  relatedEntityType?: RelatedEntityType;
  isRead: boolean;
  scheduledAt?: string;
  readAt?: string;
  status?: NotificationStatus;
  createdAt: string;
}

