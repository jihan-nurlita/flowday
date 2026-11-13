import {
  setActiveDateFormattingConfig,
  formatReadableDate,
  formatFullDate,
  formatTime,
  getWeekDays,
} from '../date';
import { getMonthMatrix } from '../calendar';
import { TRANSLATIONS } from '../../i18n/translations';
import { mergePreferencesByTimestamp } from '../../../data/services/auth_service';

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected "${String(expected)}", got "${String(actual)}"`);
  }
}

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function collectKeyPaths(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    const val = obj[k];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys.push(...collectKeyPaths(val, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

async function runTests() {
  let passed = 0;
  const test = async (name: string, fn: () => void | Promise<void>) => {
    await fn();
    passed += 1;
    console.log(`PASS: ${name}`);
  };

  await test('Date & time formatting respects global language, dateFormat, and timeFormat without mutating data', () => {
    setActiveDateFormattingConfig({
      language: 'en',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: '12h',
      startOfWeek: 'monday',
    });

    assertEqual(formatReadableDate('2026-11-12'), '12/11/2026', 'dd/MM/yyyy format');
    assertEqual(
      formatReadableDate('2026-11-12', { dateFormat: 'MM/dd/yyyy' }),
      '11/12/2026',
      'MM/dd/yyyy override'
    );
    assertEqual(
      formatReadableDate('2026-11-12', { dateFormat: 'yyyy-MM-dd' }),
      '2026-11-12',
      'ISO yyyy-MM-dd override'
    );
    assertEqual(formatTime('14:30'), '2:30 PM', '12h formatting');
    assertEqual(formatTime('14:30', '24h'), '14:30', '24h formatting');

    const idFull = formatFullDate('2026-11-12', 'id');
    assertTrue(idFull.includes('2026'), 'Indonesian full date includes year');
  });

  await test('Week & month calendar grids respect Monday vs Sunday startOfWeek', () => {
    const anchor = new Date(2026, 10, 12); // Thu Nov 12, 2026
    const monWeek = getWeekDays(anchor, 'monday');
    const sunWeek = getWeekDays(anchor, 'sunday');

    assertEqual(monWeek[0].getDay(), 1, 'Monday week starts on Monday (1)');
    assertEqual(monWeek[6].getDay(), 0, 'Monday week ends on Sunday (0)');
    assertEqual(sunWeek[0].getDay(), 0, 'Sunday week starts on Sunday (0)');
    assertEqual(sunWeek[6].getDay(), 6, 'Sunday week ends on Saturday (6)');

    const novMon = getMonthMatrix(2026, 10, 'monday');
    const novSun = getMonthMatrix(2026, 10, 'sunday');
    assertEqual(novMon[0][0].date.getDay(), 1, 'Month matrix starts on Monday');
    assertEqual(novSun[0][0].date.getDay(), 0, 'Month matrix starts on Sunday');
  });

  await test('Conflict-safe preference timestamp resolution preserves newer changes', () => {
    const localNewer = mergePreferencesByTimestamp(
      {
        themeMode: 'light',
        language: 'en',
        updatedAt: '2026-11-12T10:00:00.000Z',
      },
      {
        themeMode: 'dark',
        language: 'id',
        updatedAt: '2026-11-12T10:05:00.000Z',
      }
    );
    assertEqual(localNewer.merged.themeMode, 'dark', 'Local newer wins theme');
    assertEqual(localNewer.merged.language, 'id', 'Local newer wins language');
    assertEqual(localNewer.shouldPushLocalToCloud, true, 'Should push newer local to cloud');

    const cloudNewer = mergePreferencesByTimestamp(
      {
        themeMode: 'light',
        pomodoroDurationMinutes: 45,
        updatedAt: '2026-11-12T11:00:00.000Z',
      },
      {
        themeMode: 'dark',
        pomodoroDurationMinutes: 25,
        updatedAt: '2026-11-12T10:05:00.000Z',
      }
    );
    assertEqual(cloudNewer.merged.themeMode, 'light', 'Cloud newer wins theme');
    assertEqual(cloudNewer.merged.pomodoroDurationMinutes, 45, 'Cloud newer wins duration');
    assertEqual(cloudNewer.shouldPushLocalToCloud, false, 'Should not push stale local');
  });

  await test('English and Indonesian translation dictionaries have full key parity', () => {
    const enKeys = collectKeyPaths(TRANSLATIONS.en);
    const idKeys = collectKeyPaths(TRANSLATIONS.id);
    assertEqual(enKeys.length, idKeys.length, 'Translation key count parity');
    for (let i = 0; i < enKeys.length; i++) {
      assertEqual(idKeys[i], enKeys[i], `Key parity mismatch at ${enKeys[i]}`);
    }
  });

  await test('clearLocalCache removes only flowday_cache_* and preserves DB & pending sync', async () => {
    if (typeof (globalThis as any).localStorage === 'undefined') {
      (globalThis as any).localStorage = createMemoryStorage();
    }
    const ls: Storage = (globalThis as any).localStorage;
    ls.clear();

    const { storageEngine } = await import('../../../data/datasources/storage_engine');
    ls.setItem('flowday_cache_ui_filter', 'stale_filter');
    ls.setItem('flowday_cache_temp_search', 'hello');
    ls.setItem('flowday_prefs_usr_1', JSON.stringify({ themeMode: 'dark' }));
    ls.setItem('flowday_prefs_pending_usr_1', 'true');

    const beforeTasks = ls.getItem('flowday_db_tasks');
    assertTrue(beforeTasks !== null, 'Primary DB tasks key initialized');

    const { clearedKeys } = storageEngine.clearLocalCache();
    assertEqual(clearedKeys, 2, 'Cleared exactly 2 cache keys');
    assertEqual(ls.getItem('flowday_cache_ui_filter'), null, 'Cache key 1 removed');
    assertEqual(ls.getItem('flowday_cache_temp_search'), null, 'Cache key 2 removed');
    assertTrue(ls.getItem('flowday_db_tasks') !== null, 'Primary DB tasks preserved');
    assertTrue(ls.getItem('flowday_prefs_usr_1') !== null, 'User preferences preserved');
    assertEqual(ls.getItem('flowday_prefs_pending_usr_1'), 'true', 'Pending sync flag preserved');

    const exported = JSON.parse(
      storageEngine.exportPersonalData({
        uid: 'usr_flowday_default',
        fullName: 'Test User',
        email: 'test@flowday.app',
        createdAt: '2026-11-12T00:00:00.000Z',
        updatedAt: '2026-11-12T00:00:00.000Z',
        preferences: {
          themeMode: 'light',
          language: 'en',
          timeFormat: '24h',
          startOfWeek: 'monday',
          notificationEnabled: true,
        },
      })
    );
    assertEqual(exported.app, 'FlowDay', 'Export metadata present');
    assertEqual(exported.scope.uid, 'usr_flowday_default', 'Export scoped to uid');
    assertTrue(Array.isArray(exported.data.tasks), 'Export includes tasks array');
    assertTrue(!('password' in (exported.profile || {})), 'Export excludes password');
  });

  console.log(`\nAll ${passed} Part 11 settings & preferences tests passed.`);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
