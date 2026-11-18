import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Download,
  HandCoins,
  Handshake,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import {
  useActivityLogs,
  useBusinessPartners,
  useCustomers,
  useExpenseCategories,
  useExpenses,
  usePersonalLoans,
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
  resolveActivityLogMode,
  resolveExpenseMode,
} from '../lib/utils';
import { DateRangePreset, LoanDirection } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { OverviewCharts } from '../components/dashboard/OverviewCharts';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { ProductModal } from '../components/products/ProductModal';
import { PersonalLoanModal } from '../components/loans/PersonalLoanModal';
import { Button, Card } from '../components/ui';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mode, activeBusiness, matchesBusiness } = useMode();
  const { expenses, loading: expLoading } = useExpenses(user, Boolean(user));
  const { allCategories, modeCategories, categoryLabels } = useExpenseCategories(
    user,
    Boolean(user),
    mode
  );
  const { products, loading: prodLoading } = useProducts(
    user,
    Boolean(user) && mode === 'business'
  );
  const { partners, loading: partnersLoading } = useBusinessPartners(
    user,
    Boolean(user) && mode === 'business'
  );
  const { customers, loading: customersLoading } = useCustomers(
    user,
    Boolean(user) && mode === 'business'
  );
  const { loans, loading: loansLoading } = usePersonalLoans(
    user,
    Boolean(user) && mode === 'personal'
  );
  const { settings } = useSettings(user, Boolean(user));
  const { logs } = useActivityLogs(user, Boolean(user));

  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanDirection, setLoanDirection] = useState<LoanDirection>('given');

  const businessName = activeBusiness?.name || settings?.businessName || 'EkTally';
  const defaultCurrency = settings?.currencyCode || 'BDT';
  const usdToBdtRate = settings?.usdToBdtRate || 120;
  const defaultThreshold = settings?.lowStockThreshold ?? 5;
  const monthlyBudgetBdt = settings?.personalMonthlyBudget ?? 25000;

  const businessProducts = useMemo(
    () => products.filter((p) => matchesBusiness(p.businessId)),
    [products, matchesBusiness]
  );

  const businessPartners = useMemo(
    () => partners.filter((p) => matchesBusiness(p.businessId)),
    [partners, matchesBusiness]
  );

  const businessCustomers = useMemo(
    () => customers.filter((c) => matchesBusiness(c.businessId)),
    [customers, matchesBusiness]
  );

  const modeExpenses = useMemo(
    () =>
      expenses.filter(
        (e) =>
          resolveExpenseMode(e, allCategories) === mode &&
          (mode === 'personal' || matchesBusiness(e.businessId))
      ),
    [expenses, allCategories, mode, matchesBusiness]
  );

  const modeLogs = useMemo(
    () =>
      logs.filter(
        (l) =>
          resolveActivityLogMode(l) === mode &&
          (mode === 'personal' || matchesBusiness(l.businessId))
      ),
    [logs, mode, matchesBusiness]
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

    const inventoryCostValueBdt = businessProducts.reduce(
      (sum, p) =>
        sum + convertToBdt(p.purchaseCost * p.stockQty, p.currency, usdToBdtRate),
      0
    );
    const inventoryRetailValueBdt = businessProducts.reduce(
      (sum, p) =>
        sum + convertToBdt(p.sellingPrice * p.stockQty, p.currency, usdToBdtRate),
      0
    );
    const totalUnits = businessProducts.reduce((sum, p) => sum + p.stockQty, 0);
    const lowOrOutCount = businessProducts.filter((p) => getStockStatus(p) !== 'in_stock').length;

    const totalInvestedBdt = businessPartners.reduce(
      (sum, p) => sum + convertToBdt(p.investedAmount || 0, p.currency || 'BDT', usdToBdtRate),
      0
    );
    const totalPartnerDueBdt = businessPartners.reduce(
      (sum, p) => sum + convertToBdt(p.dueAmount || 0, p.currency || 'BDT', usdToBdtRate),
      0
    );

    const totalCustomerSalesBdt = businessCustomers.reduce((sum, c) => {
      const fallbackOrderAmt = Math.round(((c.quantity || 0) * (c.unitPrice || 0)) * 100) / 100;
      const spent = (c.totalSpent || 0) > 0 ? c.totalSpent : fallbackOrderAmt;
      return sum + spent;
    }, 0);
    const totalCustomerOrders = businessCustomers.reduce((sum, c) => {
      const fallbackOrder = (c.quantity || 0) * (c.unitPrice || 0) > 0 ? 1 : 0;
      return sum + ((c.totalOrders || 0) > 0 ? c.totalOrders : fallbackOrder);
    }, 0);

    const totalBusinessCostBdt = modeExpenses.reduce(
      (sum, e) => sum + convertToBdt(e.amount || 0, e.currency, usdToBdtRate),
      0
    );

    const netProfitLossBdt = Math.round((totalCustomerSalesBdt - totalBusinessCostBdt) * 100) / 100;
    const capitalBalanceBdt =
      Math.round((totalInvestedBdt + totalCustomerSalesBdt - totalBusinessCostBdt) * 100) / 100;
    const roiPercent =
      totalInvestedBdt > 0 ? Math.round((netProfitLossBdt / totalInvestedBdt) * 100) : null;

    return {
      totalExpensesBdt,
      marketingSpendBdt,
      marketingShare:
        totalExpensesBdt > 0 ? Math.round((marketingSpendBdt / totalExpensesBdt) * 100) : 0,
      inventoryCostValueBdt,
      inventoryRetailValueBdt,
      totalUnits,
      lowOrOutCount,
      totalInvestedBdt,
      totalPartnerDueBdt,
      partnerCount: businessPartners.length,
      totalCustomerSalesBdt,
      totalCustomerOrders,
      customerCount: businessCustomers.length,
      totalBusinessCostBdt,
      netProfitLossBdt,
      capitalBalanceBdt,
      roiPercent,
    };
  }, [
    filteredExpenses,
    modeExpenses,
    businessProducts,
    businessPartners,
    businessCustomers,
    usdToBdtRate,
  ]);

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

  const personalLoanSummary = useMemo(() => {
    let givenRemainingBdt = 0;
    let takenRemainingBdt = 0;
    const givenPeoplePending = new Set<string>();
    const takenPeoplePending = new Set<string>();
    const nameMap = new Map<string, string>();

    for (const loan of loans) {
      const currency = loan.currency || 'BDT';
      const amtBdt = convertToBdt(loan.amount || 0, currency, usdRateFallback(usdToBdtRate));
      const paidBdt = convertToBdt(loan.paidAmount || 0, currency, usdRateFallback(usdToBdtRate));
      const remBdt = Math.max(0, amtBdt - paidBdt);
      const cleanName = loan.personName.trim();
      const nameKey = cleanName.toLowerCase();
      if (cleanName && !nameMap.has(nameKey)) {
        nameMap.set(nameKey, cleanName);
      }

      if (loan.direction === 'given') {
        givenRemainingBdt += remBdt;
        if (remBdt > 0 && nameKey) givenPeoplePending.add(nameKey);
      } else {
        takenRemainingBdt += remBdt;
        if (remBdt > 0 && nameKey) takenPeoplePending.add(nameKey);
      }
    }

    return {
      givenRemainingBdt,
      takenRemainingBdt,
      givenPeopleCount: givenPeoplePending.size,
      takenPeopleCount: takenPeoplePending.size,
      knownNames: Array.from(nameMap.values()).sort((a, b) => a.localeCompare(b)),
    };
  }, [loans, usdToBdtRate]);

  function usdRateFallback(rate: number) {
    return rate > 0 ? rate : 120;
  }

  return (
    <DashboardShell
      businessName={businessName}
      headerAction={
        <div className="flex items-center gap-2">
          {mode === 'business' && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 md:flex-none min-h-[40px] md:min-h-0"
              onClick={() => setProductModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>{t.dashboard.addProduct}</span>
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 md:flex-none min-h-[40px] md:min-h-0"
            onClick={() => setExpenseModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            {mode === 'business' ? t.dashboard.logBusinessExpense : t.dashboard.quickLogExpense}
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Date Range Filter & Export Bar */}
        <Card className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg overflow-x-auto no-scrollbar max-w-full">
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
                  className={`px-3 min-h-[38px] sm:min-h-0 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 text-base sm:text-xs font-mono bg-[#09090b] border border-[#27272a] rounded-lg text-zinc-100"
                />
                <span className="text-xs text-zinc-500 text-center sm:text-left">{t.common.to}</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full sm:w-auto px-2.5 py-2 sm:py-1.5 text-base sm:text-xs font-mono bg-[#09090b] border border-[#27272a] rounded-lg text-zinc-100"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 [&>button]:flex-1 sm:[&>button]:flex-none">
            <Button
              variant="secondary"
              size="sm"
              className="min-h-[40px] sm:min-h-0"
              disabled={filteredExpenses.length === 0}
              onClick={() => exportExpensesCsv(filteredExpenses, categoryLabels)}
            >
              <Download className="w-3.5 h-3.5 text-[#4ade80]" />
              {mode === 'business' ? t.dashboard.businessCsv : t.dashboard.personalCsv}
            </Button>
            {mode === 'business' && (
              <Button
                variant="secondary"
                size="sm"
                className="min-h-[40px] sm:min-h-0"
                disabled={businessProducts.length === 0}
                onClick={() => exportProductsCsv(businessProducts)}
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <Card className="p-4 sm:p-5">
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
                {businessProducts.length} {t.dashboard.skus} ·{' '}
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

        {/* Business Profit, Loss & Investment Summary (Business Mode Only) */}
        {mode === 'business' && (
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                    businessKpis.netProfitLossBdt >= 0
                      ? 'bg-[#22c55e]/15 border-[#22c55e]/30 text-[#4ade80]'
                      : 'bg-red-500/15 border-red-500/30 text-red-400'
                  }`}
                >
                  {businessKpis.netProfitLossBdt >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-100">
                      {t.dashboard.pnlCardTitle}
                    </h2>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded border ${
                        businessKpis.netProfitLossBdt > 0
                          ? 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/30'
                          : businessKpis.netProfitLossBdt < 0
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {businessKpis.netProfitLossBdt > 0
                        ? t.dashboard.profitBadge
                        : businessKpis.netProfitLossBdt < 0
                        ? t.dashboard.lossBadge
                        : t.dashboard.breakEvenBadge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.dashboard.pnlCardDesc}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to="/partners"
                  className="inline-flex items-center gap-1.5 px-3 min-h-[40px] sm:min-h-0 py-1.5 text-xs font-medium bg-[#09090b] hover:bg-[#18181b] text-zinc-200 border border-[#27272a] rounded-lg transition-colors whitespace-nowrap"
                >
                  <Handshake className="w-3.5 h-3.5 text-[#4ade80]" />
                  <span>{t.nav.partners}</span>
                </Link>
                <Link
                  to="/customers"
                  className="inline-flex items-center gap-1.5 px-3 min-h-[40px] sm:min-h-0 py-1.5 text-xs font-medium bg-[#09090b] hover:bg-[#18181b] text-zinc-200 border border-[#27272a] rounded-lg transition-colors whitespace-nowrap"
                >
                  <Users className="w-3.5 h-3.5 text-[#4ade80]" />
                  <span>{t.nav.customersBd}</span>
                </Link>
                <Link
                  to="/expenses"
                  className="inline-flex items-center gap-1.5 px-3 min-h-[40px] sm:min-h-0 py-1.5 text-xs font-medium bg-[#09090b] hover:bg-[#18181b] text-zinc-200 border border-[#27272a] rounded-lg transition-colors whitespace-nowrap"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#4ade80]" />
                  <span>{t.nav.businessExpenses}</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Total Invested from Partners & Invest */}
              <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-400 truncate">
                    {t.dashboard.totalInvestedLabel}
                  </p>
                  <Handshake className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                </div>
                <p className="text-xl font-semibold font-mono tabular-nums text-sky-400 mt-1.5">
                  {partnersLoading ? '—' : formatMoney(businessKpis.totalInvestedBdt, 'BDT')}
                </p>
                <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1">
                  {businessKpis.partnerCount} {t.dashboard.partnersWord} ·{' '}
                  {t.dashboard.partnerDueLabel}: {formatMoney(businessKpis.totalPartnerDueBdt, 'BDT')}
                </p>
              </div>

              {/* Customer Sales Revenue */}
              <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-400 truncate">
                    {t.dashboard.customerSalesLabel}
                  </p>
                  <Users className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                </div>
                <p className="text-xl font-semibold font-mono tabular-nums text-[#4ade80] mt-1.5">
                  {customersLoading ? '—' : formatMoney(businessKpis.totalCustomerSalesBdt, 'BDT')}
                </p>
                <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1">
                  {businessKpis.customerCount} {t.dashboard.customersWord} ·{' '}
                  {businessKpis.totalCustomerOrders} {t.dashboard.ordersWord}
                </p>
              </div>

              {/* Total Cost Items from Business Expenses */}
              <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-400 truncate">
                    {t.dashboard.totalBusinessCostLabel}
                  </p>
                  <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </div>
                <p className="text-xl font-semibold font-mono tabular-nums text-amber-400 mt-1.5">
                  {expLoading ? '—' : formatMoney(businessKpis.totalBusinessCostBdt, 'BDT')}
                </p>
                <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1">
                  {t.dashboard.selectedPeriodLabel}:{' '}
                  {formatMoney(businessKpis.totalExpensesBdt, 'BDT')}
                </p>
              </div>

              {/* Net Profit / Loss */}
              <div
                className={`p-3.5 rounded-xl border ${
                  businessKpis.netProfitLossBdt > 0
                    ? 'bg-[#22c55e]/10 border-[#22c55e]/30'
                    : businessKpis.netProfitLossBdt < 0
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-[#09090b] border-[#27272a]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-300 truncate">
                    {t.dashboard.netProfitLossLabel}
                  </p>
                  {businessKpis.netProfitLossBdt >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                </div>
                <p
                  className={`text-xl font-semibold font-mono tabular-nums mt-1.5 ${
                    businessKpis.netProfitLossBdt > 0
                      ? 'text-[#4ade80]'
                      : businessKpis.netProfitLossBdt < 0
                      ? 'text-red-400'
                      : 'text-zinc-100'
                  }`}
                >
                  {expLoading || customersLoading
                    ? '—'
                    : `${businessKpis.netProfitLossBdt > 0 ? '+' : businessKpis.netProfitLossBdt < 0 ? '-' : ''}${formatMoney(
                        Math.abs(businessKpis.netProfitLossBdt),
                        'BDT'
                      )}`}
                </p>
                <p className="text-xs font-mono tabular-nums text-zinc-400 mt-1">
                  {businessKpis.roiPercent !== null
                    ? `${t.dashboard.roiLabel}: ${businessKpis.roiPercent > 0 ? '+' : ''}${
                        businessKpis.roiPercent
                      }%`
                    : `${t.dashboard.capitalBalanceLabel}: ${formatMoney(
                        businessKpis.capitalBalanceBdt,
                        'BDT'
                      )}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#27272a] text-xs font-mono tabular-nums text-zinc-400">
              <span>{t.dashboard.capitalBalanceLabel}</span>
              <span
                className={`font-semibold ${
                  businessKpis.capitalBalanceBdt >= 0 ? 'text-zinc-100' : 'text-red-400'
                }`}
              >
                {businessKpis.capitalBalanceBdt < 0 ? '-' : ''}
                {formatMoney(Math.abs(businessKpis.capitalBalanceBdt), 'BDT')}
              </span>
            </div>
          </Card>
        )}

        {/* Personal Loans Snapshot (Personal Mode Only) */}
        {mode === 'personal' && (
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center shrink-0">
                  <HandCoins className="w-4 h-4 text-[#4ade80]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    {t.loans.overviewCardTitle}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.loans.overviewCardDesc}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-[40px] sm:min-h-0"
                  onClick={() => {
                    setLoanDirection('given');
                    setLoanModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-[#4ade80]" />
                  {t.loans.addLoan}
                </Button>
                <Link
                  to="/loans"
                  className="inline-flex items-center gap-1.5 px-3 min-h-[40px] sm:min-h-0 py-1.5 text-xs font-medium bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#4ade80] border border-[#22c55e]/30 rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>{t.loans.manageLoansBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                    <span className="truncate">{t.loans.lentOutTitle}</span>
                  </div>
                  <p className="text-xl font-semibold font-mono tabular-nums text-[#4ade80] mt-1.5">
                    {loansLoading ? '—' : formatMoney(personalLoanSummary.givenRemainingBdt, 'BDT')}
                  </p>
                  <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1">
                    {personalLoanSummary.givenPeopleCount}{' '}
                    {personalLoanSummary.givenPeopleCount === 1
                      ? t.loans.personWord
                      : t.loans.peopleWord}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0 min-h-[40px] sm:min-h-0"
                  onClick={() => {
                    setLoanDirection('given');
                    setLoanModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-[#4ade80]" />
                  <span>{t.loans.filterGiven}</span>
                </Button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{t.loans.borrowedTitle}</span>
                  </div>
                  <p className="text-xl font-semibold font-mono tabular-nums text-amber-400 mt-1.5">
                    {loansLoading ? '—' : formatMoney(personalLoanSummary.takenRemainingBdt, 'BDT')}
                  </p>
                  <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1">
                    {personalLoanSummary.takenPeopleCount}{' '}
                    {personalLoanSummary.takenPeopleCount === 1
                      ? t.loans.personWord
                      : t.loans.peopleWord}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0 min-h-[40px] sm:min-h-0"
                  onClick={() => {
                    setLoanDirection('taken');
                    setLoanModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.loans.filterTaken}</span>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Breakdown Charts & Activity Feed */}
        <OverviewCharts
          mode={mode}
          expenses={filteredExpenses}
          categories={modeCategories}
          categoryLabels={categoryLabels}
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
          {mode === 'personal' && (
            <PersonalLoanModal
              open={loanModalOpen}
              user={user}
              editingLoan={null}
              defaultDirection={loanDirection}
              knownNames={personalLoanSummary.knownNames}
              onClose={() => setLoanModalOpen(false)}
            />
          )}
        </>
      )}
    </DashboardShell>
  );
};
