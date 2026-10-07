import { X509Certificate, sign, verify } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;
let cachedFirebaseCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured');

  const account = JSON.parse(raw) as ServiceAccount;
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error('Firebase service account is incomplete');
  }
  if (account.project_id !== process.env.FIREBASE_PROJECT_ID) {
    throw new Error('Firebase service account belongs to a different project');
  }
  return account;
}

function signJwt(payload: Record<string, unknown>, account: ServiceAccount): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsignedToken = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(payload)}`;
  const signature = sign('RSA-SHA256', Buffer.from(unsignedToken), account.private_key).toString('base64url');
  return `${unsignedToken}.${signature}`;
}

async function getGoogleAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const account = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }, account);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const result = await response.json() as { access_token?: string; expires_in?: number };
  if (!response.ok || !result.access_token) throw new Error('Could not authenticate with Google');

  cachedAccessToken = {
    token: result.access_token,
    expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000,
  };
  return cachedAccessToken.token;
}

export async function firebaseDatabaseRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT',
  body?: unknown,
  query: Record<string, string> = {},
): Promise<T> {
  const databaseUrl = process.env.FIREBASE_DATABASE_URL;
  if (!databaseUrl) throw new Error('FIREBASE_DATABASE_URL is not configured');

  const url = new URL(`${databaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}.json`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${await getGoogleAccessToken()}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error('Firebase database request failed');
  return result as T;
}

function getFirebaseAdminApp() {
  const account = getServiceAccount();
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;
  return initializeApp({
    credential: cert({
      projectId: account.project_id,
      clientEmail: account.client_email,
      privateKey: account.private_key,
    }),
  });
}

export async function createFirebaseCustomToken(uid: string, claims: Record<string, unknown>): Promise<string> {
  return getAuth(getFirebaseAdminApp()).createCustomToken(uid, claims as Record<string, string | number | boolean>);
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; claims: Record<string, unknown> }> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not configured');

  const [headerPart, payloadPart, signaturePart] = idToken.split('.');
  if (!headerPart || !payloadPart || !signaturePart) throw new Error('Invalid Firebase ID token');
  const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString()) as { alg?: string; kid?: string };
  const claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString()) as Record<string, unknown>;
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Invalid Firebase ID token');

  if (!cachedFirebaseCerts || cachedFirebaseCerts.expiresAt <= Date.now()) {
    const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    if (!response.ok) throw new Error('Could not load Firebase signing certificates');
    const certs = await response.json() as Record<string, string>;
    const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 3600);
    cachedFirebaseCerts = { certs, expiresAt: Date.now() + maxAge * 1000 };
  }

  const cert = cachedFirebaseCerts.certs[header.kid];
  const signedContent = Buffer.from(`${headerPart}.${payloadPart}`);
  const signature = Buffer.from(signaturePart, 'base64url');
  if (!cert || !verify('RSA-SHA256', signedContent, new X509Certificate(cert).publicKey, signature)) {
    throw new Error('Invalid Firebase ID token signature');
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    claims.aud !== projectId ||
    claims.iss !== `https://securetoken.google.com/${projectId}` ||
    typeof claims.sub !== 'string' ||
    !claims.sub ||
    typeof claims.exp !== 'number' || claims.exp <= now ||
    typeof claims.iat !== 'number' || claims.iat > now
  ) {
    throw new Error('Firebase ID token claims are invalid');
  }

  return { uid: claims.sub, claims };
}

export type ApiRequest = { method?: string; body?: unknown; headers?: Record<string, string | undefined> };
export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (value: unknown) => void;
  setHeader: (name: string, value: string) => void;
};