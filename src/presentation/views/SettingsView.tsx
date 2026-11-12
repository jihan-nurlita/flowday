import React, { useRef, useState } from 'react';
import { useFlow } from '../state/FlowContext';
import { FIRESTORE_BLUEPRINT } from '../../data/datasources/firebase_blueprint';
import { BaseCard } from '../components/cards/AppCards';
import { PrimaryButton, SecondaryButton, OutlinedButton } from '../components/buttons/AppButtons';
import { ConfirmationDialog } from '../components/feedback/AppFeedback';
import {
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  RotateCcw,
  Cloud,
  CheckCircle2,
  Database,
  ShieldCheck,
  User as UserIcon,
  Bell,
  CheckSquare,
  Calendar,
  Timer,
  Sparkles,
  Volume2,
  Smartphone,
} from 'lucide-react';

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      disabled ? 'opacity-40 cursor-not-allowed' : ''
    } ${checked ? 'bg-[#A995D8]' : 'bg-[#EEEAF2] dark:bg-[#2D2838]'}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUserPreferences,
    exportBackup,
    importBackup,
    resetDatabase,
    syncState,
    triggerManualSync,
    tasks,
    schedules,
    notes,
    focusSessions,
    permissionStatus,
    requestNotificationPermission,
    sendTestNotification,
  } = useFlow();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleExport = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowday_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackup(content);
      if (success) {
        setImportNotice('Backup successfully restored!');
        setTimeout(() => setImportNotice(null), 3000);
      } else {
        setImportNotice('Failed to restore backup: Invalid format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentTheme = user?.preferences?.themeMode || user?.preferences?.theme || 'system';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
          Settings & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
          Manage system preferences, light & dark theme, data backups, and inspect local storage.
        </p>
      </div>

      {/* 2. User Profile Card */}
      <BaseCard className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-center text-[#A995D8]">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
              {user?.fullName || user?.name || 'FlowDay Explorer'}
            </h3>
            <p className="text-xs text-[#898493] dark:text-[#9E99A8]">
              {user?.email || 'user@flowday.app'}
            </p>
          </div>
        </div>
        <div className="text-right text-[11px] text-[#898493] dark:text-[#9E99A8]">
          <span className="font-mono">UID: {user?.uid.slice(0, 16)}...</span>
        </div>
      </BaseCard>

      {/* 3. Appearance (Theme) - 3 Options: Light, Dark, System */}
      <BaseCard>
        <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7] mb-1">
          Theme & Appearance
        </h3>
        <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4">
          Choose your visual comfort. Premium Soft Pastel palette is crafted for light and dark modes.
        </p>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => updateUserPreferences({ themeMode: 'light', theme: 'light' })}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              currentTheme === 'light'
                ? 'border-[#A995D8] bg-[#F4F1FA] text-[#A995D8]'
                : 'border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#34313D]'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light</span>
          </button>

          <button
            onClick={() => updateUserPreferences({ themeMode: 'dark', theme: 'dark' })}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              currentTheme === 'dark'
                ? 'border-[#A995D8] bg-[#2C253B] text-[#A995D8]'
                : 'border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#34313D]'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => updateUserPreferences({ themeMode: 'system', theme: 'system' })}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              currentTheme === 'system'
                ? 'border-[#A995D8] bg-[#FAF9FC] dark:bg-[#17151D] text-[#A995D8]'
                : 'border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#34313D]'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>System Default</span>
          </button>
        </div>
      </BaseCard>

      {/* 4. Notification & Reminder Preferences (PART 9) */}
      <BaseCard>
        <div className="flex items-center justify-between pb-3 border-b border-[#EEEAF2] dark:border-[#2D2838] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F4F1FA] dark:bg-[#2C253B] flex items-center justify-center text-[#A995D8]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                Notification & Reminder Center
              </h3>
              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                Configure alerts, gentle audio chimes, quiet hours, and daily summaries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#898493]">
              {user?.preferences?.notificationEnabled !== false ? 'Enabled' : 'Muted'}
            </span>
            <ToggleSwitch
              checked={user?.preferences?.notificationEnabled !== false}
              onChange={(val) => updateUserPreferences({ notificationEnabled: val })}
            />
          </div>
        </div>

        {/* Sub-controls - disabled when master toggle is off */}
        <div className={`space-y-4 ${user?.preferences?.notificationEnabled === false ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Toggles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Task Reminders */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4 text-[#B5DCCB]" />
                <div>
                  <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">Task Reminders</p>
                  <p className="text-[10px] text-[#898493]">Due date warnings & overdue alerts</p>
                </div>
              </div>
              <ToggleSwitch
                checked={user?.preferences?.taskRemindersEnabled !== false}
                onChange={(val) => updateUserPreferences({ taskRemindersEnabled: val })}
              />
            </div>

            {/* Schedule Reminders */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#A9C8E8]" />
                <div>
                  <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">Schedule Reminders</p>
                  <p className="text-[10px] text-[#898493]">Calendar events & recurring schedules</p>
                </div>
              </div>
              <ToggleSwitch
                checked={user?.preferences?.scheduleRemindersEnabled !== false}
                onChange={(val) => updateUserPreferences({ scheduleRemindersEnabled: val })}
              />
            </div>

            {/* Focus Notifications */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
              <div className="flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-[#F1B8CC]" />
                <div>
                  <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">Focus & Pomodoro</p>
                  <p className="text-[10px] text-[#898493]">Session & break completion alerts</p>
                </div>
              </div>
              <ToggleSwitch
                checked={user?.preferences?.focusNotificationsEnabled !== false}
                onChange={(val) => updateUserPreferences({ focusNotificationsEnabled: val })}
              />
            </div>

            {/* Celebrations */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#A995D8]" />
                <div>
                  <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">Task Celebrations</p>
                  <p className="text-[10px] text-[#898493]">Achievement notice upon task complete</p>
                </div>
              </div>
              <ToggleSwitch
                checked={user?.preferences?.taskCompletionCelebration !== false}
                onChange={(val) => updateUserPreferences({ taskCompletionCelebration: val })}
              />
            </div>

            {/* Sound Chimes */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-[#A995D8]" />
                <div>
                  <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">Gentle Audio Chimes</p>
                  <p className="text-[10px] text-[#898493]">Soft 528Hz synthesized bell chime</p>
                </div>
              </div>
              <ToggleSwitch
                checked={user?.preferences?.soundEnabled !== false}
                onChange={(val) => updateUserPreferences({ soundEnabled: val })}
              />
            </div>

            {/* Haptic Vibration */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-[#898493]" />
                <div>
                  <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">Haptic Vibration</p>
                  <p className="text-[10px] text-[#898493]">Vibrate on devices supporting haptics</p>
                </div>
              </div>
              <ToggleSwitch
                checked={user?.preferences?.vibrationEnabled !== false}
                onChange={(val) => updateUserPreferences({ vibrationEnabled: val })}
              />
            </div>
          </div>

          {/* Quiet Hours Configuration */}
          <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#A995D8]" />
                <div>
                  <p className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">Quiet Hours</p>
                  <p className="text-[10px] text-[#898493]">Mutes sound and system alerts while logging to FlowDay</p>
                </div>
              </div>
              <ToggleSwitch
                checked={!!user?.preferences?.quietHoursEnabled}
                onChange={(val) => updateUserPreferences({ quietHoursEnabled: val })}
              />
            </div>

            {user?.preferences?.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EEEAF2] dark:border-[#2D2838]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#898493] mb-1">
                    Quiet Start Time
                  </label>
                  <input
                    type="time"
                    value={user?.preferences?.quietHoursStart || '22:00'}
                    onChange={(e) => updateUserPreferences({ quietHoursStart: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl text-[#34313D] dark:text-[#F4F2F7]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#898493] mb-1">
                    Quiet End Time
                  </label>
                  <input
                    type="time"
                    value={user?.preferences?.quietHoursEnd || '07:00'}
                    onChange={(e) => updateUserPreferences({ quietHoursEnd: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl text-[#34313D] dark:text-[#F4F2F7]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Daily Summary Configuration */}
          <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A9C8E8]" />
                <div>
                  <p className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">Daily Flow Summary</p>
                  <p className="text-[10px] text-[#898493]">Automated briefing of today's tasks and events</p>
                </div>
              </div>
              <ToggleSwitch
                checked={user?.preferences?.dailySummaryEnabled !== false}
                onChange={(val) => updateUserPreferences({ dailySummaryEnabled: val })}
              />
            </div>

            {user?.preferences?.dailySummaryEnabled !== false && (
              <div className="pt-2 border-t border-[#EEEAF2] dark:border-[#2D2838]">
                <label className="block text-[11px] font-semibold text-[#898493] mb-1">
                  Delivery Time
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={user?.preferences?.dailySummaryTime || '08:00'}
                    onChange={(e) => updateUserPreferences({ dailySummaryTime: e.target.value })}
                    className="w-40 px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl text-[#34313D] dark:text-[#F4F2F7]"
                  />
                  <span className="text-[11px] text-[#898493]">
                    Delivers a morning overview of your scheduled flow
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* System Permissions & Test Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838]">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#898493]">Browser Permission:</span>
              <span
                className={`font-mono font-bold capitalize px-2 py-0.5 rounded-full text-[10px] ${
                  permissionStatus === 'granted'
                    ? 'bg-[#B5DCCB]/20 text-[#2D6A4F]'
                    : permissionStatus === 'denied'
                    ? 'bg-[#E07A5F]/20 text-[#E07A5F]'
                    : 'bg-[#FAF9FC] dark:bg-[#17151D] text-[#898493]'
                }`}
              >
                {permissionStatus}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {permissionStatus !== 'granted' && (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#A995D8] text-white hover:bg-[#9680C9] transition-all cursor-pointer shadow-xs"
                >
                  Request Permission
                </button>
              )}
              <button
                type="button"
                onClick={sendTestNotification}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-[#898493] hover:text-[#34313D] dark:hover:text-white transition-all cursor-pointer"
              >
                Preview Alert & Chime
              </button>
            </div>
          </div>
        </div>
      </BaseCard>

      {/* 5. Local Database & Persistent Storage Stats */}
      <BaseCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#A995D8]" />
            <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
              Offline-First Storage Engine
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#B5DCCB] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Persistent
          </span>
        </div>

        <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4">
          All modifications are saved persistently in your local database with indexed queries and zero data loss on page refresh.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
          <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-[#898493]">Tasks</span>
            <p className="text-base font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-0.5">
              {tasks.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-[#898493]">Schedules</span>
            <p className="text-base font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-0.5">
              {schedules.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-[#898493]">Notes</span>
            <p className="text-base font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-0.5">
              {notes.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-[#898493]">Focus Sessions</span>
            <p className="text-base font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-0.5">
              {focusSessions.length}
            </p>
          </div>
        </div>

        {/* Backup / Export / Import / Reset */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838]">
          <OutlinedButton
            icon={Download}
            onClick={handleExport}
            size="sm"
          >
            Export JSON Backup
          </OutlinedButton>

          <OutlinedButton
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            size="sm"
          >
            Restore Backup
          </OutlinedButton>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <SecondaryButton
            icon={RotateCcw}
            onClick={() => setIsResetConfirmOpen(true)}
            size="sm"
            className="ml-auto text-[#E07A5F] hover:bg-[#FCF3F0] dark:hover:bg-[#342020]"
          >
            Reset Database
          </SecondaryButton>
        </div>

        {importNotice && (
          <p className="text-xs text-[#A995D8] mt-2 font-medium">{importNotice}</p>
        )}
      </BaseCard>

      {/* 5. Cloud Firestore Architecture Blueprint */}
      <BaseCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[#A9C8E8]" />
            <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
              Cloud Sync & Firestore Readiness
            </h3>
          </div>
          <button
            onClick={triggerManualSync}
            className="text-xs font-semibold text-[#A995D8] hover:underline cursor-pointer"
          >
            Test Connection
          </button>
        </div>

        <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4">
          FlowDay is pre-configured with the exact schema matching Cloud Firestore specifications for real-time synchronization and Firebase Authentication.
        </p>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D]">
            <span className="font-mono text-[#34313D] dark:text-[#F4F2F7]">Sync Status</span>
            <span className="capitalize font-medium text-[#B5DCCB]">{syncState.syncStatus}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D]">
            <span className="font-mono text-[#34313D] dark:text-[#F4F2F7]">Security Architecture</span>
            <span className="flex items-center gap-1 text-[#898493]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B5DCCB]" />
              Role-Based Access Control (RBAC) ready
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D]">
            <span className="font-mono text-[#34313D] dark:text-[#F4F2F7]">Registered Schemas</span>
            <span className="font-mono text-[#898493]">
              {Object.keys(FIRESTORE_BLUEPRINT.collections).length} Collections
            </span>
          </div>
        </div>
      </BaseCard>

      {/* Confirmation Dialog for Reset */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        title="Reset Local Database"
        message="Are you sure you want to reset FlowDay? This will clear all local records and restore the pristine starting state."
        confirmLabel="Reset Everything"
        isDestructive
        onConfirm={() => {
          resetDatabase();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
