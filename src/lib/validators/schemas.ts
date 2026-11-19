import { z } from 'zod';
import { isValidBdPhone, normalizeBdPhone } from '../utils';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  rememberMe: z.boolean().default(true),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Your name is required.').max(120),
    businessName: z.string().trim().min(2, 'Business or workspace name is required.').max(140),
    email: z.string().trim().email('Enter a valid email address.').max(254),
    password: z.string().min(6, 'Password must be at least 6 characters.').max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const expenseSchema = z
  .object({
    mode: z.enum(['business', 'personal']),
    title: z.string().trim().min(1, 'Expense title is required.').max(200),
    description: z.string().trim().max(4000).default(''),
    category: z
      .string()
      .trim()
      .min(1, 'Expense category is required.')
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid category key format.'),
    amount: z.coerce.number().min(0, 'Amount cannot be negative.').max(999999999),
    paidAmount: z.coerce.number().min(0, 'Paid amount cannot be negative.').max(999999999).optional(),
    dueAmount: z.coerce.number().min(0, 'Due amount cannot be negative.').max(999999999).optional(),
    paymentStatus: z.enum(['paid', 'partial', 'due']).optional(),
    quantity: z.coerce.number().min(0, 'Quantity cannot be negative.').max(9999999).default(0),
    unitPrice: z.coerce.number().min(0, 'Per piece price cannot be negative.').max(999999999).default(0),
    currency: z.enum(['BDT', 'USD']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format.'),
    paymentMethod: z.enum(['bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Cash', 'Card']),
    adAccountId: z.string().trim().max(120).default(''),
    campaignName: z.string().trim().max(160).default(''),
    partnerOrAgency: z.string().trim().max(160).default(''),
    modelName: z.string().trim().max(120).default(''),
    photographerName: z.string().trim().max(120).default(''),
    studioName: z.string().trim().max(120).default(''),
    vendorOrCourier: z.string().trim().max(160).default(''),
  })
  .refine(
    (data) => data.paidAmount === undefined || data.paidAmount <= data.amount + 0.01,
    {
      message: 'Paid amount cannot exceed total expense amount.',
      path: ['paidAmount'],
    }
  )
  .refine(
    (data) => data.dueAmount === undefined || data.dueAmount <= data.amount + 0.01,
    {
      message: 'Due amount cannot exceed total expense amount.',
      path: ['dueAmount'],
    }
  );

export const expenseCategorySchema = z.object({
  mode: z.enum(['business', 'personal']),
  label: z
    .string()
    .trim()
    .min(1, 'Category name is required.')
    .max(60, 'Category name must be 60 characters or fewer.'),
  photoUrl: z.string().max(80000).default(''),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative.').max(9999999).default(0),
  unitPrice: z.coerce.number().min(0, 'Per piece price cannot be negative.').max(999999999).default(0),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.').max(200),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU code is required.')
    .max(60)
    .regex(/^[a-zA-Z0-9_-]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores.'),
  category: z.string().trim().min(1, 'Category is required.').max(80),
  purchaseCost: z.coerce.number().min(0, 'Purchase cost cannot be negative.').max(999999999),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative.').max(999999999),
  currency: z.enum(['BDT', 'USD']),
  stockQty: z.coerce.number().int('Stock quantity must be a whole number.').min(0).max(9999999),
  lowStockThreshold: z.coerce.number().int().min(0).max(99999),
  notes: z.string().trim().max(4000).default(''),
});

export const customerSchema = z.object({
  serialNumber: z.coerce
    .number()
    .int('Serial number must be a whole number.')
    .min(1, 'Serial number must be at least 1.')
    .max(9999999)
    .default(1),
  orderDate: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use YYYY-MM-DD order date format.')
    .default(''),
  name: z.string().trim().min(1, 'Customer name is required.').max(140),
  phone: z
    .string()
    .trim()
    .refine((val) => isValidBdPhone(val), {
      message: 'Enter a valid Bangladeshi carrier phone number (+8801XXXXXXXXX or 01XXXXXXXXX).',
    })
    .transform((val) => normalizeBdPhone(val)),
  numberOption: z
    .enum(['Call / Phone', 'WhatsApp', 'bKash', 'Nagad', 'Rocket', 'Alternate'])
    .default('Call / Phone'),
  email: z
    .string()
    .trim()
    .max(140)
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address.')
    .default(''),
  address: z.string().trim().max(240).default(''),
  district: z.string().trim().max(80).default('Dhaka'),
  zone: z.string().trim().max(80).default(''),
  area: z.string().trim().max(80).default(''),
  itemType: z.enum(['parcel', 'document']).default('parcel'),
  storeName: z.string().trim().max(120).default(''),
  merchantOrderId: z
    .string()
    .trim()
    .max(64)
    .refine(
      (v) => !v || /^[a-zA-Z0-9_-]+$/.test(v),
      'Order ID can only contain letters, numbers, hyphens, and underscores.'
    )
    .default(''),
  itemWeight: z.coerce
    .number()
    .min(0.1, 'Weight must be at least 0.1 kg.')
    .max(500, 'Weight cannot exceed 500 kg.')
    .default(0.5),
  productName: z.string().trim().max(160).default(''),
  productSize: z.string().trim().max(40).default(''),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative.').max(99999).default(1),
  unitPrice: z.coerce.number().min(0, 'Tk per product cannot be negative.').max(999999999).default(0),
  deliveryCharge: z.coerce.number().min(0, 'Delivery charge cannot be negative.').max(999999999).default(0),
  orderDetails: z.string().trim().max(500).default(''),
  orderStatus: z.enum(['pending', 'received', 'rejected', 'no_call']).default('pending'),
  notes: z.string().trim().max(1000).default(''),
});

export const settingsSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required.').max(140),
  ownerName: z.string().trim().min(1, 'Owner name is required.').max(120),
  currencyCode: z.enum(['BDT', 'USD']),
  lowStockThreshold: z.coerce.number().int().min(0).max(10000),
  usdToBdtRate: z.coerce.number().min(1).max(10000),
  personalMonthlyBudget: z.coerce.number().min(0).max(999999999),
  address: z.string().trim().max(240).default(''),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => !v || isValidBdPhone(v), {
      message: 'Enter a valid Bangladeshi phone number (+8801XXXXXXXXX) or leave blank.',
    })
    .transform((v) => (v ? normalizeBdPhone(v) : ''))
    .default(''),
});

export const businessProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Business name is required.')
    .max(140, 'Business name must be 140 characters or fewer.'),
});

export const businessPartnerSchema = z.object({
  name: z.string().trim().min(1, 'Partner name is required.').max(140),
  phone: z.string().trim().max(40).default(''),
  sharePercent: z.coerce
    .number()
    .min(0, 'Share % cannot be negative.')
    .max(100, 'Share % cannot exceed 100.')
    .default(0),
  investedAmount: z.coerce
    .number()
    .min(0, 'Invested amount cannot be negative.')
    .max(999999999)
    .default(0),
  dueAmount: z.coerce
    .number()
    .min(0, 'Due amount cannot be negative.')
    .max(999999999)
    .default(0),
  currency: z.enum(['BDT', 'USD']).default('BDT'),
  notes: z.string().trim().max(1000).default(''),
});

export const personalLoanSchema = z
  .object({
    direction: z.enum(['given', 'taken']),
    personName: z.string().trim().min(1, 'Person name is required.').max(140),
    phone: z.string().trim().max(40).default(''),
    amount: z.coerce
      .number()
      .min(0.01, 'Loan amount must be greater than 0.')
      .max(999999999),
    paidAmount: z.coerce
      .number()
      .min(0, 'Repaid amount cannot be negative.')
      .max(999999999)
      .default(0),
    currency: z.enum(['BDT', 'USD']).default('BDT'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format.'),
    dueDate: z
      .string()
      .trim()
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use YYYY-MM-DD due date format.')
      .default(''),
    notes: z.string().trim().max(1000).default(''),
  })
  .refine((data) => data.paidAmount <= data.amount, {
    message: 'Repaid amount cannot exceed total loan amount.',
    path: ['paidAmount'],
  });

export const pathaoParcelSchema = z.object({
  customerId: z.string().trim().max(128).default(''),
  merchantOrderId: z
    .string()
    .trim()
    .min(1, 'Merchant order ID is required.')
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Order ID can only contain letters, numbers, hyphens, and underscores.'),
  storeId: z.coerce.number().int().min(0).max(99999999).default(0),
  storeName: z.string().trim().max(120).default(''),
  recipientName: z.string().trim().min(1, 'Customer name is required.').max(140),
  recipientPhone: z
    .string()
    .trim()
    .refine((val) => isValidBdPhone(val), {
      message: 'Enter a valid Bangladeshi phone number (01XXXXXXXXX or +8801XXXXXXXXX).',
    })
    .transform((val) => {
      const normalized = normalizeBdPhone(val);
      return normalized.startsWith('+880') ? normalized.slice(3) : normalized;
    }),
  recipientAddress: z
    .string()
    .trim()
    .min(10, 'Full delivery address (at least 10 characters, including area/thana) is required for Pathao.')
    .max(300),
  recipientDistrict: z.string().trim().max(80).default('Dhaka'),
  deliveryType: z.union([z.literal(48), z.literal(12)]).default(48),
  itemType: z.union([z.literal(2), z.literal(1)]).default(2),
  itemQuantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.').max(99999).default(1),
  itemWeight: z.coerce
    .number()
    .min(0.1, 'Weight must be at least 0.1 kg.')
    .max(500, 'Weight cannot exceed 500 kg.')
    .default(0.5),
  amountToCollect: z.coerce
    .number()
    .min(0, 'COD amount cannot be negative.')
    .max(999999999)
    .default(0),
  itemDescription: z.string().trim().max(300).default(''),
  specialInstruction: z.string().trim().max(300).default(''),
});

export const receiptLineItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required.').max(160),
  sku: z.string().trim().max(60).default(''),
  qty: z.coerce.number().min(1, 'Quantity must be at least 1.').max(99999),
  unitPrice: z.coerce.number().min(0).max(999999999),
  total: z.coerce.number().min(0).max(999999999),
});

export const receiptTemplateSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required.').max(140),
  businessTagline: z.string().trim().max(160).default(''),
  businessPhone: z.string().trim().max(40).default(''),
  businessAddress: z.string().trim().max(240).default(''),
  memoTitle: z.string().trim().min(1, 'Memo / Receipt title is required.').max(60),
  logoType: z.enum(['monogram', 'uploaded', 'minimal_text']),
  logoText: z.string().trim().max(8).default('BD'),
  logoDataUrl: z.string().max(80000).default(''),
  logoSize: z.enum(['sm', 'md', 'lg']),
  logoPosition: z.enum(['left', 'center']),
  textStyle: z.enum(['modern_sans', 'classic_serif', 'mono_thermal']),
  fontSizeScale: z.enum(['sm', 'md', 'lg']),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Choose a valid 6-digit hex accent color.'),
  headerBgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Choose a valid 6-digit hex header background color.'),
  paperStyle: z.enum(['a4_clean', 'pos_thermal', 'dark_luxury']),
  footerNote: z.string().trim().max(400).default(''),
});

export const customerReceiptSchema = receiptTemplateSchema.extend({
  receiptNumber: z
    .string()
    .trim()
    .min(1, 'Receipt number is required.')
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Receipt number can only contain letters, numbers, hyphens, and underscores.'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format.'),
  issueTime: z.string().trim().max(30).default(''),
  status: z.enum(['paid', 'partial', 'cod', 'unpaid']),
  paymentMethod: z.enum([
    'Cash on Delivery',
    'bKash',
    'Nagad',
    'Rocket',
    'Bank Transfer',
    'Cash',
    'Card',
  ]),
  customerName: z.string().trim().min(1, 'Customer name is required.').max(140),
  customerPhone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => !v || isValidBdPhone(v), {
      message: 'Use a valid BD carrier phone (+8801XXXXXXXXX) or leave blank.',
    })
    .transform((v) => (v ? normalizeBdPhone(v) : ''))
    .default(''),
  customerEmail: z.string().trim().max(140).default(''),
  customerAddress: z.string().trim().max(240).default(''),
  customerDistrict: z.string().trim().max(80).default('Dhaka'),
  deliveryZone: z.enum(['inside_dhaka', 'outside_dhaka', 'pickup']),
  courierName: z.string().trim().max(80).default(''),
  items: z.array(receiptLineItemSchema).min(1, 'Add at least 1 item to generate a receipt.').max(30),
  currency: z.enum(['BDT', 'USD']),
  subtotal: z.coerce.number().min(0).max(999999999),
  deliveryCharge: z.coerce.number().min(0).max(999999999),
  discountAmount: z.coerce.number().min(0).max(999999999),
  vatPercent: z.coerce.number().min(0).max(100),
  vatAmount: z.coerce.number().min(0).max(999999999),
  grandTotal: z.coerce.number().min(0).max(999999999),
  paidAmount: z.coerce.number().min(0).max(999999999),
  dueAmount: z.coerce.number().min(0).max(999999999),
});

export const userProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Your name is required.')
    .max(120, 'Name must be 120 characters or fewer.'),
  photoUrl: z.string().max(80000).default(''),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.').max(128),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters.')
      .max(128),
    confirmPassword: z.string().min(1, 'Please confirm your new password.').max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password.',
    path: ['newPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type CustomerFormValues = z.infer<typeof customerSchema>;
export type BusinessPartnerFormValues = z.infer<typeof businessPartnerSchema>;
export type PersonalLoanFormValues = z.infer<typeof personalLoanSchema>;
export type PathaoParcelFormValues = z.infer<typeof pathaoParcelSchema>;
export type SettingsFormValues = z.infer<typeof settingsSchema>;
export type ReceiptTemplateFormValues = z.infer<typeof receiptTemplateSchema>;
export type CustomerReceiptFormValues = z.infer<typeof customerReceiptSchema>;
export type UserProfileFormValues = z.infer<typeof userProfileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
