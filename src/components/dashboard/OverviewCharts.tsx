import React from 'react';
import { ActivityLog, AppMode, Expense, ExpenseCategory } from '../../types';
import {
  convertToBdt,
  EXPENSE_CATEGORY_LABELS,
  formatMoney,
  getCategoriesForMode,
  PAYMENT_METHODS,
} from '../../lib/utils';
import { Card } from '../ui';

interface OverviewChartsProps {
  mode: AppMode;
  expenses: Expense[];
  inventoryValueBdt: number;
  monthlyBudgetBdt?: number;
  monthSpentBdt?: number;
  usdToBdtRate: number;
  logs: ActivityLog[];
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  facebook_ads: '#22c55e',
  marketing_promo: '#4ade80',
  photoshoot_model: '#eab308',
  operations_packaging: '#38bdf8',
  raw_materials: '#a855f7',
  rent_utilities: '#f97316',
  groceries_bazaar: '#22c55e',
  bills_utilities: '#38bdf8',
  transportation: '#eab308',
  personal_shopping: '#f472b6',
  family_health: '#4ade80',
  dining_out: '#f97316',
};

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  mode,
  expenses,
  inventoryValueBdt,
  monthlyBudgetBdt = 25000,
  monthSpentBdt = 0,
  usdToBdtRate,
  logs,
}) => {
  const modeCategories = getCategoriesForMode(mode);
  const categoryTotals: Record<string, number> = {};
  for (const [key] of modeCategories) {
    categoryTotals[key] = 0;
  }

  const paymentTotals: Record<string, number> = {};
  for (const pm of PAYMENT_METHODS) paymentTotals[pm] = 0;

  for (const exp of expenses) {
    const bdt = convertToBdt(exp.amount, exp.currency, usdToBdtRate);
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + bdt;
    paymentTotals[exp.paymentMethod] = (paymentTotals[exp.paymentMethod] || 0) + bdt;
  }

  const totalExpenseBdt = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const comparisonRows =
    mode === 'business'
      ? [
          {
            label: 'Marketing & Ads',
            value: (categoryTotals.facebook_ads || 0) + (categoryTotals.marketing_promo || 0),
            color: '#22c55e',
          },
          { label: 'Inventory Stock Cost', value: inventoryValueBdt, color: '#38bdf8' },
          {
            label: 'Model & Photoshoot',
            value: categoryTotals.photoshoot_model || 0,
            color: '#eab308',
          },
          {
            label: 'Packaging, Raw & Rent',
            value:
              (categoryTotals.operations_packaging || 0) +
              (categoryTotals.raw_materials || 0) +
              (categoryTotals.rent_utilities || 0),
            color: '#a1a1aa',
          },
        ]
      : modeCategories.map(([key, label]) => ({
          label,
          value: categoryTotals[key] || 0,
          color: CATEGORY_COLORS[key],
        }));

  const maxBar = Math.max(1, ...comparisonRows.map((c) => c.value));
  const budgetPct =
    monthlyBudgetBdt > 0 ? Math.min(100, Math.round((monthSpentBdt / monthlyBudgetBdt) * 100)) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Expense & Cost Breakdown */}
      <Card className="lg:col-span-7 p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-[#27272a] pb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              {mode === 'business'
                ? 'Business Cost Breakdown (Ads vs. Inventory vs. Ops)'
                : 'Personal Spending Breakdown by Category'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Normalized in BDT (1 USD = ৳{usdToBdtRate})
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#4ade80]">
            Period Total: {formatMoney(totalExpenseBdt, 'BDT')}
          </span>
        </div>

        {/* Personal Monthly Budget Cap Bar */}
        {mode === 'personal' && monthlyBudgetBdt > 0 && (
          <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-300">
                This Month Budget Utilization ({budgetPct}%)
              </span>
              <span className="font-mono tabular-nums text-zinc-200">
                {formatMoney(monthSpentBdt, 'BDT')} / {formatMoney(monthlyBudgetBdt, 'BDT')}
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#18181b] rounded-full overflow-hidden border border-[#27272a]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${budgetPct}%`,
                  backgroundColor:
                    budgetPct >= 100 ? '#ef4444' : budgetPct >= 85 ? '#eab308' : '#22c55e',
                }}
              />
            </div>
          </div>
        )}

        {/* Horizontal Proportional Bar Chart */}
        <div className="space-y-4">
          {comparisonRows.map((row) => {
            const pct = Math.min(100, Math.round((row.value / maxBar) * 100));
            return (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">{row.label}</span>
                  <span className="font-mono tabular-nums text-zinc-100">
                    {formatMoney(row.value, 'BDT')}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#09090b] border border-[#27272a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: row.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Category Split + Payment Channel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#27272a]">
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 mb-3">
              {mode === 'business' ? 'Business Categories' : 'Personal Categories'}
            </h3>
            <div className="space-y-2">
              {modeCategories.map(([catKey, catLabel]) => {
                const val = categoryTotals[catKey] || 0;
                const share = totalExpenseBdt > 0 ? Math.round((val / totalExpenseBdt) * 100) : 0;
                return (
                  <div key={catKey} className="flex items-center justify-between text-xs gap-2">
                    <span className="text-zinc-300 flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-xs shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[catKey] }}
                      />
                      <span className="truncate">{EXPENSE_CATEGORY_LABELS[catKey] || catLabel}</span>
                    </span>
                    <span className="font-mono tabular-nums text-zinc-400 shrink-0">
                      {share}% · {formatMoney(val, 'BDT')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-zinc-400 mb-3">
              Payment Channels (BD)
            </h3>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((pm) => {
                const val = paymentTotals[pm] || 0;
                return (
                  <div key={pm} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{pm}</span>
                    <span className="font-mono tabular-nums text-zinc-400">
                      {formatMoney(val, 'BDT')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Right: Recent Activity Log */}
      <Card className="lg:col-span-5 p-6 flex flex-col">
        <div className="border-b border-[#27272a] pb-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              {mode === 'business' ? 'Business Activity Log' : 'Personal Activity Log'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {mode === 'business'
                ? 'Latest business expenses, inventory, customers, and receipts'
                : 'Latest personal daily expense entries'}
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-zinc-500">
            {logs.length} events
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10 text-center">
            <p className="text-xs text-zinc-500">
              Activity events for {mode} mode will appear here as you record entries.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#27272a] overflow-y-auto max-h-[380px] pr-1">
            {logs.map((log) => (
              <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-medium text-zinc-200 leading-snug">
                    {log.summary}
                  </p>
                  <span className="text-xs font-mono tabular-nums text-[#4ade80] shrink-0">
                    {formatMoney(log.amount, log.currency)}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-500 truncate">
                  {log.actorEmail} · {log.action.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
