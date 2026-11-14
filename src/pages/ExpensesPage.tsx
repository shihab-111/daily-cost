import React, { useEffect, useMemo, useState } from 'react';
import { Download, Edit3, Plus, Receipt, RotateCcw, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useExpenseCategories, useExpenses, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import {
  BUSINESS_EXPENSE_CATEGORIES,
  convertToBdt,
  exportExpensesCsv,
  formatMoney,
  isDateInRange,
  PERSONAL_EXPENSE_CATEGORIES,
  resolveCategoryLabel,
} from '../lib/utils';
import { expenseCategorySchema } from '../lib/validators/schemas';
import { DateRangePreset, Expense, ExpenseCategory } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { LightboxImageItem, LightboxModal } from '../components/ui/LightboxModal';
import { Button, Card } from '../components/ui';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mode } = useMode();
  const { expenses, loading } = useExpenses(user, Boolean(user));
  const { modeCategories, categoryLabels } = useExpenseCategories(user, Boolean(user), mode);
  const { settings } = useSettings(user, Boolean(user));

  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [manageCatsOpen, setManageCatsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxItems, setLightboxItems] = useState<LightboxImageItem[] | null>(null);

  useEffect(() => {
    setCategoryFilter('all');
    setCatError(null);
  }, [mode]);

  const businessName = settings?.businessName || 'EkTally';
  const defaultCurrency = settings?.currencyCode || 'BDT';
  const usdToBdtRate = settings?.usdToBdtRate || 120;

  const missingDefaultsCount = useMemo(() => {
    const defaults =
      mode === 'business' ? BUSINESS_EXPENSE_CATEGORIES : PERSONAL_EXPENSE_CATEGORIES;
    const activeKeys = new Set(modeCategories.map((c) => c.key));
    return Object.keys(defaults).filter((k) => !activeKeys.has(k)).length;
  }, [mode, modeCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCatError(null);
    const parsed = expenseCategorySchema.safeParse({ mode, label: newCategoryName });
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
      await dbService.addExpenseCategory(user, mode, parsed.data.label);
      setNewCategoryName('');
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
    () => expenses.filter((exp) => (exp.mode || 'business') === mode),
    [expenses, mode]
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
            disabled={filteredExpenses.length === 0}
            onClick={() => exportExpensesCsv(filteredExpenses, categoryLabels)}
          >
            <Download className="w-3.5 h-3.5 text-[#4ade80]" />
            <span className="hidden sm:inline">{t.common.exportCsv}</span>
          </Button>
          <Button
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
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Filter Toolbar */}
        <Card className="p-4 space-y-4">
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
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg overflow-x-auto">
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
                    className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
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
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="px-2 py-1 text-xs font-mono bg-[#09090b] border border-[#27272a] rounded-md text-zinc-100"
                  />
                  <span className="text-xs text-zinc-500">-</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="px-2 py-1 text-xs font-mono bg-[#09090b] border border-[#27272a] rounded-md text-zinc-100"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#27272a]">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
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
                    className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                      categoryFilter === cat.key
                        ? 'bg-[#18181b] text-[#4ade80]'
                        : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setManageCatsOpen((o) => !o);
                  setCatError(null);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
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

            <div className="text-xs font-mono tabular-nums text-zinc-400">
              {filteredExpenses.length} {t.expenses.entries} · {t.expenses.total}:{' '}
              <span className="text-[#4ade80] font-semibold">
                {formatMoney(totalFilteredBdt, 'BDT')}
              </span>
            </div>
          </div>

          {manageCatsOpen && (
            <div className="p-3.5 rounded-lg bg-[#09090b] border border-[#27272a] space-y-3">
              <form onSubmit={handleAddCategory} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  maxLength={60}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t.expenses.addCategoryPlaceholder}
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-[#121214] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
                />
                <Button type="submit" size="sm" disabled={catSaving || !newCategoryName.trim()}>
                  <Plus className="w-3.5 h-3.5" />
                  {t.expenses.addCategoryBtn}
                </Button>
                {missingDefaultsCount > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={catSaving}
                    onClick={handleRestoreDefaults}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#4ade80]" />
                    {t.expenses.restoreDefaults}
                  </Button>
                )}
              </form>

              {catError && (
                <p className="text-xs text-red-400">{catError}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {modeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-xs bg-[#18181b] border border-[#27272a] rounded-md text-zinc-200"
                  >
                    <span>{cat.label}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id, cat.key)}
                      aria-label={`${t.expenses.deleteCategoryTitle} ${cat.label}`}
                      title={t.expenses.deleteCategoryTitle}
                      className="p-0.5 text-zinc-400 hover:text-red-400 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
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
            <div className="overflow-x-auto">
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
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-zinc-400 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-medium text-zinc-100 truncate">
                          {exp.title}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 truncate">
                          <span className="text-[#4ade80]">
                            {resolveCategoryLabel(exp.category, categoryLabels)}
                          </span>
                          <span className="mx-1.5 text-zinc-600">·</span>
                          <span>{renderCategoryContext(exp)}</span>
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
                  ))}
                </tbody>
              </table>
            </div>
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
