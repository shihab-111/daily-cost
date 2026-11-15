import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { commitOfflineSafe, db, handleFirestoreError, OperationType } from '../firebase/client';
import { BusinessProfile } from '../../types';
import { generateSafeId } from '../utils';

const inFlightDefaultEnsure = new Map<string, Promise<void>>();
const BIZ_CLEARED_PREFIX = 'bd_ledger_biz_cleared_';

function isBusinessesCleared(uid: string): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(`${BIZ_CLEARED_PREFIX}${uid}`) === '1';
  } catch {
    return false;
  }
}

function setBusinessesCleared(uid: string, cleared: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (cleared) {
      window.localStorage.setItem(`${BIZ_CLEARED_PREFIX}${uid}`, '1');
    } else {
      window.localStorage.removeItem(`${BIZ_CLEARED_PREFIX}${uid}`);
    }
  } catch {
    // ignore storage errors
  }
}

export function getDefaultBusinessId(uid: string): string {
  return `biz_default_${uid}`;
}

export async function ensureDefaultBusiness(
  user: User,
  defaultName?: string
): Promise<void> {
  if (isBusinessesCleared(user.uid)) {
    return;
  }

  const existingPromise = inFlightDefaultEnsure.get(user.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const task = (async () => {
    const businessId = getDefaultBusinessId(user.uid);
    const bizRef = doc(db, 'businesses', businessId);
    const path = `businesses/${businessId}`;

    let exists = false;
    try {
      const snap = await getDoc(bizRef);
      exists = snap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }

    if (exists) return;

    try {
      const anyBizSnap = await getDocs(
        query(collection(db, 'businesses'), where('userId', '==', user.uid), limit(1))
      );
      if (!anyBizSnap.empty) {
        return;
      }
    } catch {
      // fall through only if list check is unavailable
    }

    let resolvedName = defaultName?.trim() || '';
    if (!resolvedName) {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', user.uid));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data() as { businessName?: string };
          if (data.businessName?.trim()) {
            resolvedName = data.businessName.trim();
          }
        }
      } catch {
        // fallback cleanly below
      }
    }

    const finalName = (resolvedName || 'EkTally').slice(0, 140);

    try {
      await setDoc(bizRef, {
        userId: user.uid,
        name: finalName,
        isDefault: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  })().finally(() => {
    inFlightDefaultEnsure.delete(user.uid);
  });

  inFlightDefaultEnsure.set(user.uid, task);
  return task;
}

export function subscribeBusinesses(
  user: User,
  onData: (businesses: BusinessProfile[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'businesses';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        setBusinessesCleared(user.uid, false);
      } else if (!isBusinessesCleared(user.uid) && (typeof navigator === 'undefined' || navigator.onLine)) {
        ensureDefaultBusiness(user).catch((err) => {
          onError(err instanceof Error ? err : new Error(String(err)));
        });
      }

      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BusinessProfile, 'id'>),
        }))
        .sort((a, b) => {
          if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
          const at = a.createdAt?.toMillis?.() || 0;
          const bt = b.createdAt?.toMillis?.() || 0;
          if (at !== bt) return at - bt;
          return a.name.localeCompare(b.name);
        });

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

export async function addBusiness(
  user: User,
  name: string
): Promise<BusinessProfile> {
  const cleanName = name.trim().slice(0, 140);
  if (!cleanName) {
    throw new Error('Business name is required.');
  }
  const wasCleared = isBusinessesCleared(user.uid);
  setBusinessesCleared(user.uid, false);

  const businessId = generateSafeId('biz');
  const path = `businesses/${businessId}`;

  await commitOfflineSafe(
    setDoc(doc(db, 'businesses', businessId), {
      userId: user.uid,
      name: cleanName,
      isDefault: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    OperationType.CREATE,
    path
  );

  if (wasCleared) {
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', user.uid));
      if (settingsSnap.exists()) {
        await commitOfflineSafe(
          updateDoc(doc(db, 'settings', user.uid), {
            businessName: cleanName,
            updatedAt: serverTimestamp(),
          }),
          OperationType.UPDATE,
          `settings/${user.uid}`
        );
      }
    } catch {
      // best-effort sync
    }
  }

  return {
    id: businessId,
    userId: user.uid,
    name: cleanName,
    isDefault: false,
  };
}

export async function renameBusiness(
  user: User,
  business: BusinessProfile,
  newName: string
): Promise<void> {
  const cleanName = newName.trim().slice(0, 140);
  if (!cleanName) {
    throw new Error('Business name is required.');
  }
  const path = `businesses/${business.id}`;
  await commitOfflineSafe(
    updateDoc(doc(db, 'businesses', business.id), {
      name: cleanName,
      updatedAt: serverTimestamp(),
    }),
    OperationType.UPDATE,
    path
  );

  if (business.isDefault) {
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', user.uid));
      if (settingsSnap.exists()) {
        await commitOfflineSafe(
          updateDoc(doc(db, 'settings', user.uid), {
            businessName: cleanName,
            updatedAt: serverTimestamp(),
          }),
          OperationType.UPDATE,
          `settings/${user.uid}`
        );
      }
    } catch {
      // best-effort sync with primary settings document
    }
  }
}

export async function deleteBusiness(
  user: User,
  business: BusinessProfile,
  remainingBusinesses: BusinessProfile[] = []
): Promise<void> {
  if (remainingBusinesses.length === 0) {
    setBusinessesCleared(user.uid, true);
  }

  const path = `businesses/${business.id}`;
  await commitOfflineSafe(
    deleteDoc(doc(db, 'businesses', business.id)),
    OperationType.DELETE,
    path
  );

  const nextName = remainingBusinesses[0]?.name?.trim() || 'EkTally';
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', user.uid));
    if (settingsSnap.exists()) {
      const currentName = (settingsSnap.data() as { businessName?: string })?.businessName;
      if (business.isDefault || currentName === business.name || remainingBusinesses.length === 0) {
        await commitOfflineSafe(
          updateDoc(doc(db, 'settings', user.uid), {
            businessName: nextName.slice(0, 140),
            updatedAt: serverTimestamp(),
          }),
          OperationType.UPDATE,
          `settings/${user.uid}`
        );
      }
    }
  } catch {
    // best-effort sync with primary settings document
  }
}
