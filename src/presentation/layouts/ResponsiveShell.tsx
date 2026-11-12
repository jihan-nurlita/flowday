import React, { useState } from 'react';
import { useFlow } from '../state/FlowContext';
import { AppSidebar } from '../components/navigation/AppSidebar';
import { AppNavigationRail } from '../components/navigation/AppNavigationRail';
import { AppBottomNavigation } from '../components/navigation/AppBottomNavigation';
import { AppHeader } from '../components/navigation/AppHeader';
import { QuickCaptureModal } from '../components/QuickCaptureModal';
import { NotificationsDrawer } from '../components/overlays/NotificationsDrawer';
import { ProfileModal } from '../components/overlays/ProfileModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { ScheduleDetailModal } from '../components/calendar/ScheduleDetailModal';
import { FloatingActionButton } from '../components/buttons/AppButtons';
import { SnackbarContainer, ToastItem } from '../components/feedback/AppFeedback';
import { Plus } from 'lucide-react';

export const ResponsiveShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    openQuickCapture,
    setActiveTab,
    isNotificationsOpen,
    openNotifications,
    closeNotifications,
    isProfileOpen,
    openProfile,
    closeProfile,
    globalTaskModal,
    globalScheduleModal,
  } = useFlow();

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAF9FC] dark:bg-[#17151D] text-[#34313D] dark:text-[#F4F2F7] antialiased">
      {/* 1. Desktop Permanent Sidebar (>= 1024px) */}
      <AppSidebar
        onOpenNotifications={openNotifications}
        onOpenProfile={openProfile}
      />

      {/* 2. Tablet Adaptive Navigation Rail (768px - 1023px) */}
      <AppNavigationRail
        onOpenNotifications={openNotifications}
        onOpenProfile={openProfile}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <AppHeader
          onOpenNotifications={openNotifications}
          onOpenProfile={openProfile}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* 4. Mobile Fixed Bottom Navigation Bar (< 768px) */}
      <AppBottomNavigation
        onOpenNotifications={openNotifications}
        onOpenProfile={openProfile}
      />

      {/* 5. Mobile Floating Action Button (FAB) */}
      <FloatingActionButton
        icon={Plus}
        label="Quick Add"
        onClick={() => openQuickCapture('task')}
        className="md:hidden bottom-20 right-4"
      />

      {/* 6. Overlays & Dialogs */}
      <QuickCaptureModal />
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={closeNotifications}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={closeProfile}
        onOpenSettings={() => setActiveTab('profile')}
      />

      {/* Global Deep-Linked Modals for Notifications & Quick Triggers */}
      <TaskDetailModal
        task={globalTaskModal.task}
        isOpen={globalTaskModal.isOpen}
        onClose={globalTaskModal.close}
        onEdit={() => {
          globalTaskModal.close();
          setActiveTab('tasks');
        }}
      />

      <ScheduleDetailModal
        occurrence={globalScheduleModal.occurrence}
        isOpen={globalScheduleModal.isOpen}
        onClose={globalScheduleModal.close}
        onEdit={() => {
          globalScheduleModal.close();
          setActiveTab('calendar');
        }}
      />

      {/* 7. Toast / Snackbar notifications */}
      <SnackbarContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};
