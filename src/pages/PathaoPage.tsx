import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Truck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useCustomers, usePathaoParcels, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import { PathaoServerStatus } from '../lib/services/pathaoService';
import { exportPathaoBulkCsv, formatMoney, toLocalBdPhone11 } from '../lib/utils';
import { Customer, PathaoParcel } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { PathaoDispatchModal } from '../components/pathao/PathaoDispatchModal';
import { Button, Card } from '../components/ui';

type ParcelFilter = 'all' | 'api' | 'queued';

export const PathaoPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activeBusiness, activeBusinessId, matchesBusiness } = useMode();
  const { parcels, loading } = usePathaoParcels(user, Boolean(user));
  const { customers } = useCustomers(user, Boolean(user));
  const { settings } = useSettings(user, Boolean(user));

  const [serverStatus, setServerStatus] = useState<PathaoServerStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<ParcelFilter>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingParcel, setEditingParcel] = useState<PathaoParcel | null>(null);

  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const businessName = activeBusiness?.name || settings?.businessName || 'EkTally';

  useEffect(() => {
    let active = true;
    dbService
      .fetchPathaoServerStatus({
        userId: user?.uid,
        userEmail: user?.email,
        businessId: activeBusinessId,
      })
      .then((status) => {
        if (active) setServerStatus(status);
      })
      .catch(() => {
        if (active) {
          setServerStatus({ configured: false, environment: 'production', defaultStoreId: null });
        }
      });
    return () => {
      active = false;
    };
  }, [user?.uid, user?.email, activeBusinessId]);

  const businessCustomers = useMemo(
    () => customers.filter((c) => matchesBusiness(c.businessId)),
    [customers, matchesBusiness]
  );

  const businessParcels = useMemo(
    () => parcels.filter((p) => matchesBusiness(p.businessId)),
    [parcels, matchesBusiness]
  );

  const filteredParcels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return businessParcels.filter((p) => {
      if (filterMode === 'api' && p.dispatchMode !== 'api') return false;
      if (filterMode === 'queued' && p.dispatchMode !== 'queued') return false;
      if (!q) return true;
      return (
        p.recipientName.toLowerCase().includes(q) ||
        p.recipientPhone.toLowerCase().includes(q) ||
        p.merchantOrderId.toLowerCase().includes(q) ||
        p.consignmentId.toLowerCase().includes(q) ||
        p.recipientAddress.toLowerCase().includes(q) ||
        p.recipientDistrict.toLowerCase().includes(q) ||
        p.orderStatus.toLowerCase().includes(q)
      );
    });
  }, [businessParcels, filterMode, searchQuery]);

  const metrics = useMemo(() => {
    const dispatched = businessParcels.filter((p) => p.dispatchMode === 'api').length;
    const queued = businessParcels.filter((p) => p.dispatchMode === 'queued').length;
    const totalCod = businessParcels.reduce((s, p) => s + (p.amountToCollect || 0), 0);
    const totalFees = businessParcels.reduce((s, p) => s + (p.deliveryFee || 0), 0);
    return {
      total: businessParcels.length,
      dispatched,
      queued,
      totalCod,
      totalFees,
    };
  }, [businessParcels]);

  const handleQuickCustomerPick = (customerId: string) => {
    if (!customerId) return;
    const picked = businessCustomers.find((c) => c.id === customerId);
    if (!picked) return;
    setEditingParcel(null);
    setSelectedCustomer(picked);
    setModalOpen(true);
  };

  const handleQuickSendQueued = async (parcel: PathaoParcel) => {
    if (!user) return;
    if (!serverStatus?.configured) {
      setEditingParcel(parcel);
      setSelectedCustomer(null);
      setModalOpen(true);
      return;
    }

    if (parcel.recipientAddress.trim().length < 10) {
      setEditingParcel(parcel);
      setSelectedCustomer(null);
      setModalOpen(true);
      return;
    }

    setFeedback(null);
    setSendingId(parcel.id);
    try {
      const storeToUse = parcel.storeId || serverStatus.defaultStoreId || 0;
      if (storeToUse <= 0) {
        setEditingParcel(parcel);
        setSelectedCustomer(null);
        setModalOpen(true);
        setSendingId(null);
        return;
      }

      const result = await dbService.dispatchPathaoParcel(
        user,
        {
          customerId: parcel.customerId,
          merchantOrderId: parcel.merchantOrderId,
          storeId: storeToUse,
          storeName: parcel.storeName,
          recipientName: parcel.recipientName,
          recipientPhone: toLocalBdPhone11(parcel.recipientPhone),
          recipientAddress: parcel.recipientAddress,
          recipientDistrict: parcel.recipientDistrict || 'Dhaka',
          deliveryType: parcel.deliveryType === 12 ? 12 : 48,
          itemType: parcel.itemType === 1 ? 1 : 2,
          itemQuantity: Math.max(1, parcel.itemQuantity || 1),
          itemWeight: Math.max(0.1, parcel.itemWeight || 0.5),
          amountToCollect: Math.max(0, parcel.amountToCollect || 0),
          itemDescription: parcel.itemDescription || '',
          specialInstruction: parcel.specialInstruction || '',
        },
        {
          businessId: parcel.businessId,
          mode: 'api',
          existing: parcel,
        }
      );

      setFeedback({
        type: 'success',
        text: `${t.pathao.dispatchSuccessPrefix} ${result.consignmentId || parcel.merchantOrderId}`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to send parcel to Pathao.',
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleRefreshStatus = async (parcel: PathaoParcel) => {
    setFeedback(null);
    setRefreshingId(parcel.id);
    try {
      const nextStatus = await dbService.refreshPathaoParcelStatus(parcel, {
        userId: user?.uid,
        userEmail: user?.email,
        businessId: parcel.businessId || activeBusinessId,
      });
      setFeedback({
        type: 'success',
        text: `${parcel.consignmentId}: ${nextStatus}`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to refresh tracking status.',
      });
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <DashboardShell
      businessName={businessName}
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={filteredParcels.length === 0}
            onClick={() => exportPathaoBulkCsv(filteredParcels)}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.pathao.exportBulkCsv}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingParcel(null);
              setSelectedCustomer(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.pathao.newParcel}</span>
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Server Integration Status Banner */}
        {serverStatus && (
          <div
            className={`rounded-xl border p-3.5 sm:p-4 flex items-start gap-3 text-xs ${
              serverStatus.configured
                ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-zinc-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            {serverStatus.configured ? (
              <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <p className="font-semibold">
                  {serverStatus.configured
                    ? `${t.pathao.serverConnectedTitle} (${serverStatus.environment})`
                    : t.pathao.serverNotConfiguredTitle}
                </p>
                {serverStatus.configured &&
                  (serverStatus.merchantLabel ||
                    serverStatus.merchantId ||
                    serverStatus.defaultStoreId) && (
                    <span className="text-[11px] font-mono text-[#4ade80]">
                      {[
                        serverStatus.merchantLabel,
                        serverStatus.merchantId ? `Merchant #${serverStatus.merchantId}` : '',
                        serverStatus.defaultStoreId
                          ? `Store #${serverStatus.defaultStoreId}`
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
              </div>
              <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
                {serverStatus.configured
                  ? t.pathao.serverConnectedDesc
                  : t.pathao.serverNotConfiguredDesc}
              </p>
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-xl border p-3 text-xs flex items-center justify-between gap-3 ${
              feedback.type === 'success'
                ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#4ade80]'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-zinc-400 hover:text-zinc-100 cursor-pointer shrink-0"
            >
              {t.common.close}
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <section
          className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
          aria-label="Pathao Delivery Metrics"
        >
          <Card className="p-4">
            <p className="text-xs font-medium text-zinc-400">{t.pathao.totalParcels}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-1.5">
              {metrics.total.toLocaleString('en-BD')}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-zinc-400">{t.pathao.dispatchedCount}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-[#4ade80] mt-1.5">
              {metrics.dispatched.toLocaleString('en-BD')}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-zinc-400">{t.pathao.queuedCount}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-amber-400 mt-1.5">
              {metrics.queued.toLocaleString('en-BD')}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-zinc-400">{t.pathao.totalCodAmount}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-1.5">
              {formatMoney(metrics.totalCod, 'BDT')}
            </p>
          </Card>
          <Card className="p-4 col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-zinc-400">{t.pathao.totalDeliveryFees}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-zinc-300 mt-1.5">
              {formatMoney(metrics.totalFees, 'BDT')}
            </p>
          </Card>
        </section>

        {/* Quick Send from Customer (Order) + Search & Filters */}
        <Card className="p-3.5 sm:p-4 space-y-3">
          {businessCustomers.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-[#27272a]">
              <label
                htmlFor="quick-customer-pathao"
                className="text-xs font-medium text-[#4ade80] shrink-0"
              >
                {t.pathao.pickCustomerLabel}:
              </label>
              <select
                id="quick-customer-pathao"
                value=""
                onChange={(e) => handleQuickCustomerPick(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
              >
                <option value="">{t.pathao.pickCustomerPlaceholder}</option>
                {businessCustomers.map((c) => {
                  const total =
                    (c.quantity || 1) * (c.unitPrice || 0) || c.totalSpent || 0;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) — {c.district}
                      {c.productName ? ` · ${c.productName}` : ''}
                      {total > 0 ? ` · ${formatMoney(total, 'BDT')}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.pathao.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: t.pathao.filterAll },
                  { id: 'api', label: t.pathao.filterDispatched },
                  { id: 'queued', label: t.pathao.filterQueued },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    filterMode === tab.id
                      ? 'bg-[#22c55e] text-zinc-950 border-[#22c55e] font-semibold'
                      : 'bg-[#09090b] text-zinc-300 border-[#27272a] hover:border-zinc-500'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <span className="text-xs font-mono tabular-nums text-zinc-400 ml-1">
                {t.pathao.showingOf} {filteredParcels.length} / {businessParcels.length}{' '}
                {t.pathao.parcelsWord}
              </span>
            </div>
          </div>
        </Card>

        {/* Parcels List */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-zinc-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredParcels.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-200">{t.pathao.noParcelsTitle}</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                {t.pathao.noParcelsDesc}
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  setEditingParcel(null);
                  setSelectedCustomer(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                {t.pathao.newParcel}
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Parcel Cards */}
              <div className="md:hidden divide-y divide-[#27272a]">
                {filteredParcels.map((p) => {
                  const isApi = p.dispatchMode === 'api' && Boolean(p.consignmentId);
                  return (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-100 truncate">
                            {p.recipientName}
                          </p>
                          <p className="text-xs font-mono text-[#4ade80] mt-0.5">
                            {toLocalBdPhone11(p.recipientPhone)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-md border shrink-0 ${
                            isApi
                              ? 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {p.orderStatus}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {p.recipientAddress}
                      </p>

                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs">
                        <div>
                          <span className="block text-[11px] text-zinc-400">
                            {isApi ? 'Consignment' : 'Order ID'}
                          </span>
                          <span className="font-mono text-zinc-200 truncate block">
                            {p.consignmentId || p.merchantOrderId}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] text-zinc-400">COD</span>
                          <span className="font-mono font-semibold text-[#4ade80]">
                            {formatMoney(p.amountToCollect || 0, 'BDT')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isApi ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="flex-1 min-h-[40px]"
                            disabled={refreshingId === p.id}
                            onClick={() => handleRefreshStatus(p)}
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 text-[#4ade80] ${
                                refreshingId === p.id ? 'animate-spin' : ''
                              }`}
                            />
                            <span>
                              {refreshingId === p.id
                                ? t.pathao.refreshingBtn
                                : t.pathao.refreshBtn}
                            </span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="flex-1 min-h-[40px]"
                            disabled={sendingId === p.id}
                            onClick={() => handleQuickSendQueued(p)}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {sendingId === p.id ? t.pathao.sendingBtn : t.pathao.sendNowBtn}
                            </span>
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setEditingParcel(p);
                            setModalOpen(true);
                          }}
                          aria-label={`Edit ${p.recipientName}`}
                          className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center bg-[#09090b] border border-[#27272a] text-zinc-300 hover:text-[#4ade80] rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === p.id ? (
                          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 min-h-[40px]">
                            <button
                              type="button"
                              onClick={async () => {
                                if (user) await dbService.deletePathaoParcel(user, p);
                                setConfirmDeleteId(null);
                              }}
                              className="text-xs font-semibold text-red-400 cursor-pointer"
                            >
                              {t.common.delete}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-zinc-400 cursor-pointer"
                            >
                              {t.common.no}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(p.id)}
                            aria-label={`Delete ${p.recipientName}`}
                            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center bg-[#09090b] border border-[#27272a] text-zinc-300 hover:text-red-400 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#121214] text-xs font-medium text-zinc-400">
                      <th className="py-3 px-4">{t.pathao.consignmentCol}</th>
                      <th className="py-3 px-4">{t.pathao.recipientCol}</th>
                      <th className="py-3 px-4">{t.pathao.itemCol}</th>
                      <th className="py-3 px-4 text-right">{t.pathao.codCol}</th>
                      <th className="py-3 px-4 text-right">{t.pathao.feeCol}</th>
                      <th className="py-3 px-4">{t.pathao.statusCol}</th>
                      <th className="py-3 px-4 text-right">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a] text-sm">
                    {filteredParcels.map((p) => {
                      const isApi = p.dispatchMode === 'api' && Boolean(p.consignmentId);
                      return (
                        <tr key={p.id} className="hover:bg-zinc-900/60 transition-colors align-top">
                          <td className="py-3 px-4 whitespace-nowrap">
                            {p.consignmentId ? (
                              <p className="font-mono text-xs font-semibold text-[#4ade80]">
                                {p.consignmentId}
                              </p>
                            ) : (
                              <p className="text-[11px] font-medium text-amber-300">
                                {t.pathao.queuedBadge}
                              </p>
                            )}
                            <p className="font-mono text-[11px] text-zinc-400 mt-0.5">
                              {p.merchantOrderId}
                            </p>
                          </td>
                          <td className="py-3 px-4 max-w-[260px]">
                            <p className="font-medium text-zinc-100">{p.recipientName}</p>
                            <p className="font-mono text-xs text-[#4ade80] mt-0.5">
                              {toLocalBdPhone11(p.recipientPhone)}
                            </p>
                            <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                              {p.recipientAddress}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-xs max-w-[220px]">
                            <p className="text-zinc-200 line-clamp-2">
                              {p.itemDescription || (p.itemType === 1 ? 'Document' : 'Parcel')}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                              {p.itemQuantity} pcs · {p.itemWeight} kg ·{' '}
                              {p.deliveryType === 12 ? '12h' : '48h'}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-zinc-100 whitespace-nowrap">
                            {formatMoney(p.amountToCollect || 0, 'BDT')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-400 whitespace-nowrap">
                            {p.deliveryFee > 0 ? formatMoney(p.deliveryFee, 'BDT') : '—'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border ${
                                isApi
                                  ? 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {p.orderStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {isApi ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={refreshingId === p.id}
                                  onClick={() => handleRefreshStatus(p)}
                                >
                                  <RefreshCw
                                    className={`w-3.5 h-3.5 text-[#4ade80] ${
                                      refreshingId === p.id ? 'animate-spin' : ''
                                    }`}
                                  />
                                  <span>
                                    {refreshingId === p.id
                                      ? t.pathao.refreshingBtn
                                      : t.pathao.refreshBtn}
                                  </span>
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={sendingId === p.id}
                                  onClick={() => handleQuickSendQueued(p)}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>
                                    {sendingId === p.id
                                      ? t.pathao.sendingBtn
                                      : t.pathao.sendNowBtn}
                                  </span>
                                </Button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  setEditingParcel(p);
                                  setModalOpen(true);
                                }}
                                aria-label={`Edit ${p.recipientName}`}
                                className="p-1.5 text-zinc-400 hover:text-[#4ade80] rounded-md cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {confirmDeleteId === p.id ? (
                                <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (user) await dbService.deletePathaoParcel(user, p);
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
                                  onClick={() => setConfirmDeleteId(p.id)}
                                  aria-label={`Delete ${p.recipientName}`}
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
        <PathaoDispatchModal
          open={modalOpen}
          user={user}
          customer={selectedCustomer}
          editingParcel={editingParcel}
          onClose={() => {
            setModalOpen(false);
            setSelectedCustomer(null);
            setEditingParcel(null);
          }}
          onSuccess={(result) => {
            setFeedback({
              type: 'success',
              text:
                result.mode === 'api'
                  ? `${t.pathao.dispatchSuccessPrefix} ${result.consignmentId}`
                  : t.pathao.queueSuccessMsg,
            });
          }}
        />
      )}
    </DashboardShell>
  );
};
