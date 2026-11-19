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
  photoUrl?: string;
  quantity?: number;
  unitPrice?: number;
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

export interface BusinessProfile {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Expense {
  id: string;
  userId: string;
  userEmail: string;
  businessId?: string;
  mode: AppMode;
  title: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  quantity?: number;
  unitPrice?: number;
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
  businessId?: string;
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

export type CustomerNumberOption =
  | 'Call / Phone'
  | 'WhatsApp'
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Alternate';

export type CustomerOrderStatus = 'pending' | 'received' | 'rejected' | 'no_call';

export interface Customer {
  id: string;
  userId: string;
  businessId?: string;
  name: string;
  phone: string;
  numberOption?: CustomerNumberOption;
  email: string;
  address: string;
  district: string;
  zone?: string;
  area?: string;
  itemType?: 'parcel' | 'document';
  storeName?: string;
  merchantOrderId?: string;
  itemWeight?: number;
  productName?: string;
  productSize?: string;
  quantity?: number;
  unitPrice?: number;
  deliveryCharge?: number;
  orderDetails?: string;
  orderStatus?: CustomerOrderStatus;
  notes: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BusinessPartner {
  id: string;
  userId: string;
  businessId?: string;
  name: string;
  phone: string;
  sharePercent: number;
  investedAmount: number;
  dueAmount: number;
  currency: CurrencyCode;
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ActivityLog {
  id: string;
  userId: string;
  actorEmail: string;
  businessId?: string;
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
    | 'partner_created'
    | 'partner_updated'
    | 'partner_deleted'
    | 'receipt_created'
    | 'receipt_deleted'
    | 'loan_created'
    | 'loan_updated'
    | 'loan_deleted'
    | 'pathao_created'
    | 'pathao_updated'
    | 'pathao_deleted';
  summary: string;
  entityType: 'expense' | 'product' | 'customer' | 'partner' | 'receipt' | 'loan' | 'pathao';
  entityId: string;
  amount: number;
  currency: CurrencyCode;
  createdAt?: Timestamp;
}

export type LoanDirection = 'given' | 'taken';

export interface PersonalLoan {
  id: string;
  userId: string;
  direction: LoanDirection;
  personName: string;
  phone: string;
  amount: number;
  paidAmount: number;
  currency: CurrencyCode;
  date: string; // YYYY-MM-DD (Asia/Dhaka)
  dueDate: string; // YYYY-MM-DD or ''
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type PathaoDeliveryType = 48 | 12;
export type PathaoItemType = 2 | 1;

export interface PathaoParcel {
  id: string;
  userId: string;
  businessId?: string;
  customerId: string;
  merchantOrderId: string;
  consignmentId: string;
  storeId: number;
  storeName: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientDistrict: string;
  deliveryType: PathaoDeliveryType;
  itemType: PathaoItemType;
  itemQuantity: number;
  itemWeight: number;
  amountToCollect: number;
  deliveryFee: number;
  itemDescription: string;
  specialInstruction: string;
  orderStatus: string;
  dispatchMode: 'api' | 'queued';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
  businessId?: string;
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

export interface UserDirectoryEntry {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  businessName: string;
  loginCount: number;
  firstLoginAt?: Timestamp;
  lastLoginAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdminUser {
  id: string;
  userId: string;
  email: string;
  role: 'admin';
  addedBy: string;
  createdAt?: Timestamp;
}

export interface UserProfileData {
  id: string;
  userId: string;
  displayName: string;
  photoUrl: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

