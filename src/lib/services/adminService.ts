import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/client';
import { BusinessProfile, UserDirectoryEntry, UserSettings } from '../../types';

export const BOOTSTRAPPED_ADMIN_EMAILS = ['shihabahmmed700@gmail.com'];
const SESSION_LOGIN_PREFIX = 'ektally_login_recorded_';
const FORCE_NEXT_LOGIN_KEY = 'ektally_force_next_login';

export function isBootstrappedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return BOOTSTRAPPED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function markFreshLoginAttempt(): void {
  try {
    window.sessionStorage.setItem(FORCE_NEXT_LOGIN_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

export function clearSessionLoginMarker(uid?: string): void {
  try {
    window.sessionStorage.removeItem(FORCE_NEXT_LOGIN_KEY);
    if (uid) {
      window.sessionStorage.removeItem(`${SESSION_LOGIN_PREFIX}${uid}`);
    }
  } catch {
    // ignore storage errors
  }
}

export async function checkIsAdmin(user: User): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (isBootstrappedAdminEmail(user.email)) return true;

  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    // Non-admin or transient read denial safely resolves to false
    void path;
    return false;
  }
}

async function resolveTokenEmail(user: User): Promise<string> {
  try {
    const tokenRes = await user.getIdTokenResult();
    const claimEmail = tokenRes?.claims?.email;
    if (typeof claimEmail === 'string' && claimEmail.trim()) {
      return claimEmail.trim();
    }
  } catch {
    // fallback to user.email
  }
  return (user.email || '').trim();
}

export async function recordUserLogin(
  user: User,
  defaults?: { businessName?: string; ownerName?: string }
): Promise<void> {
  if (!user || !user.emailVerified) return;

  let shouldRecord = true;
  let forceIncrement = false;
  try {
    forceIncrement = window.sessionStorage.getItem(FORCE_NEXT_LOGIN_KEY) === '1';
    if (forceIncrement) {
      window.sessionStorage.removeItem(FORCE_NEXT_LOGIN_KEY);
    } else if (window.sessionStorage.getItem(`${SESSION_LOGIN_PREFIX}${user.uid}`) === '1') {
      shouldRecord = false;
    }
  } catch {
    // default to recording when storage unavailable
  }

  if (!shouldRecord) return;

  const path = `userDirectory/${user.uid}`;
  const dirRef = doc(db, 'userDirectory', user.uid);
  const email = await resolveTokenEmail(user);
  if (!email) return;

  let existingSnap;
  try {
    existingSnap = await getDoc(dirRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return;
  }

  let resolvedBusinessName = defaults?.businessName?.trim() || '';
  let resolvedOwnerName = defaults?.ownerName?.trim() || user.displayName?.trim() || '';

  if (!resolvedBusinessName || !resolvedOwnerName) {
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', user.uid));
      if (settingsSnap.exists()) {
        const sData = settingsSnap.data() as Partial<UserSettings>;
        if (!resolvedBusinessName && sData.businessName?.trim()) {
          resolvedBusinessName = sData.businessName.trim();
        }
        if (!resolvedOwnerName && sData.ownerName?.trim()) {
          resolvedOwnerName = sData.ownerName.trim();
        }
      }
    } catch {
      // ignore if settings unavailable
    }
  }

  const displayName = (resolvedOwnerName || email.split('@')[0] || 'User').slice(0, 120);
  const businessName = (resolvedBusinessName || 'EkTally').slice(0, 140);

  if (!existingSnap.exists()) {
    try {
      await setDoc(dirRef, {
        userId: user.uid,
        email: email.slice(0, 254),
        displayName,
        businessName,
        loginCount: 1,
        firstLoginAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    const existing = existingSnap.data() as Partial<UserDirectoryEntry>;
    const currentCount = typeof existing.loginCount === 'number' && existing.loginCount >= 1
      ? existing.loginCount
      : 1;
    try {
      await updateDoc(dirRef, {
        email: email.slice(0, 254),
        displayName,
        businessName: businessName || existing.businessName || 'EkTally',
        loginCount: Math.min(1000000, currentCount + 1),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  try {
    window.sessionStorage.setItem(`${SESSION_LOGIN_PREFIX}${user.uid}`, '1');
  } catch {
    // ignore storage errors
  }
}

export function subscribeAllUserDirectory(
  onData: (entries: UserDirectoryEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'userDirectory';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<UserDirectoryEntry, 'id'>),
      }));
      onData(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeAllSettingsForAdmin(
  onData: (items: UserSettings[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'settings';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<UserSettings, 'id'>),
      }));
      onData(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeAllBusinessesForAdmin(
  onData: (items: BusinessProfile[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'businesses';
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<BusinessProfile, 'id'>),
      }));
      onData(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}
