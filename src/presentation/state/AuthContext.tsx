/**
 * FlowDay Authentication State Management Provider
 * Real-time listener for Firebase Auth and Cloud Firestore user profiles
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../data/datasources/firebase';
import { authService, getFriendlyAuthErrorMessage } from '../../data/services/auth_service';
import { User, UserPreferences } from '../../domain/entities/user';

export type AuthStatus = 'initial' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthContextValue {
  status: AuthStatus;
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  errorMessage: string | null;
  onboardingDone: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (fullName: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (fullName: string, photoUrl?: string) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const ONBOARDING_KEY = 'flowday_onboarding_completed';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('initial');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

            // Sync theme mode
            const themeMode = profile.preferences?.themeMode || 'system';
            if (themeMode === 'dark') {
              document.documentElement.classList.add('dark');
            } else if (themeMode === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              document.documentElement.classList.toggle('dark', isDark);
            }
          } catch (err: any) {
            console.error('Failed to load user profile on auth change:', err);
            // Fallback user from Firebase Auth
            setCurrentUser({
              uid: fbUser.uid,
              fullName: fbUser.displayName || 'FlowDay User',
              name: fbUser.displayName || 'FlowDay User',
              email: fbUser.email || '',
              photoUrl: fbUser.photoURL || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              preferences: {
                themeMode: 'system',
                language: 'id',
                startOfWeek: 'monday',
                timeFormat: '24h',
                notificationEnabled: true,
              },
            });
            setStatus('authenticated');
          }
        } else {
          setCurrentUser(null);
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

  const login = useCallback(async (email: string, pass: string) => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const user = await authService.login(email, pass);
      setCurrentUser(user);
      setStatus('authenticated');
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || '');
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
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || '');
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
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || '');
      setErrorMessage(msg);
      setStatus('unauthenticated');
      throw new Error(msg);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authService.forgotPassword(email);
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || '');
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    setStatus('loading');
    try {
      await authService.logout();
      setCurrentUser(null);
      setFirebaseUser(null);
      setStatus('unauthenticated');
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err.code || '');
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
        throw new Error(getFriendlyAuthErrorMessage(err.code || ''));
      }
    },
    [currentUser]
  );

  const updatePreferences = useCallback(
    async (prefs: Partial<UserPreferences>) => {
      if (!currentUser) return;
      try {
        await authService.updatePreferences(currentUser.uid, prefs);
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                preferences: { ...prev.preferences, ...prefs },
                updatedAt: new Date().toISOString(),
              }
            : null
        );

        if (prefs.themeMode) {
          if (prefs.themeMode === 'dark') {
            document.documentElement.classList.add('dark');
          } else if (prefs.themeMode === 'light') {
            document.documentElement.classList.remove('dark');
          } else {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', isDark);
          }
        }
      } catch (err: any) {
        throw new Error(getFriendlyAuthErrorMessage(err.code || ''));
      }
    },
    [currentUser]
  );

  const changePassword = useCallback(async (newPass: string) => {
    try {
      await authService.changePassword(newPass);
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err.code || ''));
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!currentUser) return;
    setStatus('loading');
    try {
      await authService.deleteAccount(currentUser.uid);
      setCurrentUser(null);
      setFirebaseUser(null);
      setStatus('unauthenticated');
    } catch (err: any) {
      setStatus('authenticated');
      throw new Error(getFriendlyAuthErrorMessage(err.code || ''));
    }
  }, [currentUser]);

  const value = {
    status,
    currentUser,
    firebaseUser,
    errorMessage,
    onboardingDone,
    completeOnboarding,
    resetOnboarding,
    login,
    register,
    loginWithGoogle,
    forgotPassword,
    logout,
    updateProfile,
    updatePreferences,
    changePassword,
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
