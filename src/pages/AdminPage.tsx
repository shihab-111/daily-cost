import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import {
  Activity,
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Copy,
  Download,
  Lock,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../lib/firebase/db';
import { exportAdminUsersCsv, getTodayDhakaDate } from '../lib/utils';
import { BusinessProfile, UserDirectoryEntry, UserSettings } from '../types';

type ActivityFilter = 'all' | 'today' | 'last_7_days' | 'pending';
type SortKey = 'latest_login' | 'most_logins' | 'name_asc' | 'first_seen';

interface MergedAdminUserRow {
  userId: string;
  displayName: string;
  email: string;
  businessNames: string[];
  primaryBusinessName: string;
  loginCount: number;
  hasRecordedLogin: boolean;
  lastLoginMs: number;
  lastLoginDateDhaka: string;
  lastLoginFormatted: string;
  firstSeenMs: number;
  firstSeenFormatted: string;
}

function timestampToMs(ts?: Timestamp): number {
  if (!ts) return 0;
  try {
    return typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
  } catch {
    return 0;
  }
}

function formatDhakaDateTime(ms: number): string {
  if (!ms) return '—';
  const date = new Date(ms);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function getDhakaDateString(ms: number): string {
  if (!ms) return '';
  const date = new Date(ms);
  const dhaka = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  const y = dhaka.getFullYear();
  const m = String(dhaka.getMonth() + 1).padStart(2, '0');
  const d = String(dhaka.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatRelativeTime(ms: number, justNowLabel: string): string {
  if (!ms) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return justNowLabel;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();

  const [mySettings, setMySettings] = useState<UserSettings | null>(null);
  const [directoryEntries, setDirectoryEntries] = useState<UserDirectoryEntry[]>([]);
  const [allSettings, setAllSettings] = useState<UserSettings[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('latest_login');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = dbService.subscribeSettings(
      user,
      (s) => setMySettings(s),
      () => undefined
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let dirReady = false;
    let settingsReady = false;
    let bizReady = false;

    const markReady = () => {
      if (dirReady && settingsReady && bizReady) {
        setLoading(false);
      }
    };

    const handleErr = (err: Error) => {
      setError(err.message);
      setLoading(false);
    };

    const unsubDir = dbService.subscribeAllUserDirectory(
      (entries) => {
        setDirectoryEntries(entries);
        dirReady = true;
        markReady();
      },
      handleErr
    );

    const unsubSettings = dbService.subscribeAllSettingsForAdmin(
      (items) => {
        setAllSettings(items);
        settingsReady = true;
        markReady();
      },
      handleErr
    );

    const unsubBusinesses = dbService.subscribeAllBusinessesForAdmin(
      (items) => {
        setAllBusinesses(items);
        bizReady = true;
        markReady();
      },
      handleErr
    );

    return () => {
      unsubDir();
      unsubSettings();
      unsubBusinesses();
    };
  }, [user, isAdmin]);

  const mergedUsers = useMemo<MergedAdminUserRow[]>(() => {
    const byUid = new Map<
      string,
      {
        dir?: UserDirectoryEntry;
        settings?: UserSettings;
        businesses: BusinessProfile[];
      }
    >();

    for (const entry of directoryEntries) {
      const uid = entry.userId || entry.id;
      const cur = byUid.get(uid) || { businesses: [] };
      cur.dir = entry;
      byUid.set(uid, cur);
    }

    for (const s of allSettings) {
      const uid = s.userId || s.id;
      const cur = byUid.get(uid) || { businesses: [] };
      cur.settings = s;
      byUid.set(uid, cur);
    }

    for (const b of allBusinesses) {
      const uid = b.userId;
      if (!uid) continue;
      const cur = byUid.get(uid) || { businesses: [] };
      cur.businesses.push(b);
      byUid.set(uid, cur);
    }

    const rows: MergedAdminUserRow[] = [];
    byUid.forEach((group, uid) => {
      const dir = group.dir;
      const settings = group.settings;
      const sortedBusinesses = [...group.businesses].sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      const businessNames = sortedBusinesses.map((b) => b.name).filter(Boolean);
      const fallbackBizName =
        dir?.businessName?.trim() || settings?.businessName?.trim() || 'EkTally';
      if (businessNames.length === 0 && fallbackBizName) {
        businessNames.push(fallbackBizName);
      }

      const displayName =
        dir?.displayName?.trim() ||
        settings?.ownerName?.trim() ||
        dir?.email?.split('@')[0] ||
        'User';
      const email = dir?.email || '—';

      const lastLoginMs = timestampToMs(dir?.lastLoginAt);
      const firstSeenMs =
        timestampToMs(dir?.firstLoginAt) ||
        timestampToMs(dir?.createdAt) ||
        timestampToMs(settings?.createdAt) ||
        timestampToMs(settings?.updatedAt);

      const hasRecordedLogin = Boolean(dir && lastLoginMs > 0);
      const loginCount = dir ? Math.max(1, dir.loginCount || 1) : 0;

      rows.push({
        userId: uid,
        displayName,
        email,
        businessNames,
        primaryBusinessName: businessNames[0] || fallbackBizName,
        loginCount,
        hasRecordedLogin,
        lastLoginMs,
        lastLoginDateDhaka: getDhakaDateString(lastLoginMs),
        lastLoginFormatted: hasRecordedLogin
          ? formatDhakaDateTime(lastLoginMs)
          : t.admin.pendingNextLogin,
        firstSeenMs,
        firstSeenFormatted: firstSeenMs ? formatDhakaDateTime(firstSeenMs) : '—',
      });
    });

    return rows;
  }, [directoryEntries, allSettings, allBusinesses, t.admin.pendingNextLogin]);

  const todayDhaka = getTodayDhakaDate();
  const sevenDaysStartDhaka = useMemo(() => {
    const base = new Date(`${todayDhaka}T00:00:00Z`);
    base.setUTCDate(base.getUTCDate() - 6);
    return base.toISOString().slice(0, 10);
  }, [todayDhaka]);

  const stats = useMemo(() => {
    const totalUsers = mergedUsers.length;
    const activeToday = mergedUsers.filter(
      (u) => u.hasRecordedLogin && u.lastLoginDateDhaka === todayDhaka
    ).length;
    const totalLogins = mergedUsers.reduce((acc, u) => acc + u.loginCount, 0);
    const totalBusinesses =
      allBusinesses.length > 0
        ? allBusinesses.length
        : mergedUsers.reduce((acc, u) => acc + u.businessNames.length, 0);

    return { totalUsers, activeToday, totalLogins, totalBusinesses };
  }, [mergedUsers, allBusinesses.length, todayDhaka]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mergedUsers
      .filter((u) => {
        if (activityFilter === 'today') {
          if (!u.hasRecordedLogin || u.lastLoginDateDhaka !== todayDhaka) return false;
        } else if (activityFilter === 'last_7_days') {
          if (
            !u.hasRecordedLogin ||
            u.lastLoginDateDhaka < sevenDaysStartDhaka ||
            u.lastLoginDateDhaka > todayDhaka
          ) {
            return false;
          }
        } else if (activityFilter === 'pending') {
          if (u.hasRecordedLogin) return false;
        }

        if (!q) return true;
        return (
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.userId.toLowerCase().includes(q) ||
          u.businessNames.some((b) => b.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'latest_login') {
          if (b.lastLoginMs !== a.lastLoginMs) return b.lastLoginMs - a.lastLoginMs;
          return b.firstSeenMs - a.firstSeenMs;
        }
        if (sortBy === 'most_logins') {
          if (b.loginCount !== a.loginCount) return b.loginCount - a.loginCount;
          return b.lastLoginMs - a.lastLoginMs;
        }
        if (sortBy === 'name_asc') {
          return a.displayName.localeCompare(b.displayName);
        }
        return b.firstSeenMs - a.firstSeenMs;
      });
  }, [mergedUsers, searchQuery, activityFilter, sortBy, todayDhaka, sevenDaysStartDhaka]);

  const handleCopyAdminLink = async () => {
    const url = `${window.location.origin}/admin`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleExportCsv = () => {
    exportAdminUsersCsv(
      filteredUsers.map((u) => ({
        userId: u.userId,
        displayName: u.displayName,
        email: u.email,
        businesses: u.businessNames.join(' | '),
        loginCount: u.loginCount,
        lastLoginText: u.lastLoginFormatted,
        firstSeenText: u.firstSeenFormatted,
      }))
    );
  };

  const shellBusinessName = mySettings?.businessName || 'EkTally';

  if (!isAdmin) {
    return (
      <DashboardShell businessName={shellBusinessName}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-100">{t.admin.accessDeniedTitle}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{t.admin.accessDeniedDesc}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#22c55e] hover:bg-[#16a34a] text-zinc-950 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.admin.backToDashboard}
              </Link>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      businessName={shellBusinessName}
      headerAction={
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredUsers.length === 0}
          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] md:min-h-0 py-1.5 text-xs font-medium bg-[#09090b] hover:bg-[#18181b] text-zinc-200 border border-[#27272a] rounded-lg disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-[#4ade80]" />
          <span>{t.admin.exportUsersCsv}</span>
        </button>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Top Portal Header + Direct Link */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-xl p-4 sm:p-5">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#4ade80] shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold text-zinc-100">
                {t.admin.portalTitle}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30 rounded shrink-0">
                {t.admin.adminBadge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">{t.admin.portalSubtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-2 sm:py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-xs font-mono text-zinc-300 truncate max-w-full">
              /admin
            </div>
            <button
              type="button"
              onClick={handleCopyAdminLink}
              className="inline-flex items-center gap-1.5 px-3 min-h-[38px] sm:min-h-0 py-1.5 text-xs font-medium bg-[#18181b] hover:bg-[#27272a] text-zinc-100 border border-[#27272a] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                  <span className="text-[#4ade80]">{t.admin.linkCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t.admin.copyLink}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="truncate">{t.admin.totalUsers}</span>
              <Users className="w-4 h-4 text-[#4ade80] shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-100">
              {stats.totalUsers}
            </p>
          </div>

          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="truncate">{t.admin.loggedInToday}</span>
              <UserCheck className="w-4 h-4 text-[#4ade80] shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#4ade80]">
              {stats.activeToday}
            </p>
          </div>

          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="truncate">{t.admin.totalLogins}</span>
              <Activity className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-100">
              {stats.totalLogins}
            </p>
          </div>

          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
              <span className="truncate">{t.admin.totalBusinesses}</span>
              <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-100">
              {stats.totalBusinesses}
            </p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.admin.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            <select
              aria-label="Sort users"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full md:w-auto px-3 py-2 min-h-[42px] sm:min-h-0 text-base sm:text-xs font-medium bg-[#09090b] text-zinc-200 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e]"
            >
              <option value="latest_login">{t.admin.sortLatestLogin}</option>
              <option value="most_logins">{t.admin.sortMostLogins}</option>
              <option value="name_asc">{t.admin.sortNameAsc}</option>
              <option value="first_seen">{t.admin.sortFirstSeen}</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-0.5">
              {(
                [
                  { id: 'all', label: t.admin.filterAll },
                  { id: 'today', label: t.admin.filterToday },
                  { id: 'last_7_days', label: t.admin.filterLast7Days },
                  { id: 'pending', label: t.admin.filterPending },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivityFilter(tab.id)}
                  className={
                    activityFilter === tab.id
                      ? 'px-3 min-h-[38px] sm:min-h-0 py-1.5 text-xs font-semibold bg-[#22c55e] text-zinc-950 rounded-md cursor-pointer whitespace-nowrap shrink-0'
                      : 'px-3 min-h-[38px] sm:min-h-0 py-1.5 text-xs font-medium bg-[#09090b] text-zinc-400 hover:text-zinc-100 border border-[#27272a] rounded-md cursor-pointer whitespace-nowrap shrink-0'
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-400 font-mono tabular-nums shrink-0">
              {t.admin.showingCount} {filteredUsers.length} {t.admin.usersWord}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Users & Login Times List */}
        {loading ? (
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-10 text-center text-sm text-zinc-400">
            {t.common.loading}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-10 text-center space-y-2">
            <Users className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-200">{t.admin.noUsersTitle}</h3>
            <p className="text-xs text-zinc-400">{t.admin.noUsersDesc}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-[#121214] border border-[#27272a] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#09090b]/60 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      <th className="px-4 py-3">{t.admin.userColumn}</th>
                      <th className="px-4 py-3">{t.admin.emailColumn}</th>
                      <th className="px-4 py-3">{t.admin.businessesColumn}</th>
                      <th className="px-4 py-3">{t.admin.lastLoginColumn}</th>
                      <th className="px-4 py-3">{t.admin.firstSeenColumn}</th>
                      <th className="px-4 py-3 text-right">{t.admin.loginCountColumn}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a] text-sm">
                    {filteredUsers.map((row) => (
                      <tr key={row.userId} className="hover:bg-[#18181b]/60 transition-colors">
                        <td className="px-4 py-3.5 align-top">
                          <div className="font-medium text-zinc-100">{row.displayName}</div>
                          <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                            {row.userId}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top font-mono text-xs text-zinc-300">
                          {row.email}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="text-xs font-medium text-zinc-200">
                            {row.primaryBusinessName}
                          </div>
                          {row.businessNames.length > 1 && (
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              +{row.businessNames.length - 1}:{' '}
                              {row.businessNames.slice(1).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-zinc-100">
                            <Clock className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                            <span>{row.lastLoginFormatted}</span>
                          </div>
                          {row.hasRecordedLogin && (
                            <div className="text-[11px] text-[#4ade80] font-mono mt-0.5 pl-5">
                              {formatRelativeTime(row.lastLoginMs, t.admin.justNow)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-top text-xs font-mono tabular-nums text-zinc-400">
                          {row.firstSeenFormatted}
                        </td>
                        <td className="px-4 py-3.5 align-top text-right">
                          <span className="inline-block px-2 py-0.5 text-xs font-mono font-semibold tabular-nums bg-[#09090b] border border-[#27272a] text-zinc-100 rounded">
                            {row.loginCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((row) => (
                <div
                  key={row.userId}
                  className="bg-[#121214] border border-[#27272a] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-100 truncate">
                        {row.displayName}
                      </p>
                      <p className="text-xs font-mono text-zinc-400 truncate">{row.email}</p>
                      <p className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
                        {row.userId}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-mono font-semibold tabular-nums bg-[#09090b] border border-[#27272a] text-zinc-100 rounded shrink-0">
                      {row.loginCount}x
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-[#27272a] text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">{t.admin.businessesColumn}:</span>
                      <span className="text-zinc-200 font-medium text-right truncate">
                        {row.businessNames.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">{t.admin.lastLoginColumn}:</span>
                      <span className="font-mono tabular-nums text-[#4ade80] text-right">
                        {row.lastLoginFormatted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">{t.admin.firstSeenColumn}:</span>
                      <span className="font-mono tabular-nums text-zinc-400 text-right">
                        {row.firstSeenFormatted}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
};
