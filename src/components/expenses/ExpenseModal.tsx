import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { ImagePlus, Trash2 } from 'lucide-react';
import { CurrencyCode, Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { dbService, StagedAssetInput } from '../../lib/firebase/db';
import { processImageAsset, tryUploadToStorageOrFallback } from '../../lib/firebase/storage';
import { expenseSchema } from '../../lib/validators/schemas';
import {
  EXPENSE_CATEGORY_LABELS,
  getTodayDhakaDate,
  PAYMENT_METHODS,
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
    if (editingExpense) {
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
      setTitle('');
      setDescription('');
      setCategory('facebook_ads');
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
  }, [open, editingExpense, defaultCurrency, user]);

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
          `receipts/${user.uid}/${Date.now()}_${processed.fileName}`,
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingExpense ? 'Edit Expense Entry' : 'Log Business Expense'}
      subtitle="Record social media ads, marketing, photoshoot, or BD packaging & logistics costs."
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        {errorMsg && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Title *"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Eid Collection Meta Ads Boost"
          />
          <Select
            label="Category *"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          >
            {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {EXPENSE_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>

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
              label="Date *"
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
        {category === 'facebook_ads' && (
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

        {category === 'marketing_promo' && (
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

        {category === 'photoshoot_model' && (
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

        {category === 'operations_packaging' && (
          <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
            <Input
              label="Supplier / Courier Partner (Steadfast, Pathao, RedX, Chawkbazar)"
              maxLength={160}
              value={vendorOrCourier}
              onChange={(e) => setVendorOrCourier(e.target.value)}
              placeholder="Vendor or logistics company"
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
            placeholder="Invoice breakdown, booking rate, box quantities, or payment reference..."
            className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
          />
        </div>

        {/* Receipt / Invoice Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-300">
              Receipt / Invoice Photos ({receipts.length}/10)
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
