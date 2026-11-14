import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
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

export async function signOutUser() {
  return signOut(auth);
}

export function isUserVerified(user: User): boolean {
  return Boolean(user.emailVerified);
}
