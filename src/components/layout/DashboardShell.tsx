import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  HandCoins,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreVertical,
  Package,
  Plus,
  Receipt,
  Settings,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { AppMode, BusinessProfile } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useMode } from '../../context/ModeContext';
import { cn, EKTALLY_LOGO_URL } from '../../lib/utils';
import { LanguageToggle } from '../ui/LanguageToggle';
import { PWAInstallButton } from '../ui/PWAControls';

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
  const { user, profileDisplayName, profilePhotoUrl, isAdmin, logout } = useAuth();
  const { t } = useLanguage();
  const {
    mode,
    setMode,
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    addBusiness,
    deleteBusiness,
  } = useMode();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const [bizMenuOpen, setBizMenuOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [sidebarAddOpen, setSidebarAddOpen] = useState(false);
  const [sidebarBizName, setSidebarBizName] = useState('');
  const [bizSaving, setBizSaving] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);
  const [confirmDeleteBizId, setConfirmDeleteBizId] = useState<string | null>(null);

  const bizDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMoreRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems =
    mode === 'business'
      ? [
          { to: '/profile', label: t.nav.myProfile, icon: UserCircle },
          { to: '/', label: t.nav.overview, icon: LayoutDashboard },
          { to: '/expenses', label: t.nav.businessExpenses, icon: Receipt },
          { to: '/products', label: t.nav.productInventory, icon: Package },
          { to: '/customers', label: t.nav.customersBd, icon: Users },
          { to: '/partners', label: t.nav.partners, icon: Handshake },
          { to: '/receipts', label: t.nav.receiptStudio, icon: FileText },
          { to: '/settings', label: t.nav.settingsData, icon: Settings },
        ]
      : [
          { to: '/profile', label: t.nav.myProfile, icon: UserCircle },
          { to: '/', label: t.nav.personalOverview, icon: LayoutDashboard },
          { to: '/expenses', label: t.nav.dailyExpenses, icon: Receipt },
          { to: '/loans', label: t.nav.personalLoans, icon: HandCoins },
          { to: '/receipts', label: t.nav.receiptStudio, icon: FileText },
          { to: '/settings', label: t.nav.settingsBudget, icon: Settings },
        ];

  useEffect(() => {
    if (
      mode === 'personal' &&
      (location.pathname.startsWith('/products') ||
        location.pathname.startsWith('/customers') ||
        location.pathname.startsWith('/partners'))
    ) {
      navigate('/', { replace: true });
    } else if (mode === 'business' && location.pathname.startsWith('/loans')) {
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

  useEffect(() => {
    if (!mobileMoreOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(event.target as Node)) {
        setMobileMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [mobileMoreOpen]);

  useEffect(() => {
    setMobileMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profilePhotoUrl]);

  const currentNav = location.pathname.startsWith('/admin')
    ? { to: '/admin', label: t.nav.adminPortal, icon: ShieldCheck }
    : navItems.find((item) =>
        item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
      ) ||
      navItems.find((item) => item.to === '/') ||
      navItems[0];

  const handleSwitchMode = (nextMode: AppMode) => {
    setMode(nextMode);
    if (location.pathname.startsWith('/profile') || location.pathname.startsWith('/admin')) {
      navigate('/');
    }
  };

  const displayBusinessName =
    businesses.length === 0 ? t.business.addBusiness : activeBusiness?.name || businessName;

  const workspaceLabel =
    mode === 'business'
      ? displayBusinessName
      : `${profileDisplayName || businessName} · ${t.nav.personal}`;

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

  const handleDeleteBusiness = async (biz: BusinessProfile) => {
    setBizError(null);
    setBizSaving(true);
    try {
      await deleteBusiness(biz);
      setConfirmDeleteBizId(null);
    } catch (err) {
      setBizError(err instanceof Error ? err.message : 'Unable to delete business.');
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
          className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center -mr-2 text-zinc-400 hover:text-zinc-100 rounded-md cursor-pointer"
        >
          <X className="w-5 h-5" />
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
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4ade80] hover:text-[#86efac] cursor-pointer whitespace-nowrap shrink-0 py-1"
              >
                <Plus className="w-3 h-3" />
                {sidebarAddOpen ? t.expenses.cancelEdit : t.business.addBusiness}
              </button>
            </div>

            {businesses.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <select
                    aria-label={t.business.switchBusiness}
                    value={activeBusinessId}
                    onChange={(e) => {
                      setActiveBusinessId(e.target.value);
                      setConfirmDeleteBizId(null);
                    }}
                    className="flex-1 min-w-0 px-2.5 py-2 text-base sm:text-xs font-medium bg-[#121214] text-zinc-100 border border-[#27272a] rounded-md focus:outline-none focus:border-[#22c55e] truncate"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {activeBusiness && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteBizId((prev) =>
                          prev === activeBusiness.id ? null : activeBusiness.id
                        );
                        setBizError(null);
                      }}
                      title={`${t.common.delete} ${activeBusiness.name}`}
                      aria-label={`${t.common.delete} ${activeBusiness.name}`}
                      className="min-h-[36px] min-w-[36px] sm:min-h-[30px] sm:min-w-[30px] inline-flex items-center justify-center bg-[#121214] border border-[#27272a] hover:border-red-500/40 text-zinc-400 hover:text-red-400 rounded-md transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {activeBusiness && confirmDeleteBizId === activeBusiness.id && (
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-[11px]">
                    <span className="text-red-300 truncate">
                      {t.common.delete} {activeBusiness.name}?
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={bizSaving}
                        onClick={() => handleDeleteBusiness(activeBusiness)}
                        className="font-semibold text-red-400 hover:text-red-300 px-1.5 py-0.5 cursor-pointer"
                      >
                        {t.common.delete}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteBizId(null)}
                        className="text-zinc-400 hover:text-zinc-200 px-1 py-0.5 cursor-pointer"
                      >
                        {t.common.no}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-2.5 py-1.5 text-xs text-zinc-400 bg-[#121214] border border-[#27272a] rounded-md truncate">
                {t.business.yourBusinessName}
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
                  className="w-full px-2.5 py-1.5 text-base sm:text-xs bg-[#121214] text-zinc-100 border border-[#27272a] rounded-md placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
                />
                {bizError && <p className="text-[11px] text-red-400">{bizError}</p>}
                <button
                  type="submit"
                  disabled={bizSaving || !sidebarBizName.trim()}
                  className="w-full px-2.5 py-2 text-xs font-semibold bg-[#22c55e] hover:bg-[#16a34a] text-zinc-950 rounded-md disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {bizSaving ? t.common.saving : t.business.saveName}
                </button>
              </form>
            )}
            {!sidebarAddOpen && bizError && (
              <p className="text-[11px] text-red-400">{bizError}</p>
            )}
          </div>
        )}
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
                  'flex items-center gap-3 px-3 min-h-[44px] lg:min-h-0 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
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

        {isAdmin && (
          <div className="pt-3 mt-3 border-t border-[#27272a]">
            <NavLink
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between gap-2 px-3 min-h-[44px] lg:min-h-0 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-transparent'
                )
              }
            >
              <span className="flex items-center gap-3 min-w-0">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#4ade80]" />
                <span className="truncate">{t.nav.adminPortal}</span>
              </span>
              <span className="text-[10px] font-mono text-[#4ade80] uppercase">/admin</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-[#27272a] bg-[#09090b]/60 shrink-0">
        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-2 py-2 rounded-lg transition-colors border',
              isActive
                ? 'bg-[#22c55e]/10 border-[#22c55e]/30'
                : 'border-transparent hover:bg-[#18181b] hover:border-[#27272a]'
            )
          }
          title={t.nav.myProfile}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#18181b] border border-[#27272a] shrink-0">
            {!avatarFailed && profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={profileDisplayName || 'Account'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#4ade80]">
                {(profileDisplayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-100 truncate">
              {profileDisplayName}
            </p>
            <p className="text-[11px] font-mono text-zinc-400 truncate">
              {user?.email}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        </NavLink>
        <PWAInstallButton className="mt-1.5 mb-1.5" />
        <button
          type="button"
          onClick={logout}
          className="mt-1 w-full flex items-center justify-center gap-2 px-3 min-h-[44px] lg:min-h-0 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
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
        <header className="h-14 bg-[#121214] border-b border-[#27272a] px-2 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-3 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t.nav.openMenu}
              title={t.nav.openMenu}
              className="lg:hidden min-h-[38px] min-w-[38px] inline-flex items-center justify-center bg-[#09090b] border border-[#27272a] hover:border-zinc-500 text-zinc-100 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-zinc-500 hidden xl:inline truncate max-w-[180px]">
                {workspaceLabel}
              </span>
              <span className="text-zinc-600 hidden xl:inline">/</span>
              <h1 className="font-semibold text-zinc-100 truncate text-[13px] sm:text-base">
                {currentNav.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageToggle compactMobile />

            {/* Multi-Business Switcher + Quick Add Business Name (Desktop Header) */}
            {mode === 'business' && (
              <div ref={bizDropdownRef} className="hidden md:block relative shrink-0">
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
                  <span className="max-w-[140px] truncate">{displayBusinessName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </button>

                {bizMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-[min(18rem,calc(100vw-2rem))] bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl p-2.5 z-50 space-y-2">
                    <div className="flex items-center justify-between px-1.5">
                      <span className="text-[11px] font-medium text-zinc-400">
                        {t.business.manageBusinesses}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                        {businesses.length || 1}
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {businesses.length === 0 ? (
                        <p className="text-[11px] text-zinc-400 px-1.5 py-2">
                          {t.business.yourBusinessName}
                        </p>
                      ) : (
                        businesses.map((b) => {
                          const selected = b.id === activeBusinessId;
                          const confirming = confirmDeleteBizId === b.id;
                          return (
                            <div key={b.id} className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveBusinessId(b.id);
                                  setBizMenuOpen(false);
                                  setBizError(null);
                                  setConfirmDeleteBizId(null);
                                }}
                                className={cn(
                                  'flex-1 min-w-0 flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left',
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
                              {confirming ? (
                                <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded-md px-1.5 py-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={bizSaving}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBusiness(b);
                                    }}
                                    className="text-[11px] font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                                  >
                                    {t.common.delete}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteBizId(null);
                                    }}
                                    className="text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                  >
                                    {t.common.no}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteBizId(b.id);
                                    setBizError(null);
                                  }}
                                  title={`${t.common.delete} ${b.name}`}
                                  aria-label={`${t.common.delete} ${b.name}`}
                                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
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
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-base sm:text-xs bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
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

            {/* Instant Dual-Mode Switch (Both Mobile and PC in Top Header) */}
            <div
              role="group"
              aria-label="Workspace mode switch"
              className="inline-flex items-center p-0.5 bg-[#09090b] border border-[#27272a] rounded-lg shrink-0"
            >
              <button
                type="button"
                onClick={() => handleSwitchMode('business')}
                className={cn(
                  'inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 sm:py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0',
                  mode === 'business'
                    ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100'
                )}
              >
                <Briefcase className="hidden sm:inline w-3.5 h-3.5 shrink-0" />
                <span>{t.nav.business}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('personal')}
                className={cn(
                  'inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 sm:py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0',
                  mode === 'personal'
                    ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100'
                )}
              >
                <UserIcon className="hidden sm:inline w-3.5 h-3.5 shrink-0" />
                <span>{t.nav.personal}</span>
              </button>
            </div>

            {/* PC Top-Right My Profile Option */}
            <NavLink
              to="/profile"
              aria-label={t.nav.myProfile}
              title={t.nav.myProfile}
              className={({ isActive }) =>
                cn(
                  'hidden md:inline-flex items-center gap-2 px-2.5 py-1.5 min-h-[34px] rounded-lg border transition-colors shrink-0 whitespace-nowrap',
                  isActive
                    ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#4ade80]'
                    : 'bg-[#09090b] border-[#27272a] hover:border-zinc-600 text-zinc-200 hover:text-zinc-100'
                )
              }
            >
              <span className="w-6 h-6 rounded-full overflow-hidden bg-[#18181b] border border-[#27272a] shrink-0 flex items-center justify-center">
                {!avatarFailed && profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={profileDisplayName || 'Account'}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-semibold text-[#4ade80]">
                    {(profileDisplayName || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="text-xs font-medium">{t.nav.myProfile}</span>
            </NavLink>

            {/* Mobile Top-Right 3-Dot Menu Option */}
            <div ref={mobileMoreRef} className="md:hidden relative shrink-0">
              <button
                type="button"
                onClick={() => setMobileMoreOpen((prev) => !prev)}
                aria-label="More options"
                aria-expanded={mobileMoreOpen}
                className={cn(
                  'min-h-[40px] min-w-[38px] inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer',
                  mobileMoreOpen
                    ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#4ade80]'
                    : 'bg-[#09090b] border-[#27272a] hover:border-zinc-600 text-zinc-200 hover:text-zinc-100'
                )}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {mobileMoreOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-[#121214] border border-[#27272a] rounded-xl shadow-2xl p-2 z-50 space-y-1.5">
                  <NavLink
                    to="/profile"
                    onClick={() => setMobileMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg border transition-colors',
                        isActive
                          ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#4ade80]'
                          : 'bg-[#09090b] border-[#27272a] text-zinc-100 hover:border-zinc-600'
                      )
                    }
                  >
                    <span className="w-8 h-8 rounded-full overflow-hidden bg-[#18181b] border border-[#27272a] shrink-0 flex items-center justify-center">
                      {!avatarFailed && profilePhotoUrl ? (
                        <img
                          src={profilePhotoUrl}
                          alt={profileDisplayName || 'Account'}
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarFailed(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-[#4ade80]">
                          {(profileDisplayName || user?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold truncate">{t.nav.myProfile}</span>
                      <span className="block text-[11px] text-zinc-400 truncate">
                        {profileDisplayName}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                  </NavLink>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMoreOpen(false);
                      setMobileOpen(true);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 min-h-[40px] text-xs font-medium text-zinc-200 hover:text-zinc-100 hover:bg-[#18181b] rounded-lg border border-[#27272a]/70 transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Menu className="w-3.5 h-3.5 text-[#4ade80]" />
                      <span>{t.nav.openMenu}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMoreOpen(false);
                      void logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 min-h-[40px] text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-[#18181b] rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{t.common.signOut}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PC Sub-Header Action Bar (keeps top header uncrowded so My Profile stays anchored) */}
        {headerAction && (
          <div className="hidden md:flex items-center justify-between gap-4 px-6 py-2.5 bg-[#0e0e11] border-b border-[#27272a] no-print">
            <span className="text-xs text-zinc-400 truncate">{workspaceLabel}</span>
            <div className="flex items-center gap-2 shrink-0">{headerAction}</div>
          </div>
        )}

        {/* Mobile Non-Sticky Workspace & Page Actions Bar */}
        {(mode === 'business' || headerAction) && (
          <div className="md:hidden bg-[#121214]/70 border-b border-[#27272a] px-4 py-2.5 flex flex-col gap-2 no-print">
            {mode === 'business' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-[#4ade80]" />
                    <span>{t.business.activeBusinessLabel}</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    {businesses.length > 0 ? (
                      <>
                        <select
                          aria-label={t.business.switchBusiness}
                          value={activeBusinessId}
                          onChange={(e) => {
                            setActiveBusinessId(e.target.value);
                            setConfirmDeleteBizId(null);
                          }}
                          className="flex-1 min-w-0 max-w-[180px] px-2.5 py-1.5 text-sm font-medium bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e] truncate"
                        >
                          {businesses.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                        {activeBusiness && (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteBizId((prev) =>
                                prev === activeBusiness.id ? null : activeBusiness.id
                              );
                              setBizError(null);
                            }}
                            title={`${t.common.delete} ${activeBusiness.name}`}
                            aria-label={`${t.common.delete} ${activeBusiness.name}`}
                            className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center bg-[#09090b] border border-[#27272a] hover:border-red-500/40 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSidebarAddOpen(true);
                          setMobileOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#4ade80] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.business.addBusiness}</span>
                      </button>
                    )}
                  </div>
                </div>

                {activeBusiness && confirmDeleteBizId === activeBusiness.id && (
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs">
                    <span className="text-red-300 truncate">
                      {t.common.delete} {activeBusiness.name}?
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={bizSaving}
                        onClick={() => handleDeleteBusiness(activeBusiness)}
                        className="font-semibold text-red-400 hover:text-red-300 px-1.5 py-0.5 cursor-pointer"
                      >
                        {t.common.delete}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteBizId(null)}
                        className="text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 cursor-pointer"
                      >
                        {t.common.no}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {headerAction && (
              <div className="flex flex-wrap items-center gap-2 [&>div]:flex [&>div]:flex-wrap [&>div]:w-full [&>div]:gap-2">
                {headerAction}
              </div>
            )}
          </div>
        )}

        <main className="flex-1 pb-[env(safe-area-inset-bottom)]">{children}</main>
      </div>
    </div>
  );
};
