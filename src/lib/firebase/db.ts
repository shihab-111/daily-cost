import { User } from 'firebase/auth';
import {
  ActivityLog,
  AppMode,
  BusinessPartner,
  BusinessProfile,
  Customer,
  CustomerOrderStatus,
  CustomerReceipt,
  Expense,
  ExpenseCategoryItem,
  PathaoParcel,
  PersonalLoan,
  Product,
  ProductPhoto,
  ReceiptAsset,
  ReceiptTemplate,
  UserDirectoryEntry,
  UserProfileData,
  UserSettings,
} from '../../types';
import {
  BusinessPartnerFormValues,
  CustomerFormValues,
  CustomerReceiptFormValues,
  ExpenseFormValues,
  PathaoParcelFormValues,
  PersonalLoanFormValues,
  ProductFormValues,
  ReceiptTemplateFormValues,
  SettingsFormValues,
} from '../validators/schemas';
import * as activityService from '../services/activityService';
import * as adminService from '../services/adminService';
import * as businessService from '../services/businessService';
import * as categoryService from '../services/categoryService';
import * as customerService from '../services/customerService';
import * as expenseService from '../services/expenseService';
import * as loanService from '../services/loanService';
import * as partnerService from '../services/partnerService';
import * as pathaoService from '../services/pathaoService';
import * as productService from '../services/productService';
import * as profileService from '../services/profileService';
import * as receiptService from '../services/receiptService';
import * as settingsService from '../services/settingsService';

export interface StagedAssetInput {
  id?: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
  caption?: string;
  width: number;
  height: number;
  sizeBytes: number;
  dataUrl: string;
  thumbDataUrl?: string;
  isExisting?: boolean;
}

/**
 * Repository / Adapter Interface:
 * Decouples React UI/Hooks from Firestore so a self-hosted PostgreSQL/MySQL
 * REST API backend can be swapped in without modifying UI components.
 */
export interface BusinessDataAdapter {
  bootstrapWorkspace(
    user: User,
    defaults?: { businessName?: string; ownerName?: string }
  ): Promise<void>;
  subscribeBusinesses(
    user: User,
    onData: (businesses: BusinessProfile[]) => void,
    onError: (err: Error) => void
  ): () => void;
  addBusiness(user: User, name: string): Promise<BusinessProfile>;
  renameBusiness(user: User, business: BusinessProfile, newName: string): Promise<void>;
  deleteBusiness(
    user: User,
    business: BusinessProfile,
    remainingBusinesses?: BusinessProfile[]
  ): Promise<void>;
  subscribeExpenses(
    user: User,
    onData: (items: Expense[]) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeExpenseCategories(
    user: User,
    onData: (items: ExpenseCategoryItem[]) => void,
    onError: (err: Error) => void
  ): () => void;
  addExpenseCategory(
    user: User,
    mode: AppMode,
    label: string,
    options?: categoryService.ExpenseCategoryOptions
  ): Promise<ExpenseCategoryItem>;
  updateExpenseCategory(
    user: User,
    categoryDocId: string,
    updates: {
      label?: string;
      photoUrl?: string;
      quantity?: number;
      unitPrice?: number;
    }
  ): Promise<void>;
  deleteExpenseCategory(user: User, categoryDocId: string): Promise<void>;
  restoreDefaultExpenseCategories(
    user: User,
    mode: AppMode,
    existingKeys: Set<string>
  ): Promise<void>;
  subscribeProducts(
    user: User,
    onData: (items: Product[]) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeCustomers(
    user: User,
    onData: (items: Customer[]) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeSettings(
    user: User,
    onData: (settings: UserSettings | null) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeUserProfile(
    user: User,
    onData: (profile: UserProfileData | null) => void,
    onError: (err: Error) => void
  ): () => void;
  saveUserProfile(
    user: User,
    values: { displayName: string; photoUrl: string },
    hasExisting?: boolean
  ): Promise<void>;
  subscribeActivityLogs(
    user: User,
    onData: (logs: ActivityLog[]) => void,
    onError: (err: Error) => void
  ): () => void;
  fetchExpenseReceipts(expenseId: string, user: User): Promise<ReceiptAsset[]>;
  saveExpense(
    user: User,
    values: ExpenseFormValues,
    receipts: StagedAssetInput[],
    removedReceiptIds: string[],
    existing?: Expense,
    businessId?: string
  ): Promise<string>;
  updateExpensePayment(user: User, expense: Expense, nextPaidAmount: number): Promise<void>;
  deleteExpense(user: User, expense: Expense): Promise<void>;
  fetchProductPhotos(productId: string, user: User): Promise<ProductPhoto[]>;
  saveProduct(
    user: User,
    values: ProductFormValues,
    photos: StagedAssetInput[],
    removedPhotoIds: string[],
    existing?: Product,
    businessId?: string
  ): Promise<string>;
  adjustProductStock(user: User, product: Product, newStockQty: number): Promise<void>;
  deleteProduct(user: User, product: Product): Promise<void>;
  saveCustomer(
    user: User,
    values: CustomerFormValues,
    existing?: Customer,
    businessId?: string,
    recordOrder?: boolean
  ): Promise<string>;
  incrementCustomerOrderMetrics(
    customer: Customer,
    orderAmount: number,
    orderDate: string
  ): Promise<void>;
  updateCustomerOrderStatus(
    user: User,
    customer: Customer,
    orderStatus: CustomerOrderStatus
  ): Promise<void>;
  deleteCustomer(user: User, customer: Customer): Promise<void>;
  subscribeBusinessPartners(
    user: User,
    onData: (partners: BusinessPartner[]) => void,
    onError: (err: Error) => void
  ): () => void;
  saveBusinessPartner(
    user: User,
    values: BusinessPartnerFormValues,
    existing?: BusinessPartner,
    businessId?: string
  ): Promise<string>;
  saveMultipleBusinessPartners(
    user: User,
    entries: BusinessPartnerFormValues[],
    businessId?: string
  ): Promise<string[]>;
  deleteBusinessPartner(user: User, partner: BusinessPartner): Promise<void>;
  subscribePersonalLoans(
    user: User,
    onData: (loans: PersonalLoan[]) => void,
    onError: (err: Error) => void
  ): () => void;
  savePersonalLoan(
    user: User,
    values: PersonalLoanFormValues,
    existing?: PersonalLoan
  ): Promise<string>;
  saveMultiplePersonalLoans(
    user: User,
    entries: PersonalLoanFormValues[]
  ): Promise<string[]>;
  deletePersonalLoan(user: User, loan: PersonalLoan): Promise<void>;
  subscribePathaoParcels(
    user: User,
    onData: (parcels: PathaoParcel[]) => void,
    onError: (err: Error) => void
  ): () => void;
  fetchPathaoServerStatus(
    ctx?: pathaoService.PathaoMerchantContext
  ): Promise<pathaoService.PathaoServerStatus>;
  fetchPathaoStores(
    ctx?: pathaoService.PathaoMerchantContext
  ): Promise<pathaoService.PathaoStoreOption[]>;
  dispatchPathaoParcel(
    user: User,
    values: PathaoParcelFormValues,
    options: pathaoService.DispatchPathaoOptions
  ): Promise<{ parcelId: string; consignmentId: string; orderStatus: string }>;
  refreshPathaoParcelStatus(
    parcel: PathaoParcel,
    ctx?: pathaoService.PathaoMerchantContext
  ): Promise<string>;
  deletePathaoParcel(user: User, parcel: PathaoParcel): Promise<void>;
  saveSettings(user: User, values: SettingsFormValues, hasExisting: boolean): Promise<void>;
  subscribeReceiptTemplate(
    user: User,
    onData: (template: ReceiptTemplate | null) => void,
    onError: (err: Error) => void
  ): () => void;
  saveReceiptTemplate(
    user: User,
    values: ReceiptTemplateFormValues,
    hasExisting: boolean
  ): Promise<void>;
  subscribeCustomerReceipts(
    user: User,
    onData: (receipts: CustomerReceipt[]) => void,
    onError: (err: Error) => void
  ): () => void;
  saveCustomerReceipt(
    user: User,
    values: CustomerReceiptFormValues,
    existing?: CustomerReceipt,
    activeMode?: AppMode,
    businessId?: string
  ): Promise<string>;
  deleteCustomerReceipt(
    user: User,
    receipt: CustomerReceipt,
    activeMode?: AppMode
  ): Promise<void>;
  checkIsAdmin(user: User): Promise<boolean>;
  recordUserLogin(
    user: User,
    defaults?: { businessName?: string; ownerName?: string }
  ): Promise<void>;
  markFreshLoginAttempt(): void;
  clearSessionLoginMarker(uid?: string): void;
  subscribeAllUserDirectory(
    onData: (entries: UserDirectoryEntry[]) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeAllSettingsForAdmin(
    onData: (items: UserSettings[]) => void,
    onError: (err: Error) => void
  ): () => void;
  subscribeAllBusinessesForAdmin(
    onData: (items: BusinessProfile[]) => void,
    onError: (err: Error) => void
  ): () => void;
}

class FirestoreBusinessAdapter implements BusinessDataAdapter {
  bootstrapWorkspace = settingsService.bootstrapUserWorkspace;
  subscribeBusinesses = businessService.subscribeBusinesses;
  addBusiness = businessService.addBusiness;
  renameBusiness = businessService.renameBusiness;
  deleteBusiness = businessService.deleteBusiness;
  subscribeExpenses = expenseService.subscribeExpenses;
  subscribeExpenseCategories = categoryService.subscribeExpenseCategories;
  addExpenseCategory = categoryService.addExpenseCategory;
  updateExpenseCategory = categoryService.updateExpenseCategory;
  deleteExpenseCategory = categoryService.deleteExpenseCategory;
  restoreDefaultExpenseCategories = categoryService.restoreDefaultExpenseCategories;
  subscribeProducts = productService.subscribeProducts;
  subscribeCustomers = customerService.subscribeCustomers;
  subscribeSettings = settingsService.subscribeSettings;
  subscribeUserProfile = profileService.subscribeUserProfile;
  saveUserProfile = profileService.saveUserProfile;
  subscribeActivityLogs = activityService.subscribeActivityLogs;
  fetchExpenseReceipts = expenseService.fetchExpenseReceipts;
  saveExpense = expenseService.saveExpense;
  updateExpensePayment = expenseService.updateExpensePayment;
  deleteExpense = expenseService.deleteExpense;
  fetchProductPhotos = productService.fetchProductPhotos;
  saveProduct = productService.saveProduct;
  adjustProductStock = productService.adjustProductStock;
  deleteProduct = productService.deleteProduct;
  saveCustomer = customerService.saveCustomer;
  incrementCustomerOrderMetrics = customerService.incrementCustomerOrderMetrics;
  updateCustomerOrderStatus = customerService.updateCustomerOrderStatus;
  deleteCustomer = customerService.deleteCustomer;
  subscribeBusinessPartners = partnerService.subscribeBusinessPartners;
  saveBusinessPartner = partnerService.saveBusinessPartner;
  saveMultipleBusinessPartners = partnerService.saveMultipleBusinessPartners;
  deleteBusinessPartner = partnerService.deleteBusinessPartner;
  subscribePersonalLoans = loanService.subscribePersonalLoans;
  savePersonalLoan = loanService.savePersonalLoan;
  saveMultiplePersonalLoans = loanService.saveMultiplePersonalLoans;
  deletePersonalLoan = loanService.deletePersonalLoan;
  subscribePathaoParcels = pathaoService.subscribePathaoParcels;
  fetchPathaoServerStatus = pathaoService.fetchPathaoServerStatus;
  fetchPathaoStores = pathaoService.fetchPathaoStores;
  dispatchPathaoParcel = pathaoService.dispatchPathaoParcel;
  refreshPathaoParcelStatus = pathaoService.refreshPathaoParcelStatus;
  deletePathaoParcel = pathaoService.deletePathaoParcel;
  saveSettings = settingsService.saveSettings;
  subscribeReceiptTemplate = receiptService.subscribeReceiptTemplate;
  saveReceiptTemplate = receiptService.saveReceiptTemplate;
  subscribeCustomerReceipts = receiptService.subscribeCustomerReceipts;
  saveCustomerReceipt = receiptService.saveCustomerReceipt;
  deleteCustomerReceipt = receiptService.deleteCustomerReceipt;
  checkIsAdmin = adminService.checkIsAdmin;
  recordUserLogin = adminService.recordUserLogin;
  markFreshLoginAttempt = adminService.markFreshLoginAttempt;
  clearSessionLoginMarker = adminService.clearSessionLoginMarker;
  subscribeAllUserDirectory = adminService.subscribeAllUserDirectory;
  subscribeAllSettingsForAdmin = adminService.subscribeAllSettingsForAdmin;
  subscribeAllBusinessesForAdmin = adminService.subscribeAllBusinessesForAdmin;
}

export const dbService: BusinessDataAdapter = new FirestoreBusinessAdapter();
