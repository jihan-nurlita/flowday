import React, { useState, useMemo } from 'react';
import { useFlow } from '../../state/FlowContext';
import { AppNotification, NotificationType } from '../../../domain/entities/notification';
import { formatReadableDate } from '../../../core/utils/date';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  CheckSquare,
  Calendar,
  Timer,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { EmptyState } from '../feedback/AppFeedback';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markNotificationUnread,
    markAllNotificationsRead,
    deleteNotification,
    clearNotifications,
    globalTaskModal,
    globalScheduleModal,
    setActiveTab,
  } = useFlow();

  const [filter, setFilter] = useState<'all' | 'unread' | 'task' | 'schedule' | 'focus'>('all');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (filter === 'unread') return !notif.isRead;
      if (filter === 'task') return notif.type === 'task';
      if (filter === 'schedule') return notif.type === 'schedule';
      if (filter === 'focus') return notif.type === 'focus';
      return true;
    });
  }, [notifications, filter]);

  if (!isOpen) return null;

  const getTypeMeta = (type: NotificationType) => {
    switch (type) {
      case 'task':
        return {
          icon: CheckSquare,
          color: 'text-[#2D6A4F] bg-[#B5DCCB]/20 border-[#B5DCCB]/40',
        };
      case 'schedule':
        return {
          icon: Calendar,
          color: 'text-[#1D4E89] bg-[#A9C8E8]/20 border-[#A9C8E8]/40',
        };
      case 'focus':
        return {
          icon: Timer,
          color: 'text-[#8B3A62] bg-[#F1B8CC]/20 border-[#F1B8CC]/40',
        };
      case 'review':
        return {
          icon: Sparkles,
          color: 'text-[#593F94] bg-[#A995D8]/20 border-[#A995D8]/40',
        };
      default:
        return {
          icon: Bell,
          color: 'text-[#898493] bg-[#FAF9FC] dark:bg-[#17151D] border-[#EEEAF2] dark:border-[#2D2838]',
        };
    }
  };

  const handleOpenSource = (notif: AppNotification) => {
    if (!notif.isRead) {
      markNotificationRead(notif.id);
    }
    onClose();

    if (notif.relatedId) {
      if (notif.type === 'task' || notif.relatedEntityType === 'task') {
        globalTaskModal.open(notif.relatedId);
        return;
      }
      if (notif.type === 'schedule' || notif.relatedEntityType === 'schedule') {
        globalScheduleModal.open(notif.relatedId);
        return;
      }
    }

    if (notif.type === 'focus') {
      setActiveTab('focus');
      return;
    }

    if (notif.type === 'review') {
      setActiveTab('dashboard');
    }
  };

  const handleOpenFullCenter = () => {
    onClose();
    setActiveTab('notifications');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#34313D]/40 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-white dark:bg-[#201D27] h-full shadow-2xl border-l border-[#EEEAF2] dark:border-[#2D2838] flex flex-col justify-between animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#A995D8]" />
              <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
                Notifications
              </h3>
              {unreadNotificationsCount > 0 && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#A995D8] text-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="p-1.5 text-[#898493] hover:text-[#A995D8] rounded-lg transition-colors cursor-pointer"
                  title="Mark all as read"
                  aria-label="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearNotifications()}
                  className="p-1.5 text-[#898493] hover:text-[#E07A5F] rounded-lg transition-colors cursor-pointer"
                  title="Clear all"
                  aria-label="Clear all notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'unread', 'task', 'schedule', 'focus'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  filter === tab
                    ? 'bg-[#A995D8] text-white shadow-xs'
                    : 'bg-[#FAF9FC] dark:bg-[#17151D] text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] border border-[#EEEAF2] dark:border-[#2D2838]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              description={
                filter === 'unread'
                  ? 'All notifications have been read.'
                  : 'Reminders and activities will appear here in real-time.'
              }
            />
          ) : (
            filteredNotifications.map((notif) => {
              const meta = getTypeMeta(notif.type);
              const Icon = meta.icon;

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    notif.isRead
                      ? 'bg-[#FAF9FC]/60 dark:bg-[#17151D]/60 border-[#EEEAF2] dark:border-[#2D2838] opacity-75'
                      : 'bg-white dark:bg-[#262230] border-[#A995D8]/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${meta.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7] truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] font-mono text-[#898493] shrink-0">
                          {formatReadableDate(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5 line-clamp-2">
                        {notif.message || notif.body}
                      </p>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#EEEAF2]/60 dark:border-[#2D2838]/60">
                        {(notif.relatedId || notif.type === 'focus') && (
                          <button
                            onClick={() => handleOpenSource(notif)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A995D8] hover:underline cursor-pointer"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}

                        <button
                          onClick={() =>
                            notif.isRead
                              ? markNotificationUnread(notif.id)
                              : markNotificationRead(notif.id)
                          }
                          className="text-[11px] font-medium text-[#898493] hover:text-[#34313D] dark:hover:text-white ml-auto cursor-pointer"
                        >
                          {notif.isRead ? 'Unread' : 'Read'}
                        </button>

                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-[11px] font-medium text-[#898493] hover:text-[#E07A5F] cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with link to Full Notification Center */}
        <div className="p-4 border-t border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between bg-[#FAF9FC] dark:bg-[#17151D]">
          <span className="text-[11px] text-[#898493]">
            {unreadNotificationsCount} unread / {notifications.length} total
          </span>

          <button
            onClick={handleOpenFullCenter}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A995D8] hover:text-[#9680C9] transition-colors cursor-pointer"
          >
            <span>View All</span>
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
