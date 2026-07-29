import { z } from "zod";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";
import { refreshCookieOptions, REFRESH_COOKIE } from "../utils/tokens.js";
import {
  createClient,
  findClientByEmail,
  findClientById,
  updateClient,
  recordLogin,
  ensureClientForAuthUser,
  toSafeClient,
} from "../services/clientService.js";
import { recordActivity } from "../services/portal.service.js";

// --- Schemas ---
// Strong password: min 8, and at least one uppercase, lowercase, number and
// special character. Enforced on the server so the API never trusts the client.
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200)
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[0-9]/, "Password needs a number")
  .regex(/[^A-Za-z0-9]/, "Password needs a special character");

const optionalStr = (max) => z.string().trim().max(max).optional().or(z.literal(""));

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: optionalStr(30),
    countryCode: optionalStr(8),
    whatsapp: optionalStr(30),
    companyName: optionalStr(200),
    website: optionalStr(200),
    industry: optionalStr(120),
    country: optionalStr(80),
    state: optionalStr(80),
    city: optionalStr(80),
    address: optionalStr(300),
    gstNumber: optionalStr(40),
    password: strongPassword,
    confirmPassword: z.string().min(1).max(200),
    referralCode: optionalStr(50),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept terms" }) }),
    newsletter: z.boolean().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});
export const emailOnly = z.object({ email: z.string().trim().toLowerCase().email() });
export const verifyEmailSchema = z.object({ token: z.string().min(10) });
export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: strongPassword,
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPassword,
});
export const otpSchema = z.object({ otp: z.string().length(6) });
// Google OAuth sync: the frontend completes the Supabase OAuth redirect,
// then hands the resulting session tokens to the backend so we can provision
// the client record and issue our own refresh cookie (same model as login).
export const oauthSyncSchema = z.object({
  accessToken: z.string().min(10),
  refreshToken: z.string().min(10).optional(),
});

// --- Helpers ---
async function issueSession(res, client, session) {
  if (session?.refresh_token) {
    res.cookie(REFRESH_COOKIE, session.refresh_token, refreshCookieOptions());
  }
  return session?.access_token ?? null;
}

function isEmailNotConfirmedError(error) {
  const message = String(error?.message ?? "").toLowerCase();
  const code = String(error?.code ?? "").toLowerCase();
  return message.includes("email not confirmed") || code.includes("email_not_confirmed");
}

async function signInClientWithPassword(email, password) {
  let result = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (result.error && isEmailNotConfirmedError(result.error)) {
    const client = await findClientByEmail(email);
    if (client && !client.emailVerified) {
      await updateClient(client.id, { emailVerified: true });
      result = await supabaseAdmin.auth.signInWithPassword({ email, password });
    }
  }

  return result;
}

async function auditAuth(clientId, action, description, metadata = {}) {
  try {
    await recordActivity(clientId, clientId, action, description, metadata);
  } catch (error) {
    console.warn(`[audit] ${action} could not be recorded:`, error?.message ?? error);
  }
}

// --- Handlers ---
export async function register(req, res) {
  const {
    fullName,
    email,
    phone,
    countryCode,
    whatsapp,
    companyName,
    website,
    industry,
    country,
    state,
    city,
    address,
    gstNumber,
    password,
    referralCode,
    newsletter,
  } = req.body;

  const profileFields = {
    fullName,
    phone,
    countryCode,
    whatsapp,
    companyName,
    website,
    industry,
    country,
    state,
    city,
    address,
    gstNumber,
    newsletterOptIn: Boolean(newsletter),
  };

  const existing = await findClientByEmail(email);
  if (existing) {
    if (!existing.emailVerified) {
      const client = await updateClient(existing.id, {
        ...profileFields,
        password,
        emailVerified: true,
      });

      return res.status(200).json({
        ok: true,
        message: "Account is ready. You can sign in now.",
        client: toSafeClient(client),
      });
    }

    return res.status(409).json({ error: "Email already registered" });
  }

  const client = await createClient({
    ...profileFields,
    email,
    referralCode,
    password,
    acceptedTerms: true,
    emailVerified: true,
    role: "customer",
  });

  return res.status(201).json({
    ok: true,
    message: "Account created successfully. You can sign in now.",
    client: toSafeClient(client),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const { data, error } = await signInClientWithPassword(email, password);
  if (error || !data.session || !data.user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const client = await findClientByEmail(email);
  if (!client) return res.status(401).json({ error: "Invalid credentials" });
  if (client.status !== "active") return res.status(403).json({ error: "Account suspended" });
  if (!client.emailVerified) {
    return res.status(403).json({ error: "Please verify your email before signing in." });
  }

  const accessToken = await issueSession(res, client, data.session);
  await recordLogin(client.id);
  await auditAuth(client.id, "login", "Client logged in", { email: client.email });
  return res.json({ ok: true, accessToken, client: toSafeClient(client) });
}

export async function logout(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data.user?.id) await auditAuth(data.user.id, "logout", "Client logged out");
    } catch {}
  }
  try {
    await supabaseAdmin.auth.signOut();
  } catch {}
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: 0 });
  return res.json({ ok: true });
}

export async function refresh(req, res) {
  const rt = req.cookies?.[REFRESH_COOKIE];
  if (!rt) return res.status(401).json({ error: "No refresh token" });

  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: rt });
  if (error || !data.session || !data.user) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const client = await findClientById(data.user.id);
  if (!client || client.status !== "active") {
    return res.status(401).json({ error: "Session revoked" });
  }

  const accessToken = await issueSession(res, client, data.session);
  return res.json({ ok: true, accessToken, client: toSafeClient(client) });
}

export async function me(req, res) {
  return res.json({ client: toSafeClient(req.client) });
}

export async function verifyEmail(req, res) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing verification token" });
  }

  const { data, error } = await supabaseAdmin.auth.verifyOtp({ token, type: "signup" });
  if (error || !data.user) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  await updateClient(data.user.id, { emailVerified: true });
  return res.json({ ok: true });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.FRONTEND_PRIMARY}/client/reset-password`,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ ok: true, message: "If that email exists, a reset link was sent." });
}

export async function resetPassword(req, res) {
  const { token, password } = req.body;
  const { data, error } = await supabaseAdmin.auth.verifyOtp({ token, type: "recovery" });
  if (error || !data.user) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  await updateClient(data.user.id, { password });
  return res.json({ ok: true });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!req.client) return res.status(401).json({ error: "Client not found" });

  const { error } = await supabaseAdmin.auth.signInWithPassword({
    email: req.client.email,
    password: currentPassword,
  });
  if (error) return res.status(400).json({ error: "Current password is incorrect" });

  const client = await updateClient(req.client.id, { password: newPassword });
  return res.json({ ok: true, client: toSafeClient(client) });
}

export async function sendOtp(req, res) {
  if (!req.client) return res.status(401).json({ error: "Client not found" });

  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email: req.client.email,
    options: { emailRedirectTo: `${env.FRONTEND_PRIMARY}/auth?callback=true` },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.json({ ok: true, message: "Verification link sent." });
}

export async function verifyOtp(req, res) {
  const { otp } = req.body;
  if (!req.client) return res.status(401).json({ error: "Client not found" });

  const { data, error } = await supabaseAdmin.auth.verifyOtp({
    email: req.client.email,
    token: otp,
    type: "email",
  });

  if (error || !data.session || !data.user) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  return res.json({ ok: true, accessToken: data.session.access_token });
}

// Public, pre-login: re-sends the signup confirmation email. Always returns a
// generic success so it can't be used to probe which emails are registered.
export async function resendVerification(req, res) {
  const { email } = req.body;
  try {
    await supabaseAdmin.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${env.FRONTEND_PRIMARY}/client/verify-email` },
    });
  } catch (error) {
    // Supabase errors when the account is already confirmed / doesn't exist.
    // That's expected here — we still return a generic success below.
    console.warn("[auth] resendVerification:", error?.message ?? error);
  }
  return res.json({
    ok: true,
    message: "If that email needs verification, we've sent a new link.",
  });
}

// Public: completes Google (or any Supabase OAuth) sign-in. The frontend runs
// the Supabase OAuth redirect, then posts the resulting session tokens here.
// We verify the token server-side, provision the client via the SAME profile/
// role model as password signup, then issue our own refresh cookie so the rest
// of the portal keeps working exactly as it does for email/password users.
export async function oauthSync(req, res) {
  const { accessToken, refreshToken } = req.body;

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired OAuth session" });
  }

  const client = await ensureClientForAuthUser(data.user, { role: "customer" });
  if (!client) return res.status(500).json({ error: "Could not provision account" });
  if (client.status && client.status !== "active") {
    return res.status(403).json({ error: "Account suspended" });
  }

  if (refreshToken) {
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  }
  await recordLogin(client.id);
  await auditAuth(client.id, "login", "Client logged in with Google", { email: client.email });

  return res.json({ ok: true, accessToken, client: toSafeClient(client) });
}
