import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Download,
  Edit3,
  ImagePlus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useExpenseCategories, useExpenses, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import { processImageAsset } from '../lib/firebase/storage';
import {
  BUSINESS_EXPENSE_CATEGORIES,
  convertToBdt,
  exportExpensesCsv,
  formatMoney,
  isDateInRange,
  PERSONAL_EXPENSE_CATEGORIES,
  resolveCategoryLabel,
  resolveExpenseMode,
} from '../lib/utils';
import { expenseCategorySchema } from '../lib/validators/schemas';
import { DateRangePreset, Expense, ExpenseCategory, ExpenseCategoryItem } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { LightboxImageItem, LightboxModal } from '../components/ui/LightboxModal';
import { Button, Card } from '../components/ui';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mode, activeBusiness, matchesBusiness } = useMode();
  const { expenses, loading } = useExpenses(user, Boolean(user));
  const { allCategories, modeCategories, categoryLabels, categoryMap } = useExpenseCategories(
    user,
    Boolean(user),
    mode
  );
  const { settings } = useSettings(user, Boolean(user));

  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [manageCatsOpen, setManageCatsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryQty, setNewCategoryQty] = useState('');
  const [newCategoryUnitPrice, setNewCategoryUnitPrice] = useState('');
  const [newCategoryPhoto, setNewCategoryPhoto] = useState('');
  const [processingCatPhoto, setProcessingCatPhoto] = useState(false);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatLabel, setEditCatLabel] = useState('');
  const [editCatQty, setEditCatQty] = useState('');
  const [editCatUnitPrice, setEditCatUnitPrice] = useState('');
  const [editCatPhoto, setEditCatPhoto] = useState('');

  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const newCatFileRef = useRef<HTMLInputElement>(null);
  const editCatFileRef = useRef<HTMLInputElement>(null);
  const quickPhotoTargetRef = useRef<ExpenseCategoryItem | null>(null);
  const quickCatFileRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxItems, setLightboxItems] = useState<LightboxImageItem[] | null>(null);

  useEffect(() => {
    setCategoryFilter('all');
    setCatError(null);
    setEditingCatId(null);
  }, [mode]);

  const businessName = activeBusiness?.name || settings?.businessName || 'EkTally';
  const defaultCurrency = settings?.currencyCode || 'BDT';
  const usdToBdtRate = settings?.usdToBdtRate || 120;

  const missingDefaultsCount = useMemo(() => {
    const defaults =
      mode === 'business' ? BUSINESS_EXPENSE_CATEGORIES : PERSONAL_EXPENSE_CATEGORIES;
    const activeKeys = new Set(modeCategories.map((c) => c.key));
    return Object.keys(defaults).filter((k) => !activeKeys.has(k)).length;
  }, [mode, modeCategories]);

  const handleNewCatPhoto = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessingCatPhoto(true);
    setCatError(null);
    try {
      const processed = await processImageAsset(files[0]);
      setNewCategoryPhoto(processed.thumbDataUrl);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Unable to process category photo.');
    } finally {
      setProcessingCatPhoto(false);
      if (newCatFileRef.current) newCatFileRef.current.value = '';
    }
  };

  const handleEditCatPhoto = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessingCatPhoto(true);
    setCatError(null);
    try {
      const processed = await processImageAsset(files[0]);
      setEditCatPhoto(processed.thumbDataUrl);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Unable to process category photo.');
    } finally {
      setProcessingCatPhoto(false);
      if (editCatFileRef.current) editCatFileRef.current.value = '';
    }
  };

  const handleQuickCategoryPhoto = async (files: FileList | null) => {
    const target = quickPhotoTargetRef.current;
    if (!files || files.length === 0 || !user || !target) return;
    setProcessingCatPhoto(true);
    setCatError(null);
    try {
      const processed = await processImageAsset(files[0]);
      await dbService.updateExpenseCategory(user, target.id, {
        photoUrl: processed.thumbDataUrl,
      });
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Unable to upload category photo.');
    } finally {
      setProcessingCatPhoto(false);
      quickPhotoTargetRef.current = null;
      if (quickCatFileRef.current) quickCatFileRef.current.value = '';
    }
  };

  const startEditingCategory = (cat: ExpenseCategoryItem) => {
    setEditingCatId(cat.id);
    setEditCatLabel(cat.label);
    setEditCatQty(cat.quantity ? String(cat.quantity) : '');
    setEditCatUnitPrice(cat.unitPrice ? String(cat.unitPrice) : '');
    setEditCatPhoto(cat.photoUrl || '');
    setCatError(null);
  };

  const handleSaveCategoryEdit = async (cat: ExpenseCategoryItem) => {
    if (!user) return;
    setCatError(null);
    const parsed = expenseCategorySchema.safeParse({
      mode,
      label: editCatLabel,
      photoUrl: editCatPhoto,
      quantity: editCatQty || 0,
      unitPrice: editCatUnitPrice || 0,
    });
    if (!parsed.success) {
      setCatError(parsed.error.issues[0]?.message || 'Check category fields.');
      return;
    }
    const normalized = parsed.data.label.toLowerCase();
    if (
      modeCategories.some(
        (c) => c.id !== cat.id && c.label.trim().toLowerCase() === normalized
      )
    ) {
      setCatError(t.expenses.duplicateCategory);
      return;
    }
    setCatSaving(true);
    try {
      await dbService.updateExpenseCategory(user, cat.id, {
        label: parsed.data.label,
        photoUrl: parsed.data.photoUrl,
        quantity: parsed.data.quantity,
        unitPrice: parsed.data.unitPrice,
      });
      setEditingCatId(null);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Unable to update category.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCatError(null);
    const parsed = expenseCategorySchema.safeParse({
      mode,
      label: newCategoryName,
      photoUrl: newCategoryPhoto,
      quantity: newCategoryQty || 0,
      unitPrice: newCategoryUnitPrice || 0,
    });
    if (!parsed.success) {
      setCatError(parsed.error.issues[0]?.message || 'Enter a category name.');
      return;
    }
    const normalized = parsed.data.label.toLowerCase();
    if (modeCategories.some((c) => c.label.trim().toLowerCase() === normalized)) {
      setCatError(t.expenses.duplicateCategory);
      return;
    }
    setCatSaving(true);
    try {
      await dbService.addExpenseCategory(user, mode, parsed.data.label, {
        photoUrl: parsed.data.photoUrl,
        quantity: parsed.data.quantity,
        unitPrice: parsed.data.unitPrice,
      });
      setNewCategoryName('');
      setNewCategoryQty('');
      setNewCategoryUnitPrice('');
      setNewCategoryPhoto('');
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Unable to add category.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catKey: string) => {
    if (!user) return;
    setCatError(null);
    try {
      await dbService.deleteExpenseCategory(user, catId);
      if (editingCatId === catId) setEditingCatId(null);
      if (categoryFilter === catKey) {
        setCategoryFilter('all');
      }
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Unable to delete category.');
    }
  };

  const handleRestoreDefaults = async () => {
    if (!user) return;
    setCatSaving(true);
    setCatError(null);
    try {
      const existingKeys = new Set(modeCategories.map((c) => c.key));
      await dbService.restoreDefaultExpenseCategories(user, mode, existingKeys);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Unable to restore default categories.');
    } finally {
      setCatSaving(false);
    }
  };

  const modeExpenses = useMemo(
    () =>
      expenses.filter(
        (exp) =>
          resolveExpenseMode(exp, allCategories) === mode &&
          (mode === 'personal' || matchesBusiness(exp.businessId))
      ),
    [expenses, allCategories, mode, matchesBusiness]
  );

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return modeExpenses.filter((exp) => {
      if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;
      if (!isDateInRange(exp.date, datePreset, customStart, customEnd)) return false;
      if (!q) return true;
      const haystack = [
        exp.title,
        exp.description,
        exp.paymentMethod,
        exp.adAccountId,
        exp.campaignName,
        exp.partnerOrAgency,
        exp.modelName,
        exp.photographerName,
        exp.studioName,
        exp.vendorOrCourier,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [modeExpenses, categoryFilter, datePreset, customStart, customEnd, searchQuery]);

  const totalFilteredBdt = useMemo(
    () =>
      filteredExpenses.reduce(
        (sum, e) => sum + convertToBdt(e.amount, e.currency, usdToBdtRate),
        0
      ),
    [filteredExpenses, usdToBdtRate]
  );

  const openReceiptsLightbox = async (expense: Expense) => {
    if (!user) return;
    const receipts = await dbService.fetchExpenseReceipts(expense.id, user);
    if (receipts.length === 0) return;
    setLightboxItems(
      receipts.map((r) => ({
        id: r.id,
        fileName: r.fileName,
        caption: `${expense.title} · ${expense.date}`,
        dataUrl: r.dataUrl,
        width: r.width,
        height: r.height,
      }))
    );
  };

  const renderCategoryContext = (exp: Expense): string => {
    if (exp.category === 'facebook_ads') {
      return [exp.campaignName, exp.adAccountId].filter(Boolean).join(' · ') || 'Meta / Social Ads';
    }
    if (exp.category === 'marketing_promo') {
      return exp.partnerOrAgency || 'Marketing & Promotions';
    }
    if (exp.category === 'photoshoot_model') {
      return (
        [exp.modelName, exp.photographerName, exp.studioName].filter(Boolean).join(' · ') ||
        'Studio / Shoot'
      );
    }
    if (exp.vendorOrCourier) return exp.vendorOrCourier;
    if (exp.description) return exp.description.slice(0, 60);
    return exp.paymentMethod;
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
            disabled={filteredExpenses.length === 0}
            onClick={() => exportExpensesCsv(filteredExpenses, categoryLabels)}
          >
            <Download className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>{t.common.exportCsv}</span>
          </Button>
          <Button
            size="sm"
            className="flex-1 md:flex-none min-h-[40px] md:min-h-0"
            onClick={() => {
              setEditingExpense(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            {mode === 'business' ? t.expenses.logBusinessExpense : t.expenses.logDailyExpense}
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Filter Toolbar */}
        <Card className="p-3.5 sm:p-4 space-y-3.5 sm:space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  mode === 'business'
                    ? t.expenses.searchBusiness
                    : t.expenses.searchPersonal
                }
                className="w-full pl-9 pr-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg overflow-x-auto no-scrollbar max-w-full">
                {(
                  [
                    { id: 'all', label: t.common.all },
                    { id: 'today', label: t.common.today },
                    { id: 'last_7_days', label: t.common.last7DShort },
                    { id: 'this_month', label: t.common.monthShort },
                    { id: 'custom', label: t.common.custom },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDatePreset(p.id)}
                    className={`px-2.5 min-h-[36px] sm:min-h-0 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                      datePreset === p.id
                        ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {datePreset === 'custom' && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full sm:w-auto px-2.5 py-2 sm:py-1 text-sm sm:text-xs font-mono bg-[#09090b] border border-[#27272a] rounded-md text-zinc-100"
                  />
                  <span className="text-xs text-zinc-500 text-center sm:text-left">-</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full sm:w-auto px-2.5 py-2 sm:py-1 text-sm sm:text-xs font-mono bg-[#09090b] border border-[#27272a] rounded-md text-zinc-100"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 pt-3 border-t border-[#27272a]">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg overflow-x-auto no-scrollbar max-w-full">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 min-h-[36px] sm:min-h-0 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                    categoryFilter === 'all'
                      ? 'bg-[#18181b] text-[#4ade80]'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {mode === 'business' ? t.expenses.allBusiness : t.expenses.allPersonal}
                </button>
                {modeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`inline-flex items-center gap-1.5 px-3 min-h-[36px] sm:min-h-0 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                      categoryFilter === cat.key
                        ? 'bg-[#18181b] text-[#4ade80]'
                        : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {cat.photoUrl && (
                      <img
                        src={cat.photoUrl}
                        alt={cat.label}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-sm object-cover shrink-0"
                      />
                    )}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setManageCatsOpen((o) => !o);
                  setCatError(null);
                }}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] sm:min-h-0 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  manageCatsOpen
                    ? 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/40'
                    : 'bg-[#09090b] text-zinc-300 border-[#27272a] hover:border-zinc-600 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>
                  {manageCatsOpen ? t.expenses.doneManaging : t.expenses.manageCategories}
                </span>
              </button>
            </div>

            <div className="text-xs font-mono tabular-nums text-zinc-400 shrink-0">
              {filteredExpenses.length} {t.expenses.entries} · {t.expenses.total}:{' '}
              <span className="text-[#4ade80] font-semibold">
                {formatMoney(totalFilteredBdt, 'BDT')}
              </span>
            </div>
          </div>

          {manageCatsOpen && (
            <div className="p-3.5 sm:p-4 rounded-lg bg-[#09090b] border border-[#27272a] space-y-4">
              <input
                ref={quickCatFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleQuickCategoryPhoto(e.target.files)}
              />
              <input
                ref={editCatFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleEditCatPhoto(e.target.files)}
              />

              {/* Add New Category with Photo, Quantity, and Per Pics Price */}
              <form onSubmit={handleAddCategory} className="space-y-2.5">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-end gap-2.5">
                  <div className="col-span-2 flex items-end gap-2.5 sm:contents">
                    <div className="shrink-0">
                      <input
                        ref={newCatFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleNewCatPhoto(e.target.files)}
                      />
                      {newCategoryPhoto ? (
                        <div className="relative w-11 h-11 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-[#27272a] group">
                          <img
                            src={newCategoryPhoto}
                            alt="Category preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setNewCategoryPhoto('')}
                            aria-label={t.expenses.removePhoto}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={processingCatPhoto}
                          onClick={() => newCatFileRef.current?.click()}
                          title={t.expenses.uploadPhoto}
                          className="w-11 h-11 sm:w-10 sm:h-10 rounded-lg border border-dashed border-[#27272a] hover:border-[#22c55e] bg-[#121214] flex items-center justify-center text-zinc-400 hover:text-[#4ade80] transition-colors cursor-pointer"
                        >
                          <ImagePlus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 sm:min-w-[180px] space-y-1">
                      <label className="block text-[11px] font-medium text-zinc-400">
                        {t.expenses.category}
                      </label>
                      <input
                        type="text"
                        maxLength={60}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder={t.expenses.addCategoryPlaceholder}
                        className="w-full px-3 py-2 sm:py-1.5 text-base sm:text-xs bg-[#121214] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                  </div>

                  <div className="w-full sm:w-24 space-y-1">
                    <label className="block text-[11px] font-medium text-zinc-400">
                      {t.expenses.quantity}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newCategoryQty}
                      onChange={(e) => setNewCategoryQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-2 sm:py-1.5 text-base sm:text-xs font-mono tabular-nums bg-[#121214] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>

                  <div className="w-full sm:w-32 space-y-1">
                    <label className="block text-[11px] font-medium text-zinc-400">
                      {t.expenses.perPiecePrice}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newCategoryUnitPrice}
                      onChange={(e) => setNewCategoryUnitPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-2 sm:py-1.5 text-base sm:text-xs font-mono tabular-nums bg-[#121214] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>

                  <div className="col-span-2 sm:w-auto flex flex-wrap items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1 sm:flex-none min-h-[40px] sm:min-h-0"
                      disabled={catSaving || processingCatPhoto || !newCategoryName.trim()}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.expenses.addCategoryBtn}
                    </Button>
                    {missingDefaultsCount > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="flex-1 sm:flex-none min-h-[40px] sm:min-h-0"
                        disabled={catSaving}
                        onClick={handleRestoreDefaults}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#4ade80]" />
                        {t.expenses.restoreDefaults}
                      </Button>
                    )}
                  </div>
                </div>

                {(Number(newCategoryQty) > 0 || Number(newCategoryUnitPrice) > 0) && (
                  <p className="text-[11px] font-mono tabular-nums text-zinc-400">
                    {Number(newCategoryQty) || 0} × {formatMoney(Number(newCategoryUnitPrice) || 0, defaultCurrency)} ={' '}
                    <span className="text-[#4ade80] font-semibold">
                      {formatMoney(
                        (Number(newCategoryQty) || 0) * (Number(newCategoryUnitPrice) || 0),
                        defaultCurrency
                      )}
                    </span>
                  </p>
                )}
              </form>

              {catError && <p className="text-xs text-red-400">{catError}</p>}

              {/* Editable Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 pt-1 border-t border-[#27272a]">
                {modeCategories.map((cat) => {
                  const isEditing = editingCatId === cat.id;
                  const qty = Number(cat.quantity || 0);
                  const unitPrice = Number(cat.unitPrice || 0);
                  const catTotal = qty * unitPrice;

                  if (isEditing) {
                    return (
                      <div
                        key={cat.id}
                        className="p-3 bg-[#18181b] border border-[#22c55e]/50 rounded-lg space-y-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="shrink-0">
                            {editCatPhoto ? (
                              <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#27272a]">
                                <img
                                  src={editCatPhoto}
                                  alt={editCatLabel}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditCatPhoto('')}
                                  aria-label={t.expenses.removePhoto}
                                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 text-red-400 rounded cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => editCatFileRef.current?.click()}
                                title={t.expenses.uploadPhoto}
                                className="w-11 h-11 rounded-lg border border-dashed border-[#27272a] hover:border-[#22c55e] bg-[#09090b] flex items-center justify-center text-zinc-400 hover:text-[#4ade80] cursor-pointer"
                              >
                                <ImagePlus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              type="text"
                              maxLength={60}
                              value={editCatLabel}
                              onChange={(e) => setEditCatLabel(e.target.value)}
                              className="w-full px-2.5 py-1.5 sm:py-1 text-base sm:text-xs bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-md focus:outline-none focus:border-[#22c55e]"
                            />
                            <button
                              type="button"
                              onClick={() => editCatFileRef.current?.click()}
                              className="text-[11px] text-[#4ade80] hover:underline cursor-pointer"
                            >
                              {editCatPhoto ? t.expenses.changePhoto : t.expenses.uploadPhoto}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-0.5">
                              {t.expenses.quantity}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={editCatQty}
                              onChange={(e) => setEditCatQty(e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1.5 sm:py-1 text-base sm:text-xs font-mono tabular-nums bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-md focus:outline-none focus:border-[#22c55e]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-0.5">
                              {t.expenses.perPiecePrice}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editCatUnitPrice}
                              onChange={(e) => setEditCatUnitPrice(e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 sm:py-1 text-base sm:text-xs font-mono tabular-nums bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-md focus:outline-none focus:border-[#22c55e]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="px-2.5 min-h-[36px] sm:min-h-0 py-1 text-xs text-zinc-400 hover:text-zinc-200 rounded cursor-pointer"
                          >
                            {t.expenses.cancelEdit}
                          </button>
                          <Button
                            type="button"
                            size="sm"
                            className="min-h-[36px] sm:min-h-0"
                            disabled={catSaving || processingCatPhoto || !editCatLabel.trim()}
                            onClick={() => handleSaveCategoryEdit(cat)}
                          >
                            <Check className="w-3 h-3" />
                            {t.expenses.saveCategory}
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between gap-2.5 p-2.5 bg-[#121214] border border-[#27272a] rounded-lg"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {cat.photoUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxItems([
                                {
                                  id: cat.id,
                                  fileName: `${cat.label}.jpg`,
                                  caption: cat.label,
                                  dataUrl: cat.photoUrl!,
                                  width: 320,
                                  height: 320,
                                },
                              ])
                            }
                            className="w-10 h-10 rounded-md overflow-hidden border border-[#27272a] shrink-0 cursor-pointer"
                          >
                            <img
                              src={cat.photoUrl}
                              alt={cat.label}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              quickPhotoTargetRef.current = cat;
                              quickCatFileRef.current?.click();
                            }}
                            title={t.expenses.uploadPhoto}
                            className="w-10 h-10 rounded-md bg-[#09090b] border border-dashed border-[#27272a] hover:border-[#22c55e] flex items-center justify-center text-zinc-500 hover:text-[#4ade80] shrink-0 cursor-pointer"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-100 truncate">
                            {cat.label}
                          </div>
                          {(qty > 0 || unitPrice > 0) && (
                            <div className="text-[11px] font-mono tabular-nums text-zinc-400 truncate mt-0.5">
                              {qty > 0 ? `${qty} pcs` : ''}
                              {qty > 0 && unitPrice > 0 ? ' · ' : ''}
                              {unitPrice > 0 ? `${formatMoney(unitPrice, defaultCurrency)}/pc` : ''}
                              {catTotal > 0 ? (
                                <span className="text-[#4ade80]">
                                  {' '}
                                  · {formatMoney(catTotal, defaultCurrency)}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            quickPhotoTargetRef.current = cat;
                            quickCatFileRef.current?.click();
                          }}
                          title={cat.photoUrl ? t.expenses.changePhoto : t.expenses.uploadPhoto}
                          aria-label={`${t.expenses.uploadPhoto} ${cat.label}`}
                          className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center p-1.5 text-zinc-400 hover:text-[#4ade80] rounded cursor-pointer"
                        >
                          <ImagePlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingCategory(cat)}
                          title={t.expenses.editCategory}
                          aria-label={`${t.expenses.editCategory} ${cat.label}`}
                          className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center p-1.5 text-zinc-400 hover:text-[#4ade80] rounded cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.key)}
                          aria-label={`${t.expenses.deleteCategoryTitle} ${cat.label}`}
                          title={t.expenses.deleteCategoryTitle}
                          className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center p-1.5 text-zinc-400 hover:text-red-400 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Expense Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-12 bg-zinc-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-200">
                {t.expenses.noExpensesTitle}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {mode === 'business' ? t.expenses.noBusinessEmpty : t.expenses.noPersonalEmpty}
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  setEditingExpense(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                {mode === 'business' ? t.expenses.logBusinessExpense : t.expenses.logDailyExpense}
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Expense Cards */}
              <div className="md:hidden divide-y divide-[#27272a]">
                {filteredExpenses.map((exp) => {
                  const catItem = categoryMap[exp.category];
                  const expQty = Number(exp.quantity || 0);
                  const expUnitPrice = Number(exp.unitPrice || 0);
                  return (
                    <div key={exp.id} className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono tabular-nums text-zinc-400">
                          {exp.date} · {exp.paymentMethod}
                        </span>
                        <span className="text-sm font-mono tabular-nums font-semibold text-zinc-100 shrink-0">
                          {formatMoney(exp.amount, exp.currency)}
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        {catItem?.photoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxItems([
                                {
                                  id: catItem.id,
                                  fileName: `${catItem.label}.jpg`,
                                  caption: catItem.label,
                                  dataUrl: catItem.photoUrl!,
                                  width: 320,
                                  height: 320,
                                },
                              ])
                            }
                            className="w-10 h-10 rounded-md overflow-hidden border border-[#27272a] shrink-0 cursor-pointer"
                          >
                            <img
                              src={catItem.photoUrl}
                              alt={catItem.label}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-100 leading-snug">
                            {exp.title}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1 break-words">
                            <span className="text-[#4ade80]">
                              {resolveCategoryLabel(exp.category, categoryLabels)}
                            </span>
                            {(expQty > 0 || expUnitPrice > 0) && (
                              <>
                                <span className="mx-1.5 text-zinc-600">·</span>
                                <span className="font-mono tabular-nums text-zinc-300">
                                  {expQty > 0 ? `${expQty} pcs` : ''}
                                  {expQty > 0 && expUnitPrice > 0 ? ' × ' : ''}
                                  {expUnitPrice > 0
                                    ? `${formatMoney(expUnitPrice, exp.currency)}/pc`
                                    : ''}
                                </span>
                              </>
                            )}
                            <span className="mx-1.5 text-zinc-600">·</span>
                            <span>{renderCategoryContext(exp)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#27272a]/70">
                        <div>
                          {exp.receiptCount > 0 && exp.receiptThumb ? (
                            <button
                              type="button"
                              onClick={() => openReceiptsLightbox(exp)}
                              className="inline-flex items-center gap-2 min-h-[38px] text-xs text-[#4ade80] hover:underline cursor-pointer"
                            >
                              <img
                                src={exp.receiptThumb}
                                alt="Receipt"
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded object-cover border border-[#27272a]"
                              />
                              <span className="font-mono tabular-nums">
                                {exp.receiptCount} {t.expenses.receipt}
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-zinc-600">—</span>
                          )}
                        </div>

                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpense(exp);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${exp.title}`}
                            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center bg-[#09090b] border border-[#27272a] text-zinc-300 hover:text-[#4ade80] rounded-lg cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {confirmDeleteId === exp.id ? (
                            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 min-h-[40px]">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (user) await dbService.deleteExpense(user, exp);
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
                              onClick={() => setConfirmDeleteId(exp.id)}
                              aria-label={`Delete ${exp.title}`}
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

              {/* Desktop Expense Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#121214] text-xs font-medium text-zinc-400">
                    <th className="py-3 px-4">{t.expenses.date}</th>
                    <th className="py-3 px-4">{t.expenses.titleDetails}</th>
                    <th className="py-3 px-4 hidden md:table-cell">{t.expenses.payment}</th>
                    <th className="py-3 px-4">{t.expenses.receipt}</th>
                    <th className="py-3 px-4 text-right">{t.expenses.amount}</th>
                    <th className="py-3 px-4 text-right">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-sm">
                  {filteredExpenses.map((exp) => {
                    const catItem = categoryMap[exp.category];
                    const expQty = Number(exp.quantity || 0);
                    const expUnitPrice = Number(exp.unitPrice || 0);
                    return (
                    <tr key={exp.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-zinc-400 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="flex items-center gap-2.5">
                          {catItem?.photoUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxItems([
                                  {
                                    id: catItem.id,
                                    fileName: `${catItem.label}.jpg`,
                                    caption: catItem.label,
                                    dataUrl: catItem.photoUrl!,
                                    width: 320,
                                    height: 320,
                                  },
                                ])
                              }
                              className="w-8 h-8 rounded-md overflow-hidden border border-[#27272a] shrink-0 cursor-pointer"
                            >
                              <img
                                src={catItem.photoUrl}
                                alt={catItem.label}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-zinc-100 truncate">
                              {exp.title}
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5 truncate">
                              <span className="text-[#4ade80]">
                                {resolveCategoryLabel(exp.category, categoryLabels)}
                              </span>
                              {(expQty > 0 || expUnitPrice > 0) && (
                                <>
                                  <span className="mx-1.5 text-zinc-600">·</span>
                                  <span className="font-mono tabular-nums text-zinc-300">
                                    {expQty > 0 ? `${expQty} pcs` : ''}
                                    {expQty > 0 && expUnitPrice > 0 ? ' × ' : ''}
                                    {expUnitPrice > 0
                                      ? `${formatMoney(expUnitPrice, exp.currency)}/pc`
                                      : ''}
                                  </span>
                                </>
                              )}
                              <span className="mx-1.5 text-zinc-600">·</span>
                              <span>{renderCategoryContext(exp)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-xs text-zinc-300 whitespace-nowrap">
                        {exp.paymentMethod}
                      </td>
                      <td className="py-3 px-4">
                        {exp.receiptCount > 0 && exp.receiptThumb ? (
                          <button
                            type="button"
                            onClick={() => openReceiptsLightbox(exp)}
                            className="inline-flex items-center gap-2 text-xs text-[#4ade80] hover:underline cursor-pointer"
                          >
                            <img
                              src={exp.receiptThumb}
                              alt="Receipt"
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded object-cover border border-[#27272a]"
                            />
                            <span className="font-mono tabular-nums">
                              {exp.receiptCount}
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-zinc-100 whitespace-nowrap">
                        {formatMoney(exp.amount, exp.currency)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpense(exp);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${exp.title}`}
                            className="p-1.5 text-zinc-400 hover:text-[#4ade80] rounded-md cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {confirmDeleteId === exp.id ? (
                            <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (user) await dbService.deleteExpense(user, exp);
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
                              onClick={() => setConfirmDeleteId(exp.id)}
                              aria-label={`Delete ${exp.title}`}
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
        <ExpenseModal
          open={modalOpen}
          user={user}
          defaultCurrency={defaultCurrency}
          editingExpense={editingExpense}
          onClose={() => {
            setModalOpen(false);
            setEditingExpense(null);
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
