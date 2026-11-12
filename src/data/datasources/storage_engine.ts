/**
 * FlowDay Storage Engine
 * High-performance, offline-first client database engine
 * Uses localStorage / IndexedDB abstraction with cross-component event bus
 */

import { generateId } from '../../core/utils/id';
import { CATEGORY_PALETTE } from '../../core/constants/theme';
import { DEFAULT_USER } from '../../core/constants/defaults';
import { Category } from '../../domain/entities/category';
import { Task } from '../../domain/entities/task';
import { Schedule } from '../../domain/entities/schedule';
import { Note } from '../../domain/entities/note';
import { FocusSession } from '../../domain/entities/focus_session';
import { DailyReview } from '../../domain/entities/daily_review';
import { AppNotification } from '../../domain/entities/notification';
import { User } from '../../domain/entities/user';
import { getTodayDateString } from '../../core/utils/date';

export type CollectionName =
  | 'users'
  | 'categories'
  | 'tasks'
  | 'schedules'
  | 'notes'
  | 'focus_sessions'
  | 'daily_reviews'
  | 'notifications'
  | 'activities';

const PREFIX = 'flowday_db_';

class StorageEngine {
  private listeners: Map<CollectionName, Set<() => void>> = new Map();

  constructor() {
    this.ensureInitialized();
  }

  private getKey(collection: CollectionName): string {
    return `${PREFIX}${collection}`;
  }

  public getCollection<T>(collection: CollectionName): T[] {
    try {
      const raw = localStorage.getItem(this.getKey(collection));
      if (!raw) return [];
      return JSON.parse(raw) as T[];
    } catch (e) {
      console.error(`Failed to read collection ${collection}:`, e);
      return [];
    }
  }

  public setCollection<T>(collection: CollectionName, items: T[]): void {
    try {
      localStorage.setItem(this.getKey(collection), JSON.stringify(items));
      this.notify(collection);
    } catch (e) {
      console.error(`Failed to save collection ${collection}:`, e);
    }
  }

  public subscribe(collection: CollectionName, callback: () => void): () => void {
    if (!this.listeners.has(collection)) {
      this.listeners.set(collection, new Set());
    }
    this.listeners.get(collection)!.add(callback);
    return () => {
      this.listeners.get(collection)?.delete(callback);
    };
  }

  private notify(collection: CollectionName): void {
    const subs = this.listeners.get(collection);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb();
        } catch (err) {
          console.error(err);
        }
      });
    }
  }

  /**
   * Initializes essential metadata if absent (such as default categories and user profile).
   * Note: We don't flood the DB with fake tasks. We provide 1 initial welcoming task and schedule so the user
   * sees how the interface functions smoothly, while all stats and actions operate directly on this real DB.
   */
  public ensureInitialized(): void {
    // 1. User
    const users = this.getCollection<User>('users');
    if (users.length === 0) {
      this.setCollection<User>('users', [DEFAULT_USER]);
    }

    // 2. Categories
    const categories = this.getCollection<Category>('categories');
    if (categories.length === 0) {
      const initialCategories: Category[] = CATEGORY_PALETTE.map((cat, idx) => ({
        id: `cat_${idx + 1}`,
        userId: DEFAULT_USER.uid,
        name: cat.name,
        color: cat.color,
        createdAt: new Date().toISOString(),
      }));
      this.setCollection<Category>('categories', initialCategories);
    }

    // 3. Initial welcome task & agenda event if empty (to give an authentic initial flow)
    const tasks = this.getCollection<Task>('tasks');
    const today = getTodayDateString();
    if (tasks.length === 0) {
      const welcomeTask: Task = {
        id: generateId('tsk'),
        userId: DEFAULT_USER.uid,
        title: 'Plan your top 3 daily priorities in FlowDay',
        description: 'Organize your day using the Eisenhower matrix and set time blocks in Schedule.',
        categoryId: 'cat_1',
        priority: 'urgent_important',
        status: 'todo',
        dueDate: today,
        startTime: '09:00',
        endTime: '09:30',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.setCollection<Task>('tasks', [welcomeTask]);
    }

    const schedules = this.getCollection<Schedule>('schedules');
    if (schedules.length === 0) {
      const welcomeSchedule: Schedule = {
        id: generateId('sch'),
        userId: DEFAULT_USER.uid,
        title: 'Morning Focus & Planning Flow',
        description: 'Review high-priority tasks and prepare today’s workspace.',
        startDate: today,
        endDate: today,
        date: today,
        startTime: '09:00',
        endTime: '09:45',
        isAllDay: false,
        categoryId: 'cat_1',
        reminderEnabled: true,
        reminderSettings: {
          enabled: true,
          type: '15m',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.setCollection<Schedule>('schedules', [welcomeSchedule]);
    }

    const notes = this.getCollection<Note>('notes');
    if (notes.length === 0) {
      const welcomeNote: Note = {
        id: generateId('not'),
        userId: DEFAULT_USER.uid,
        title: 'Welcome to FlowDay 🌸',
        content: 'Plan your day, find your flow. Capture quick ideas, manage priority tasks, and track your daily productivity with ease.',
        categoryId: 'cat_2',
        tags: ['welcome', 'productivity'],
        color: '#F4F1FA',
        isPinned: true,
        isFavorite: true,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.setCollection<Note>('notes', [welcomeNote]);
    }

    const notifications = this.getCollection<AppNotification>('notifications');
    if (notifications.length === 0) {
      const welcomeNotification: AppNotification = {
        id: generateId('ntf'),
        userId: DEFAULT_USER.uid,
        title: 'Welcome to FlowDay',
        message: 'Plan your day, find your flow. Your smart productivity manager and reminder center are active.',
        body: 'Plan your day, find your flow. Your smart productivity manager and reminder center are active.',
        type: 'system',
        relatedEntityType: 'system',
        isRead: false,
        status: 'delivered',
        createdAt: new Date().toISOString(),
      };
      this.setCollection<AppNotification>('notifications', [welcomeNotification]);
    }
  }

  public exportBackup(): string {
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        users: this.getCollection('users'),
        categories: this.getCollection('categories'),
        tasks: this.getCollection('tasks'),
        schedules: this.getCollection('schedules'),
        notes: this.getCollection('notes'),
        focus_sessions: this.getCollection('focus_sessions'),
        daily_reviews: this.getCollection('daily_reviews'),
        notifications: this.getCollection('notifications'),
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) return false;
      const collections: CollectionName[] = [
        'users',
        'categories',
        'tasks',
        'schedules',
        'notes',
        'focus_sessions',
        'daily_reviews',
        'notifications',
      ];
      collections.forEach((col) => {
        if (Array.isArray(parsed.data[col])) {
          this.setCollection(col, parsed.data[col]);
        }
      });
      return true;
    } catch (e) {
      console.error('Import backup failed:', e);
      return false;
    }
  }

  public clearAllData(): void {
    const collections: CollectionName[] = [
      'users',
      'categories',
      'tasks',
      'schedules',
      'notes',
      'focus_sessions',
      'daily_reviews',
      'notifications',
    ];
    collections.forEach((col) => {
      localStorage.removeItem(this.getKey(col));
      this.notify(col);
    });
    this.ensureInitialized();
  }
}

export const storageEngine = new StorageEngine();
