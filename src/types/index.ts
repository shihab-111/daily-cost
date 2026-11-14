import { Timestamp } from 'firebase/firestore';

export type CurrencyCode = 'BDT' | 'USD';

export type ExpenseCategory =
  | 'facebook_ads'
  | 'marketing_promo'
  | 'photoshoot_model'
  | 'operations_packaging';

export type PaymentMethod =
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Bank Transfer'
  | 'Cash'
  | 'Card';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type DateRangePreset = 'all' | 'today' | 'last_7_days' | 'this_month' | 'custom';

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'admin';
  active: boolean;
  addedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BusinessSettings {
  id: string;
  businessName: string;
  ownerName: string;
  currencyCode: CurrencyCode;
  currencySymbol: string;
  lowStockThreshold: number;
  usdToBdtRate: number;
  address: string;
  phone: string;
  updatedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Expense {
  id: string;
  title: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: CurrencyCode;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  adAccountId: string;
  campaignName: string;
  partnerOrAgency: string;
  modelName: string;
  photographerName: string;
  studioName: string;
  vendorOrCourier: string;
  receiptThumb: string;
  receiptCount: number;
  authorUid: string;
  authorEmail: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ReceiptAsset {
  id: string;
  expenseId: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
  width: number;
  height: number;
  sizeBytes: number;
  dataUrl: string;
  authorUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchaseCost: number;
  sellingPrice: number;
  currency: CurrencyCode;
  stockQty: number;
  lowStockThreshold: number;
  notes: string;
  thumbnailUrl: string;
  photoCount: number;
  authorUid: string;
  authorEmail: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProductPhoto {
  id: string;
  productId: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
  caption: string;
  width: number;
  height: number;
  sizeBytes: number;
  dataUrl: string;
  authorUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ActivityLog {
  id: string;
  action:
    | 'expense_created'
    | 'expense_updated'
    | 'expense_deleted'
    | 'product_created'
    | 'product_updated'
    | 'product_deleted';
  summary: string;
  entityType: 'expense' | 'product';
  entityId: string;
  amount: number;
  currency: CurrencyCode;
  actorUid: string;
  actorEmail: string;
  createdAt?: Timestamp;
}
