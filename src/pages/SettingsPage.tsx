import React, { useEffect, useState } from 'react';
import { Building2, Download, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useExpenses, useProducts, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import { exportExpensesCsv, exportProductsCsv } from '../lib/utils';
import { settingsSchema } from '../lib/validators/schemas';
import { CurrencyCode } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { Button, Card, Input, Select } from '../components/ui';
import { LanguageToggle } from '../components/ui/LanguageToggle';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { settings } = useSettings(user, Boolean(user));
  const { expenses } = useExpenses(user, Boolean(user));
  const { products } = useProducts(user, Boolean(user));

  const [businessName, setBusinessName] = useState(
    settings?.businessName || 'EkTally'
  );
  const [ownerName, setOwnerName] = useState(
    settings?.ownerName || user?.displayName || 'Workspace Owner'
  );
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(
    settings?.currencyCode || 'BDT'
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(settings?.lowStockThreshold ?? 5)
  );
  const [usdToBdtRate, setUsdToBdtRate] = useState(
    String(settings?.usdToBdtRate ?? 120)
  );
  const [personalMonthlyBudget, setPersonalMonthlyBudget] = useState(
    String(settings?.personalMonthlyBudget ?? 25000)
  );
  const [address, setAddress] = useState(settings?.address || 'Dhaka, Bangladesh');
  const [phone, setPhone] = useState(settings?.phone || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!settings) return;
    setBusinessName(settings.businessName);
    setOwnerName(settings.ownerName);
    setCurrencyCode(settings.currencyCode);
    setLowStockThreshold(String(settings.lowStockThreshold));
    setUsdToBdtRate(String(settings.usdToBdtRate));
    setPersonalMonthlyBudget(String(settings.personalMonthlyBudget ?? 25000));
    setAddress(settings.address);
    setPhone(settings.phone);
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSettingsMsg(null);
    const parsed = settingsSchema.safeParse({
      businessName,
      ownerName,
      currencyCode,
      lowStockThreshold,
      usdToBdtRate,
      personalMonthlyBudget,
      address,
      phone,
    });
    if (!parsed.success) {
      setSettingsMsg({
        type: 'err',
        text: parsed.error.issues[0]?.message || 'Check your settings.',
      });
      return;
    }
    setSavingSettings(true);
    try {
      await dbService.saveSettings(user, parsed.data, Boolean(settings));
      setSettingsMsg({
        type: 'ok',
        text: 'Workspace configuration & personal budget cap saved.',
      });
    } catch (err) {
      setSettingsMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save settings.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <DashboardShell businessName={businessName}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <Card className="p-6">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#4ade80] shrink-0" />
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    {t.settings.sectionTitle}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {t.settings.sectionDesc}
                  </p>
                </div>
              </div>
              <LanguageToggle />
            </div>

            {settingsMsg && (
              <div
                className={`text-xs px-3 py-2 rounded-lg bg-[#09090b] border ${
                  settingsMsg.type === 'ok'
                    ? 'border-[#22c55e]/30 text-[#4ade80]'
                    : 'border-red-500/30 text-red-400'
                }`}
              >
                {settingsMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t.settings.businessNameLabel}
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <Input
                label={t.settings.ownerNameLabel}
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
              <Select
                label={t.settings.defaultCurrencyLabel}
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
              >
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
              </Select>
              <Input
                label={t.settings.usdRateLabel}
                type="number"
                step="0.01"
                min="1"
                value={usdToBdtRate}
                onChange={(e) => setUsdToBdtRate(e.target.value)}
                className="font-mono tabular-nums"
              />
              <Input
                label={t.settings.monthlyBudgetLabel}
                type="number"
                min="0"
                step="100"
                value={personalMonthlyBudget}
                onChange={(e) => setPersonalMonthlyBudget(e.target.value)}
                className="font-mono tabular-nums"
              />
              <Input
                label={t.settings.lowStockLabel}
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="font-mono tabular-nums"
              />
              <Input
                label={t.settings.bdPhoneLabel}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+88017XXXXXXXX"
                className="font-mono"
              />
              <Input
                label={t.settings.addressLabel}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Banani, Dhaka, Bangladesh"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingSettings}>
                {savingSettings ? t.common.saving : t.settings.saveSettings}
              </Button>
            </div>
          </form>
        </Card>

        {/* Multi-Tenant Isolation & Export */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                {t.settings.privacyTitle}
              </h2>
              <p className="text-xs text-zinc-400">
                {t.settings.privacyDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] space-y-1">
              <p className="text-[11px] font-mono text-zinc-400 uppercase">
                {t.settings.verifiedAccount}
              </p>
              <p className="text-sm font-medium text-zinc-100 truncate">{user?.email}</p>
              <p className="text-[11px] font-mono text-[#4ade80] truncate">
                UID: {user?.uid}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] flex flex-col justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Wallet className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>{t.settings.downloadBackups}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={expenses.length === 0}
                  onClick={() => exportExpensesCsv(expenses)}
                >
                  <Download className="w-3.5 h-3.5 text-[#4ade80]" />
                  {t.settings.allExpensesCsv}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={products.length === 0}
                  onClick={() => exportProductsCsv(products)}
                >
                  <Download className="w-3.5 h-3.5 text-[#4ade80]" />
                  {t.settings.inventoryCsv}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
};
