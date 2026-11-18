import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Edit3,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useProducts, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import {
  exportProductsCsv,
  formatMoney,
  getStockStatus,
  PRODUCT_CATEGORIES,
} from '../lib/utils';
import { Product, StockStatus } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { ProductModal } from '../components/products/ProductModal';
import { LightboxImageItem, LightboxModal } from '../components/ui/LightboxModal';
import { Button, Card } from '../components/ui';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activeBusiness, matchesBusiness } = useMode();
  const { products, loading } = useProducts(user, Boolean(user));
  const { settings } = useSettings(user, Boolean(user));

  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxItems, setLightboxItems] = useState<LightboxImageItem[] | null>(null);

  const businessName = activeBusiness?.name || settings?.businessName || 'EkTally';
  const defaultCurrency = settings?.currencyCode || 'BDT';
  const defaultThreshold = settings?.lowStockThreshold ?? 5;

  const businessProducts = useMemo(
    () => products.filter((prod) => matchesBusiness(prod.businessId)),
    [products, matchesBusiness]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return businessProducts.filter((prod) => {
      const status = getStockStatus(prod);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (categoryFilter !== 'all' && prod.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q) ||
        prod.notes.toLowerCase().includes(q)
      );
    });
  }, [businessProducts, statusFilter, categoryFilter, searchQuery]);

  const openProductLightbox = async (product: Product) => {
    if (!user) return;
    const photos = await dbService.fetchProductPhotos(product.id, user);
    if (photos.length === 0) return;
    setLightboxItems(
      photos.map((p) => ({
        id: p.id,
        fileName: p.fileName,
        caption: p.caption || `${product.name} (${product.sku})`,
        dataUrl: p.dataUrl,
        width: p.width,
        height: p.height,
      }))
    );
  };

  const handleQuickStock = async (product: Product, delta: number) => {
    if (!user) return;
    const nextQty = Math.max(0, product.stockQty + delta);
    await dbService.adjustProductStock(user, product, nextQty);
  };

  return (
    <DashboardShell
      businessName={businessName}
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 md:flex-none min-h-[40px] md:min-h-0"
            disabled={filteredProducts.length === 0}
            onClick={() => exportProductsCsv(filteredProducts)}
          >
            <Download className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>{t.common.exportCsv}</span>
          </Button>
          <Button
            size="sm"
            className="flex-1 md:flex-none min-h-[40px] md:min-h-0"
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            {t.products.addProduct}
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Filter Toolbar */}
        <Card className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.products.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg max-w-full">
              {(
                [
                  { id: 'all', label: t.common.all },
                  { id: 'in_stock', label: t.products.inStock },
                  { id: 'low_stock', label: t.products.lowStock },
                  { id: 'out_of_stock', label: t.products.outOfStock },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`flex-1 sm:flex-initial px-2.5 min-h-[38px] sm:min-h-0 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap text-center ${
                    statusFilter === st.id
                      ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <select
            aria-label="Filter by product category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full lg:w-auto px-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-xs font-medium bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
          >
            <option value="all">{t.products.allCategories}</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Card>

        {/* Inventory Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-12 bg-zinc-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-200">
                {t.products.noProductsTitle}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {t.products.noProductsDesc}
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  setEditingProduct(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                {t.products.addFirstProduct}
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Inventory Cards */}
              <div className="md:hidden divide-y divide-[#27272a]">
                {filteredProducts.map((prod) => {
                  const status = getStockStatus(prod);
                  return (
                    <div key={prod.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        {prod.thumbnailUrl ? (
                          <button
                            type="button"
                            onClick={() => openProductLightbox(prod)}
                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#27272a] shrink-0 cursor-pointer"
                          >
                            <img
                              src={prod.thumbnailUrl}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#09090b] border border-[#27272a] flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-zinc-600" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2">
                              {prod.name}
                            </p>
                            {status === 'in_stock' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4ade80] shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t.products.inStock}
                              </span>
                            ) : status === 'low_stock' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {t.products.lowStock}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 shrink-0">
                                <XCircle className="w-3.5 h-3.5" />
                                {t.products.outOfStock}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 truncate">
                            <span className="font-mono text-[#4ade80]">{prod.sku}</span>
                            <span className="mx-1.5 text-zinc-600">·</span>
                            <span>{prod.category}</span>
                            <span className="mx-1.5 text-zinc-600">·</span>
                            <span className="font-mono tabular-nums">{prod.photoCount} photos</span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs">
                        <div>
                          <span className="block text-[11px] text-zinc-400">{t.products.cost}</span>
                          <span className="font-mono tabular-nums text-zinc-200 font-medium">
                            {formatMoney(prod.purchaseCost, prod.currency)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] text-zinc-400">{t.products.selling}</span>
                          <span className="font-mono tabular-nums text-[#4ade80] font-semibold">
                            {formatMoney(prod.sellingPrice, prod.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="inline-flex items-center gap-2 bg-[#09090b] border border-[#27272a] rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => handleQuickStock(prod, -1)}
                            disabled={prod.stockQty <= 0}
                            aria-label="Decrease stock by 1"
                            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center bg-[#18181b] border border-[#27272a] rounded-md hover:border-[#22c55e] text-zinc-200 disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono tabular-nums text-sm font-semibold text-zinc-100 min-w-[2.5rem] text-center">
                            {prod.stockQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStock(prod, 1)}
                            aria-label="Increase stock by 1"
                            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center bg-[#18181b] border border-[#27272a] rounded-md hover:border-[#22c55e] text-zinc-200 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(prod);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${prod.name}`}
                            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center bg-[#09090b] border border-[#27272a] text-zinc-300 hover:text-[#4ade80] rounded-lg cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {confirmDeleteId === prod.id ? (
                            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 min-h-[40px]">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (user) await dbService.deleteProduct(user, prod);
                                  setConfirmDeleteId(null);
                                }}
                                className="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                              >
                                {t.common.delete}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                              >
                                {t.common.no}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(prod.id)}
                              aria-label={`Delete ${prod.name}`}
                              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center bg-[#09090b] border border-[#27272a] text-zinc-300 hover:text-red-400 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Inventory Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#121214] text-xs font-medium text-zinc-400">
                    <th className="py-3 px-4">{t.products.photo}</th>
                    <th className="py-3 px-4">{t.products.productSku}</th>
                    <th className="py-3 px-4 text-right">{t.products.cost}</th>
                    <th className="py-3 px-4 text-right">{t.products.selling}</th>
                    <th className="py-3 px-4 text-center">{t.products.stockLevel}</th>
                    <th className="py-3 px-4">{t.common.status}</th>
                    <th className="py-3 px-4 text-right">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-sm">
                  {filteredProducts.map((prod) => {
                    const status = getStockStatus(prod);
                    return (
                      <tr key={prod.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-2.5 px-4 w-16">
                          {prod.thumbnailUrl ? (
                            <button
                              type="button"
                              onClick={() => openProductLightbox(prod)}
                              className="relative w-11 h-11 rounded-md overflow-hidden border border-[#27272a] block cursor-pointer group"
                            >
                              <img
                                src={prod.thumbnailUrl}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </button>
                          ) : (
                            <div className="w-11 h-11 rounded-md bg-[#09090b] border border-[#27272a] flex items-center justify-center">
                              <Package className="w-4 h-4 text-zinc-600" />
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 max-w-sm">
                          <div className="font-medium text-zinc-100 truncate">
                            {prod.name}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5 truncate">
                            <span className="font-mono text-[#4ade80]">{prod.sku}</span>
                            <span className="mx-1.5 text-zinc-600">·</span>
                            <span>{prod.category}</span>
                            <span className="mx-1.5 text-zinc-600">·</span>
                            <span className="font-mono tabular-nums">
                              {prod.photoCount} photos
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-zinc-300 whitespace-nowrap">
                          {formatMoney(prod.purchaseCost, prod.currency)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-medium text-zinc-100 whitespace-nowrap">
                          {formatMoney(prod.sellingPrice, prod.currency)}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuickStock(prod, -1)}
                              disabled={prod.stockQty <= 0}
                              aria-label="Decrease stock by 1"
                              className="p-1 bg-[#09090b] border border-[#27272a] rounded hover:border-[#22c55e] text-zinc-300 disabled:opacity-40 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono tabular-nums text-sm font-semibold text-zinc-100 min-w-[2.5rem] text-center">
                              {prod.stockQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickStock(prod, 1)}
                              aria-label="Increase stock by 1"
                              className="p-1 bg-[#09090b] border border-[#27272a] rounded hover:border-[#22c55e] text-zinc-300 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {status === 'in_stock' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4ade80]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t.products.inStock}
                            </span>
                          ) : status === 'low_stock' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t.products.lowStock}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                              <XCircle className="w-3.5 h-3.5" />
                              {t.products.outOfStock}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(prod);
                                setModalOpen(true);
                              }}
                              aria-label={`Edit ${prod.name}`}
                              className="p-1.5 text-zinc-400 hover:text-[#4ade80] rounded-md cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {confirmDeleteId === prod.id ? (
                              <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (user) await dbService.deleteProduct(user, prod);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(prod.id)}
                                aria-label={`Delete ${prod.name}`}
                                className="p-1.5 text-zinc-400 hover:text-red-400 rounded-md cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </>
          )}
        </Card>
      </div>

      {user && (
        <ProductModal
          open={modalOpen}
          user={user}
          defaultCurrency={defaultCurrency}
          defaultThreshold={defaultThreshold}
          editingProduct={editingProduct}
          onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {lightboxItems && (
        <LightboxModal
          items={lightboxItems}
          initialIndex={0}
          onClose={() => setLightboxItems(null)}
        />
      )}
    </DashboardShell>
  );
};
