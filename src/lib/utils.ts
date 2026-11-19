import {
  ActivityLog,
  AppMode,
  BusinessExpenseCategory,
  BusinessPartner,
  CurrencyCode,
  Customer,
  DateRangePreset,
  Expense,
  ExpenseCategory,
  ExpenseCategoryItem,
  PathaoParcel,
  PersonalExpenseCategory,
  PersonalLoan,
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

export function resolveExpenseMode(
  expense: Pick<Expense, 'mode' | 'category'>,
  allCategories: ExpenseCategoryItem[] = []
): AppMode {
  if (Object.prototype.hasOwnProperty.call(PERSONAL_EXPENSE_CATEGORIES, expense.category)) {
    return 'personal';
  }
  if (Object.prototype.hasOwnProperty.call(BUSINESS_EXPENSE_CATEGORIES, expense.category)) {
    return 'business';
  }
  if (allCategories.length > 0) {
    const matching = allCategories.filter((c) => c.key === expense.category);
    const hasPersonal = matching.some((c) => c.mode === 'personal');
    const hasBusiness = matching.some((c) => c.mode === 'business');
    if (hasPersonal && !hasBusiness) return 'personal';
    if (hasBusiness && !hasPersonal) return 'business';
  }
  return expense.mode === 'personal' ? 'personal' : 'business';
}

export function resolveActivityLogMode(
  log: Pick<ActivityLog, 'mode' | 'summary'>
): AppMode {
  if (log.mode === 'personal') return 'personal';
  if (log.mode === 'business') {
    const summaryLower = (log.summary || '').toLowerCase();
    if (
      summaryLower.startsWith('logged personal expense:') ||
      summaryLower.startsWith('updated personal expense:')
    ) {
      return 'personal';
    }
    return 'business';
  }
  const summaryLower = (log.summary || '').toLowerCase();
  if (summaryLower.includes('personal expense')) return 'personal';
  return 'business';
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

export const CUSTOMER_NUMBER_OPTIONS = [
  'Call / Phone',
  'WhatsApp',
  'bKash',
  'Nagad',
  'Rocket',
  'Alternate',
] as const;

export const PRODUCT_SIZE_PRESETS = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'] as const;

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

export function toLocalBdPhone11(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('8801') && digits.length === 13) {
    return digits.slice(2);
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return digits;
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return `0${digits}`;
  }
  return String(raw || '').trim();
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

function downloadPathaoStandardCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const escapeMinimal = (v: string | number) => {
    const str = String(v ?? '');
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const content = [
    headers.map(escapeMinimal).join(','),
    ...rows.map((r) => r.map(escapeMinimal).join(',')),
  ].join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function resolveExpensePayment(
  exp: Pick<Expense, 'amount' | 'paidAmount' | 'dueAmount' | 'paymentStatus'>
): {
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'paid' | 'partial' | 'due';
} {
  const total = Math.max(0, Math.round((Number(exp.amount) || 0) * 100) / 100);
  if (
    exp.paidAmount === undefined &&
    exp.dueAmount === undefined &&
    exp.paymentStatus === undefined
  ) {
    return { paidAmount: total, dueAmount: 0, paymentStatus: 'paid' };
  }

  let paid: number;
  let due: number;

  if (exp.paidAmount !== undefined && !Number.isNaN(Number(exp.paidAmount))) {
    paid = Math.max(0, Math.min(total, Math.round(Number(exp.paidAmount) * 100) / 100));
    due = Math.max(0, Math.round((total - paid) * 100) / 100);
  } else if (exp.dueAmount !== undefined && !Number.isNaN(Number(exp.dueAmount))) {
    due = Math.max(0, Math.min(total, Math.round(Number(exp.dueAmount) * 100) / 100));
    paid = Math.max(0, Math.round((total - due) * 100) / 100);
  } else if (exp.paymentStatus === 'due') {
    paid = 0;
    due = total;
  } else {
    paid = total;
    due = 0;
  }

  const paymentStatus: 'paid' | 'partial' | 'due' =
    due <= 0.001 ? 'paid' : paid <= 0.001 ? 'due' : 'partial';

  return { paidAmount: paid, dueAmount: due, paymentStatus };
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
    'Quantity',
    'Per Piece Price',
    'Total Amount',
    'Paid Amount',
    'Due Amount',
    'Payment Status',
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
  let totalAmountSum = 0;
  let totalPaidSum = 0;
  let totalDueSum = 0;

  const rows: (string | number)[][] = expenses.map((e) => {
    const payment = resolveExpensePayment(e);
    totalAmountSum += e.amount || 0;
    totalPaidSum += payment.paidAmount;
    totalDueSum += payment.dueAmount;
    const statusLabel =
      payment.paymentStatus === 'paid'
        ? 'Paid'
        : payment.paymentStatus === 'partial'
        ? 'Partial Paid'
        : 'Due';
    return [
      e.mode,
      e.date,
      e.title,
      resolveCategoryLabel(e.category, categoryLabels),
      e.quantity ? e.quantity : '',
      e.unitPrice ? e.unitPrice.toFixed(2) : '',
      e.amount.toFixed(2),
      payment.paidAmount.toFixed(2),
      payment.dueAmount.toFixed(2),
      statusLabel,
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
    ];
  });

  if (expenses.length > 0) {
    rows.push([
      'TOTAL',
      `${expenses.length} Entries`,
      '',
      '',
      '',
      '',
      (Math.round(totalAmountSum * 100) / 100).toFixed(2),
      (Math.round(totalPaidSum * 100) / 100).toFixed(2),
      (Math.round(totalDueSum * 100) / 100).toFixed(2),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
  }

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

export interface AdminUserCsvRow {
  userId: string;
  displayName: string;
  email: string;
  businesses: string;
  loginCount: number;
  lastLoginText: string;
  firstSeenText: string;
}

export function exportAdminUsersCsv(users: AdminUserCsvRow[]) {
  const headers = [
    'User ID',
    'Name',
    'Email',
    'Businesses',
    'Login Count',
    'Last Login (Asia/Dhaka)',
    'First Seen (Asia/Dhaka)',
  ];
  const rows = users.map((u) => [
    u.userId,
    u.displayName,
    u.email,
    u.businesses,
    u.loginCount,
    u.lastLoginText,
    u.firstSeenText,
  ]);
  downloadCsv(`ektally-users-logins-${getTodayDhakaDate()}.csv`, headers, rows);
}

export function exportBusinessPartnersCsv(partners: BusinessPartner[], businessName: string) {
  const headers = [
    'Business Name',
    'Partner Name',
    'Phone',
    'Share %',
    'Invested Amount',
    'Due Amount',
    'Currency',
    'Status',
    'Notes',
  ];
  const rows = partners.map((p) => [
    businessName,
    p.name,
    p.phone,
    p.sharePercent ? p.sharePercent.toFixed(2) : '0',
    p.investedAmount.toFixed(2),
    p.dueAmount.toFixed(2),
    p.currency,
    p.dueAmount > 0 ? 'Due Pending' : 'Settled',
    p.notes,
  ]);
  downloadCsv(`bd-partners-${getTodayDhakaDate()}.csv`, headers, rows);
}

export function exportPersonalLoansCsv(loans: PersonalLoan[]) {
  const headers = [
    'Type',
    'Person Name',
    'Phone',
    'Loan Date',
    'Due Date',
    'Loan Amount',
    'Repaid Amount',
    'Remaining Due',
    'Currency',
    'Status',
    'Notes',
  ];
  const rows = loans.map((l) => {
    const remaining = Math.max(0, (l.amount || 0) - (l.paidAmount || 0));
    return [
      l.direction === 'given' ? 'Lent Out (They Owe Me)' : 'Borrowed (I Owe)',
      l.personName,
      l.phone || '',
      l.date,
      l.dueDate || '',
      (l.amount || 0).toFixed(2),
      (l.paidAmount || 0).toFixed(2),
      remaining.toFixed(2),
      l.currency,
      remaining <= 0 ? 'Settled' : 'Pending',
      l.notes || '',
    ];
  });
  downloadCsv(`personal-loans-${getTodayDhakaDate()}.csv`, headers, rows);
}

const PATHAO_SAMPLE_CSV_HEADERS = [
  'ItemType',
  'StoreName',
  'MerchantOrderId',
  'RecipientName(*)',
  'RecipientPhone(*)',
  'RecipientAddress(*)',
  'RecipientCity(*)',
  'RecipientZone(*)',
  'RecipientArea',
  'AmountToCollect(*)',
  'ItemQuantity',
  'ItemWeight',
  'ItemDesc',
  'SpecialInstruction',
];

export function exportPathaoBulkCsv(parcels: PathaoParcel[]) {
  const rows = parcels.map((p) => [
    p.itemType === 1 ? 'document' : 'parcel',
    p.storeName || '',
    p.merchantOrderId || '',
    p.recipientName,
    toLocalBdPhone11(p.recipientPhone),
    p.recipientAddress,
    p.recipientDistrict || 'Dhaka',
    '',
    '',
    Math.round(p.amountToCollect || 0),
    Math.max(1, Math.round(p.itemQuantity || 1)),
    p.itemWeight || 0.5,
    p.itemDescription || '',
    p.specialInstruction || '',
  ]);
  downloadPathaoStandardCsv(
    `pathao-bulk-orders-${getTodayDhakaDate()}.csv`,
    PATHAO_SAMPLE_CSV_HEADERS,
    rows
  );
}

const CUSTOMER_ORDERS_CSV_HEADERS = [
  'SerialNumber',
  'OrderDate',
  'ItemType',
  'StoreName',
  'MerchantOrderId',
  'RecipientName(*)',
  'RecipientPhone(*)',
  'RecipientAddress(*)',
  'RecipientCity(*)',
  'RecipientZone(*)',
  'RecipientArea',
  'DeliveryCharge',
  'AmountToCollect(*)',
  'TotalSpent',
  'ItemQuantity',
  'ItemWeight',
  'ItemDesc',
  'SpecialInstruction',
];

export function exportCustomersOrdersCsv(
  customers: Customer[],
  latestParcelByCustomer: Record<string, PathaoParcel> = {},
  serialById: Record<string, number> = {}
) {
  let totalDeliveryChargeSum = 0;
  let totalAmountToCollectSum = 0;
  let totalSpentSum = 0;
  let totalQuantitySum = 0;

  const rows: (string | number)[][] = customers.map((c, idx) => {
    const serialNumber =
      serialById[c.id] ||
      (c.serialNumber && c.serialNumber > 0 ? c.serialNumber : idx + 1);
    const orderDate = c.orderDate?.trim() || c.lastOrderDate?.trim() || '';
    const qty = Math.max(1, Math.round(Number(c.quantity) || 1));
    const unitPrice = Math.max(0, Number(c.unitPrice) || 0);
    const deliveryCharge = Math.max(0, Number(c.deliveryCharge) || 0);
    const currentOrderTotal = Math.round((qty * unitPrice + deliveryCharge) * 100) / 100;
    const amountToCollect = Math.round(
      currentOrderTotal > 0 ? currentOrderTotal : c.totalSpent || 0
    );
    const customerTotalSpent = Math.round(
      (Number(c.totalSpent) > 0 ? Number(c.totalSpent) : amountToCollect) * 100
    ) / 100;

    totalDeliveryChargeSum += Math.round(deliveryCharge);
    totalAmountToCollectSum += amountToCollect;
    totalSpentSum += customerTotalSpent;
    totalQuantitySum += qty;

    const parcel = latestParcelByCustomer[c.id];
    const itemDesc = [
      c.productName?.trim(),
      c.productSize?.trim() ? `Size: ${c.productSize.trim()}` : '',
      c.orderDetails?.trim(),
    ]
      .filter(Boolean)
      .join(' · ');

    return [
      serialNumber,
      orderDate,
      c.itemType === 'document' ? 'document' : 'parcel',
      c.storeName?.trim() || parcel?.storeName || '',
      c.merchantOrderId?.trim() || parcel?.merchantOrderId || '',
      c.name,
      toLocalBdPhone11(c.phone),
      c.address?.trim() || '',
      c.district?.trim() || 'Dhaka',
      c.zone?.trim() || '',
      c.area?.trim() || '',
      Math.round(deliveryCharge),
      amountToCollect,
      customerTotalSpent,
      qty,
      c.itemWeight && c.itemWeight > 0 ? c.itemWeight : 0.5,
      itemDesc,
      c.notes?.trim() || '',
    ];
  });

  if (customers.length > 0) {
    rows.push([
      'TOTAL',
      `${customers.length} Orders`,
      '',
      '',
      '',
      'TOTAL SPENT SUM',
      '',
      '',
      '',
      '',
      '',
      Math.round(totalDeliveryChargeSum),
      Math.round(totalAmountToCollectSum),
      Math.round(totalSpentSum * 100) / 100,
      totalQuantitySum,
      '',
      '',
      '',
    ]);
  }

  downloadPathaoStandardCsv(
    `customer-orders-${getTodayDhakaDate()}.csv`,
    CUSTOMER_ORDERS_CSV_HEADERS,
    rows
  );
}


