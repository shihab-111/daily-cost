import React, { useEffect, useState } from 'react';
import { Building2, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAdmins, useSettings } from '../hooks/useBusinessData';
import { ROOT_ADMIN_EMAIL } from '../lib/firebase/client';
import { dbService } from '../lib/firebase/db';
import { adminUserSchema, settingsSchema } from '../lib/validators/schemas';
import { CurrencyCode } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { Button, Card, Input, Select } from '../components/ui';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings(user, Boolean(user));
  const { admins } = useAdmins(user, Boolean(user));

  const isRootOwner = user?.email === ROOT_ADMIN_EMAIL;

  const [businessName, setBusinessName] = useState(
    settings?.businessName || 'Meridian BD Ops'
  );
  const [ownerName, setOwnerName] = useState(
    settings?.ownerName || user?.displayName || 'BD Owner'
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
  const [address, setAddress] = useState(settings?.address || 'Dhaka, Bangladesh');
  const [phone, setPhone] = useState(settings?.phone || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const [newUid, setNewUid] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setBusinessName(settings.businessName);
    setOwnerName(settings.ownerName);
    setCurrencyCode(settings.currencyCode);
    setLowStockThreshold(String(settings.lowStockThreshold));
    setUsdToBdtRate(String(settings.usdToBdtRate));
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
      address,
      phone,
    });
    if (!parsed.success) {
      setSettingsMsg(parsed.error.issues[0]?.message || 'Check your settings.');
      return;
    }
    setSavingSettings(true);
    try {
      await dbService.saveSettings(user, parsed.data, Boolean(settings));
      setSettingsMsg('Business configuration saved.');
    } catch (err) {
      setSettingsMsg(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAdminMsg(null);
    const parsed = adminUserSchema.safeParse({
      uid: newUid,
      email: newEmail,
      displayName: newName || newEmail.split('@')[0],
      role: 'admin',
      active: true,
    });
    if (!parsed.success) {
      setAdminMsg(parsed.error.issues[0]?.message || 'Check admin fields.');
      return;
    }
    setSavingAdmin(true);
    try {
      await dbService.saveAdmin(user, parsed.data, false);
      setNewUid('');
      setNewEmail('');
      setNewName('');
      setAdminMsg('Administrator added to roster.');
    } catch (err) {
      setAdminMsg(err instanceof Error ? err.message : 'Unable to add admin.');
    } finally {
      setSavingAdmin(false);
    }
  };

  return (
    <DashboardShell businessName={businessName}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <Card className="p-6">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
              <Building2 className="w-4 h-4 text-[#4ade80]" />
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Bangladesh Business Profile &amp; Currency Settings
                </h2>
                <p className="text-xs text-zinc-400">
                  Configure default BDT/USD currency, exchange rate, and low-stock threshold.
                </p>
              </div>
            </div>

            {settingsMsg && (
              <div className="text-xs px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-[#4ade80]">
                {settingsMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Business Name *"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <Input
                label="Owner Name *"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
              <Select
                label="Default Currency"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
              >
                <option value="BDT">BDT (৳)</option>
                <option value="USD">USD ($)</option>
              </Select>
              <Input
                label="USD to BDT Conversion Rate"
                type="number"
                step="0.01"
                min="1"
                value={usdToBdtRate}
                onChange={(e) => setUsdToBdtRate(e.target.value)}
                className="font-mono tabular-nums"
              />
              <Input
                label="Default Low-Stock Alert Threshold"
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="font-mono tabular-nums"
              />
              <Input
                label="BD Contact Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Office / Warehouse Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Banani, Dhaka, Bangladesh"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Business Settings'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
            <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Administrator Access Control
              </h2>
              <p className="text-xs text-zinc-400">
                Only the owner (<span className="font-mono">{ROOT_ADMIN_EMAIL}</span>) and verified admins listed here can access this dashboard.
              </p>
            </div>
          </div>

          {adminMsg && (
            <div className="text-xs px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-[#4ade80]">
              {adminMsg}
            </div>
          )}

          <div className="border border-[#27272a] rounded-lg divide-y divide-[#27272a]">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100">{admin.displayName}</p>
                  <p className="text-xs font-mono text-zinc-400 mt-0.5 truncate">
                    {admin.email} · {admin.role} · {admin.uid}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-medium ${
                      admin.active ? 'text-[#4ade80]' : 'text-zinc-500'
                    }`}
                  >
                    {admin.active ? 'Active' : 'Suspended'}
                  </span>
                  {isRootOwner && admin.uid !== user?.uid && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          user &&
                          dbService.saveAdmin(
                            user,
                            {
                              uid: admin.uid,
                              email: admin.email,
                              displayName: admin.displayName,
                              role: admin.role,
                              active: !admin.active,
                            },
                            true
                          )
                        }
                      >
                        {admin.active ? 'Suspend' : 'Activate'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => dbService.deleteAdmin(admin.uid)}
                        aria-label={`Remove ${admin.email}`}
                        className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isRootOwner && (
            <form
              onSubmit={handleAddAdmin}
              className="pt-4 border-t border-[#27272a] space-y-3"
            >
              <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#4ade80]" />
                Authorize Additional Admin Account
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  placeholder="Firebase Auth UID"
                  value={newUid}
                  onChange={(e) => setNewUid(e.target.value)}
                  className="font-mono text-xs"
                />
                <Input
                  type="email"
                  placeholder="Verified Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Display Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-xs"
                  />
                  <Button type="submit" size="sm" disabled={savingAdmin}>
                    Add
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
};
