import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Edit3,
  HandCoins,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { usePersonalLoans, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import {
  convertToBdt,
  exportPersonalLoansCsv,
  formatMoney,
} from '../lib/utils';
import { LoanDirection, PersonalLoan } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { PersonalLoanModal } from '../components/loans/PersonalLoanModal';
import { Button, Card } from '../components/ui';

type LoanFilter = 'all' | 'given' | 'taken' | 'pending' | 'settled';

interface PersonSummary {
  key: string;
  name: string;
  givenRemainingBdt: number;
  takenRemainingBdt: number;
  entriesCount: number;
}

export const LoansPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { loans, loading } = usePersonalLoans(user, Boolean(user));
  const { settings } = useSettings(user, Boolean(user));

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<LoanFilter>('all');
  const [selectedPersonKey, setSelectedPersonKey] = useState<string>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [defaultDirection, setDefaultDirection] = useState<LoanDirection>('given');
  const [editingLoan, setEditingLoan] = useState<PersonalLoan | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const businessName = settings?.businessName || 'EkTally';
  const usdRate = settings?.usdToBdtRate || 120;

  const knownNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of loans) {
      const clean = l.personName.trim();
      const lower = clean.toLowerCase();
      if (clean && !map.has(lower)) {
        map.set(lower, clean);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [loans]);

  const metrics = useMemo(() => {
    let givenPrincipalBdt = 0;
    let givenRemainingBdt = 0;
    let takenPrincipalBdt = 0;
    let takenRemainingBdt = 0;

    const givenPeopleAll = new Set<string>();
    const givenPeoplePending = new Set<string>();
    const takenPeopleAll = new Set<string>();
    const takenPeoplePending = new Set<string>();
    const allPeople = new Set<string>();

    for (const loan of loans) {
      const rateCurrency = loan.currency || 'BDT';
      const amtBdt = convertToBdt(loan.amount || 0, rateCurrency, usdRate);
      const paidBdt = convertToBdt(loan.paidAmount || 0, rateCurrency, usdRate);
      const remBdt = Math.max(0, amtBdt - paidBdt);
      const nameKey = loan.personName.trim().toLowerCase();
      if (nameKey) allPeople.add(nameKey);

      if (loan.direction === 'given') {
        givenPrincipalBdt += amtBdt;
        givenRemainingBdt += remBdt;
        if (nameKey) {
          givenPeopleAll.add(nameKey);
          if (remBdt > 0) givenPeoplePending.add(nameKey);
        }
      } else {
        takenPrincipalBdt += amtBdt;
        takenRemainingBdt += remBdt;
        if (nameKey) {
          takenPeopleAll.add(nameKey);
          if (remBdt > 0) takenPeoplePending.add(nameKey);
        }
      }
    }

    return {
      givenPrincipalBdt,
      givenRemainingBdt,
      takenPrincipalBdt,
      takenRemainingBdt,
      netRemainingBdt: givenRemainingBdt - takenRemainingBdt,
      givenPeopleCount: givenPeoplePending.size > 0 ? givenPeoplePending.size : givenPeopleAll.size,
      givenPeopleTotal: givenPeopleAll.size,
      takenPeopleCount: takenPeoplePending.size > 0 ? takenPeoplePending.size : takenPeopleAll.size,
      takenPeopleTotal: takenPeopleAll.size,
      totalUniquePeople: allPeople.size,
    };
  }, [loans, usdRate]);

  const peopleSummaries = useMemo<PersonSummary[]>(() => {
    const map = new Map<string, PersonSummary>();
    for (const loan of loans) {
      const cleanName = loan.personName.trim();
      const key = cleanName.toLowerCase();
      if (!key) continue;
      const existing = map.get(key) || {
        key,
        name: cleanName,
        givenRemainingBdt: 0,
        takenRemainingBdt: 0,
        entriesCount: 0,
      };
      const remaining = Math.max(0, (loan.amount || 0) - (loan.paidAmount || 0));
      const remBdt = convertToBdt(remaining, loan.currency || 'BDT', usdRate);
      if (loan.direction === 'given') {
        existing.givenRemainingBdt += remBdt;
      } else {
        existing.takenRemainingBdt += remBdt;
      }
      existing.entriesCount += 1;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => {
      const aTotal = a.givenRemainingBdt + a.takenRemainingBdt;
      const bTotal = b.givenRemainingBdt + b.takenRemainingBdt;
      if (bTotal !== aTotal) return bTotal - aTotal;
      return a.name.localeCompare(b.name);
    });
  }, [loans, usdRate]);

  const filteredLoans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return loans.filter((l) => {
      const remaining = Math.max(0, (l.amount || 0) - (l.paidAmount || 0));
      if (filterMode === 'given' && l.direction !== 'given') return false;
      if (filterMode === 'taken' && l.direction !== 'taken') return false;
      if (filterMode === 'pending' && remaining <= 0) return false;
      if (filterMode === 'settled' && remaining > 0) return false;
      if (
        selectedPersonKey !== 'all' &&
        l.personName.trim().toLowerCase() !== selectedPersonKey
      ) {
        return false;
      }
      if (!q) return true;
      return (
        l.personName.toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q)
      );
    });
  }, [loans, filterMode, selectedPersonKey, searchQuery]);

  const handleMarkSettled = async (loan: PersonalLoan) => {
    if (!user) return;
    setUpdatingId(loan.id);
    try {
      await dbService.savePersonalLoan(
        user,
        {
          direction: loan.direction,
          personName: loan.personName,
          phone: loan.phone || '',
          amount: loan.amount,
          paidAmount: loan.amount,
          currency: loan.currency || 'BDT',
          date: loan.date,
          dueDate: loan.dueDate || '',
          notes: loan.notes || '',
        },
        loan
      );
      setRepayLoanId(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyRepayment = async (loan: PersonalLoan) => {
    if (!user) return;
    const addAmt = Number(repayAmount);
    if (Number.isNaN(addAmt) || addAmt <= 0) return;
    const nextPaid = Math.min(loan.amount, Math.round(((loan.paidAmount || 0) + addAmt) * 100) / 100);
    setUpdatingId(loan.id);
    try {
      await dbService.savePersonalLoan(
        user,
        {
          direction: loan.direction,
          personName: loan.personName,
          phone: loan.phone || '',
          amount: loan.amount,
          paidAmount: nextPaid,
          currency: loan.currency || 'BDT',
          date: loan.date,
          dueDate: loan.dueDate || '',
          notes: loan.notes || '',
        },
        loan
      );
      setRepayLoanId(null);
      setRepayAmount('');
    } finally {
      setUpdatingId(null);
    }
  };

  const openAddModal = (dir: LoanDirection) => {
    setEditingLoan(null);
    setDefaultDirection(dir);
    setModalOpen(true);
  };

  return (
    <DashboardShell
      businessName={businessName}
      headerAction={
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {loans.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 md:flex-initial min-h-[40px] md:min-h-0"
              onClick={() => exportPersonalLoansCsv(loans)}
            >
              <Download className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>{t.loans.exportCsv}</span>
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 md:flex-initial min-h-[40px] md:min-h-0"
            onClick={() => openAddModal('given')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.loans.addLoan}</span>
          </Button>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Personal Loan KPI Cards */}
        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          aria-label="Personal Loan Metrics"
        >
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-zinc-400">{t.loans.lentOutTitle}</p>
              <ArrowUpRight className="w-4 h-4 text-[#4ade80] shrink-0" />
            </div>
            <p className="text-2xl font-semibold font-mono tabular-nums text-[#4ade80] mt-2">
              {formatMoney(metrics.givenRemainingBdt, 'BDT')}
            </p>
            <p className="text-xs font-mono tabular-nums text-zinc-400 mt-1.5">
              {metrics.givenPeopleTotal}{' '}
              {metrics.givenPeopleTotal === 1 ? t.loans.personWord : t.loans.peopleWord} ·{' '}
              {t.loans.principalWord}: {formatMoney(metrics.givenPrincipalBdt, 'BDT')}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-zinc-400">{t.loans.borrowedTitle}</p>
              <ArrowDownLeft className="w-4 h-4 text-amber-400 shrink-0" />
            </div>
            <p
              className={`text-2xl font-semibold font-mono tabular-nums mt-2 ${
                metrics.takenRemainingBdt > 0 ? 'text-amber-400' : 'text-zinc-100'
              }`}
            >
              {formatMoney(metrics.takenRemainingBdt, 'BDT')}
            </p>
            <p className="text-xs font-mono tabular-nums text-zinc-400 mt-1.5">
              {metrics.takenPeopleTotal}{' '}
              {metrics.takenPeopleTotal === 1 ? t.loans.personWord : t.loans.peopleWord} ·{' '}
              {t.loans.principalWord}: {formatMoney(metrics.takenPrincipalBdt, 'BDT')}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-400">{t.loans.netPositionTitle}</p>
            <p
              className={`text-2xl font-semibold font-mono tabular-nums mt-2 ${
                metrics.netRemainingBdt > 0
                  ? 'text-[#4ade80]'
                  : metrics.netRemainingBdt < 0
                  ? 'text-red-400'
                  : 'text-zinc-100'
              }`}
            >
              {metrics.netRemainingBdt < 0 ? '-' : ''}
              {formatMoney(Math.abs(metrics.netRemainingBdt), 'BDT')}
            </p>
            <p className="text-xs text-zinc-500 mt-1.5">
              {metrics.netRemainingBdt > 0
                ? t.loans.theyOweYou
                : metrics.netRemainingBdt < 0
                ? t.loans.youOweThem
                : t.loans.balancedLabel}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-zinc-400">{t.loans.peopleTrackedTitle}</p>
              <Users className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <p className="text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-2">
              {metrics.totalUniquePeople}{' '}
              <span className="text-sm font-normal text-zinc-400">
                {metrics.totalUniquePeople === 1 ? t.loans.personWord : t.loans.peopleWord}
              </span>
            </p>
            <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1.5">
              {loans.length} {t.loans.entriesWord}
            </p>
          </Card>
        </section>

        {/* Breakdown by Person Name */}
        {peopleSummaries.length > 0 && (
          <Card className="p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold text-zinc-300">{t.loans.peopleSummaryTitle}</h2>
              <span className="text-[11px] font-mono text-zinc-500">
                {peopleSummaries.length}{' '}
                {peopleSummaries.length === 1 ? t.loans.personWord : t.loans.peopleWord}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => setSelectedPersonKey('all')}
                className={`px-3 py-1.5 min-h-[36px] sm:min-h-0 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  selectedPersonKey === 'all'
                    ? 'bg-[#22c55e] text-zinc-950 border-[#22c55e] font-semibold'
                    : 'bg-[#09090b] text-zinc-300 border-[#27272a] hover:border-zinc-600'
                }`}
              >
                {t.loans.allPeopleChip}
              </button>
              {peopleSummaries.map((person) => {
                const active = selectedPersonKey === person.key;
                const netBdt = person.givenRemainingBdt - person.takenRemainingBdt;
                return (
                  <button
                    key={person.key}
                    type="button"
                    onClick={() =>
                      setSelectedPersonKey((prev) => (prev === person.key ? 'all' : person.key))
                    }
                    className={`inline-flex items-center gap-2 px-3 py-1.5 min-h-[36px] sm:min-h-0 rounded-lg border text-xs whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#22c55e]/15 border-[#22c55e] text-zinc-100'
                        : 'bg-[#09090b] border-[#27272a] text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <span className="font-medium">{person.name}</span>
                    {person.givenRemainingBdt > 0 && (
                      <span className="font-mono tabular-nums text-[#4ade80] text-[11px]">
                        +{formatMoney(person.givenRemainingBdt, 'BDT')}
                      </span>
                    )}
                    {person.takenRemainingBdt > 0 && (
                      <span className="font-mono tabular-nums text-amber-400 text-[11px]">
                        -{formatMoney(person.takenRemainingBdt, 'BDT')}
                      </span>
                    )}
                    {netBdt === 0 &&
                      person.givenRemainingBdt === 0 &&
                      person.takenRemainingBdt === 0 && (
                        <span className="font-mono text-[11px] text-zinc-500">
                          {t.loans.settledBadge}
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Search & Filter Toolbar */}
        <Card className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.loans.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg max-w-full">
              {(
                [
                  { id: 'all', label: t.loans.filterAll },
                  { id: 'given', label: t.loans.filterGiven },
                  { id: 'taken', label: t.loans.filterTaken },
                  { id: 'pending', label: t.loans.filterPending },
                  { id: 'settled', label: t.loans.filterSettled },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`flex-1 sm:flex-initial px-3 min-h-[38px] sm:min-h-0 py-1.5 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap text-center ${
                    filterMode === tab.id
                      ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs font-mono tabular-nums text-zinc-500 shrink-0">
            {t.loans.showingOf} {filteredLoans.length} / {loans.length} {t.loans.loansWord}
          </span>
        </Card>

        {/* Loans List / Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 bg-zinc-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="p-12 text-center">
              <HandCoins className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-200">{t.loans.noLoansTitle}</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                {t.loans.noLoansDesc}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" onClick={() => openAddModal('given')}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {t.loans.directionGivenOption}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openAddModal('taken')}>
                  <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                  {t.loans.directionTakenOption}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-[#27272a]">
                {filteredLoans.map((l) => {
                  const currency = l.currency || 'BDT';
                  const remaining = Math.max(0, (l.amount || 0) - (l.paidAmount || 0));
                  const settled = remaining <= 0;
                  const isRepaying = repayLoanId === l.id;

                  return (
                    <div key={l.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                l.direction === 'given'
                                  ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {l.direction === 'given' ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownLeft className="w-3 h-3" />
                              )}
                              {l.direction === 'given' ? t.loans.givenBadge : t.loans.takenBadge}
                            </span>
                            <span
                              className={`text-[11px] font-mono ${
                                settled ? 'text-zinc-500' : 'text-zinc-300'
                              }`}
                            >
                              {settled ? t.loans.settledBadge : t.loans.pendingBadge}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-zinc-100 mt-1.5">
                            {l.personName}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                            {l.date}
                            {l.dueDate ? ` → ${l.dueDate}` : ''}
                            {l.phone ? ` · ${l.phone}` : ''}
                          </p>
                          {l.notes && (
                            <p className="text-xs text-zinc-400 mt-1 break-words">{l.notes}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-sm font-mono font-semibold tabular-nums ${
                              settled
                                ? 'text-zinc-500'
                                : l.direction === 'given'
                                ? 'text-[#4ade80]'
                                : 'text-amber-400'
                            }`}
                          >
                            {formatMoney(remaining, currency)}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-500 tabular-nums">
                            / {formatMoney(l.amount, currency)}
                          </p>
                        </div>
                      </div>

                      {isRepaying && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-[#09090b] border border-[#27272a] rounded-lg">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={remaining}
                            value={repayAmount}
                            onChange={(e) => setRepayAmount(e.target.value)}
                            placeholder={t.loans.repaymentPromptLabel}
                            className="w-full sm:flex-1 min-w-0 px-2.5 py-2 text-base bg-[#121214] text-zinc-100 border border-[#27272a] rounded-md font-mono"
                          />
                          <div className="flex items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-initial">
                            <Button
                              size="sm"
                              className="min-h-[40px] sm:min-h-0"
                              disabled={updatingId === l.id || !(Number(repayAmount) > 0)}
                              onClick={() => handleApplyRepayment(l)}
                            >
                              {t.loans.saveRepayment}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="min-h-[40px] sm:min-h-0"
                              onClick={() => {
                                setRepayLoanId(null);
                                setRepayAmount('');
                              }}
                            >
                              {t.expenses.cancelEdit}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-[#27272a]/70">
                        {!settled && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="min-h-[38px]"
                              onClick={() => {
                                setRepayLoanId(isRepaying ? null : l.id);
                                setRepayAmount('');
                              }}
                            >
                              {t.loans.addRepayment}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="min-h-[38px]"
                              disabled={updatingId === l.id}
                              onClick={() => handleMarkSettled(l)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
                              <span>{t.loans.markSettled}</span>
                            </Button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLoan(l);
                            setModalOpen(true);
                          }}
                          className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 text-zinc-400 hover:text-zinc-100 rounded-md cursor-pointer"
                          aria-label={`${t.common.edit} ${l.personName}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === l.id ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!user) return;
                              await dbService.deletePersonalLoan(user, l);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 min-h-[38px] text-xs font-medium text-red-400 bg-red-500/10 rounded-md cursor-pointer"
                          >
                            {t.common.delete}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(l.id)}
                            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 text-zinc-400 hover:text-red-400 rounded-md cursor-pointer"
                            aria-label={`${t.common.delete} ${l.personName}`}
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
                    <tr className="border-b border-[#27272a] text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-[#09090b]/50">
                      <th className="py-3 px-4">{t.loans.directionCol}</th>
                      <th className="py-3 px-4">{t.loans.personCol}</th>
                      <th className="py-3 px-4">{t.loans.dateCol}</th>
                      <th className="py-3 px-4 text-right">{t.loans.amountCol}</th>
                      <th className="py-3 px-4 text-right">{t.loans.paidCol}</th>
                      <th className="py-3 px-4 text-right">{t.loans.remainingCol}</th>
                      <th className="py-3 px-4">{t.loans.statusCol}</th>
                      <th className="py-3 px-4 text-right">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a] text-sm">
                    {filteredLoans.map((l) => {
                      const currency = l.currency || 'BDT';
                      const remaining = Math.max(0, (l.amount || 0) - (l.paidAmount || 0));
                      const settled = remaining <= 0;
                      const isRepaying = repayLoanId === l.id;

                      return (
                        <tr key={l.id} className="hover:bg-[#18181b]/50 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                                l.direction === 'given'
                                  ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {l.direction === 'given' ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              )}
                              {l.direction === 'given' ? t.loans.givenBadge : t.loans.takenBadge}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-zinc-100">{l.personName}</p>
                            {(l.phone || l.notes) && (
                              <p className="text-xs text-zinc-500 truncate max-w-[240px]">
                                {[l.phone, l.notes].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-zinc-400 whitespace-nowrap">
                            <div>{l.date}</div>
                            {l.dueDate && (
                              <div className="text-[11px] text-zinc-500">→ {l.dueDate}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-200 whitespace-nowrap">
                            {formatMoney(l.amount, currency)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums text-zinc-400 whitespace-nowrap">
                            {formatMoney(l.paidAmount || 0, currency)}
                          </td>
                          <td
                            className={`py-3.5 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                              settled
                                ? 'text-zinc-500'
                                : l.direction === 'given'
                                ? 'text-[#4ade80]'
                                : 'text-amber-400'
                            }`}
                          >
                            {formatMoney(remaining, currency)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {settled ? (
                              <span className="text-xs font-mono text-zinc-500">
                                {t.loans.settledBadge}
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-zinc-200">
                                {t.loans.pendingBadge}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isRepaying ? (
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  max={remaining}
                                  value={repayAmount}
                                  onChange={(e) => setRepayAmount(e.target.value)}
                                  placeholder={t.loans.repaymentPromptLabel}
                                  className="w-24 px-2 py-1 text-xs bg-[#09090b] text-zinc-100 border border-[#27272a] rounded font-mono"
                                />
                                <Button
                                  size="sm"
                                  disabled={updatingId === l.id || !(Number(repayAmount) > 0)}
                                  onClick={() => handleApplyRepayment(l)}
                                >
                                  {t.loans.saveRepayment}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setRepayLoanId(null);
                                    setRepayAmount('');
                                  }}
                                >
                                  {t.expenses.cancelEdit}
                                </Button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                {!settled && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRepayLoanId(l.id);
                                        setRepayAmount('');
                                      }}
                                      className="px-2 py-1 text-xs font-medium text-zinc-300 bg-[#18181b] border border-[#27272a] hover:border-zinc-500 rounded cursor-pointer"
                                    >
                                      {t.loans.addRepayment}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={updatingId === l.id}
                                      onClick={() => handleMarkSettled(l)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#4ade80] bg-[#22c55e]/10 border border-[#22c55e]/30 hover:bg-[#22c55e]/20 rounded cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{t.loans.markSettled}</span>
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLoan(l);
                                    setModalOpen(true);
                                  }}
                                  className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md cursor-pointer"
                                  title={t.common.edit}
                                  aria-label={`${t.common.edit} ${l.personName}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                {confirmDeleteId === l.id ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!user) return;
                                      await dbService.deletePersonalLoan(user, l);
                                      setConfirmDeleteId(null);
                                    }}
                                    className="px-2 py-1 text-xs font-medium text-red-400 bg-red-500/10 rounded cursor-pointer"
                                  >
                                    {t.common.delete}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(l.id)}
                                    className="p-1.5 text-zinc-400 hover:text-red-400 rounded-md cursor-pointer"
                                    title={t.common.delete}
                                    aria-label={`${t.common.delete} ${l.personName}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
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
        <PersonalLoanModal
          open={modalOpen}
          user={user}
          editingLoan={editingLoan}
          defaultDirection={defaultDirection}
          knownNames={knownNames}
          onClose={() => setModalOpen(false)}
        />
      )}
    </DashboardShell>
  );
};
