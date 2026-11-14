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
import { db, handleFirestoreError, OperationType } from '../firebase/client';
import { Customer } from '../../types';
import { CustomerFormValues } from '../validators/schemas';
import { generateSafeId } from '../utils';
import { logActivity } from './activityService';

export function subscribeCustomers(
  user: User,
  onData: (customers: Customer[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'customers';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Customer, 'id'>),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
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

export async function saveCustomer(
  user: User,
  values: CustomerFormValues,
  existing?: Customer,
  businessId?: string
): Promise<string> {
  const customerId = existing ? existing.id : generateSafeId('cst');
  const path = `customers/${customerId}`;

  const resolvedBusinessId = (
    businessId !== undefined ? businessId : existing?.businessId || ''
  ).slice(0, 128);

  const payloadBase = {
    businessId: resolvedBusinessId,
    name: values.name.trim().slice(0, 140),
    phone: values.phone.trim().slice(0, 20),
    email: values.email.trim().slice(0, 140),
    address: values.address.trim().slice(0, 240),
    district: values.district.trim().slice(0, 80) || 'Dhaka',
    notes: values.notes.trim().slice(0, 1000),
    totalOrders: existing ? existing.totalOrders : 0,
    totalSpent: existing ? existing.totalSpent : 0,
    lastOrderDate: existing ? existing.lastOrderDate : '',
  };

  if (!existing) {
    try {
      await setDoc(doc(db, 'customers', customerId), {
        ...payloadBase,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(doc(db, 'customers', customerId), {
        ...payloadBase,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  await logActivity(user, {
    mode: 'business',
    businessId: resolvedBusinessId,
    action: existing ? 'customer_updated' : 'customer_created',
    summary: `${existing ? 'Updated' : 'Added'} customer: ${payloadBase.name} (${payloadBase.phone})`,
    entityType: 'customer',
    entityId: customerId,
    amount: 0,
    currency: 'BDT',
  });

  return customerId;
}

export async function incrementCustomerOrderMetrics(
  customer: Customer,
  orderAmount: number,
  orderDate: string
): Promise<void> {
  const path = `customers/${customer.id}`;
  try {
    await updateDoc(doc(db, 'customers', customer.id), {
      totalOrders: Math.min(999999, (customer.totalOrders || 0) + 1),
      totalSpent: Math.min(
        999999999,
        Math.round(((customer.totalSpent || 0) + Math.max(0, orderAmount)) * 100) / 100
      ),
      lastOrderDate: orderDate.slice(0, 10),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCustomer(user: User, customer: Customer): Promise<void> {
  const path = `customers/${customer.id}`;
  try {
    await deleteDoc(doc(db, 'customers', customer.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }

  await logActivity(user, {
    mode: 'business',
    businessId: customer.businessId || '',
    action: 'customer_deleted',
    summary: `Removed customer: ${customer.name} (${customer.phone})`,
    entityType: 'customer',
    entityId: customer.id,
    amount: 0,
    currency: 'BDT',
  });
}
