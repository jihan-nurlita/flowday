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
  Plus,
  Sparkles,
} from 'lucide-react';
import { IconButton } from '../buttons/AppButtons';

interface AppNavigationRailProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const AppNavigationRail: React.FC<AppNavigationRailProps> = ({
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { activeTab, setActiveTab, openQuickCapture, notifications } = useFlow();

  const navItems: { id: NavigationTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'focus', label: 'Focus', icon: Timer },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
  ];

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <aside
      className="hidden md:flex lg:hidden w-[76px] flex-col justify-between items-center shrink-0 border-r border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] py-4 h-screen sticky top-0 z-40 select-none"
      aria-label="Tablet Navigation Rail"
    >
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Brand Icon */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#A995D8] to-[#F1B8CC] flex items-center justify-center text-white shadow-xs">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        {/* Quick Add button */}
        <button
          onClick={() => openQuickCapture('task')}
          className="w-10 h-10 rounded-xl bg-[#A995D8] hover:bg-[#9680C9] active:scale-95 text-white flex items-center justify-center shadow-xs cursor-pointer transition-all"
          title="Quick Capture"
          aria-label="Quick Capture"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-2 w-full px-2" aria-label="Rail Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full py-2.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F4F1FA] dark:bg-[#2C253B] text-[#A995D8] dark:text-[#C5B4EC]'
                    : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] hover:bg-[#FAF9FC] dark:hover:bg-[#252230]'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-1.5'}`} />
                <span className="text-[10px] font-medium mt-1 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Secondary Bottom Actions */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        <div className="relative">
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

        <IconButton
          icon={User}
          label="Profile"
          onClick={onOpenProfile}
          size="sm"
        />

        <IconButton
          icon={Settings}
          label="Settings"
          variant={activeTab === 'settings' ? 'filled' : 'ghost'}
          onClick={() => setActiveTab('settings')}
          size="sm"
        />
      </div>
    </aside>
  );
};
