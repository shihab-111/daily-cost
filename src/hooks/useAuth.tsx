import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase/client';
import {
  sendVerificationToUser,
  signInWithAdminEmail,
  signInWithAdminGoogle,
  signOutAdmin,
  verifyAdminAccess,
} from '../lib/firebase/auth';
import { dbService } from '../lib/firebase/db';

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  verifyingAdmin: boolean;
  isAuthorized: boolean;
  denialReason: 'unverified_email' | 'not_in_roster' | null;
  authError: string | null;
  loginWithEmail: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [denialReason, setDenialReason] = useState<'unverified_email' | 'not_in_roster' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthError(null);
      setDenialReason(null);

      if (!nextUser) {
        setIsAuthorized(false);
        setAuthLoading(false);
        setVerifyingAdmin(false);
        return;
      }

      setVerifyingAdmin(true);
      try {
        const result = await verifyAdminAccess(nextUser);
        setIsAuthorized(result.authorized);
        setDenialReason(result.reason || null);
        if (result.authorized) {
          await dbService.bootstrapWorkspace(nextUser);
        }
      } catch (err) {
        setIsAuthorized(false);
        setAuthError(
          err instanceof Error ? err.message : 'Unable to verify administrator privileges.'
        );
      } finally {
        setVerifyingAdmin(false);
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const loginWithEmail = async (email: string, password: string, rememberMe: boolean) => {
    setAuthError(null);
    try {
      await signInWithAdminEmail(email, password, rememberMe);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password). You can enable it there or use Google Admin Sign-In below.'
        );
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setAuthError('Invalid administrator email or password.');
      } else {
        setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
      }
      throw err;
    }
  };

  const loginWithGoogle = async (rememberMe = true) => {
    setAuthError(null);
    try {
      await signInWithAdminGoogle(rememberMe);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google sign-in was cancelled or blocked.'
      );
      throw err;
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    await sendVerificationToUser(auth.currentUser);
  };

  const logout = async () => {
    setAuthError(null);
    await signOutAdmin();
  };

  return (
    <AuthContext.Provider
      value={{
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
