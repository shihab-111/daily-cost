import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth } from './client';

export async function signInWithUserEmail(
  email: string,
  password: string,
  rememberMe: boolean
) {
  try {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
  } catch {
    // Fallback to default persistence in storage-restricted contexts
  }
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerWithUserEmail(
  email: string,
  password: string,
  displayName: string,
  onCreated?: (uid: string) => void
): Promise<{
  cred: UserCredential;
  verificationSent: boolean;
  verificationError?: string;
}> {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    // Fallback to default persistence
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  onCreated?.(cred.user.uid);

  if (displayName.trim()) {
    try {
      await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 120) });
    } catch {
      // Non-fatal if profile display name update fails
    }
  }

  let verificationSent = false;
  let verificationError: string | undefined;
  try {
    await sendVerificationToUser(cred.user);
    verificationSent = true;
  } catch (err) {
    verificationError =
      err instanceof Error ? err.message : 'Unable to send verification email automatically.';
  }

  return { cred, verificationSent, verificationError };
}

export async function sendVerificationToUser(user: User) {
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
      });
      return;
    } catch {
      // Fallback without continue URL if origin is not allowlisted for email action links
    }
  }
  return sendEmailVerification(user);
}

export async function updateUserAuthProfile(
  user: User,
  updates: { displayName?: string; photoURL?: string }
): Promise<void> {
  const payload: { displayName?: string; photoURL?: string | null } = {};
  if (typeof updates.displayName === 'string' && updates.displayName.trim()) {
    payload.displayName = updates.displayName.trim().slice(0, 120);
  }
  if (updates.photoURL !== undefined) {
    // Firebase Auth photoURL only supports short URLs (< ~2048 chars), not large data URLs.
    if (updates.photoURL === '') {
      payload.photoURL = '';
    } else if (
      updates.photoURL.startsWith('https://') &&
      updates.photoURL.length <= 1900
    ) {
      payload.photoURL = updates.photoURL;
    }
  }
  if (Object.keys(payload).length === 0) return;
  await updateProfile(user, payload as { displayName?: string | null; photoURL?: string | null });
}

export function hasPasswordProvider(user: User | null): boolean {
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === 'password');
}

export async function changeUserPassword(
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (!user.email) {
    throw new Error('No email address is associated with this account.');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function sendUserPasswordResetEmail(email: string): Promise<void> {
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    throw new Error('Please enter your email address.');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      await sendPasswordResetEmail(auth, cleanEmail, {
        url: `${window.location.origin}/login`,
      });
      return;
    } catch {
      // Fallback without continue URL if origin is not allowlisted for email action links
    }
  }
  await sendPasswordResetEmail(auth, cleanEmail);
}

export async function signOutUser() {
  return signOut(auth);
}

export function isUserVerified(user: User): boolean {
  return Boolean(user.emailVerified);
}
