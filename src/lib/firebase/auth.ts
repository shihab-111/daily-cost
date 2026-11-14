import {
  browserLocalPersistence,
  browserSessionPersistence,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  ROOT_ADMIN_EMAIL,
} from './client';
import { AdminUser } from '../../types';

export async function signInWithAdminEmail(
  email: string,
  password: string,
  rememberMe: boolean
) {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signInWithAdminGoogle(rememberMe = true) {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );
  return signInWithPopup(auth, googleProvider);
}

export async function sendVerificationToUser(user: User) {
  return sendEmailVerification(user);
}

export async function signOutAdmin() {
  return signOut(auth);
}

export async function verifyAdminAccess(user: User): Promise<{
  authorized: boolean;
  reason?: 'unverified_email' | 'not_in_roster';
}> {
  if (!user.emailVerified) {
    return { authorized: false, reason: 'unverified_email' };
  }

  if (user.email === ROOT_ADMIN_EMAIL) {
    return { authorized: true };
  }

  const adminPath = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    if (!snap.exists()) {
      return { authorized: false, reason: 'not_in_roster' };
    }
    const data = snap.data() as Partial<AdminUser>;
    if (data.active !== true) {
      return { authorized: false, reason: 'not_in_roster' };
    }
    return { authorized: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('Missing or insufficient permissions') ||
      msg.includes('permission-denied')
    ) {
      return { authorized: false, reason: 'not_in_roster' };
    }
    handleFirestoreError(error, OperationType.GET, adminPath);
  }
}
