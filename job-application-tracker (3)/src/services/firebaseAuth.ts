import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.setCustomParameters({
  prompt: 'consent',
});

// Cache the access token in memory
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignInForGmail = async (): Promise<{ user: User; accessToken: string; email: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Gmail OAuth access token from authorization popup.');
    }

    cachedAccessToken = credential.accessToken;
    const userEmail = result.user.email || '';
    return { user: result.user, accessToken: cachedAccessToken, email: userEmail };
  } catch (error: any) {
    console.error('Google Sign in for Gmail error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const FALLBACK_OAUTH_CLIENT_ID = '437357842459-1cq2jcpibp4rcpjovho0qt3e0k0s1mrs.apps.googleusercontent.com';

export const getEffectiveOAuthClientId = (): string => {
  return (firebaseConfig as any).oAuthClientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || FALLBACK_OAUTH_CLIENT_ID;
};

export const logoutGmail = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    console.warn('Sign out error:', e);
  }
  cachedAccessToken = null;
};
