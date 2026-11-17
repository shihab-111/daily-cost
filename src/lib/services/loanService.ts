import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { commitOfflineSafe, db, handleFirestoreError, OperationType } from '../firebase/client';
import { PersonalLoan } from '../../types';
import { PersonalLoanFormValues } from '../validators/schemas';
import { generateSafeId } from '../utils';
import { logActivity } from './activityService';

export function subscribePersonalLoans(
  user: User,
  onData: (loans: PersonalLoan[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'personalLoans';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PersonalLoan, 'id'>),
        }))
        .sort((a, b) => {
          const cmp = b.date.localeCompare(a.date);
          if (cmp !== 0) return cmp;
          const at = a.createdAt?.toMillis?.() || 0;
          const bt = b.createdAt?.toMillis?.() || 0;
          if (at !== bt) return bt - at;
          return a.personName.localeCompare(b.personName);
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

export async function savePersonalLoan(
  user: User,
  values: PersonalLoanFormValues,
  existing?: PersonalLoan
): Promise<string> {
  const loanId = existing ? existing.id : generateSafeId('lon');
  const path = `personalLoans/${loanId}`;

  const clampMoney = (n: number) =>
    Math.max(0, Math.min(999999999, Math.round((Number(n) || 0) * 100) / 100));

  const amount = clampMoney(values.amount);
  const paidAmount = Math.min(amount, clampMoney(values.paidAmount));
  const personName = values.personName.trim().slice(0, 140) || 'Unnamed Person';

  const payloadBase = {
    direction: values.direction,
    personName,
    phone: values.phone.trim().slice(0, 40),
    amount,
    paidAmount,
    currency: values.currency,
    date: values.date,
    dueDate: values.dueDate.trim().slice(0, 10),
    notes: values.notes.trim().slice(0, 1000),
  };

  if (!existing) {
    await commitOfflineSafe(
      setDoc(doc(db, 'personalLoans', loanId), {
        ...payloadBase,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      OperationType.CREATE,
      path
    );
  } else {
    await commitOfflineSafe(
      updateDoc(doc(db, 'personalLoans', loanId), {
        ...payloadBase,
        updatedAt: serverTimestamp(),
      }),
      OperationType.UPDATE,
      path
    );
  }

  const directionLabel = values.direction === 'given' ? 'Lent to' : 'Borrowed from';
  await logActivity(user, {
    mode: 'personal',
    businessId: '',
    action: existing ? 'loan_updated' : 'loan_created',
    summary: `${existing ? 'Updated' : directionLabel} ${personName} (${amount} ${payloadBase.currency})`,
    entityType: 'loan',
    entityId: loanId,
    amount,
    currency: payloadBase.currency,
  });

  return loanId;
}

export async function saveMultiplePersonalLoans(
  user: User,
  entries: PersonalLoanFormValues[]
): Promise<string[]> {
  const ids: string[] = [];
  for (const entry of entries) {
    const id = await savePersonalLoan(user, entry);
    ids.push(id);
  }
  return ids;
}

export async function deletePersonalLoan(
  user: User,
  loan: PersonalLoan
): Promise<void> {
  const path = `personalLoans/${loan.id}`;
  await commitOfflineSafe(
    deleteDoc(doc(db, 'personalLoans', loan.id)),
    OperationType.DELETE,
    path
  );

  await logActivity(user, {
    mode: 'personal',
    businessId: '',
    action: 'loan_deleted',
    summary: `Deleted personal loan (${loan.direction === 'given' ? 'Lent to' : 'Borrowed from'} ${loan.personName})`,
    entityType: 'loan',
    entityId: loan.id,
    amount: loan.amount || 0,
    currency: loan.currency || 'BDT',
  });
}
