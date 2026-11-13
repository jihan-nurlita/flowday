import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { useFlow } from '../state/FlowContext';
import { APP_INFO, DEFAULT_USER_PREFERENCES } from '../../core/constants/defaults';
import {
  AppLanguageCode,
  AppThemeMode,
  DateFormatOption,
  DefaultCalendarViewOption,
  DefaultScheduleReminderOption,
  DefaultTaskPriorityOption,
  DefaultTaskSortOption,
  DefaultTaskViewOption,
  StartOfWeekOption,
  TimeFormatOption,
} from '../../domain/entities/user';
import { formatFullDate, formatReadableDate, formatTime } from '../../core/utils/date';
import { notificationService } from '../../data/services/notification_service';
import { BaseCard } from '../components/cards/AppCards';
import { OutlinedButton, PrimaryButton, SecondaryButton } from '../components/buttons/AppButtons';
import { ConfirmationDialog } from '../components/feedback/AppFeedback';
import {
  AlertCircle,
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  Download,
  Globe,
  Info,
  Key,
  Laptop,
  Lock,
  LogOut,
  Mail,
  Moon,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Target,
  Timer,
  Trash2,
  Upload,
  User as UserIcon,
  Volume2,
  WifiOff,
  X,
} from 'lucide-react';

type SettingsSectionId =
  | 'account'
  | 'appearance'
  | 'languageRegion'
  | 'notifications'
  | 'productivity'
  | 'calendar'
  | 'focus'
  | 'dataPrivacy'
  | 'about';

type PendingSensitiveAction = 'email' | 'password' | 'delete' | null;

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}> = ({ checked, onChange, disabled, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
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
    currentUser,
    firebaseUser,
    updateProfile,
    changeEmail,
    changePassword,
    reauthenticateWithPassword,
    reauthenticateWithGoogle,
    logout,
    deleteAccount,
  } = useAuth();

  const {
    user,
    t,
    language,
    prefSyncStatus,
    prefSaveError,
    hasPendingPrefSync,
    retrySyncPreferences,
    updateUserPreferences,
    clearLocalCache,
    exportPersonalData,
    importBackup,
    resetDatabase,
    syncState,
    triggerManualSync,
    tasks,
    schedules,
    notes,
    trashNotes,
    focusSessions,
    notifications,
    categories,
    productivityGoals,
    saveProductivityGoals,
    permissionStatus,
    requestNotificationPermission,
    sendTestNotification,
    timerState,
  } = useFlow();

  const prefs = useMemo(
    () => ({
      ...DEFAULT_USER_PREFERENCES,
      ...(user?.preferences || {}),
    }),
    [user?.preferences]
  );

  const [activeSection, setActiveSection] = useState<SettingsSectionId>('account');

  // ---------------------------------------------------------------------------
  // 1. Account State
  // ---------------------------------------------------------------------------
  const [displayName, setDisplayName] = useState(
    currentUser?.fullName || user?.fullName || ''
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [newEmailInput, setNewEmailInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // Re-authentication modal state
  const [reauthAction, setReauthAction] = useState<PendingSensitiveAction>(null);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  useEffect(() => {
    setDisplayName(currentUser?.fullName || user?.fullName || '');
  }, [currentUser?.fullName, user?.fullName]);

  const providerIds = useMemo(
    () => firebaseUser?.providerData?.map((p) => p.providerId) || [],
    [firebaseUser?.providerData]
  );
  const hasGoogleProvider = providerIds.includes('google.com');
  const hasPasswordProvider = providerIds.includes('password');
  const isGoogleOnly = hasGoogleProvider && !hasPasswordProvider;

  // ---------------------------------------------------------------------------
  // 2. Productivity Goals Local Form State (synced with Part 10)
  // ---------------------------------------------------------------------------
  const [dailyTaskEnabled, setDailyTaskEnabled] = useState<boolean>(
    Boolean(productivityGoals?.dailyTaskGoal?.enabled)
  );
  const [dailyTaskValue, setDailyTaskValue] = useState<string>(
    String(productivityGoals?.dailyTaskGoal?.target ?? 5)
  );
  const [weeklyTaskEnabled, setWeeklyTaskEnabled] = useState<boolean>(
    Boolean(productivityGoals?.weeklyTaskGoal?.enabled)
  );
  const [weeklyTaskValue, setWeeklyTaskValue] = useState<string>(
    String(productivityGoals?.weeklyTaskGoal?.target ?? 25)
  );
  const [dailyFocusEnabled, setDailyFocusEnabled] = useState<boolean>(
    Boolean(productivityGoals?.dailyFocusGoalMinutes?.enabled)
  );
  const [dailyFocusValue, setDailyFocusValue] = useState<string>(
    String(productivityGoals?.dailyFocusGoalMinutes?.target ?? 90)
  );
  const [weeklyFocusEnabled, setWeeklyFocusEnabled] = useState<boolean>(
    Boolean(productivityGoals?.weeklyFocusGoalMinutes?.enabled)
  );
  const [weeklyFocusValue, setWeeklyFocusValue] = useState<string>(
    String(productivityGoals?.weeklyFocusGoalMinutes?.target ?? 450)
  );
  const [goalsNotice, setGoalsNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  useEffect(() => {
    setDailyTaskEnabled(Boolean(productivityGoals?.dailyTaskGoal?.enabled));
    if (productivityGoals?.dailyTaskGoal?.target) {
      setDailyTaskValue(String(productivityGoals.dailyTaskGoal.target));
    }
    setWeeklyTaskEnabled(Boolean(productivityGoals?.weeklyTaskGoal?.enabled));
    if (productivityGoals?.weeklyTaskGoal?.target) {
      setWeeklyTaskValue(String(productivityGoals.weeklyTaskGoal.target));
    }
    setDailyFocusEnabled(Boolean(productivityGoals?.dailyFocusGoalMinutes?.enabled));
    if (productivityGoals?.dailyFocusGoalMinutes?.target) {
      setDailyFocusValue(String(productivityGoals.dailyFocusGoalMinutes.target));
    }
    setWeeklyFocusEnabled(Boolean(productivityGoals?.weeklyFocusGoalMinutes?.enabled));
    if (productivityGoals?.weeklyFocusGoalMinutes?.target) {
      setWeeklyFocusValue(String(productivityGoals.weeklyFocusGoalMinutes.target));
    }
  }, [productivityGoals]);

  // ---------------------------------------------------------------------------
  // 3. Focus & Calendar Numeric Inputs (validated before saving)
  // ---------------------------------------------------------------------------
  const [focusMinsInput, setFocusMinsInput] = useState(
    String(prefs.pomodoroDurationMinutes ?? 25)
  );
  const [shortBreakInput, setShortBreakInput] = useState(
    String(prefs.shortBreakMinutes ?? 5)
  );
  const [longBreakInput, setLongBreakInput] = useState(
    String(prefs.longBreakMinutes ?? 15)
  );
  const [longBreakIntervalInput, setLongBreakIntervalInput] = useState(
    String(prefs.longBreakInterval ?? 4)
  );
  const [focusValidationError, setFocusValidationError] = useState<string | null>(null);

  const [eventDurationInput, setEventDurationInput] = useState(
    String(prefs.defaultEventDurationMinutes ?? 60)
  );
  const [calendarDurationError, setCalendarDurationError] = useState<string | null>(null);

  useEffect(() => {
    setFocusMinsInput(String(prefs.pomodoroDurationMinutes ?? 25));
    setShortBreakInput(String(prefs.shortBreakMinutes ?? 5));
    setLongBreakInput(String(prefs.longBreakMinutes ?? 15));
    setLongBreakIntervalInput(String(prefs.longBreakInterval ?? 4));
    setEventDurationInput(String(prefs.defaultEventDurationMinutes ?? 60));
  }, [
    prefs.pomodoroDurationMinutes,
    prefs.shortBreakMinutes,
    prefs.longBreakMinutes,
    prefs.longBreakInterval,
    prefs.defaultEventDurationMinutes,
  ]);

  // ---------------------------------------------------------------------------
  // 4. Data & Privacy State
  // ---------------------------------------------------------------------------
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [dataNotice, setDataNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isClearCacheOpen, setIsClearCacheOpen] = useState(false);
  const [isResetDbOpen, setIsResetDbOpen] = useState(false);

  const isVibrationSupported = notificationService.isVibrationSupported();
  const deviceTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || prefs.timezone || 'UTC';
    } catch {
      return prefs.timezone || 'UTC';
    }
  }, [prefs.timezone]);

  const sections: {
    id: SettingsSectionId;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'account', label: t.settings.sections.account, icon: UserIcon },
    { id: 'appearance', label: t.settings.sections.appearance, icon: Sun },
    { id: 'languageRegion', label: t.settings.sections.languageRegion, icon: Globe },
    { id: 'notifications', label: t.settings.sections.notifications, icon: Bell },
    { id: 'productivity', label: t.settings.sections.productivity, icon: Target },
    { id: 'calendar', label: t.settings.sections.calendar, icon: Calendar },
    { id: 'focus', label: t.settings.sections.focus, icon: Timer },
    { id: 'dataPrivacy', label: t.settings.sections.dataPrivacy, icon: Database },
    { id: 'about', label: t.settings.sections.about, icon: Info },
  ];

  // ---------------------------------------------------------------------------
  // Handlers: Account
  // ---------------------------------------------------------------------------
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) return;
    setIsSavingProfile(true);
    setProfileNotice(null);
    try {
      await updateProfile(trimmed);
      setProfileNotice({ type: 'success', text: t.common.saved });
      setTimeout(() => setProfileNotice(null), 3000);
    } catch (err: any) {
      setProfileNotice({ type: 'error', text: err?.message || t.common.saveFailed });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileNotice({
        type: 'error',
        text: language === 'id' ? 'Ukuran foto maksimal 2MB.' : 'Maximum photo size is 2MB.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        await updateProfile(
          displayName.trim() || currentUser?.fullName || 'FlowDay User',
          dataUrl
        );
        setProfileNotice({ type: 'success', text: t.common.saved });
        setTimeout(() => setProfileNotice(null), 3000);
      } catch (err: any) {
        setProfileNotice({ type: 'error', text: err?.message || t.common.saveFailed });
      }
    };
    reader.readAsDataURL(file);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleRemovePhoto = async () => {
    setProfileNotice(null);
    try {
      await updateProfile(displayName.trim() || currentUser?.fullName || 'FlowDay User', '');
      setProfileNotice({ type: 'success', text: t.common.saved });
      setTimeout(() => setProfileNotice(null), 3000);
    } catch (err: any) {
      setProfileNotice({ type: 'error', text: err?.message || t.common.saveFailed });
    }
  };

  const needsReauthError = (err: any) =>
    err?.code === 'auth/requires-recent-login' ||
    String(err?.message || '').toLowerCase().includes('re-authenticate') ||
    String(err?.message || '').toLowerCase().includes('verify your current password');

  const executeEmailChange = async () => {
    const trimmed = newEmailInput.trim();
    if (!trimmed) return;
    setIsUpdatingEmail(true);
    setEmailNotice(null);
    try {
      await changeEmail(trimmed);
      setEmailNotice({ type: 'success', text: t.settings.account.emailVerificationSent });
      setNewEmailInput('');
    } catch (err: any) {
      if (needsReauthError(err)) {
        setReauthAction('email');
        setReauthError(null);
      } else {
        setEmailNotice({ type: 'error', text: err?.message || t.common.saveFailed });
      }
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const executePasswordChange = async () => {
    setPasswordNotice(null);
    if (newPasswordInput.length < 6) {
      setPasswordNotice({
        type: 'error',
        text:
          language === 'id'
            ? 'Kata sandi baru minimal 6 karakter.'
            : 'New password must be at least 6 characters.',
      });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordNotice({
        type: 'error',
        text:
          language === 'id'
            ? 'Konfirmasi kata sandi tidak cocok.'
            : 'Password confirmation does not match.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword(newPasswordInput);
      setPasswordNotice({ type: 'success', text: t.common.saved });
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      if (needsReauthError(err)) {
        setReauthAction('password');
        setReauthError(null);
      } else {
        setPasswordNotice({ type: 'error', text: err?.message || t.common.saveFailed });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const executeDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await deleteAccount();
    } catch (err: any) {
      setIsDeletingAccount(false);
      setIsDeleteAccountOpen(false);
      if (needsReauthError(err)) {
        setReauthAction('delete');
        setReauthError(null);
      } else {
        setDeleteAccountError(err?.message || t.common.saveFailed);
      }
    }
  };

  const handleConfirmReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReauthenticating(true);
    setReauthError(null);
    try {
      if (hasGoogleProvider && !hasPasswordProvider) {
        await reauthenticateWithGoogle();
      } else {
        if (!reauthPassword) {
          setReauthError(
            language === 'id'
              ? 'Masukkan kata sandi saat ini.'
              : 'Please enter your current password.'
          );
          setIsReauthenticating(false);
          return;
        }
        await reauthenticateWithPassword(reauthPassword);
      }
      const pending = reauthAction;
      setReauthAction(null);
      setReauthPassword('');
      if (pending === 'email') await executeEmailChange();
      if (pending === 'password') await executePasswordChange();
      if (pending === 'delete') await executeDeleteAccount();
    } catch (err: any) {
      setReauthError(err?.message || t.common.saveFailed);
    } finally {
      setIsReauthenticating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers: Productivity Goals & Numeric Preferences
  // ---------------------------------------------------------------------------
  const handleSaveProductivityGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalsNotice(null);

    const parsedDailyTask = Number(dailyTaskValue);
    const parsedWeeklyTask = Number(weeklyTaskValue);
    const parsedDailyFocus = Number(dailyFocusValue);
    const parsedWeeklyFocus = Number(weeklyFocusValue);

    if (
      (dailyTaskEnabled && (!Number.isFinite(parsedDailyTask) || parsedDailyTask < 1)) ||
      (weeklyTaskEnabled && (!Number.isFinite(parsedWeeklyTask) || parsedWeeklyTask < 1)) ||
      (dailyFocusEnabled && (!Number.isFinite(parsedDailyFocus) || parsedDailyFocus < 1)) ||
      (weeklyFocusEnabled && (!Number.isFinite(parsedWeeklyFocus) || parsedWeeklyFocus < 1))
    ) {
      setGoalsNotice({ type: 'error', text: t.settings.productivity.validationError });
      return;
    }

    setIsSavingGoals(true);
    try {
      await saveProductivityGoals({
        dailyTaskGoal: {
          enabled: dailyTaskEnabled,
          target: Math.max(
            1,
            Math.round(dailyTaskEnabled ? parsedDailyTask : Number(dailyTaskValue) || 5)
          ),
        },
        weeklyTaskGoal: {
          enabled: weeklyTaskEnabled,
          target: Math.max(
            1,
            Math.round(weeklyTaskEnabled ? parsedWeeklyTask : Number(weeklyTaskValue) || 25)
          ),
        },
        dailyFocusGoalMinutes: {
          enabled: dailyFocusEnabled,
          target: Math.max(
            1,
            Math.round(dailyFocusEnabled ? parsedDailyFocus : Number(dailyFocusValue) || 90)
          ),
        },
        weeklyFocusGoalMinutes: {
          enabled: weeklyFocusEnabled,
          target: Math.max(
            1,
            Math.round(weeklyFocusEnabled ? parsedWeeklyFocus : Number(weeklyFocusValue) || 450)
          ),
        },
      });
      setGoalsNotice({ type: 'success', text: t.common.saved });
      setTimeout(() => setGoalsNotice(null), 2500);
    } catch (err: any) {
      setGoalsNotice({ type: 'error', text: err?.message || t.common.saveFailed });
    } finally {
      setIsSavingGoals(false);
    }
  };

  const handleSaveFocusDurations = async (e: React.FormEvent) => {
    e.preventDefault();
    const pFocus = Number(focusMinsInput);
    const pShort = Number(shortBreakInput);
    const pLong = Number(longBreakInput);
    const pInterval = Number(longBreakIntervalInput);

    if (
      !Number.isFinite(pFocus) ||
      pFocus < 1 ||
      !Number.isFinite(pShort) ||
      pShort < 1 ||
      !Number.isFinite(pLong) ||
      pLong < 1 ||
      !Number.isFinite(pInterval) ||
      pInterval < 1
    ) {
      setFocusValidationError(t.settings.focus.validationError);
      return;
    }

    setFocusValidationError(null);
    await updateUserPreferences({
      pomodoroDurationMinutes: Math.round(pFocus),
      shortBreakMinutes: Math.round(pShort),
      longBreakMinutes: Math.round(pLong),
      longBreakInterval: Math.round(pInterval),
    });
  };

  const handleSaveEventDuration = async () => {
    const parsed = Number(eventDurationInput);
    if (!Number.isFinite(parsed) || parsed < 5) {
      setCalendarDurationError(
        language === 'id' ? 'Durasi minimal 5 menit.' : 'Duration must be at least 5 minutes.'
      );
      return;
    }
    setCalendarDurationError(null);
    await updateUserPreferences({ defaultEventDurationMinutes: Math.round(parsed) });
  };

  // ---------------------------------------------------------------------------
  // Handlers: Data & Privacy
  // ---------------------------------------------------------------------------
  const handleExportPersonalData = () => {
    const jsonStr = exportPersonalData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowday_personal_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const ok = importBackup(content);
      setDataNotice({
        type: ok ? 'success' : 'error',
        text: ok ? t.settings.dataPrivacy.importSuccess : t.settings.dataPrivacy.importFailed,
      });
      setTimeout(() => setDataNotice(null), 4000);
    };
    reader.readAsText(file);
    if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const handleConfirmClearCache = () => {
    clearLocalCache();
    setIsClearCacheOpen(false);
    setDataNotice({
      type: 'success',
      text: t.settings.dataPrivacy.cacheClearedNotice,
    });
    setTimeout(() => setDataNotice(null), 4000);
  };

  const currentTheme = prefs.themeMode || prefs.theme || 'system';

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Header & Live Preference Sync Status */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
            {t.settings.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
            {t.settings.subtitle}
          </p>
        </div>

        {/* Preference Sync Status Badge */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          {prefSyncStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F1FA] dark:bg-[#2C253B] text-[#A995D8] text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t.settings.status.saving}</span>
            </span>
          )}
          {prefSyncStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBF7F2] dark:bg-[#1E3329] text-[#28634B] dark:text-[#B5DCCB] text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.settings.status.saved}</span>
            </span>
          )}
          {(prefSyncStatus === 'saved_offline' || hasPendingPrefSync) && (
            <button
              type="button"
              onClick={retrySyncPreferences}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDF8EC] dark:bg-[#342C1D] border border-[#E9C46A]/50 text-[#9B7419] dark:text-[#E9C46A] text-xs font-semibold cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{t.settings.status.savedOffline}</span>
              <span className="underline ml-1">{t.settings.dataPrivacy.syncNow}</span>
            </button>
          )}
          {prefSyncStatus === 'error' && (
            <button
              type="button"
              onClick={retrySyncPreferences}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FCF3F0] dark:bg-[#342020] border border-[#E07A5F]/50 text-[#E07A5F] text-xs font-semibold cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{prefSaveError || t.settings.status.saveError}</span>
              <span className="underline ml-1">{t.common.retry}</span>
            </button>
          )}
        </div>
      </div>

      {/* Offline Banner */}
      {!syncState.isOnline && (
        <div className="p-3.5 rounded-2xl bg-[#EEF5FC] dark:bg-[#1E2C3D] border border-[#A9C8E8]/50 flex items-center gap-2.5 text-xs text-[#2B5885] dark:text-[#A9C8E8]">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.common.offlineNotice}</span>
        </div>
      )}

      {/* 2. Responsive Navigation + Content Shell */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Mobile / Tablet Horizontal Section Tabs */}
        <div className="w-full lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#A995D8] text-white shadow-xs'
                    : 'bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] dark:text-[#9E99A8]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-20 bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] p-2.5 shadow-xs space-y-1">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#F4F1FA] dark:bg-[#2C253B] text-[#A995D8]'
                    : 'text-[#898493] dark:text-[#9E99A8] hover:bg-[#FAF9FC] dark:hover:bg-[#252131] hover:text-[#34313D] dark:hover:text-[#F4F2F7]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Active Section Panel */}
        <div className="flex-1 w-full min-w-0 space-y-5">
          {/* ================================================================= */}
          {/* SECTION 1: ACCOUNT                                                */}
          {/* ================================================================= */}
          {activeSection === 'account' && (
            <div className="space-y-5">
              {/* Profile Identity Card */}
              <BaseCard>
                <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.settings.account.title}
                </h3>
                <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5 mb-5">
                  {t.settings.account.desc}
                </p>

                {profileNotice && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs mb-4 ${
                      profileNotice.type === 'success'
                        ? 'bg-[#F2F8F5] dark:bg-[#1C3127] border-[#B5DCCB] text-[#28634B] dark:text-[#B5DCCB]'
                        : 'bg-[#FCF3F0] dark:bg-[#342020] border-[#E07A5F] text-[#E07A5F]'
                    }`}
                  >
                    {profileNotice.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{profileNotice.text}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 mb-5 border-b border-[#EEEAF2] dark:border-[#2D2838]">
                  <div className="relative shrink-0">
                    {currentUser?.photoUrl ? (
                      <img
                        src={currentUser.photoUrl}
                        alt={currentUser.fullName}
                        className="w-20 h-20 rounded-3xl object-cover border-2 border-[#A995D8]/30 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#A995D8] via-[#F1B8CC] to-[#A9C8E8] flex items-center justify-center text-white text-2xl font-extrabold shadow-sm">
                        {(currentUser?.fullName || user?.fullName || 'F').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-[#A995D8] text-white shadow-md hover:bg-[#9680C9] cursor-pointer"
                      aria-label={t.settings.account.changePhoto}
                      title={t.settings.account.changePhoto}
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
                      {currentUser?.fullName || user?.fullName || 'FlowDay User'}
                    </h4>
                    <p className="text-xs text-[#898493] dark:text-[#9E99A8] flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{currentUser?.email || user?.email}</span>
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                      <OutlinedButton
                        size="sm"
                        icon={Camera}
                        onClick={() => photoInputRef.current?.click()}
                      >
                        {t.settings.account.changePhoto}
                      </OutlinedButton>
                      {currentUser?.photoUrl && (
                        <SecondaryButton
                          size="sm"
                          icon={Trash2}
                          onClick={handleRemovePhoto}
                          className="text-[#E07A5F]"
                        >
                          {t.settings.account.removePhoto}
                        </SecondaryButton>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveName} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                        {t.settings.account.displayName}
                      </label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] focus:outline-none focus:border-[#A995D8]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                        {t.settings.account.emailAddress}
                      </label>
                      <input
                        type="email"
                        disabled
                        value={currentUser?.email || user?.email || ''}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#EEEAF2]/50 dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <PrimaryButton type="submit" size="sm" isLoading={isSavingProfile}>
                      {t.settings.account.updateName}
                    </PrimaryButton>
                  </div>
                </form>
              </BaseCard>

              {/* Change Email */}
              <BaseCard>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-[#A9C8E8]" />
                  <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                    {t.settings.account.changeEmailTitle}
                  </h3>
                </div>
                <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4">
                  {t.settings.account.changeEmailDesc}
                </p>

                {emailNotice && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs mb-4 ${
                      emailNotice.type === 'success'
                        ? 'bg-[#F2F8F5] dark:bg-[#1C3127] border-[#B5DCCB] text-[#28634B] dark:text-[#B5DCCB]'
                        : 'bg-[#FCF3F0] dark:bg-[#342020] border-[#E07A5F] text-[#E07A5F]'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{emailNotice.text}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder={t.settings.account.newEmail}
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] focus:outline-none focus:border-[#A995D8]"
                  />
                  <PrimaryButton
                    type="button"
                    size="sm"
                    disabled={!newEmailInput.trim()}
                    isLoading={isUpdatingEmail}
                    onClick={executeEmailChange}
                  >
                    {t.settings.account.sendEmailVerification}
                  </PrimaryButton>
                </div>
              </BaseCard>

              {/* Change Password */}
              <BaseCard>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-4 h-4 text-[#A995D8]" />
                  <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                    {t.settings.account.changePasswordTitle}
                  </h3>
                </div>
                <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4">
                  {t.settings.account.changePasswordDesc}
                </p>

                {isGoogleOnly ? (
                  <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-xs text-[#898493] dark:text-[#9E99A8]">
                    {t.settings.account.googleAccountPasswordNote}
                  </div>
                ) : (
                  <>
                    {passwordNotice && (
                      <div
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs mb-4 ${
                          passwordNotice.type === 'success'
                            ? 'bg-[#F2F8F5] dark:bg-[#1C3127] border-[#B5DCCB] text-[#28634B] dark:text-[#B5DCCB]'
                            : 'bg-[#FCF3F0] dark:bg-[#342020] border-[#E07A5F] text-[#E07A5F]'
                        }`}
                      >
                        {passwordNotice.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{passwordNotice.text}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input
                        type="password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder={t.settings.account.newPassword}
                        className="px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] focus:outline-none focus:border-[#A995D8]"
                      />
                      <input
                        type="password"
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder={t.settings.account.confirmPassword}
                        className="px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] focus:outline-none focus:border-[#A995D8]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <PrimaryButton
                        type="button"
                        size="sm"
                        disabled={!newPasswordInput || !confirmPasswordInput}
                        isLoading={isUpdatingPassword}
                        onClick={executePasswordChange}
                      >
                        {t.settings.account.updatePassword}
                      </PrimaryButton>
                    </div>
                  </>
                )}
              </BaseCard>

              {/* Account Security & Session Actions */}
              <BaseCard>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-[#B5DCCB]" />
                  <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                    {t.settings.account.securityTitle}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between">
                    <span className="text-[#898493]">{t.settings.account.authProvider}</span>
                    <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {hasGoogleProvider
                        ? 'Google'
                        : hasPasswordProvider
                        ? 'Email & Password'
                        : 'Firebase Auth'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between">
                    <span className="text-[#898493]">{t.settings.account.emailVerified}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        firebaseUser?.emailVerified
                          ? 'bg-[#EBF7F2] text-[#28634B] dark:bg-[#1E3329] dark:text-[#B5DCCB]'
                          : 'bg-[#FDF8EC] text-[#9B7419] dark:bg-[#342C1D] dark:text-[#E9C46A]'
                      }`}
                    >
                      {firebaseUser?.emailVerified
                        ? t.settings.account.verifiedYes
                        : t.settings.account.verifiedNo}
                    </span>
                  </div>
                </div>

                {deleteAccountError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FCF3F0] dark:bg-[#342020] border border-[#E07A5F] text-xs text-[#E07A5F] mb-4">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{deleteAccountError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838]">
                  <SecondaryButton
                    icon={LogOut}
                    size="sm"
                    onClick={logout}
                  >
                    {t.settings.account.logout}
                  </SecondaryButton>

                  <SecondaryButton
                    icon={ShieldAlert}
                    size="sm"
                    onClick={() => setIsDeleteAccountOpen(true)}
                    className="text-[#E07A5F] hover:bg-[#FCF3F0] dark:hover:bg-[#342020] border border-[#E07A5F]/30"
                  >
                    {t.settings.account.deleteAccount}
                  </SecondaryButton>
                </div>
              </BaseCard>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 2: APPEARANCE                                             */}
          {/* ================================================================= */}
          {activeSection === 'appearance' && (
            <BaseCard>
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                {t.settings.appearance.title}
              </h3>
              <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5 mb-5">
                {t.settings.appearance.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {(
                  [
                    {
                      id: 'light' as AppThemeMode,
                      label: t.settings.appearance.light,
                      icon: Sun,
                      swatchBg: 'bg-[#FAF9FC] border-[#EEEAF2]',
                      swatchAccent: 'bg-[#A995D8]',
                    },
                    {
                      id: 'dark' as AppThemeMode,
                      label: t.settings.appearance.dark,
                      icon: Moon,
                      swatchBg: 'bg-[#17151D] border-[#2D2838]',
                      swatchAccent: 'bg-[#A995D8]',
                    },
                    {
                      id: 'system' as AppThemeMode,
                      label: t.settings.appearance.system,
                      icon: Laptop,
                      swatchBg:
                        'bg-gradient-to-r from-[#FAF9FC] via-[#FAF9FC] to-[#17151D] border-[#EEEAF2] dark:border-[#2D2838]',
                      swatchAccent: 'bg-[#B5DCCB]',
                    },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = currentTheme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        updateUserPreferences({ themeMode: item.id, theme: item.id })
                      }
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                        active
                          ? 'border-[#A995D8] bg-[#F4F1FA]/60 dark:bg-[#2C253B] shadow-xs'
                          : 'border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] hover:border-[#A995D8]/40'
                      }`}
                    >
                      <div className={`h-14 rounded-xl border p-2.5 flex items-end justify-between ${item.swatchBg}`}>
                        <span className={`w-8 h-2 rounded-full ${item.swatchAccent}`} />
                        <span className="w-3 h-3 rounded-full bg-[#F1B8CC]" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`w-4 h-4 ${
                              active ? 'text-[#A995D8]' : 'text-[#898493]'
                            }`}
                          />
                          <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                            {item.label}
                          </span>
                        </div>
                        {active && <CheckCircle2 className="w-4 h-4 text-[#A995D8]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-4">
                {t.settings.appearance.previewNote}
              </p>
            </BaseCard>
          )}

          {/* ================================================================= */}
          {/* SECTION 3: LANGUAGE & REGION                                      */}
          {/* ================================================================= */}
          {activeSection === 'languageRegion' && (
            <BaseCard>
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                {t.settings.languageRegion.title}
              </h3>
              <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5 mb-5">
                {t.settings.languageRegion.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                    {t.settings.languageRegion.appLanguage}
                  </label>
                  <select
                    value={prefs.language}
                    onChange={(e) =>
                      updateUserPreferences({
                        language: e.target.value as AppLanguageCode,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                  >
                    <option value="en">English (EN)</option>
                    <option value="id">Bahasa Indonesia (ID)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                    {t.settings.languageRegion.dateFormat}
                  </label>
                  <select
                    value={prefs.dateFormat || 'MMM d, yyyy'}
                    onChange={(e) =>
                      updateUserPreferences({
                        dateFormat: e.target.value as DateFormatOption,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                  >
                    <option value="MMM d, yyyy">Readable (Thu, Nov 12)</option>
                    <option value="dd/MM/yyyy">DD/MM/YYYY (12/11/2026)</option>
                    <option value="MM/dd/yyyy">MM/DD/YYYY (11/12/2026)</option>
                    <option value="yyyy-MM-dd">ISO (2026-11-12)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                    {t.settings.languageRegion.timeFormat}
                  </label>
                  <select
                    value={prefs.timeFormat}
                    onChange={(e) =>
                      updateUserPreferences({
                        timeFormat: e.target.value as TimeFormatOption,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                  >
                    <option value="24h">{t.settings.languageRegion.timeFormat24}</option>
                    <option value="12h">{t.settings.languageRegion.timeFormat12}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                    {t.settings.languageRegion.firstDayOfWeek}
                  </label>
                  <select
                    value={prefs.startOfWeek}
                    onChange={(e) =>
                      updateUserPreferences({
                        startOfWeek: e.target.value as StartOfWeekOption,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                  >
                    <option value="monday">{t.settings.languageRegion.monday}</option>
                    <option value="sunday">{t.settings.languageRegion.sunday}</option>
                  </select>
                </div>
              </div>

              {/* Device Timezone & Live Formatting Preview */}
              <div className="mt-5 pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                  <span className="text-[11px] font-semibold text-[#898493]">
                    {t.settings.languageRegion.timezoneDisplay}
                  </span>
                  <p className="font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-1">
                    {deviceTimezone}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F1FA]/50 dark:bg-[#2C253B]/50 border border-[#A995D8]/30">
                  <span className="text-[11px] font-semibold text-[#A995D8]">
                    {t.settings.languageRegion.previewLabel}
                  </span>
                  <p className="font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-1">
                    {formatReadableDate(new Date(), {
                      language: prefs.language,
                      dateFormat: prefs.dateFormat || 'MMM d, yyyy',
                    })}{' '}
                    · {formatTime('14:30', prefs.timeFormat)}
                  </p>
                  <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-0.5">
                    {formatFullDate(new Date(), prefs.language)}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-3">
                {t.settings.languageRegion.timezoneHint}
              </p>
            </BaseCard>
          )}

          {/* ================================================================= */}
          {/* SECTION 4: NOTIFICATIONS                                          */}
          {/* ================================================================= */}
          {activeSection === 'notifications' && (
            <BaseCard>
              <div className="flex items-center justify-between pb-4 border-b border-[#EEEAF2] dark:border-[#2D2838] mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                    {t.settings.notifications.title}
                  </h3>
                  <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5">
                    {t.settings.notifications.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-[#898493]">
                    {prefs.notificationEnabled !== false ? t.common.enabled : t.common.disabled}
                  </span>
                  <ToggleSwitch
                    checked={prefs.notificationEnabled !== false}
                    onChange={(val) => updateUserPreferences({ notificationEnabled: val })}
                    ariaLabel={t.settings.notifications.masterToggle}
                  />
                </div>
              </div>

              <div
                className={`space-y-4 ${
                  prefs.notificationEnabled === false ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Task Reminders */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <div className="pr-2">
                      <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                        {t.settings.notifications.taskReminders}
                      </p>
                      <p className="text-[11px] text-[#898493] mt-0.5">
                        {t.settings.notifications.taskRemindersDesc}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={prefs.taskRemindersEnabled !== false}
                      onChange={(val) => updateUserPreferences({ taskRemindersEnabled: val })}
                    />
                  </div>

                  {/* Schedule Reminders */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <div className="pr-2">
                      <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                        {t.settings.notifications.scheduleReminders}
                      </p>
                      <p className="text-[11px] text-[#898493] mt-0.5">
                        {t.settings.notifications.scheduleRemindersDesc}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={prefs.scheduleRemindersEnabled !== false}
                      onChange={(val) => updateUserPreferences({ scheduleRemindersEnabled: val })}
                    />
                  </div>

                  {/* Focus Alerts */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <div className="pr-2">
                      <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                        {t.settings.notifications.focusAlerts}
                      </p>
                      <p className="text-[11px] text-[#898493] mt-0.5">
                        {t.settings.notifications.focusAlertsDesc}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={prefs.focusNotificationsEnabled !== false}
                      onChange={(val) => updateUserPreferences({ focusNotificationsEnabled: val })}
                    />
                  </div>

                  {/* Celebrations */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <div className="pr-2">
                      <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                        {t.settings.notifications.celebrations}
                      </p>
                      <p className="text-[11px] text-[#898493] mt-0.5">
                        {t.settings.notifications.celebrationsDesc}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={prefs.taskCompletionCelebration !== false}
                      onChange={(val) =>
                        updateUserPreferences({ taskCompletionCelebration: val })
                      }
                    />
                  </div>

                  {/* Sound */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <div className="flex items-center gap-2.5 pr-2">
                      <Volume2 className="w-4 h-4 text-[#A995D8] shrink-0" />
                      <div>
                        <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                          {t.settings.notifications.sound}
                        </p>
                        <p className="text-[11px] text-[#898493] mt-0.5">
                          {t.settings.notifications.soundDesc}
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={prefs.soundEnabled !== false}
                      onChange={(val) => updateUserPreferences({ soundEnabled: val })}
                    />
                  </div>

                  {/* Vibration (only when hardware/browser supports it) */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <div className="flex items-center gap-2.5 pr-2">
                      <Smartphone className="w-4 h-4 text-[#898493] shrink-0" />
                      <div>
                        <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                          {t.settings.notifications.vibration}
                        </p>
                        <p className="text-[11px] text-[#898493] mt-0.5">
                          {isVibrationSupported
                            ? t.settings.notifications.vibrationDesc
                            : t.settings.notifications.vibrationUnsupported}
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={isVibrationSupported && prefs.vibrationEnabled !== false}
                      disabled={!isVibrationSupported}
                      onChange={(val) => updateUserPreferences({ vibrationEnabled: val })}
                    />
                  </div>
                </div>

                {/* Quiet Hours */}
                <div className="p-4 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-[#A995D8]" />
                      <div>
                        <p className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                          {t.settings.notifications.quietHours}
                        </p>
                        <p className="text-[11px] text-[#898493]">
                          {t.settings.notifications.quietHoursDesc}
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={!!prefs.quietHoursEnabled}
                      onChange={(val) => updateUserPreferences({ quietHoursEnabled: val })}
                    />
                  </div>

                  {prefs.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838]">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#898493] mb-1">
                          {t.settings.notifications.quietStart}
                        </label>
                        <input
                          type="time"
                          value={prefs.quietHoursStart || '22:00'}
                          onChange={(e) =>
                            updateUserPreferences({ quietHoursStart: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl text-[#34313D] dark:text-[#F4F2F7]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#898493] mb-1">
                          {t.settings.notifications.quietEnd}
                        </label>
                        <input
                          type="time"
                          value={prefs.quietHoursEnd || '07:00'}
                          onChange={(e) =>
                            updateUserPreferences({ quietHoursEnd: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl text-[#34313D] dark:text-[#F4F2F7]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Daily Summary */}
                <div className="p-4 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#A9C8E8]" />
                      <div>
                        <p className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                          {t.settings.notifications.dailySummary}
                        </p>
                        <p className="text-[11px] text-[#898493]">
                          {t.settings.notifications.dailySummaryDesc}
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={prefs.dailySummaryEnabled !== false}
                      onChange={(val) => updateUserPreferences({ dailySummaryEnabled: val })}
                    />
                  </div>

                  {prefs.dailySummaryEnabled !== false && (
                    <div className="pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838]">
                      <label className="block text-[11px] font-semibold text-[#898493] mb-1">
                        {t.settings.notifications.deliveryTime}
                      </label>
                      <input
                        type="time"
                        value={prefs.dailySummaryTime || '08:00'}
                        onChange={(e) =>
                          updateUserPreferences({ dailySummaryTime: e.target.value })
                        }
                        className="w-40 px-3 py-1.5 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl text-[#34313D] dark:text-[#F4F2F7]"
                      />
                    </div>
                  )}
                </div>

                {/* Permission & Test */}
                <div className="pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#898493]">
                        {t.settings.notifications.osPermission}:
                      </span>
                      <span
                        className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                          permissionStatus === 'granted'
                            ? 'bg-[#EBF7F2] text-[#28634B] dark:bg-[#1E3329] dark:text-[#B5DCCB]'
                            : permissionStatus === 'denied'
                            ? 'bg-[#FCF3F0] text-[#E07A5F] dark:bg-[#342020]'
                            : 'bg-[#FAF9FC] dark:bg-[#17151D] text-[#898493]'
                        }`}
                      >
                        {permissionStatus === 'granted'
                          ? t.settings.notifications.permissionGranted
                          : permissionStatus === 'denied'
                          ? t.settings.notifications.permissionDenied
                          : permissionStatus === 'unsupported'
                          ? t.settings.notifications.permissionUnsupported
                          : t.settings.notifications.permissionDefault}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
                        <PrimaryButton size="sm" onClick={requestNotificationPermission}>
                          {t.settings.notifications.requestPermission}
                        </PrimaryButton>
                      )}
                      <OutlinedButton size="sm" onClick={sendTestNotification}>
                        {t.settings.notifications.previewAlert}
                      </OutlinedButton>
                    </div>
                  </div>

                  {permissionStatus === 'denied' && (
                    <p className="text-[11px] text-[#E07A5F] bg-[#FCF3F0] dark:bg-[#342020] p-3 rounded-xl border border-[#E07A5F]/30">
                      {t.settings.notifications.permissionDeniedHint}
                    </p>
                  )}
                </div>
              </div>
            </BaseCard>
          )}

          {/* ================================================================= */}
          {/* SECTION 5: PRODUCTIVITY PREFERENCES                               */}
          {/* ================================================================= */}
          {activeSection === 'productivity' && (
            <div className="space-y-5">
              {/* Shared Targets (synced with Statistics Part 10) */}
              <BaseCard>
                <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.settings.productivity.title}
                </h3>
                <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5 mb-5">
                  {t.settings.productivity.desc}
                </p>

                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A995D8] mb-3">
                  {t.settings.productivity.goalsHeader}
                </h4>

                {goalsNotice && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs mb-4 ${
                      goalsNotice.type === 'success'
                        ? 'bg-[#F2F8F5] dark:bg-[#1C3127] border-[#B5DCCB] text-[#28634B] dark:text-[#B5DCCB]'
                        : 'bg-[#FCF3F0] dark:bg-[#342020] border-[#E07A5F] text-[#E07A5F]'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{goalsNotice.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProductivityGoals} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Daily Task Goal */}
                    <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                          {t.settings.productivity.dailyTaskGoal}
                        </span>
                        <ToggleSwitch
                          checked={dailyTaskEnabled}
                          onChange={setDailyTaskEnabled}
                        />
                      </div>
                      <input
                        type="number"
                        min={1}
                        disabled={!dailyTaskEnabled}
                        value={dailyTaskValue}
                        onChange={(e) => setDailyTaskValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] font-mono text-[#34313D] dark:text-[#F4F2F7] disabled:opacity-40"
                      />
                    </div>

                    {/* Weekly Task Goal */}
                    <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                          {t.settings.productivity.weeklyTaskGoal}
                        </span>
                        <ToggleSwitch
                          checked={weeklyTaskEnabled}
                          onChange={setWeeklyTaskEnabled}
                        />
                      </div>
                      <input
                        type="number"
                        min={1}
                        disabled={!weeklyTaskEnabled}
                        value={weeklyTaskValue}
                        onChange={(e) => setWeeklyTaskValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] font-mono text-[#34313D] dark:text-[#F4F2F7] disabled:opacity-40"
                      />
                    </div>

                    {/* Daily Focus Goal */}
                    <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                          {t.settings.productivity.dailyFocusGoal}
                        </span>
                        <ToggleSwitch
                          checked={dailyFocusEnabled}
                          onChange={setDailyFocusEnabled}
                        />
                      </div>
                      <input
                        type="number"
                        min={1}
                        disabled={!dailyFocusEnabled}
                        value={dailyFocusValue}
                        onChange={(e) => setDailyFocusValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] font-mono text-[#34313D] dark:text-[#F4F2F7] disabled:opacity-40"
                      />
                    </div>

                    {/* Weekly Focus Goal */}
                    <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                          {t.settings.productivity.weeklyFocusGoal}
                        </span>
                        <ToggleSwitch
                          checked={weeklyFocusEnabled}
                          onChange={setWeeklyFocusEnabled}
                        />
                      </div>
                      <input
                        type="number"
                        min={1}
                        disabled={!weeklyFocusEnabled}
                        value={weeklyFocusValue}
                        onChange={(e) => setWeeklyFocusValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] font-mono text-[#34313D] dark:text-[#F4F2F7] disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <PrimaryButton type="submit" size="sm" isLoading={isSavingGoals}>
                      {t.settings.productivity.saveGoals}
                    </PrimaryButton>
                  </div>
                </form>
              </BaseCard>

              {/* Task Creation & View Defaults */}
              <BaseCard>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A995D8] mb-4">
                  {t.settings.productivity.defaultsHeader}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                      {t.settings.productivity.defaultPriority}
                    </label>
                    <select
                      value={prefs.defaultTaskPriority || 'medium'}
                      onChange={(e) =>
                        updateUserPreferences({
                          defaultTaskPriority: e.target.value as DefaultTaskPriorityOption,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                      {t.settings.productivity.defaultCategory}
                    </label>
                    <select
                      value={prefs.defaultTaskCategory || ''}
                      onChange={(e) =>
                        updateUserPreferences({ defaultTaskCategory: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                    >
                      <option value="">{t.settings.productivity.autoCategory}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                      {t.settings.productivity.defaultView}
                    </label>
                    <select
                      value={prefs.defaultTaskView || 'list'}
                      onChange={(e) =>
                        updateUserPreferences({
                          defaultTaskView: e.target.value as DefaultTaskViewOption,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                    >
                      <option value="list">{t.settings.productivity.listView}</option>
                      <option value="grid">{t.settings.productivity.gridView}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                      {t.settings.productivity.defaultSort}
                    </label>
                    <select
                      value={prefs.defaultTaskSort || 'newest'}
                      onChange={(e) =>
                        updateUserPreferences({
                          defaultTaskSort: e.target.value as DefaultTaskSortOption,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="due_date">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="alphabetical">Alphabetical (A–Z)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                      {t.settings.productivity.startOfDay}
                    </label>
                    <input
                      type="time"
                      value={prefs.startOfDay || '08:00'}
                      onChange={(e) => updateUserPreferences({ startOfDay: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-mono"
                    />
                  </div>
                </div>
              </BaseCard>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 6: CALENDAR PREFERENCES                                   */}
          {/* ================================================================= */}
          {activeSection === 'calendar' && (
            <BaseCard>
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                {t.settings.calendar.title}
              </h3>
              <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5 mb-5">
                {t.settings.calendar.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-5">
                <div>
                  <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                    {t.settings.calendar.defaultView}
                  </label>
                  <select
                    value={prefs.calendarDefaultView || 'month'}
                    onChange={(e) =>
                      updateUserPreferences({
                        calendarDefaultView: e.target.value as DefaultCalendarViewOption,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                  >
                    <option value="month">{t.calendar.month}</option>
                    <option value="week">{t.calendar.week}</option>
                    <option value="day">{t.calendar.day}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                    {t.settings.calendar.firstDayOfWeek}
                  </label>
                  <select
                    value={prefs.startOfWeek}
                    onChange={(e) =>
                      updateUserPreferences({
                        startOfWeek: e.target.value as StartOfWeekOption,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                  >
                    <option value="monday">{t.settings.languageRegion.monday}</option>
                    <option value="sunday">{t.settings.languageRegion.sunday}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                    {t.settings.calendar.defaultReminder}
                  </label>
                  <select
                    value={prefs.defaultScheduleReminder || '15m'}
                    onChange={(e) =>
                      updateUserPreferences({
                        defaultScheduleReminder: e.target
                          .value as DefaultScheduleReminderOption,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-semibold cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="at_time">At event time</option>
                    <option value="5m">5 minutes before</option>
                    <option value="15m">15 minutes before</option>
                    <option value="30m">30 minutes before</option>
                    <option value="1h">1 hour before</option>
                    <option value="1d">1 day before</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                    {t.settings.calendar.defaultDuration} ({t.settings.calendar.minutesUnit})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      value={eventDurationInput}
                      onChange={(e) => setEventDurationInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] font-mono"
                    />
                    <SecondaryButton size="sm" onClick={handleSaveEventDuration}>
                      {t.common.save}
                    </SecondaryButton>
                  </div>
                  {calendarDurationError && (
                    <p className="text-[11px] text-[#E07A5F] mt-1">{calendarDurationError}</p>
                  )}
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="space-y-2.5 pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838] text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                  <div className="pr-3">
                    <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {t.settings.calendar.showScheduleEvents}
                    </p>
                    <p className="text-[11px] text-[#898493]">
                      {t.settings.calendar.showScheduleEventsDesc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={prefs.showScheduleEventsInCalendar !== false}
                    onChange={(val) =>
                      updateUserPreferences({ showScheduleEventsInCalendar: val })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                  <div className="pr-3">
                    <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {t.settings.calendar.showTaskDeadlines}
                    </p>
                    <p className="text-[11px] text-[#898493]">
                      {t.settings.calendar.showTaskDeadlinesDesc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={prefs.showTaskDeadlinesInCalendar !== false}
                    onChange={(val) =>
                      updateUserPreferences({ showTaskDeadlinesInCalendar: val })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                  <div className="pr-3">
                    <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {t.settings.calendar.showCompletedTasks}
                    </p>
                    <p className="text-[11px] text-[#898493]">
                      {t.settings.calendar.showCompletedTasksDesc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={prefs.showCompletedTasksInCalendar !== false}
                    onChange={(val) =>
                      updateUserPreferences({ showCompletedTasksInCalendar: val })
                    }
                  />
                </div>
              </div>
            </BaseCard>
          )}

          {/* ================================================================= */}
          {/* SECTION 7: FOCUS PREFERENCES                                      */}
          {/* ================================================================= */}
          {activeSection === 'focus' && (
            <BaseCard>
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                {t.settings.focus.title}
              </h3>
              <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5 mb-4">
                {t.settings.focus.desc}
              </p>

              {timerState.isRunning && (
                <div className="p-3.5 rounded-2xl bg-[#F4F1FA] dark:bg-[#2C253B] border border-[#A995D8]/40 text-xs text-[#593F94] dark:text-[#D9CCFA] flex items-center gap-2.5 mb-4">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{t.settings.focus.runningSessionNote}</span>
                </div>
              )}

              {focusValidationError && (
                <div className="p-3 rounded-xl bg-[#FCF3F0] dark:bg-[#342020] border border-[#E07A5F] text-xs text-[#E07A5F] mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{focusValidationError}</span>
                </div>
              )}

              <form onSubmit={handleSaveFocusDurations} className="space-y-4 mb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                      {t.settings.focus.focusDuration} ({t.settings.focus.minutesUnit})
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={focusMinsInput}
                      onChange={(e) => setFocusMinsInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] font-mono text-[#34313D] dark:text-[#F4F2F7]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                      {t.settings.focus.shortBreakDuration} ({t.settings.focus.minutesUnit})
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={shortBreakInput}
                      onChange={(e) => setShortBreakInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] font-mono text-[#34313D] dark:text-[#F4F2F7]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                      {t.settings.focus.longBreakDuration} ({t.settings.focus.minutesUnit})
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={longBreakInput}
                      onChange={(e) => setLongBreakInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] font-mono text-[#34313D] dark:text-[#F4F2F7]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5">
                      {t.settings.focus.longBreakInterval} ({t.settings.focus.sessionsUnit})
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={longBreakIntervalInput}
                      onChange={(e) => setLongBreakIntervalInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] font-mono text-[#34313D] dark:text-[#F4F2F7]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <PrimaryButton type="submit" size="sm">
                    {t.common.save}
                  </PrimaryButton>
                </div>
              </form>

              <div className="space-y-2.5 pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838] text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                  <div className="pr-3">
                    <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {t.settings.focus.autoStartBreak}
                    </p>
                    <p className="text-[11px] text-[#898493]">
                      {t.settings.focus.autoStartBreakDesc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={!!prefs.autoStartBreaks}
                    onChange={(val) => updateUserPreferences({ autoStartBreaks: val })}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                  <div className="pr-3">
                    <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {t.settings.focus.autoStartFocus}
                    </p>
                    <p className="text-[11px] text-[#898493]">
                      {t.settings.focus.autoStartFocusDesc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={!!prefs.autoStartFocus}
                    onChange={(val) => updateUserPreferences({ autoStartFocus: val })}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                  <div className="pr-3">
                    <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {t.settings.focus.timerSound}
                    </p>
                    <p className="text-[11px] text-[#898493]">
                      {t.settings.focus.timerSoundDesc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={prefs.timerSoundEnabled !== false}
                    onChange={(val) => updateUserPreferences({ timerSoundEnabled: val })}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                  <div className="pr-3">
                    <p className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {t.settings.focus.timerHaptics}
                    </p>
                    <p className="text-[11px] text-[#898493]">
                      {isVibrationSupported
                        ? t.settings.focus.timerHapticsDesc
                        : t.settings.notifications.vibrationUnsupported}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={isVibrationSupported && prefs.timerHapticsEnabled !== false}
                    disabled={!isVibrationSupported}
                    onChange={(val) => updateUserPreferences({ timerHapticsEnabled: val })}
                  />
                </div>
              </div>
            </BaseCard>
          )}

          {/* ================================================================= */}
          {/* SECTION 8: DATA & PRIVACY                                         */}
          {/* ================================================================= */}
          {activeSection === 'dataPrivacy' && (
            <div className="space-y-5">
              <BaseCard>
                <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.settings.dataPrivacy.title}
                </h3>
                <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5 mb-5">
                  {t.settings.dataPrivacy.desc}
                </p>

                {dataNotice && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs mb-4 ${
                      dataNotice.type === 'success'
                        ? 'bg-[#F2F8F5] dark:bg-[#1C3127] border-[#B5DCCB] text-[#28634B] dark:text-[#B5DCCB]'
                        : 'bg-[#FCF3F0] dark:bg-[#342020] border-[#E07A5F] text-[#E07A5F]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{dataNotice.text}</span>
                  </div>
                )}

                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A995D8] mb-3">
                  {t.settings.dataPrivacy.storedSummary}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs mb-5">
                  <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <span className="text-[#898493]">{t.nav.tasks}</span>
                    <p className="text-base font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-0.5">
                      {tasks.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <span className="text-[#898493]">{t.nav.calendar}</span>
                    <p className="text-base font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-0.5">
                      {schedules.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <span className="text-[#898493]">{t.nav.notes}</span>
                    <p className="text-base font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-0.5">
                      {notes.length + trashNotes.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <span className="text-[#898493]">{t.nav.focus}</span>
                    <p className="text-base font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-0.5">
                      {focusSessions.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <span className="text-[#898493]">{t.nav.notifications}</span>
                    <p className="text-base font-mono font-bold text-[#34313D] dark:text-[#F4F2F7] mt-0.5">
                      {notifications.length}
                    </p>
                  </div>
                </div>

                {/* Sync Metadata */}
                <div className="space-y-2 text-xs mb-5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <span className="text-[#898493]">{t.settings.dataPrivacy.syncStatusLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize text-[#34313D] dark:text-[#F4F2F7]">
                        {syncState.isOnline ? syncState.syncStatus : t.common.offline}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerManualSync();
                          if (hasPendingPrefSync) retrySyncPreferences();
                        }}
                        className="text-[#A995D8] font-semibold hover:underline cursor-pointer"
                      >
                        {t.settings.dataPrivacy.syncNow}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <span className="text-[#898493]">{t.settings.dataPrivacy.pendingSyncLabel}</span>
                    <span className="font-mono font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {hasPendingPrefSync ? 'Yes (queued)' : '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                    <span className="text-[#898493]">{t.settings.dataPrivacy.lastSyncedLabel}</span>
                    <span className="font-mono text-[#34313D] dark:text-[#F4F2F7]">
                      {syncState.lastSyncedAt || '—'}
                    </span>
                  </div>
                </div>

                {/* Actions: Export / Import / Clear Cache / Reset */}
                <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838]">
                  <OutlinedButton
                    size="sm"
                    icon={Download}
                    onClick={handleExportPersonalData}
                  >
                    {t.settings.dataPrivacy.exportData}
                  </OutlinedButton>

                  <OutlinedButton
                    size="sm"
                    icon={Upload}
                    onClick={() => backupInputRef.current?.click()}
                  >
                    {t.settings.dataPrivacy.importBackup}
                  </OutlinedButton>
                  <input
                    ref={backupInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportBackupFile}
                    className="hidden"
                  />

                  <SecondaryButton
                    size="sm"
                    icon={Trash2}
                    onClick={() => setIsClearCacheOpen(true)}
                  >
                    {t.settings.dataPrivacy.clearCache}
                  </SecondaryButton>

                  <SecondaryButton
                    size="sm"
                    icon={RotateCcw}
                    onClick={() => setIsResetDbOpen(true)}
                    className="ml-auto text-[#E07A5F] hover:bg-[#FCF3F0] dark:hover:bg-[#342020]"
                  >
                    {t.settings.dataPrivacy.resetDatabase}
                  </SecondaryButton>
                </div>
                <p className="text-[11px] text-[#898493] mt-3">
                  {t.settings.dataPrivacy.clearCacheDesc}
                </p>
              </BaseCard>

              {/* Privacy Transparency Card */}
              <BaseCard>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-[#B5DCCB]" />
                  <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                    {t.settings.dataPrivacy.privacyTitle}
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-[#898493] dark:text-[#9E99A8] list-disc pl-5">
                  {t.settings.dataPrivacy.privacyBullets.map((bullet, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </BaseCard>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 9: ABOUT FLOWDAY                                          */}
          {/* ================================================================= */}
          {activeSection === 'about' && (
            <div className="space-y-5">
              <BaseCard>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-5 mb-5 border-b border-[#EEEAF2] dark:border-[#2D2838]">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#A995D8] via-[#F1B8CC] to-[#A9C8E8] flex items-center justify-center text-white font-extrabold text-xl shadow-sm shrink-0">
                    F
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
                      {APP_INFO.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#A995D8]">
                      {APP_INFO.tagline}
                    </p>
                    <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-1 leading-relaxed">
                      {APP_INFO.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
                  <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between">
                    <span className="text-[#898493]">{t.settings.about.version}</span>
                    <span className="font-mono font-bold text-[#34313D] dark:text-[#F4F2F7]">
                      v{APP_INFO.version}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between">
                    <span className="text-[#898493]">{t.settings.about.buildNumber}</span>
                    <span className="font-mono font-bold text-[#34313D] dark:text-[#F4F2F7]">
                      {APP_INFO.buildNumber}
                    </span>
                  </div>
                </div>

                {/* Policies & Legal (explicitly honest when URLs are not configured) */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A995D8] mb-2.5">
                  {t.settings.about.legalTitle}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
                  <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {t.settings.about.privacyPolicy}
                    </span>
                    <span className="text-[11px] text-[#898493] italic">
                      {APP_INFO.privacyPolicyUrl || t.settings.about.notConfigured}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                      {t.settings.about.termsOfService}
                    </span>
                    <span className="text-[11px] text-[#898493] italic">
                      {APP_INFO.termsOfServiceUrl || t.settings.about.notConfigured}
                    </span>
                  </div>
                </div>

                {/* Open Source Licenses */}
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#A995D8] mb-2.5">
                  {t.settings.about.openSourceTitle}
                </h4>
                <div className="space-y-2 text-xs">
                  {APP_INFO.openSourceLicenses.map((lib) => (
                    <div
                      key={lib.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]"
                    >
                      <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">
                        {lib.name}{' '}
                        <span className="font-mono text-[11px] text-[#898493]">
                          v{lib.version}
                        </span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] font-mono text-[10px] text-[#898493]">
                        {lib.license}
                      </span>
                    </div>
                  ))}
                </div>
              </BaseCard>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODALS & CONFIRMATION DIALOGS                                         */}
      {/* ===================================================================== */}

      {/* Re-authentication Modal for sensitive Firebase operations */}
      {reauthAction !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34313D]/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#A995D8]" />
                <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  {t.settings.account.securityTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReauthAction(null);
                  setReauthPassword('');
                  setReauthError(null);
                }}
                className="text-[#898493] hover:text-[#34313D] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4 leading-relaxed">
              {t.settings.account.reauthPrompt}
            </p>

            {reauthError && (
              <div className="p-2.5 rounded-xl bg-[#FCF3F0] dark:bg-[#342020] border border-[#E07A5F] text-xs text-[#E07A5F] mb-3">
                {reauthError}
              </div>
            )}

            <form onSubmit={handleConfirmReauth} className="space-y-4">
              {!(hasGoogleProvider && !hasPasswordProvider) && (
                <input
                  type="password"
                  required
                  autoFocus
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder={t.settings.account.currentPassword}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] focus:outline-none focus:border-[#A995D8]"
                />
              )}

              <div className="flex items-center justify-end gap-2">
                <SecondaryButton
                  type="button"
                  size="sm"
                  onClick={() => {
                    setReauthAction(null);
                    setReauthPassword('');
                    setReauthError(null);
                  }}
                >
                  {t.common.cancel}
                </SecondaryButton>
                <PrimaryButton type="submit" size="sm" isLoading={isReauthenticating}>
                  {t.common.confirm}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Local Cache Confirmation */}
      <ConfirmationDialog
        isOpen={isClearCacheOpen}
        title={t.settings.dataPrivacy.clearCacheConfirmTitle}
        message={t.settings.dataPrivacy.clearCacheConfirmMsg}
        confirmLabel={t.settings.dataPrivacy.clearCache}
        cancelLabel={t.common.cancel}
        onConfirm={handleConfirmClearCache}
        onCancel={() => setIsClearCacheOpen(false)}
      />

      {/* Reset Local Database Confirmation */}
      <ConfirmationDialog
        isOpen={isResetDbOpen}
        title={t.settings.dataPrivacy.resetConfirmTitle}
        message={t.settings.dataPrivacy.resetConfirmMsg}
        confirmLabel={t.settings.dataPrivacy.resetDatabase}
        cancelLabel={t.common.cancel}
        isDestructive
        onConfirm={() => {
          resetDatabase();
          setIsResetDbOpen(false);
        }}
        onCancel={() => setIsResetDbOpen(false)}
      />

      {/* Delete Account Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteAccountOpen}
        title={t.settings.account.deleteConfirmTitle}
        message={t.settings.account.deleteConfirmMsg}
        confirmLabel={
          isDeletingAccount ? t.common.saving : t.settings.account.deleteAccount
        }
        cancelLabel={t.common.cancel}
        isDestructive
        onConfirm={executeDeleteAccount}
        onCancel={() => setIsDeleteAccountOpen(false)}
      />
    </div>
  );
};
