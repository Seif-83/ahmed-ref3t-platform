<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1scifTM8dGLBxx0DnLltdGisJg-FDGBaH

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Secure Teacher And Student Authentication

The Vercel API routes under `api/` verify teacher passwords and handle student phone lookups. They require server-only environment variables; do not prefix these variables with `VITE_`.

1. In Firebase Console, enable Firebase Authentication and create a service account with access to the Realtime Database. Keep its JSON private key secret.
2. Add these variables to the Vercel project for Development, Preview, and Production:
   - `ADMIN_PASSWORD`: `admed-admin-2025` (replace it with a long random password before production).
   - `FIREBASE_PROJECT_ID`: the Firebase project ID.
   - `FIREBASE_DATABASE_URL`: the exact Realtime Database URL.
   - `FIREBASE_SERVICE_ACCOUNT`: the complete service-account JSON on one line.
3. In Realtime Database > Rules, publish the contents of [`database.rules.json`](database.rules.json).
4. Redeploy the Vercel project so the API functions receive the environment variables.
5. For local development, put the same server-only values in the ignored `.env.local` file and run `npx vercel dev`. `npm run dev` starts Vite only and does not run the `/api` functions.

Never commit `.env.local` or a service-account JSON key. The service account bypasses Realtime Database Rules on the server, so API handlers must validate every request.
