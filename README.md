# Appli-Log

Appli-Log is a lightweight job application tracker built with Next.js and Supabase. It helps job seekers collect and organize application details, track statuses (applied, interview, offered, rejected), schedule interview reminders, and archive old records, using simple authentication (email and Google SSO) and a friendly UI. This README is written to be accessible to beginners while retaining technical detail and precise instructions for developers.

This README explains how the app works, how to run it locally, how authentication is handled, and how to deploy it to a platform such as Vercel.

**Highlights**
- Modern Next.js frontend using the App Router
- Supabase for authentication (OAuth + email) and Postgres-like database
- Google SSO integration with a server-side OAuth callback for secure session exchange
- Small, focused feature set: add/edit applications, archive, search, calendar links, and status summaries

**Table of Contents**
- **Project overview**: what the app does and the user flow
- **System architecture**: how frontend, Supabase, and deployment work together
- **Getting started**: local setup and environment variables
- **Authentication & OAuth callback**: how Google SSO is handled (server-side exchange)
- **Deployment (Vercel)**: production checklist and redirect configuration
- **Important files**: quick map to the repository
- **Glossary**: short, beginner-friendly term definitions

---

**Project Overview**

Appli-Log provides a small, practical dashboard for tracking job applications. Users can:
- Add new applications with company, status, dates, notes, and optional link to the posting.
- View applications in a dashboard or archive list.
- Toggle dark mode and sign out from settings.
- Sign in with email/password or Google SSO.

User flow:
1. The user opens the site and signs in (email or Google).
2. If using Google, the app redirects the browser to Google, the user authenticates, and Google redirects back to an internal callback route that exchanges the OAuth code for a server-side session cookie.
3. Once signed in, the frontend calls Supabase to read/write the user's application records stored in Supabase's Postgres-like database.

---

**System architecture & how it works**

- Frontend: Next.js (App Router) renders pages and runs client code for interactive UI. Components include `Auth.js`, `JobTracker.tsx`, and the tabbed views in `components/tabs/`.
- Backend (managed by Supabase): authentication (GoTrue) and a hosted Postgres database accessed via the Supabase client. The app uses the `@supabase/supabase-js` client on the frontend and `@supabase/ssr` helpers for the server-side callback.
- OAuth flow (Google SSO): the client calls `supabase.auth.signInWithOAuth(...)` with a redirect to `/auth/callback`. The server route `app/auth/callback/route.ts` exchanges the returned `code` for a session and sets secure cookies.
- Deployment: server-rendered pages and the callback route run as serverless functions on Vercel. Build and static prerendering are handled by Next.js; sensitive configuration is provided via environment variables.

Sequence (detailed):
1. Client initiates OAuth: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://your-app.example.com/auth/callback' } })`.
2. Google authenticates the user and redirects to `/auth/callback?code=...`.
3. `app/auth/callback/route.ts` runs server-side, calls `supabase.auth.exchangeCodeForSession(code)` (via `@supabase/ssr`) and sets HTTP-only session cookies.
4. After successful exchange, the route redirects back to the application root. The client sees the user session and loads data with `supabase.from('jobs').select(...)`.

---

**Getting started (local development)**

Prerequisites:
- Node.js v18+ (or compatible)
- npm or your preferred package manager

Clone and install:

```bash
git clone <your-repo-url>
cd job-tracker
npm install
```

Create local environment variables in a `.env.local` file at the repository root (copy from `.env.example` if provided):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key-from-supabase
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Optional: keep SECRET keys out of source control for production
```

Run development server:

```bash
npm run dev
# Visit http://localhost:3000 in a browser
```

Build for production locally:

```bash
npm run build
npm start
```

Notes:
- The app expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to be available at build/runtime. For local testing, safe test values may be used locally; do not commit secrets.

---

**Authentication & Google SSO (why the callback exists)**

This project uses Supabase Auth for both email/password and OAuth providers. Because OAuth flows typically redirect the browser, a server-side callback route is used to safely exchange a short-lived authorization code for a session and store provider tokens in secure cookies.

Key implementation details in this repo:
 - `components/Auth.js`: client UI for email/password and a Google sign-in button. The Google sign-in target is `/auth/callback`.
 - `app/auth/callback/route.ts`: server route that calls `createServerClient(...)` from `@supabase/ssr` and runs `exchangeCodeForSession(code)` to set the session cookie and redirect the browser.

Why this helps: storing provider/session tokens server-side and setting HTTP-only cookies avoids exposing refresh tokens in browser storage and makes the session available to server-side rendered pages.

---

**Deployment (Vercel) checklist**

1. Create a new Vercel project and connect to this repository.
2. In the Vercel project settings add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the Supabase anon/public key
   - `NEXT_PUBLIC_APP_URL` = the deployed app URL (for example `https://your-app.vercel.app`)
3. In Supabase dashboard → Authentication → Settings → Redirect URLs, add:
   - `https://your-app.vercel.app/auth/callback`
   - keep `http://localhost:3000/auth/callback` for local testing
4. If routes are protected via middleware, ensure `/auth/callback` is excluded from automatic redirects to login (see `middleware.ts` matcher example in docs).
5. Deploy and test using an incognito browser to avoid cached sessions.

---

**Important files (quick map)**
- `app/layout.tsx`: global layout and app metadata
- `app/page.tsx`: main entry, auth gating and session listener
- `app/auth/callback/route.ts`: OAuth code exchange and cookie set (server-side)
- `components/Auth.js`: sign-in form and Google SSO button
- `components/JobTracker.tsx`: main dashboard and tab switcher
- `components/tabs/*`: DashboardTab, ArchiveTab, CalendarTab, SettingsTab UI
- `lib/supabaseClient.js`: Supabase client creation and URL/key loading
- `types/index.ts`: TypeScript types used by the components

---

**Glossary**
 - OAuth authentication: A method that allows signing in using a third-party account (for example, Google) without sharing a password. (Example: the application redirects the browser to the provider for authentication; the provider returns an authorization assertion.)
- Server-side/Server component: Code that runs on the server (not in the browser). Useful for secure operations like exchanging OAuth codes.
- Environment variables: Configuration values (URLs, API keys) that are provided outside the source code so secrets are not committed.
- Prerendering / SSR: Next.js can render pages ahead of time or on the server for better performance and SEO.
- REST / database queries: The app uses Supabase client methods which internally perform queries over HTTP to read/write application records.

---

**Development tips & troubleshooting**
- If Google SSO redirects back to the login page, confirm:
  - Vercel `NEXT_PUBLIC_APP_URL` exactly matches the deployed origin.
  - Supabase redirect URL includes `/auth/callback` for that origin.
  - The `app/auth/callback/route.ts` exchange code runs without errors (check server logs).
 - Testing in an incognito window can avoid cached credentials during verification.
 - Keep environment variables secret for production; use Vercel's Environment Variables UI.

---
