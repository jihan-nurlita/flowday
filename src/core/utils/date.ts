import {
  AppLanguageCode,
  DateFormatOption,
  StartOfWeekOption,
  TimeFormatOption,
} from '../../domain/entities/user';

/**
 * Date and time helper utilities
 * Respects user preferences (language, dateFormat, timeFormat, startOfWeek) globally
 * without ever mutating historical stored timestamps.
 */

interface DateFormattingConfig {
  language: AppLanguageCode;
  dateFormat: DateFormatOption;
  timeFormat: TimeFormatOption;
  startOfWeek: StartOfWeekOption;
}

let activeConfig: DateFormattingConfig = {
  language: 'en',
  dateFormat: 'MMM d, yyyy',
  timeFormat: '24h',
  startOfWeek: 'monday',
};

export function setActiveDateFormattingConfig(partial: Partial<DateFormattingConfig>): void {
  activeConfig = {
    ...activeConfig,
    ...partial,
  };
}

export function getActiveDateFormattingConfig(): DateFormattingConfig {
  return activeConfig;
}

function getLocaleTag(language: AppLanguageCode = activeConfig.language): string {
  return language === 'id' ? 'id-ID' : 'en-US';
}

function parseDateSafe(dateInput: string | Date | undefined): Date | null {
  if (!dateInput) return null;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return isNaN(dateInput.getTime()) ? null : dateInput;
}

export function formatReadableDate(
  dateInput: string | Date | undefined,
  options?: AppLanguageCode | Partial<Pick<DateFormattingConfig, 'language' | 'dateFormat'>>
): string {
  const date = parseDateSafe(dateInput);
  if (!date) return '';

  const resolvedOpts =
    typeof options === 'string' ? { language: options } : options;
  const lang = resolvedOpts?.language || activeConfig.language;
  const fmt = resolvedOpts?.dateFormat || activeConfig.dateFormat;

  const year = date.getFullYear();
  const monthNum = String(date.getMonth() + 1).padStart(2, '0');
  const dayNum = String(date.getDate()).padStart(2, '0');

  if (fmt === 'dd/MM/yyyy') {
    return `${dayNum}/${monthNum}/${year}`;
  }
  if (fmt === 'MM/dd/yyyy') {
    return `${monthNum}/${dayNum}/${year}`;
  }
  if (fmt === 'yyyy-MM-dd') {
    return `${year}-${monthNum}-${dayNum}`;
  }

  return new Intl.DateTimeFormat(getLocaleTag(lang), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatFullDate(
  dateInput: string | Date | undefined,
  language: AppLanguageCode = activeConfig.language
): string {
  const date = parseDateSafe(dateInput);
  if (!date) return '';

  return new Intl.DateTimeFormat(getLocaleTag(language), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatMonthYear(
  date: Date,
  language: AppLanguageCode = activeConfig.language
): string {
  return new Intl.DateTimeFormat(getLocaleTag(language), {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatTime(
  timeStr?: string,
  timeFormat: TimeFormatOption = activeConfig.timeFormat
): string {
  if (!timeStr) return '';
  if (timeStr.includes(':')) {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const minute = m ? m.slice(0, 2).padStart(2, '0') : '00';
    if (isNaN(hour)) return timeStr;

    if (timeFormat === '24h') {
      return `${String(hour).padStart(2, '0')}:${minute}`;
    }

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  }
  return timeStr;
}

export function isToday(dateInput: string | Date | undefined): boolean {
  const date = parseDateSafe(dateInput);
  if (!date) return false;

  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isPast(dateInput: string | Date | undefined): boolean {
  const date = parseDateSafe(dateInput);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return target.getTime() < today.getTime();
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekDays(
  anchorDate: Date = new Date(),
  startOfWeek: StartOfWeekOption = activeConfig.startOfWeek
): Date[] {
  const current = new Date(anchorDate);
  const day = current.getDay(); // 0 = Sunday ... 6 = Saturday
  const diff =
    startOfWeek === 'sunday'
      ? current.getDate() - day
      : current.getDate() - day + (day === 0 ? -6 : 1);
  const firstDay = new Date(current.setDate(diff));

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(firstDay);
    nextDay.setDate(firstDay.getDate() + i);
    week.push(nextDay);
  }
  return week;
}

export function formatSecondsToMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatRelativeTime(
  dateInput: string | Date | undefined,
  language: AppLanguageCode = activeConfig.language
): string {
  const date = parseDateSafe(dateInput);
  if (!date) return '';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (language === 'id') {
    if (diffSec < 60) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}j lalu`;
    if (diffSec < 172800) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
  }

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
