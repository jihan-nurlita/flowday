/**
 * FlowDay Firebase Authentication & User Profile Service
 * Directly integrates Firebase Auth & Cloud Firestore with conflict-safe preference sync
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  deleteUser,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../datasources/firebase';
import { User, UserPreferences } from '../../domain/entities/user';
import { DEFAULT_USER_PREFERENCES } from '../../core/constants/defaults';

export const DEFAULT_PREFERENCES: UserPreferences = DEFAULT_USER_PREFERENCES;

const PREF_CACHE_PREFIX = 'flowday_prefs_';
const PREF_PENDING_PREFIX = 'flowday_prefs_pending_';

export function getCachedPreferences(uid: string): UserPreferences | null {
  try {
    const raw = localStorage.getItem(`${PREF_CACHE_PREFIX}${uid}`);
    if (!raw) return null;
    return JSON.parse(raw) as UserPreferences;
  } catch {
    return null;
  }
}

export function setCachedPreferences(uid: string, prefs: UserPreferences): void {
  try {
    localStorage.setItem(`${PREF_CACHE_PREFIX}${uid}`, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to cache preferences locally:', e);
  }
}

export function hasPendingPreferencesSync(uid: string): boolean {
  try {
    return localStorage.getItem(`${PREF_PENDING_PREFIX}${uid}`) === 'true';
  } catch {
    return false;
  }
}

export function setPendingPreferencesSync(uid: string, pending: boolean): void {
  try {
    if (pending) {
      localStorage.setItem(`${PREF_PENDING_PREFIX}${uid}`, 'true');
    } else {
      localStorage.removeItem(`${PREF_PENDING_PREFIX}${uid}`);
    }
  } catch {
    // ignore storage quota failures
  }
}

/**
 * Conflict-safe timestamp resolution between local cached preferences and cloud Firestore preferences.
 * Never overwrites newer local or cloud preferences with stale data.
 */
export function mergePreferencesByTimestamp(
  cloudPrefs: Partial<UserPreferences> | undefined,
  localPrefs: Partial<UserPreferences> | null
): { merged: UserPreferences; shouldPushLocalToCloud: boolean } {
  const base = { ...DEFAULT_PREFERENCES };
  if (!cloudPrefs && !localPrefs) {
    return { merged: base, shouldPushLocalToCloud: false };
  }
  if (!localPrefs) {
    return {
      merged: { ...base, ...cloudPrefs },
      shouldPushLocalToCloud: false,
    };
  }
  if (!cloudPrefs) {
    return {
      merged: { ...base, ...localPrefs },
      shouldPushLocalToCloud: true,
    };
  }

  const cloudTs = cloudPrefs.updatedAt ? Date.parse(cloudPrefs.updatedAt) : 0;
  const localTs = localPrefs.updatedAt ? Date.parse(localPrefs.updatedAt) : 0;

  if (localTs > cloudTs) {
    return {
      merged: { ...base, ...cloudPrefs, ...localPrefs },
      shouldPushLocalToCloud: true,
    };
  }

  return {
    merged: { ...base, ...localPrefs, ...cloudPrefs },
    shouldPushLocalToCloud: false,
  };
}

export class AuthService {
  /**
   * Convert Firebase User + Firestore doc into unified domain User entity
   * Resolves local vs cloud preferences safely via updatedAt timestamp.
   */
  async getUserProfile(firebaseUser: FirebaseUser): Promise<User> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const localCached = getCachedPreferences(firebaseUser.uid);

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        const { merged, shouldPushLocalToCloud } = mergePreferencesByTimestamp(
          data.preferences,
          localCached
        );

        setCachedPreferences(firebaseUser.uid, merged);

        if (shouldPushLocalToCloud) {
          try {
            await updateDoc(userDocRef, {
              preferences: merged,
              updatedAt: serverTimestamp(),
            });
            setPendingPreferencesSync(firebaseUser.uid, false);
          } catch {
            setPendingPreferencesSync(firebaseUser.uid, true);
          }
        }

        return {
          uid: firebaseUser.uid,
          fullName: data.fullName || firebaseUser.displayName || 'FlowDay User',
          name: data.fullName || firebaseUser.displayName || 'FlowDay User',
          email: firebaseUser.email || data.email || '',
          photoUrl: data.photoUrl || firebaseUser.photoURL || '',
          createdAt:
            typeof data.createdAt === 'string'
              ? data.createdAt
              : data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          updatedAt:
            typeof data.updatedAt === 'string'
              ? data.updatedAt
              : data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          preferences: merged,
        };
      }

      // If document does not exist yet, bootstrap it
      const now = new Date().toISOString();
      const initialPrefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        ...(localCached || {}),
        updatedAt: now,
      };
      const newUser: User = {
        uid: firebaseUser.uid,
        fullName: firebaseUser.displayName || 'FlowDay User',
        name: firebaseUser.displayName || 'FlowDay User',
        email: firebaseUser.email || '',
        photoUrl: firebaseUser.photoURL || '',
        createdAt: now,
        updatedAt: now,
        preferences: initialPrefs,
      };

      setCachedPreferences(firebaseUser.uid, initialPrefs);

      await setDoc(userDocRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return newUser;
    } catch (err) {
      // If offline or Firestore error, still allow cached preferences fallback if available
      if (localCached) {
        return {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || 'FlowDay User',
          name: firebaseUser.displayName || 'FlowDay User',
          email: firebaseUser.email || '',
          photoUrl: firebaseUser.photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preferences: { ...DEFAULT_PREFERENCES, ...localCached },
        };
      }
      handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
      throw err;
    }
  }

  /**
   * Register with Email & Password
   */
  async register(fullName: string, email: string, password: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = cred.user;

    await updateProfile(fbUser, {
      displayName: fullName.trim(),
    });

    const userDocRef = doc(db, 'users', fbUser.uid);
    const now = new Date().toISOString();
    const initialPrefs: UserPreferences = { ...DEFAULT_PREFERENCES, updatedAt: now };
    const newUser: User = {
      uid: fbUser.uid,
      fullName: fullName.trim(),
      name: fullName.trim(),
      email: fbUser.email || email.trim(),
      photoUrl: '',
      createdAt: now,
      updatedAt: now,
      preferences: initialPrefs,
    };

    setCachedPreferences(fbUser.uid, initialPrefs);

    try {
      await setDoc(userDocRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newUser;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
      return newUser;
    }
  }

  /**
   * Login with Email & Password
   */
  async login(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return this.getUserProfile(cred.user);
  }

  /**
   * Login with Google Popup
   */
  async loginWithGoogle(): Promise<User> {
    const cred = await signInWithPopup(auth, googleProvider);
    return this.getUserProfile(cred.user);
  }

  /**
   * Send Password Reset Email
   */
  async forgotPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  /**
   * Sign Out
   */
  async logout(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Update Profile Details (Full Name and Photo)
   */
  async updateProfileDetails(
    uid: string,
    updates: { fullName?: string; photoUrl?: string }
  ): Promise<void> {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: updates.fullName,
        photoURL: updates.photoUrl,
      });
    }

    const userDocRef = doc(db, 'users', uid);
    try {
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  }

  /**
   * Update User Preferences with local cache + Firestore sync
   * Returns whether cloud sync succeeded or is queued for offline sync.
   */
  async updatePreferences(
    uid: string,
    mergedPreferences: UserPreferences
  ): Promise<{ syncedToCloud: boolean }> {
    const stamped: UserPreferences = {
      ...mergedPreferences,
      updatedAt: new Date().toISOString(),
    };

    // Always persist locally immediately so changes survive reload/offline
    setCachedPreferences(uid, stamped);

    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      return { syncedToCloud: true };
    }

    const userDocRef = doc(db, 'users', uid);
    try {
      await updateDoc(userDocRef, {
        preferences: stamped,
        updatedAt: serverTimestamp(),
      });
      setPendingPreferencesSync(uid, false);
      return { syncedToCloud: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      const isOffline =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        msg.includes('offline') ||
        msg.includes('network') ||
        msg.includes('unavailable');

      if (isOffline) {
        setPendingPreferencesSync(uid, true);
        return { syncedToCloud: false };
      }

      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      throw err;
    }
  }

  /**
   * Re-authenticate current user with password
   */
  async reauthenticateWithPassword(currentPassword: string): Promise<void> {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No authenticated email user found');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
  }

  /**
   * Re-authenticate current user with Google Popup
   */
  async reauthenticateWithGoogle(): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user found');
    await reauthenticateWithPopup(auth.currentUser, googleProvider);
  }

  /**
   * Request Email Change via Firebase verification email
   */
  async changeEmail(newEmail: string): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user found');
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail.trim());
  }

  /**
   * Change Password
   */
  async changePassword(newPassword: string): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user found');
    await updatePassword(auth.currentUser, newPassword);
  }

  /**
   * Delete User Account (Firestore profile + local preference cache + Firebase Auth)
   */
  async deleteAccount(uid: string): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user found');

    const userDocRef = doc(db, 'users', uid);
    try {
      await deleteDoc(userDocRef);
    } catch (e) {
      console.warn('Could not delete user document before auth deletion:', e);
    }

    try {
      localStorage.removeItem(`${PREF_CACHE_PREFIX}${uid}`);
      localStorage.removeItem(`${PREF_PENDING_PREFIX}${uid}`);
    } catch {
      // ignore
    }

    await deleteUser(auth.currentUser);
  }
}

export const authService = new AuthService();

/**
 * Human-friendly error translation for Firebase Auth error codes
 */
export function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email format. Please check the email address.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already in use by another account.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in window was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Google sign-in request was cancelled.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups.';
    case 'auth/unauthorized-domain':
      return 'Application domain is not listed in Firebase Authorized Domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in operation is not enabled in Firebase Console.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is linked with a different sign-in provider.';
    case 'auth/requires-recent-login':
      return 'REAUTH_REQUIRED';
    case 'auth/network-request-failed':
      return 'Network request failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return errorCode || 'An unexpected authentication error occurred.';
  }
}
