import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Check,
  Download,
  Edit3,
  Plus,
  ShieldCheck,
  Trash2,
  UserCircle,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useMode } from '../context/ModeContext';
import { useExpenseCategories, useExpenses, useProducts, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import { exportExpensesCsv, exportProductsCsv } from '../lib/utils';
import { settingsSchema } from '../lib/validators/schemas';
import { BusinessProfile, CurrencyCode } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { Button, Card, Input, Select } from '../components/ui';
import { LanguageToggle } from '../components/ui/LanguageToggle';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    addBusiness,
    renameBusiness,
    deleteBusiness,
  } = useMode();
  const { settings } = useSettings(user, Boolean(user));
  const { expenses } = useExpenses(user, Boolean(user));
  const { categoryLabels } = useExpenseCategories(user, Boolean(user));
  const { products } = useProducts(user, Boolean(user));

  const [newBusinessName, setNewBusinessName] = useState('');
  const [bizSaving, setBizSaving] = useState(false);
  const [bizMsg, setBizMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [editingBizId, setEditingBizId] = useState<string | null>(null);
  const [editingBizName, setEditingBizName] = useState('');
  const [confirmDeleteBizId, setConfirmDeleteBizId] = useState<string | null>(null);

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

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setBizMsg(null);
    if (!newBusinessName.trim()) return;
    setBizSaving(true);
    try {
      const created = await addBusiness(newBusinessName);
      setNewBusinessName('');
      setBizMsg({ type: 'ok', text: `${created.name} added & selected.` });
    } catch (err) {
      setBizMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to add business.',
      });
    } finally {
      setBizSaving(false);
    }
  };

  const handleSaveRename = async (biz: BusinessProfile) => {
    setBizMsg(null);
    if (!editingBizName.trim()) return;
    setBizSaving(true);
    try {
      await renameBusiness(biz, editingBizName);
      setEditingBizId(null);
      setBizMsg({ type: 'ok', text: 'Business name updated.' });
    } catch (err) {
      setBizMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to rename business.',
      });
    } finally {
      setBizSaving(false);
    }
  };

  const handleDeleteBiz = async (biz: BusinessProfile) => {
    setBizMsg(null);
    setBizSaving(true);
    try {
      await deleteBusiness(biz);
      setConfirmDeleteBizId(null);
      setBizMsg({ type: 'ok', text: `${biz.name} removed.` });
    } catch (err) {
      setBizMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to delete business.',
      });
    } finally {
      setBizSaving(false);
    }
  };

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
      const defaultBiz = businesses.find((b) => b.isDefault) || businesses[0];
      if (defaultBiz && defaultBiz.name !== parsed.data.businessName) {
        await renameBusiness(defaultBiz, parsed.data.businessName);
      }
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
    <DashboardShell businessName={activeBusiness?.name || businessName}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Multi-Business Manager */}
        <Card className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-[#4ade80] shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {t.business.manageBusinesses}
                </h2>
                <p className="text-xs text-zinc-400">{t.business.manageBusinessesDesc}</p>
              </div>
            </div>
            <span className="text-xs font-mono tabular-nums text-zinc-400 shrink-0">
              {businesses.length}
            </span>
          </div>

          {bizMsg && (
            <div
              className={`text-xs px-3 py-2 rounded-lg bg-[#09090b] border ${
                bizMsg.type === 'ok'
                  ? 'border-[#22c55e]/30 text-[#4ade80]'
                  : 'border-red-500/30 text-red-400'
              }`}
            >
              {bizMsg.text}
            </div>
          )}

          <form onSubmit={handleAddBusiness} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              maxLength={140}
              value={newBusinessName}
              onChange={(e) => setNewBusinessName(e.target.value)}
              placeholder={t.business.yourBusinessName + ' (' + t.business.businessPlaceholder + ')'}
              className="flex-1 px-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
            />
            <Button
              type="submit"
              className="w-full sm:w-auto min-h-[42px] sm:min-h-0"
              disabled={bizSaving || !newBusinessName.trim()}
            >
              <Plus className="w-4 h-4" />
              {t.business.addNewBusiness}
            </Button>
          </form>

          <div className="divide-y divide-[#27272a] border border-[#27272a] rounded-lg bg-[#09090b]">
            {businesses.length === 0 ? (
              <div className="p-4 text-xs text-zinc-400">
                {t.business.yourBusinessName}
              </div>
            ) : (
              businesses.map((biz) => {
                const isSelected = biz.id === activeBusinessId;
                const isEditing = editingBizId === biz.id;
                return (
                  <div
                    key={biz.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 w-full max-w-md">
                          <input
                            type="text"
                            maxLength={140}
                            value={editingBizName}
                            onChange={(e) => setEditingBizName(e.target.value)}
                            className="w-full sm:flex-1 px-2.5 py-2 sm:py-1.5 text-base sm:text-sm bg-[#121214] text-zinc-100 border border-[#22c55e]/60 rounded-lg focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="flex-1 sm:flex-none min-h-[38px] sm:min-h-0"
                              disabled={bizSaving || !editingBizName.trim()}
                              onClick={() => handleSaveRename(biz)}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {t.business.saveName}
                            </Button>
                            <button
                              type="button"
                              onClick={() => setEditingBizId(null)}
                              className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 min-h-[38px] sm:min-h-0 cursor-pointer"
                            >
                              {t.expenses.cancelEdit}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveBusinessId(biz.id)}
                            className="text-left min-w-0 flex items-center gap-2 cursor-pointer group"
                          >
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isSelected ? 'bg-[#22c55e]' : 'bg-zinc-600 group-hover:bg-zinc-400'
                              }`}
                            />
                            <span
                              className={`text-sm font-medium truncate ${
                                isSelected ? 'text-[#4ade80]' : 'text-zinc-100'
                              }`}
                            >
                              {biz.name}
                            </span>
                          </button>
                          {biz.isDefault && (
                            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-zinc-400 shrink-0">
                              {t.business.primaryBusiness}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {!isSelected && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="min-h-[38px] sm:min-h-0"
                            onClick={() => setActiveBusinessId(biz.id)}
                          >
                            {t.business.switchBusiness}
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBizId(biz.id);
                            setEditingBizName(biz.name);
                            setBizMsg(null);
                          }}
                          title={t.business.rename}
                          aria-label={`${t.business.rename} ${biz.name}`}
                          className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center p-1.5 text-zinc-400 hover:text-[#4ade80] rounded-md cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {confirmDeleteBizId === biz.id ? (
                          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-2.5 py-1.5 sm:py-0.5">
                            <button
                              type="button"
                              disabled={bizSaving}
                              onClick={() => handleDeleteBiz(biz)}
                              className="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              {t.common.delete}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteBizId(null)}
                              className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                              {t.common.no}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteBizId(biz.id)}
                            aria-label={`${t.common.delete} ${biz.name}`}
                            className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center p-1.5 text-zinc-400 hover:text-red-400 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-[#4ade80] shrink-0" />
                <div className="min-w-0">
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
              <Button
                type="submit"
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
                disabled={savingSettings}
              >
                {savingSettings ? t.common.saving : t.settings.saveSettings}
              </Button>
            </div>
          </form>
        </Card>

        {/* Multi-Tenant Isolation & Export */}
        <Card className="p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#4ade80] shrink-0" />
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
            <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] flex flex-col justify-between gap-3 min-w-0">
              <div className="space-y-1 min-w-0">
                <p className="text-[11px] font-mono text-zinc-400 uppercase">
                  {t.settings.verifiedAccount}
                </p>
                <p className="text-sm font-medium text-zinc-100 truncate">{user?.email}</p>
                <p className="text-[11px] font-mono text-[#4ade80] truncate">
                  UID: {user?.uid}
                </p>
              </div>
              <div>
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#18181b] text-zinc-100 border border-[#27272a] hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <UserCircle className="w-3.5 h-3.5 text-[#4ade80]" />
                  {t.profile.manageProfileBtn}
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#09090b] border border-[#27272a] flex flex-col justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Wallet className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>{t.settings.downloadBackups}</span>
              </div>
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto min-h-[40px] sm:min-h-0"
                  disabled={expenses.length === 0}
                  onClick={() => exportExpensesCsv(expenses, categoryLabels)}
                >
                  <Download className="w-3.5 h-3.5 text-[#4ade80]" />
                  {t.settings.allExpensesCsv}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto min-h-[40px] sm:min-h-0"
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
