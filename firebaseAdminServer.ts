import { X509Certificate, sign, verify } from 'node:crypto';

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;
let cachedFirebaseCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  let account: Partial<ServiceAccount> | null = null;

  if (raw) {
    let str = raw.trim();
    // Try base64 decoding if not starting with {
    if (!str.startsWith('{')) {
      try {
        str = Buffer.from(str, 'base64').toString('utf-8');
      } catch (e) {
        // keep as is
      }
    }

    try {
      account = JSON.parse(str);
    } catch (e) {
      try {
        // Replace unescaped newlines inside JSON string value
        const sanitized = str.replace(/\r?\n/g, '\\n');
        account = JSON.parse(sanitized);
      } catch (err) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is invalid JSON');
      }
    }
  }

  const projectId = account?.project_id || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = account?.client_email || process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = account?.private_key || process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT, project_id, client_email, or private_key is missing in Vercel environment variables');
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
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

export async function createFirebaseCustomToken(uid: string, claims: Record<string, unknown>): Promise<string> {
  const account = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: account.client_email,
    sub: account.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
    claims,
  };
  return signJwt(payload, account);
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