import { CurrencyCode, DateRangePreset, Expense, ExpenseCategory, Product, StockStatus } from '../types';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  facebook_ads: 'Facebook & Social Ads',
  marketing_promo: 'Marketing & Promotions',
  photoshoot_model: 'Photoshoot & Model Costs',
  operations_packaging: 'Operational & Packaging',
};

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

export function formatMoney(amount: number, currency: CurrencyCode = 'BDT'): string {
  const symbol = currency === 'BDT' ? '৳' : '$';
  return `${symbol}${amount.toLocaleString('en-BD', {
    minimumFractionDigits: currency === 'BDT' ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function convertToBdt(amount: number, currency: CurrencyCode, usdToBdtRate = 120): number {
  if (currency === 'BDT') return amount;
  return amount * usdToBdtRate;
}

export function getTodayDhakaDate(): string {
  const now = new Date();
  const dhakaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  const y = dhakaTime.getFullYear();
  const m = String(dhakaTime.getMonth() + 1).padStart(2, '0');
  const d = String(dhakaTime.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

export function exportExpensesCsv(expenses: Expense[]) {
  const headers = [
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
    e.date,
    e.title,
    EXPENSE_CATEGORY_LABELS[e.category],
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
