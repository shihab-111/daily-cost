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
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/client';
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

export async function addExpenseCategory(
  user: User,
  mode: AppMode,
  label: string
): Promise<ExpenseCategoryItem> {
  const cleanLabel = label.trim().slice(0, 60);
  const key = generateCategoryKey(cleanLabel);
  const catId = generateSafeId('cat');
  const path = `expenseCategories/${catId}`;

  try {
    await setDoc(doc(db, 'expenseCategories', catId), {
      userId: user.uid,
      mode,
      key,
      label: cleanLabel,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    id: catId,
    userId: user.uid,
    mode,
    key,
    label: cleanLabel,
  };
}

export async function deleteExpenseCategory(
  _user: User,
  categoryDocId: string
): Promise<void> {
  const path = `expenseCategories/${categoryDocId}`;
  try {
    await deleteDoc(doc(db, 'expenseCategories', categoryDocId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'expenseCategories');
  }
}
