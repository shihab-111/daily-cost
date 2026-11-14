import {
  AppMode,
  BusinessExpenseCategory,
  CurrencyCode,
  DateRangePreset,
  Expense,
  ExpenseCategory,
  PersonalExpenseCategory,
  Product,
  StockStatus,
} from '../types';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export const EKTALLY_LOGO_URL = '/assets/ektally-logo.png';
export const EKTALLY_LOGO_LIGHT_URL = '/assets/ektally-logo-light.png';
const LEGACY_EKTALLY_LOGO_URL =
  '/assets/aistudio/Gemini_Generated_Image_42zml642zml642zm_05ca8ec6.jpg';

export function isEkTallyLogo(url: string): boolean {
  return url === EKTALLY_LOGO_URL || url === EKTALLY_LOGO_LIGHT_URL || url === LEGACY_EKTALLY_LOGO_URL;
}

export function resolveReceiptLogoUrl(url: string, headerIsDark: boolean): string {
  if (!url) return '';
  if (isEkTallyLogo(url)) {
    return headerIsDark ? EKTALLY_LOGO_URL : EKTALLY_LOGO_LIGHT_URL;
  }
  return url;
}

export const BUSINESS_EXPENSE_CATEGORIES: Record<BusinessExpenseCategory, string> = {
  facebook_ads: 'Facebook & Meta Ads',
  marketing_promo: 'Marketing & Influencers',
  photoshoot_model: 'Photoshoot & Model Costs',
  operations_packaging: 'Packaging & Courier',
  raw_materials: 'Raw Materials & Stock',
  rent_utilities: 'Rent & Office Utilities',
};

export const PERSONAL_EXPENSE_CATEGORIES: Record<PersonalExpenseCategory, string> = {
  groceries_bazaar: 'Groceries & Bazaar',
  bills_utilities: 'Bills & Utilities',
  transportation: 'Transportation & CNG/Uber',
  personal_shopping: 'Personal Shopping',
  family_health: 'Family & Healthcare',
  dining_out: 'Dining & Tea/Coffee',
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  ...BUSINESS_EXPENSE_CATEGORIES,
  ...PERSONAL_EXPENSE_CATEGORIES,
};

export function getCategoriesForMode(mode: AppMode): Array<[ExpenseCategory, string]> {
  const source = mode === 'business' ? BUSINESS_EXPENSE_CATEGORIES : PERSONAL_EXPENSE_CATEGORIES;
  return Object.entries(source) as Array<[ExpenseCategory, string]>;
}

export function generateCategoryKey(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  const rand = Math.random().toString(36).slice(2, 7);
  return `cat_${slug || 'item'}_${rand}`;
}

export function resolveCategoryLabel(
  key: string,
  labelMap?: Record<string, string>
): string {
  if (labelMap && labelMap[key]) return labelMap[key];
  if (EXPENSE_CATEGORY_LABELS[key]) return EXPENSE_CATEGORY_LABELS[key];
  return key.replace(/[_-]+/g, ' ');
}

export const PAYMENT_METHODS = [
  'bKash',
  'Nagad',
  'Rocket',
  'Bank Transfer',
  'Cash',
  'Card',
] as const;

export const PRODUCT_CATEGORIES = [
  'Apparel & Fashion',
  'Footwear',
  'Cosmetics & Skincare',
  'Accessories',
  'Electronics',
  'Packaging Supplies',
  'General',
] as const;

export const BD_DISTRICTS = [
  'Dhaka',
  'Gazipur',
  'Narayanganj',
  'Chattogram',
  'Sylhet',
  'Cumilla',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Bogura',
  "Cox's Bazar",
  'Jessore',
  'Savar',
  'Tangail',
  'Narsingdi',
] as const;

export const BD_COURIERS = [
  'Steadfast Courier',
  'Pathao Courier',
  'RedX',
  'Sundarban Courier',
  'SA Paribahan',
  'Paperfly',
  'Store Pickup / Rider',
] as const;

export const RECEIPT_PAYMENT_METHODS = [
  'Cash on Delivery',
  'bKash',
  'Nagad',
  'Rocket',
  'Bank Transfer',
  'Cash',
  'Card',
] as const;

export const BD_CARRIER_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

export function normalizeBdPhone(raw: string): string {
  const compact = raw.replace(/[\s\-()]/g, '');
  if (!compact) return '';
  if (/^01[3-9]\d{8}$/.test(compact)) {
    return `+88${compact}`;
  }
  if (/^8801[3-9]\d{8}$/.test(compact)) {
    return `+${compact}`;
  }
  if (/^\+8801[3-9]\d{8}$/.test(compact)) {
    return compact;
  }
  return raw.trim();
}

export function isValidBdPhone(raw: string): boolean {
  const compact = raw.replace(/[\s\-()]/g, '');
  return BD_CARRIER_PHONE_REGEX.test(compact);
}

export function getTodayDhakaDate(): string {
  const now = new Date();
  const dhakaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  const y = dhakaTime.getFullYear();
  const m = String(dhakaTime.getMonth() + 1).padStart(2, '0');
  const d = String(dhakaTime.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getNowDhakaDateTime(): { date: string; time: string } {
  const now = new Date();
  const date = getTodayDhakaDate();
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);
  return { date, time: `${time} BST` };
}

export function getDhakaDayOfMonth(): number {
  const now = new Date();
  const dhakaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  return Math.max(1, dhakaTime.getDate());
}

export function generateReceiptNumber(): string {
  const today = getTodayDhakaDate().replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-BD-${today}-${rand}`;
}

export function formatMoney(amount: number, currency: CurrencyCode = 'BDT'): string {
  const symbol = currency === 'BDT' ? '৳' : '$';
  const locale = currency === 'BDT' ? 'en-BD' : 'en-US';
  return `${symbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: currency === 'BDT' ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function convertToBdt(amount: number, currency: CurrencyCode, usdToBdtRate = 120): number {
  if (currency === 'BDT') return amount;
  return amount * usdToBdtRate;
}

export function isDateInRange(
  dateStr: string,
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): boolean {
  if (preset === 'all') return true;
  if (!dateStr) return false;
  const today = getTodayDhakaDate();

  if (preset === 'today') {
    return dateStr === today;
  }
  if (preset === 'last_7_days') {
    const base = new Date(`${today}T00:00:00Z`);
    base.setUTCDate(base.getUTCDate() - 6);
    const start = base.toISOString().slice(0, 10);
    return dateStr >= start && dateStr <= today;
  }
  if (preset === 'this_month') {
    return dateStr.slice(0, 7) === today.slice(0, 7);
  }
  if (preset === 'custom') {
    if (customStart && dateStr < customStart) return false;
    if (customEnd && dateStr > customEnd) return false;
    return true;
  }
  return true;
}

export function getStockStatus(product: Pick<Product, 'stockQty' | 'lowStockThreshold'>): StockStatus {
  if (product.stockQty <= 0) return 'out_of_stock';
  if (product.stockQty <= product.lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

export function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 14) || 'id';
  const rand = Math.random().toString(36).slice(2, 8);
  return `${cleanPrefix}_${Date.now()}_${rand}`;
}

export function generateSku(category = 'PRD'): string {
  const code = category.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) || 'SKU';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `BD-${code}-${num}`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escape = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const content = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExpensesCsv(
  expenses: Expense[],
  categoryLabels?: Record<string, string>
) {
  const headers = [
    'Mode',
    'Date',
    'Title',
    'Category',
    'Amount',
    'Currency',
    'Payment Method',
    'Ad Account ID',
    'Campaign Name',
    'Partner / Agency',
    'Model Name',
    'Photographer',
    'Studio',
    'Vendor / Courier',
    'Description',
  ];
  const rows = expenses.map((e) => [
    e.mode,
    e.date,
    e.title,
    resolveCategoryLabel(e.category, categoryLabels),
    e.amount.toFixed(2),
    e.currency,
    e.paymentMethod,
    e.adAccountId,
    e.campaignName,
    e.partnerOrAgency,
    e.modelName,
    e.photographerName,
    e.studioName,
    e.vendorOrCourier,
    e.description,
  ]);
  downloadCsv(`bd-expenses-${getTodayDhakaDate()}.csv`, headers, rows);
}

export function exportProductsCsv(products: Product[]) {
  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Purchase Cost',
    'Selling Price',
    'Currency',
    'Stock Qty',
    'Low Stock Threshold',
    'Status',
    'Inventory Cost Value',
    'Notes',
  ];
  const rows = products.map((p) => {
    const status = getStockStatus(p);
    const statusLabel =
      status === 'out_of_stock' ? 'Out of Stock' : status === 'low_stock' ? 'Low Stock' : 'In Stock';
    return [
      p.sku,
      p.name,
      p.category,
      p.purchaseCost.toFixed(2),
      p.sellingPrice.toFixed(2),
      p.currency,
      p.stockQty,
      p.lowStockThreshold,
      statusLabel,
      (p.purchaseCost * p.stockQty).toFixed(2),
      p.notes,
    ];
  });
  downloadCsv(`bd-inventory-${getTodayDhakaDate()}.csv`, headers, rows);
}
