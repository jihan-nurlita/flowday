/**
 * FlowDay Concrete Repository Implementations
 * Executes operations on storageEngine with sorting, filtering, and indexing.
 */

import { generateId } from '../../core/utils/id';
import { storageEngine } from '../datasources/storage_engine';
import { Task } from '../../domain/entities/task';
import { Schedule } from '../../domain/entities/schedule';
import { Category } from '../../domain/entities/category';
import { Note } from '../../domain/entities/note';
import { FocusSession } from '../../domain/entities/focus_session';
import { AppNotification } from '../../domain/entities/notification';
import { DailyReview } from '../../domain/entities/daily_review';
import { User } from '../../domain/entities/user';
import {
  ITaskRepository,
  IScheduleRepository,
  ICategoryRepository,
  INoteRepository,
  IFocusRepository,
  INotificationRepository,
  IDailyReviewRepository,
  IUserRepository,
} from '../../domain/repositories/contracts';

export class TaskRepository implements ITaskRepository {
  async getAll(userId: string): Promise<Task[]> {
    const list = storageEngine.getCollection<Task>('tasks');
    return list.filter((t) => t.userId === userId);
  }

  async getById(id: string): Promise<Task | null> {
    const list = storageEngine.getCollection<Task>('tasks');
    return list.find((t) => t.id === id) || null;
  }

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const list = storageEngine.getCollection<Task>('tasks');
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: generateId('tsk'),
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newTask);
    storageEngine.setCollection<Task>('tasks', list);
    return newTask;
  }

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const list = storageEngine.getCollection<Task>('tasks');
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task ${id} not found`);
    }
    const updated: Task = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    storageEngine.setCollection<Task>('tasks', list);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const list = storageEngine.getCollection<Task>('tasks');
    const filtered = list.filter((t) => t.id !== id);
    storageEngine.setCollection<Task>('tasks', filtered);
    return filtered.length !== list.length;
  }

  async toggleComplete(id: string): Promise<Task> {
    const list = storageEngine.getCollection<Task>('tasks');
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task ${id} not found`);
    }
    const current = list[index];
    const newStatus = !current.isCompleted;
    const now = new Date().toISOString();
    const updated: Task = {
      ...current,
      isCompleted: newStatus,
      status: newStatus ? 'completed' : 'todo',
      completedAt: newStatus ? now : undefined,
      updatedAt: now,
    };
    list[index] = updated;
    storageEngine.setCollection<Task>('tasks', list);
    return updated;
  }
}

export class ScheduleRepository implements IScheduleRepository {
  async getAll(userId: string): Promise<Schedule[]> {
    const list = storageEngine.getCollection<Schedule>('schedules');
    return list
      .filter((s) => s.userId === userId)
      .sort((a, b) => {
        const dA = a.startDate || a.date;
        const dB = b.startDate || b.date;
        return dA.localeCompare(dB) || a.startTime.localeCompare(b.startTime);
      });
  }

  async getByDate(userId: string, date: string): Promise<Schedule[]> {
    const list = storageEngine.getCollection<Schedule>('schedules');
    return list
      .filter((s) => s.userId === userId && (s.startDate === date || s.date === date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async create(scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    const list = storageEngine.getCollection<Schedule>('schedules');
    const now = new Date().toISOString();
    const startDate = scheduleData.startDate || scheduleData.date || now.slice(0, 10);
    const endDate = scheduleData.endDate || startDate;
    const isAllDay = Boolean(scheduleData.isAllDay);
    const newSchedule: Schedule = {
      ...scheduleData,
      id: generateId('sch'),
      startDate,
      endDate,
      date: startDate,
      startTime: isAllDay ? '00:00' : (scheduleData.startTime || '09:00'),
      endTime: isAllDay ? '23:59' : (scheduleData.endTime || '10:00'),
      isAllDay,
      reminderEnabled: scheduleData.reminderSettings?.enabled ?? Boolean(scheduleData.reminderEnabled),
      recurrenceExceptions: scheduleData.recurrenceExceptions || [],
      createdAt: now,
      updatedAt: now,
    };
    list.push(newSchedule);
    storageEngine.setCollection<Schedule>('schedules', list);
    return newSchedule;
  }

  async update(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    const list = storageEngine.getCollection<Schedule>('schedules');
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Schedule ${id} not found`);

    const now = new Date().toISOString();
    const current = list[idx];
    const startDate = updates.startDate || updates.date || current.startDate || current.date;
    const endDate = updates.endDate || (updates.startDate ? updates.startDate : current.endDate) || startDate;
    const isAllDay = updates.isAllDay !== undefined ? updates.isAllDay : current.isAllDay;

    const updated: Schedule = {
      ...current,
      ...updates,
      startDate,
      endDate,
      date: startDate,
      isAllDay,
      reminderEnabled:
        updates.reminderSettings?.enabled ?? (updates.reminderEnabled !== undefined ? updates.reminderEnabled : current.reminderEnabled),
      updatedAt: now,
    };
    list[idx] = updated;
    storageEngine.setCollection<Schedule>('schedules', list);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const list = storageEngine.getCollection<Schedule>('schedules');
    const filtered = list.filter((s) => s.id !== id);
    storageEngine.setCollection<Schedule>('schedules', filtered);
    return filtered.length !== list.length;
  }

  async duplicate(id: string): Promise<Schedule> {
    const list = storageEngine.getCollection<Schedule>('schedules');
    const target = list.find((s) => s.id === id);
    if (!target) throw new Error(`Schedule ${id} not found`);

    const now = new Date().toISOString();
    const cloned: Schedule = {
      ...target,
      id: generateId('sch'),
      title: `${target.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    list.push(cloned);
    storageEngine.setCollection<Schedule>('schedules', list);
    return cloned;
  }
}

export class CategoryRepository implements ICategoryRepository {
  async getAll(userId: string): Promise<Category[]> {
    const list = storageEngine.getCollection<Category>('categories');
    return list.filter((c) => c.userId === userId);
  }

  async create(categoryData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const list = storageEngine.getCollection<Category>('categories');
    const newCat: Category = {
      ...categoryData,
      id: generateId('cat'),
      createdAt: new Date().toISOString(),
    };
    list.push(newCat);
    storageEngine.setCollection<Category>('categories', list);
    return newCat;
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const list = storageEngine.getCollection<Category>('categories');
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Category ${id} not found`);
    const updated: Category = { ...list[idx], ...updates };
    list[idx] = updated;
    storageEngine.setCollection<Category>('categories', list);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const list = storageEngine.getCollection<Category>('categories');
    const targetCat = list.find((c) => c.id === id);
    if (!targetCat) return false;

    // Remaining categories or fallback
    const remaining = list.filter((c) => c.id !== id);
    let fallbackCatId = remaining[0]?.id;
    if (!fallbackCatId) {
      const fallback: Category = {
        id: generateId('cat'),
        userId: targetCat.userId,
        name: 'Other',
        color: '#898493',
        createdAt: new Date().toISOString(),
      };
      remaining.push(fallback);
      fallbackCatId = fallback.id;
    }

    // Reassign all tasks from deleted category to fallback category so tasks are never lost
    const tasks = storageEngine.getCollection<Task>('tasks');
    let tasksModified = false;
    const updatedTasks = tasks.map((t) => {
      if (t.categoryId === id) {
        tasksModified = true;
        return { ...t, categoryId: fallbackCatId, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    if (tasksModified) {
      storageEngine.setCollection<Task>('tasks', updatedTasks);
    }

    // Reassign all schedules from deleted category to fallback category
    const schedules = storageEngine.getCollection<Schedule>('schedules');
    let schedulesModified = false;
    const updatedSchedules = schedules.map((s) => {
      if (s.categoryId === id) {
        schedulesModified = true;
        return { ...s, categoryId: fallbackCatId, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    if (schedulesModified) {
      storageEngine.setCollection<Schedule>('schedules', updatedSchedules);
    }

    // Reassign all notes from deleted category to fallback category so notes are never lost
    const notes = storageEngine.getCollection<Note>('notes');
    let notesModified = false;
    const updatedNotes = notes.map((n) => {
      if (n.categoryId === id) {
        notesModified = true;
        return { ...n, categoryId: fallbackCatId, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    if (notesModified) {
      storageEngine.setCollection<Note>('notes', updatedNotes);
    }

    storageEngine.setCollection<Category>('categories', remaining);
    return true;
  }
}

export class NoteRepository implements INoteRepository {
  async getAll(userId: string, includeDeleted = false): Promise<Note[]> {
    const list = storageEngine.getCollection<Note>('notes');
    return list
      .filter((n) => n.userId === userId && (includeDeleted || !n.isDeleted))
      .sort((a, b) => {
        // Pinned notes first, then latest updated
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }

  async getById(id: string): Promise<Note | null> {
    const list = storageEngine.getCollection<Note>('notes');
    return list.find((n) => n.id === id) || null;
  }

  async create(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const list = storageEngine.getCollection<Note>('notes');
    const now = new Date().toISOString();

    // Auto-generate title from first line of content if title is blank
    let computedTitle = (noteData.title || '').trim();
    if (!computedTitle && noteData.content) {
      const firstLine = noteData.content.trim().split('\n')[0].replace(/^[#\-*\s]+/, '').trim();
      computedTitle = firstLine ? firstLine.slice(0, 50) : 'Untitled Note';
    } else if (!computedTitle) {
      computedTitle = 'Untitled Note';
    }

    const newNote: Note = {
      ...noteData,
      id: generateId('not'),
      title: computedTitle,
      tags: noteData.tags || [],
      color: noteData.color || '#FFFFFF',
      isPinned: Boolean(noteData.isPinned),
      isFavorite: Boolean(noteData.isFavorite),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newNote);
    storageEngine.setCollection<Note>('notes', list);
    return newNote;
  }

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    const list = storageEngine.getCollection<Note>('notes');
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error(`Note ${id} not found`);

    let updatedTitle = updates.title !== undefined ? updates.title.trim() : list[idx].title;
    const content = updates.content !== undefined ? updates.content : list[idx].content;

    if (!updatedTitle && content) {
      const firstLine = content.trim().split('\n')[0].replace(/^[#\-*\s]+/, '').trim();
      updatedTitle = firstLine ? firstLine.slice(0, 50) : 'Untitled Note';
    }

    const updated: Note = {
      ...list[idx],
      ...updates,
      title: updatedTitle || 'Untitled Note',
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    storageEngine.setCollection<Note>('notes', list);
    return updated;
  }

  async softDelete(id: string): Promise<Note> {
    const list = storageEngine.getCollection<Note>('notes');
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error(`Note ${id} not found`);

    const now = new Date().toISOString();
    const updated: Note = {
      ...list[idx],
      isDeleted: true,
      deletedAt: now,
      isPinned: false, // unpin when trashed
      updatedAt: now,
    };
    list[idx] = updated;
    storageEngine.setCollection<Note>('notes', list);
    return updated;
  }

  async restore(id: string): Promise<Note> {
    const list = storageEngine.getCollection<Note>('notes');
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error(`Note ${id} not found`);

    const now = new Date().toISOString();
    const updated: Note = {
      ...list[idx],
      isDeleted: false,
      deletedAt: undefined,
      updatedAt: now,
    };
    list[idx] = updated;
    storageEngine.setCollection<Note>('notes', list);
    return updated;
  }

  async deletePermanently(id: string): Promise<boolean> {
    const list = storageEngine.getCollection<Note>('notes');
    const filtered = list.filter((n) => n.id !== id);
    storageEngine.setCollection<Note>('notes', filtered);
    return filtered.length !== list.length;
  }

  async emptyTrash(userId: string): Promise<boolean> {
    const list = storageEngine.getCollection<Note>('notes');
    const filtered = list.filter((n) => !(n.userId === userId && n.isDeleted));
    storageEngine.setCollection<Note>('notes', filtered);
    return true;
  }

  async delete(id: string): Promise<boolean> {
    // Standard delete acts as soft delete to Trash
    await this.softDelete(id);
    return true;
  }

  async togglePin(id: string): Promise<Note> {
    const list = storageEngine.getCollection<Note>('notes');
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error(`Note ${id} not found`);

    const updated: Note = {
      ...list[idx],
      isPinned: !list[idx].isPinned,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    storageEngine.setCollection<Note>('notes', list);
    return updated;
  }

  async toggleFavorite(id: string): Promise<Note> {
    const list = storageEngine.getCollection<Note>('notes');
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error(`Note ${id} not found`);

    const updated: Note = {
      ...list[idx],
      isFavorite: !list[idx].isFavorite,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    storageEngine.setCollection<Note>('notes', list);
    return updated;
  }
}

export class FocusRepository implements IFocusRepository {
  async getAll(userId: string): Promise<FocusSession[]> {
    const list = storageEngine.getCollection<FocusSession>('focus_sessions');
    return list
      .filter((f) => f.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(sessionData: Omit<FocusSession, 'id' | 'createdAt'>): Promise<FocusSession> {
    const list = storageEngine.getCollection<FocusSession>('focus_sessions');
    const newSession: FocusSession = {
      ...sessionData,
      id: generateId('foc'),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newSession);
    storageEngine.setCollection<FocusSession>('focus_sessions', list);
    return newSession;
  }

  async getTodayTotalSeconds(userId: string): Promise<number> {
    const list = await this.getAll(userId);
    const today = new Date().toISOString().slice(0, 10);
    return list
      .filter((s) => s.completed && s.createdAt.startsWith(today))
      .reduce((acc, curr) => acc + (curr.duration || 0), 0);
  }
}

export class NotificationRepository implements INotificationRepository {
  async getAll(userId: string): Promise<AppNotification[]> {
    const list = storageEngine.getCollection<AppNotification>('notifications');
    return list.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById(id: string): Promise<AppNotification | null> {
    const list = storageEngine.getCollection<AppNotification>('notifications');
    return list.find((n) => n.id === id) || null;
  }

  async create(notifData: Omit<AppNotification, 'id' | 'createdAt'>): Promise<AppNotification> {
    const list = storageEngine.getCollection<AppNotification>('notifications');
    const newNotif: AppNotification = {
      ...notifData,
      id: generateId('ntf'),
      body: notifData.body || notifData.message,
      relatedEntityId: notifData.relatedEntityId || notifData.relatedId,
      status: notifData.status || 'delivered',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotif);
    storageEngine.setCollection<AppNotification>('notifications', list);
    return newNotif;
  }

  async markAsRead(id: string): Promise<boolean> {
    const list = storageEngine.getCollection<AppNotification>('notifications');
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    list[idx] = {
      ...list[idx],
      isRead: true,
      readAt: new Date().toISOString(),
    };
    storageEngine.setCollection<AppNotification>('notifications', list);
    return true;
  }

  async markAsUnread(id: string): Promise<boolean> {
    const list = storageEngine.getCollection<AppNotification>('notifications');
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    list[idx] = {
      ...list[idx],
      isRead: false,
      readAt: undefined,
    };
    storageEngine.setCollection<AppNotification>('notifications', list);
    return true;
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const list = storageEngine.getCollection<AppNotification>('notifications');
    const nowIso = new Date().toISOString();
    let modified = false;
    const updated = list.map((n) => {
      if (n.userId === userId && !n.isRead) {
        modified = true;
        return {
          ...n,
          isRead: true,
          readAt: nowIso,
        };
      }
      return n;
    });
    if (modified) {
      storageEngine.setCollection<AppNotification>('notifications', updated);
    }
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const list = storageEngine.getCollection<AppNotification>('notifications');
    const filtered = list.filter((n) => n.id !== id);
    if (filtered.length === list.length) return false;
    storageEngine.setCollection<AppNotification>('notifications', filtered);
    return true;
  }

  async clearAll(userId: string): Promise<boolean> {
    const list = storageEngine.getCollection<AppNotification>('notifications');
    const filtered = list.filter((n) => n.userId !== userId);
    storageEngine.setCollection<AppNotification>('notifications', filtered);
    return true;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const list = storageEngine.getCollection<AppNotification>('notifications');
    return list.filter((n) => n.userId === userId && !n.isRead).length;
  }
}

export class DailyReviewRepository implements IDailyReviewRepository {
  async getByDate(userId: string, date: string): Promise<DailyReview | null> {
    const list = storageEngine.getCollection<DailyReview>('daily_reviews');
    return list.find((r) => r.userId === userId && r.date === date) || null;
  }

  async getAll(userId: string): Promise<DailyReview[]> {
    const list = storageEngine.getCollection<DailyReview>('daily_reviews');
    return list.filter((r) => r.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
  }

  async saveReview(reviewData: Omit<DailyReview, 'id' | 'createdAt'>): Promise<DailyReview> {
    const list = storageEngine.getCollection<DailyReview>('daily_reviews');
    const idx = list.findIndex((r) => r.userId === reviewData.userId && r.date === reviewData.date);
    if (idx !== -1) {
      const updated: DailyReview = {
        ...list[idx],
        ...reviewData,
      };
      list[idx] = updated;
      storageEngine.setCollection<DailyReview>('daily_reviews', list);
      return updated;
    }
    const newRev: DailyReview = {
      ...reviewData,
      id: generateId('rev'),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRev);
    storageEngine.setCollection<DailyReview>('daily_reviews', list);
    return newRev;
  }
}

export class UserRepository implements IUserRepository {
  async getUser(uid: string): Promise<User | null> {
    const list = storageEngine.getCollection<User>('users');
    return list.find((u) => u.uid === uid) || null;
  }

  async saveUser(user: User): Promise<User> {
    const list = storageEngine.getCollection<User>('users');
    const idx = list.findIndex((u) => u.uid === user.uid);
    if (idx !== -1) {
      list[idx] = { ...user, updatedAt: new Date().toISOString() };
    } else {
      list.push(user);
    }
    storageEngine.setCollection<User>('users', list);
    return user;
  }

  async updatePreferences(uid: string, preferences: Partial<User['preferences']>): Promise<User> {
    const list = storageEngine.getCollection<User>('users');
    const idx = list.findIndex((u) => u.uid === uid);
    if (idx === -1) throw new Error('User not found');
    const updated: User = {
      ...list[idx],
      preferences: {
        ...list[idx].preferences,
        ...preferences,
      },
      updatedAt: new Date().toISOString(),
    };
    list[idx] = updated;
    storageEngine.setCollection<User>('users', list);
    return updated;
  }
}

// Singleton instances for clean injection across Presentation layer
export const taskRepo = new TaskRepository();
export const scheduleRepo = new ScheduleRepository();
export const categoryRepo = new CategoryRepository();
export const noteRepo = new NoteRepository();
export const focusRepo = new FocusRepository();
export const notificationRepo = new NotificationRepository();
export const dailyReviewRepo = new DailyReviewRepository();
export const userRepo = new UserRepository();
