import React, { useState, useMemo } from 'react';
import { useFlow } from '../state/FlowContext';
import { AppNotification, NotificationType } from '../../domain/entities/notification';
import { formatReadableDate, getTodayDateString } from '../../core/utils/date';
import { BaseCard } from '../components/cards/AppCards';
import { SearchField } from '../components/inputs/AppInputs';
import { EmptyState } from '../components/feedback/AppFeedback';
import { ConfirmationDialog } from '../components/feedback/AppFeedback';
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  Calendar,
  CheckSquare,
  Timer,
  Info,
  ExternalLink,
  Volume2,
  VolumeX,
  ShieldAlert,
  Moon,
  Sparkles,
  ArrowRight,
  Settings as SettingsIcon,
} from 'lucide-react';
import { notificationService } from '../../data/services/notification_service';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markNotificationUnread,
    markAllNotificationsRead,
    deleteNotification,
    clearNotifications,
    permissionStatus,
    requestNotificationPermission,
    sendTestNotification,
    globalTaskModal,
    globalScheduleModal,
    setActiveTab,
    user,
  } = useFlow();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'task' | 'schedule' | 'focus' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

  const todayStr = getTodayDateString();

  // Quiet hours check
  const isQuietHoursActive = useMemo(() => {
    return notificationService.isQuietHours(user?.preferences);
  }, [user?.preferences]);

  // Group notifications by Today, Yesterday, Earlier
  const getRelativeGroup = (isoString: string): 'today' | 'yesterday' | 'earlier' => {
    const itemDateStr = isoString.slice(0, 10);
    if (itemDateStr === todayStr) return 'today';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (itemDateStr === yesterdayStr) return 'yesterday';

    return 'earlier';
  };

  // Filter pipeline
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Filter type
      if (activeFilter === 'unread' && notif.isRead) return false;
      if (activeFilter === 'task' && notif.type !== 'task') return false;
      if (activeFilter === 'schedule' && notif.type !== 'schedule') return false;
      if (activeFilter === 'focus' && notif.type !== 'focus') return false;
      if (activeFilter === 'system' && notif.type !== 'system' && notif.type !== 'review') return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = notif.title.toLowerCase().includes(q);
        const matchesMsg = notif.message.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg) return false;
      }

      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  // Grouped filtered list
  const groupedNotifications = useMemo(() => {
    const groups: {
      today: AppNotification[];
      yesterday: AppNotification[];
      earlier: AppNotification[];
    } = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    filteredNotifications.forEach((n) => {
      const g = getRelativeGroup(n.createdAt);
      groups[g].push(n);
    });

    return groups;
  }, [filteredNotifications, todayStr]);

  // Helper for notification type styling
  const getTypeMeta = (type: NotificationType) => {
    switch (type) {
      case 'task':
        return {
          icon: CheckSquare,
          bg: 'bg-[#B5DCCB]/20 text-[#2D6A4F] border-[#B5DCCB]/50',
          label: 'Task',
          accent: '#B5DCCB',
        };
      case 'schedule':
        return {
          icon: Calendar,
          bg: 'bg-[#A9C8E8]/20 text-[#1D4E89] border-[#A9C8E8]/50',
          label: 'Schedule',
          accent: '#A9C8E8',
        };
      case 'focus':
        return {
          icon: Timer,
          bg: 'bg-[#F1B8CC]/20 text-[#8B3A62] border-[#F1B8CC]/50',
          label: 'Focus',
          accent: '#F1B8CC',
        };
      case 'review':
        return {
          icon: Sparkles,
          bg: 'bg-[#A995D8]/20 text-[#593F94] border-[#A995D8]/50',
          label: 'Summary',
          accent: '#A995D8',
        };
      default:
        return {
          icon: Bell,
          bg: 'bg-[#FAF9FC] text-[#898493] border-[#EEEAF2] dark:bg-[#201D27] dark:text-[#9E99A8]',
          label: 'System',
          accent: '#A995D8',
        };
    }
  };

  const handleOpenSource = (notif: AppNotification) => {
    // Mark as read when opening
    if (!notif.isRead) {
      markNotificationRead(notif.id);
    }

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

    if (notif.type === 'focus' || notif.relatedEntityType === 'focus') {
      setActiveTab('focus');
      return;
    }

    if (notif.type === 'review') {
      setActiveTab('dashboard');
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadNotificationsCount },
    { id: 'task', label: 'Tasks', count: notifications.filter((n) => n.type === 'task').length },
    { id: 'schedule', label: 'Schedule', count: notifications.filter((n) => n.type === 'schedule').length },
    { id: 'focus', label: 'Focus', count: notifications.filter((n) => n.type === 'focus').length },
    { id: 'system', label: 'System', count: notifications.filter((n) => n.type === 'system' || n.type === 'review').length },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* 1. Header Zone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
              Notification Center
            </h2>
            {unreadNotificationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#A995D8] text-white">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
            Stay updated with your daily planner, tasks, schedules, and flow.
          </p>
        </div>

        {/* Global Notification Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {unreadNotificationsCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs font-semibold text-[#898493] hover:text-[#A995D8] hover:border-[#A995D8]/50 shadow-xs transition-colors cursor-pointer"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => setIsClearAllDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-xs font-semibold text-[#898493] hover:text-[#E07A5F] hover:border-[#E07A5F]/40 shadow-xs transition-colors cursor-pointer"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] shadow-xs transition-colors cursor-pointer"
            title="Notification Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Quiet Hours & Permission Status Banners */}
      {isQuietHoursActive && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#F4F1FA] dark:bg-[#2C253B] border border-[#A995D8]/30 text-xs text-[#34313D] dark:text-[#F4F2F7]">
          <div className="w-8 h-8 rounded-xl bg-[#A995D8] text-white flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-[#A995D8]">Quiet Hours Active</p>
            <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
              Sound and system alert banners are muted until {user?.preferences?.quietHoursEnd || '07:00'}. In-app notifications continue to be logged.
            </p>
          </div>
        </div>
      )}

      {permissionStatus !== 'granted' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#201D27] border border-[#A995D8]/40 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-center text-[#A995D8] shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                Browser Notifications {permissionStatus === 'denied' ? 'Blocked' : 'Disabled'}
              </p>
              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                {permissionStatus === 'denied'
                  ? 'Notifications are blocked in your browser site settings. Enable them to receive reminders when FlowDay is in the background.'
                  : 'Enable browser notifications to receive timely task deadlines and schedule reminders.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permissionStatus !== 'denied' && (
              <button
                onClick={requestNotificationPermission}
                className="px-3 py-1.5 rounded-xl bg-[#A995D8] hover:bg-[#9680C9] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                Enable Notifications
              </button>
            )}
            <button
              onClick={sendTestNotification}
              className="px-3 py-1.5 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] text-xs font-semibold text-[#898493] hover:text-[#34313D] dark:hover:text-white transition-all cursor-pointer"
            >
              Test Alert
            </button>
          </div>
        </div>
      )}

      {/* 3. Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#A995D8] text-white shadow-xs'
                    : 'bg-white dark:bg-[#201D27] text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] border border-[#EEEAF2] dark:border-[#2D2838]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FAF9FC] dark:bg-[#17151D] text-[#898493]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="w-full sm:w-60">
          <SearchField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
          />
        </div>
      </div>

      {/* 4. Notifications Groups */}
      {filteredNotifications.length === 0 ? (
        <BaseCard className="py-12">
          <EmptyState
            icon={Bell}
            title={activeFilter === 'unread' ? 'No unread notifications' : 'No notifications found'}
            description={
              activeFilter === 'unread'
                ? 'You are all caught up! New reminders and task achievements will appear here.'
                : 'No notification records match your selected filter or search keyword.'
            }
          />
        </BaseCard>
      ) : (
        <div className="space-y-6">
          {/* Today Group */}
          {groupedNotifications.today.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A995D8]">
                  Today
                </span>
                <span className="text-[11px] font-mono text-[#898493]">
                  {groupedNotifications.today.length} item{groupedNotifications.today.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-2">
                {groupedNotifications.today.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    typeMeta={getTypeMeta(notif.type)}
                    onOpenSource={handleOpenSource}
                    onToggleRead={() =>
                      notif.isRead
                        ? markNotificationUnread(notif.id)
                        : markNotificationRead(notif.id)
                    }
                    onDelete={() => deleteNotification(notif.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday Group */}
          {groupedNotifications.yesterday.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#898493]">
                  Yesterday
                </span>
                <span className="text-[11px] font-mono text-[#898493]">
                  {groupedNotifications.yesterday.length} item{groupedNotifications.yesterday.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-2">
                {groupedNotifications.yesterday.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    typeMeta={getTypeMeta(notif.type)}
                    onOpenSource={handleOpenSource}
                    onToggleRead={() =>
                      notif.isRead
                        ? markNotificationUnread(notif.id)
                        : markNotificationRead(notif.id)
                    }
                    onDelete={() => deleteNotification(notif.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Earlier Group */}
          {groupedNotifications.earlier.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#898493]">
                  Earlier
                </span>
                <span className="text-[11px] font-mono text-[#898493]">
                  {groupedNotifications.earlier.length} item{groupedNotifications.earlier.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-2">
                {groupedNotifications.earlier.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    typeMeta={getTypeMeta(notif.type)}
                    onOpenSource={handleOpenSource}
                    onToggleRead={() =>
                      notif.isRead
                        ? markNotificationUnread(notif.id)
                        : markNotificationRead(notif.id)
                    }
                    onDelete={() => deleteNotification(notif.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isClearAllDialogOpen}
        title="Clear All Notifications"
        message="Are you sure you want to permanently clear all notifications from your notification center?"
        confirmLabel="Clear All"
        isDestructive
        onConfirm={() => {
          clearNotifications();
          setIsClearAllDialogOpen(false);
        }}
        onCancel={() => setIsClearAllDialogOpen(false)}
      />
    </div>
  );
};

interface NotificationItemProps {
  notification: AppNotification;
  typeMeta: {
    icon: React.ElementType;
    bg: string;
    label: string;
    accent: string;
  };
  onOpenSource: (notif: AppNotification) => void;
  onToggleRead: () => void;
  onDelete: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  typeMeta,
  onOpenSource,
  onToggleRead,
  onDelete,
}) => {
  const Icon = typeMeta.icon;

  const hasDirectAction =
    notification.relatedId ||
    notification.type === 'task' ||
    notification.type === 'schedule' ||
    notification.type === 'focus' ||
    notification.type === 'review';

  return (
    <div
      className={`group relative p-4 rounded-2xl border transition-all ${
        notification.isRead
          ? 'bg-white/60 dark:bg-[#201D27]/60 border-[#EEEAF2] dark:border-[#2D2838] opacity-80 hover:opacity-100'
          : 'bg-white dark:bg-[#201D27] border-[#A995D8]/40 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Type Badge / Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${typeMeta.bg}`}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {!notification.isRead && (
                <span
                  className="w-2 h-2 rounded-full shrink-0 bg-[#A995D8]"
                  title="Unread"
                />
              )}
              <h4 className="text-xs sm:text-sm font-bold text-[#34313D] dark:text-[#F4F2F7] truncate">
                {notification.title}
              </h4>
            </div>

            <span className="text-[10px] sm:text-xs font-mono text-[#898493] shrink-0">
              {formatReadableDate(notification.createdAt)}
            </span>
          </div>

          <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-1 leading-relaxed">
            {notification.message || notification.body}
          </p>

          {/* Action Row */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#EEEAF2]/60 dark:border-[#2D2838]/60">
            {hasDirectAction && (
              <button
                onClick={() => onOpenSource(notification)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF9FC] dark:bg-[#17151D] hover:bg-[#F4F1FA] dark:hover:bg-[#2A2633] text-[11px] font-semibold text-[#A995D8] transition-colors cursor-pointer"
              >
                <span>
                  {notification.type === 'task'
                    ? 'Open Task'
                    : notification.type === 'schedule'
                    ? 'Open Schedule'
                    : notification.type === 'focus'
                    ? 'Open Focus'
                    : 'View Details'}
                </span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={onToggleRead}
              className="text-[11px] font-medium text-[#898493] hover:text-[#34313D] dark:hover:text-white transition-colors cursor-pointer ml-auto"
            >
              {notification.isRead ? 'Mark as unread' : 'Mark as read'}
            </button>

            <span className="text-[#898493]/40" aria-hidden="true">
              ·
            </span>

            <button
              onClick={onDelete}
              className="text-[11px] font-medium text-[#898493] hover:text-[#E07A5F] transition-colors cursor-pointer"
              title="Delete notification"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
