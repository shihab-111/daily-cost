import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { UserProfileData } from '../../types';
import { commitOfflineSafe, db, handleFirestoreError, OperationType } from '../firebase/client';

export function subscribeUserProfile(
  user: User,
  onData: (profile: UserProfileData | null) => void,
  onError: (err: Error) => void
): () => void {
  const path = `userProfiles/${user.uid}`;
  return onSnapshot(
    doc(db, 'userProfiles', user.uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData({ id: snap.id, ...(snap.data() as Omit<UserProfileData, 'id'>) });
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function saveUserProfile(
  user: User,
  values: { displayName: string; photoUrl: string },
  hasExisting?: boolean
): Promise<void> {
  const path = `userProfiles/${user.uid}`;
  const profileRef = doc(db, 'userProfiles', user.uid);
  const displayName = values.displayName.trim().slice(0, 120);
  const photoUrl = (values.photoUrl || '').slice(0, 80000);

  let exists = hasExisting;
  if (exists === undefined) {
    try {
      const snap = await getDoc(profileRef);
      exists = snap.exists();
    } catch {
      exists = false;
    }
  }

  if (!exists) {
    await commitOfflineSafe(
      setDoc(profileRef, {
        userId: user.uid,
        displayName,
        photoUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      OperationType.CREATE,
      path
    );
  } else {
    await commitOfflineSafe(
      updateDoc(profileRef, {
        displayName,
        photoUrl,
        updatedAt: serverTimestamp(),
      }),
      OperationType.UPDATE,
      path
    );
  }

  // Best-effort sync to settings.ownerName and userDirectory.displayName
  try {
    const settingsRef = doc(db, 'settings', user.uid);
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      await commitOfflineSafe(
        updateDoc(settingsRef, {
          ownerName: displayName,
          updatedAt: serverTimestamp(),
        }),
        OperationType.UPDATE,
        `settings/${user.uid}`
      );
    }
  } catch {
    // Non-fatal if offline or settings not yet created
  }

  try {
    const dirRef = doc(db, 'userDirectory', user.uid);
    const dirSnap = await getDoc(dirRef);
    if (dirSnap.exists()) {
      const data = dirSnap.data() as { loginCount?: number };
      const count = typeof data.loginCount === 'number' && data.loginCount >= 1 ? data.loginCount : 1;
      await commitOfflineSafe(
        updateDoc(dirRef, {
          displayName,
          loginCount: count,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        OperationType.UPDATE,
        `userDirectory/${user.uid}`
      );
    }
  } catch {
    // Non-fatal if userDirectory entry not yet initialized
  }
}
