import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMode } from '../../context/ModeContext';
import { cn, EKTALLY_LOGO_URL } from '../../lib/utils';

interface DashboardShellProps {
  businessName: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

const BUSINESS_NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/expenses', label: 'Business Expenses', icon: Receipt },
  { to: '/products', label: 'Product Inventory', icon: Package },
  { to: '/customers', label: 'Customers (BD)', icon: Users },
  { to: '/receipts', label: 'Receipt Studio', icon: FileText },
  { to: '/settings', label: 'Settings & Data', icon: Settings },
];

const PERSONAL_NAV = [
  { to: '/', label: 'Personal Overview', icon: LayoutDashboard },
  { to: '/expenses', label: 'Daily Expenses', icon: Receipt },
  { to: '/receipts', label: 'Receipt Studio', icon: FileText },
  { to: '/settings', label: 'Settings & Budget', icon: Settings },
];

export const DashboardShell: React.FC<DashboardShellProps> = ({
  businessName,
  children,
  headerAction,
}) => {
  const { user, logout } = useAuth();
  const { mode, setMode } = useMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = mode === 'business' ? BUSINESS_NAV : PERSONAL_NAV;

  useEffect(() => {
    if (
      mode === 'personal' &&
      (location.pathname.startsWith('/products') || location.pathname.startsWith('/customers'))
    ) {
      navigate('/', { replace: true });
    }
  }, [mode, location.pathname, navigate]);

  const currentNav =
    navItems.find((item) =>
      item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
    ) || navItems[0];

  const workspaceLabel =
    mode === 'business'
      ? businessName
      : `${user?.displayName || businessName} · Personal`;

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

      <div className="px-3 pt-3 pb-1">
        <div className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">Active Mode</span>
          <span className="font-mono font-semibold text-[#4ade80] uppercase">
            {mode === 'business' ? 'Business' : 'Personal'}
          </span>
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
              {user?.displayName || 'Workspace Owner'}
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
          Sign Out
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
              className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-100 rounded-lg cursor-pointer"
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

          <div className="flex items-center gap-2.5 shrink-0">
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
                <span>Business</span>
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
                <span>Personal</span>
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
