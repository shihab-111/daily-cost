import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { commitOfflineSafe, db, handleFirestoreError, OperationType } from '../firebase/client';
import { UserSettings } from '../../types';
import { SettingsFormValues } from '../validators/schemas';
import { ensureDefaultBusiness } from './businessService';

export async function bootstrapUserWorkspace(
  user: User,
  defaults?: { businessName?: string; ownerName?: string }
): Promise<void> {
  const path = `settings/${user.uid}`;
  const settingsRef = doc(db, 'settings', user.uid);
  let exists = false;
  try {
    const snap = await getDoc(settingsRef);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!exists) {
    try {
      await setDoc(settingsRef, {
        userId: user.uid,
        businessName: (defaults?.businessName?.trim() || 'EkTally').slice(0, 140),
        ownerName: (
          defaults?.ownerName?.trim() ||
          user.displayName?.trim() ||
          user.email?.split('@')[0]?.trim() ||
          'Owner'
        ).slice(0, 120),
        currencyCode: 'BDT',
        currencySymbol: '৳',
        lowStockThreshold: 5,
        usdToBdtRate: 120,
        personalMonthlyBudget: 35000,
        address: 'Dhaka, Bangladesh',
        phone: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  await ensureDefaultBusiness(user, defaults?.businessName);
}

export function subscribeSettings(
  user: User,
  onData: (settings: UserSettings | null) => void,
  onError: (err: Error) => void
): () => void {
  const path = `settings/${user.uid}`;
  return onSnapshot(
    doc(db, 'settings', user.uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData({ id: snap.id, ...(snap.data() as Omit<UserSettings, 'id'>) });
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

export async function saveSettings(
  user: User,
  values: SettingsFormValues,
  hasExisting: boolean
): Promise<void> {
  const path = `settings/${user.uid}`;
  const payload = {
    userId: user.uid,
    businessName: values.businessName.trim().slice(0, 140),
    ownerName: values.ownerName.trim().slice(0, 120),
    currencyCode: values.currencyCode,
    currencySymbol: values.currencyCode === 'BDT' ? '৳' : '$',
    lowStockThreshold: Math.max(0, Math.round(values.lowStockThreshold)),
    usdToBdtRate: Math.max(1, Math.round(values.usdToBdtRate * 100) / 100),
    personalMonthlyBudget: Math.max(0, Math.round(values.personalMonthlyBudget * 100) / 100),
    address: values.address.trim().slice(0, 240),
    phone: values.phone.trim().slice(0, 40),
    updatedAt: serverTimestamp(),
  };

  if (!hasExisting) {
    await commitOfflineSafe(
      setDoc(doc(db, 'settings', user.uid), {
        ...payload,
        createdAt: serverTimestamp(),
      }),
      OperationType.CREATE,
      path
    );
  } else {
    await commitOfflineSafe(
      updateDoc(doc(db, 'settings', user.uid), payload),
      OperationType.UPDATE,
      path
    );
  }
}
