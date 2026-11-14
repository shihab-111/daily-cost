import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase/client';
import {
  isUserVerified,
  registerWithUserEmail,
  sendVerificationToUser,
  signInWithGoogleIdToken,
  signInWithUserEmail,
  signInWithUserGoogle,
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

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  verifyingTenant: boolean;
  isAuthorized: boolean;
  denialReason: 'unverified_email' | null;
  authError: string | null;
  loginWithEmail: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName: string,
    businessName: string
  ) => Promise<{ verificationSent: boolean; verificationError?: string }>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  loginWithGoogleIdToken: (idToken: string, rememberMe?: boolean) => Promise<void>;
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

  const hydrateTenant = async (
    nextUser: User,
    defaults?: PendingProfileDefaults
  ) => {
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
      }
    } catch (err) {
      setIsAuthorized(false);
      setAuthError(
        err instanceof Error ? err.message : 'Unable to initialize your private workspace.'
      );
    } finally {
      setVerifyingTenant(false);
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthError(null);
      setDenialReason(null);

      if (!nextUser) {
        setIsAuthorized(false);
        setAuthLoading(false);
        setVerifyingTenant(false);
        return;
      }

      await hydrateTenant(nextUser);
    });

    return () => unsub();
  }, []);

  const mapAuthError = (err: unknown, fallback: string): string => {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : '';
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password). You can enable it there or use Google Sign-In below.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Please sign in instead.';
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
    if (code === 'auth/popup-blocked') {
      return 'Google sign-in popup was blocked by your browser. Please allow popups or open EkTally directly in Chrome/Safari in a full browser tab.';
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'Google sign-in window closed before completing. Please try again or open EkTally in a full browser tab.';
    }
    if (
      code === 'auth/web-storage-unsupported' ||
      msg.toLowerCase().includes('sessionstorage') ||
      msg.toLowerCase().includes('initial state')
    ) {
      return 'Your current browser window is blocking or partitioning sessionStorage (common in in-app browsers or embedded previews). Open EkTally directly in Chrome or Safari, or use Email & Password sign-in.';
    }
    return msg || fallback;
  };

  const loginWithEmail = async (email: string, password: string, rememberMe: boolean) => {
    setAuthError(null);
    try {
      await signInWithUserEmail(email, password, rememberMe);
    } catch (err) {
      setAuthError(mapAuthError(err, 'Sign-in failed.'));
      throw err;
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    businessName: string
  ) => {
    setAuthError(null);
    try {
      const { cred, verificationSent, verificationError } = await registerWithUserEmail(
        email,
        password,
        displayName
      );
      savePendingProfile(cred.user.uid, {
        businessName,
        ownerName: displayName,
      });
      if (cred.user.emailVerified) {
        await dbService.bootstrapWorkspace(cred.user, {
          businessName,
          ownerName: displayName,
        });
      }
      return { verificationSent, verificationError };
    } catch (err) {
      setAuthError(mapAuthError(err, 'Account registration failed.'));
      throw err;
    }
  };

  const loginWithGoogle = async (rememberMe = true) => {
    setAuthError(null);
    try {
      await signInWithUserGoogle(rememberMe);
    } catch (err) {
      setAuthError(mapAuthError(err, 'Google sign-in was cancelled or blocked.'));
      throw err;
    }
  };

  const loginWithGoogleIdToken = async (idToken: string, rememberMe = true) => {
    setAuthError(null);
    try {
      await signInWithGoogleIdToken(idToken, rememberMe);
    } catch (err) {
      setAuthError(mapAuthError(err, 'Google sign-in failed. Please try again.'));
      throw err;
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    await sendVerificationToUser(auth.currentUser);
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const updated = auth.currentUser;
    setUser(updated);
    if (updated.emailVerified) {
      await updated.getIdToken(true);
      await hydrateTenant(updated);
      return true;
    }
    return false;
  };

  const logout = async () => {
    setAuthError(null);
    await signOutUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        verifyingTenant,
        isAuthorized,
        denialReason,
        authError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithGoogleIdToken,
        resendVerification,
        refreshVerificationStatus,
        logout,
        clearError: () => setAuthError(null),
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
