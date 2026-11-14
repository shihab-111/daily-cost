import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from './client';

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
  displayName: string
) {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    // Fallback to default persistence
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 120) });
  }
  await sendEmailVerification(cred.user);
  return cred;
}

export async function signInWithUserGoogle(rememberMe = true) {
  // Execute signInWithPopup synchronously inside the user tap gesture with
  // browserPopupRedirectResolver so mobile/partitioned browsers retain opener state.
  const credential = await signInWithPopup(
    auth,
    googleProvider,
    browserPopupRedirectResolver
  );
  if (!rememberMe) {
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch {
      // Ignore if sessionStorage is restricted
    }
  }
  return credential;
}

export async function sendVerificationToUser(user: User) {
  return sendEmailVerification(user);
}

export async function signOutUser() {
  return signOut(auth);
}

export function isUserVerified(user: User): boolean {
  return Boolean(user.emailVerified);
}
