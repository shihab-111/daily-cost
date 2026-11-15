import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Edit3,
  Handshake,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useBusinessPartners, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import {
  convertToBdt,
  exportBusinessPartnersCsv,
  formatMoney,
} from '../lib/utils';
import { BusinessPartner } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { PartnerModal } from '../components/partners/PartnerModal';
import { Button, Card } from '../components/ui';

type PartnerFilter = 'all' | 'due' | 'settled';

export const PartnersPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activeBusiness, matchesBusiness } = useMode();
  const { partners, loading } = useBusinessPartners(user, Boolean(user));
  const { settings } = useSettings(user, Boolean(user));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PartnerFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const businessName = activeBusiness?.name || settings?.businessName || 'EkTally';
  const usdRate = settings?.usdToBdtRate || 120;

  const businessPartners = useMemo(
    () => partners.filter((p) => matchesBusiness(p.businessId)),
    [partners, matchesBusiness]
  );

  const filteredPartners = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return businessPartners.filter((p) => {
      if (statusFilter === 'due' && !(p.dueAmount > 0)) return false;
      if (statusFilter === 'settled' && p.dueAmount > 0) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      );
    });
  }, [businessPartners, searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    let totalInvestBdt = 0;
    let totalDueBdt = 0;
    let totalShare = 0;
    for (const p of businessPartners) {
      totalInvestBdt += convertToBdt(p.investedAmount || 0, p.currency || 'BDT', usdRate);
      totalDueBdt += convertToBdt(p.dueAmount || 0, p.currency || 'BDT', usdRate);
      totalShare += p.sharePercent || 0;
    }
    return {
      totalPartners: businessPartners.length,
      totalInvestBdt,
      totalDueBdt,
      totalShare: Math.round(totalShare * 100) / 100,
    };
  }, [businessPartners, usdRate]);

  const handleClearDue = async (partner: BusinessPartner) => {
    if (!user || partner.dueAmount <= 0) return;
    setSettlingId(partner.id);
    try {
      await dbService.saveBusinessPartner(
        user,
        {
          name: partner.name,
          phone: partner.phone || '',
          sharePercent: partner.sharePercent || 0,
          investedAmount: partner.investedAmount || 0,
          dueAmount: 0,
          currency: partner.currency || 'BDT',
          notes: partner.notes || '',
        },
        partner,
        partner.businessId
      );
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <DashboardShell
      businessName={businessName}
      headerAction={
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {businessPartners.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 md:flex-initial min-h-[40px] md:min-h-0"
              onClick={() => exportBusinessPartnersCsv(businessPartners, businessName)}
            >
              <Download className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>{t.partners.exportCsv}</span>
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 md:flex-initial min-h-[40px] md:min-h-0"
            onClick={() => {
              setEditingPartner(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.partners.addPartners}</span>
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Partner Metrics */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          aria-label="Business Partner Metrics"
        >
          <Card className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-400">{t.partners.totalPartners}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
              {metrics.totalPartners.toLocaleString('en-BD')}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-400">{t.partners.totalInvested}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-[#4ade80] mt-1.5 sm:mt-2">
              {formatMoney(metrics.totalInvestBdt, 'BDT')}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-400">{t.partners.totalDue}</p>
            <p
              className={`text-xl sm:text-2xl font-semibold font-mono tabular-nums mt-1.5 sm:mt-2 ${
                metrics.totalDueBdt > 0 ? 'text-amber-400' : 'text-zinc-100'
              }`}
            >
              {formatMoney(metrics.totalDueBdt, 'BDT')}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-400">{t.partners.totalEquity}</p>
            <p className="text-xl sm:text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-1.5 sm:mt-2">
              {metrics.totalShare}%
            </p>
          </Card>
        </section>

        {/* Search & Status Filters */}
        <Card className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.partners.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <div className="inline-flex items-center p-1 bg-[#09090b] border border-[#27272a] rounded-lg self-start sm:self-auto">
              {(
                [
                  { id: 'all', label: t.partners.filterAll },
                  { id: 'due', label: t.partners.filterDue },
                  { id: 'settled', label: t.partners.filterSettled },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs font-mono tabular-nums text-zinc-400 shrink-0">
            {t.partners.showingOf} {filteredPartners.length} / {businessPartners.length}{' '}
            {t.partners.partnersWord}
          </span>
        </Card>

        {/* Partners Directory */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-zinc-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="p-12 text-center">
              <Handshake className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-200">{t.partners.noPartnersTitle}</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                {t.partners.noPartnersDesc}
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  setEditingPartner(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                {t.partners.addFirstPartner}
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Partner Cards */}
              <div className="md:hidden divide-y divide-[#27272a]">
                {filteredPartners.map((p) => {
                  const hasDue = p.dueAmount > 0;
                  return (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-100 truncate">{p.name}</p>
                          {p.phone && (
                            <p className="text-xs font-mono text-zinc-400 mt-0.5">{p.phone}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {p.sharePercent > 0 && (
                            <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded bg-[#09090b] border border-[#27272a] text-zinc-200">
                              {p.sharePercent}%
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                              hasDue
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-[#22c55e]/10 text-[#4ade80] border-[#22c55e]/30'
                            }`}
                          >
                            {hasDue ? t.partners.duePendingBadge : t.partners.settledBadge}
                          </span>
                        </div>
                      </div>

                      {p.notes && (
                        <p className="text-xs text-zinc-300 leading-relaxed">{p.notes}</p>
                      )}

                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#09090b] border border-[#27272a] text-xs">
                        <div>
                          <span className="block text-[11px] text-zinc-400">
                            {t.partners.investCol}
                          </span>
                          <span className="font-mono tabular-nums text-[#4ade80] font-semibold">
                            {formatMoney(p.investedAmount || 0, p.currency || 'BDT')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] text-zinc-400">
                            {t.partners.dueCol}
                          </span>
                          <span
                            className={`font-mono tabular-nums font-semibold ${
                              hasDue ? 'text-amber-400' : 'text-zinc-300'
                            }`}
                          >
                            {formatMoney(p.dueAmount || 0, p.currency || 'BDT')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {hasDue && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="flex-1 min-h-[40px]"
                            disabled={settlingId === p.id}
                            onClick={() => handleClearDue(p)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
                            <span>{t.partners.clearDue}</span>
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPartner(p);
                            setModalOpen(true);
                          }}
                          aria-label={`Edit ${p.name}`}
                          className="min-h-[40px] min-w-[40px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#09090b] border border-[#27272a] text-zinc-300 hover:text-[#4ade80] rounded-lg cursor-pointer text-xs px-3"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{t.common.edit}</span>
                        </button>
                        {confirmDeleteId === p.id ? (
                          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 min-h-[40px]">
                            <button
                              type="button"
                              onClick={async () => {
                                if (user) await dbService.deleteBusinessPartner(user, p);
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
                            aria-label={`Delete ${p.name}`}
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

              {/* Desktop Partners Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#121214] text-xs font-medium text-zinc-400">
                      <th className="py-3 px-4">{t.partners.partnerCol}</th>
                      <th className="py-3 px-4 text-right">{t.partners.shareCol}</th>
                      <th className="py-3 px-4 text-right">{t.partners.investCol}</th>
                      <th className="py-3 px-4 text-right">{t.partners.dueCol}</th>
                      <th className="py-3 px-4">{t.partners.statusCol}</th>
                      <th className="py-3 px-4 text-right">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a] text-sm">
                    {filteredPartners.map((p) => {
                      const hasDue = p.dueAmount > 0;
                      return (
                        <tr key={p.id} className="hover:bg-zinc-900/60 transition-colors align-top">
                          <td className="py-3 px-4 max-w-[280px]">
                            <p className="font-medium text-zinc-100">{p.name}</p>
                            {p.phone && (
                              <p className="text-xs font-mono text-zinc-400 mt-0.5">{p.phone}</p>
                            )}
                            {p.notes && (
                              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{p.notes}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-200 whitespace-nowrap">
                            {p.sharePercent > 0 ? `${p.sharePercent}%` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#4ade80] whitespace-nowrap">
                            {formatMoney(p.investedAmount || 0, p.currency || 'BDT')}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                              hasDue ? 'text-amber-400' : 'text-zinc-400'
                            }`}
                          >
                            {formatMoney(p.dueAmount || 0, p.currency || 'BDT')}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${
                                hasDue
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                  : 'bg-[#22c55e]/10 text-[#4ade80] border-[#22c55e]/30'
                              }`}
                            >
                              {hasDue ? t.partners.duePendingBadge : t.partners.settledBadge}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {hasDue && (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={settlingId === p.id}
                                  onClick={() => handleClearDue(p)}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
                                  <span>{t.partners.clearDue}</span>
                                </Button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPartner(p);
                                  setModalOpen(true);
                                }}
                                aria-label={`Edit ${p.name}`}
                                className="p-1.5 text-zinc-400 hover:text-[#4ade80] rounded-md cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {confirmDeleteId === p.id ? (
                                <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (user) await dbService.deleteBusinessPartner(user, p);
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
                                  aria-label={`Delete ${p.name}`}
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
        <PartnerModal
          open={modalOpen}
          user={user}
          editingPartner={editingPartner}
          onClose={() => {
            setModalOpen(false);
            setEditingPartner(null);
          }}
        />
      )}
    </DashboardShell>
  );
};
