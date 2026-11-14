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

interface GisCredentialResponse {
  credential?: string;
  select_by?: string;
}

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
      id?: {
        initialize: (config: {
          client_id: string;
          callback: (response: GisCredentialResponse) => void;
          ux_mode?: 'popup' | 'redirect';
          use_fedcm_for_button?: boolean;
          auto_select?: boolean;
          context?: 'signin' | 'signup' | 'use';
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            type?: 'standard' | 'icon';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment?: 'left' | 'center';
            width?: number;
            locale?: string;
          }
        ) => void;
        cancel?: () => void;
      };
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

let gisInitialized = false;
let latestGisCredentialHandler: ((idToken: string) => void) | null = null;

export function preloadGoogleGis() {
  if (typeof document === 'undefined') return;
  const gWindow = window as GoogleIdentityWindow;
  if (gWindow.google?.accounts?.id || gWindow.google?.accounts?.oauth2) return;
  if (document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`)) return;
  const script = document.createElement('script');
  script.src = GIS_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function waitForGoogleGis(timeoutMs = 5000): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  const gWindow = window as GoogleIdentityWindow;
  if (gWindow.google?.accounts?.id) {
    return Promise.resolve(true);
  }

  preloadGoogleGis();

  return new Promise<boolean>((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (gWindow.google?.accounts?.id) {
        window.clearInterval(timer);
        resolve(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer);
        resolve(false);
      }
    }, 100);
  });
}

export function renderGoogleIdButton(
  container: HTMLElement,
  options: {
    width: number;
    locale: string;
    isEmbeddedIframe: boolean;
    onCredential: (idToken: string) => void;
  }
): boolean {
  if (typeof window === 'undefined' || !googleOAuthClientId) return false;
  const gWindow = window as GoogleIdentityWindow;
  const googleId = gWindow.google?.accounts?.id;
  if (!googleId) return false;

  latestGisCredentialHandler = options.onCredential;

  try {
    if (!gisInitialized) {
      googleId.initialize({
        client_id: googleOAuthClientId,
        ux_mode: 'popup',
        use_fedcm_for_button: !options.isEmbeddedIframe,
        context: 'use',
        callback: (response) => {
          if (response.credential && latestGisCredentialHandler) {
            latestGisCredentialHandler(response.credential);
          }
        },
      });
      gisInitialized = true;
    }

    container.innerHTML = '';
    googleId.renderButton(container, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: Math.min(400, Math.max(220, Math.round(options.width))),
      locale: options.locale,
    });
    return true;
  } catch {
    return false;
  }
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

async function applyPostLoginPersistence(rememberMe: boolean) {
  if (!rememberMe) {
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch {
      // Ignore if sessionStorage is restricted
    }
  }
}

export async function signInWithGoogleCredentials(
  tokens: { idToken?: string; accessToken?: string },
  rememberMe = true
): Promise<UserCredential> {
  const credential = GoogleAuthProvider.credential(
    tokens.idToken || null,
    tokens.accessToken || null
  );
  const userCred = await signInWithCredential(auth, credential);
  await applyPostLoginPersistence(rememberMe);
  return userCred;
}

export async function signInWithGoogleIdToken(
  idToken: string,
  rememberMe = true
): Promise<UserCredential> {
  return signInWithGoogleCredentials({ idToken }, rememberMe);
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

export async function obtainGoogleCredentialsForBridge(): Promise<{
  idToken?: string;
  accessToken?: string;
}> {
  const gWindow = typeof window !== 'undefined' ? (window as GoogleIdentityWindow) : null;
  const oauth2 = gWindow?.google?.accounts?.oauth2;

  if (oauth2 && googleOAuthClientId) {
    return new Promise((resolve, reject) => {
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
              resolve({ accessToken: response.access_token });
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
              signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
                .then((userCred) => {
                  const cred = GoogleAuthProvider.credentialFromResult(userCred);
                  resolve({
                    idToken: cred?.idToken ?? undefined,
                    accessToken: cred?.accessToken ?? undefined,
                  });
                })
                .catch(reject);
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
            finishReject(new Error(err?.message || 'Unable to complete Google sign-in.'));
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch {
        settled = true;
        signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
          .then((userCred) => {
            const cred = GoogleAuthProvider.credentialFromResult(userCred);
            resolve({
              idToken: cred?.idToken ?? undefined,
              accessToken: cred?.accessToken ?? undefined,
            });
          })
          .catch(reject);
      }
    });
  }

  const userCred = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
  const cred = GoogleAuthProvider.credentialFromResult(userCred);
  return {
    idToken: cred?.idToken ?? undefined,
    accessToken: cred?.accessToken ?? undefined,
  };
}

export function signInWithUserGoogle(rememberMe = true): Promise<UserCredential> {
  const gWindow = typeof window !== 'undefined' ? (window as GoogleIdentityWindow) : null;
  const oauth2 = gWindow?.google?.accounts?.oauth2;

  // Use GIS OAuth2 token client on click when available, with Firebase popup fallback
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
                const userCred = await signInWithGoogleCredentials(
                  { accessToken: response.access_token },
                  rememberMe
                );
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
