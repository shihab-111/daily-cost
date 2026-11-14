import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { AppMode, CurrencyCode, Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useMode } from '../../context/ModeContext';
import { useExpenseCategories } from '../../hooks/useBusinessData';
import { dbService, StagedAssetInput } from '../../lib/firebase/db';
import { processImageAsset, tryUploadToStorageOrFallback } from '../../lib/firebase/storage';
import { expenseCategorySchema, expenseSchema } from '../../lib/validators/schemas';
import {
  getTodayDhakaDate,
  PAYMENT_METHODS,
  resolveCategoryLabel,
} from '../../lib/utils';
import { Button, Input, Modal, Select } from '../ui';

interface ExpenseModalProps {
  open: boolean;
  user: User;
  defaultCurrency: CurrencyCode;
  editingExpense: Expense | null;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  open,
  user,
  defaultCurrency,
  editingExpense,
  onClose,
}) => {
  const { mode: activeMode } = useMode();
  const { t } = useLanguage();

  const [entryMode, setEntryMode] = useState<AppMode>(activeMode);
  const { allCategories, modeCategories, categoryLabels } = useExpenseCategories(
    user,
    open,
    entryMode
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('facebook_ads');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [date, setDate] = useState(getTodayDhakaDate());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');

  const [adAccountId, setAdAccountId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [partnerOrAgency, setPartnerOrAgency] = useState('');
  const [modelName, setModelName] = useState('');
  const [photographerName, setPhotographerName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [vendorOrCourier, setVendorOrCourier] = useState('');

  const [addingCat, setAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  const [receipts, setReceipts] = useState<StagedAssetInput[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [processingFile, setProcessingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setRemovedIds([]);
    setAddingCat(false);
    setNewCatLabel('');
    if (editingExpense) {
      const m = editingExpense.mode || 'business';
      setEntryMode(m);
      setTitle(editingExpense.title);
      setDescription(editingExpense.description);
      setCategory(editingExpense.category);
      setAmount(String(editingExpense.amount));
      setCurrency(editingExpense.currency);
      setDate(editingExpense.date);
      setPaymentMethod(editingExpense.paymentMethod);
      setAdAccountId(editingExpense.adAccountId);
      setCampaignName(editingExpense.campaignName);
      setPartnerOrAgency(editingExpense.partnerOrAgency);
      setModelName(editingExpense.modelName);
      setPhotographerName(editingExpense.photographerName);
      setStudioName(editingExpense.studioName);
      setVendorOrCourier(editingExpense.vendorOrCourier);

      dbService
        .fetchExpenseReceipts(editingExpense.id, user)
        .then((items) => {
          setReceipts(
            items.map((r) => ({
              id: r.id,
              fileName: r.fileName,
              mimeType: r.mimeType,
              width: r.width,
              height: r.height,
              sizeBytes: r.sizeBytes,
              dataUrl: r.dataUrl,
              thumbDataUrl: editingExpense.receiptThumb || undefined,
              isExisting: true,
            }))
          );
        })
        .catch(() => {});
    } else {
      setEntryMode(activeMode);
      setTitle('');
      setDescription('');
      setCategory(activeMode === 'business' ? 'facebook_ads' : 'groceries_bazaar');
      setAmount('');
      setCurrency(defaultCurrency);
      setDate(getTodayDhakaDate());
      setPaymentMethod('bKash');
      setAdAccountId('');
      setCampaignName('');
      setPartnerOrAgency('');
      setModelName('');
      setPhotographerName('');
      setStudioName('');
      setVendorOrCourier('');
      setReceipts([]);
    }
  }, [open, editingExpense, defaultCurrency, user, activeMode]);

  // Keep selected category aligned with the user's active categories for entryMode
  useEffect(() => {
    if (!open || editingExpense || modeCategories.length === 0) return;
    if (!modeCategories.some((c) => c.key === category)) {
      setCategory(modeCategories[0].key);
    }
  }, [open, editingExpense, modeCategories, category]);

  const handleModeChange = (nextMode: AppMode) => {
    setEntryMode(nextMode);
    setAddingCat(false);
    setNewCatLabel('');
    const nextList = allCategories.filter((c) => c.mode === nextMode);
    if (nextList.length > 0) {
      if (!nextList.some((c) => c.key === category)) {
        setCategory(nextList[0].key);
      }
    } else {
      setCategory(nextMode === 'business' ? 'facebook_ads' : 'groceries_bazaar');
    }
  };

  const handleQuickAddCategory = async () => {
    setErrorMsg(null);
    const parsed = expenseCategorySchema.safeParse({ mode: entryMode, label: newCatLabel });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Enter a category name.');
      return;
    }
    const existingMatch = modeCategories.find(
      (c) => c.label.trim().toLowerCase() === parsed.data.label.toLowerCase()
    );
    if (existingMatch) {
      setCategory(existingMatch.key);
      setAddingCat(false);
      setNewCatLabel('');
      return;
    }
    setCatSaving(true);
    try {
      const created = await dbService.addExpenseCategory(user, entryMode, parsed.data.label);
      setCategory(created.key);
      setAddingCat(false);
      setNewCatLabel('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to add category.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleReceiptFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessingFile(true);
    setErrorMsg(null);
    try {
      const remaining = Math.max(0, 10 - receipts.length);
      const next: StagedAssetInput[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        const processed = await processImageAsset(file);
        const resolvedUrl = await tryUploadToStorageOrFallback(
          `users/${user.uid}/receipts/${Date.now()}_${processed.fileName}`,
          file,
          processed.dataUrl
        );
        next.push({
          fileName: processed.fileName,
          mimeType: processed.mimeType,
          width: processed.width,
          height: processed.height,
          sizeBytes: resolvedUrl.length,
          dataUrl: resolvedUrl,
          thumbDataUrl: processed.thumbDataUrl,
          isExisting: false,
        });
      }
      setReceipts((prev) => [...prev, ...next]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to attach receipt image.');
    } finally {
      setProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = expenseSchema.safeParse({
      mode: entryMode,
      title,
      description,
      category,
      amount,
      currency,
      date,
      paymentMethod,
      adAccountId,
      campaignName,
      partnerOrAgency,
      modelName,
      photographerName,
      studioName,
      vendorOrCourier,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Please check expense fields.');
      return;
    }

    setSaving(true);
    try {
      await dbService.saveExpense(
        user,
        parsed.data,
        receipts,
        removedIds,
        editingExpense || undefined
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save expense.');
    } finally {
      setSaving(false);
    }
  };

  const selectOptions = useMemo(() => {
    const base = modeCategories.map((c) => ({ key: c.key, label: c.label }));
    if (category && !base.some((o) => o.key === category)) {
      base.push({ key: category, label: resolveCategoryLabel(category, categoryLabels) });
    }
    return base;
  }, [modeCategories, category, categoryLabels]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editingExpense
          ? 'Edit Expense Entry'
          : entryMode === 'business'
          ? 'Log Business Expense'
          : 'Log Personal Daily Expense'
      }
      subtitle={
        entryMode === 'business'
          ? 'Track Meta ads, influencers, photoshoots, raw materials, rent, or courier packaging.'
          : 'Track daily bazaar, utility bills, transportation, family healthcare, or dining out.'
      }
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        {errorMsg && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Ledger Scope Switch */}
        <div className="flex items-center justify-between gap-3 p-3 bg-[#09090b] border border-[#27272a] rounded-lg">
          <span className="text-xs font-medium text-zinc-300">Ledger Scope</span>
          <div className="inline-flex p-0.5 bg-[#18181b] border border-[#27272a] rounded-lg">
            {(['business', 'personal'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                  entryMode === m
                    ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Title *"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              entryMode === 'business'
                ? 'e.g., Eid Collection Meta Ads Boost'
                : 'e.g., Karwan Bazar Weekly Groceries'
            }
          />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="expense-category-select" className="block text-xs font-medium text-zinc-300">
                Category *
              </label>
              <button
                type="button"
                onClick={() => setAddingCat((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4ade80] hover:text-[#86efac] cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                {addingCat ? 'Close' : t.expenses.addCategoryBtn}
              </button>
            </div>
            <select
              id="expense-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
            >
              {selectOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            {addingCat && (
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  maxLength={60}
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  placeholder={t.expenses.addCategoryPlaceholder}
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={catSaving || !newCatLabel.trim()}
                  onClick={handleQuickAddCategory}
                >
                  {t.expenses.addCategoryBtn}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Input
                label="Amount *"
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="font-mono tabular-nums"
              />
            </div>
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Date (Dhaka) *"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-mono tabular-nums"
            />
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Dynamic Category-Specific Fields */}
        {entryMode === 'business' && category === 'facebook_ads' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
            <Input
              label="Ad Account ID"
              maxLength={120}
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
              placeholder="act_104928374"
              className="font-mono"
            />
            <Input
              label="Campaign Name"
              maxLength={160}
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Dhaka Winter Sale Conversion"
            />
          </div>
        )}

        {entryMode === 'business' && category === 'marketing_promo' && (
          <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
            <Input
              label="Influencer / Agency / Partner Name"
              maxLength={160}
              value={partnerOrAgency}
              onChange={(e) => setPartnerOrAgency(e.target.value)}
              placeholder="Creator or agency name"
            />
          </div>
        )}

        {entryMode === 'business' && category === 'photoshoot_model' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
            <Input
              label="Model Name"
              maxLength={120}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Model name"
            />
            <Input
              label="Photographer"
              maxLength={120}
              value={photographerName}
              onChange={(e) => setPhotographerName(e.target.value)}
              placeholder="Photographer name"
            />
            <Input
              label="Studio / Location"
              maxLength={120}
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="Banani Studio / Outdoor"
            />
          </div>
        )}

        {entryMode === 'business' &&
          (category === 'operations_packaging' ||
            category === 'raw_materials' ||
            category === 'rent_utilities') && (
            <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
              <Input
                label="Supplier / Courier / Landlord (Steadfast, Pathao, RedX, Chawkbazar)"
                maxLength={160}
                value={vendorOrCourier}
                onChange={(e) => setVendorOrCourier(e.target.value)}
                placeholder="Vendor, courier, or utility provider"
              />
            </div>
          )}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Description &amp; Notes
          </label>
          <textarea
            rows={3}
            maxLength={4000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              entryMode === 'business'
                ? 'Invoice breakdown, booking rate, box quantities, or bKash TrxID...'
                : 'Itemized bazaar notes, utility meter bill period, or TrxID...'
            }
            className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
          />
        </div>

        {/* Receipt / Invoice Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-300">
              Receipt / Voucher Photos ({receipts.length}/10)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleReceiptFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={processingFile || receipts.length >= 10}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#4ade80]" />
              {processingFile ? 'Processing...' : 'Upload Receipt'}
            </Button>
          </div>

          {receipts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {receipts.map((rcp, idx) => (
                <div
                  key={`${rcp.fileName}-${idx}`}
                  className="relative group bg-[#18181b] border border-[#27272a] rounded-lg overflow-hidden aspect-[4/3]"
                >
                  <img
                    src={rcp.dataUrl}
                    alt={rcp.fileName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (rcp.isExisting && rcp.id) {
                        setRemovedIds((prev) => [...prev, rcp.id!]);
                      }
                      setReceipts((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    aria-label="Remove receipt"
                    className="absolute top-1.5 right-1.5 p-1.5 bg-black/75 text-red-400 hover:text-red-300 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#27272a] flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || processingFile}>
            {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
