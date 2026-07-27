# Netweavesolutions Client API

Standalone Node.js service (Express + Supabase + JWT) powering the Client Portal
of the Netweavesolutions website. This backend is now Supabase-based and is
called over HTTPS from the Lovable frontend.

## Stack

- Express 4 + Helmet + CORS + express-rate-limit
- Supabase service role client for persistence
- JWT (access + refresh) with bcrypt-hashed passwords
- Nodemailer for verification / OTP / password reset emails
- Zod for input validation
- MVC layout: `services/`, `controllers/`, `routes/`, `middleware/`, `utils/`

## Local dev

```bash
cd backend
cp .env.example .env       # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT secrets, and SMTP
npm install
npm run dev
# → API on http://localhost:4000
```

## Deploy (pick one)

- **Railway** — New Project → Deploy from repo → set env vars from `.env.example` → Deploy.
- **Render** — New Web Service → root `backend/` → build `npm install` → start `npm start` → env vars.
- **Fly.io** — `fly launch` inside `backend/`, then `fly secrets set …`.

After deploy, copy the public URL and set it as `VITE_CLIENT_API_URL` in the
Lovable frontend project (Project Settings → Environment Variables), e.g.
`https://codenest-api.up.railway.app`.

### Render env vars

Use these exact names in Render for the backend service:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `API_PUBLIC_URL=https://<your-backend-url>`
- `FRONTEND_ORIGIN=https://<your-vercel-frontend-url>`
- `COOKIE_SECURE=true`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM="Your App <noreply@yourdomain.com>"`
- `NODE_ENV=production`
- `PORT=4000` (optional)

`FRONTEND_ORIGIN` must match the deployed Vercel frontend URL so backend CORS
allows requests from the app.
## Endpoints (Phase 1)

Auth (`/auth`)

- `POST /register` — create account, send email verification token
- `POST /login` — email + password → { accessToken } + refresh cookie
- `POST /logout` — clears refresh cookie + rotates jti
- `POST /refresh` — rotates refresh cookie, returns new access token
- `POST /verify-email` — { token } confirms email
- `POST /send-otp` — sends 6-digit OTP to email (auth-gated)
- `POST /verify-otp` — { otp } marks phone/email OTP-verified
- `POST /forgot-password` — { email } sends reset link
- `POST /reset-password` — { token, password }
- `POST /change-password` — auth-gated
- `GET  /me` — current client

Profile (`/profile`, auth-gated)

- `GET  /` — full profile
- `PUT  /` — update profile fields

Health

- `GET  /healthz` — liveness probe

All authenticated routes expect `Authorization: Bearer <accessToken>`.
The refresh cookie is httpOnly, SameSite=None, Secure (configurable).

## Security defaults

- bcrypt cost 12
- Rate limit: 100 req / 15 min per IP globally; 10 / 15 min on `/auth/*`
- Helmet with sensible defaults + noSniff + frameguard
- Zod validation on every mutating endpoint
- JWT access 15 min, refresh 30 days (rotate on use)
- CORS locked to `FRONTEND_ORIGIN`

## Schema (Phase 1 shipped; Phase 2/3 stubbed)

`clients` (full), plus stub models for `projects`, `projectFiles`,
`projectMessages`, `projectActivities`, `projectNotes`, `projectMeetings`,
`notifications`, `payments`, `invoices` — so Phase 2 controllers can be added
without further migrations.

