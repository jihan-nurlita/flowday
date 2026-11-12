import { Task } from '../entities/task';
import { Schedule } from '../entities/schedule';
import { Category } from '../entities/category';
import { Note } from '../entities/note';
import { FocusSession } from '../entities/focus_session';
import { AppNotification } from '../entities/notification';
import { DailyReview } from '../entities/daily_review';
import { User } from '../entities/user';

export interface ITaskRepository {
  getAll(userId: string): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  update(id: string, updates: Partial<Task>): Promise<Task>;
  delete(id: string): Promise<boolean>;
  toggleComplete(id: string): Promise<Task>;
}

export interface IScheduleRepository {
  getAll(userId: string): Promise<Schedule[]>;
  getByDate(userId: string, date: string): Promise<Schedule[]>;
  create(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule>;
  update(id: string, updates: Partial<Schedule>): Promise<Schedule>;
  delete(id: string): Promise<boolean>;
  duplicate(id: string): Promise<Schedule>;
}

export interface ICategoryRepository {
  getAll(userId: string): Promise<Category[]>;
  create(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category>;
  update(id: string, updates: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<boolean>;
}

export interface INoteRepository {
  getAll(userId: string, includeDeleted?: boolean): Promise<Note[]>;
  getById(id: string): Promise<Note | null>;
  create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>;
  update(id: string, updates: Partial<Note>): Promise<Note>;
  softDelete(id: string): Promise<Note>;
  restore(id: string): Promise<Note>;
  deletePermanently(id: string): Promise<boolean>;
  emptyTrash(userId: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  togglePin(id: string): Promise<Note>;
  toggleFavorite(id: string): Promise<Note>;
}

export interface IFocusRepository {
  getAll(userId: string): Promise<FocusSession[]>;
  create(session: Omit<FocusSession, 'id' | 'createdAt'>): Promise<FocusSession>;
  getTodayTotalSeconds(userId: string): Promise<number>;
}

export interface INotificationRepository {
  getAll(userId: string): Promise<AppNotification[]>;
  getById(id: string): Promise<AppNotification | null>;
  create(notification: Omit<AppNotification, 'id' | 'createdAt'>): Promise<AppNotification>;
  markAsRead(id: string): Promise<boolean>;
  markAsUnread(id: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  clearAll(userId: string): Promise<boolean>;
  getUnreadCount(userId: string): Promise<number>;
}


export interface IDailyReviewRepository {
  getByDate(userId: string, date: string): Promise<DailyReview | null>;
  getAll(userId: string): Promise<DailyReview[]>;
  saveReview(review: Omit<DailyReview, 'id' | 'createdAt'>): Promise<DailyReview>;
}

export interface IUserRepository {
  getUser(uid: string): Promise<User | null>;
  saveUser(user: User): Promise<User>;
  updatePreferences(uid: string, preferences: Partial<User['preferences']>): Promise<User>;
}
