import React, { useEffect, useMemo, useState } from 'react';
import { Download, Edit3, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useMode } from '../context/ModeContext';
import { useExpenses, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import {
  convertToBdt,
  EXPENSE_CATEGORY_LABELS,
  exportExpensesCsv,
  formatMoney,
  getCategoriesForMode,
  isDateInRange,
} from '../lib/utils';
import { DateRangePreset, Expense, ExpenseCategory } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { LightboxImageItem, LightboxModal } from '../components/ui/LightboxModal';
import { Button, Card } from '../components/ui';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useMode();
  const { expenses, loading } = useExpenses(user, Boolean(user));
  const { settings } = useSettings(user, Boolean(user));

  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxItems, setLightboxItems] = useState<LightboxImageItem[] | null>(null);

  useEffect(() => {
    setCategoryFilter('all');
  }, [mode]);

  const businessName = settings?.businessName || 'EkTally';
  const defaultCurrency = settings?.currencyCode || 'BDT';
  const usdToBdtRate = settings?.usdToBdtRate || 120;
  const modeCategories = useMemo(() => getCategoriesForMode(mode), [mode]);

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
            onClick={() => exportExpensesCsv(filteredExpenses)}
          >
            <Download className="w-3.5 h-3.5 text-[#4ade80]" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingExpense(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            {mode === 'business' ? 'Log Business Expense' : 'Log Daily Expense'}
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
                    ? 'Search ads, models, couriers, suppliers, or bKash/Nagad...'
                    : 'Search bazaar, bills, CNG/Uber, shopping, or bKash/Nagad...'
                }
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg overflow-x-auto">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'today', label: 'Today' },
                    { id: 'last_7_days', label: '7D' },
                    { id: 'this_month', label: 'Month' },
                    { id: 'custom', label: 'Custom' },
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
            <div className="flex items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg overflow-x-auto">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                  categoryFilter === 'all'
                    ? 'bg-[#18181b] text-[#4ade80]'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                All {mode === 'business' ? 'Business' : 'Personal'}
              </button>
              {modeCategories.map(([catKey, catLabel]) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategoryFilter(catKey)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                    categoryFilter === catKey
                      ? 'bg-[#18181b] text-[#4ade80]'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {catLabel}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono tabular-nums text-zinc-400">
              {filteredExpenses.length} entries · Total:{' '}
              <span className="text-[#4ade80] font-semibold">
                {formatMoney(totalFilteredBdt, 'BDT')}
              </span>
            </div>
          </div>
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
                No {mode === 'business' ? 'Business' : 'Personal'} Expense Entries Found
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {mode === 'business'
                  ? 'Log Facebook Ads, influencer payouts, photoshoot costs, raw materials, or BD courier bills.'
                  : 'Log daily groceries/bazaar, utility bills, transportation, family health, or dining out.'}
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
                Log First {mode === 'business' ? 'Business' : 'Personal'} Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#121214] text-xs font-medium text-zinc-400">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Title &amp; Category Details</th>
                    <th className="py-3 px-4 hidden md:table-cell">Payment</th>
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                            {EXPENSE_CATEGORY_LABELS[exp.category] || exp.category}
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
