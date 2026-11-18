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
import {
  commitOfflineSafe,
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase/client';
import { PathaoDeliveryType, PathaoItemType, PathaoParcel } from '../../types';
import { PathaoParcelFormValues } from '../validators/schemas';
import { generateSafeId } from '../utils';
import { logActivity } from './activityService';

export interface PathaoMerchantContext {
  userId?: string;
  userEmail?: string | null;
  businessId?: string;
}

function buildMerchantHeaders(ctx?: PathaoMerchantContext): Record<string, string> {
  const headers: Record<string, string> = {};
  if (ctx?.userId) headers['x-ektally-user-id'] = ctx.userId;
  if (ctx?.userEmail) headers['x-ektally-user-email'] = ctx.userEmail;
  if (ctx?.businessId) headers['x-ektally-business-id'] = ctx.businessId;
  return headers;
}

export interface PathaoServerStatus {
  configured: boolean;
  environment: 'production' | 'sandbox';
  defaultStoreId: number | null;
  merchantId?: string;
  merchantLabel?: string;
  accountScope?: 'user' | 'business' | 'default' | 'unconfigured';
}

export interface PathaoStoreOption {
  store_id: number;
  store_name: string;
  store_address?: string;
  is_default_store?: boolean;
  city_id?: number;
  zone_id?: number;
  hub_id?: number;
}

export async function fetchPathaoServerStatus(
  ctx?: PathaoMerchantContext
): Promise<PathaoServerStatus> {
  const res = await fetch('/api/pathao/status', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildMerchantHeaders(ctx),
    },
  });
  if (!res.ok) {
    throw new Error('Unable to check Pathao server configuration.');
  }
  return (await res.json()) as PathaoServerStatus;
}

export async function fetchPathaoStores(
  ctx?: PathaoMerchantContext
): Promise<PathaoStoreOption[]> {
  const res = await fetch('/api/pathao/stores', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildMerchantHeaders(ctx),
    },
  });
  const data = (await res.json().catch(() => ({}))) as {
    stores?: PathaoStoreOption[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || 'Unable to load Pathao pickup stores.');
  }
  return Array.isArray(data.stores) ? data.stores : [];
}

export function subscribePathaoParcels(
  user: User,
  onData: (parcels: PathaoParcel[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'pathaoParcels';
  const q = query(collection(db, path), where('userId', '==', user.uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PathaoParcel, 'id'>),
        }))
        .sort((a, b) => {
          const aMs = a.createdAt?.toMillis?.() ?? 0;
          const bMs = b.createdAt?.toMillis?.() ?? 0;
          return bMs - aMs;
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

export interface DispatchPathaoOptions {
  businessId?: string;
  mode: 'api' | 'queued';
  existing?: PathaoParcel;
}

export async function dispatchPathaoParcel(
  user: User,
  values: PathaoParcelFormValues,
  options: DispatchPathaoOptions
): Promise<{ parcelId: string; consignmentId: string; orderStatus: string }> {
  const { existing, mode } = options;
  const parcelId = existing ? existing.id : generateSafeId('pth');
  const path = `pathaoParcels/${parcelId}`;

  const resolvedBusinessId = (
    options.businessId !== undefined ? options.businessId : existing?.businessId || ''
  ).slice(0, 128);

  const safeCustomerId = (values.customerId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const safeOrderId = (values.merchantOrderId || generateSafeId('ORD'))
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64);

  const storeId = Math.max(0, Math.round(Number(values.storeId) || 0));
  const storeName = (values.storeName || '').trim().slice(0, 120);
  const recipientName = values.recipientName.trim().slice(0, 140);
  const recipientPhone = values.recipientPhone.trim().slice(0, 20);
  const recipientAddress = values.recipientAddress.trim().slice(0, 300);
  const recipientDistrict = (values.recipientDistrict || 'Dhaka').trim().slice(0, 80);
  const deliveryType: PathaoDeliveryType = Number(values.deliveryType) === 12 ? 12 : 48;
  const itemType: PathaoItemType = Number(values.itemType) === 1 ? 1 : 2;
  const itemQuantity = Math.max(1, Math.round(Number(values.itemQuantity) || 1));
  const itemWeight = Math.max(0.1, Math.min(500, Math.round((Number(values.itemWeight) || 0.5) * 100) / 100));
  const amountToCollect = Math.max(0, Math.round(Number(values.amountToCollect) || 0));
  const itemDescription = (values.itemDescription || '').trim().slice(0, 300);
  const specialInstruction = (values.specialInstruction || '').trim().slice(0, 300);

  let consignmentId = existing?.consignmentId || '';
  let orderStatus = existing?.orderStatus || 'Queued (Draft)';
  let deliveryFee = existing?.deliveryFee || 0;
  let dispatchMode: 'api' | 'queued' = mode;

  if (mode === 'api') {
    const res = await fetch('/api/pathao/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...buildMerchantHeaders({
          userId: user.uid,
          userEmail: user.email,
          businessId: resolvedBusinessId,
        }),
      },
      body: JSON.stringify({
        store_id: storeId,
        merchant_order_id: safeOrderId,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress,
        delivery_type: deliveryType,
        item_type: itemType,
        item_quantity: itemQuantity,
        item_weight: itemWeight,
        amount_to_collect: amountToCollect,
        item_description: itemDescription,
        special_instruction: specialInstruction,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      consignment_id?: string;
      merchant_order_id?: string;
      order_status?: string;
      delivery_fee?: number;
      error?: string;
      details?: { errors?: Record<string, string[]>; message?: string };
    };

    if (!res.ok) {
      const fieldError = data.details?.errors
        ? Object.values(data.details.errors).flat()[0]
        : '';
      throw new Error(
        fieldError || data.error || data.details?.message || 'Pathao Courier rejected the order.'
      );
    }

    consignmentId = String(data.consignment_id || '').slice(0, 80);
    orderStatus = String(data.order_status || 'Pending').slice(0, 80) || 'Pending';
    deliveryFee = Math.max(0, Number(data.delivery_fee || 0));
    dispatchMode = 'api';
  } else {
    if (!existing || existing.dispatchMode === 'queued') {
      consignmentId = '';
      orderStatus = 'Queued (Draft)';
      deliveryFee = 0;
      dispatchMode = 'queued';
    }
  }

  const payloadBase = {
    businessId: resolvedBusinessId,
    customerId: safeCustomerId,
    merchantOrderId: safeOrderId,
    consignmentId,
    storeId,
    storeName,
    recipientName,
    recipientPhone,
    recipientAddress,
    recipientDistrict,
    deliveryType,
    itemType,
    itemQuantity,
    itemWeight,
    amountToCollect,
    deliveryFee,
    itemDescription,
    specialInstruction,
    orderStatus,
    dispatchMode,
  };

  if (!existing) {
    await commitOfflineSafe(
      setDoc(doc(db, 'pathaoParcels', parcelId), {
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
      updateDoc(doc(db, 'pathaoParcels', parcelId), {
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
    action: existing ? 'pathao_updated' : 'pathao_created',
    summary:
      dispatchMode === 'api'
        ? `Dispatched Pathao parcel for ${recipientName} (${consignmentId || safeOrderId})`
        : `${existing ? 'Updated' : 'Queued'} Pathao draft for ${recipientName} (${safeOrderId})`,
    entityType: 'pathao',
    entityId: parcelId,
    amount: amountToCollect,
    currency: 'BDT',
  });

  return { parcelId, consignmentId, orderStatus };
}

export async function refreshPathaoParcelStatus(
  parcel: PathaoParcel,
  ctx?: PathaoMerchantContext
): Promise<string> {
  if (!parcel.consignmentId) {
    throw new Error('This parcel does not have a Pathao Consignment ID yet.');
  }
  const res = await fetch(
    `/api/pathao/orders/${encodeURIComponent(parcel.consignmentId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...buildMerchantHeaders({
          userId: ctx?.userId || parcel.userId,
          userEmail: ctx?.userEmail,
          businessId: ctx?.businessId ?? parcel.businessId,
        }),
      },
    }
  );
  const data = (await res.json().catch(() => ({}))) as {
    order_status?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || 'Unable to fetch live status from Pathao.');
  }

  const nextStatus = String(data.order_status || parcel.orderStatus || 'Pending')
    .trim()
    .slice(0, 80);

  await commitOfflineSafe(
    updateDoc(doc(db, 'pathaoParcels', parcel.id), {
      orderStatus: nextStatus,
      updatedAt: serverTimestamp(),
    }),
    OperationType.UPDATE,
    `pathaoParcels/${parcel.id}`
  );

  return nextStatus;
}

export async function deletePathaoParcel(user: User, parcel: PathaoParcel): Promise<void> {
  const path = `pathaoParcels/${parcel.id}`;
  await commitOfflineSafe(
    deleteDoc(doc(db, 'pathaoParcels', parcel.id)),
    OperationType.DELETE,
    path
  );

  await logActivity(user, {
    mode: 'business',
    businessId: parcel.businessId || '',
    action: 'pathao_deleted',
    summary: `Removed Pathao parcel for ${parcel.recipientName} (${parcel.consignmentId || parcel.merchantOrderId})`,
    entityType: 'pathao',
    entityId: parcel.id,
    amount: parcel.amountToCollect || 0,
    currency: 'BDT',
  });
}
