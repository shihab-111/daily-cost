import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { ImagePlus, Trash2 } from 'lucide-react';
import { CurrencyCode, Product } from '../../types';
import { dbService, StagedAssetInput } from '../../lib/firebase/db';
import { processImageAsset, tryUploadToStorageOrFallback } from '../../lib/firebase/storage';
import { productSchema } from '../../lib/validators/schemas';
import { generateSku, PRODUCT_CATEGORIES } from '../../lib/utils';
import { Button, Input, Modal, Select } from '../ui';

interface ProductModalProps {
  open: boolean;
  user: User;
  defaultCurrency: CurrencyCode;
  defaultThreshold: number;
  editingProduct: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  open,
  user,
  defaultCurrency,
  defaultThreshold,
  editingProduct,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [purchaseCost, setPurchaseCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [stockQty, setStockQty] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState(String(defaultThreshold));
  const [notes, setNotes] = useState('');

  const [photos, setPhotos] = useState<StagedAssetInput[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setRemovedIds([]);
    if (editingProduct) {
      setName(editingProduct.name);
      setSku(editingProduct.sku);
      setCategory(editingProduct.category);
      setPurchaseCost(String(editingProduct.purchaseCost));
      setSellingPrice(String(editingProduct.sellingPrice));
      setCurrency(editingProduct.currency);
      setStockQty(String(editingProduct.stockQty));
      setLowStockThreshold(String(editingProduct.lowStockThreshold));
      setNotes(editingProduct.notes);

      dbService
        .fetchProductPhotos(editingProduct.id, user)
        .then((items) => {
          setPhotos(
            items.map((p) => ({
              id: p.id,
              fileName: p.fileName,
              mimeType: p.mimeType,
              caption: p.caption,
              width: p.width,
              height: p.height,
              sizeBytes: p.sizeBytes,
              dataUrl: p.dataUrl,
              thumbDataUrl: editingProduct.thumbnailUrl || undefined,
              isExisting: true,
            }))
          );
        })
        .catch(() => {});
    } else {
      setName('');
      setSku(generateSku(PRODUCT_CATEGORIES[0]));
      setCategory(PRODUCT_CATEGORIES[0]);
      setPurchaseCost('');
      setSellingPrice('');
      setCurrency(defaultCurrency);
      setStockQty('0');
      setLowStockThreshold(String(defaultThreshold));
      setNotes('');
      setPhotos([]);
    }
  }, [open, editingProduct, defaultCurrency, defaultThreshold, user]);

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessingPhotos(true);
    setErrorMsg(null);
    try {
      const remaining = Math.max(0, 20 - photos.length);
      const next: StagedAssetInput[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        const processed = await processImageAsset(file);
        const resolvedUrl = await tryUploadToStorageOrFallback(
          `products/${user.uid}/${Date.now()}_${processed.fileName}`,
          file,
          processed.dataUrl
        );
        next.push({
          fileName: processed.fileName,
          mimeType: processed.mimeType,
          caption: '',
          width: processed.width,
          height: processed.height,
          sizeBytes: resolvedUrl.length,
          dataUrl: resolvedUrl,
          thumbDataUrl: processed.thumbDataUrl,
          isExisting: false,
        });
      }
      setPhotos((prev) => [...prev, ...next]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to process product photos.');
    } finally {
      setProcessingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = productSchema.safeParse({
      name,
      sku,
      category,
      purchaseCost,
      sellingPrice,
      currency,
      stockQty,
      lowStockThreshold,
      notes,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Please check product fields.');
      return;
    }

    setSaving(true);
    try {
      await dbService.saveProduct(
        user,
        parsed.data,
        photos,
        removedIds,
        editingProduct || undefined
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingProduct ? 'Edit Product & Inventory' : 'Add Product SKU'}
      subtitle="Track manufacturing cost, selling price, live stock units, and multi-photo assets."
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        {errorMsg && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name *"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Premium Cotton Panjabi — Midnight Black"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="SKU / Code *"
              required
              maxLength={60}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="font-mono"
            />
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Purchase Cost *"
              type="number"
              step="0.01"
              min="0"
              required
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              placeholder="0"
              className="font-mono tabular-nums"
            />
            <Input
              label="Selling Price *"
              type="number"
              step="0.01"
              min="0"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="0"
              className="font-mono tabular-nums"
            />
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
              label="Available Stock Qty *"
              type="number"
              min="0"
              required
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="font-mono tabular-nums"
            />
            <Input
              label="Low Stock Alert At"
              type="number"
              min="0"
              required
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="font-mono tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Product Specifications &amp; Sourcing Notes
          </label>
          <textarea
            rows={3}
            maxLength={4000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Fabric GSM, size ratios (M/L/XL), factory batch, or supplier contact..."
            className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
          />
        </div>

        {/* Multi-Photo Product Gallery Uploader */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-300">
              Product &amp; Model Photos ({photos.length}/20)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePhotoFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={processingPhotos || photos.length >= 20}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#4ade80]" />
              {processingPhotos ? 'Optimizing...' : 'Upload Photos'}
            </Button>
          </div>

          {photos.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#27272a] rounded-xl p-6 text-center hover:border-[#22c55e]/50 transition-colors cursor-pointer bg-[#09090b]"
            >
              <p className="text-xs font-medium text-zinc-300">
                Click to upload multi-angle product or model shoot photos
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                First image becomes the product catalog thumbnail.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={`${photo.fileName}-${idx}`}
                  className="bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 flex gap-3"
                >
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-[#09090b] border border-[#27272a] shrink-0">
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || photo.fileName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-zinc-400 truncate">
                        {photo.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (photo.isExisting && photo.id) {
                            setRemovedIds((prev) => [...prev, photo.id!]);
                          }
                          setPhotos((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        aria-label="Delete photo"
                        className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={300}
                      value={photo.caption || ''}
                      onChange={(e) =>
                        setPhotos((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, caption: e.target.value } : p
                          )
                        )
                      }
                      placeholder="Variant, size, or shot note..."
                      className="w-full px-2.5 py-1 text-xs bg-[#09090b] text-zinc-100 border border-[#27272a] rounded focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#27272a] flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || processingPhotos}>
            {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
