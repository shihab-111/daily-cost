import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  setPersistence,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth, googleOAuthClientId, googleProvider } from './client';

interface GisTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GisErrorCallbackPayload {
  type?: 'popup_failed_to_open' | 'popup_closed' | 'unknown' | string;
  message?: string;
}

interface GisTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleIdentityWindow extends Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          prompt?: string;
          ux_mode?: 'popup' | 'redirect';
          callback: (response: GisTokenResponse) => void;
          error_callback?: (error: GisErrorCallbackPayload) => void;
        }) => GisTokenClient;
      };
    };
  };
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export function preloadGoogleGis() {
  if (typeof document === 'undefined') return;
  const gWindow = window as GoogleIdentityWindow;
  if (gWindow.google?.accounts?.oauth2) return;
  if (document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)) return;
  const script = document.createElement('script');
  script.src = GIS_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

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

async function applyPostLoginPersistence(rememberMe: boolean) {
  if (!rememberMe) {
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch {
      // Ignore if sessionStorage is restricted
    }
  }
}

async function signInWithPopupFallback(rememberMe: boolean): Promise<UserCredential> {
  const credential = await signInWithPopup(
    auth,
    googleProvider,
    browserPopupRedirectResolver
  );
  await applyPostLoginPersistence(rememberMe);
  return credential;
}

export function signInWithUserGoogle(rememberMe = true): Promise<UserCredential> {
  const gWindow = typeof window !== 'undefined' ? (window as GoogleIdentityWindow) : null;
  const oauth2 = gWindow?.google?.accounts?.oauth2;

  // Primary path: Google Identity Services token client + signInWithCredential.
  // This bypasses Firebase's cross-origin /__/auth/handler page and avoids
  // "missing initial state / sessionStorage partitioned" errors in iframes & mobile browsers.
  if (oauth2 && googleOAuthClientId) {
    return new Promise<UserCredential>((resolve, reject) => {
      let settled = false;
      const finishReject = (err: unknown) => {
        if (settled) return;
        settled = true;
        reject(err);
      };

      try {
        const tokenClient = oauth2.initTokenClient({
          client_id: googleOAuthClientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
          callback: async (response) => {
            if (settled) return;

            if (response.access_token) {
              settled = true;
              try {
                const credential = GoogleAuthProvider.credential(
                  null,
                  response.access_token
                );
                const userCred = await signInWithCredential(auth, credential);
                await applyPostLoginPersistence(rememberMe);
                resolve(userCred);
              } catch (err) {
                reject(err);
              }
              return;
            }

            const errCode = response.error || '';
            if (errCode === 'access_denied') {
              finishReject(
                Object.assign(new Error('Google Sign-In was cancelled or denied.'), {
                  code: 'auth/popup-closed-by-user',
                })
              );
              return;
            }

            if (
              errCode === 'invalid_client' ||
              errCode === 'unauthorized_client' ||
              errCode === 'unsupported_response_type'
            ) {
              settled = true;
              signInWithPopupFallback(rememberMe).then(resolve).catch(reject);
              return;
            }

            finishReject(
              new Error(
                response.error_description || response.error || 'Google sign-in failed.'
              )
            );
          },
          error_callback: (err) => {
            if (settled) return;
            if (err?.type === 'popup_failed_to_open') {
              finishReject(
                Object.assign(new Error('Google sign-in popup was blocked by your browser.'), {
                  code: 'auth/popup-blocked',
                })
              );
              return;
            }
            if (err?.type === 'popup_closed') {
              finishReject(
                Object.assign(new Error('Google sign-in window closed before completing.'), {
                  code: 'auth/popup-closed-by-user',
                })
              );
              return;
            }
            finishReject(
              new Error(err?.message || 'Unable to complete Google sign-in.')
            );
          },
        });

        // Invoke synchronously inside the user tap gesture
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch {
        settled = true;
        signInWithPopupFallback(rememberMe).then(resolve).catch(reject);
      }
    });
  }

  return signInWithPopupFallback(rememberMe);
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
