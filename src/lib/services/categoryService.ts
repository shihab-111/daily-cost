import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { commitOfflineSafe, db, handleFirestoreError, OperationType } from '../firebase/client';
import { AppMode, ExpenseCategoryItem } from '../../types';
import {
  BUSINESS_EXPENSE_CATEGORIES,
  generateCategoryKey,
  generateSafeId,
  PERSONAL_EXPENSE_CATEGORIES,
} from '../utils';

const inFlightSeeds = new Map<string, Promise<void>>();

const DEFAULT_ORDER: Record<string, number> = {
  ...Object.fromEntries(
    Object.keys(BUSINESS_EXPENSE_CATEGORIES).map((k, idx) => [`business:${k}`, idx])
  ),
  ...Object.fromEntries(
    Object.keys(PERSONAL_EXPENSE_CATEGORIES).map((k, idx) => [`personal:${k}`, idx])
  ),
};

function sortCategories(items: ExpenseCategoryItem[]): ExpenseCategoryItem[] {
  return [...items].sort((a, b) => {
    const orderA = DEFAULT_ORDER[`${a.mode}:${a.key}`];
    const orderB = DEFAULT_ORDER[`${b.mode}:${b.key}`];
    if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
    if (orderA !== undefined) return -1;
    if (orderB !== undefined) return 1;
    const timeDiff = (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
    if (timeDiff !== 0) return timeDiff;
    return a.label.localeCompare(b.label);
  });
}

export async function ensureDefaultExpenseCategories(user: User): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const existingPromise = inFlightSeeds.get(user.uid);
  if (existingPromise) return existingPromise;

  const task = (async () => {
    const seedPath = `expenseCategorySeeds/${user.uid}`;
    const seedRef = doc(db, 'expenseCategorySeeds', user.uid);
    let alreadySeeded = false;
    try {
      const seedSnap = await getDoc(seedRef);
      alreadySeeded = seedSnap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, seedPath);
    }

    if (alreadySeeded) return;

    const existingKeys = new Set<string>();
    try {
      const existingSnap = await getDocs(
        query(collection(db, 'expenseCategories'), where('userId', '==', user.uid))
      );
      existingSnap.forEach((d) => {
        const data = d.data() as Partial<ExpenseCategoryItem>;
        if (data.mode && data.key) {
          existingKeys.add(`${data.mode}:${data.key}`);
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'expenseCategories');
    }

    const batch = writeBatch(db);
    const defaultEntries: Array<{ mode: AppMode; key: string; label: string }> = [
      ...Object.entries(BUSINESS_EXPENSE_CATEGORIES).map(([key, label]) => ({
        mode: 'business' as const,
        key,
        label,
      })),
      ...Object.entries(PERSONAL_EXPENSE_CATEGORIES).map(([key, label]) => ({
        mode: 'personal' as const,
        key,
        label,
      })),
    ];

    for (const item of defaultEntries) {
      if (existingKeys.has(`${item.mode}:${item.key}`)) continue;
      const docId = `${user.uid}_${item.mode}_${item.key}`.slice(0, 128);
      batch.set(doc(db, 'expenseCategories', docId), {
        userId: user.uid,
        mode: item.mode,
        key: item.key,
        label: item.label,
        photoUrl: '',
        quantity: 0,
        unitPrice: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(seedRef, {
      userId: user.uid,
      seeded: true,
      createdAt: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'expenseCategories');
    }
  })().finally(() => {
    inFlightSeeds.delete(user.uid);
  });

  inFlightSeeds.set(user.uid, task);
  return task;
}

export function subscribeExpenseCategories(
  user: User,
  onData: (items: ExpenseCategoryItem[]) => void,
  onError: (err: Error) => void
): () => void {
  ensureDefaultExpenseCategories(user).catch((err) => {
    onError(err instanceof Error ? err : new Error(String(err)));
  });

  const path = 'expenseCategories';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ExpenseCategoryItem, 'id'>),
      }));
      onData(sortCategories(list));
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

export interface ExpenseCategoryOptions {
  photoUrl?: string;
  quantity?: number;
  unitPrice?: number;
}

export async function addExpenseCategory(
  user: User,
  mode: AppMode,
  label: string,
  options?: ExpenseCategoryOptions
): Promise<ExpenseCategoryItem> {
  const cleanLabel = label.trim().slice(0, 60);
  const key = generateCategoryKey(cleanLabel);
  const catId = generateSafeId('cat');
  const path = `expenseCategories/${catId}`;

  const photoUrl = (options?.photoUrl || '').slice(0, 80000);
  const quantity = Math.max(0, Math.min(9999999, Math.round((options?.quantity ?? 0) * 100) / 100));
  const unitPrice = Math.max(
    0,
    Math.min(999999999, Math.round((options?.unitPrice ?? 0) * 100) / 100)
  );

  await commitOfflineSafe(
    setDoc(doc(db, 'expenseCategories', catId), {
      userId: user.uid,
      mode,
      key,
      label: cleanLabel,
      photoUrl,
      quantity,
      unitPrice,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    OperationType.CREATE,
    path
  );

  return {
    id: catId,
    userId: user.uid,
    mode,
    key,
    label: cleanLabel,
    photoUrl,
    quantity,
    unitPrice,
  };
}

export async function updateExpenseCategory(
  _user: User,
  categoryDocId: string,
  updates: {
    label?: string;
    photoUrl?: string;
    quantity?: number;
    unitPrice?: number;
  }
): Promise<void> {
  const path = `expenseCategories/${categoryDocId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.label !== undefined && updates.label.trim().length > 0) {
    payload.label = updates.label.trim().slice(0, 60);
  }
  if (updates.photoUrl !== undefined) {
    payload.photoUrl = updates.photoUrl.slice(0, 80000);
  }
  if (updates.quantity !== undefined) {
    payload.quantity = Math.max(
      0,
      Math.min(9999999, Math.round((Number(updates.quantity) || 0) * 100) / 100)
    );
  }
  if (updates.unitPrice !== undefined) {
    payload.unitPrice = Math.max(
      0,
      Math.min(999999999, Math.round((Number(updates.unitPrice) || 0) * 100) / 100)
    );
  }

  await commitOfflineSafe(
    updateDoc(doc(db, 'expenseCategories', categoryDocId), payload),
    OperationType.UPDATE,
    path
  );
}

export async function deleteExpenseCategory(
  _user: User,
  categoryDocId: string
): Promise<void> {
  const path = `expenseCategories/${categoryDocId}`;
  await commitOfflineSafe(
    deleteDoc(doc(db, 'expenseCategories', categoryDocId)),
    OperationType.DELETE,
    path
  );
}

export async function restoreDefaultExpenseCategories(
  user: User,
  mode: AppMode,
  existingKeys: Set<string>
): Promise<void> {
  const defaults =
    mode === 'business' ? BUSINESS_EXPENSE_CATEGORIES : PERSONAL_EXPENSE_CATEGORIES;
  const missing = Object.entries(defaults).filter(([k]) => !existingKeys.has(k));
  if (missing.length === 0) return;

  const batch = writeBatch(db);
  for (const [key, label] of missing) {
    const docId = `${user.uid}_${mode}_${key}`.slice(0, 128);
    batch.set(doc(db, 'expenseCategories', docId), {
      userId: user.uid,
      mode,
      key,
      label,
      photoUrl: '',
      quantity: 0,
      unitPrice: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await commitOfflineSafe(batch.commit(), OperationType.WRITE, 'expenseCategories');
}
