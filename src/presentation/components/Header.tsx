import React from 'react';
import { useFlow } from '../state/FlowContext';
import { Plus, Wifi, WifiOff, RefreshCw, Flame } from 'lucide-react';
import { formatReadableDate } from '../../core/utils/date';

export const Header: React.FC = () => {
  const { activeTab, syncState, triggerManualSync, openQuickCapture, timerState } = useFlow();

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'tasks':
        return 'Daily Tasks';
      case 'calendar':
        return 'Schedule & Agenda';
      case 'focus':
        return 'Focus & Pomodoro';
      case 'notes':
        return 'Personal Notes';
      case 'analytics':
        return 'Productivity Review';
      case 'notifications':
        return 'Notifications';
      case 'settings':
        return 'Settings & Sync';
      default:
        return 'Overview';
    }
  };

  const todayStr = formatReadableDate(new Date());

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-[#201D27]/90 backdrop-blur-md border-b border-[#EEEAF2] dark:border-[#2D2838] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Zone 1: Brand & Section Crumb */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7] whitespace-nowrap">
          FlowDay
        </span>
        <span className="text-[#898493] text-xs font-light" aria-hidden="true">/</span>
        <span className="text-xs font-medium text-[#898493] dark:text-[#9E99A8] truncate">
          {getBreadcrumbTitle()}
        </span>
      </div>

      {/* Zone 2: Date & Sync Status */}
      <div className="hidden md:flex items-center gap-4 text-xs text-[#898493] dark:text-[#9E99A8]">
        <span className="font-medium text-[#34313D] dark:text-[#F4F2F7]">{todayStr}</span>
        <span aria-hidden="true">·</span>
        <button
          onClick={triggerManualSync}
          title="Click to verify sync"
          className="inline-flex items-center gap-1.5 hover:text-[#34313D] dark:hover:text-[#F4F2F7] transition-colors"
        >
          {syncState.isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-[#B5DCCB]" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-[#E07A5F]" />
          )}
          <span className="capitalize">{syncState.syncStatus}</span>
          <RefreshCw
            className={`w-3 h-3 text-[#898493] ${
              syncState.syncStatus === 'syncing' ? 'animate-spin' : ''
            }`}
          />
        </button>
      </div>

      {/* Zone 3: Primary Action + Timer indicator */}
      <div className="flex items-center gap-2.5 shrink-0">
        {timerState.isRunning && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F1FA] dark:bg-[#2A2633] rounded-lg text-xs font-mono font-medium text-[#A995D8]">
            <Flame className="w-3.5 h-3.5 text-[#A995D8]" />
            <span>
              {Math.floor(timerState.timeLeft / 60)}:
              {String(timerState.timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        <button
          onClick={() => openQuickCapture('task')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#A995D8] hover:bg-[#9680C9] active:scale-98 rounded-lg shadow-xs transition-all whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Item</span>
        </button>
      </div>
    </header>
  );
};
