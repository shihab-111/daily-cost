import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/client';
import { BusinessProfile } from '../../types';
import { generateSafeId } from '../utils';

const inFlightDefaultEnsure = new Map<string, Promise<void>>();

export function getDefaultBusinessId(uid: string): string {
  return `biz_default_${uid}`;
}

export async function ensureDefaultBusiness(
  user: User,
  defaultName?: string
): Promise<void> {
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
      if (snap.empty) {
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
  const businessId = generateSafeId('biz');
  const path = `businesses/${businessId}`;

  try {
    await setDoc(doc(db, 'businesses', businessId), {
      userId: user.uid,
      name: cleanName,
      isDefault: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
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
  try {
    await updateDoc(doc(db, 'businesses', business.id), {
      name: cleanName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  if (business.isDefault) {
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', user.uid));
      if (settingsSnap.exists()) {
        await updateDoc(doc(db, 'settings', user.uid), {
          businessName: cleanName,
          updatedAt: serverTimestamp(),
        });
      }
    } catch {
      // best-effort sync with primary settings document
    }
  }
}

export async function deleteBusiness(
  _user: User,
  business: BusinessProfile
): Promise<void> {
  if (business.isDefault) {
    throw new Error('Primary business cannot be deleted.');
  }
  const path = `businesses/${business.id}`;
  try {
    await deleteDoc(doc(db, 'businesses', business.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
