import { readFileSync } from 'node:fs';
import { sign } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const envPath = `${projectRoot}\.env.local`;
const rulesPath = `${projectRoot}database.rules.json`;
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
const projectId = env.FIREBASE_PROJECT_ID;
const databaseUrl = env.FIREBASE_DATABASE_URL;
if (account.project_id !== projectId) throw new Error('Firebase service account project does not match FIREBASE_PROJECT_ID');

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const header = { alg: 'RS256', typ: 'JWT' };
const payload = {
  iss: account.client_email,
  scope: 'https://www.googleapis.com/auth/firebase.database',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600,
};
const unsigned = `${encode(header)}.${encode(payload)}`;
const signature = sign('RSA-SHA256', Buffer.from(unsigned), account.private_key).toString('base64url');
const assertion = `${unsigned}.${signature}`;

const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  }),
});
const tokenData = await tokenResponse.json();
if (!tokenResponse.ok || !tokenData.access_token) {
  throw new Error(`Firebase OAuth failed: ${tokenData.error_description || tokenData.error || 'unknown error'}`);
}

const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
const endpoint = `${databaseUrl.replace(/\/$/, '')}/.settings/rules.json`;
const response = await fetch(endpoint, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${tokenData.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(rules),
});
const result = await response.text();
if (!response.ok) throw new Error(`Firebase rules deployment failed (${response.status}): ${result}`);
console.log(`Firebase rules deployed successfully: HTTP ${response.status}`);
