import React from 'react';
import { useFlow } from '../../state/FlowContext';
import { formatReadableDate } from '../../../core/utils/date';
import { Plus, Bell, User, Flame, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { PrimaryButton, IconButton } from '../buttons/AppButtons';

interface AppHeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { activeTab, syncState, triggerManualSync, openQuickCapture, timerState, notifications, t, language } = useFlow();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return t.pageTitles.dashboard;
      case 'calendar':
        return t.pageTitles.calendar;
      case 'tasks':
        return t.pageTitles.tasks;
      case 'focus':
        return t.pageTitles.focus;
      case 'notes':
        return t.pageTitles.notes;
      case 'analytics':
        return t.pageTitles.analytics;
      case 'notifications':
        return t.pageTitles.notifications;
      case 'settings':
        return t.pageTitles.settings;
      case 'profile':
        return t.pageTitles.profile;
      default:
        return 'FlowDay';
    }
  };

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-[#201D27]/90 backdrop-blur-md border-b border-[#EEEAF2] dark:border-[#2D2838] px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Zone 1: Brand Wordmark & Context Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7] whitespace-nowrap">
          FlowDay
        </span>
        <span className="text-[#898493] text-xs" aria-hidden="true">/</span>
        <span className="text-xs font-semibold text-[#898493] dark:text-[#9E99A8] truncate">
          {getPageTitle()}
        </span>
      </div>

      

      {/* Zone 3: Actions, Quick Focus Indicator & Secondary Nav triggers */}
      <div className="flex items-center gap-2 shrink-0">
        {timerState.isRunning && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F1FA] dark:bg-[#2C253B] rounded-lg text-xs font-mono font-semibold text-[#A995D8]">
            <Flame className="w-3.5 h-3.5 text-[#A995D8]" />
            <span>
              {Math.floor(timerState.timeLeft / 60)}:
              {String(timerState.timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Notifications Icon (visible on tablet/desktop header) */}
        <div className="hidden sm:block relative">
          <IconButton
            icon={Bell}
            label="Notifications"
            onClick={onOpenNotifications}
            size="sm"
          />
          {unreadNotifs > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#A995D8] text-[9px] font-mono font-bold text-white flex items-center justify-center shadow-xs pointer-events-none"
              title={`${unreadNotifs} unread notifications`}
            >
              {unreadNotifs > 99 ? '99+' : unreadNotifs}
            </span>
          )}
        </div>

        {/* Profile Trigger (visible on tablet/desktop header) */}
        <div className="hidden sm:block">
          <IconButton
            icon={User}
            label="User Profile"
            onClick={onOpenProfile}
            size="sm"
          />
        </div>

        {/* Primary Action Button (Hidden on Dashboard page per user request) */}
        {activeTab !== 'dashboard' && (
          <PrimaryButton
            icon={Plus}
            onClick={() => openQuickCapture('task')}
            size="sm"
          >
            {t.common.newItem}
          </PrimaryButton>
        )}
      </div>
    </header>
  );
};
