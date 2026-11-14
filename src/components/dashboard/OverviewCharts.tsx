import React from 'react';
import { ActivityLog, Expense, ExpenseCategory } from '../../types';
import {
  convertToBdt,
  EXPENSE_CATEGORY_LABELS,
  formatMoney,
  PAYMENT_METHODS,
} from '../../lib/utils';
import { Card } from '../ui';

interface OverviewChartsProps {
  expenses: Expense[];
  inventoryValueBdt: number;
  usdToBdtRate: number;
  logs: ActivityLog[];
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  facebook_ads: '#22c55e',
  marketing_promo: '#4ade80',
  photoshoot_model: '#eab308',
  operations_packaging: '#38bdf8',
};

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  expenses,
  inventoryValueBdt,
  usdToBdtRate,
  logs,
}) => {
  const categoryTotals: Record<ExpenseCategory, number> = {
    facebook_ads: 0,
    marketing_promo: 0,
    photoshoot_model: 0,
    operations_packaging: 0,
  };

  const paymentTotals: Record<string, number> = {};
  for (const pm of PAYMENT_METHODS) paymentTotals[pm] = 0;

  for (const exp of expenses) {
    const bdt = convertToBdt(exp.amount, exp.currency, usdToBdtRate);
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + bdt;
    paymentTotals[exp.paymentMethod] = (paymentTotals[exp.paymentMethod] || 0) + bdt;
  }

  const totalExpenseBdt = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const marketingSpendBdt = categoryTotals.facebook_ads + categoryTotals.marketing_promo;
  const shootCostBdt = categoryTotals.photoshoot_model;
  const opsCostBdt = categoryTotals.operations_packaging;

  const costComparison = [
    { label: 'Marketing & Ads', value: marketingSpendBdt, color: '#22c55e' },
    { label: 'Inventory Stock Cost', value: inventoryValueBdt, color: '#38bdf8' },
    { label: 'Model & Photoshoot', value: shootCostBdt, color: '#eab308' },
    { label: 'Packaging & Ops', value: opsCostBdt, color: '#a1a1aa' },
  ];
  const maxBar = Math.max(1, ...costComparison.map((c) => c.value));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Expense & Cost Breakdown */}
      <Card className="lg:col-span-7 p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-[#27272a] pb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Cost Breakdown (Marketing vs. Product vs. Shoot)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Normalized in BDT (1 USD = ৳{usdToBdtRate})
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#4ade80]">
            Total Spend: {formatMoney(totalExpenseBdt, 'BDT')}
          </span>
        </div>

        {/* Horizontal Proportional Bar Chart */}
        <div className="space-y-4">
          {costComparison.map((row) => {
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
              Expense Categories
            </h3>
            <div className="space-y-2">
              {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
                const val = categoryTotals[cat];
                const share = totalExpenseBdt > 0 ? Math.round((val / totalExpenseBdt) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-xs shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                      />
                      <span className="truncate">{EXPENSE_CATEGORY_LABELS[cat]}</span>
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
            <h2 className="text-sm font-semibold text-zinc-100">Recent Activity Log</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Latest expenditure and inventory updates
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-zinc-500">
            {logs.length} events
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10 text-center">
            <p className="text-xs text-zinc-500">
              Activity events will appear here as you log expenses or update inventory.
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
