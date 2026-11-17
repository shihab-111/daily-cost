import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2 } from 'lucide-react';
import { CurrencyCode, LoanDirection, PersonalLoan } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../hooks/useBusinessData';
import { dbService } from '../../lib/firebase/db';
import { PersonalLoanFormValues, personalLoanSchema } from '../../lib/validators/schemas';
import { convertToBdt, formatMoney, getTodayDhakaDate } from '../../lib/utils';
import { Button, Input, Modal, Select } from '../ui';

interface LoanDraftRow {
  key: string;
  direction: LoanDirection;
  personName: string;
  phone: string;
  amount: string;
  paidAmount: string;
  currency: CurrencyCode;
  date: string;
  dueDate: string;
  notes: string;
}

function createEmptyRow(
  defaultDirection: LoanDirection,
  defaultCurrency: CurrencyCode
): LoanDraftRow {
  return {
    key: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    direction: defaultDirection,
    personName: '',
    phone: '',
    amount: '',
    paidAmount: '0',
    currency: defaultCurrency,
    date: getTodayDhakaDate(),
    dueDate: '',
    notes: '',
  };
}

interface PersonalLoanModalProps {
  open: boolean;
  user: User;
  editingLoan: PersonalLoan | null;
  defaultDirection?: LoanDirection;
  knownNames?: string[];
  onClose: () => void;
}

export const PersonalLoanModal: React.FC<PersonalLoanModalProps> = ({
  open,
  user,
  editingLoan,
  defaultDirection = 'given',
  knownNames = [],
  onClose,
}) => {
  const { t } = useLanguage();
  const { settings } = useSettings(user, open);

  const defaultCurrency: CurrencyCode = settings?.currencyCode || 'BDT';
  const usdRate = settings?.usdToBdtRate || 120;

  const [rows, setRows] = useState<LoanDraftRow[]>([
    createEmptyRow(defaultDirection, 'BDT'),
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (editingLoan) {
      setRows([
        {
          key: editingLoan.id,
          direction: editingLoan.direction || 'given',
          personName: editingLoan.personName || '',
          phone: editingLoan.phone || '',
          amount: String(editingLoan.amount ?? 0),
          paidAmount: String(editingLoan.paidAmount ?? 0),
          currency: editingLoan.currency || defaultCurrency,
          date: editingLoan.date || getTodayDhakaDate(),
          dueDate: editingLoan.dueDate || '',
          notes: editingLoan.notes || '',
        },
      ]);
    } else {
      setRows([createEmptyRow(defaultDirection, defaultCurrency)]);
    }
  }, [open, editingLoan, defaultDirection, defaultCurrency]);

  const updateRow = (index: number, patch: Partial<LoanDraftRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addAnotherRow = () => {
    const lastDir = rows[rows.length - 1]?.direction || defaultDirection;
    setRows((prev) => [...prev, createEmptyRow(lastDir, defaultCurrency)]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const batchSummary = rows.reduce(
    (acc, r) => {
      const amt = Math.max(0, Number(r.amount) || 0);
      const bdt = convertToBdt(amt, r.currency, usdRate);
      if (r.direction === 'given') {
        acc.givenBdt += bdt;
      } else {
        acc.takenBdt += bdt;
      }
      return acc;
    },
    { givenBdt: 0, takenBdt: 0 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validated: PersonalLoanFormValues[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsed = personalLoanSchema.safeParse({
        direction: row.direction,
        personName: row.personName,
        phone: row.phone,
        amount: row.amount === '' ? 0 : row.amount,
        paidAmount: row.paidAmount === '' ? 0 : row.paidAmount,
        currency: row.currency,
        date: row.date,
        dueDate: row.dueDate,
        notes: row.notes,
      });

      if (!parsed.success) {
        const prefix = rows.length > 1 ? `${t.loans.rowPrefix} #${i + 1}: ` : '';
        setErrorMsg(`${prefix}${parsed.error.issues[0]?.message || 'Check loan fields.'}`);
        return;
      }
      validated.push(parsed.data);
    }

    setSaving(true);
    try {
      if (editingLoan) {
        await dbService.savePersonalLoan(user, validated[0], editingLoan);
      } else {
        await dbService.saveMultiplePersonalLoans(user, validated);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save personal loan(s).');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingLoan ? t.loans.modalEditTitle : t.loans.modalAddTitle}
      subtitle={t.loans.modalSubtitle}
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {knownNames.length > 0 && (
          <datalist id="loan-known-names">
            {knownNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        )}

        {errorMsg && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          {rows.map((row, idx) => (
            <div
              key={row.key}
              className="p-3.5 sm:p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-3"
            >
              {!editingLoan && rows.length > 1 && (
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#27272a]">
                  <span className="text-xs font-semibold text-[#4ade80] font-mono">
                    {t.loans.rowPrefix} #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 cursor-pointer py-1 px-2 rounded-md hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.loans.removeRow}</span>
                  </button>
                </div>
              )}

              {/* Loan Type / Direction Toggle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  {t.loans.directionLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateRow(idx, { direction: 'given' })}
                    className={`flex items-center justify-center gap-2 px-3 min-h-[42px] sm:min-h-0 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      row.direction === 'given'
                        ? 'bg-[#22c55e]/15 border-[#22c55e] text-[#4ade80]'
                        : 'bg-[#121214] border-[#27272a] text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.loans.directionGivenOption}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRow(idx, { direction: 'taken' })}
                    className={`flex items-center justify-center gap-2 px-3 min-h-[42px] sm:min-h-0 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      row.direction === 'taken'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-[#121214] border-[#27272a] text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.loans.directionTakenOption}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t.loans.personNameLabel}
                  required
                  maxLength={140}
                  list={knownNames.length > 0 ? 'loan-known-names' : undefined}
                  value={row.personName}
                  onChange={(e) => updateRow(idx, { personName: e.target.value })}
                  placeholder={t.loans.personNamePlaceholder}
                />
                <Input
                  label={t.loans.phoneLabel}
                  maxLength={40}
                  value={row.phone}
                  onChange={(e) => updateRow(idx, { phone: e.target.value })}
                  placeholder="+88017XXXXXXXX"
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input
                  label={t.loans.loanAmountLabel}
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => updateRow(idx, { amount: e.target.value })}
                  placeholder="0"
                  className="font-mono tabular-nums"
                />
                <Input
                  label={t.loans.paidAmountLabel}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.paidAmount}
                  onChange={(e) => updateRow(idx, { paidAmount: e.target.value })}
                  placeholder="0"
                  className="font-mono tabular-nums"
                />
                <div className="col-span-2 sm:col-span-1">
                  <Select
                    label={t.loans.currencyLabel}
                    value={row.currency}
                    onChange={(e) =>
                      updateRow(idx, { currency: e.target.value as CurrencyCode })
                    }
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t.loans.dateLabel}
                  type="date"
                  required
                  value={row.date}
                  onChange={(e) => updateRow(idx, { date: e.target.value })}
                  className="font-mono tabular-nums"
                />
                <Input
                  label={t.loans.dueDateLabel}
                  type="date"
                  value={row.dueDate}
                  onChange={(e) => updateRow(idx, { dueDate: e.target.value })}
                  className="font-mono tabular-nums"
                />
              </div>

              <Input
                label={t.loans.notesLabel}
                maxLength={1000}
                value={row.notes}
                onChange={(e) => updateRow(idx, { notes: e.target.value })}
                placeholder={t.loans.notesPlaceholder}
              />
            </div>
          ))}
        </div>

        {!editingLoan && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto min-h-[40px]"
              onClick={addAnotherRow}
              disabled={saving || rows.length >= 20}
            >
              <Plus className="w-3.5 h-3.5 text-[#4ade80]" />
              <span>{t.loans.addAnotherRow}</span>
            </Button>

            {rows.length > 1 && (
              <div className="text-xs font-mono tabular-nums text-zinc-300 flex flex-wrap items-center gap-3">
                {batchSummary.givenBdt > 0 && (
                  <span>
                    {t.loans.filterGiven}:{' '}
                    <strong className="text-[#4ade80]">
                      {formatMoney(batchSummary.givenBdt, 'BDT')}
                    </strong>
                  </span>
                )}
                {batchSummary.takenBdt > 0 && (
                  <span>
                    {t.loans.filterTaken}:{' '}
                    <strong className="text-amber-400">
                      {formatMoney(batchSummary.takenBdt, 'BDT')}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-[#27272a] flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            onClick={onClose}
            disabled={saving}
          >
            {t.expenses.cancelEdit}
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            disabled={saving}
          >
            {saving
              ? t.common.saving
              : editingLoan
              ? t.loans.updateLoan
              : rows.length > 1
              ? `${t.loans.saveAllLoans} (${rows.length})`
              : t.loans.saveLoan}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
