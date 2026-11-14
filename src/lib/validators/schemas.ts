import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid administrator email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  rememberMe: z.boolean().default(true),
});

export const expenseSchema = z.object({
  title: z.string().trim().min(1, 'Expense title is required.').max(200),
  description: z.string().trim().max(4000).default(''),
  category: z.enum([
    'facebook_ads',
    'marketing_promo',
    'photoshoot_model',
    'operations_packaging',
  ]),
  amount: z.coerce.number().min(0, 'Amount cannot be negative.').max(999999999),
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

export const settingsSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required.').max(140),
  ownerName: z.string().trim().min(1, 'Owner name is required.').max(120),
  currencyCode: z.enum(['BDT', 'USD']),
  lowStockThreshold: z.coerce.number().int().min(0).max(10000),
  usdToBdtRate: z.coerce.number().min(1).max(10000),
  address: z.string().trim().max(240).default(''),
  phone: z.string().trim().max(40).default(''),
});

export const adminUserSchema = z.object({
  uid: z
    .string()
    .trim()
    .min(1, 'Firebase UID is required.')
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, 'UID contains invalid characters.'),
  email: z.string().trim().email('Valid email is required.').max(254),
  displayName: z.string().trim().min(1, 'Display name is required.').max(120),
  role: z.enum(['owner', 'admin']),
  active: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type SettingsFormValues = z.infer<typeof settingsSchema>;
export type AdminUserFormValues = z.infer<typeof adminUserSchema>;
