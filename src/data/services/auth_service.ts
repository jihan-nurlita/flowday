/**
 * FlowDay Firebase Authentication & User Profile Service
 * Directly integrates Firebase Auth & Cloud Firestore
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
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

export const DEFAULT_PREFERENCES: UserPreferences = {
  themeMode: 'system',
  language: 'id',
  startOfWeek: 'monday',
  timeFormat: '24h',
  notificationEnabled: true,
  pomodoroDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  autoStartBreaks: false,
};

export class AuthService {
  /**
   * Convert Firebase User + Firestore doc into unified domain User entity
   */
  async getUserProfile(firebaseUser: FirebaseUser): Promise<User> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          uid: firebaseUser.uid,
          fullName: data.fullName || firebaseUser.displayName || 'FlowDay User',
          name: data.fullName || firebaseUser.displayName || 'FlowDay User',
          email: firebaseUser.email || data.email || '',
          photoUrl: data.photoUrl || firebaseUser.photoURL || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          preferences: {
            ...DEFAULT_PREFERENCES,
            ...(data.preferences || {}),
          },
        };
      }

      // If document does not exist yet, bootstrap it
      const now = new Date().toISOString();
      const newUser: User = {
        uid: firebaseUser.uid,
        fullName: firebaseUser.displayName || 'FlowDay User',
        name: firebaseUser.displayName || 'FlowDay User',
        email: firebaseUser.email || '',
        photoUrl: firebaseUser.photoURL || '',
        createdAt: now,
        updatedAt: now,
        preferences: DEFAULT_PREFERENCES,
      };

      await setDoc(userDocRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return newUser;
    } catch (err) {
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

    // Update Auth displayName
    await updateProfile(fbUser, {
      displayName: fullName.trim(),
    });

    // Save profile to Cloud Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    const now = new Date().toISOString();
    const newUser: User = {
      uid: fbUser.uid,
      fullName: fullName.trim(),
      name: fullName.trim(),
      email: fbUser.email || email.trim(),
      photoUrl: '',
      createdAt: now,
      updatedAt: now,
      preferences: DEFAULT_PREFERENCES,
    };

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
  async updateProfileDetails(uid: string, updates: { fullName?: string; photoUrl?: string }): Promise<void> {
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
   * Update User Preferences
   */
  async updatePreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void> {
    const userDocRef = doc(db, 'users', uid);
    try {
      await updateDoc(userDocRef, {
        preferences,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  }

  /**
   * Change Password
   */
  async changePassword(newPassword: string): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user found');
    await updatePassword(auth.currentUser, newPassword);
  }

  /**
   * Delete User Account
   */
  async deleteAccount(uid: string): Promise<void> {
    if (!auth.currentUser) throw new Error('No authenticated user found');

    const userDocRef = doc(db, 'users', uid);
    try {
      await deleteDoc(userDocRef);
    } catch (e) {
      console.warn('Could not delete user document before auth deletion:', e);
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
      return 'Format email tidak valid. Harap periksa kembali alamat email Anda.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini belum terdaftar.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau password salah. Silakan coba lagi.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
    case 'auth/weak-password':
      return 'Password terlalu lemah. Gunakan minimal 6 karakter kombinasi.';
    case 'auth/popup-closed-by-user':
      return 'Proses login dengan Google dibatalkan.';
    case 'auth/cancelled-popup-request':
      return 'Permintaan login Google dibatalkan.';
    case 'auth/popup-blocked':
      return 'Jendela popup login terblokir oleh browser. Harap izinkan popup pada peramban Anda.';
    case 'auth/unauthorized-domain':
      return 'Domain aplikasi belum terdaftar di Firebase Authorized Domains. Harap tambahkan domain ini ke Firebase Console.';
    case 'auth/operation-not-allowed':
      return 'Penyedia autentikasi Google belum diaktifkan di Firebase Console.';
    case 'auth/account-exists-with-different-credential':
      return 'Email ini sudah terdaftar dengan metode masuk lain. Silakan masuk menggunakan metode tersebut.';
    case 'auth/requires-recent-login':
      return 'Tindakan ini memerlukan verifikasi ulang. Harap logout dan login kembali.';
    case 'auth/network-request-failed':
      return 'Koneksi jaringan terputus. Periksa sambungan internet Anda.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lagi.';
    default:
      return 'Terjadi kendala saat memproses permintaan. Silakan coba lagi.';
  }
}
