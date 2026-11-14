import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, ROOT_ADMIN_EMAIL } from './client';
import {
  ActivityLog,
  AdminUser,
  BusinessSettings,
  CurrencyCode,
  Expense,
  Product,
  ProductPhoto,
  ReceiptAsset,
} from '../../types';
import {
  AdminUserFormValues,
  ExpenseFormValues,
  ProductFormValues,
  SettingsFormValues,
} from '../validators/schemas';
import { generateSafeId } from '../utils';

export interface StagedAssetInput {
  id?: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
  caption?: string;
  width: number;
  height: number;
  sizeBytes: number;
  dataUrl: string;
  thumbDataUrl?: string;
  isExisting?: boolean;
}

/**
 * Clean Adapter Interface:
 * Decouples UI/Hooks from Firestore so the backend can be swapped
 * for a PostgreSQL/MySQL REST API adapter without touching components.
 */
export interface BusinessDataAdapter {
  bootstrapWorkspace(user: User): Promise<void>;
  subscribeExpenses(
    user: User,
    onData: (items: Expense[]) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeProducts(
    user: User,
    onData: (items: Product[]) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeSettings(
    onData: (settings: BusinessSettings | null) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeActivityLogs(
    user: User,
    onData: (logs: ActivityLog[]) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeAdmins(
    user: User,
    onData: (admins: AdminUser[]) => void,
    onError: (err: Error) => void
  ): () => void;
  fetchExpenseReceipts(expenseId: string, user: User): Promise<ReceiptAsset[]>;
  saveExpense(
    user: User,
    values: ExpenseFormValues,
    receipts: StagedAssetInput[],
    removedReceiptIds: string[],
    existing?: Expense
  ): Promise<string>;
  deleteExpense(user: User, expense: Expense): Promise<void>;
  fetchProductPhotos(productId: string, user: User): Promise<ProductPhoto[]>;
  saveProduct(
    user: User,
    values: ProductFormValues,
    photos: StagedAssetInput[],
    removedPhotoIds: string[],
    existing?: Product
  ): Promise<string>;
  adjustProductStock(user: User, product: Product, newStockQty: number): Promise<void>;
  deleteProduct(user: User, product: Product): Promise<void>;
  saveSettings(user: User, values: SettingsFormValues, hasExisting: boolean): Promise<void>;
  saveAdmin(user: User, values: AdminUserFormValues, isUpdate: boolean): Promise<void>;
  deleteAdmin(uid: string): Promise<void>;
}

async function logActivity(
  user: User,
  entry: {
    action: ActivityLog['action'];
    summary: string;
    entityType: ActivityLog['entityType'];
    entityId: string;
    amount: number;
    currency: CurrencyCode;
  }
) {
  const logId = generateSafeId('log');
  const path = `activityLogs/${logId}`;
  try {
    await setDoc(doc(db, 'activityLogs', logId), {
      action: entry.action,
      summary: entry.summary.trim().slice(0, 240) || 'Updated record',
      entityType: entry.entityType,
      entityId: entry.entityId,
      amount: Math.max(0, Math.min(999999999, Number(entry.amount) || 0)),
      currency: entry.currency,
      actorUid: user.uid,
      actorEmail: (user.email || ROOT_ADMIN_EMAIL).slice(0, 254),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

class FirestoreBusinessAdapter implements BusinessDataAdapter {
  async bootstrapWorkspace(user: User): Promise<void> {
    if (user.email !== ROOT_ADMIN_EMAIL) return;

    const adminRef = doc(db, 'admins', user.uid);
    try {
      const snap = await getDoc(adminRef);
      if (!snap.exists()) {
        await setDoc(adminRef, {
          uid: user.uid,
          email: (user.email || ROOT_ADMIN_EMAIL).slice(0, 254),
          displayName: (user.displayName || 'BD Admin Owner').slice(0, 120),
          role: 'owner',
          active: true,
          addedBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${user.uid}`);
    }

    const settingsRef = doc(db, 'settings', 'workspace');
    try {
      const snap = await getDoc(settingsRef);
      if (!snap.exists()) {
        await setDoc(settingsRef, {
          businessName: 'Meridian BD Ops',
          ownerName: (user.displayName || 'Business Owner').slice(0, 120),
          currencyCode: 'BDT',
          currencySymbol: '৳',
          lowStockThreshold: 5,
          usdToBdtRate: 120,
          address: 'Dhaka, Bangladesh',
          phone: '',
          updatedBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/workspace');
    }
  }

  subscribeExpenses(
    user: User,
    onData: (items: Expense[]) => void,
    onError: (err: Error) => void
  ): () => void {
    const path = 'expenses';
    const baseRef = collection(db, path);
    const q =
      user.email === ROOT_ADMIN_EMAIL
        ? query(baseRef, orderBy('date', 'desc'))
        : query(baseRef, where('authorUid', '==', user.uid), orderBy('date', 'desc'));

    return onSnapshot(
      q,
      (snap) => {
        onData(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Expense, 'id'>),
          }))
        );
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

  subscribeProducts(
    user: User,
    onData: (items: Product[]) => void,
    onError: (err: Error) => void
  ): () => void {
    const path = 'products';
    const baseRef = collection(db, path);
    const q =
      user.email === ROOT_ADMIN_EMAIL
        ? query(baseRef, orderBy('updatedAt', 'desc'))
        : query(baseRef, where('authorUid', '==', user.uid), orderBy('updatedAt', 'desc'));

    return onSnapshot(
      q,
      (snap) => {
        onData(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Product, 'id'>),
          }))
        );
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

  subscribeSettings(
    onData: (settings: BusinessSettings | null) => void,
    onError: (err: Error) => void
  ): () => void {
    const path = 'settings/workspace';
    return onSnapshot(
      doc(db, 'settings', 'workspace'),
      (snap) => {
        if (!snap.exists()) {
          onData(null);
          return;
        }
        onData({ id: snap.id, ...(snap.data() as Omit<BusinessSettings, 'id'>) });
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

  subscribeActivityLogs(
    user: User,
    onData: (logs: ActivityLog[]) => void,
    onError: (err: Error) => void
  ): () => void {
    const path = 'activityLogs';
    const baseRef = collection(db, path);
    const q =
      user.email === ROOT_ADMIN_EMAIL
        ? query(baseRef, orderBy('createdAt', 'desc'), limit(25))
        : query(
            baseRef,
            where('actorUid', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(25)
          );

    return onSnapshot(
      q,
      (snap) => {
        onData(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ActivityLog, 'id'>),
          }))
        );
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

  subscribeAdmins(
    user: User,
    onData: (admins: AdminUser[]) => void,
    onError: (err: Error) => void
  ): () => void {
    const path = 'admins';
    const baseRef = collection(db, path);
    const q =
      user.email === ROOT_ADMIN_EMAIL
        ? query(baseRef, orderBy('createdAt', 'asc'))
        : query(baseRef, where('uid', '==', user.uid));

    return onSnapshot(
      q,
      (snap) => {
        onData(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AdminUser, 'id'>),
          }))
        );
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

  async fetchExpenseReceipts(expenseId: string, user: User): Promise<ReceiptAsset[]> {
    const path = `expenses/${expenseId}/receipts`;
    try {
      const baseRef = collection(db, 'expenses', expenseId, 'receipts');
      const q =
        user.email === ROOT_ADMIN_EMAIL
          ? query(baseRef, orderBy('createdAt', 'asc'))
          : query(baseRef, where('authorUid', '==', user.uid), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ReceiptAsset, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async saveExpense(
    user: User,
    values: ExpenseFormValues,
    receipts: StagedAssetInput[],
    removedReceiptIds: string[],
    existing?: Expense
  ): Promise<string> {
    const expenseId = existing ? existing.id : generateSafeId('exp');
    const path = `expenses/${expenseId}`;
    const thumb =
      receipts.find((r) => r.thumbDataUrl)?.thumbDataUrl ||
      (receipts.length > 0 ? existing?.receiptThumb || '' : '');

    const payloadBase = {
      title: values.title.trim().slice(0, 200),
      description: values.description.trim().slice(0, 4000),
      category: values.category,
      amount: Math.round(values.amount * 100) / 100,
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
      try {
        await setDoc(doc(db, 'expenses', expenseId), {
          ...payloadBase,
          authorUid: user.uid,
          authorEmail: (user.email || ROOT_ADMIN_EMAIL).slice(0, 254),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      try {
        await updateDoc(doc(db, 'expenses', expenseId), {
          ...payloadBase,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }

    for (const rid of removedReceiptIds) {
      try {
        await deleteDoc(doc(db, 'expenses', expenseId, 'receipts', rid));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${path}/receipts/${rid}`);
      }
    }

    for (const asset of receipts.slice(0, 10)) {
      if (asset.isExisting) continue;
      const receiptId = generateSafeId('rcp');
      try {
        await setDoc(doc(db, 'expenses', expenseId, 'receipts', receiptId), {
          expenseId,
          fileName: asset.fileName.slice(0, 200) || 'receipt.jpg',
          mimeType: asset.mimeType,
          width: Math.max(1, Math.min(8000, Math.round(asset.width))),
          height: Math.max(1, Math.min(8000, Math.round(asset.height))),
          sizeBytes: Math.max(1, Math.min(700000, asset.dataUrl.length)),
          dataUrl: asset.dataUrl.slice(0, 700000),
          authorUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `${path}/receipts/${receiptId}`);
      }
    }

    await logActivity(user, {
      action: existing ? 'expense_updated' : 'expense_created',
      summary: `${existing ? 'Updated' : 'Logged'} expense: ${payloadBase.title}`,
      entityType: 'expense',
      entityId: expenseId,
      amount: payloadBase.amount,
      currency: payloadBase.currency,
    });

    return expenseId;
  }

  async deleteExpense(user: User, expense: Expense): Promise<void> {
    const receipts = await this.fetchExpenseReceipts(expense.id, user);
    if (receipts.length > 0) {
      const batch = writeBatch(db);
      for (const r of receipts) {
        batch.delete(doc(db, 'expenses', expense.id, 'receipts', r.id));
      }
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `expenses/${expense.id}/receipts`);
      }
    }

    try {
      await deleteDoc(doc(db, 'expenses', expense.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${expense.id}`);
    }

    await logActivity(user, {
      action: 'expense_deleted',
      summary: `Deleted expense: ${expense.title}`,
      entityType: 'expense',
      entityId: expense.id,
      amount: expense.amount,
      currency: expense.currency,
    });
  }

  async fetchProductPhotos(productId: string, user: User): Promise<ProductPhoto[]> {
    const path = `products/${productId}/photos`;
    try {
      const baseRef = collection(db, 'products', productId, 'photos');
      const q =
        user.email === ROOT_ADMIN_EMAIL
          ? query(baseRef, orderBy('createdAt', 'asc'))
          : query(baseRef, where('authorUid', '==', user.uid), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProductPhoto, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  async saveProduct(
    user: User,
    values: ProductFormValues,
    photos: StagedAssetInput[],
    removedPhotoIds: string[],
    existing?: Product
  ): Promise<string> {
    const productId = existing ? existing.id : generateSafeId('prd');
    const path = `products/${productId}`;

    const thumb =
      photos.find((p) => p.thumbDataUrl)?.thumbDataUrl ||
      (photos.length > 0 ? existing?.thumbnailUrl || '' : '');

    const payloadBase = {
      name: values.name.trim().slice(0, 200),
      sku: values.sku.trim().slice(0, 60),
      category: values.category.trim().slice(0, 80),
      purchaseCost: Math.round(values.purchaseCost * 100) / 100,
      sellingPrice: Math.round(values.sellingPrice * 100) / 100,
      currency: values.currency,
      stockQty: Math.max(0, Math.round(values.stockQty)),
      lowStockThreshold: Math.max(0, Math.round(values.lowStockThreshold)),
      notes: values.notes.trim().slice(0, 4000),
      thumbnailUrl: thumb.slice(0, 80000),
      photoCount: Math.min(20, photos.length),
    };

    if (!existing) {
      try {
        await setDoc(doc(db, 'products', productId), {
          ...payloadBase,
          authorUid: user.uid,
          authorEmail: (user.email || ROOT_ADMIN_EMAIL).slice(0, 254),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      try {
        await updateDoc(doc(db, 'products', productId), {
          ...payloadBase,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }

    for (const pid of removedPhotoIds) {
      try {
        await deleteDoc(doc(db, 'products', productId, 'photos', pid));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `${path}/photos/${pid}`);
      }
    }

    for (const photo of photos.slice(0, 20)) {
      if (photo.isExisting && photo.id) {
        try {
          await updateDoc(doc(db, 'products', productId, 'photos', photo.id), {
            caption: (photo.caption || '').trim().slice(0, 300),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `${path}/photos/${photo.id}`);
        }
      } else {
        const photoId = generateSafeId('pph');
        try {
          await setDoc(doc(db, 'products', productId, 'photos', photoId), {
            productId,
            fileName: photo.fileName.slice(0, 200) || 'product.jpg',
            mimeType: photo.mimeType,
            caption: (photo.caption || '').trim().slice(0, 300),
            width: Math.max(1, Math.min(8000, Math.round(photo.width))),
            height: Math.max(1, Math.min(8000, Math.round(photo.height))),
            sizeBytes: Math.max(1, Math.min(700000, photo.dataUrl.length)),
            dataUrl: photo.dataUrl.slice(0, 700000),
            authorUid: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `${path}/photos/${photoId}`);
        }
      }
    }

    await logActivity(user, {
      action: existing ? 'product_updated' : 'product_created',
      summary: `${existing ? 'Updated' : 'Added'} product ${payloadBase.sku}: ${payloadBase.name} (${payloadBase.stockQty} units)`,
      entityType: 'product',
      entityId: productId,
      amount: payloadBase.purchaseCost * payloadBase.stockQty,
      currency: payloadBase.currency,
    });

    return productId;
  }

  async adjustProductStock(user: User, product: Product, newStockQty: number): Promise<void> {
    const cleanQty = Math.max(0, Math.min(9999999, Math.round(newStockQty)));
    const path = `products/${product.id}`;
    try {
      await updateDoc(doc(db, 'products', product.id), {
        stockQty: cleanQty,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }

    await logActivity(user, {
      action: 'product_updated',
      summary: `Adjusted stock for ${product.sku} (${product.name}) to ${cleanQty} units`,
      entityType: 'product',
      entityId: product.id,
      amount: product.purchaseCost * cleanQty,
      currency: product.currency,
    });
  }

  async deleteProduct(user: User, product: Product): Promise<void> {
    const photos = await this.fetchProductPhotos(product.id, user);
    if (photos.length > 0) {
      const batch = writeBatch(db);
      for (const p of photos) {
        batch.delete(doc(db, 'products', product.id, 'photos', p.id));
      }
      try {
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${product.id}/photos`);
      }
    }

    try {
      await deleteDoc(doc(db, 'products', product.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${product.id}`);
    }

    await logActivity(user, {
      action: 'product_deleted',
      summary: `Removed product ${product.sku}: ${product.name}`,
      entityType: 'product',
      entityId: product.id,
      amount: product.purchaseCost * product.stockQty,
      currency: product.currency,
    });
  }

  async saveSettings(
    user: User,
    values: SettingsFormValues,
    hasExisting: boolean
  ): Promise<void> {
    const path = 'settings/workspace';
    const payload = {
      businessName: values.businessName.trim().slice(0, 140),
      ownerName: values.ownerName.trim().slice(0, 120),
      currencyCode: values.currencyCode,
      currencySymbol: values.currencyCode === 'BDT' ? '৳' : '$',
      lowStockThreshold: Math.max(0, Math.round(values.lowStockThreshold)),
      usdToBdtRate: Math.max(1, Math.round(values.usdToBdtRate * 100) / 100),
      address: values.address.trim().slice(0, 240),
      phone: values.phone.trim().slice(0, 40),
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    };

    if (!hasExisting) {
      try {
        await setDoc(doc(db, 'settings', 'workspace'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      try {
        await updateDoc(doc(db, 'settings', 'workspace'), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  }

  async saveAdmin(
    user: User,
    values: AdminUserFormValues,
    isUpdate: boolean
  ): Promise<void> {
    const cleanUid = values.uid.trim();
    const path = `admins/${cleanUid}`;
    if (!isUpdate) {
      try {
        await setDoc(doc(db, 'admins', cleanUid), {
          uid: cleanUid,
          email: values.email.trim().slice(0, 254),
          displayName: values.displayName.trim().slice(0, 120),
          role: values.role,
          active: values.active,
          addedBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } else {
      try {
        await updateDoc(doc(db, 'admins', cleanUid), {
          displayName: values.displayName.trim().slice(0, 120),
          role: values.role,
          active: values.active,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  }

  async deleteAdmin(uid: string): Promise<void> {
    const path = `admins/${uid}`;
    try {
      await deleteDoc(doc(db, 'admins', uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}

export const dbService: BusinessDataAdapter = new FirestoreBusinessAdapter();
