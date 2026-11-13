import React from 'react';
import { useFlow } from '../../state/FlowContext';
import { NavigationTab } from '../../../core/constants/defaults';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Timer,
  StickyNote,
  BarChart3,
  Settings,
  Bell,
  User,
  Sparkles,
  Plus,
} from 'lucide-react';
import { PrimaryButton } from '../buttons/AppButtons';

interface AppSidebarProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { activeTab, setActiveTab, stats, openQuickCapture, notifications, t } = useFlow();

  const primaryNavItems: { id: NavigationTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'calendar', label: t.nav.calendar, icon: Calendar, badge: stats.upcomingSchedulesCount },
    { id: 'tasks', label: t.nav.tasks, icon: CheckSquare, badge: stats.urgentImportantCount },
    { id: 'focus', label: t.nav.focus, icon: Timer },
    { id: 'notes', label: t.nav.notes, icon: StickyNote, badge: stats.activeNotesCount },
    { id: 'analytics', label: t.nav.statistics, icon: BarChart3 },
  ];

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <aside
      className="hidden lg:flex w-[260px] flex-col justify-between shrink-0 border-r border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] py-5 px-4 h-screen sticky top-0 z-40 select-none"
      aria-label="Desktop Navigation Sidebar"
    >
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#A995D8] to-[#F1B8CC] flex items-center justify-center text-white shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7] leading-none">
              FlowDay
            </h1>
            <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-1 truncate">
              Plan Your Day, Find Your Flow
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <PrimaryButton
          icon={Plus}
          onClick={() => openQuickCapture('task')}
          fullWidth
          size="md"
        >
          {t.common.quickCapture}
        </PrimaryButton>

        {/* Primary Navigation */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898493] dark:text-[#9E99A8] px-3 mb-2">
            {t.nav.mainMenu}
          </p>
          <nav className="flex flex-col gap-1" aria-label="Main Navigation">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F4F1FA] dark:bg-[#2C253B] text-[#A995D8] dark:text-[#C5B4EC] font-semibold shadow-xs'
                      : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] hover:bg-[#FAF9FC] dark:hover:bg-[#252230]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#A995D8]' : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#FAF9FC] dark:bg-[#17151D] text-[#898493] border border-[#EEEAF2] dark:border-[#2D2838]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898493] dark:text-[#9E99A8] px-3 mb-2">
            {t.nav.accountSystem}
          </p>
          <div className="flex flex-col gap-1">
            <button
              onClick={onOpenNotifications}
              className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#F4F1FA] dark:bg-[#2C253B] text-[#A995D8] dark:text-[#C5B4EC] font-semibold shadow-xs'
                  : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] hover:bg-[#FAF9FC] dark:hover:bg-[#252230]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 shrink-0 ${activeTab === 'notifications' ? 'text-[#A995D8]' : ''}`} />
                <span>{t.nav.notifications}</span>
              </div>
              {unreadNotifs > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#A995D8] text-white shadow-xs">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </button>

            <button
              onClick={onOpenProfile}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-medium text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] hover:bg-[#FAF9FC] dark:hover:bg-[#252230] transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 shrink-0" />
              <span>{t.nav.profile}</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#F4F1FA] dark:bg-[#2C253B] text-[#A995D8] font-semibold'
                  : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] hover:bg-[#FAF9FC] dark:hover:bg-[#252230]'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>{t.nav.settings}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Profile & Daily Progress Bar in Sidebar Bottom */}
      <div className="pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838]">
        <div className="p-3 bg-[#FAF9FC] dark:bg-[#1A1823] rounded-xl border border-[#EEEAF2] dark:border-[#2D2838]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#898493] dark:text-[#9E99A8] font-medium">{t.common.dailyGoal}</span>
            <span className="font-mono font-bold text-[#A995D8]">{stats.todayCompletionRate}%</span>
          </div>
          <div className="w-full bg-[#EEEAF2] dark:bg-[#2D2838] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#A995D8] to-[#B5DCCB] h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.todayCompletionRate}%` }}
            />
          </div>
          <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-2">
            {stats.todayTasksCompleted} {t.common.tasksDoneOf} {stats.todayTasksTotal}
          </p>
        </div>
      </div>
    </aside>
  );
};
