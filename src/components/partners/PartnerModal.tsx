import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Plus, Trash2 } from 'lucide-react';
import { BusinessPartner, CurrencyCode } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useMode } from '../../context/ModeContext';
import { useSettings } from '../../hooks/useBusinessData';
import { dbService } from '../../lib/firebase/db';
import {
  BusinessPartnerFormValues,
  businessPartnerSchema,
} from '../../lib/validators/schemas';
import { convertToBdt, formatMoney } from '../../lib/utils';
import { Button, Input, Modal, Select } from '../ui';

interface PartnerDraftRow {
  key: string;
  name: string;
  phone: string;
  sharePercent: string;
  investedAmount: string;
  dueAmount: string;
  currency: CurrencyCode;
  notes: string;
}

function createEmptyRow(defaultCurrency: CurrencyCode): PartnerDraftRow {
  return {
    key: `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    phone: '',
    sharePercent: '',
    investedAmount: '',
    dueAmount: '',
    currency: defaultCurrency,
    notes: '',
  };
}

interface PartnerModalProps {
  open: boolean;
  user: User;
  editingPartner: BusinessPartner | null;
  onClose: () => void;
}

export const PartnerModal: React.FC<PartnerModalProps> = ({
  open,
  user,
  editingPartner,
  onClose,
}) => {
  const { t } = useLanguage();
  const { activeBusinessId } = useMode();
  const { settings } = useSettings(user, open);

  const defaultCurrency: CurrencyCode = settings?.currencyCode || 'BDT';
  const usdRate = settings?.usdToBdtRate || 120;

  const [rows, setRows] = useState<PartnerDraftRow[]>([createEmptyRow('BDT')]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (editingPartner) {
      setRows([
        {
          key: editingPartner.id,
          name: editingPartner.name,
          phone: editingPartner.phone || '',
          sharePercent:
            editingPartner.sharePercent > 0 ? String(editingPartner.sharePercent) : '',
          investedAmount:
            editingPartner.investedAmount > 0 ? String(editingPartner.investedAmount) : '0',
          dueAmount: editingPartner.dueAmount > 0 ? String(editingPartner.dueAmount) : '0',
          currency: editingPartner.currency || defaultCurrency,
          notes: editingPartner.notes || '',
        },
      ]);
    } else {
      setRows([createEmptyRow(defaultCurrency)]);
    }
  }, [open, editingPartner, defaultCurrency]);

  const updateRow = (index: number, patch: Partial<PartnerDraftRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addAnotherRow = () => {
    setRows((prev) => [...prev, createEmptyRow(defaultCurrency)]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const batchSummary = rows.reduce(
    (acc, r) => {
      const inv = Math.max(0, Number(r.investedAmount) || 0);
      const due = Math.max(0, Number(r.dueAmount) || 0);
      return {
        totalInvestBdt: acc.totalInvestBdt + convertToBdt(inv, r.currency, usdRate),
        totalDueBdt: acc.totalDueBdt + convertToBdt(due, r.currency, usdRate),
      };
    },
    { totalInvestBdt: 0, totalDueBdt: 0 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validated: BusinessPartnerFormValues[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsed = businessPartnerSchema.safeParse({
        name: row.name,
        phone: row.phone,
        sharePercent: row.sharePercent === '' ? 0 : row.sharePercent,
        investedAmount: row.investedAmount === '' ? 0 : row.investedAmount,
        dueAmount: row.dueAmount === '' ? 0 : row.dueAmount,
        currency: row.currency,
        notes: row.notes,
      });

      if (!parsed.success) {
        const prefix = rows.length > 1 ? `${t.partners.partnerRowPrefix} #${i + 1}: ` : '';
        setErrorMsg(`${prefix}${parsed.error.issues[0]?.message || 'Check partner fields.'}`);
        return;
      }
      validated.push(parsed.data);
    }

    setSaving(true);
    try {
      if (editingPartner) {
        await dbService.saveBusinessPartner(
          user,
          validated[0],
          editingPartner,
          editingPartner.businessId
        );
      } else {
        await dbService.saveMultipleBusinessPartners(user, validated, activeBusinessId);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save business partner(s).');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingPartner ? t.partners.modalEditTitle : t.partners.modalAddTitle}
      subtitle={t.partners.modalSubtitle}
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
              {(!editingPartner && rows.length > 1) && (
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#27272a]">
                  <span className="text-xs font-semibold text-[#4ade80] font-mono">
                    {t.partners.partnerRowPrefix} #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 cursor-pointer py-1 px-2 rounded-md hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.partners.removeRow}</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t.partners.partnerNameLabel}
                  required
                  maxLength={140}
                  value={row.name}
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                  placeholder="e.g., Rafiqul Islam"
                />
                <Input
                  label={t.partners.partnerPhoneLabel}
                  maxLength={40}
                  value={row.phone}
                  onChange={(e) => updateRow(idx, { phone: e.target.value })}
                  placeholder="+88017XXXXXXXX"
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input
                  label={t.partners.investAmountLabel}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.investedAmount}
                  onChange={(e) => updateRow(idx, { investedAmount: e.target.value })}
                  placeholder="0"
                  className="font-mono"
                />
                <Input
                  label={t.partners.dueAmountLabel}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.dueAmount}
                  onChange={(e) => updateRow(idx, { dueAmount: e.target.value })}
                  placeholder="0"
                  className="font-mono"
                />
                <Input
                  label={t.partners.sharePercentLabel}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={row.sharePercent}
                  onChange={(e) => updateRow(idx, { sharePercent: e.target.value })}
                  placeholder="e.g. 50"
                  className="font-mono"
                />
                <Select
                  label={t.partners.currencyLabel}
                  value={row.currency}
                  onChange={(e) => updateRow(idx, { currency: e.target.value as CurrencyCode })}
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                </Select>
              </div>

              <Input
                label={t.partners.notesLabel}
                maxLength={1000}
                value={row.notes}
                onChange={(e) => updateRow(idx, { notes: e.target.value })}
                placeholder="Installment terms, profit split, or payment remarks..."
              />
            </div>
          ))}
        </div>

        {!editingPartner && (
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
              <span>{t.partners.addAnotherRow}</span>
            </Button>

            {rows.length > 1 && (
              <div className="text-xs font-mono tabular-nums text-zinc-300 flex flex-wrap items-center gap-3">
                <span>
                  {t.partners.batchTotalLabel}:{' '}
                  <strong className="text-[#4ade80]">
                    {formatMoney(batchSummary.totalInvestBdt, 'BDT')}
                  </strong>
                </span>
                {batchSummary.totalDueBdt > 0 && (
                  <span>
                    {t.partners.dueCol}:{' '}
                    <strong className="text-amber-400">
                      {formatMoney(batchSummary.totalDueBdt, 'BDT')}
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
              : editingPartner
              ? t.partners.updatePartner
              : rows.length > 1
              ? `${t.partners.saveAllPartners} (${rows.length})`
              : t.partners.savePartner}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
