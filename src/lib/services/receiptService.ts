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
import { AppMode, CustomerReceipt, ReceiptTemplate } from '../../types';
import { CustomerReceiptFormValues, ReceiptTemplateFormValues } from '../validators/schemas';
import { generateSafeId } from '../utils';
import { logActivity } from './activityService';

export function subscribeReceiptTemplate(
  user: User,
  onData: (template: ReceiptTemplate | null) => void,
  onError: (err: Error) => void
): () => void {
  const path = `receiptTemplates/${user.uid}`;
  return onSnapshot(
    doc(db, 'receiptTemplates', user.uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData({ id: snap.id, ...(snap.data() as Omit<ReceiptTemplate, 'id'>) });
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

export async function saveReceiptTemplate(
  user: User,
  values: ReceiptTemplateFormValues,
  hasExisting: boolean
): Promise<void> {
  const path = `receiptTemplates/${user.uid}`;
  const hexOr = (val: string, fallback: string) =>
    /^#[0-9a-fA-F]{6}$/.test(val) ? val : fallback;

  const payload = {
    userId: user.uid,
    businessName: values.businessName.trim().slice(0, 140) || 'My BD Business',
    businessTagline: values.businessTagline.trim().slice(0, 160),
    businessPhone: values.businessPhone.trim().slice(0, 40),
    businessAddress: values.businessAddress.trim().slice(0, 240),
    memoTitle: values.memoTitle.trim().slice(0, 60) || 'Invoice',
    logoType: values.logoType,
    logoText: (values.logoText || 'BD').trim().slice(0, 8),
    logoDataUrl: (values.logoDataUrl || '').slice(0, 80000),
    logoSize: values.logoSize,
    logoPosition: values.logoPosition,
    textStyle: values.textStyle,
    fontSizeScale: values.fontSizeScale,
    accentColor: hexOr(values.accentColor, '#16a34a'),
    headerBgColor: hexOr(values.headerBgColor, '#ffffff'),
    paperStyle: values.paperStyle,
    footerNote: values.footerNote.trim().slice(0, 400),
    updatedAt: serverTimestamp(),
  };

  if (!hasExisting) {
    try {
      await setDoc(doc(db, 'receiptTemplates', user.uid), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(doc(db, 'receiptTemplates', user.uid), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export function subscribeCustomerReceipts(
  user: User,
  onData: (receipts: CustomerReceipt[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'customerReceipts';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CustomerReceipt, 'id'>),
        }))
        .sort((a, b) => {
          const cmp = b.issueDate.localeCompare(a.issueDate);
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

export async function saveCustomerReceipt(
  user: User,
  values: CustomerReceiptFormValues,
  existing?: CustomerReceipt,
  activeMode: AppMode = 'business'
): Promise<string> {
  const receiptId = existing ? existing.id : generateSafeId('rcp');
  const path = `customerReceipts/${receiptId}`;

  const sanitizedItems = values.items.slice(0, 30).map((item) => {
    const qty = Math.max(1, Math.min(99999, Number(item.qty) || 1));
    const unitPrice = Math.max(
      0,
      Math.min(999999999, Math.round((Number(item.unitPrice) || 0) * 100) / 100)
    );
    const total = Math.max(
      0,
      Math.min(999999999, Math.round(qty * unitPrice * 100) / 100)
    );
    return {
      name: item.name.trim().slice(0, 160) || 'Item',
      sku: (item.sku || '').trim().slice(0, 60),
      qty,
      unitPrice,
      total,
    };
  });

  const cleanNumber =
    values.receiptNumber
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 50) || `INV-${Date.now()}`;

  const clampMoney = (n: number) =>
    Math.max(0, Math.min(999999999, Math.round((Number(n) || 0) * 100) / 100));

  const hexOr = (val: string, fallback: string) =>
    /^#[0-9a-fA-F]{6}$/.test(val) ? val : fallback;

  const payloadBase = {
    receiptNumber: cleanNumber,
    issueDate: values.issueDate,
    issueTime: (values.issueTime || '').trim().slice(0, 30),
    memoTitle: values.memoTitle.trim().slice(0, 60) || 'Invoice',
    status: values.status,
    paymentMethod: values.paymentMethod,
    businessName: values.businessName.trim().slice(0, 140) || 'My BD Business',
    businessTagline: values.businessTagline.trim().slice(0, 160),
    businessPhone: values.businessPhone.trim().slice(0, 40),
    businessAddress: values.businessAddress.trim().slice(0, 240),
    logoType: values.logoType,
    logoText: (values.logoText || 'BD').trim().slice(0, 8),
    logoDataUrl: (values.logoDataUrl || '').slice(0, 80000),
    logoSize: values.logoSize,
    logoPosition: values.logoPosition,
    textStyle: values.textStyle,
    fontSizeScale: values.fontSizeScale,
    accentColor: hexOr(values.accentColor, '#16a34a'),
    headerBgColor: hexOr(values.headerBgColor, '#ffffff'),
    paperStyle: values.paperStyle,
    customerName: values.customerName.trim().slice(0, 140),
    customerPhone: values.customerPhone.trim().slice(0, 40),
    customerEmail: values.customerEmail.trim().slice(0, 140),
    customerAddress: values.customerAddress.trim().slice(0, 240),
    customerDistrict: values.customerDistrict.trim().slice(0, 80) || 'Dhaka',
    deliveryZone: values.deliveryZone,
    courierName: values.courierName.trim().slice(0, 80),
    items: sanitizedItems,
    currency: values.currency,
    subtotal: clampMoney(values.subtotal),
    deliveryCharge: clampMoney(values.deliveryCharge),
    discountAmount: clampMoney(values.discountAmount),
    vatPercent: Math.max(0, Math.min(100, Number(values.vatPercent) || 0)),
    vatAmount: clampMoney(values.vatAmount),
    grandTotal: clampMoney(values.grandTotal),
    paidAmount: clampMoney(values.paidAmount),
    dueAmount: clampMoney(values.dueAmount),
    footerNote: values.footerNote.trim().slice(0, 400),
  };

  if (!existing) {
    try {
      await setDoc(doc(db, 'customerReceipts', receiptId), {
        ...payloadBase,
        userId: user.uid,
        userEmail: (user.email || 'user@bd-ledger.local').slice(0, 254),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }

    await logActivity(user, {
      mode: activeMode,
      action: 'receipt_created',
      summary: `Generated ${payloadBase.memoTitle} ${payloadBase.receiptNumber} for ${payloadBase.customerName}`,
      entityType: 'receipt',
      entityId: receiptId,
      amount: payloadBase.grandTotal,
      currency: payloadBase.currency,
    });
  } else {
    try {
      await updateDoc(doc(db, 'customerReceipts', receiptId), {
        ...payloadBase,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return receiptId;
}

export async function deleteCustomerReceipt(
  user: User,
  receipt: CustomerReceipt,
  activeMode: AppMode = 'business'
): Promise<void> {
  const path = `customerReceipts/${receipt.id}`;
  try {
    await deleteDoc(doc(db, 'customerReceipts', receipt.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }

  await logActivity(user, {
    mode: activeMode,
    action: 'receipt_deleted',
    summary: `Deleted receipt ${receipt.receiptNumber} (${receipt.customerName})`,
    entityType: 'receipt',
    entityId: receipt.id,
    amount: receipt.grandTotal,
    currency: receipt.currency,
  });
}
