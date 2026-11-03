import { auth, isFirebaseConfigured } from './config';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { UserProfile, UserRole } from '@/types/user';

export const DEMO_OPERATOR_USER: UserProfile = {
  id: 'usr-operator-01',
  name: 'Officer Rajesh Kumar',
  email: 'operator@ambulance.demo',
  role: 'AMBULANCE_OPERATOR',
  badgeNumber: 'AMB-UNIT-42',
  station: 'Central Command & Dispatch',
  createdAt: '2026-01-15T08:00:00Z',
};

export const DEMO_ADMIN_USER: UserProfile = {
  id: 'usr-admin-01',
  name: 'Dr. Sarah Mitchell (Medical Director)',
  email: 'admin@ems.demo',
  role: 'ADMIN',
  badgeNumber: 'EMS-DIR-01',
  station: 'Metropolitan Emergency Oversight',
  createdAt: '2026-01-01T08:00:00Z',
};

// Local storage key for persistent user state in browser
const USER_STORAGE_KEY = 'ems_active_user_session';

export function getActiveUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  // Default to Ambulance Operator for instant demo usability
  return DEMO_OPERATOR_USER;
}

export function setActiveUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export async function loginWithDemoRole(role: UserRole): Promise<UserProfile> {
  const user = role === 'ADMIN' ? DEMO_ADMIN_USER : DEMO_OPERATOR_USER;
  setActiveUser(user);
  return user;
}

export async function loginWithEmailPassword(
  email: string,
  pass: string
): Promise<UserProfile> {
  if (isFirebaseConfigured() && auth) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const profile: UserProfile = {
        id: userCred.user.uid,
        name: userCred.user.displayName || email.split('@')[0],
        email: userCred.user.email || email,
        role: email.toLowerCase().includes('admin') ? 'ADMIN' : 'AMBULANCE_OPERATOR',
        createdAt: new Date().toISOString(),
      };
      setActiveUser(profile);
      return profile;
    } catch (err: any) {
      throw new Error(err.message || 'Firebase authentication failed');
    }
  }

  // Demo fallback
  if (email.toLowerCase().includes('admin')) {
    return loginWithDemoRole('ADMIN');
  }
  return loginWithDemoRole('AMBULANCE_OPERATOR');
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured() && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
  }
  setActiveUser(null);
}
