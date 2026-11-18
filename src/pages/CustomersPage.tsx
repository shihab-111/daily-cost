import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Edit3, FileText, Plus, Search, Trash2, Truck, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useCustomers, usePathaoParcels, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import { exportCustomersOrdersCsv, formatMoney } from '../lib/utils';
import { Customer, PathaoParcel } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { CustomerModal } from '../components/customers/CustomerModal';
import { PathaoDispatchModal } from '../components/pathao/PathaoDispatchModal';
import { Button, Card } from '../components/ui';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activeBusiness, matchesBusiness } = useMode();
  const { customers, loading } = useCustomers(user, Boolean(user));
  const { parcels } = usePathaoParcels(user, Boolean(user));
  const { settings } = useSettings(user, Boolean(user));
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pathaoModalOpen, setPathaoModalOpen] = useState(false);
  const [pathaoCustomer, setPathaoCustomer] = useState<Customer | null>(null);
  const [pathaoNotice, setPathaoNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const businessName = activeBusiness?.name || settings?.businessName || 'EkTally';

  const businessCustomers = useMemo(
    () => customers.filter((c) => matchesBusiness(c.businessId)),
    [customers, matchesBusiness]
  );

  const latestParcelByCustomer = useMemo(() => {
    const map: Record<string, PathaoParcel> = {};
    for (const p of parcels) {
      if (!p.customerId || !matchesBusiness(p.businessId)) continue;
      if (!map[p.customerId]) {
        map[p.customerId] = p;
      }
    }
    return map;
  }, [parcels, matchesBusiness]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return businessCustomers;
    return businessCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.numberOption || '').toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        (c.zone || '').toLowerCase().includes(q) ||
        (c.area || '').toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.storeName || '').toLowerCase().includes(q) ||
        (c.merchantOrderId || '').toLowerCase().includes(q) ||
        (c.productName || '').toLowerCase().includes(q) ||
        (c.productSize || '').toLowerCase().includes(q) ||
        (c.orderDetails || '').toLowerCase().includes(q)
    );
  }, [businessCustomers, searchQuery]);

  const metrics = useMemo(() => {
    const totalOrders = businessCustomers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const totalSpent = businessCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    return {
      totalCustomers: businessCustomers.length,
      totalOrders,
      totalSpent,
    };
  }, [businessCustomers]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeBusiness?.id]);

  const selectedCustomers = useMemo(
    () => businessCustomers.filter((c) => selectedIds.has(c.id)),
    [businessCustomers, selectedIds]
  );

  const allFilteredSelected =
    filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedIds.has(c.id));

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredCustomers.forEach((c) => next.delete(c.id));
      } else {
        filteredCustomers.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  return (
    <DashboardShell
      businessName={businessName}
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          {selectedCustomers.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-none min-h-[40px] md:min-h-0"
              onClick={() => exportCustomersOrdersCsv(selectedCustomers, latestParcelByCustomer)}
            >
              <Download className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>
                {t.customers.exportSelectedCsv} ({selectedCustomers.length})
              </span>
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1 sm:flex-none min-h-[40px] md:min-h-0"
            disabled={filteredCustomers.length === 0}
            onClick={() => exportCustomersOrdersCsv(filteredCustomers, latestParcelByCustomer)}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {t.customers.exportAllCsv} ({filteredCustomers.length})
            </span>
          </Button>
          <Button
            size="sm"
            className="w-full sm:w-auto min-h-[40px] md:min-h-0"
            onClick={() => {
              setEditingCustomer(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            {t.customers.addCustomer}
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {pathaoNotice && (
          <div className="rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#4ade80]">
            <span>{pathaoNotice}</span>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/pathao" className="font-semibold underline hover:text-zinc-100">
                {t.nav.pathaoDelivery}
              </Link>
              <button
                type="button"
                onClick={() => setPathaoNotice(null)}
                className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        )}
        {/* Customer Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" aria-label="Customer Metrics">
          <Card className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-400">{t.customers.savedCustomers}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
              {metrics.totalCustomers.toLocaleString('en-BD')}
            </p>
          </Card>
          <Card className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-400">{t.customers.recordedOrders}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
              {metrics.totalOrders.toLocaleString('en-BD')}
            </p>
          </Card>
          <Card className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-400">{t.customers.lifetimeValue}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-[#4ade80] mt-1.5 sm:mt-2">
              {formatMoney(metrics.totalSpent, 'BDT')}
            </p>
          </Card>
        </section>

        {/* Search & Selection Bar */}
        <Card className="p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.customers.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
              {filteredCustomers.length > 0 && (
                <label className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-zinc-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    className="w-4 h-4 rounded border-[#27272a] bg-[#09090b] accent-[#22c55e] cursor-pointer"
                  />
                  <span>{t.customers.selectAllVisible}</span>
                </label>
              )}
              <span className="text-xs font-mono tabular-nums text-zinc-400 shrink-0">
                {t.customers.showingOf} {filteredCustomers.length} / {businessCustomers.length} {t.customers.customersWord}
              </span>
            </div>
          </div>

          {selectedCustomers.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#27272a] text-xs">
              <span className="font-medium text-[#4ade80] font-mono tabular-nums">
                {selectedCustomers.length} {t.customers.selectedCountWord}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => exportCustomersOrdersCsv(selectedCustomers, latestParcelByCustomer)}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {t.customers.exportSelectedCsv} ({selectedCustomers.length})
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  {t.customers.clearSelection}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Customers Directory Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-zinc-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-200">{t.customers.noCustomersTitle}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {t.customers.noCustomersDesc}
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  setEditingCustomer(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                {t.customers.addFirstCustomer}
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Customer Cards */}
              <div className="md:hidden divide-y divide-[#27272a]">
                {filteredCustomers.map((c) => {
                  const fullAddress = [c.address, c.area, c.zone, c.district]
                    .filter(Boolean)
                    .join(', ');
                  const qty = c.quantity ?? 0;
                  const unitPrice = c.unitPrice ?? 0;
                  const orderTotal = Math.round(qty * unitPrice * 100) / 100;
                  const hasOrderMeta = Boolean(
                    c.productName ||
                      c.productSize ||
                      unitPrice > 0 ||
                      c.orderDetails ||
                      c.merchantOrderId ||
                      c.itemType
                  );

                  const isSelected = selectedIds.has(c.id);

                  return (
                    <div
                      key={c.id}
                      className={`p-4 space-y-3 transition-colors ${isSelected ? 'bg-[#22c55e]/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(c.id)}
                            aria-label={`Select ${c.name}`}
                            className="mt-1 w-4 h-4 rounded border-[#27272a] bg-[#09090b] accent-[#22c55e] cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-100 truncate">{c.name}</p>
                            {c.email && (
                              <p className="text-xs text-zinc-400 truncate mt-0.5">{c.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block font-mono tabular-nums text-xs text-[#4ade80]">
                            {c.phone}
                          </span>
                          <span className="block text-[11px] text-zinc-400">
                            {c.numberOption || 'Call / Phone'}
                          </span>
                        </div>
                      </div>

                      {fullAddress && (
                        <p className="text-xs text-zinc-300 leading-relaxed">{fullAddress}</p>
                      )}

                      {hasOrderMeta && (
                        <div className="p-2.5 rounded-lg bg-[#09090b] border border-[#27272a] space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-zinc-100 truncate">
                              {c.productName || 'Order Item'}
                            </span>
                            {unitPrice > 0 && (
                              <span className="font-mono tabular-nums text-[#4ade80] font-semibold shrink-0">
                                {formatMoney(orderTotal > 0 ? orderTotal : unitPrice, 'BDT')}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-400">
                            {c.productSize && (
                              <span>
                                {t.customers.sizeWord}: <strong className="text-zinc-200">{c.productSize}</strong>
                              </span>
                            )}
                            {unitPrice > 0 && (
                              <>
                                {c.productSize && <span aria-hidden="true">·</span>}
                                <span className="font-mono tabular-nums">
                                  {qty > 0 ? `${qty} × ` : ''}
                                  {formatMoney(unitPrice, 'BDT')} {t.customers.perPcWord}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            {c.itemType === 'document' ? 'document' : 'parcel'} ·{' '}
                            {c.itemWeight && c.itemWeight > 0 ? c.itemWeight : 0.5} kg
                            {c.merchantOrderId ? ` · #${c.merchantOrderId}` : ''}
                            {c.storeName ? ` · ${c.storeName}` : ''}
                          </p>
                          {c.orderDetails && (
                            <p className="text-[11px] text-zinc-300 leading-relaxed pt-0.5 break-words">
                              {c.orderDetails}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs">
                        <div>
                          <span className="block text-[11px] text-zinc-400">{t.customers.orders}</span>
                          <span className="font-mono tabular-nums text-zinc-100 font-medium">
                            {c.totalOrders || 0}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] text-zinc-400">
                            {t.customers.totalSpent}
                          </span>
                          <span className="font-mono tabular-nums text-[#4ade80] font-semibold">
                            {formatMoney(c.totalSpent || 0, 'BDT')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 min-w-[130px] min-h-[40px] overflow-hidden"
                          onClick={() => {
                            setPathaoCustomer(c);
                            setPathaoModalOpen(true);
                          }}
                        >
                          <Truck className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                          <span className="truncate">
                            {latestParcelByCustomer[c.id]?.consignmentId
                              ? latestParcelByCustomer[c.id].consignmentId
                              : t.customers.sendToPathaoBtn}
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 min-w-[110px] min-h-[40px]"
                          onClick={() => navigate('/receipts', { state: { customer: c } })}
                        >
                          <FileText className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                          <span>{t.customers.receiptBtn}</span>
                        </Button>
                        <div className="flex items-center gap-2 ml-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(c);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${c.name}`}
                            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center bg-[#09090b] border border-[#27272a] text-zinc-300 hover:text-[#4ade80] rounded-lg cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {confirmDeleteId === c.id ? (
                            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 min-h-[40px]">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (user) await dbService.deleteCustomer(user, c);
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
                              onClick={() => setConfirmDeleteId(c.id)}
                              aria-label={`Delete ${c.name}`}
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

              {/* Desktop Customers Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#121214] text-xs font-medium text-zinc-400">
                    <th className="py-3 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        aria-label={t.customers.selectAllVisible}
                        className="w-4 h-4 rounded border-[#27272a] bg-[#09090b] accent-[#22c55e] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">{t.customers.customer}</th>
                    <th className="py-3 px-4">{t.customers.bdPhone}</th>
                    <th className="py-3 px-4">{t.customers.districtAddress}</th>
                    <th className="py-3 px-4">{t.customers.orderProductCol}</th>
                    <th className="py-3 px-4 text-right">{t.customers.orders}</th>
                    <th className="py-3 px-4 text-right">{t.customers.totalSpent}</th>
                    <th className="py-3 px-4 text-right">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-sm">
                  {filteredCustomers.map((c) => {
                    const qty = c.quantity ?? 0;
                    const unitPrice = c.unitPrice ?? 0;
                    const orderTotal = Math.round(qty * unitPrice * 100) / 100;
                    const isSelected = selectedIds.has(c.id);

                    return (
                    <tr
                      key={c.id}
                      className={`hover:bg-zinc-900/60 transition-colors align-top ${
                        isSelected ? 'bg-[#22c55e]/5' : ''
                      }`}
                    >
                      <td className="py-3 pl-4 pr-2 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(c.id)}
                          aria-label={`Select ${c.name}`}
                          className="mt-0.5 w-4 h-4 rounded border-[#27272a] bg-[#09090b] accent-[#22c55e] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-zinc-100">{c.name}</p>
                        {c.email && (
                          <p className="text-xs text-zinc-400 truncate max-w-[180px]">{c.email}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-mono tabular-nums text-xs text-[#4ade80]">{c.phone}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {c.numberOption || 'Call / Phone'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-300 max-w-[220px]">
                        {c.address && <p className="line-clamp-2">{c.address}</p>}
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {[c.district, c.zone, c.area].filter(Boolean).join(' · ')}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-xs max-w-[250px]">
                        <div className="space-y-0.5">
                          {c.productName && (
                            <p className="font-medium text-zinc-100 truncate">{c.productName}</p>
                          )}
                          {(c.productSize || unitPrice > 0) && (
                            <p className="text-[11px] text-zinc-400 font-mono tabular-nums">
                              {c.productSize ? `${t.customers.sizeWord}: ${c.productSize}` : ''}
                              {c.productSize && unitPrice > 0 ? ' · ' : ''}
                              {unitPrice > 0
                                ? `${qty > 0 ? `${qty} × ` : ''}${formatMoney(unitPrice, 'BDT')}${
                                    orderTotal > 0 ? ` = ${formatMoney(orderTotal, 'BDT')}` : ''
                                  }`
                                : ''}
                            </p>
                          )}
                          <p className="text-[11px] text-zinc-400 font-mono">
                            {c.itemType === 'document' ? 'document' : 'parcel'} ·{' '}
                            {c.itemWeight && c.itemWeight > 0 ? c.itemWeight : 0.5} kg
                            {c.merchantOrderId ? ` · #${c.merchantOrderId}` : ''}
                          </p>
                          {c.orderDetails && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2">
                              {c.orderDetails}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-200 whitespace-nowrap">
                        {c.totalOrders || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-zinc-100 whitespace-nowrap">
                        {formatMoney(c.totalSpent || 0, 'BDT')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setPathaoCustomer(c);
                              setPathaoModalOpen(true);
                            }}
                            title={
                              latestParcelByCustomer[c.id]
                                ? `Pathao: ${latestParcelByCustomer[c.id].orderStatus}`
                                : t.pathao.modalTitle
                            }
                          >
                            <Truck className="w-3.5 h-3.5 text-[#4ade80]" />
                            <span className="hidden sm:inline">
                              {latestParcelByCustomer[c.id]?.consignmentId
                                ? latestParcelByCustomer[c.id].consignmentId
                                : t.customers.sendToPathaoBtn}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/receipts', { state: { customer: c } })}
                          >
                            <FileText className="w-3.5 h-3.5 text-[#4ade80]" />
                            <span className="hidden sm:inline">{t.customers.receiptBtn}</span>
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(c);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${c.name}`}
                            className="p-1.5 text-zinc-400 hover:text-[#4ade80] rounded-md cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {confirmDeleteId === c.id ? (
                            <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (user) await dbService.deleteCustomer(user, c);
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
                              onClick={() => setConfirmDeleteId(c.id)}
                              aria-label={`Delete ${c.name}`}
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
        <CustomerModal
          open={modalOpen}
          user={user}
          editingCustomer={editingCustomer}
          onClose={() => {
            setModalOpen(false);
            setEditingCustomer(null);
          }}
          onSavedAndSendPathao={(savedCustomer) => {
            setPathaoCustomer(savedCustomer);
            setPathaoModalOpen(true);
          }}
        />
      )}

      {user && (
        <PathaoDispatchModal
          open={pathaoModalOpen}
          user={user}
          customer={pathaoCustomer}
          onClose={() => {
            setPathaoModalOpen(false);
            setPathaoCustomer(null);
          }}
          onSuccess={(result) => {
            setPathaoNotice(
              result.mode === 'api'
                ? `${t.pathao.dispatchSuccessPrefix} ${result.consignmentId}`
                : t.pathao.queueSuccessMsg
            );
          }}
        />
      )}
    </DashboardShell>
  );
};
