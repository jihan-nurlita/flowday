import React, { useState } from 'react';
import { useFlow } from '../../state/FlowContext';
import { NavigationTab } from '../../../core/constants/defaults';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Timer,
  StickyNote,
  MoreHorizontal,
  BarChart3,
  Settings,
  Bell,
  User,
  X,
} from 'lucide-react';

interface AppBottomNavigationProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const AppBottomNavigation: React.FC<AppBottomNavigationProps> = ({
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { activeTab, setActiveTab, notifications } = useFlow();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs: { id: NavigationTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'focus', label: 'Focus', icon: Timer },
    { id: 'notes', label: 'Notes', icon: StickyNote },
  ];

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      {/* "More" Sheet Overlay for mobile */}
      {showMoreMenu && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-[#34313D]/40 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="w-full bg-white dark:bg-[#201D27] rounded-t-3xl border-t border-[#EEEAF2] dark:border-[#2D2838] p-5 pb-8 animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEAF2] dark:border-[#2D2838] mb-4">
              <span className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                More Options
              </span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-[#898493] rounded-lg hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]"
              >
                <BarChart3 className="w-5 h-5 text-[#A995D8]" />
                <span>Statistics</span>
              </button>

              <button
                onClick={() => {
                  onOpenNotifications();
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] relative"
              >
                <Bell className="w-5 h-5 text-[#F1B8CC]" />
                <span>Notifications</span>
                {unreadNotifs > 0 && (
                  <span className="ml-auto text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#A995D8] text-white">
                    {unreadNotifs > 99 ? '99+' : unreadNotifs}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onOpenProfile();
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]"
              >
                <User className="w-5 h-5 text-[#A9C8E8]" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7]"
              >
                <Settings className="w-5 h-5 text-[#B5DCCB]" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Fixed Bottom Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#201D27]/95 backdrop-blur-md border-t border-[#EEEAF2] dark:border-[#2D2838] px-2 h-16 flex items-center justify-around select-none"
        aria-label="Mobile Bottom Bar"
      >
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#A995D8] font-semibold'
                  : 'text-[#898493] dark:text-[#9E99A8] hover:text-[#34313D]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-1.5'}`} />
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] transition-colors cursor-pointer ${
            showMoreMenu || activeTab === 'analytics' || activeTab === 'settings'
              ? 'text-[#A995D8] font-semibold'
              : 'text-[#898493] dark:text-[#9E99A8]'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5 stroke-1.5" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E07A5F]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
};
