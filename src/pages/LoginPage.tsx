import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  LogOut,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { translateValidationMessage } from '../lib/i18n';
import { EKTALLY_LOGO_URL } from '../lib/utils';
import { loginSchema, registerSchema } from '../lib/validators/schemas';
import { Button } from '../components/ui';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { BotanicalBackdropCanvas } from '../components/auth/BotanicalBackdropCanvas';

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
    verificationSent,
    verificationNotice,
    setVerificationNotice,
    loginWithEmail,
    registerWithEmail,
    resendVerification,
    refreshVerificationStatus,
    logout,
    clearError,
  } = useAuth();
  const { language, t } = useLanguage();

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
  const [checkingVerify, setCheckingVerify] = useState(false);
  const [resendingVerify, setResendingVerify] = useState(false);

  // Automatically detect when user completes email verification in another tab/app
  useEffect(() => {
    if (!user || isAuthorized || denialReason !== 'unverified_email') return;
    const intervalId = window.setInterval(() => {
      refreshVerificationStatus().catch(() => {
        // ignore transient polling errors
      });
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, [user, isAuthorized, denialReason, refreshVerificationStatus]);

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
        setFormError(
          translateValidationMessage(
            parsed.error.issues[0]?.message,
            language,
            t.authErrors.invalidCredential
          )
        );
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
        setFormError(
          translateValidationMessage(
            parsed.error.issues[0]?.message,
            language,
            t.authErrors.registerFailed
          )
        );
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
      } catch {
        // authError handled by context
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleSendVerification = async () => {
    setVerificationNotice(null);
    setResendingVerify(true);
    try {
      await resendVerification();
      setVerificationNotice(t.login.verificationSentNotice);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/too-many-requests') {
        setVerificationNotice(t.login.verificationTooManyNotice);
      } else {
        setVerificationNotice(
          err instanceof Error ? err.message : t.authErrors.sendVerificationFailed
        );
      }
    } finally {
      setResendingVerify(false);
    }
  };

  const handleCheckVerified = async () => {
    setCheckingVerify(true);
    setVerificationNotice(null);
    try {
      const ok = await refreshVerificationStatus();
      if (!ok) {
        setVerificationNotice(t.login.verificationNotYetNotice);
      }
    } catch (err) {
      setVerificationNotice(
        err instanceof Error ? err.message : t.authErrors.checkVerificationFailed
      );
    } finally {
      setCheckingVerify(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#050507] text-zinc-100 grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[1fr_auto]">
      {/* Shared Modern Black & Light Green Backdrop (Full on mobile, Left half on desktop) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:w-1/2 bg-gradient-to-br from-[#050507] via-[#07150d] to-[#050507] lg:border-r border-[#4ade80]/15 overflow-hidden"
      >
        <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-[#4ade80]/15 blur-[110px]" />
        <div className="absolute -bottom-36 -right-20 w-[460px] h-[460px] rounded-full bg-[#22c55e]/15 blur-[120px]" />
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(74,222,128,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(74,222,128,0.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
        <BotanicalBackdropCanvas />
      </div>

      {/* 1. Brand Mark & Hero Statement (Mobile: Top | Desktop: Left Top/Center) */}
      <div className="relative z-10 lg:col-start-1 lg:row-start-1 flex flex-col justify-between px-4 pt-3.5 pb-2 sm:p-10 sm:pb-6 lg:p-14 lg:pb-8">
        <div className="flex items-center justify-between gap-3">
          <img
            src={EKTALLY_LOGO_URL}
            alt="EkTally"
            referrerPolicy="no-referrer"
            className="h-7 sm:h-9 w-auto object-contain shrink-0"
          />
          <LanguageToggle />
        </div>

        <div className="mt-3 sm:mt-6 lg:my-auto lg:py-8 max-w-xl">
          <p className="hidden lg:block text-xs font-mono text-[#4ade80] mb-2 tracking-wide">
            {t.login.kicker}
          </p>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-[1.15] text-balance mb-0.5 lg:mb-3">
            {t.login.headlinePrefix}{' '}
            <span className="text-[#4ade80]">{t.login.headlineHighlight}</span>{' '}
            {t.login.headlineSuffix}
          </h1>
          <p className="hidden lg:block text-sm text-zinc-400 leading-relaxed max-w-md">
            {t.login.subtitle}
          </p>
        </div>
      </div>

      {/* 2. Tenant Auth Panel (Mobile: Middle, before Dual Workspace | Desktop: Right Column) */}
      <div className="relative z-10 lg:col-start-2 lg:row-start-1 lg:row-span-2 flex items-center justify-center px-4 py-2 sm:px-10 sm:py-6 lg:p-16 lg:bg-[#07080a] overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-[#22c55e]/[0.06] blur-[120px]"
        />
        <div className="relative z-10 w-full max-w-md bg-[#0e1012] border border-[#4ade80]/15 rounded-xl p-4 sm:p-8 shadow-[0_24px_80px_-24px_rgba(34,197,94,0.12)]">
          <div className="mb-3 sm:mb-5">
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#4ade80] mb-1 sm:mb-2">
              {mode === 'login' ? <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <UserPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              <span>{t.login.workspaceTag}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-100 tracking-tight">
              {mode === 'login' ? t.login.signInTitle : t.login.registerTitle}
            </h2>
            <p className="hidden sm:block text-xs text-zinc-400 mt-1 leading-relaxed">
              {t.login.authSubtitle}
            </p>
          </div>

          {authLoading || verifyingTenant ? (
            <div className="border border-[#27272a] bg-[#121214] rounded-lg p-5 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-zinc-700 border-t-[#22c55e] rounded-full animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  {verifyingTenant ? t.login.preparingWorkspace : t.login.checkingSession}
                </p>
                <p className="text-xs text-zinc-500">{t.login.connectingDb}</p>
              </div>
            </div>
          ) : user && !isAuthorized && denialReason === 'unverified_email' ? (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MailCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {t.login.verifyEmailTitle}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {t.login.verifyEmailDescPrefix}{' '}
                    <span className="font-mono text-zinc-200 break-all">{user.email}</span>.{' '}
                    {t.login.verifyEmailDescSuffix}
                  </p>
                  <p className="text-[11px] text-amber-300/90 mt-2 leading-relaxed">
                    {t.login.checkSpamHint}
                  </p>
                </div>
              </div>

              {(verificationNotice || formError || authError) && (
                <div className="text-xs text-amber-300 bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 leading-relaxed">
                  {verificationNotice || formError || authError}
                </div>
              )}

              <div className="space-y-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCheckVerified}
                  disabled={checkingVerify || submitting}
                  className="w-full"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingVerify ? 'animate-spin' : ''}`} />
                  {checkingVerify ? t.login.checkingStatus : t.login.iveVerified}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSendVerification}
                  disabled={resendingVerify || submitting}
                  className="w-full"
                >
                  <MailCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                  {verificationSent ? t.login.resendVerification : t.login.sendVerification}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={logout}
                  disabled={submitting}
                  className="w-full"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t.login.signOutSwitch}
                </Button>
              </div>

              <p className="text-[11px] text-zinc-500 text-center">
                {t.login.verificationAutoDetect}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-5">
              {/* Sign In / Create Account Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#09090b] border border-[#27272a] rounded-lg">
                <button
                  type="button"
                  onClick={() => switchAuthTab('login')}
                  className={`min-h-[36px] sm:min-h-0 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {t.login.signInTab}
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthTab('register')}
                  className={`min-h-[36px] sm:min-h-0 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#22c55e] text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {t.login.createAccountTab}
                </button>
              </div>

              {(formError || authError) && (
                <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-2.5 sm:p-3 text-xs text-red-300 leading-relaxed">
                  {formError || authError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3.5">
                {mode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-medium text-zinc-300 mb-1 sm:mb-1.5">
                        {t.login.yourName}
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={t.login.namePlaceholder}
                        className="w-full px-3 py-1.5 sm:py-2 min-h-[38px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-biz" className="block text-xs font-medium text-zinc-300 mb-1 sm:mb-1.5">
                        {t.login.businessName}
                      </label>
                      <input
                        id="reg-biz"
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={t.login.businessPlaceholder}
                        className="w-full px-3 py-1.5 sm:py-2 min-h-[38px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-300 mb-1 sm:mb-1.5">
                    {t.login.emailAddress}
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.login.emailPlaceholder}
                    className="w-full px-3 py-1.5 sm:py-2 min-h-[38px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-300 mb-1 sm:mb-1.5">
                    {t.login.password}
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === 'login'
                          ? t.login.passwordPlaceholderLogin
                          : t.login.passwordPlaceholderRegister
                      }
                      className="w-full pl-3 pr-11 py-1.5 sm:py-2 min-h-[38px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] inline-flex items-center justify-center text-zinc-500 hover:text-zinc-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label htmlFor="reg-confirm" className="block text-xs font-medium text-zinc-300 mb-1 sm:mb-1.5">
                      {t.login.confirmPassword}
                    </label>
                    <input
                      id="reg-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.login.reenterPassword}
                      className="w-full px-3 py-1.5 sm:py-2 min-h-[38px] sm:min-h-0 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-[#22c55e]"
                    />
                  </div>
                )}

                {mode === 'login' && (
                  <label className="flex items-center gap-2.5 min-h-[30px] sm:min-h-[36px] text-xs text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#27272a] bg-[#09090b] accent-[#22c55e]"
                    />
                    <span>{t.login.rememberSession}</span>
                  </label>
                )}

                <Button type="submit" disabled={submitting} className="w-full min-h-[40px] sm:min-h-[44px] py-2 sm:py-2.5">
                  {submitting
                    ? mode === 'login'
                      ? t.login.signingIn
                      : t.login.creatingWorkspace
                    : mode === 'login'
                    ? t.login.signInWithEmail
                    : t.login.createPrivateAccount}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 3. Architectural Highlights (Mobile: Bottom, after Login | Desktop: Left Bottom) */}
      <div className="relative z-10 lg:col-start-1 lg:row-start-2 px-4 pt-3 pb-6 sm:px-10 sm:pb-12 lg:px-14 lg:pt-0 lg:pb-14">
        <div className="border-t border-[#4ade80]/15 pt-4 sm:pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 max-w-xl">
          <div>
            <p className="text-xs font-medium text-[#86efac]">{t.login.highlight1Title}</p>
            <p className="lg:hidden text-xs text-zinc-400 mt-1 leading-relaxed">
              {t.login.subtitle}
            </p>
            <p className="hidden lg:block text-xs text-zinc-400 mt-1 leading-relaxed">
              {t.login.highlight1Desc}
            </p>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-[#86efac]">{t.login.highlight2Title}</p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {t.login.highlight2Desc}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#86efac]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
              <span>{t.login.highlight3Title}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {t.login.highlight3Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
