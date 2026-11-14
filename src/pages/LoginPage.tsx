import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogOut, MailCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROOT_ADMIN_EMAIL } from '../lib/firebase/client';
import { loginSchema } from '../lib/validators/schemas';
import { Button } from '../components/ui';

export const LoginPage: React.FC = () => {
  const {
    user,
    authLoading,
    verifyingAdmin,
    isAuthorized,
    denialReason,
    authError,
    loginWithEmail,
    loginWithGoogle,
    resendVerification,
    logout,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (user && isAuthorized) {
    return <Navigate to="/" replace />;
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
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
    await resendVerification();
    setVerificationSent(true);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col lg:flex-row items-stretch">
      {/* Left Branded Visual Panel */}
      <div className="relative lg:w-1/2 min-h-[260px] lg:min-h-screen bg-[#121214] border-b lg:border-b-0 lg:border-r border-[#27272a] overflow-hidden flex flex-col justify-end">
        {!imageError ? (
          <img
            src="/src/assets/images/login_archive_studio_1794665533639.jpg"
            alt="Business operations desk and ledger"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/65 to-[#09090b]/30" />

        <div className="relative z-10 p-8 lg:p-14 max-w-xl">
          <p className="text-xs font-mono text-[#4ade80] mb-3">
            Meridian BD · Internal Business &amp; Expense Console
          </p>
          <h1 className="text-2xl lg:text-4xl font-semibold text-white tracking-tight leading-tight text-balance mb-4">
            Centralized Bangladesh expense tracking and inventory control.
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
            Track Meta ad spend, influencer payouts, photoshoot productions, BD courier packaging, and live product stock levels behind strict administrator authentication.
          </p>
        </div>
      </div>

      {/* Right Admin Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#09090b]">
        <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-xl p-6 sm:p-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#4ade80] mb-2.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Private Admin Portal</span>
            </div>
            <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Administrator Sign In
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              No public registration is permitted. Sign in with authorized administrator credentials.
            </p>
          </div>

          {authLoading || verifyingAdmin ? (
            <div className="border border-[#27272a] bg-[#121214] rounded-lg p-5 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-zinc-700 border-t-[#22c55e] rounded-full animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  {verifyingAdmin ? 'Verifying admin authorization...' : 'Checking session...'}
                </p>
                <p className="text-xs text-zinc-500">Connecting to secured database</p>
              </div>
            </div>
          ) : user && !isAuthorized ? (
            <div className="border border-red-500/30 bg-red-500/5 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {denialReason === 'unverified_email'
                      ? 'Email Verification Required'
                      : 'Access Denied'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {denialReason === 'unverified_email'
                      ? `Your account (${user.email}) must verify its email address before Firestore security rules allow access.`
                      : `Signed in as ${user.email}. This account is not authorized on the admin roster (${ROOT_ADMIN_EMAIL} or Settings-approved UID).`}
                  </p>
                </div>
              </div>

              {denialReason === 'unverified_email' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSendVerification}
                  className="w-full"
                >
                  <MailCheck className="w-4 h-4 text-[#4ade80]" />
                  {verificationSent
                    ? 'Verification Email Sent — Reload After Confirming'
                    : 'Send Verification Email'}
                </Button>
              )}

              <Button type="button" variant="danger" size="sm" onClick={logout} className="w-full">
                <LogOut className="w-4 h-4" />
                Sign Out &amp; Switch Account
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {(formError || authError) && (
                <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-xs text-red-300 leading-relaxed">
                  {formError || authError}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    Admin Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@yourbusiness.com.bd"
                    className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter administrator password"
                      className="w-full pl-3 pr-10 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
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

                <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#27272a] bg-[#09090b] accent-[#22c55e]"
                  />
                  <span>Remember my session on this device</span>
                </label>

                <Button type="submit" disabled={submitting} className="w-full py-2.5">
                  {submitting ? 'Authenticating...' : 'Sign In with Email & Password'}
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
                Sign In with Google Admin Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
