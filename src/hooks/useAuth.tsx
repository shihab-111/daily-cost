import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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

function formatReadableError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err || '');
  if (msg.startsWith('{')) {
    try {
      const parsed = JSON.parse(msg) as { error?: string };
      if (parsed?.error) {
        if (parsed.error.toLowerCase().includes('permission')) {
          return 'Database permission denied while preparing your workspace. Please sign out and sign in again with a verified account.';
        }
        return parsed.error;
      }
    } catch {
      // fall through
    }
  }
  return msg || fallback;
}

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  verifyingTenant: boolean;
  isAuthorized: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [verifyingTenant, setVerifyingTenant] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [denialReason, setDenialReason] = useState<'unverified_email' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  const hydrateTenant = useCallback(
    async (nextUser: User, defaults?: PendingProfileDefaults) => {
      setVerifyingTenant(true);
      try {
        const verified = isUserVerified(nextUser);
        setIsAuthorized(verified);
        setDenialReason(verified ? null : 'unverified_email');
        if (verified) {
          const resolvedDefaults = defaults || consumePendingProfile(nextUser.uid);
          try {
            await dbService.bootstrapWorkspace(nextUser, resolvedDefaults);
          } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            if (msg.toLowerCase().includes('permission')) {
              await nextUser.getIdToken(true);
              await dbService.bootstrapWorkspace(nextUser, resolvedDefaults);
            } else {
              throw err;
            }
          }
          setAuthError(null);
        }
      } catch (err) {
        setIsAuthorized(false);
        setAuthError(formatReadableError(err, 'Unable to initialize your private workspace.'));
      } finally {
        setVerifyingTenant(false);
        setAuthLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setDenialReason(null);

      if (!nextUser) {
        setIsAuthorized(false);
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

  const mapAuthError = useCallback((err: unknown, fallback: string): string => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not enabled in Firebase Console (Authentication → Sign-in method → Email/Password).';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Please switch to Sign In instead.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/weak-password') {
      return 'Choose a stronger password (at least 6 characters).';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts right now. Please wait a minute and try again.';
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return 'Invalid email or password.';
    }
    return formatReadableError(err, fallback);
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      setAuthError(null);
      try {
        await signInWithUserEmail(email, password, rememberMe);
      } catch (err) {
        setAuthError(mapAuthError(err, 'Sign-in failed.'));
        throw err;
      }
    },
    [mapAuthError]
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
        setAuthError(mapAuthError(err, 'Account registration failed.'));
        throw err;
      }
    },
    [hydrateTenant, mapAuthError]
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
    setAuthError(null);
    setVerificationSent(false);
    setVerificationNotice(null);
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
