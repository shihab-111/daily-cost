import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
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
import { Expense, ReceiptAsset } from '../../types';
import { ExpenseFormValues } from '../validators/schemas';
import { generateSafeId, resolveExpensePayment } from '../utils';
import { logActivity } from './activityService';
import type { StagedAssetInput } from '../firebase/db';

export function subscribeExpenses(
  user: User,
  onData: (items: Expense[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'expenses';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Expense, 'id'>),
        }))
        .sort((a, b) => {
          const cmp = b.date.localeCompare(a.date);
          if (cmp !== 0) return cmp;
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
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

export async function fetchExpenseReceipts(
  expenseId: string,
  user: User
): Promise<ReceiptAsset[]> {
  const path = `expenses/${expenseId}/receipts`;
  try {
    const q = query(
      collection(db, 'expenses', expenseId, 'receipts'),
      where('userId', '==', user.uid)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ReceiptAsset, 'id'>),
      }))
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveExpense(
  user: User,
  values: ExpenseFormValues,
  receipts: StagedAssetInput[],
  removedReceiptIds: string[],
  existing?: Expense,
  businessId?: string
): Promise<string> {
  const expenseId = existing ? existing.id : generateSafeId('exp');
  const path = `expenses/${expenseId}`;
  const thumb =
    receipts.find((r) => r.thumbDataUrl)?.thumbDataUrl ||
    (receipts.length > 0 ? existing?.receiptThumb || '' : '');

  const resolvedBusinessId =
    values.mode === 'business'
      ? (businessId !== undefined ? businessId : existing?.businessId || '').slice(0, 128)
      : '';

  const amountRounded = Math.max(0, Math.round(values.amount * 100) / 100);
  const payment = resolveExpensePayment({
    amount: amountRounded,
    paidAmount: values.paidAmount,
    dueAmount: values.dueAmount,
    paymentStatus: values.paymentStatus,
  });

  const payloadBase = {
    businessId: resolvedBusinessId,
    mode: values.mode,
    title: values.title.trim().slice(0, 200),
    description: values.description.trim().slice(0, 4000),
    category: values.category,
    amount: amountRounded,
    paidAmount: payment.paidAmount,
    dueAmount: payment.dueAmount,
    paymentStatus: payment.paymentStatus,
    quantity: Math.max(0, Math.min(9999999, Math.round((values.quantity || 0) * 100) / 100)),
    unitPrice: Math.max(0, Math.min(999999999, Math.round((values.unitPrice || 0) * 100) / 100)),
    currency: values.currency,
    date: values.date,
    paymentMethod: values.paymentMethod,
    adAccountId: values.adAccountId.trim().slice(0, 120),
    campaignName: values.campaignName.trim().slice(0, 160),
    partnerOrAgency: values.partnerOrAgency.trim().slice(0, 160),
    modelName: values.modelName.trim().slice(0, 120),
    photographerName: values.photographerName.trim().slice(0, 120),
    studioName: values.studioName.trim().slice(0, 120),
    vendorOrCourier: values.vendorOrCourier.trim().slice(0, 160),
    receiptThumb: thumb.slice(0, 80000),
    receiptCount: Math.min(10, receipts.length),
  };

  if (!existing) {
    await commitOfflineSafe(
      setDoc(doc(db, 'expenses', expenseId), {
        ...payloadBase,
        userId: user.uid,
        userEmail: (user.email || 'user@bd-ledger.local').slice(0, 254),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      OperationType.CREATE,
      path
    );
  } else {
    await commitOfflineSafe(
      updateDoc(doc(db, 'expenses', expenseId), {
        ...payloadBase,
        updatedAt: serverTimestamp(),
      }),
      OperationType.UPDATE,
      path
    );
  }

  for (const rid of removedReceiptIds) {
    await commitOfflineSafe(
      deleteDoc(doc(db, 'expenses', expenseId, 'receipts', rid)),
      OperationType.DELETE,
      `${path}/receipts/${rid}`
    );
  }

  for (const asset of receipts.slice(0, 10)) {
    if (asset.isExisting) continue;
    const receiptId = generateSafeId('rcp');
    await commitOfflineSafe(
      setDoc(doc(db, 'expenses', expenseId, 'receipts', receiptId), {
        expenseId,
        userId: user.uid,
        fileName: asset.fileName.slice(0, 200) || 'receipt.jpg',
        mimeType: asset.mimeType,
        width: Math.max(1, Math.min(8000, Math.round(asset.width))),
        height: Math.max(1, Math.min(8000, Math.round(asset.height))),
        sizeBytes: Math.max(1, Math.min(700000, asset.dataUrl.length)),
        dataUrl: asset.dataUrl.slice(0, 700000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      OperationType.CREATE,
      `${path}/receipts/${receiptId}`
    );
  }

  await logActivity(user, {
    mode: values.mode,
    businessId: resolvedBusinessId,
    action: existing ? 'expense_updated' : 'expense_created',
    summary: `${existing ? 'Updated' : 'Logged'} ${values.mode} expense: ${payloadBase.title}`,
    entityType: 'expense',
    entityId: expenseId,
    amount: payloadBase.amount,
    currency: payloadBase.currency,
  });

  return expenseId;
}

export async function updateExpensePayment(
  user: User,
  expense: Expense,
  nextPaidAmount: number
): Promise<void> {
  const path = `expenses/${expense.id}`;
  const payment = resolveExpensePayment({
    amount: expense.amount,
    paidAmount: nextPaidAmount,
  });

  await commitOfflineSafe(
    updateDoc(doc(db, 'expenses', expense.id), {
      paidAmount: payment.paidAmount,
      dueAmount: payment.dueAmount,
      paymentStatus: payment.paymentStatus,
      updatedAt: serverTimestamp(),
    }),
    OperationType.UPDATE,
    path
  );

  const statusNote =
    payment.paymentStatus === 'paid'
      ? 'marked fully paid'
      : payment.paymentStatus === 'partial'
      ? `partial paid (${payment.paidAmount} paid, ${payment.dueAmount} due)`
      : `marked due (${payment.dueAmount} due)`;

  await logActivity(user, {
    mode: expense.mode || 'business',
    businessId: expense.businessId || '',
    action: 'expense_updated',
    summary: `Expense "${expense.title}" ${statusNote}`,
    entityType: 'expense',
    entityId: expense.id,
    amount: payment.paidAmount,
    currency: expense.currency,
  });
}

export async function deleteExpense(user: User, expense: Expense): Promise<void> {
  const receipts = await fetchExpenseReceipts(expense.id, user);
  if (receipts.length > 0) {
    const batch = writeBatch(db);
    for (const r of receipts) {
      batch.delete(doc(db, 'expenses', expense.id, 'receipts', r.id));
    }
    await commitOfflineSafe(
      batch.commit(),
      OperationType.DELETE,
      `expenses/${expense.id}/receipts`
    );
  }

  await commitOfflineSafe(
    deleteDoc(doc(db, 'expenses', expense.id)),
    OperationType.DELETE,
    `expenses/${expense.id}`
  );

  await logActivity(user, {
    mode: expense.mode || 'business',
    businessId: expense.businessId || '',
    action: 'expense_deleted',
    summary: `Deleted expense: ${expense.title}`,
    entityType: 'expense',
    entityId: expense.id,
    amount: expense.amount,
    currency: expense.currency,
  });
}
