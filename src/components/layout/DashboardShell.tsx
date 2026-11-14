import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Receipt,
  Settings,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useMode } from '../../context/ModeContext';
import { cn, EKTALLY_LOGO_URL } from '../../lib/utils';
import { LanguageToggle } from '../ui/LanguageToggle';

interface DashboardShellProps {
  businessName: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  businessName,
  children,
  headerAction,
}) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const {
    mode,
    setMode,
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    addBusiness,
  } = useMode();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const [bizMenuOpen, setBizMenuOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [sidebarAddOpen, setSidebarAddOpen] = useState(false);
  const [sidebarBizName, setSidebarBizName] = useState('');
  const [bizSaving, setBizSaving] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);

  const bizDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems =
    mode === 'business'
      ? [
          { to: '/', label: t.nav.overview, icon: LayoutDashboard },
          { to: '/expenses', label: t.nav.businessExpenses, icon: Receipt },
          { to: '/products', label: t.nav.productInventory, icon: Package },
          { to: '/customers', label: t.nav.customersBd, icon: Users },
          { to: '/receipts', label: t.nav.receiptStudio, icon: FileText },
          { to: '/settings', label: t.nav.settingsData, icon: Settings },
        ]
      : [
          { to: '/', label: t.nav.personalOverview, icon: LayoutDashboard },
          { to: '/expenses', label: t.nav.dailyExpenses, icon: Receipt },
          { to: '/receipts', label: t.nav.receiptStudio, icon: FileText },
          { to: '/settings', label: t.nav.settingsBudget, icon: Settings },
        ];

  useEffect(() => {
    if (
      mode === 'personal' &&
      (location.pathname.startsWith('/products') || location.pathname.startsWith('/customers'))
    ) {
      navigate('/', { replace: true });
    }
  }, [mode, location.pathname, navigate]);

  useEffect(() => {
    if (!bizMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (bizDropdownRef.current && !bizDropdownRef.current.contains(event.target as Node)) {
        setBizMenuOpen(false);
        setBizError(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [bizMenuOpen]);

  const currentNav =
    navItems.find((item) =>
      item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
    ) || navItems[0];

  const displayBusinessName = activeBusiness?.name || businessName;

  const workspaceLabel =
    mode === 'business'
      ? displayBusinessName
      : `${user?.displayName || businessName} · ${t.nav.personal}`;

  const handleHeaderAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;
    setBizError(null);
    setBizSaving(true);
    try {
      await addBusiness(newBizName);
      setNewBizName('');
      setBizMenuOpen(false);
    } catch (err) {
      setBizError(err instanceof Error ? err.message : 'Unable to add business.');
    } finally {
      setBizSaving(false);
    }
  };

  const handleSidebarAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebarBizName.trim()) return;
    setBizError(null);
    setBizSaving(true);
    try {
      await addBusiness(sidebarBizName);
      setSidebarBizName('');
      setSidebarAddOpen(false);
    } catch (err) {
      setBizError(err instanceof Error ? err.message : 'Unable to add business.');
    } finally {
      setBizSaving(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-[260px] bg-[#121214] border-r border-[#27272a] shrink-0">
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#27272a] shrink-0">
        <NavLink
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center min-w-0"
          aria-label="EkTally Home"
        >
          <img
            src={EKTALLY_LOGO_URL}
            alt="EkTally"
            className="h-7 w-auto object-contain shrink-0"
          />
        </NavLink>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
          className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pt-3 pb-1 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">{t.nav.activeMode}</span>
          <span className="font-mono font-semibold text-[#4ade80] uppercase">
            {mode === 'business' ? t.nav.business : t.nav.personal}
          </span>
        </div>

        {mode === 'business' && (
          <div className="p-2.5 rounded-lg bg-[#09090b] border border-[#27272a] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 truncate">
                <Building2 className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                <span className="truncate">{t.business.activeBusinessLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSidebarAddOpen((prev) => !prev);
                  setBizError(null);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4ade80] hover:text-[#86efac] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3 h-3" />
                {sidebarAddOpen ? t.expenses.cancelEdit : t.business.addBusiness}
              </button>
            </div>

            {businesses.length > 0 ? (
              <select
                aria-label={t.business.switchBusiness}
                value={activeBusinessId}
                onChange={(e) => setActiveBusinessId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-medium bg-[#121214] text-zinc-100 border border-[#27272a] rounded-md focus:outline-none focus:border-[#22c55e] truncate"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-2.5 py-1.5 text-xs font-medium text-zinc-200 bg-[#121214] border border-[#27272a] rounded-md truncate">
                {displayBusinessName}
              </div>
            )}

            {sidebarAddOpen && (
              <form onSubmit={handleSidebarAddBusiness} className="space-y-1.5 pt-1">
                <input
                  type="text"
                  maxLength={140}
                  value={sidebarBizName}
                  onChange={(e) => setSidebarBizName(e.target.value)}
                  placeholder={t.business.businessPlaceholder}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#121214] text-zinc-100 border border-[#27272a] rounded-md placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
                />
                {bizError && <p className="text-[11px] text-red-400">{bizError}</p>}
                <button
                  type="submit"
                  disabled={bizSaving || !sidebarBizName.trim()}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold bg-[#22c55e] hover:bg-[#16a34a] text-zinc-950 rounded-md disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {bizSaving ? t.common.saving : t.business.saveName}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-1 md:hidden">
          <span className="text-[11px] text-zinc-400">{t.common.languageLabel}</span>
          <LanguageToggle />
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Primary Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-transparent'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#27272a] bg-[#09090b]/60 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#18181b] border border-[#27272a] shrink-0">
            {!avatarFailed && user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Account'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#4ade80]">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-100 truncate">
              {user?.displayName || t.nav.workspaceOwner}
            </p>
            <p className="text-[11px] font-mono text-zinc-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-1 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t.common.signOut}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0 no-print">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-[#121214] border-b border-[#27272a] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-100 rounded-lg cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-zinc-500 hidden xl:inline truncate max-w-[180px]">
                {workspaceLabel}
              </span>
              <span className="text-zinc-600 hidden xl:inline">/</span>
              <h1 className="font-semibold text-zinc-100 truncate">{currentNav.label}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle className="hidden md:inline-flex" />

            {/* Multi-Business Switcher + Quick Add Business Name */}
            {mode === 'business' && (
              <div ref={bizDropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setBizMenuOpen((prev) => !prev);
                    setBizError(null);
                  }}
                  aria-expanded={bizMenuOpen}
                  aria-label={t.business.switchBusiness}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[#09090b] border border-[#27272a] hover:border-zinc-600 text-zinc-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                  <span className="max-w-[96px] sm:max-w-[140px] truncate">
                    {displayBusinessName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </button>

                {bizMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-72 bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl p-2.5 z-50 space-y-2">
                    <div className="flex items-center justify-between px-1.5">
                      <span className="text-[11px] font-medium text-zinc-400">
                        {t.business.manageBusinesses}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                        {businesses.length || 1}
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {businesses.map((b) => {
                        const selected = b.id === activeBusinessId;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setActiveBusinessId(b.id);
                              setBizMenuOpen(false);
                              setBizError(null);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left',
                              selected
                                ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                                : 'text-zinc-200 hover:bg-[#18181b] border border-transparent'
                            )}
                          >
                            <span className="truncate font-medium">{b.name}</span>
                            <span className="inline-flex items-center gap-1.5 shrink-0">
                              {b.isDefault && (
                                <span className="text-[10px] font-mono text-zinc-400">
                                  {t.business.primaryBusiness}
                                </span>
                              )}
                              {selected && <Check className="w-3.5 h-3.5 text-[#4ade80]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <form
                      onSubmit={handleHeaderAddBusiness}
                      className="pt-2 border-t border-[#27272a] space-y-1.5"
                    >
                      <label className="block text-[11px] font-medium text-zinc-300 px-0.5">
                        {t.business.yourBusinessName}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          maxLength={140}
                          value={newBizName}
                          onChange={(e) => setNewBizName(e.target.value)}
                          placeholder={t.business.businessPlaceholder}
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
                        />
                        <button
                          type="submit"
                          disabled={bizSaving || !newBizName.trim()}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-[#22c55e] hover:bg-[#16a34a] text-zinc-950 rounded-lg disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {bizSaving ? t.common.saving : t.expenses.addCategoryBtn}
                        </button>
                      </div>
                      {bizError && <p className="text-[11px] text-red-400 px-0.5">{bizError}</p>}
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Instant Dual-Mode Switch */}
            <div
              role="group"
              aria-label="Workspace mode switch"
              className="inline-flex items-center p-0.5 bg-[#09090b] border border-[#27272a] rounded-lg shrink-0"
            >
              <button
                type="button"
                onClick={() => setMode('business')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0',
                  mode === 'business'
                    ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100'
                )}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{t.nav.business}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('personal')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0',
                  mode === 'personal'
                    ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100'
                )}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t.nav.personal}</span>
              </button>
            </div>

            {headerAction}
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};
