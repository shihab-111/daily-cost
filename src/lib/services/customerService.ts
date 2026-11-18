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
import { Customer } from '../../types';
import { CustomerFormValues } from '../validators/schemas';
import { generateSafeId, getTodayDhakaDate } from '../utils';
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
  businessId?: string,
  recordOrder?: boolean
): Promise<string> {
  const customerId = existing ? existing.id : generateSafeId('cst');
  const path = `customers/${customerId}`;

  const resolvedBusinessId = (
    businessId !== undefined ? businessId : existing?.businessId || ''
  ).slice(0, 128);

  const quantity = Math.max(0, Math.min(99999, Number(values.quantity) || 0));
  const unitPrice = Math.max(0, Math.min(999999999, Number(values.unitPrice) || 0));
  const orderAmount = Math.round(quantity * unitPrice * 100) / 100;
  const hasOrderInfo = Boolean(values.productName.trim() || orderAmount > 0);
  const shouldIncrementOrder = existing ? Boolean(recordOrder && hasOrderInfo) : hasOrderInfo;

  const baseOrders = existing ? existing.totalOrders || 0 : 0;
  const baseSpent = existing ? existing.totalSpent || 0 : 0;
  const nextOrders = shouldIncrementOrder ? Math.min(999999, baseOrders + 1) : baseOrders;
  const nextSpent = shouldIncrementOrder
    ? Math.min(999999999, Math.round((baseSpent + orderAmount) * 100) / 100)
    : baseSpent;
  const nextLastOrderDate = shouldIncrementOrder
    ? getTodayDhakaDate()
    : existing
    ? existing.lastOrderDate
    : '';

  const itemWeight = Math.max(
    0.1,
    Math.min(500, Math.round((Number(values.itemWeight) || 0.5) * 100) / 100)
  );

  const payloadBase = {
    businessId: resolvedBusinessId,
    name: values.name.trim().slice(0, 140),
    phone: values.phone.trim().slice(0, 20),
    numberOption: values.numberOption,
    email: values.email.trim().slice(0, 140),
    address: values.address.trim().slice(0, 240),
    district: values.district.trim().slice(0, 80) || 'Dhaka',
    zone: (values.zone || '').trim().slice(0, 80),
    area: (values.area || '').trim().slice(0, 80),
    itemType: values.itemType === 'document' ? ('document' as const) : ('parcel' as const),
    storeName: (values.storeName || '').trim().slice(0, 120),
    merchantOrderId: (values.merchantOrderId || '').trim().slice(0, 64),
    itemWeight,
    productName: values.productName.trim().slice(0, 160),
    productSize: values.productSize.trim().slice(0, 40),
    quantity,
    unitPrice,
    orderDetails: values.orderDetails.trim().slice(0, 500),
    notes: values.notes.trim().slice(0, 1000),
    totalOrders: nextOrders,
    totalSpent: nextSpent,
    lastOrderDate: nextLastOrderDate,
  };

  if (!existing) {
    await commitOfflineSafe(
      setDoc(doc(db, 'customers', customerId), {
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
      updateDoc(doc(db, 'customers', customerId), {
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
    action: existing ? 'customer_updated' : 'customer_created',
    summary: `${existing ? 'Updated' : 'Added'} customer: ${payloadBase.name} (${payloadBase.phone})${
      payloadBase.productName ? ` · ${payloadBase.productName}` : ''
    }`,
    entityType: 'customer',
    entityId: customerId,
    amount: shouldIncrementOrder ? orderAmount : 0,
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
  await commitOfflineSafe(
    updateDoc(doc(db, 'customers', customer.id), {
      totalOrders: Math.min(999999, (customer.totalOrders || 0) + 1),
      totalSpent: Math.min(
        999999999,
        Math.round(((customer.totalSpent || 0) + Math.max(0, orderAmount)) * 100) / 100
      ),
      lastOrderDate: orderDate.slice(0, 10),
      updatedAt: serverTimestamp(),
    }),
    OperationType.UPDATE,
    path
  );
}

export async function deleteCustomer(user: User, customer: Customer): Promise<void> {
  const path = `customers/${customer.id}`;
  await commitOfflineSafe(
    deleteDoc(doc(db, 'customers', customer.id)),
    OperationType.DELETE,
    path
  );

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
