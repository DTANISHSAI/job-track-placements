import firebaseConfig from '../../firebase-applet-config.json';
import { logoutGmail } from './firebaseAuth';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: any; error_description?: string }) => void;
            prompt?: string;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export interface RawGmailMessage {
  messageId: string;
  threadId?: string;
  subject: string;
  from: string;
  to?: string;
  receivedDate: string;
  snippet: string;
  bodyText?: string;
}

const GMAIL_TOKEN_KEY = 'jobtracker_gmail_access_token';
const GMAIL_USER_EMAIL_KEY = 'jobtracker_gmail_user_email';

export function getStoredGmailToken(): string | null {
  return localStorage.getItem(GMAIL_TOKEN_KEY);
}

export function setStoredGmailToken(token: string, email?: string) {
  localStorage.setItem(GMAIL_TOKEN_KEY, token);
  if (email) {
    localStorage.setItem(GMAIL_USER_EMAIL_KEY, email);
  }
}

export function clearStoredGmailToken() {
  localStorage.removeItem(GMAIL_TOKEN_KEY);
  localStorage.removeItem(GMAIL_USER_EMAIL_KEY);
  logoutGmail().catch(() => {});
}

export function getStoredGmailEmail(): string | null {
  return localStorage.getItem(GMAIL_USER_EMAIL_KEY);
}

export const FALLBACK_OAUTH_CLIENT_ID = '437357842459-1cq2jcpibp4rcpjovho0qt3e0k0s1mrs.apps.googleusercontent.com';

export function getEffectiveOAuthClientId(clientId?: string): string {
  return (
    clientId ||
    (firebaseConfig as any).oAuthClientId ||
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    FALLBACK_OAUTH_CLIENT_ID
  );
}

/**
 * Request Google OAuth token client-side for Gmail Readonly scope using Google Identity Services (GIS)
 */
export async function requestGmailAccessToken(clientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services SDK is not loaded. Please ensure you are online and refresh the page.'));
    }

    const effectiveClientId = getEffectiveOAuthClientId(clientId);

    if (!effectiveClientId) {
      return reject(new Error('OAuth Client ID is missing. Please verify project configuration.'));
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        // Request explicit Gmail Readonly and userinfo email scopes
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
        callback: (resp) => {
          if (resp.error) {
            const errDesc = resp.error_description || resp.error?.message || resp.error;
            if (resp.error === 'access_denied') {
              return reject(new Error('Google Access Denied: In testing mode, only authorized Google Cloud test accounts can connect their real Gmail. You can add test accounts in GCP Console or click "Demo Samples" to test all features.'));
            }
            return reject(new Error(errDesc || 'Google Authentication failed.'));
          }
          if (resp.access_token) {
            setStoredGmailToken(resp.access_token);
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token received from Google authorization.'));
          }
        },
      });

      // Force prompt to ensure the user approves the Gmail read permissions checkbox
      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Fetch User Profile (Email) from Google
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<{ email: string; name?: string }> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch user info: ${res.status}`);
    }
    const data = await res.json();
    if (data.email) {
      setStoredGmailToken(accessToken, data.email);
    }
    return {
      email: data.email || 'Connected Google User',
      name: data.name,
    };
  } catch (err) {
    const stored = getStoredGmailEmail();
    return { email: stored || 'Connected Google User' };
  }
}

/**
 * Fetch candidate recruitment emails from Gmail API
 */
export async function fetchJobEmailsFromGmail(
  accessToken: string,
  maxResults: number = 20
): Promise<RawGmailMessage[]> {
  // Query targeting job application confirmations, interviews, assessments, rejections, offers from top platforms & portals
  const query = 'subject:(application OR applied OR interview OR assessment OR offer OR rejection OR shortlisted OR candidacy OR recruiter OR "next steps" OR OA) OR from:(linkedin.com OR indeed.com OR naukri.com OR glassdoor.com OR greenhouse.io OR lever.co OR myworkdayjobs.com OR smartrecruiters.com OR ashbyhq.com OR taleo.net)';

  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

  const listRes = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!listRes.ok) {
    const errBody = await listRes.json().catch(() => null);
    const googleErrMsg = errBody?.error?.message || `HTTP ${listRes.status}`;

    if (listRes.status === 401 || listRes.status === 403) {
      clearStoredGmailToken();
      
      if (googleErrMsg.toLowerCase().includes('scope') || googleErrMsg.toLowerCase().includes('permission')) {
        throw new Error('Gmail permission was not granted or expired. Please click "Connect Gmail" again and check the permissions box.');
      }
      
      throw new Error(`Gmail API Authorization error (${listRes.status}): ${googleErrMsg}`);
    }
    throw new Error(`Failed to fetch messages list from Gmail (${listRes.status}): ${googleErrMsg}`);
  }

  const listData = await listRes.json();
  const messages = listData.messages || [];

  if (messages.length === 0) {
    return [];
  }

  // Fetch full details for the retrieved messages in parallel (capped at maxResults)
  const detailPromises = messages.slice(0, maxResults).map(async (msgItem: { id: string; threadId: string }) => {
    try {
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgItem.id}?format=full`;
      const msgRes = await fetch(msgUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!msgRes.ok) return null;
      const fullMsg = await msgRes.json();

      // Extract headers
      const headers = fullMsg.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject') || '(No Subject)';
      const from = getHeader('From') || 'Unknown Sender';
      const to = getHeader('To') || '';
      const dateHeader = getHeader('Date');
      const receivedDate = dateHeader ? new Date(dateHeader).toISOString() : new Date(parseInt(fullMsg.internalDate || Date.now().toString())).toISOString();
      const snippet = fullMsg.snippet || '';

      // Extract text content recursively
      const bodyText = extractBodyText(fullMsg.payload);

      return {
        messageId: fullMsg.id,
        threadId: fullMsg.threadId,
        subject,
        from,
        to,
        receivedDate,
        snippet,
        bodyText: bodyText || snippet,
      } as RawGmailMessage;
    } catch (err) {
      console.warn(`[Gmail Fetch] Failed parsing message ${msgItem.id}:`, err);
      return null;
    }
  });

  const results = await Promise.all(detailPromises);
  return results.filter((m): m is RawGmailMessage => m !== null);
}

function extractBodyText(payload: any): string {
  if (!payload) return '';

  if (payload.body?.data && (payload.mimeType === 'text/plain' || payload.mimeType === 'text/html')) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    let combined = '';
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      if (part.parts) {
        combined += ' ' + extractBodyText(part);
      } else if (part.body?.data) {
        combined += ' ' + decodeBase64Url(part.body.data);
      }
    }
    return combined.trim();
  }

  return '';
}

function decodeBase64Url(base64UrlStr: string): string {
  try {
    const base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(bytes);
    // Strip heavy HTML tags if html
    return text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
               .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
               .replace(/<[^>]+>/g, ' ')
               .replace(/\s{2,}/g, ' ')
               .trim();
  } catch (e) {
    return '';
  }
}
