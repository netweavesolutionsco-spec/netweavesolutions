import { z } from "zod";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";
import { refreshCookieOptions, REFRESH_COOKIE } from "../utils/tokens.js";
import {
  createClient,
  findClientByEmail,
  findClientById,
  updateClient,
  toSafeClient,
} from "../services/clientService.js";

// --- Schemas ---
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: z.string().trim().max(30).optional(),
    companyName: z.string().trim().max(200).optional(),
    country: z.string().trim().max(80).optional(),
    password: z.string().min(8).max(200),
    confirmPassword: z.string().min(8).max(200),
    referralCode: z.string().trim().max(50).optional(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept terms" }) }),
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
  password: z.string().min(8).max(200),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});
export const otpSchema = z.object({ otp: z.string().length(6) });

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

// --- Handlers ---
export async function register(req, res) {
  const { fullName, email, phone, companyName, country, password, referralCode } = req.body;

  const existing = await findClientByEmail(email);
  if (existing) {
    if (!existing.emailVerified) {
      const client = await updateClient(existing.id, {
        fullName,
        phone,
        companyName,
        country,
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
    fullName,
    email,
    phone,
    companyName,
    country,
    referralCode,
    password,
    acceptedTerms: true,
    emailVerified: true,
    role: "viewer",
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
  return res.json({ ok: true, accessToken, client: toSafeClient(client) });
}

export async function logout(req, res) {
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
