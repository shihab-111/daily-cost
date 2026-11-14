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
  const { products, loading } = useProducts(user, Boolean(user));
  const { settings } = useSettings(user, Boolean(user));

  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxItems, setLightboxItems] = useState<LightboxImageItem[] | null>(null);

  const businessName = settings?.businessName || 'Meridian BD Ops';
  const defaultCurrency = settings?.currencyCode || 'BDT';
  const defaultThreshold = settings?.lowStockThreshold ?? 5;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((prod) => {
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
  }, [products, statusFilter, categoryFilter, searchQuery]);

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
            disabled={filteredProducts.length === 0}
            onClick={() => exportProductsCsv(filteredProducts)}
          >
            <Download className="w-3.5 h-3.5 text-[#4ade80]" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Filter Toolbar */}
        <Card className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, product name, fabric, or notes..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg overflow-x-auto">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'in_stock', label: 'In Stock' },
                  { id: 'low_stock', label: 'Low Stock' },
                  { id: 'out_of_stock', label: 'Out of Stock' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
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
            className="px-3 py-2 text-xs font-medium bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
          >
            <option value="all">All Categories</option>
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
                No Products in Inventory
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Add SKUs with purchase cost, selling price, stock units, and multi-photo galleries.
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
                Add First Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#121214] text-xs font-medium text-zinc-400">
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Product &amp; SKU</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                    <th className="py-3 px-4 text-right">Selling</th>
                    <th className="py-3 px-4 text-center">Stock Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                              In Stock
                            </span>
                          ) : status === 'low_stock' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                              <XCircle className="w-3.5 h-3.5" />
                              Out of Stock
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
