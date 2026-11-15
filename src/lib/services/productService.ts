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
import { Product, ProductPhoto } from '../../types';
import { ProductFormValues } from '../validators/schemas';
import { generateSafeId } from '../utils';
import { logActivity } from './activityService';
import type { StagedAssetInput } from '../firebase/db';

export function subscribeProducts(
  user: User,
  onData: (items: Product[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'products';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }))
        .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
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

export async function fetchProductPhotos(
  productId: string,
  user: User
): Promise<ProductPhoto[]> {
  const path = `products/${productId}/photos`;
  try {
    const q = query(
      collection(db, 'products', productId, 'photos'),
      where('userId', '==', user.uid)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ProductPhoto, 'id'>),
      }))
      .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveProduct(
  user: User,
  values: ProductFormValues,
  photos: StagedAssetInput[],
  removedPhotoIds: string[],
  existing?: Product,
  businessId?: string
): Promise<string> {
  const productId = existing ? existing.id : generateSafeId('prd');
  const path = `products/${productId}`;

  const thumb =
    photos.find((p) => p.thumbDataUrl)?.thumbDataUrl ||
    (photos.length > 0 ? existing?.thumbnailUrl || '' : '');

  const resolvedBusinessId = (
    businessId !== undefined ? businessId : existing?.businessId || ''
  ).slice(0, 128);

  const payloadBase = {
    businessId: resolvedBusinessId,
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
    await commitOfflineSafe(
      setDoc(doc(db, 'products', productId), {
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
      updateDoc(doc(db, 'products', productId), {
        ...payloadBase,
        updatedAt: serverTimestamp(),
      }),
      OperationType.UPDATE,
      path
    );
  }

  for (const pid of removedPhotoIds) {
    await commitOfflineSafe(
      deleteDoc(doc(db, 'products', productId, 'photos', pid)),
      OperationType.DELETE,
      `${path}/photos/${pid}`
    );
  }

  for (const photo of photos.slice(0, 20)) {
    if (photo.isExisting && photo.id) {
      await commitOfflineSafe(
        updateDoc(doc(db, 'products', productId, 'photos', photo.id), {
          caption: (photo.caption || '').trim().slice(0, 300),
          updatedAt: serverTimestamp(),
        }),
        OperationType.UPDATE,
        `${path}/photos/${photo.id}`
      );
    } else {
      const photoId = generateSafeId('pph');
      await commitOfflineSafe(
        setDoc(doc(db, 'products', productId, 'photos', photoId), {
          productId,
          userId: user.uid,
          fileName: photo.fileName.slice(0, 200) || 'product.jpg',
          mimeType: photo.mimeType,
          caption: (photo.caption || '').trim().slice(0, 300),
          width: Math.max(1, Math.min(8000, Math.round(photo.width))),
          height: Math.max(1, Math.min(8000, Math.round(photo.height))),
          sizeBytes: Math.max(1, Math.min(700000, photo.dataUrl.length)),
          dataUrl: photo.dataUrl.slice(0, 700000),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        OperationType.CREATE,
        `${path}/photos/${photoId}`
      );
    }
  }

  await logActivity(user, {
    mode: 'business',
    businessId: resolvedBusinessId,
    action: existing ? 'product_updated' : 'product_created',
    summary: `${existing ? 'Updated' : 'Added'} product ${payloadBase.sku}: ${payloadBase.name} (${payloadBase.stockQty} units)`,
    entityType: 'product',
    entityId: productId,
    amount: payloadBase.purchaseCost * payloadBase.stockQty,
    currency: payloadBase.currency,
  });

  return productId;
}

export async function adjustProductStock(
  user: User,
  product: Product,
  newStockQty: number
): Promise<void> {
  const cleanQty = Math.max(0, Math.min(9999999, Math.round(newStockQty)));
  const path = `products/${product.id}`;
  await commitOfflineSafe(
    updateDoc(doc(db, 'products', product.id), {
      stockQty: cleanQty,
      updatedAt: serverTimestamp(),
    }),
    OperationType.UPDATE,
    path
  );

  await logActivity(user, {
    mode: 'business',
    businessId: product.businessId || '',
    action: 'product_updated',
    summary: `Adjusted stock for ${product.sku} (${product.name}) to ${cleanQty} units`,
    entityType: 'product',
    entityId: product.id,
    amount: product.purchaseCost * cleanQty,
    currency: product.currency,
  });
}

export async function deleteProduct(user: User, product: Product): Promise<void> {
  const photos = await fetchProductPhotos(product.id, user);
  if (photos.length > 0) {
    const batch = writeBatch(db);
    for (const p of photos) {
      batch.delete(doc(db, 'products', product.id, 'photos', p.id));
    }
    await commitOfflineSafe(
      batch.commit(),
      OperationType.DELETE,
      `products/${product.id}/photos`
    );
  }

  await commitOfflineSafe(
    deleteDoc(doc(db, 'products', product.id)),
    OperationType.DELETE,
    `products/${product.id}`
  );

  await logActivity(user, {
    mode: 'business',
    businessId: product.businessId || '',
    action: 'product_deleted',
    summary: `Removed product ${product.sku}: ${product.name}`,
    entityType: 'product',
    entityId: product.id,
    amount: product.purchaseCost * product.stockQty,
    currency: product.currency,
  });
}
