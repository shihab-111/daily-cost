import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { auth } from '../lib/firebase/client';
import {
  isUserVerified,
  registerWithUserEmail,
  sendVerificationToUser,
  signInWithUserEmail,
  signOutUser,
} from '../lib/firebase/auth';
import { dbService } from '../lib/firebase/db';

const PENDING_PROFILE_PREFIX = 'ektally_pending_profile_';

interface PendingProfileDefaults {
  businessName?: string;
  ownerName?: string;
}

function savePendingProfile(uid: string, defaults: PendingProfileDefaults) {
  try {
    window.localStorage.setItem(`${PENDING_PROFILE_PREFIX}${uid}`, JSON.stringify(defaults));
  } catch {
    // ignore storage errors
  }
}

function consumePendingProfile(uid: string): PendingProfileDefaults | undefined {
  try {
    const raw = window.localStorage.getItem(`${PENDING_PROFILE_PREFIX}${uid}`);
    if (!raw) return undefined;
    window.localStorage.removeItem(`${PENDING_PROFILE_PREFIX}${uid}`);
    return JSON.parse(raw) as PendingProfileDefaults;
  } catch {
    return undefined;
  }
}

function formatReadableError(err: unknown, fallback: string, permissionMsg: string): string {
  const msg = err instanceof Error ? err.message : String(err || '');
  if (msg.startsWith('{')) {
    try {
      const parsed = JSON.parse(msg) as { error?: string };
      if (parsed?.error) {
        if (parsed.error.toLowerCase().includes('permission')) {
          return permissionMsg;
        }
        return parsed.error;
      }
    } catch {
      // fall through
    }
  }
  return msg || fallback;
}

function isNetworkOrOfflineError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  const code = ((err as { code?: string })?.code || '').toLowerCase();
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  return (
    code.includes('unavailable') ||
    code.includes('network') ||
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('network') ||
    msg.includes('failed to get document')
  );
}

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  verifyingTenant: boolean;
  isAuthorized: boolean;
  isAdmin: boolean;
  denialReason: 'unverified_email' | null;
  authError: string | null;
  verificationSent: boolean;
  verificationNotice: string | null;
  setVerificationNotice: (notice: string | null) => void;
  loginWithEmail: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName: string,
    businessName: string
  ) => Promise<{ verificationSent: boolean; verificationError?: string }>;
  resendVerification: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [verifyingTenant, setVerifyingTenant] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [denialReason, setDenialReason] = useState<'unverified_email' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const pendingOnlineSyncRef = useRef<{
    user: User;
    defaults?: PendingProfileDefaults;
  } | null>(null);

  const hydrateTenant = useCallback(
    async (nextUser: User, defaults?: PendingProfileDefaults) => {
      setVerifyingTenant(true);
      try {
        const wasVerified = isUserVerified(nextUser);
        const isOnline = typeof navigator === 'undefined' || navigator.onLine;
        if (!wasVerified && isOnline) {
          try {
            await nextUser.reload();
          } catch {
            // Ignore transient reload failures
          }
        }
        const verified = isUserVerified(nextUser);
        setIsAuthorized(verified);
        setDenialReason(verified ? null : 'unverified_email');
        if (verified) {
          const resolvedDefaults = defaults || consumePendingProfile(nextUser.uid);

          if (!isOnline) {
            pendingOnlineSyncRef.current = { user: nextUser, defaults: resolvedDefaults };
            const adminStatus = await dbService.checkIsAdmin(nextUser).catch(() => false);
            setIsAdmin(adminStatus);
            setAuthError(null);
            return;
          }

          if (!wasVerified) {
            await nextUser.getIdToken(true);
          }

          try {
            await dbService.bootstrapWorkspace(nextUser, resolvedDefaults);
            pendingOnlineSyncRef.current = null;
          } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            if (msg.toLowerCase().includes('permission')) {
              await nextUser.getIdToken(true);
              await dbService.bootstrapWorkspace(nextUser, resolvedDefaults);
              pendingOnlineSyncRef.current = null;
            } else if (isNetworkOrOfflineError(err)) {
              pendingOnlineSyncRef.current = { user: nextUser, defaults: resolvedDefaults };
            } else {
              throw err;
            }
          }

          const adminStatus = await dbService.checkIsAdmin(nextUser).catch(() => false);
          if (!pendingOnlineSyncRef.current) {
            void dbService.recordUserLogin(nextUser, resolvedDefaults).catch(() => undefined);
          }
          setIsAdmin(adminStatus);
          setAuthError(null);
        } else {
          pendingOnlineSyncRef.current = null;
          setIsAdmin(false);
        }
      } catch (err) {
        if (isNetworkOrOfflineError(err) && isUserVerified(nextUser)) {
          pendingOnlineSyncRef.current = { user: nextUser, defaults };
          const adminStatus = await dbService.checkIsAdmin(nextUser).catch(() => false);
          setIsAuthorized(true);
          setIsAdmin(adminStatus);
          setDenialReason(null);
          setAuthError(null);
        } else {
          setIsAuthorized(false);
          setIsAdmin(false);
          setAuthError(
            formatReadableError(err, t.authErrors.initFailed, t.authErrors.permissionDenied)
          );
        }
      } finally {
        setVerifyingTenant(false);
        setAuthLoading(false);
      }
    },
    [t.authErrors.initFailed, t.authErrors.permissionDenied]
  );

  useEffect(() => {
    const handleOnline = () => {
      const pending = pendingOnlineSyncRef.current;
      if (!pending || auth.currentUser?.uid !== pending.user.uid) return;

      void (async () => {
        try {
          await dbService.bootstrapWorkspace(pending.user, pending.defaults);
          pendingOnlineSyncRef.current = null;
          const adminStatus = await dbService.checkIsAdmin(pending.user).catch(() => false);
          setIsAdmin(adminStatus);
          void dbService.recordUserLogin(pending.user, pending.defaults).catch(() => undefined);
        } catch {
          // Keep pending for next online retry
        }
      })();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setDenialReason(null);

      if (!nextUser) {
        pendingOnlineSyncRef.current = null;
        setIsAuthorized(false);
        setIsAdmin(false);
        setAuthLoading(false);
        setVerifyingTenant(false);
        setVerificationSent(false);
        setVerificationNotice(null);
        return;
      }

      await hydrateTenant(nextUser);
    });

    return () => unsub();
  }, [hydrateTenant]);

  const mapAuthError = useCallback(
    (err: unknown, fallback: string): string => {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        return t.authErrors.operationNotAllowed;
      }
      if (code === 'auth/email-already-in-use') {
        return t.authErrors.emailInUse;
      }
      if (code === 'auth/invalid-email') {
        return t.authErrors.invalidEmail;
      }
      if (code === 'auth/weak-password') {
        return t.authErrors.weakPassword;
      }
      if (code === 'auth/too-many-requests') {
        return t.authErrors.tooManyRequests;
      }
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        return t.authErrors.invalidCredential;
      }
      if (
        code === 'auth/network-request-failed' ||
        (typeof navigator !== 'undefined' && !navigator.onLine)
      ) {
        return language === 'bn'
          ? 'প্রথমবার লগইন বা অ্যাকাউন্ট তৈরি করতে ইন্টারনেট সংযোগ প্রয়োজন। একবার লগইন করার পর অফলাইনেও অ্যাপ ব্যবহার করা যাবে।'
          : 'An internet connection is required for initial sign-in or registration. Once signed in, EkTally works offline.';
      }
      return formatReadableError(err, fallback, t.authErrors.permissionDenied);
    },
    [language, t.authErrors]
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      setAuthError(null);
      dbService.markFreshLoginAttempt();
      try {
        await signInWithUserEmail(email, password, rememberMe);
      } catch (err) {
        dbService.clearSessionLoginMarker();
        setAuthError(mapAuthError(err, t.authErrors.signInFailed));
        throw err;
      }
    },
    [mapAuthError, t.authErrors.signInFailed]
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName: string, businessName: string) => {
      setAuthError(null);
      setVerificationSent(false);
      setVerificationNotice(null);
      try {
        const { cred, verificationSent: sent, verificationError } = await registerWithUserEmail(
          email,
          password,
          displayName,
          (uid) => {
            savePendingProfile(uid, {
              businessName,
              ownerName: displayName,
            });
          }
        );
        setVerificationSent(sent);
        if (verificationError) {
          setVerificationNotice(verificationError);
        }
        if (cred.user.emailVerified) {
          await hydrateTenant(cred.user, {
            businessName,
            ownerName: displayName,
          });
        }
        return { verificationSent: sent, verificationError };
      } catch (err) {
        setAuthError(mapAuthError(err, t.authErrors.registerFailed));
        throw err;
      }
    },
    [hydrateTenant, mapAuthError, t.authErrors.registerFailed]
  );

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) return;
    await sendVerificationToUser(auth.currentUser);
    setVerificationSent(true);
  }, []);

  const refreshVerificationStatus = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const updated = auth.currentUser;
    if (updated.emailVerified) {
      await updated.getIdToken(true);
      await hydrateTenant(updated);
      return true;
    }
    return false;
  }, [hydrateTenant]);

  const logout = useCallback(async () => {
    const currentUid = auth.currentUser?.uid;
    setAuthError(null);
    setVerificationSent(false);
    setVerificationNotice(null);
    setIsAdmin(false);
    dbService.clearSessionLoginMarker(currentUid);
    await signOutUser();
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        verifyingTenant,
        isAuthorized,
        isAdmin,
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
