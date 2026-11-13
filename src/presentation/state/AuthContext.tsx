/**
 * FlowDay Authentication State Management Provider
 * Real-time listener for Firebase Auth, Cloud Firestore user profiles,
 * Global Theme Mode (with live OS System Default listener), and Conflict-Safe Preferences
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../data/datasources/firebase';
import {
  authService,
  DEFAULT_PREFERENCES,
  getFriendlyAuthErrorMessage,
  hasPendingPreferencesSync,
  setPendingPreferencesSync,
} from '../../data/services/auth_service';
import { AppThemeMode, User, UserPreferences } from '../../domain/entities/user';
import { setActiveDateFormattingConfig } from '../../core/utils/date';

export type AuthStatus = 'initial' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
export type PrefSyncStatus = 'idle' | 'saving' | 'saved' | 'saved_offline' | 'error';

interface AuthContextValue {
  status: AuthStatus;
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  errorMessage: string | null;
  onboardingDone: boolean;
  prefSyncStatus: PrefSyncStatus;
  prefSaveError: string | null;
  hasPendingPrefSync: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (fullName: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (fullName: string, photoUrl?: string) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  retrySyncPreferences: () => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  reauthenticateWithPassword: (currentPassword: string) => Promise<void>;
  reauthenticateWithGoogle: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const ONBOARDING_KEY = 'flowday_onboarding_completed';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function applyThemeToDocument(themeMode: AppThemeMode = 'system'): void {
  if (typeof document === 'undefined') return;
  if (themeMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (themeMode === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    const isDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
  }
}

export function applyPreferencesSideEffects(prefs: UserPreferences): void {
  const themeMode = prefs.themeMode || prefs.theme || 'system';
  applyThemeToDocument(themeMode);

  if (typeof document !== 'undefined') {
    document.documentElement.lang = prefs.language === 'id' ? 'id' : 'en';
  }

  setActiveDateFormattingConfig({
    language: prefs.language || 'en',
    dateFormat: prefs.dateFormat || 'MMM d, yyyy',
    timeFormat: prefs.timeFormat || '24h',
    startOfWeek: prefs.startOfWeek || 'monday',
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('initial');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prefSyncStatus, setPrefSyncStatus] = useState<PrefSyncStatus>('idle');
  const [prefSaveError, setPrefSaveError] = useState<string | null>(null);
  const [hasPendingPrefSync, setHasPendingPrefSync] = useState<boolean>(false);

  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const clearError = useCallback(() => setErrorMessage(null), []);

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save onboarding state:', e);
    }
    setOnboardingDone(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
    } catch (e) {
      console.warn('Failed to reset onboarding state:', e);
    }
    setOnboardingDone(false);
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    setStatus('loading');
    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const profile = await authService.getUserProfile(fbUser);
            setCurrentUser(profile);
            setStatus('authenticated');
            setErrorMessage(null);
            setHasPendingPrefSync(hasPendingPreferencesSync(fbUser.uid));
            applyPreferencesSideEffects(profile.preferences);
          } catch (err: any) {
            console.error('Failed to load user profile on auth change:', err);
            const fallbackProfile: User = {
              uid: fbUser.uid,
              fullName: fbUser.displayName || 'FlowDay User',
              name: fbUser.displayName || 'FlowDay User',
              email: fbUser.email || '',
              photoUrl: fbUser.photoURL || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              preferences: DEFAULT_PREFERENCES,
            };
            setCurrentUser(fallbackProfile);
            setStatus('authenticated');
            applyPreferencesSideEffects(fallbackProfile.preferences);
          }
        } else {
          setCurrentUser(null);
          setHasPendingPrefSync(false);
          setStatus('unauthenticated');
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
        setErrorMessage(getFriendlyAuthErrorMessage((error as any)?.code || ''));
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, []);

  // Live OS System Default Theme Listener
  useEffect(() => {
    const activeTheme = currentUser?.preferences?.themeMode || currentUser?.preferences?.theme || 'system';
    applyThemeToDocument(activeTheme);

    if (activeTheme !== 'system' || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyThemeToDocument('system');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [currentUser?.preferences?.themeMode, currentUser?.preferences?.theme]);

  // Apply language & formatting side effects whenever preferences change
  useEffect(() => {
    if (currentUser?.preferences) {
      applyPreferencesSideEffects(currentUser.preferences);
    }
  }, [currentUser?.preferences]);

  const login = useCallback(async (email: string, pass: string) => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const user = await authService.login(email, pass);
      setCurrentUser(user);
      setStatus('authenticated');
      applyPreferencesSideEffects(user.preferences);
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || err.message || '');
      setErrorMessage(msg);
      setStatus('unauthenticated');
      throw new Error(msg);
    }
  }, []);

  const register = useCallback(async (fullName: string, email: string, pass: string) => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const user = await authService.register(fullName, email, pass);
      setCurrentUser(user);
      setStatus('authenticated');
      applyPreferencesSideEffects(user.preferences);
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || err.message || '');
      setErrorMessage(msg);
      setStatus('unauthenticated');
      throw new Error(msg);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const user = await authService.loginWithGoogle();
      setCurrentUser(user);
      setStatus('authenticated');
      applyPreferencesSideEffects(user.preferences);
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || err.message || '');
      setErrorMessage(msg);
      setStatus('unauthenticated');
      throw new Error(msg);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authService.forgotPassword(email);
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || err.message || '');
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    setStatus('loading');
    try {
      await authService.logout();
      setCurrentUser(null);
      setFirebaseUser(null);
      setHasPendingPrefSync(false);
      setPrefSyncStatus('idle');
      setStatus('unauthenticated');
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || err.message || '');
      setErrorMessage(msg);
      setStatus('authenticated');
      throw new Error(msg);
    }
  }, []);

  const updateProfile = useCallback(
    async (fullName: string, photoUrl?: string) => {
      if (!currentUser) return;
      try {
        await authService.updateProfileDetails(currentUser.uid, {
          fullName,
          photoUrl: photoUrl !== undefined ? photoUrl : currentUser.photoUrl,
        });
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                fullName,
                name: fullName,
                photoUrl: photoUrl !== undefined ? photoUrl : prev.photoUrl,
                updatedAt: new Date().toISOString(),
              }
            : null
        );
      } catch (err: any) {
        throw new Error(getFriendlyAuthErrorMessage(err.code || err.message || ''));
      }
    },
    [currentUser]
  );

  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>) => {
      if (!currentUser) return;
      const now = new Date().toISOString();
      const merged: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        ...currentUser.preferences,
        ...prefs,
        theme: prefs.themeMode || prefs.theme || currentUser.preferences.themeMode || 'system',
        themeMode: prefs.themeMode || prefs.theme || currentUser.preferences.themeMode || 'system',
        firstDayOfWeek:
          prefs.startOfWeek === 'sunday'
            ? 0
            : prefs.startOfWeek === 'monday'
            ? 1
            : currentUser.preferences.firstDayOfWeek ?? 1,
        updatedAt: now,
      };

      setPrefSyncStatus('saving');
      setPrefSaveError(null);

      // Apply immediately in memory & document
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              preferences: merged,
              updatedAt: now,
            }
          : null
      );
      applyPreferencesSideEffects(merged);

      try {
        const res = await authService.updatePreferences(currentUser.uid, merged);
        if (res.syncedToCloud) {
          setPrefSyncStatus('saved');
          setHasPendingPrefSync(false);
        } else {
          setPrefSyncStatus('saved_offline');
          setHasPendingPrefSync(true);
        }
      } catch (err: any) {
        setPrefSyncStatus('error');
        setPrefSaveError(err?.message || 'Failed to save preferences');
        throw err;
      }
    },
    [currentUser]
  );

  const retrySyncPreferences = useCallback(async () => {
    if (!currentUser) return;
    setPrefSyncStatus('saving');
    setPrefSaveError(null);
    try {
      const res = await authService.updatePreferences(currentUser.uid, currentUser.preferences);
      if (res.syncedToCloud) {
        setPrefSyncStatus('saved');
        setHasPendingPrefSync(false);
        setPendingPreferencesSync(currentUser.uid, false);
      } else {
        setPrefSyncStatus('saved_offline');
        setHasPendingPrefSync(true);
      }
    } catch (err: any) {
      setPrefSyncStatus('error');
      setPrefSaveError(err?.message || 'Sync retry failed');
    }
  }, [currentUser]);

  // Auto-flush pending preference sync when returning online
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOnline = () => {
      if (currentUser && hasPendingPreferencesSync(currentUser.uid)) {
        retrySyncPreferences();
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [currentUser, retrySyncPreferences]);

  const changeEmail = useCallback(async (newEmail: string) => {
    try {
      await authService.changeEmail(newEmail);
    } catch (err: any) {
      const code = err.code || '';
      const msg = getFriendlyAuthErrorMessage(code);
      const errorObj: any = new Error(
        msg === 'REAUTH_REQUIRED'
          ? 'Please verify your current password or sign-in again before changing your email.'
          : msg
      );
      errorObj.code = code;
      throw errorObj;
    }
  }, []);

  const changePassword = useCallback(async (newPass: string) => {
    try {
      await authService.changePassword(newPass);
    } catch (err: any) {
      const code = err.code || '';
      const msg = getFriendlyAuthErrorMessage(code);
      const errorObj: any = new Error(
        msg === 'REAUTH_REQUIRED'
          ? 'Please re-authenticate before updating your password.'
          : msg
      );
      errorObj.code = code;
      throw errorObj;
    }
  }, []);

  const reauthenticateWithPassword = useCallback(async (currentPassword: string) => {
    try {
      await authService.reauthenticateWithPassword(currentPassword);
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err.code || err.message || ''));
    }
  }, []);

  const reauthenticateWithGoogle = useCallback(async () => {
    try {
      await authService.reauthenticateWithGoogle();
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err.code || err.message || ''));
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!currentUser) return;
    setStatus('loading');
    try {
      await authService.deleteAccount(currentUser.uid);
      setCurrentUser(null);
      setFirebaseUser(null);
      setHasPendingPrefSync(false);
      setStatus('unauthenticated');
    } catch (err: any) {
      setStatus('authenticated');
      const code = err.code || '';
      const msg = getFriendlyAuthErrorMessage(code);
      const errorObj: any = new Error(
        msg === 'REAUTH_REQUIRED'
          ? 'Please re-authenticate to confirm account deletion.'
          : msg
      );
      errorObj.code = code;
      throw errorObj;
    }
  }, [currentUser]);

  const value: AuthContextValue = {
    status,
    currentUser,
    firebaseUser,
    errorMessage,
    onboardingDone,
    prefSyncStatus,
    prefSaveError,
    hasPendingPrefSync,
    completeOnboarding,
    resetOnboarding,
    login,
    register,
    loginWithGoogle,
    forgotPassword,
    logout,
    updateProfile,
    updatePreferences,
    retrySyncPreferences,
    changeEmail,
    changePassword,
    reauthenticateWithPassword,
    reauthenticateWithGoogle,
    deleteAccount,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
