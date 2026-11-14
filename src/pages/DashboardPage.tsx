import React, { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import {
  useActivityLogs,
  useExpenses,
  useProducts,
  useSettings,
} from '../hooks/useBusinessData';
import {
  convertToBdt,
  exportExpensesCsv,
  exportProductsCsv,
  formatMoney,
  getDhakaDayOfMonth,
  getStockStatus,
  getTodayDhakaDate,
  isDateInRange,
} from '../lib/utils';
import { DateRangePreset } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { OverviewCharts } from '../components/dashboard/OverviewCharts';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { ProductModal } from '../components/products/ProductModal';
import { Button, Card } from '../components/ui';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mode } = useMode();
  const { expenses, loading: expLoading } = useExpenses(user, Boolean(user));
  const { products, loading: prodLoading } = useProducts(user, Boolean(user));
  const { settings } = useSettings(user, Boolean(user));
  const { logs } = useActivityLogs(user, Boolean(user));

  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const businessName = settings?.businessName || 'EkTally';
  const defaultCurrency = settings?.currencyCode || 'BDT';
  const usdToBdtRate = settings?.usdToBdtRate || 120;
  const defaultThreshold = settings?.lowStockThreshold ?? 5;
  const monthlyBudgetBdt = settings?.personalMonthlyBudget ?? 25000;

  const modeExpenses = useMemo(
    () => expenses.filter((e) => (e.mode || 'business') === mode),
    [expenses, mode]
  );

  const modeLogs = useMemo(
    () => logs.filter((l) => (l.mode || 'business') === mode),
    [logs, mode]
  );

  const filteredExpenses = useMemo(
    () =>
      modeExpenses.filter((e) =>
        isDateInRange(e.date, datePreset, customStart, customEnd)
      ),
    [modeExpenses, datePreset, customStart, customEnd]
  );

  const businessKpis = useMemo(() => {
    const totalExpensesBdt = filteredExpenses.reduce(
      (sum, e) => sum + convertToBdt(e.amount, e.currency, usdToBdtRate),
      0
    );
    const marketingSpendBdt = filteredExpenses
      .filter((e) => e.category === 'facebook_ads' || e.category === 'marketing_promo')
      .reduce((sum, e) => sum + convertToBdt(e.amount, e.currency, usdToBdtRate), 0);

    const inventoryCostValueBdt = products.reduce(
      (sum, p) =>
        sum + convertToBdt(p.purchaseCost * p.stockQty, p.currency, usdToBdtRate),
      0
    );
    const inventoryRetailValueBdt = products.reduce(
      (sum, p) =>
        sum + convertToBdt(p.sellingPrice * p.stockQty, p.currency, usdToBdtRate),
      0
    );
    const totalUnits = products.reduce((sum, p) => sum + p.stockQty, 0);
    const lowOrOutCount = products.filter((p) => getStockStatus(p) !== 'in_stock').length;

    return {
      totalExpensesBdt,
      marketingSpendBdt,
      marketingShare:
        totalExpensesBdt > 0 ? Math.round((marketingSpendBdt / totalExpensesBdt) * 100) : 0,
      inventoryCostValueBdt,
      inventoryRetailValueBdt,
      totalUnits,
      lowOrOutCount,
    };
  }, [filteredExpenses, products, usdToBdtRate]);

  const personalKpis = useMemo(() => {
    const todayDhaka = getTodayDhakaDate();
    const currentMonthPrefix = todayDhaka.slice(0, 7);
    const dayOfMonth = getDhakaDayOfMonth();

    const periodSpendBdt = filteredExpenses.reduce(
      (sum, e) => sum + convertToBdt(e.amount, e.currency, usdToBdtRate),
      0
    );
    const thisMonthSpendBdt = modeExpenses
      .filter((e) => e.date.slice(0, 7) === currentMonthPrefix)
      .reduce((sum, e) => sum + convertToBdt(e.amount, e.currency, usdToBdtRate), 0);
    const todaySpendBdt = modeExpenses
      .filter((e) => e.date === todayDhaka)
      .reduce((sum, e) => sum + convertToBdt(e.amount, e.currency, usdToBdtRate), 0);

    const dailyAverageBdt = Math.round(thisMonthSpendBdt / dayOfMonth);
    const budgetRemainingBdt = monthlyBudgetBdt - thisMonthSpendBdt;
    const budgetPct =
      monthlyBudgetBdt > 0 ? Math.round((thisMonthSpendBdt / monthlyBudgetBdt) * 100) : 0;

    return {
      periodSpendBdt,
      thisMonthSpendBdt,
      todaySpendBdt,
      dailyAverageBdt,
      budgetRemainingBdt,
      budgetPct,
      dayOfMonth,
    };
  }, [filteredExpenses, modeExpenses, usdToBdtRate, monthlyBudgetBdt]);

  return (
    <DashboardShell
      businessName={businessName}
      headerAction={
        <div className="flex items-center gap-2">
          {mode === 'business' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setProductModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 text-[#4ade80]" />
              <span className="hidden sm:inline">{t.dashboard.addProduct}</span>
            </Button>
          )}
          <Button size="sm" onClick={() => setExpenseModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            {mode === 'business' ? t.dashboard.logBusinessExpense : t.dashboard.quickLogExpense}
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Date Range Filter & Export Bar */}
        <Card className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg overflow-x-auto">
              {(
                [
                  { id: 'all', label: t.common.allTime },
                  { id: 'today', label: t.common.today },
                  { id: 'last_7_days', label: t.common.last7Days },
                  { id: 'this_month', label: t.common.thisMonth },
                  { id: 'custom', label: t.common.custom },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDatePreset(preset.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    datePreset === preset.id
                      ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-[#09090b] border border-[#27272a] rounded-lg text-zinc-100"
                />
                <span className="text-xs text-zinc-500">{t.common.to}</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-[#09090b] border border-[#27272a] rounded-lg text-zinc-100"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              disabled={filteredExpenses.length === 0}
              onClick={() => exportExpensesCsv(filteredExpenses)}
            >
              <Download className="w-3.5 h-3.5 text-[#4ade80]" />
              {mode === 'business' ? t.dashboard.businessCsv : t.dashboard.personalCsv}
            </Button>
            {mode === 'business' && (
              <Button
                variant="secondary"
                size="sm"
                disabled={products.length === 0}
                onClick={() => exportProductsCsv(products)}
              >
                <Download className="w-3.5 h-3.5 text-[#4ade80]" />
                {t.dashboard.inventoryCsv}
              </Button>
            )}
          </div>
        </Card>

        {/* Dual-Mode KPI Summary Cards */}
        {mode === 'business' ? (
          <section
            aria-label="Key Business Metrics"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="p-5">
              <p className="text-xs font-medium text-zinc-400">{t.dashboard.businessExpenses}</p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-2">
                {expLoading ? '—' : formatMoney(businessKpis.totalExpensesBdt, 'BDT')}
              </p>
              <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1.5">
                {filteredExpenses.length} {t.dashboard.loggedTransactions}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-medium text-zinc-400">{t.dashboard.marketingAdsSpend}</p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-[#4ade80] mt-2">
                {expLoading ? '—' : formatMoney(businessKpis.marketingSpendBdt, 'BDT')}
              </p>
              <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1.5">
                {businessKpis.marketingShare}
                {t.dashboard.ofPeriodExpenditure}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-medium text-zinc-400">{t.dashboard.inventoryCostValue}</p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-2">
                {prodLoading ? '—' : formatMoney(businessKpis.inventoryCostValueBdt, 'BDT')}
              </p>
              <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1.5">
                {t.dashboard.estRetail}: {formatMoney(businessKpis.inventoryRetailValueBdt, 'BDT')}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-medium text-zinc-400">{t.dashboard.totalUnitsStocked}</p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-2">
                {prodLoading ? '—' : businessKpis.totalUnits.toLocaleString('en-BD')}
              </p>
              <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1.5">
                {products.length} {t.dashboard.skus} ·{' '}
                <span className={businessKpis.lowOrOutCount > 0 ? 'text-amber-400' : 'text-[#4ade80]'}>
                  {businessKpis.lowOrOutCount} {t.dashboard.lowOutAlert}
                </span>
              </p>
            </Card>
          </section>
        ) : (
          <section
            aria-label="Personal Finance Metrics"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="p-5">
              <p className="text-xs font-medium text-zinc-400">{t.dashboard.thisMonthSpending}</p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-2">
                {expLoading ? '—' : formatMoney(personalKpis.thisMonthSpendBdt, 'BDT')}
              </p>
              <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1.5">
                {filteredExpenses.length} {t.dashboard.entriesInRange}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-medium text-zinc-400">{t.dashboard.monthlyBudgetCap}</p>
              <p
                className={`text-2xl font-semibold font-mono tabular-nums mt-2 ${
                  personalKpis.budgetRemainingBdt < 0
                    ? 'text-red-400'
                    : personalKpis.budgetPct >= 85
                    ? 'text-amber-400'
                    : 'text-[#4ade80]'
                }`}
              >
                {expLoading ? '—' : formatMoney(personalKpis.budgetRemainingBdt, 'BDT')}
              </p>
              <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1.5">
                {personalKpis.budgetRemainingBdt >= 0
                  ? t.dashboard.remaining
                  : t.dashboard.overCap}{' '}
                · {t.dashboard.cap}: {formatMoney(monthlyBudgetBdt, 'BDT')}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-medium text-zinc-400">{t.dashboard.dailyAverageSpend}</p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-2">
                {expLoading ? '—' : formatMoney(personalKpis.dailyAverageBdt, 'BDT')}
              </p>
              <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1.5">
                {t.dashboard.acrossDaysPrefix} {personalKpis.dayOfMonth} {t.dashboard.acrossDaysSuffix}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-medium text-zinc-400">{t.dashboard.todaysSpendDhaka}</p>
              <p className="text-2xl font-semibold font-mono tabular-nums text-[#4ade80] mt-2">
                {expLoading ? '—' : formatMoney(personalKpis.todaySpendBdt, 'BDT')}
              </p>
              <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1.5">
                {t.dashboard.periodTotal}: {formatMoney(personalKpis.periodSpendBdt, 'BDT')}
              </p>
            </Card>
          </section>
        )}

        {/* Breakdown Charts & Activity Feed */}
        <OverviewCharts
          mode={mode}
          expenses={filteredExpenses}
          inventoryValueBdt={businessKpis.inventoryCostValueBdt}
          monthlyBudgetBdt={monthlyBudgetBdt}
          monthSpentBdt={personalKpis.thisMonthSpendBdt}
          usdToBdtRate={usdToBdtRate}
          logs={modeLogs}
        />
      </div>

      {user && (
        <>
          <ExpenseModal
            open={expenseModalOpen}
            user={user}
            defaultCurrency={defaultCurrency}
            editingExpense={null}
            onClose={() => setExpenseModalOpen(false)}
          />
          {mode === 'business' && (
            <ProductModal
              open={productModalOpen}
              user={user}
              defaultCurrency={defaultCurrency}
              defaultThreshold={defaultThreshold}
              editingProduct={null}
              onClose={() => setProductModalOpen(false)}
            />
          )}
        </>
      )}
    </DashboardShell>
  );
};
