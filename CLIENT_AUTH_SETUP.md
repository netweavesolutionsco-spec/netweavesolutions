# Client Authentication — Production Configuration

This covers everything the client portal auth flow needs to work in production
(email verification, password reset, and Google sign-in). The frontend runs at
**https://netweavesolutions.tech**, the backend API on **Render**, and both use
one **Supabase** project for auth.

## 1. Backend (Render) environment variables

Set these on the Render service (Settings → Environment). See
[`backend/.env.example`](backend/.env.example) for the full annotated list.

| Variable | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | ✅ | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role (secret) key. Backend-only — never ship to the frontend. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ✅ | Distinct random strings (`openssl rand -hex 64`). |
| `SITE_URL` | ✅ | **`https://netweavesolutions.tech`** — the canonical site URL used to build the deep links inside verification/reset emails. Must be the live client site, not the API or localhost. |
| `FRONTEND_ORIGIN` | ✅ | CORS allow-list, comma-separated. May include localhost. **Not** used for email links. |
| `API_PUBLIC_URL` | – | The Render service URL. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | ✅ (recommended) | SMTP transport for branded verification/OTP/reset email. If `SMTP_HOST` is unset the backend falls back to Supabase's own mailer (rate-limited, must be configured in Supabase). |
| `COOKIE_SECURE` | – | Defaults to `true` in production (HTTPS required for the refresh cookie). |

> **Why `SITE_URL` matters:** the backend appends `/client/verify-email`,
> `/client/reset-password`, and `/client/oauth-callback` to it. If it points at
> the wrong domain, users receive verification links to a site that can't redeem
> them. Previously this fell back to `FRONTEND_ORIGIN[0]`, which could be a
> legacy origin — hence verification links landing on the wrong domain.

## 2. Frontend environment variables

Set in the frontend host (Netlify/Vercel/etc.) build env:

| Variable | Notes |
| --- | --- |
| `VITE_CLIENT_API_URL` | Base URL of the backend API (the Render service). If unset, the portal shows "Client API not configured". |
| `VITE_SUPABASE_URL` | Supabase project URL (used for Google OAuth + the provider-enabled pre-flight check). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key. |

## 3. Supabase dashboard configuration

### 3a. Redirect URL allow-list (Authentication → URL Configuration)

- **Site URL:** `https://netweavesolutions.tech`
- **Redirect URLs** (add all of these — email links and OAuth callbacks are
  rejected by Supabase if the target isn't listed):
  - `https://netweavesolutions.tech/client/verify-email`
  - `https://netweavesolutions.tech/client/reset-password`
  - `https://netweavesolutions.tech/client/oauth-callback`
  - For local dev, also add the `http://localhost:8080/...` equivalents.

### 3b. Enable the Google provider (Authentication → Providers → Google)

The error **`Unsupported provider: provider is not enabled`** means Google is
toggled **off** in Supabase. To fix:

1. Toggle **Google** on.
2. Paste the **Client ID** and **Client Secret** from a Google Cloud OAuth 2.0
   client (APIs & Services → Credentials).
3. In the Google Cloud client, add Supabase's callback as an **Authorized
   redirect URI**: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4. Save. No code change or redeploy is needed.

> The frontend now **detects** a disabled provider (via Supabase's public
> `/auth/v1/settings` endpoint) and shows a friendly "Google sign-in isn't
> enabled yet…" message instead of dumping raw error JSON — but sign-in still
> won't work until the provider is enabled here.

## 4. End-to-end flow (what happens where)

1. **Register** → backend creates the Supabase user (unconfirmed) and sends a
   verification email whose link points at `SITE_URL/client/verify-email`.
   The API response includes `emailSent` so the UI can tell the user whether the
   email actually went out or to use "Resend it".
2. **Verify email** → `/client/verify-email` redeems the token
   (`magiclink`/`signup`), marks the address verified, then the user signs in.
3. **Login** → an unverified account returns **403 + `requiresEmailVerification`**;
   the login page surfaces this with a banner and a resend button (never a
   generic error).
4. **Google** → `signInWithOAuth` → `/client/oauth-callback` → backend
   `/auth/oauth/sync` provisions the client and issues the portal session.
5. **Password reset** → email link points at `SITE_URL/client/reset-password`.

## 5. Quick verification checklist

- [ ] `SITE_URL` on Render = `https://netweavesolutions.tech`
- [ ] SMTP configured on Render (or Supabase mailer configured as fallback)
- [ ] All three redirect URLs added to the Supabase allow-list
- [ ] Google provider enabled in Supabase with valid Client ID/Secret
- [ ] `VITE_CLIENT_API_URL` on the frontend points at the Render API
- [ ] Register a test account → verification email arrives with a
      `netweavesolutions.tech/client/verify-email?...` link → clicking it lets
      you sign in
