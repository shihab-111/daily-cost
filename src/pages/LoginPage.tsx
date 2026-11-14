import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogOut, MailCheck, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { EKTALLY_LOGO_URL } from '../lib/utils';
import { loginSchema, registerSchema } from '../lib/validators/schemas';
import { Button } from '../components/ui';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'login' }) => {
  const {
    user,
    authLoading,
    verifyingTenant,
    isAuthorized,
    denialReason,
    authError,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resendVerification,
    refreshVerificationStatus,
    logout,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [checkingVerify, setCheckingVerify] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  if (user && isAuthorized) {
    return <Navigate to="/" replace />;
  }

  const switchAuthTab = (next: 'login' | 'register') => {
    setMode(next);
    setFormError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (mode === 'login') {
      const parsed = loginSchema.safeParse({ email, password, rememberMe });
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message || 'Check your credentials.');
        return;
      }
      setSubmitting(true);
      try {
        await loginWithEmail(parsed.data.email, parsed.data.password, parsed.data.rememberMe);
      } catch {
        // authError handled by context
      } finally {
        setSubmitting(false);
      }
    } else {
      const parsed = registerSchema.safeParse({
        displayName,
        businessName,
        email,
        password,
        confirmPassword,
      });
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message || 'Check your registration fields.');
        return;
      }
      setSubmitting(true);
      try {
        await registerWithEmail(
          parsed.data.email,
          parsed.data.password,
          parsed.data.displayName,
          parsed.data.businessName
        );
        setVerificationSent(true);
      } catch {
        // authError handled by context
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle(rememberMe);
    } catch {
      // authError handled by context
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendVerification = async () => {
    setVerifyNotice(null);
    await resendVerification();
    setVerificationSent(true);
    setVerifyNotice('Verification link sent. Open your inbox, confirm, then click "I\'ve Verified".');
  };

  const handleCheckVerified = async () => {
    setCheckingVerify(true);
    setVerifyNotice(null);
    try {
      const ok = await refreshVerificationStatus();
      if (!ok) {
        setVerifyNotice('Email is not verified yet. Please click the verification link in your inbox first.');
      }
    } finally {
      setCheckingVerify(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050507] text-zinc-100 grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[1fr_auto]">
      {/* Shared Modern Black & Light Green Backdrop (Full on mobile, Left half on desktop) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:w-1/2 bg-gradient-to-br from-[#050507] via-[#07150d] to-[#050507] lg:border-r border-[#4ade80]/15 overflow-hidden"
      >
        <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-[#4ade80]/15 blur-[110px]" />
        <div className="absolute -bottom-36 -right-20 w-[460px] h-[460px] rounded-full bg-[#22c55e]/15 blur-[120px]" />
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(74,222,128,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(74,222,128,0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
      </div>

      {/* 1. Brand Mark & Hero Statement (Mobile: Top | Desktop: Left Top/Center) */}
      <div className="relative z-10 lg:col-start-1 lg:row-start-1 flex flex-col justify-between p-6 pb-4 sm:p-10 sm:pb-6 lg:p-14 lg:pb-8">
        <div className="flex items-center justify-between gap-4">
          <img
            src={EKTALLY_LOGO_URL}
            alt="EkTally"
            referrerPolicy="no-referrer"
            className="h-8 sm:h-9 w-auto object-contain shrink-0"
          />
          <span className="text-xs font-mono text-[#4ade80]/80 whitespace-nowrap">
            Dhaka · BDT ৳
          </span>
        </div>

        <div className="mt-6 lg:my-auto lg:py-8 max-w-xl">
          <p className="text-xs font-mono text-[#4ade80] mb-2.5 tracking-wide">
            EkTally · Dual-Mode Business &amp; Personal Ledger
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-[1.15] text-balance mb-3">
            Private Bangladesh{' '}
            <span className="text-[#4ade80]">business &amp; personal</span>{' '}
            expense control.
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
            Switch seamlessly between Business Operations (Meta ads, inventory, customers, custom receipts) and Personal Daily Expenses (bazaar, bills, monthly budget) with strict per-user data isolation.
          </p>
        </div>
      </div>

      {/* 2. Tenant Auth Panel (Mobile: Middle, before Dual Workspace | Desktop: Right Column) */}
      <div className="relative z-10 lg:col-start-2 lg:row-start-1 lg:row-span-2 flex items-center justify-center px-6 py-4 sm:px-10 sm:py-6 lg:p-16 lg:bg-[#07080a] overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-[#22c55e]/[0.06] blur-[120px]"
        />
        <div className="relative z-10 w-full max-w-md bg-[#0e1012] border border-[#4ade80]/15 rounded-xl p-6 sm:p-8 shadow-[0_24px_80px_-24px_rgba(34,197,94,0.12)]">
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#4ade80] mb-2">
              {mode === 'login' ? <Lock className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>EkTally Workspace</span>
            </div>
            <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
              {mode === 'login' ? 'Sign In to Your Ledger' : 'Create Private Workspace'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Your receipts, inventory, customers, and personal budgets remain strictly private to your verified account.
            </p>
          </div>

          {authLoading || verifyingTenant ? (
            <div className="border border-[#27272a] bg-[#121214] rounded-lg p-5 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-zinc-700 border-t-[#22c55e] rounded-full animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  {verifyingTenant ? 'Preparing your isolated workspace...' : 'Checking session...'}
                </p>
                <p className="text-xs text-zinc-500">Connecting to secured database</p>
              </div>
            </div>
          ) : user && !isAuthorized && denialReason === 'unverified_email' ? (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MailCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Verify Your Email Address
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    A verification link was sent to <span className="font-mono text-zinc-200">{user.email}</span>. Email verification is enforced by database security rules before private workspace access opens.
                  </p>
                </div>
              </div>

              {verifyNotice && (
                <div className="text-xs text-amber-300 bg-[#09090b] border border-[#27272a] rounded-lg p-2.5">
                  {verifyNotice}
                </div>
              )}

              <div className="space-y-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCheckVerified}
                  disabled={checkingVerify}
                  className="w-full"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingVerify ? 'animate-spin' : ''}`} />
                  {checkingVerify ? 'Checking status...' : "I've Verified — Open Workspace"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSendVerification}
                  className="w-full"
                >
                  <MailCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                  {verificationSent ? 'Resend Verification Email' : 'Send Verification Email'}
                </Button>

                <Button type="button" variant="danger" size="sm" onClick={logout} className="w-full">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out &amp; Switch Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Sign In / Create Account Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg">
                <button
                  type="button"
                  onClick={() => switchAuthTab('login')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthTab('register')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {(formError || authError) && (
                <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-xs text-red-300 leading-relaxed">
                  {formError || authError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Your Name *
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Tariqul Islam"
                        className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-biz" className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Business Name *
                      </label>
                      <input
                        id="reg-biz"
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Dhaka Craft BD"
                        className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'login' ? 'Enter password' : 'Minimum 6 characters'}
                      className="w-full pl-3 pr-10 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label htmlFor="reg-confirm" className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Confirm Password *
                    </label>
                    <input
                      id="reg-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                )}

                {mode === 'login' && (
                  <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#27272a] bg-[#09090b] accent-[#22c55e]"
                    />
                    <span>Remember my session on this device</span>
                  </label>
                )}

                <Button type="submit" disabled={submitting} className="w-full py-2.5">
                  {submitting
                    ? mode === 'login'
                      ? 'Signing in...'
                      : 'Creating workspace...'
                    : mode === 'login'
                    ? 'Sign In with Email'
                    : 'Create Private Account'}
                </Button>
              </form>

              <div className="relative flex items-center py-1">
                <div className="flex-1 border-t border-[#27272a]" />
                <span className="px-3 text-[11px] text-zinc-500">or</span>
                <div className="flex-1 border-t border-[#27272a]" />
              </div>

              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={handleGoogleLogin}
                className="w-full py-2.5"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Architectural Highlights (Mobile: Bottom, after Login | Desktop: Left Bottom) */}
      <div className="relative z-10 lg:col-start-1 lg:row-start-2 px-6 pt-4 pb-10 sm:px-10 sm:pb-12 lg:px-14 lg:pt-0 lg:pb-14">
        <div className="border-t border-[#4ade80]/15 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-xl">
          <div>
            <p className="text-xs font-medium text-[#86efac]">Dual Workspace</p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Business ops &amp; personal daily ledger in one toggle
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#86efac]">BD Ready</p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              BDT ৳, bKash, Nagad, Rocket &amp; A4/80mm receipts
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#86efac]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
              <span>UID Isolated</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Scoped strictly to your verified account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
