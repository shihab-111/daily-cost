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
import { BusinessPartner } from '../../types';
import { BusinessPartnerFormValues } from '../validators/schemas';
import { generateSafeId } from '../utils';
import { logActivity } from './activityService';

export function subscribeBusinessPartners(
  user: User,
  onData: (partners: BusinessPartner[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'businessPartners';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BusinessPartner, 'id'>),
        }))
        .sort((a, b) => {
          const at = a.createdAt?.toMillis?.() || 0;
          const bt = b.createdAt?.toMillis?.() || 0;
          if (at !== bt) return bt - at;
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

export async function saveBusinessPartner(
  user: User,
  values: BusinessPartnerFormValues,
  existing?: BusinessPartner,
  businessId?: string
): Promise<string> {
  const partnerId = existing ? existing.id : generateSafeId('prt');
  const path = `businessPartners/${partnerId}`;

  const resolvedBusinessId = (
    businessId !== undefined ? businessId : existing?.businessId || ''
  ).slice(0, 128);

  const clampMoney = (n: number) =>
    Math.max(0, Math.min(999999999, Math.round((Number(n) || 0) * 100) / 100));

  const payloadBase = {
    businessId: resolvedBusinessId,
    name: values.name.trim().slice(0, 140),
    phone: values.phone.trim().slice(0, 40),
    sharePercent: Math.max(0, Math.min(100, Math.round((Number(values.sharePercent) || 0) * 100) / 100)),
    investedAmount: clampMoney(values.investedAmount),
    dueAmount: clampMoney(values.dueAmount),
    currency: values.currency,
    notes: values.notes.trim().slice(0, 1000),
  };

  if (!existing) {
    await commitOfflineSafe(
      setDoc(doc(db, 'businessPartners', partnerId), {
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
      updateDoc(doc(db, 'businessPartners', partnerId), {
        ...payloadBase,
        updatedAt: serverTimestamp(),
      }),
      OperationType.UPDATE,
      path
    );
  }

  await logActivity(user, {
    mode: 'business',
    businessId: resolvedBusinessId,
    action: existing ? 'partner_updated' : 'partner_created',
    summary: `${existing ? 'Updated' : 'Added'} partner ${payloadBase.name} (Invest: ${payloadBase.investedAmount}, Due: ${payloadBase.dueAmount})`,
    entityType: 'partner',
    entityId: partnerId,
    amount: payloadBase.investedAmount,
    currency: payloadBase.currency,
  });

  return partnerId;
}

export async function saveMultipleBusinessPartners(
  user: User,
  entries: BusinessPartnerFormValues[],
  businessId?: string
): Promise<string[]> {
  const ids: string[] = [];
  for (const entry of entries) {
    const id = await saveBusinessPartner(user, entry, undefined, businessId);
    ids.push(id);
  }
  return ids;
}

export async function deleteBusinessPartner(
  user: User,
  partner: BusinessPartner
): Promise<void> {
  const path = `businessPartners/${partner.id}`;
  await commitOfflineSafe(
    deleteDoc(doc(db, 'businessPartners', partner.id)),
    OperationType.DELETE,
    path
  );

  await logActivity(user, {
    mode: 'business',
    businessId: partner.businessId || '',
    action: 'partner_deleted',
    summary: `Removed partner: ${partner.name}`,
    entityType: 'partner',
    entityId: partner.id,
    amount: partner.investedAmount || 0,
    currency: partner.currency || 'BDT',
  });
}
