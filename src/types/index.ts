import { Timestamp } from 'firebase/firestore';

export type CurrencyCode = 'BDT' | 'USD';

export type AppMode = 'business' | 'personal';

export type BusinessExpenseCategory =
  | 'facebook_ads'
  | 'marketing_promo'
  | 'photoshoot_model'
  | 'operations_packaging'
  | 'raw_materials'
  | 'rent_utilities';

export type PersonalExpenseCategory =
  | 'groceries_bazaar'
  | 'bills_utilities'
  | 'transportation'
  | 'personal_shopping'
  | 'family_health'
  | 'dining_out';

export type ExpenseCategory = BusinessExpenseCategory | PersonalExpenseCategory | (string & {});

export interface ExpenseCategoryItem {
  id: string;
  userId: string;
  mode: AppMode;
  key: string;
  label: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type PaymentMethod =
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Bank Transfer'
  | 'Cash'
  | 'Card';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type DateRangePreset = 'all' | 'today' | 'last_7_days' | 'this_month' | 'custom';

export interface UserSettings {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  currencyCode: CurrencyCode;
  currencySymbol: string;
  lowStockThreshold: number;
  usdToBdtRate: number;
  personalMonthlyBudget: number;
  address: string;
  phone: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Expense {
  id: string;
  userId: string;
  userEmail: string;
  mode: AppMode;
  title: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: CurrencyCode;
  date: string; // YYYY-MM-DD (Asia/Dhaka)
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ReceiptAsset {
  id: string;
  expenseId: string;
  userId: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
  width: number;
  height: number;
  sizeBytes: number;
  dataUrl: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Product {
  id: string;
  userId: string;
  userEmail: string;
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProductPhoto {
  id: string;
  productId: string;
  userId: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
  caption: string;
  width: number;
  height: number;
  sizeBytes: number;
  dataUrl: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  notes: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ActivityLog {
  id: string;
  userId: string;
  actorEmail: string;
  mode: AppMode;
  action:
    | 'expense_created'
    | 'expense_updated'
    | 'expense_deleted'
    | 'product_created'
    | 'product_updated'
    | 'product_deleted'
    | 'customer_created'
    | 'customer_updated'
    | 'customer_deleted'
    | 'receipt_created'
    | 'receipt_deleted';
  summary: string;
  entityType: 'expense' | 'product' | 'customer' | 'receipt';
  entityId: string;
  amount: number;
  currency: CurrencyCode;
  createdAt?: Timestamp;
}

export type ReceiptLogoType = 'monogram' | 'uploaded' | 'minimal_text';
export type ReceiptLogoSize = 'sm' | 'md' | 'lg';
export type ReceiptLogoPosition = 'left' | 'center';
export type ReceiptTextStyle = 'modern_sans' | 'classic_serif' | 'mono_thermal';
export type ReceiptFontSizeScale = 'sm' | 'md' | 'lg';
export type ReceiptPaperStyle = 'a4_clean' | 'pos_thermal' | 'dark_luxury';
export type ReceiptStatus = 'paid' | 'partial' | 'cod' | 'unpaid';
export type DeliveryZone = 'inside_dhaka' | 'outside_dhaka' | 'pickup';
export type ReceiptPaymentMethod =
  | 'Cash on Delivery'
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Bank Transfer'
  | 'Cash'
  | 'Card';

export interface ReceiptLineItem {
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptTemplate {
  id: string;
  userId: string;
  businessName: string;
  businessTagline: string;
  businessPhone: string;
  businessAddress: string;
  memoTitle: string;
  logoType: ReceiptLogoType;
  logoText: string;
  logoDataUrl: string;
  logoSize: ReceiptLogoSize;
  logoPosition: ReceiptLogoPosition;
  textStyle: ReceiptTextStyle;
  fontSizeScale: ReceiptFontSizeScale;
  accentColor: string;
  headerBgColor: string;
  paperStyle: ReceiptPaperStyle;
  footerNote: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CustomerReceipt {
  id: string;
  userId: string;
  userEmail: string;
  receiptNumber: string;
  issueDate: string;
  issueTime: string;
  memoTitle: string;
  status: ReceiptStatus;
  paymentMethod: ReceiptPaymentMethod;
  businessName: string;
  businessTagline: string;
  businessPhone: string;
  businessAddress: string;
  logoType: ReceiptLogoType;
  logoText: string;
  logoDataUrl: string;
  logoSize: ReceiptLogoSize;
  logoPosition: ReceiptLogoPosition;
  textStyle: ReceiptTextStyle;
  fontSizeScale: ReceiptFontSizeScale;
  accentColor: string;
  headerBgColor: string;
  paperStyle: ReceiptPaperStyle;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerDistrict: string;
  deliveryZone: DeliveryZone;
  courierName: string;
  items: ReceiptLineItem[];
  currency: CurrencyCode;
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  footerNote: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
