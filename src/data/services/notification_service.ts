/**
 * FlowDay Notification & Reminder Service
 * Centralized service managing platform notification capabilities, Web Audio synthesized chimes,
 * browser notifications, Quiet Hours evaluation, and automatic reminder scheduling.
 */

import { AppNotification, NotificationType, RelatedEntityType } from '../../domain/entities/notification';
import { UserPreferences } from '../../domain/entities/user';
import { Task } from '../../domain/entities/task';
import { Schedule } from '../../domain/entities/schedule';
import { getTodayDateString } from '../../core/utils/date';
import { expandSchedulesForDate } from '../../core/utils/calendar';

export type PlatformPermission = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private notifiedKeys = new Set<string>();

  /**
   * Check if the browser or platform supports the Notification API
   */
  public isNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Check if Web Audio API is supported for custom calm chimes
   */
  public isAudioSupported(): boolean {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  }

  /**
   * Check if vibration API is supported on device (e.g., mobile web)
   */
  public isVibrationSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /**
   * Get current platform permission state
   */
  public getPermissionStatus(): PlatformPermission {
    if (!this.isNotificationSupported()) {
      return 'unsupported';
    }
    return Notification.permission as PlatformPermission;
  }

  /**
   * Request browser permission for system notifications
   */
  public async requestPermission(): Promise<PlatformPermission> {
    if (!this.isNotificationSupported()) {
      return 'unsupported';
    }
    try {
      const res = await Notification.requestPermission();
      return res as PlatformPermission;
    } catch {
      return 'denied';
    }
  }

  /**
   * Play a gentle, soothing synthesized harmonic chime (Pure Web Audio API)
   * Avoids external audio file downloads and respects soft pastel sound philosophy.
   */
  public playGentleChime(): void {
    if (!this.isAudioSupported()) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1: 528 Hz (Calm Solfeggio / Transformation Tone)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.85);

      // Note 2: 792 Hz (Soft high harmonic bell, starting at +0.12s)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(792, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 1.25);
    } catch {
      // Audio autoplay policy might block before user interaction; ignore silently
    }
  }

  /**
   * Trigger subtle haptic vibration if supported
   */
  public triggerVibration(pattern: number | number[] = [100, 50, 100]): void {
    if (this.isVibrationSupported()) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore failure
      }
    }
  }

  /**
   * Check if current time is within user's Quiet Hours
   */
  public isQuietHours(preferences?: UserPreferences, now: Date = new Date()): boolean {
    if (!preferences || !preferences.quietHoursEnabled) return false;

    const startStr = preferences.quietHoursStart || '22:00';
    const endStr = preferences.quietHoursEnd || '07:00';

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Same day quiet hours (e.g. 13:00 to 15:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight quiet hours (e.g. 22:00 to 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * Present a system / browser desktop notification if permissions allow
   */
  public showSystemNotification(
    title: string,
    options?: {
      body?: string;
      tag?: string;
      onClick?: () => void;
    }
  ): void {
    if (!this.isNotificationSupported() || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notif = new Notification(title, {
        body: options?.body,
        icon: '/favicon.ico',
        tag: options?.tag,
        badge: '/favicon.ico',
      });

      if (options?.onClick) {
        notif.onclick = () => {
          window.focus();
          options.onClick?.();
          notif.close();
        };
      }
    } catch {
      // In some iframe / restricted environments, Notification constructor may throw
    }
  }

  /**
   * Dispatches a full notification through the appropriate pipeline:
   * 1. Checks Master Notification Toggle
   * 2. Checks Quiet Hours for suppressing audio & system popups
   * 3. Plays gentle chime and triggers vibration if allowed
   * 4. Spawns browser notification if granted
   */
  public dispatchNotification(params: {
    title: string;
    message: string;
    type: NotificationType;
    preferences?: UserPreferences;
    relatedId?: string;
    onTap?: () => void;
  }): void {
    const { title, message, preferences, onTap } = params;

    // Check master enabled preference
    if (preferences && preferences.notificationEnabled === false) {
      return;
    }

    const inQuietHours = this.isQuietHours(preferences);

    // Audio & vibration (suppressed during quiet hours or if disabled)
    if (!inQuietHours) {
      if (preferences?.soundEnabled !== false) {
        this.playGentleChime();
      }
      if (preferences?.vibrationEnabled !== false) {
        this.triggerVibration();
      }
      // System popup
      this.showSystemNotification(title, {
        body: message,
        onClick: onTap,
      });
    }
  }

  /**
   * Core reminder scheduler evaluating tasks, schedules, and daily summary
   * Runs periodically (e.g. every 15-30s) to discover real due items.
   */
  public evaluateReminders(context: {
    userId: string;
    tasks: Task[];
    schedules: Schedule[];
    existingNotifications: AppNotification[];
    preferences?: UserPreferences;
    onNotify: (notif: {
      userId: string;
      title: string;
      message: string;
      type: NotificationType;
      relatedId?: string;
      relatedEntityId?: string;
      relatedEntityType?: RelatedEntityType;
      isRead: boolean;
      status: 'delivered';
    }) => void;
    onShowToast?: (message: string, type?: 'info' | 'success') => void;
  }): void {
    const { userId, tasks, schedules, existingNotifications, preferences, onNotify, onShowToast } = context;

    if (preferences && preferences.notificationEnabled === false) {
      return;
    }

    const todayStr = getTodayDateString();
    const now = new Date();
    const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // Populate notified keys from existing notifications to avoid duplicate records across reloads
    existingNotifications.forEach((n) => {
      if (n.relatedId) {
        this.notifiedKeys.add(`${n.type}_${n.relatedId}_${n.title}`);
      }
      if (n.type === 'review' && n.createdAt.startsWith(todayStr)) {
        this.notifiedKeys.add(`daily_summary_${todayStr}`);
      }
    });

    // 1. Task Reminders (if enabled)
    if (preferences?.taskRemindersEnabled !== false) {
      tasks.forEach((task) => {
        if (task.isCompleted) return;

        // A. Approaching Deadline (e.g. task due today with an end time)
        if (task.dueDate === todayStr && task.endTime) {
          const [endH, endM] = task.endTime.split(':').map(Number);
          const taskEndTotalMinutes = endH * 60 + endM;
          const diffMinutes = taskEndTotalMinutes - currentTotalMinutes;

          // 15 minutes before deadline warning
          if (diffMinutes > 0 && diffMinutes <= 15) {
            const key = `task_upcoming_${task.id}_${todayStr}`;
            if (!this.notifiedKeys.has(key)) {
              this.notifiedKeys.add(key);
              const title = `Task Deadline in ${diffMinutes}m`;
              const msg = `"${task.title}" is due soon at ${task.endTime}.`;
              onNotify({
                userId,
                title,
                message: msg,
                type: 'task',
                relatedId: task.id,
                relatedEntityId: task.id,
                relatedEntityType: 'task',
                isRead: false,
                status: 'delivered',
              });
              this.dispatchNotification({
                title,
                message: msg,
                type: 'task',
                preferences,
                relatedId: task.id,
              });
              onShowToast?.(title, 'info');
            }
          }

          // At deadline / Overdue reminder
          if (diffMinutes <= 0 && diffMinutes >= -30) {
            const key = `task_due_${task.id}_${todayStr}`;
            if (!this.notifiedKeys.has(key)) {
              this.notifiedKeys.add(key);
              const title = 'Task Due Now';
              const msg = `"${task.title}" reached its scheduled deadline (${task.endTime}).`;
              onNotify({
                userId,
                title,
                message: msg,
                type: 'task',
                relatedId: task.id,
                relatedEntityId: task.id,
                relatedEntityType: 'task',
                isRead: false,
                status: 'delivered',
              });
              this.dispatchNotification({
                title,
                message: msg,
                type: 'task',
                preferences,
                relatedId: task.id,
              });
            }
          }
        }
      });
    }

    // 2. Schedule Reminders (if enabled)
    if (preferences?.scheduleRemindersEnabled !== false) {
      const todayOccurrences = expandSchedulesForDate(schedules, todayStr);

      todayOccurrences.forEach((occ) => {
        const { schedule } = occ;
        if (schedule.isAllDay || !schedule.startTime) return;

        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const schedStartMinutes = startH * 60 + startM;
        const diffMinutes = schedStartMinutes - currentTotalMinutes;

        // Determine reminder preset offset (default 15 minutes before, or at start time)
        const reminderMinutesBefore = 15;

        // Reminder 15 minutes before
        if (diffMinutes > 0 && diffMinutes <= reminderMinutesBefore) {
          const key = `sched_upcoming_${schedule.id}_${todayStr}_${reminderMinutesBefore}`;
          if (!this.notifiedKeys.has(key)) {
            this.notifiedKeys.add(key);
            const title = `Event in ${diffMinutes}m`;
            const msg = `"${schedule.title}" starts at ${schedule.startTime}${schedule.location ? ` at ${schedule.location}` : ''}.`;
            onNotify({
              userId,
              title,
              message: msg,
              type: 'schedule',
              relatedId: schedule.id,
              relatedEntityId: schedule.id,
              relatedEntityType: 'schedule',
              isRead: false,
              status: 'delivered',
            });
            this.dispatchNotification({
              title,
              message: msg,
              type: 'schedule',
              preferences,
              relatedId: schedule.id,
            });
            onShowToast?.(title, 'info');
          }
        }

        // At event start time
        if (diffMinutes <= 0 && diffMinutes >= -15) {
          const key = `sched_started_${schedule.id}_${todayStr}`;
          if (!this.notifiedKeys.has(key)) {
            this.notifiedKeys.add(key);
            const title = 'Event Starting Now';
            const msg = `"${schedule.title}" is scheduled to begin now (${schedule.startTime}).`;
            onNotify({
              userId,
              title,
              message: msg,
              type: 'schedule',
              relatedId: schedule.id,
              relatedEntityId: schedule.id,
              relatedEntityType: 'schedule',
              isRead: false,
              status: 'delivered',
            });
            this.dispatchNotification({
              title,
              message: msg,
              type: 'schedule',
              preferences,
              relatedId: schedule.id,
            });
          }
        }
      });
    }

    // 3. Daily Summary (if enabled)
    if (preferences?.dailySummaryEnabled) {
      const summaryTime = preferences.dailySummaryTime || '08:00';
      const summaryKey = `daily_summary_${todayStr}`;

      if (currentHM >= summaryTime && !this.notifiedKeys.has(summaryKey)) {
        this.notifiedKeys.add(summaryKey);

        const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
        const todaySchedules = expandSchedulesForDate(schedules, todayStr);

        const title = 'Your Daily Flow Summary';
        const msg = `Good day! You have ${todayTasks.length} task${todayTasks.length === 1 ? '' : 's'} and ${todaySchedules.length} scheduled event${todaySchedules.length === 1 ? '' : 's'} planned for today.`;

        onNotify({
          userId,
          title,
          message: msg,
          type: 'review',
          relatedEntityType: 'system',
          isRead: false,
          status: 'delivered',
        });
        this.dispatchNotification({
          title,
          message: msg,
          type: 'review',
          preferences,
        });
        onShowToast?.('Daily summary is ready in Notification Center', 'info');
      }
    }
  }

  /**
   * Reset internal key tracker (useful on logout or test reset)
   */
  public resetTracker(): void {
    this.notifiedKeys.clear();
  }
}

export const notificationService = new NotificationService();
