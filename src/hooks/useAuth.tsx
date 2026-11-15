import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { UserProfileData } from '../types';
import { auth } from '../lib/firebase/client';
import {
  changeUserPassword,
  hasPasswordProvider,
  isUserVerified,
  registerWithUserEmail,
  sendVerificationToUser,
  signInWithUserEmail,
  signOutUser,
  updateUserAuthProfile,
} from '../lib/firebase/auth';
import { dbService } from '../lib/firebase/db';
import { processAvatarImage } from '../lib/firebase/storage';

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
  userProfile: UserProfileData | null;
  profileDisplayName: string;
  profilePhotoUrl: string;
  canChangePassword: boolean;
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
  updateMyProfile: (input: {
    displayName: string;
    photoFile?: File | null;
    photoUrl?: string;
  }) => Promise<void>;
  changeMyPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [, setProfileRevision] = useState(0);
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
        setUserProfile(null);
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

  useEffect(() => {
    if (!user || !isAuthorized) {
      setUserProfile(null);
      return;
    }
    const unsub = dbService.subscribeUserProfile(
      user,
      (profile) => setUserProfile(profile),
      () => {
        // Non-fatal fallback to Firebase Auth fields
      }
    );
    return () => unsub();
  }, [user, isAuthorized]);

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

  const updateMyProfile = useCallback(
    async (input: { displayName: string; photoFile?: File | null; photoUrl?: string }) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be signed in to update your profile.');
      }
      const cleanName = input.displayName.trim().slice(0, 120);
      if (!cleanName) {
        throw new Error('Your name is required.');
      }

      let resolvedPhotoUrl =
        input.photoUrl !== undefined ? input.photoUrl : userProfile?.photoUrl ?? currentUser.photoURL ?? '';

      if (input.photoFile) {
        resolvedPhotoUrl = await processAvatarImage(input.photoFile);
      }

      resolvedPhotoUrl = (resolvedPhotoUrl || '').slice(0, 80000);

      await dbService.saveUserProfile(
        currentUser,
        { displayName: cleanName, photoUrl: resolvedPhotoUrl },
        Boolean(userProfile)
      );

      setUserProfile((prev) => ({
        id: currentUser.uid,
        userId: currentUser.uid,
        displayName: cleanName,
        photoUrl: resolvedPhotoUrl,
        createdAt: prev?.createdAt,
        updatedAt: prev?.updatedAt,
      }));

      try {
        await updateUserAuthProfile(currentUser, {
          displayName: cleanName,
          photoURL: resolvedPhotoUrl,
        });
      } catch {
        // Non-fatal offline or URL length fallback; Firestore profile remains authoritative
      }

      setProfileRevision((prev) => prev + 1);
    },
    [userProfile]
  );

  const changeMyPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be signed in to change your password.');
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error(
          language === 'bn'
            ? 'পাসওয়ার্ড পরিবর্তন করতে ইন্টারনেট সংযোগ প্রয়োজন।'
            : 'An internet connection is required to change your password.'
        );
      }
      try {
        await changeUserPassword(currentUser, currentPassword, newPassword);
      } catch (err) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          throw new Error(
            language === 'bn' ? 'বর্তমান পাসওয়ার্ড সঠিক নয়।' : 'Current password is incorrect.'
          );
        }
        if (code === 'auth/requires-recent-login') {
          throw new Error(
            language === 'bn'
              ? 'নিরাপত্তার জন্য আবার সাইন ইন করে পাসওয়ার্ড পরিবর্তন করুন।'
              : 'For security, please sign out and sign in again before changing your password.'
          );
        }
        if (code === 'auth/weak-password') {
          throw new Error(t.authErrors.weakPassword);
        }
        if (code === 'auth/too-many-requests') {
          throw new Error(t.authErrors.tooManyRequests);
        }
        throw new Error(mapAuthError(err, 'Unable to update password.'));
      }
    },
    [language, mapAuthError, t.authErrors.tooManyRequests, t.authErrors.weakPassword]
  );

  const logout = useCallback(async () => {
    const currentUid = auth.currentUser?.uid;
    setAuthError(null);
    setVerificationSent(false);
    setVerificationNotice(null);
    setIsAdmin(false);
    setUserProfile(null);
    dbService.clearSessionLoginMarker(currentUid);
    await signOutUser();
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const profileDisplayName =
    userProfile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split('@')[0]?.trim() ||
    t.nav.workspaceOwner;

  const profilePhotoUrl = userProfile?.photoUrl ?? user?.photoURL ?? '';
  const canChangePassword = hasPasswordProvider(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        profileDisplayName,
        profilePhotoUrl,
        canChangePassword,
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
        updateMyProfile,
        changeMyPassword,
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
