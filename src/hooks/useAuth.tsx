import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase/client';
import {
  isUserVerified,
  registerWithUserEmail,
  sendVerificationToUser,
  signInWithUserEmail,
  signInWithUserGoogle,
  signOutUser,
} from '../lib/firebase/auth';
import { dbService } from '../lib/firebase/db';

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
  ) => Promise<void>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
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
    defaults?: { businessName?: string; ownerName?: string }
  ) => {
    setVerifyingTenant(true);
    try {
      const verified = isUserVerified(nextUser);
      setIsAuthorized(verified);
      setDenialReason(verified ? null : 'unverified_email');
      if (verified) {
        await dbService.bootstrapWorkspace(nextUser, defaults);
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
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password). You can enable it there or use Google Sign-In below.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Choose a stronger password (at least 6 characters).';
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return 'Invalid email or password.';
    }
    return err instanceof Error ? err.message : fallback;
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
      const cred = await registerWithUserEmail(email, password, displayName);
      if (cred.user.emailVerified) {
        await dbService.bootstrapWorkspace(cred.user, {
          businessName,
          ownerName: displayName,
        });
      }
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
