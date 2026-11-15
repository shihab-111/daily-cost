import { User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { commitOfflineSafe, db, handleFirestoreError, OperationType } from '../firebase/client';
import { ActivityLog, AppMode, CurrencyCode } from '../../types';
import { generateSafeId } from '../utils';

export async function logActivity(
  user: User,
  entry: {
    mode: AppMode;
    businessId?: string;
    action: ActivityLog['action'];
    summary: string;
    entityType: ActivityLog['entityType'];
    entityId: string;
    amount: number;
    currency: CurrencyCode;
  }
): Promise<void> {
  const logId = generateSafeId('log');
  const path = `activityLogs/${logId}`;
  await commitOfflineSafe(
    setDoc(doc(db, 'activityLogs', logId), {
      userId: user.uid,
      actorEmail: (user.email || 'user@bd-ledger.local').slice(0, 254),
      businessId: (entry.mode === 'business' ? entry.businessId || '' : '').slice(0, 128),
      mode: entry.mode,
      action: entry.action,
      summary: entry.summary.trim().slice(0, 240) || 'Updated record',
      entityType: entry.entityType,
      entityId: entry.entityId,
      amount: Math.max(0, Math.min(999999999, Number(entry.amount) || 0)),
      currency: entry.currency,
      createdAt: serverTimestamp(),
    }),
    OperationType.CREATE,
    path
  );
}

export function subscribeActivityLogs(
  user: User,
  onData: (logs: ActivityLog[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'activityLogs';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ActivityLog, 'id'>),
        }))
        .sort((a, b) => {
          const at = a.createdAt?.toMillis?.() || 0;
          const bt = b.createdAt?.toMillis?.() || 0;
          return bt - at;
        })
        .slice(0, 30);
      onData(items);
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
