import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookmarkCheck,
  Check,
  Clock,
  Download,
  FileDown,
  FilePlus2,
  ImagePlus,
  Loader2,
  PackagePlus,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { DashboardShell } from '../components/layout/DashboardShell';
import { ReceiptPreview } from '../components/receipts/ReceiptPreview';
import { Button, Card, Input, Select } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useMode } from '../context/ModeContext';
import {
  useCustomerReceipts,
  useCustomers,
  useProducts,
  useReceiptTemplate,
  useSettings,
} from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import { processImageAsset } from '../lib/firebase/storage';
import { downloadReceiptAsPdf, downloadReceiptAsPng } from '../lib/receiptRenderer';
import {
  BD_COURIERS,
  BD_DISTRICTS,
  cn,
  EKTALLY_LOGO_URL,
  formatMoney,
  generateReceiptNumber,
  getNowDhakaDateTime,
  isEkTallyLogo,
  RECEIPT_PAYMENT_METHODS,
} from '../lib/utils';
import {
  CustomerReceiptFormValues,
  customerReceiptSchema,
  receiptTemplateSchema,
} from '../lib/validators/schemas';
import {
  CurrencyCode,
  Customer,
  CustomerReceipt,
  DeliveryZone,
  ReceiptFontSizeScale,
  ReceiptLineItem,
  ReceiptLogoPosition,
  ReceiptLogoSize,
  ReceiptLogoType,
  ReceiptPaperStyle,
  ReceiptPaymentMethod,
  ReceiptStatus,
  ReceiptTextStyle,
} from '../types';

type StudioTab = 'brand' | 'customer' | 'items';

const ACCENT_PRESETS = [
  { label: 'Emerald Mint', hex: '#16a34a' },
  { label: 'Teal Slate', hex: '#0d9488' },
  { label: 'Royal Blue', hex: '#2563eb' },
  { label: 'Deep Indigo', hex: '#4f46e5' },
  { label: 'Crimson', hex: '#e11d48' },
  { label: 'Amber Gold', hex: '#d97706' },
];

const HEADER_BG_PRESETS = [
  { label: 'Soft Ice', hex: '#f8fafc' },
  { label: 'Pure White', hex: '#ffffff' },
  { label: 'Mint Wash', hex: '#f0fdf4' },
  { label: 'Warm Sand', hex: '#fffbeb' },
  { label: 'Slate Dark', hex: '#121214' },
  { label: 'Midnight', hex: '#09090b' },
];

const MEMO_TITLE_PRESETS = ['Money Receipt', 'Cash Memo', 'Invoice', 'Sales Memo'];

const DEFAULT_FOOTER =
  'Thank you for shopping with us! For returns or exchanges within 3 days, keep this receipt intact.';

function computeTotals(
  items: ReceiptLineItem[],
  deliveryCharge: number,
  discountAmount: number,
  vatPercent: number,
  paidAmount: number
) {
  const subtotal = Math.max(
    0,
    Math.round(items.reduce((sum, it) => sum + (Number(it.total) || 0), 0) * 100) / 100
  );
  const taxable = Math.max(0, subtotal - Math.max(0, discountAmount));
  const vatAmount = Math.max(
    0,
    Math.round(((taxable * Math.max(0, vatPercent)) / 100) * 100) / 100
  );
  const grandTotal = Math.max(
    0,
    Math.round((taxable + vatAmount + Math.max(0, deliveryCharge)) * 100) / 100
  );
  const dueAmount = Math.max(
    0,
    Math.round((grandTotal - Math.max(0, paidAmount)) * 100) / 100
  );
  return { subtotal, vatAmount, grandTotal, dueAmount };
}

function buildInitialDraft(
  businessName: string,
  businessPhone: string,
  businessAddress: string,
  currency: CurrencyCode
): CustomerReceiptFormValues {
  const items: ReceiptLineItem[] = [
    { name: 'Signature Product', sku: 'BD-ITEM-01', qty: 1, unitPrice: 1250, total: 1250 },
  ];
  const deliveryCharge = 70;
  const totals = computeTotals(items, deliveryCharge, 0, 0, 0);
  const { date, time } = getNowDhakaDateTime();

  return {
    receiptNumber: generateReceiptNumber(),
    issueDate: date,
    issueTime: time,
    memoTitle: 'Money Receipt',
    status: 'cod',
    paymentMethod: 'Cash on Delivery',
    businessName: businessName || 'EkTally',
    businessTagline: 'Dhaka Retail & E-Commerce',
    businessPhone: businessPhone || '',
    businessAddress: businessAddress || 'Dhaka, Bangladesh',
    logoType: 'uploaded',
    logoText: (businessName || 'ET').slice(0, 2).toUpperCase(),
    logoDataUrl: EKTALLY_LOGO_URL,
    logoSize: 'md',
    logoPosition: 'left',
    textStyle: 'modern_sans',
    fontSizeScale: 'md',
    accentColor: '#16a34a',
    headerBgColor: '#f8fafc',
    paperStyle: 'a4_clean',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerDistrict: 'Dhaka',
    deliveryZone: 'inside_dhaka',
    courierName: 'Steadfast Courier',
    items,
    currency,
    subtotal: totals.subtotal,
    deliveryCharge,
    discountAmount: 0,
    vatPercent: 0,
    vatAmount: totals.vatAmount,
    grandTotal: totals.grandTotal,
    paidAmount: 0,
    dueAmount: totals.dueAmount,
    footerNote: DEFAULT_FOOTER,
  };
}

export const ReceiptsPage: React.FC = () => {
  const { user, isAuthorized } = useAuth();
  const { mode } = useMode();
  const location = useLocation();
  const { settings } = useSettings(user, isAuthorized);
  const { products } = useProducts(user, isAuthorized);
  const { customers } = useCustomers(user, isAuthorized);
  const { template } = useReceiptTemplate(user, isAuthorized);
  const { receipts, loading: receiptsLoading, error: receiptsError } = useCustomerReceipts(
    user,
    isAuthorized
  );

  const [activeTab, setActiveTab] = useState<StudioTab>('brand');
  const [editingReceipt, setEditingReceipt] = useState<CustomerReceipt | undefined>(undefined);
  const [draft, setDraft] = useState<CustomerReceiptFormValues>(() =>
    buildInitialDraft('EkTally', '', 'Dhaka, Bangladesh', 'BDT')
  );
  const [templateHydrated, setTemplateHydrated] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [savingReceipt, setSavingReceipt] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-fill customer if navigated from CustomersPage
  useEffect(() => {
    const incoming = (location.state as { customer?: Customer } | null)?.customer;
    if (!incoming) return;
    setSelectedCustomerId(incoming.id);
    setDraft((prev) => ({
      ...prev,
      customerName: incoming.name,
      customerPhone: incoming.phone,
      customerEmail: incoming.email,
      customerDistrict: incoming.district || 'Dhaka',
      customerAddress: incoming.address,
    }));
    setActiveTab('customer');
  }, [location.state]);

  // Hydrate business settings & saved brand template once on initial load
  useEffect(() => {
    if (templateHydrated || editingReceipt) return;
    if (template) {
      setDraft((prev) => ({
        ...prev,
        businessName: template.businessName,
        businessTagline: template.businessTagline,
        businessPhone: template.businessPhone,
        businessAddress: template.businessAddress,
        memoTitle: template.memoTitle || prev.memoTitle,
        logoType: template.logoType,
        logoText: template.logoText,
        logoDataUrl: template.logoDataUrl,
        logoSize: template.logoSize || prev.logoSize,
        logoPosition: template.logoPosition || prev.logoPosition,
        textStyle: template.textStyle,
        fontSizeScale: template.fontSizeScale || prev.fontSizeScale,
        accentColor: template.accentColor,
        headerBgColor: template.headerBgColor || prev.headerBgColor,
        paperStyle: template.paperStyle,
        footerNote: template.footerNote,
      }));
      setTemplateHydrated(true);
    } else if (settings) {
      setDraft((prev) => ({
        ...prev,
        businessName: settings.businessName || prev.businessName,
        businessPhone: settings.phone || prev.businessPhone,
        businessAddress: settings.address || prev.businessAddress,
        logoText: (settings.businessName || 'BD').slice(0, 2).toUpperCase(),
        currency: settings.currencyCode || prev.currency,
      }));
      setTemplateHydrated(true);
    }
  }, [template, settings, templateHydrated, editingReceipt]);

  const updateDraftWithTotals = (
    updater: (prev: CustomerReceiptFormValues) => CustomerReceiptFormValues
  ) => {
    setDraft((prev) => {
      const next = updater(prev);
      const totals = computeTotals(
        next.items,
        next.deliveryCharge,
        next.discountAmount,
        next.vatPercent,
        next.paidAmount
      );
      return {
        ...next,
        ...totals,
      };
    });
  };

  const handleSelectSavedCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) return;
    const cust = customers.find((c) => c.id === custId);
    if (!cust) return;
    const isDhaka =
      cust.district.toLowerCase() === 'dhaka' || cust.district.toLowerCase() === 'savar';
    const zone: DeliveryZone = isDhaka ? 'inside_dhaka' : 'outside_dhaka';
    const charge = isDhaka ? 70 : 130;

    updateDraftWithTotals((prev) => ({
      ...prev,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      customerDistrict: cust.district || 'Dhaka',
      customerAddress: cust.address,
      deliveryZone: zone,
      deliveryCharge: charge,
    }));
  };

  const handleDeliveryZoneChange = (zone: DeliveryZone) => {
    const defaultCharge = zone === 'inside_dhaka' ? 70 : zone === 'outside_dhaka' ? 130 : 0;
    updateDraftWithTotals((prev) => ({
      ...prev,
      deliveryZone: zone,
      deliveryCharge: defaultCharge,
      courierName:
        zone === 'pickup'
          ? 'Store Pickup / Rider'
          : prev.courierName === 'Store Pickup / Rider'
          ? 'Steadfast Courier'
          : prev.courierName,
    }));
  };

  const handleLogoUpload = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setUploadingLogo(true);
    setFeedback(null);
    try {
      const processed = await processImageAsset(files[0]);
      setDraft((prev) => ({
        ...prev,
        logoType: 'uploaded',
        logoDataUrl: processed.thumbDataUrl,
      }));
      setFeedback({ type: 'success', text: 'Custom logo uploaded and applied to preview.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to process logo file.',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof ReceiptLineItem,
    value: string | number
  ) => {
    updateDraftWithTotals((prev) => {
      const updated = prev.items.map((item, idx) => {
        if (idx !== index) return item;
        const nextItem = { ...item, [field]: value };
        const qty = Math.max(1, Number(nextItem.qty) || 1);
        const price = Math.max(0, Number(nextItem.unitPrice) || 0);
        nextItem.total = Math.round(qty * price * 100) / 100;
        return nextItem;
      });
      return { ...prev, items: updated };
    });
  };

  const handleAddBlankItem = () => {
    if (draft.items.length >= 30) {
      setFeedback({ type: 'error', text: 'Maximum 30 line items allowed per receipt.' });
      return;
    }
    updateDraftWithTotals((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', sku: '', qty: 1, unitPrice: 0, total: 0 }],
    }));
  };

  const handleAddProductItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;
    if (draft.items.length >= 30) {
      setFeedback({ type: 'error', text: 'Maximum 30 line items allowed per receipt.' });
      return;
    }
    updateDraftWithTotals((prev) => {
      const hasOnlyEmptyRow =
        prev.items.length === 1 && !prev.items[0].name.trim() && prev.items[0].unitPrice === 0;
      const newItem: ReceiptLineItem = {
        name: prod.name,
        sku: prod.sku,
        qty: 1,
        unitPrice: prod.sellingPrice,
        total: prod.sellingPrice,
      };
      return {
        ...prev,
        items: hasOnlyEmptyRow ? [newItem] : [...prev.items, newItem],
      };
    });
    setSelectedProductId('');
  };

  const handleRemoveItem = (index: number) => {
    if (draft.items.length <= 1) return;
    updateDraftWithTotals((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleMarkPaidInFull = () => {
    updateDraftWithTotals((prev) => ({
      ...prev,
      status: 'paid',
      paidAmount: prev.grandTotal,
    }));
  };

  const handleSaveTemplate = async () => {
    if (!user) return;
    setFeedback(null);
    const parsed = receiptTemplateSchema.safeParse(draft);
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        text: parsed.error.issues[0]?.message || 'Check your brand template fields.',
      });
      return;
    }
    setSavingTemplate(true);
    try {
      await dbService.saveReceiptTemplate(user, parsed.data, Boolean(template));
      setFeedback({
        type: 'success',
        text: 'Brand style, logo, colors, and footer saved as default template.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save brand template.',
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSaveReceipt = async () => {
    if (!user) return;
    setFeedback(null);
    const parsed = customerReceiptSchema.safeParse(draft);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFeedback({
        type: 'error',
        text: issue?.message || 'Please complete all required receipt fields.',
      });
      if (
        issue?.path[0] === 'customerName' ||
        issue?.path[0] === 'customerPhone' ||
        issue?.path[0] === 'receiptNumber'
      ) {
        setActiveTab('customer');
      } else if (issue?.path[0] === 'items') {
        setActiveTab('items');
      }
      return;
    }

    setSavingReceipt(true);
    try {
      await dbService.saveCustomerReceipt(user, parsed.data, editingReceipt, mode);
      if (!editingReceipt && selectedCustomerId) {
        const matchedCustomer = customers.find((c) => c.id === selectedCustomerId);
        if (matchedCustomer) {
          await dbService.incrementCustomerOrderMetrics(
            matchedCustomer,
            parsed.data.grandTotal,
            parsed.data.issueDate
          );
        }
      }
      setFeedback({
        type: 'success',
        text: editingReceipt
          ? `Updated receipt ${parsed.data.receiptNumber}.`
          : `Saved receipt ${parsed.data.receiptNumber} to private history.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save receipt.',
      });
    } finally {
      setSavingReceipt(false);
    }
  };

  const buildDownloadableDraft = () =>
    customerReceiptSchema.safeParse({
      ...draft,
      customerName: draft.customerName.trim() || 'Walk-in Customer',
    });

  const handleDownloadPng = async () => {
    setFeedback(null);
    const parsed = buildDownloadableDraft();
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        text: parsed.error.issues[0]?.message || 'Verify receipt items before downloading.',
      });
      return;
    }
    setDownloadingPng(true);
    try {
      await downloadReceiptAsPng(parsed.data);
      setFeedback({
        type: 'success',
        text: `Downloaded ${parsed.data.receiptNumber}.png`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to export PNG receipt.',
      });
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    setFeedback(null);
    const parsed = buildDownloadableDraft();
    if (!parsed.success) {
      setFeedback({
        type: 'error',
        text: parsed.error.issues[0]?.message || 'Verify receipt items before downloading.',
      });
      return;
    }
    setDownloadingPdf(true);
    try {
      await downloadReceiptAsPdf(parsed.data);
      setFeedback({
        type: 'success',
        text: `Downloaded ${parsed.data.receiptNumber}.pdf`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to export PDF receipt.',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewReceipt = () => {
    setEditingReceipt(undefined);
    setSelectedCustomerId('');
    setFeedback(null);
    const { date, time } = getNowDhakaDateTime();
    setDraft((prev) => {
      const resetItems: ReceiptLineItem[] = [
        { name: 'Signature Product', sku: 'BD-ITEM-01', qty: 1, unitPrice: 1250, total: 1250 },
      ];
      const totals = computeTotals(resetItems, 70, 0, 0, 0);
      return {
        ...prev,
        receiptNumber: generateReceiptNumber(),
        issueDate: date,
        issueTime: time,
        status: 'cod',
        paymentMethod: 'Cash on Delivery',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        customerDistrict: 'Dhaka',
        deliveryZone: 'inside_dhaka',
        courierName: 'Steadfast Courier',
        items: resetItems,
        deliveryCharge: 70,
        discountAmount: 0,
        vatPercent: 0,
        paidAmount: 0,
        ...totals,
      };
    });
  };

  const handleLoadSavedReceipt = (saved: CustomerReceipt) => {
    setEditingReceipt(saved);
    setFeedback({
      type: 'success',
      text: `Loaded receipt ${saved.receiptNumber} for editing or download.`,
    });
    setDraft({
      receiptNumber: saved.receiptNumber,
      issueDate: saved.issueDate,
      issueTime: saved.issueTime || '',
      memoTitle: saved.memoTitle || 'Money Receipt',
      status: saved.status,
      paymentMethod: saved.paymentMethod,
      businessName: saved.businessName,
      businessTagline: saved.businessTagline,
      businessPhone: saved.businessPhone,
      businessAddress: saved.businessAddress,
      logoType: saved.logoType,
      logoText: saved.logoText,
      logoDataUrl: saved.logoDataUrl,
      logoSize: saved.logoSize || 'md',
      logoPosition: saved.logoPosition || 'left',
      textStyle: saved.textStyle,
      fontSizeScale: saved.fontSizeScale || 'md',
      accentColor: saved.accentColor,
      headerBgColor: saved.headerBgColor || '#f8fafc',
      paperStyle: saved.paperStyle,
      customerName: saved.customerName,
      customerPhone: saved.customerPhone,
      customerEmail: saved.customerEmail,
      customerAddress: saved.customerAddress,
      customerDistrict: saved.customerDistrict,
      deliveryZone: saved.deliveryZone,
      courierName: saved.courierName,
      items:
        saved.items.length > 0
          ? saved.items
          : [{ name: 'Item', sku: '', qty: 1, unitPrice: 0, total: 0 }],
      currency: saved.currency,
      subtotal: saved.subtotal,
      deliveryCharge: saved.deliveryCharge,
      discountAmount: saved.discountAmount,
      vatPercent: saved.vatPercent,
      vatAmount: saved.vatAmount,
      grandTotal: saved.grandTotal,
      paidAmount: saved.paidAmount,
      dueAmount: saved.dueAmount,
      footerNote: saved.footerNote,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSaved = async (receipt: CustomerReceipt) => {
    if (!user) return;
    try {
      await dbService.deleteCustomerReceipt(user, receipt, mode);
      if (editingReceipt?.id === receipt.id) {
        setEditingReceipt(undefined);
      }
      setConfirmDeleteId(null);
      setFeedback({ type: 'success', text: `Deleted receipt ${receipt.receiptNumber}.` });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to delete receipt.',
      });
    }
  };

  const filteredReceipts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.customerDistrict.toLowerCase().includes(q) ||
        r.courierName.toLowerCase().includes(q)
    );
  }, [receipts, searchQuery]);

  return (
    <DashboardShell
      businessName={settings?.businessName || 'EkTally'}
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            disabled={downloadingPng || downloadingPdf}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPng}
            disabled={downloadingPng || downloadingPdf}
          >
            {downloadingPng ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#4ade80]" />
            )}
            <span className="hidden sm:inline">PNG</span>
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || downloadingPng}
          >
            {downloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            Download PDF
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">
              BD Receipt &amp; Memo Studio
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Customize logo size &amp; position, header background, memo title, typography, BD delivery, and export PDF or PNG.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleNewReceipt}>
              <FilePlus2 className="w-3.5 h-3.5" />
              New Receipt
            </Button>
            <Button size="sm" onClick={handleSaveReceipt} disabled={savingReceipt}>
              {savingReceipt ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {editingReceipt ? 'Update Saved' : 'Save Receipt'}
            </Button>
          </div>
        </div>

        {feedback && (
          <div
            className={cn(
              'px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 no-print',
              feedback.type === 'success'
                ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            )}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-zinc-400 hover:text-zinc-100 cursor-pointer text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Split Studio: Editor + Live Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Editor Column */}
          <Card className="xl:col-span-5 p-4 sm:p-5 space-y-5 no-print">
            {/* Segmented Tab Bar */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#09090b] border border-[#27272a] rounded-lg">
              {(
                [
                  { id: 'brand', label: 'Brand & Style' },
                  { id: 'customer', label: 'Customer' },
                  { id: 'items', label: 'Items & Totals' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'py-2 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                      : 'text-zinc-400 hover:text-zinc-100 border border-transparent'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: BRAND & STYLE */}
            {activeTab === 'brand' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Memo / Document Title
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {MEMO_TITLE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, memoTitle: preset }))}
                        className={cn(
                          'px-2.5 py-1 rounded-md border text-[11px] font-medium cursor-pointer',
                          draft.memoTitle === preset
                            ? 'bg-[#22c55e]/15 border-[#22c55e] text-[#4ade80]'
                            : 'bg-[#09090b] border-[#27272a] text-zinc-400 hover:text-zinc-100'
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    maxLength={60}
                    value={draft.memoTitle}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, memoTitle: e.target.value }))
                    }
                    placeholder="Money Receipt"
                    className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">Logo Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'monogram', label: 'Monogram' },
                        { id: 'uploaded', label: 'Custom Image' },
                        { id: 'minimal_text', label: 'Text Only' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            logoType: opt.id as ReceiptLogoType,
                          }))
                        }
                        className={cn(
                          'px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                          draft.logoType === opt.id
                            ? 'bg-[#22c55e]/15 border-[#22c55e] text-[#4ade80]'
                            : 'bg-[#09090b] border-[#27272a] text-zinc-400 hover:text-zinc-100'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {draft.logoType === 'monogram' && (
                  <Input
                    label="Monogram Initials (max 8 chars)"
                    maxLength={8}
                    value={draft.logoText}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, logoText: e.target.value }))
                    }
                    placeholder="BD"
                  />
                )}

                {draft.logoType === 'uploaded' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-300">
                      Brand Logo Image
                    </label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e.target.files)}
                    />
                    <div className="flex items-center gap-3 p-3 bg-[#09090b] border border-[#27272a] rounded-lg">
                      {draft.logoDataUrl ? (
                        <img
                          src={isEkTallyLogo(draft.logoDataUrl) ? EKTALLY_LOGO_URL : draft.logoDataUrl}
                          alt="Uploaded brand logo"
                          className={cn(
                            'h-11 rounded-md border border-[#27272a] shrink-0',
                            isEkTallyLogo(draft.logoDataUrl)
                              ? 'w-auto max-w-[130px] object-contain bg-[#121214] px-2.5 py-1.5'
                              : 'w-11 object-cover'
                          )}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-md bg-[#18181b] border border-dashed border-[#27272a] flex items-center justify-center text-zinc-500 shrink-0">
                          <ImagePlus className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ImagePlus className="w-3.5 h-3.5" />
                          )}
                          {draft.logoDataUrl ? 'Replace Logo' : 'Upload Logo'}
                        </Button>
                        {!isEkTallyLogo(draft.logoDataUrl) && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                logoType: 'uploaded',
                                logoDataUrl: EKTALLY_LOGO_URL,
                              }))
                            }
                          >
                            Use EkTally Logo
                          </Button>
                        )}
                        {draft.logoDataUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDraft((prev) => ({ ...prev, logoDataUrl: '' }))
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Logo Size"
                    value={draft.logoSize}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        logoSize: e.target.value as ReceiptLogoSize,
                      }))
                    }
                  >
                    <option value="sm">Small (Compact)</option>
                    <option value="md">Medium (Standard)</option>
                    <option value="lg">Large (Prominent)</option>
                  </Select>

                  <Select
                    label="Logo Position"
                    value={draft.logoPosition}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        logoPosition: e.target.value as ReceiptLogoPosition,
                      }))
                    }
                  >
                    <option value="left">Left Aligned</option>
                    <option value="center">Centered Header</option>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Typography"
                    value={draft.textStyle}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        textStyle: e.target.value as ReceiptTextStyle,
                      }))
                    }
                  >
                    <option value="modern_sans">Sans-Serif</option>
                    <option value="classic_serif">Classic Serif</option>
                    <option value="mono_thermal">Monospace</option>
                  </Select>

                  <Select
                    label="Font Scale"
                    value={draft.fontSizeScale}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        fontSizeScale: e.target.value as ReceiptFontSizeScale,
                      }))
                    }
                  >
                    <option value="sm">Compact</option>
                    <option value="md">Standard</option>
                    <option value="lg">Large</option>
                  </Select>

                  <Select
                    label="Paper Format"
                    value={draft.paperStyle}
                    onChange={(e) => {
                      const paper = e.target.value as ReceiptPaperStyle;
                      setDraft((prev) => ({
                        ...prev,
                        paperStyle: paper,
                        headerBgColor:
                          paper === 'dark_luxury' && prev.headerBgColor === '#f8fafc'
                            ? '#121214'
                            : paper !== 'dark_luxury' && prev.headerBgColor === '#121214'
                            ? '#f8fafc'
                            : prev.headerBgColor,
                      }));
                    }}
                  >
                    <option value="a4_clean">A4 Clean</option>
                    <option value="pos_thermal">80mm Thermal</option>
                    <option value="dark_luxury">Dark Sheet</option>
                  </Select>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-300">
                    Primary Brand Accent Color
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {ACCENT_PRESETS.map((preset) => {
                      const active =
                        draft.accentColor.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          title={preset.label}
                          onClick={() =>
                            setDraft((prev) => ({ ...prev, accentColor: preset.hex }))
                          }
                          className={cn(
                            'w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-transform hover:scale-105',
                            active ? 'border-white ring-2 ring-white/30' : 'border-zinc-700'
                          )}
                          style={{ backgroundColor: preset.hex }}
                        >
                          {active && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}

                    <label className="flex items-center gap-2 px-2.5 py-1 bg-[#09090b] border border-[#27272a] rounded-lg cursor-pointer">
                      <input
                        type="color"
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(draft.accentColor)
                            ? draft.accentColor
                            : '#16a34a'
                        }
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, accentColor: e.target.value }))
                        }
                        className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0"
                      />
                      <span className="text-xs font-mono text-zinc-300 uppercase">
                        {draft.accentColor}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Header Background Color */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-300">
                    Header Background Tint
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {HEADER_BG_PRESETS.map((preset) => {
                      const active =
                        draft.headerBgColor.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          title={preset.label}
                          onClick={() =>
                            setDraft((prev) => ({ ...prev, headerBgColor: preset.hex }))
                          }
                          className={cn(
                            'w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-transform hover:scale-105',
                            active ? 'border-[#22c55e] ring-2 ring-[#22c55e]/40' : 'border-zinc-600'
                          )}
                          style={{ backgroundColor: preset.hex }}
                        >
                          {active && (
                            <Check
                              className={cn(
                                'w-3.5 h-3.5',
                                preset.hex === '#09090b' || preset.hex === '#121214'
                                  ? 'text-white'
                                  : 'text-zinc-900'
                              )}
                            />
                          )}
                        </button>
                      );
                    })}

                    <label className="flex items-center gap-2 px-2.5 py-1 bg-[#09090b] border border-[#27272a] rounded-lg cursor-pointer">
                      <input
                        type="color"
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(draft.headerBgColor)
                            ? draft.headerBgColor
                            : '#f8fafc'
                        }
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, headerBgColor: e.target.value }))
                        }
                        className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0"
                      />
                      <span className="text-xs font-mono text-zinc-300 uppercase">
                        {draft.headerBgColor}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Business Name *"
                    maxLength={140}
                    value={draft.businessName}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, businessName: e.target.value }))
                    }
                  />
                  <Input
                    label="Tagline / Subtitle"
                    maxLength={160}
                    value={draft.businessTagline}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, businessTagline: e.target.value }))
                    }
                    placeholder="Dhaka Lifestyle Brand"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Business Phone"
                    maxLength={40}
                    value={draft.businessPhone}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, businessPhone: e.target.value }))
                    }
                    placeholder="+88017XXXXXXXX"
                  />
                  <Input
                    label="Business Address"
                    maxLength={240}
                    value={draft.businessAddress}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, businessAddress: e.target.value }))
                    }
                    placeholder="Banani, Dhaka 1213"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Footer / Return Policy / Terms
                  </label>
                  <textarea
                    rows={2}
                    maxLength={400}
                    value={draft.footerNote}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, footerNote: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                  />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                >
                  {savingTemplate ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BookmarkCheck className="w-4 h-4 text-[#4ade80]" />
                  )}
                  Save Brand &amp; Style as Default
                </Button>
              </div>
            )}

            {/* TAB 2: CUSTOMER & BD DELIVERY */}
            {activeTab === 'customer' && (
              <div className="space-y-4">
                {customers.length > 0 && (
                  <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-lg space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Quick Fill from Saved BD Customers
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectSavedCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#18181b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
                    >
                      <option value="">Select saved customer or enter manually below...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone}) — {c.district}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-zinc-300">
                        Memo / Receipt # *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            receiptNumber: generateReceiptNumber(),
                          }))
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-[#4ade80] hover:underline cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Auto
                      </button>
                    </div>
                    <input
                      value={draft.receiptNumber}
                      maxLength={50}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, receiptNumber: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm font-mono bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>

                  <Input
                    label="Issue Date (Dhaka) *"
                    type="date"
                    value={draft.issueDate}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, issueDate: e.target.value }))
                    }
                    className="font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-zinc-300">
                      Issue Time (Asia/Dhaka BST)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const { date, time } = getNowDhakaDateTime();
                        setDraft((prev) => ({ ...prev, issueDate: date, issueTime: time }));
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-[#4ade80] hover:underline cursor-pointer"
                    >
                      <Clock className="w-3 h-3" />
                      Set Dhaka Now
                    </button>
                  </div>
                  <input
                    value={draft.issueTime}
                    maxLength={30}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, issueTime: e.target.value }))
                    }
                    placeholder="10:30 AM BST"
                    className="w-full px-3 py-2 text-sm font-mono bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Payment Status"
                    value={draft.status}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        status: e.target.value as ReceiptStatus,
                      }))
                    }
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="paid">Paid in Full</option>
                    <option value="partial">Partial / Advance Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </Select>

                  <Select
                    label="Payment Method"
                    value={draft.paymentMethod}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value as ReceiptPaymentMethod,
                      }))
                    }
                  >
                    {RECEIPT_PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Customer Full Name *"
                  maxLength={140}
                  value={draft.customerName}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  placeholder="e.g. Tariqul Islam"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="BD Phone (+8801XXXXXXXXX)"
                    maxLength={40}
                    value={draft.customerPhone}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, customerPhone: e.target.value }))
                    }
                    placeholder="+88017XXXXXXXX"
                    className="font-mono"
                  />
                  <Input
                    label="Customer Email"
                    type="email"
                    maxLength={140}
                    value={draft.customerEmail}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, customerEmail: e.target.value }))
                    }
                    placeholder="optional@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="BD District"
                    value={draft.customerDistrict}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, customerDistrict: e.target.value }))
                    }
                  >
                    {BD_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Courier Partner"
                    value={draft.courierName}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, courierName: e.target.value }))
                    }
                  >
                    {BD_COURIERS.map((courier) => (
                      <option key={courier} value={courier}>
                        {courier}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Delivery Zone (Auto-sets BD Courier Charge)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'inside_dhaka', label: 'Inside Dhaka ৳70' },
                        { id: 'outside_dhaka', label: 'Outside Dhaka ৳130' },
                        { id: 'pickup', label: 'Pickup ৳0' },
                      ] as const
                    ).map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => handleDeliveryZoneChange(z.id)}
                        className={cn(
                          'px-2 py-2 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer',
                          draft.deliveryZone === z.id
                            ? 'bg-[#22c55e]/15 border-[#22c55e] text-[#4ade80]'
                            : 'bg-[#09090b] border-[#27272a] text-zinc-400 hover:text-zinc-100'
                        )}
                      >
                        {z.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Full Street Delivery Address"
                  maxLength={240}
                  value={draft.customerAddress}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, customerAddress: e.target.value }))
                  }
                  placeholder="House, Road, Block / Thana"
                />
              </div>
            )}

            {/* TAB 3: ITEMS & TOTALS */}
            {activeTab === 'items' && (
              <div className="space-y-4">
                <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-lg space-y-2">
                  <label className="block text-xs font-medium text-zinc-300">
                    Quick Add from Product Inventory
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 text-xs bg-[#18181b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
                    >
                      <option value="">Select inventory SKU...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {formatMoney(p.sellingPrice, p.currency)}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddProductItem}
                      disabled={!selectedProductId}
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">
                      Line Items ({draft.items.length}/30)
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddBlankItem}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Line
                    </Button>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {draft.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#09090b] border border-[#27272a] rounded-lg space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.name}
                            maxLength={160}
                            placeholder="Product or service name"
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-[#18181b] text-zinc-100 border border-[#27272a] rounded-md focus:outline-none focus:border-[#22c55e]"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={draft.items.length <= 1}
                            title="Remove item"
                            className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">SKU</label>
                            <input
                              type="text"
                              value={item.sku}
                              maxLength={60}
                              placeholder="SKU"
                              onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                              className="w-full px-2 py-1 text-xs font-mono bg-[#18181b] text-zinc-200 border border-[#27272a] rounded-md focus:outline-none focus:border-[#22c55e]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">Qty</label>
                            <input
                              type="number"
                              min={1}
                              max={99999}
                              value={item.qty}
                              onChange={(e) =>
                                handleItemChange(idx, 'qty', Number(e.target.value))
                              }
                              className="w-full px-2 py-1 text-xs font-mono bg-[#18181b] text-zinc-200 border border-[#27272a] rounded-md tabular-nums focus:outline-none focus:border-[#22c55e]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 mb-1">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(idx, 'unitPrice', Number(e.target.value))
                              }
                              className="w-full px-2 py-1 text-xs font-mono bg-[#18181b] text-zinc-200 border border-[#27272a] rounded-md tabular-nums focus:outline-none focus:border-[#22c55e]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Charges & Paid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-[#27272a]">
                  <Select
                    label="Currency"
                    value={draft.currency}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        currency: e.target.value as CurrencyCode,
                      }))
                    }
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                  </Select>

                  <Input
                    label="Delivery Charge"
                    type="number"
                    min={0}
                    value={draft.deliveryCharge}
                    onChange={(e) =>
                      updateDraftWithTotals((prev) => ({
                        ...prev,
                        deliveryCharge: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="font-mono tabular-nums"
                  />

                  <Input
                    label="Discount"
                    type="number"
                    min={0}
                    value={draft.discountAmount}
                    onChange={(e) =>
                      updateDraftWithTotals((prev) => ({
                        ...prev,
                        discountAmount: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="font-mono tabular-nums"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="VAT (%)"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={draft.vatPercent}
                    onChange={(e) =>
                      updateDraftWithTotals((prev) => ({
                        ...prev,
                        vatPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      }))
                    }
                    className="font-mono tabular-nums"
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-zinc-300">Paid Amount</label>
                      <button
                        type="button"
                        onClick={handleMarkPaidInFull}
                        className="text-[11px] text-[#4ade80] hover:underline cursor-pointer"
                      >
                        Paid Full
                      </button>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={draft.paidAmount}
                      onChange={(e) =>
                        updateDraftWithTotals((prev) => ({
                          ...prev,
                          paidAmount: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-mono bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg tabular-nums focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#09090b] border border-[#27272a] rounded-lg grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Grand Total:</span>
                    <span className="font-mono font-semibold text-[#4ade80] tabular-nums">
                      {formatMoney(draft.grandTotal, draft.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Due:</span>
                    <span className="font-mono font-semibold text-zinc-100 tabular-nums">
                      {formatMoney(draft.dueAmount, draft.currency)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Live Preview Column */}
          <div className="xl:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 no-print">
              <div className="text-xs text-zinc-400">
                Live Preview ·{' '}
                <span className="font-mono text-zinc-200">
                  {draft.paperStyle === 'pos_thermal'
                    ? 'POS 80mm Thermal'
                    : draft.paperStyle === 'dark_luxury'
                    ? 'Dark Luxury'
                    : 'A4 Clean'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadPng}
                  disabled={downloadingPng || downloadingPdf}
                >
                  {downloadingPng ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#4ade80]" />
                  )}
                  Download PNG
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf || downloadingPng}
                >
                  {downloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  Download PDF
                </Button>
              </div>
            </div>

            <div className="p-3 sm:p-6 bg-[#121214] border border-[#27272a] rounded-xl overflow-x-auto">
              <ReceiptPreview receipt={draft} />
            </div>
          </div>
        </div>

        {/* Saved Receipts History */}
        <Card className="overflow-hidden no-print">
          <div className="px-5 py-4 border-b border-[#27272a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Saved Receipts &amp; Memos ({receipts.length})
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Private to your account. Reload any receipt to edit, export PDF, or download PNG.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipt #, customer, phone..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
              />
            </div>
          </div>

          {receiptsError && (
            <div className="px-5 py-3 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">
              {receiptsError}
            </div>
          )}

          {receiptsLoading ? (
            <div className="px-5 py-10 flex items-center justify-center gap-2 text-xs text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-[#22c55e]" />
              Loading saved receipts...
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs text-zinc-400">
              No saved receipts yet. Customize a receipt above and click Save Receipt.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-[#09090b]/50">
                    <th className="py-2.5 px-4">Receipt #</th>
                    <th className="py-2.5 px-4">Date &amp; Time</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Delivery / Courier</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-xs">
                  {filteredReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-[#09090b]/40">
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-100 whitespace-nowrap">
                        {r.receiptNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400 tabular-nums whitespace-nowrap">
                        {[r.issueDate, r.issueTime].filter(Boolean).join(' · ')}
                      </td>
                      <td className="py-3 px-4 min-w-[160px]">
                        <p className="font-medium text-zinc-100">{r.customerName}</p>
                        {r.customerPhone && (
                          <p className="text-[11px] font-mono text-zinc-400 tabular-nums">
                            {r.customerPhone}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">
                        {r.customerDistrict || 'Dhaka'}
                        {r.courierName ? ` · ${r.courierName}` : ''}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#4ade80] tabular-nums whitespace-nowrap">
                        {formatMoney(r.grandTotal, r.currency)}
                      </td>
                      <td className="py-3 px-4 font-mono uppercase text-zinc-300 whitespace-nowrap">
                        {r.status}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleLoadSavedReceipt(r)}
                          >
                            Edit / View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadReceiptAsPdf(r)}
                            title="Download PDF"
                          >
                            <FileDown className="w-3.5 h-3.5 text-[#4ade80]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadReceiptAsPng(r)}
                            title="Download PNG"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          {confirmDeleteId === r.id ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteSaved(r)}
                            >
                              Confirm
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeleteId(r.id)}
                              title="Delete receipt"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
};
