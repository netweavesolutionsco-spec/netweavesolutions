import crypto from "node:crypto";
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
  getAppMetadata,
  setAppMetadata,
} from "../services/clientService.js";
import { recordActivity, insertAdminNotification, insertNotification } from "../services/portal.service.js";
import { sendMail, emailTemplates, isMailConfigured } from "../utils/mailer.js";
import { sendOtpWhatsApp } from "../utils/whatsapp.js";

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
// Verification accepts either shape:
//  - `tokenHash`: the `hashed_token` from our own branded mail (admin
//    `generateLink`), redeemed with `verifyOtp({ token_hash })`.
//  - `token`: the raw 6-digit/OTP token from Supabase's built-in confirmation
//    mail, used when our SMTP path falls back to Supabase's mailer.
export const verifyEmailSchema = z
  .object({
    token: z.string().trim().min(6).max(512).optional(),
    tokenHash: z.string().trim().min(6).max(512).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
  })
  .refine((v) => Boolean(v.token || v.tokenHash), {
    message: "Missing verification token",
    path: ["token"],
  });
export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: strongPassword,
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPassword,
});
export const otpSchema = z.object({ otp: z.string().length(6) });
// Mobile verification. `phone` is optional — when omitted we use the number
// already on the profile, when supplied it replaces it (and resets any previous
// verified state) so the verified number is always the stored one.
export const phoneOtpRequestSchema = z.object({
  phone: optionalStr(30),
  countryCode: optionalStr(8),
});
export const phoneOtpVerifySchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
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

/**
 * Signs a client in with email + password.
 *
 * Supabase itself rejects unconfirmed emails, so an "email not confirmed" error
 * is a legitimate refusal — it is surfaced to the caller as `needsVerification`
 * rather than being auto-confirmed. (An earlier version silently confirmed the
 * address and retried, which defeated verification entirely.)
 */
async function signInClientWithPassword(email, password) {
  const result = await supabaseAdmin.auth.signInWithPassword({ email, password });
  return { ...result, needsVerification: Boolean(result.error && isEmailNotConfirmedError(result.error)) };
}

/**
 * Sends the "confirm your email address" message.
 *
 * Two delivery paths, in priority order, so a signup NEVER dead-ends without a
 * way to verify:
 *
 *  1. Branded SMTP (`sendMail` + `emailTemplates.verifyEmail`) — used only when
 *     SMTP is actually configured (`isMailConfigured()`). The link carries our
 *     own `token_hash` from `admin.generateLink`.
 *  2. Supabase's built-in confirmation mailer (`auth.resend`) — used when SMTP
 *     is not configured, or when the branded path throws for any reason.
 *
 * Returns `true` only when a message was genuinely handed to a transport.
 * Delivery failures are logged loudly (never swallowed) so a broken mail setup
 * surfaces in the API logs instead of silently reporting success.
 */
async function sendVerificationEmail({ email, fullName }) {
  const redirectTo = `${env.SITE_URL}/client/verify-email`;

  // Preferred path: branded email over our own SMTP. Skipped entirely when no
  // SMTP host is configured, because `sendMail` would otherwise just log the
  // message and report nothing was delivered — we'd rather Supabase send a real
  // email in that case.
  if (isMailConfigured()) {
    try {
      // `magiclink` (not `signup`) because the auth user already exists at this
      // point — `generateLink({type:"signup"})` would fail with "already
      // registered". Confirming a magic-link OTP stamps `email_confirmed_at`
      // just the same, which is what `emailVerified` derives from.
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      if (error) throw error;

      const tokenHash = data?.properties?.hashed_token;
      const link = tokenHash
        ? `${redirectTo}?token_hash=${encodeURIComponent(tokenHash)}`
        : data?.properties?.action_link;
      if (!link) throw new Error("Supabase returned no verification link");

      const result = await sendMail({ to: email, ...emailTemplates.verifyEmail(fullName, link) });
      if (result?.delivered === false) {
        throw new Error("SMTP transport reported the message was not delivered");
      }
      console.info(`[auth] verification email sent via SMTP to ${email}`);
      return true;
    } catch (error) {
      console.error(
        "[auth] branded verification mail failed, falling back to Supabase:",
        error?.message ?? error,
      );
      // fall through to the Supabase mailer below
    }
  } else {
    console.warn(
      "[auth] SMTP not configured — sending verification via Supabase's built-in mailer",
    );
  }

  // Fallback path: let Supabase Auth send its own confirmation email. Requires
  // an SMTP provider (or the shared Supabase sandbox) configured in the Supabase
  // dashboard, and `${SITE_URL}/client/verify-email` in the redirect allow-list.
  try {
    const { error } = await supabaseAdmin.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    console.info(`[auth] verification email sent via Supabase to ${email}`);
    return true;
  } catch (fallbackError) {
    console.error(
      "[auth] verification email could not be sent by any transport:",
      fallbackError?.message ?? fallbackError,
    );
    return false;
  }
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
    // An unverified account is treated as an abandoned signup: the details and
    // password are refreshed and a new verification email goes out. It stays
    // unverified, so this cannot be used to take over a live account (a verified
    // one falls through to the 409 below).
    if (!existing.emailVerified) {
      const client = await updateClient(existing.id, {
        ...profileFields,
        password,
      });
      const sent = await sendVerificationEmail({ email, fullName });
      await auditAuth(client.id, "register", "Verification email re-sent", { email });

      return res.status(200).json({
        ok: true,
        requiresEmailVerification: true,
        emailSent: sent,
        message: sent
          ? "Check your inbox — we've sent a new link to verify your email address."
          : "Account updated, but the verification email could not be sent. Please use the resend option.",
        client: toSafeClient(client),
      });
    }

    return res.status(409).json({ error: "Email already registered" });
  }

  // `emailVerified` is omitted deliberately: `createClient` defaults
  // `email_confirm` to false, so the account exists but cannot sign in until the
  // address is confirmed. `login()` enforces that gate.
  const client = await createClient({
    ...profileFields,
    email,
    referralCode,
    password,
    acceptedTerms: true,
    role: "customer",
  });

  const sent = await sendVerificationEmail({ email, fullName });
  await auditAuth(client.id, "register", "Client account created", { email });
  await insertAdminNotification({
    title: "New client registration",
    description: `${client.fullName || email} created an account.`,
    userName: client.fullName || email,
    relatedModule: "clients",
    type: "success",
    actionUrl: "/admin/clients",
  });

  return res.status(201).json({
    ok: true,
    requiresEmailVerification: true,
    emailSent: sent,
    message: sent
      ? "Account created. Check your inbox to verify your email address before signing in."
      : "Account created, but the verification email could not be sent. Please use the resend option.",
    client: toSafeClient(client),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const { data, error, needsVerification } = await signInClientWithPassword(email, password);

  // Supabase refuses unconfirmed emails before it ever checks the password, so
  // this branch is reached for correct credentials on an unverified account.
  // The frontend keys off `requiresEmailVerification` to offer "resend link".
  if (needsVerification) {
    return res.status(403).json({
      error: "Please verify your email before signing in.",
      requiresEmailVerification: true,
    });
  }

  if (error || !data.session || !data.user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const client = await findClientByEmail(email);
  if (!client) return res.status(401).json({ error: "Invalid credentials" });
  if (client.status !== "active") return res.status(403).json({ error: "Account suspended" });
  // Belt-and-braces: Supabase already blocked the unconfirmed case above, but the
  // gate is repeated against our own derived flag so a change in Supabase's
  // "allow unconfirmed sign-in" setting can never open a hole here.
  if (!client.emailVerified) {
    return res.status(403).json({
      error: "Please verify your email before signing in.",
      requiresEmailVerification: true,
    });
  }

  const accessToken = await issueSession(res, client, data.session);
  await recordLogin(client.id);
  await auditAuth(client.id, "login", "Client logged in", { email: client.email });
  await insertAdminNotification({
    title: "Client login",
    description: `${client.fullName || client.email} signed in.`,
    userName: client.fullName || client.email,
    relatedModule: "auth",
    type: "info",
    actionUrl: "/admin/clients",
  });
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

/**
 * Redeems an email-verification token.
 *
 * Two link shapes reach here, so both are attempted:
 *  1. `tokenHash` — the `hashed_token` from our own branded mail. It comes from
 *     `admin.generateLink({type:"magiclink"})`, so it is redeemed with
 *     `verifyOtp({ token_hash, type: "email" })`.
 *  2. `token` — the raw token from Supabase's built-in confirmation mail, used
 *     when SMTP is unavailable and `sendVerificationEmail` falls back. Those are
 *     `signup` tokens and need the email alongside them.
 *
 * Either way Supabase stamps `email_confirmed_at`, which is what `emailVerified`
 * derives from; `updateClient` is only called as a safety net.
 */
export async function verifyEmail(req, res) {
  const { token, tokenHash, email } = req.body;

  const attempts = [];
  if (tokenHash) {
    // Our branded mail is generated with `generateLink({type:"magiclink"})`, so
    // `magiclink` is tried first; `email`/`signup` cover Supabase's own mailer.
    attempts.push({ token_hash: tokenHash, type: "magiclink" });
    attempts.push({ token_hash: tokenHash, type: "email" });
    attempts.push({ token_hash: tokenHash, type: "signup" });
  }
  if (token) {
    attempts.push({ token_hash: token, type: "magiclink" });
    attempts.push({ token_hash: token, type: "email" });
    if (email) {
      attempts.push({ email, token, type: "signup" });
      attempts.push({ email, token, type: "email" });
      attempts.push({ email, token, type: "magiclink" });
    }
  }

  if (!attempts.length) {
    return res.status(400).json({ error: "Missing verification token" });
  }

  let verifiedUser = null;
  let lastError = null;
  for (const params of attempts) {
    try {
      const { data, error } = await supabaseAdmin.auth.verifyOtp(params);
      if (!error && data?.user) {
        verifiedUser = data.user;
        break;
      }
      lastError = error;
    } catch (error) {
      lastError = error;
    }
  }

  if (!verifiedUser) {
    console.warn("[auth] verifyEmail failed:", lastError?.message ?? lastError);
    return res.status(400).json({
      error: "This verification link is invalid or has expired. Request a new one below.",
    });
  }

  try {
    await updateClient(verifiedUser.id, { emailVerified: true });
  } catch (error) {
    console.warn("[auth] verifyEmail could not sync profile:", error?.message ?? error);
  }
  await auditAuth(verifiedUser.id, "verify_email", "Email address verified", {
    email: verifiedUser.email,
  });

  await insertNotification(
    verifiedUser.id,
    "success",
    "Email verified",
    "Your email address has been verified. You now have full access to your client portal.",
    "/client/dashboard",
  );
  await insertAdminNotification({
    title: "Client verified email",
    description: `${verifiedUser.email ?? "A client"} verified their email address.`,
    userName: verifiedUser.email ?? null,
    relatedModule: "clients",
    type: "success",
    actionUrl: "/admin/clients",
  });

  return res.json({
    ok: true,
    email: verifiedUser.email ?? null,
    message: "Your email address is verified. You can sign in now.",
  });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.SITE_URL}/client/reset-password`,
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
  await insertNotification(
    data.user.id,
    "warning",
    "Password changed",
    "Your account password was reset. If this wasn't you, contact support immediately.",
    "/client/settings",
  );
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
  await insertNotification(
    req.client.id,
    "warning",
    "Password changed",
    "Your account password was changed successfully. If this wasn't you, contact support immediately.",
    "/client/settings",
  );
  return res.json({ ok: true, client: toSafeClient(client) });
}

export async function sendOtp(req, res) {
  if (!req.client) return res.status(401).json({ error: "Client not found" });

  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email: req.client.email,
    options: { emailRedirectTo: `${env.SITE_URL}/auth?callback=true` },
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

// --- Mobile verification ---
// The code itself is never stored: only a SHA-256 hash, its expiry, the attempt
// counter and the number it was issued for, all inside `app_metadata` (which the
// service role alone can write). Mobile verification is deliberately NOT a login
// gate — `login()` keys off email only — so a client can never be locked out by
// an unreachable number.
const PHONE_OTP_TTL_MS = 10 * 60 * 1000;
const PHONE_OTP_RESEND_MS = 60 * 1000;
const PHONE_OTP_MAX_ATTEMPTS = 5;

function hashOtp(code, phone) {
  return crypto.createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

function normalizePhone(phone, countryCode) {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  const cc = String(countryCode ?? "").replace(/[^\d]/g, "");
  if (!cc || digits.startsWith(cc)) return `+${digits}`;
  return `+${cc}${digits}`;
}

export async function sendPhoneOtp(req, res) {
  if (!req.client) return res.status(401).json({ error: "Client not found" });

  const requestedPhone = req.body.phone?.trim() || req.client.phone;
  const countryCode = req.body.countryCode?.trim() || req.client.countryCode;
  const target = normalizePhone(requestedPhone, countryCode);

  if (!target || target.replace(/\D/g, "").length < 8) {
    return res.status(400).json({ error: "Add a valid mobile number before requesting a code." });
  }

  const meta = await getAppMetadata(req.client.id);
  const pending = meta.phone_otp;
  if (pending?.sentAt && Date.now() - pending.sentAt < PHONE_OTP_RESEND_MS) {
    const wait = Math.ceil((PHONE_OTP_RESEND_MS - (Date.now() - pending.sentAt)) / 1000);
    return res.status(429).json({ error: `Please wait ${wait}s before requesting another code.` });
  }

  // A new number replaces the stored one and invalidates any previous verified
  // state, so the flag always refers to the number we actually hold.
  if (req.body.phone?.trim() && requestedPhone !== req.client.phone) {
    await updateClient(req.client.id, {
      phone: requestedPhone,
      countryCode: countryCode || undefined,
    });
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

  const whatsapp = await sendOtpWhatsApp(target, code);
  let channel = whatsapp?.sent ? "whatsapp" : null;

  if (!channel) {
    // No SMS provider is configured anywhere in this project, so when WhatsApp
    // can't deliver we send the code to the client's already-verified email
    // rather than dead-ending the flow.
    try {
      await sendMail({
        to: req.client.email,
        ...emailTemplates.otp(req.client.fullName, code),
      });
      channel = "email";
    } catch (error) {
      console.error("[auth] phone OTP could not be delivered:", error?.message ?? error);
    }
  }

  if (!channel) {
    return res.status(502).json({ error: "We couldn't send the code right now. Please try again." });
  }

  await setAppMetadata(req.client.id, {
    phone_verified: false,
    phone_otp: {
      hash: hashOtp(code, target),
      phone: target,
      expiresAt: Date.now() + PHONE_OTP_TTL_MS,
      sentAt: Date.now(),
      attempts: 0,
    },
  });

  await auditAuth(req.client.id, "phone_otp_sent", "Mobile verification code sent", {
    channel,
    phone: target,
  });

  return res.json({
    ok: true,
    channel,
    phone: target,
    message:
      channel === "whatsapp"
        ? "We've sent a 6-digit code to your WhatsApp number."
        : `We couldn't reach that number, so the code was emailed to ${req.client.email}.`,
  });
}

export async function verifyPhoneOtp(req, res) {
  if (!req.client) return res.status(401).json({ error: "Client not found" });

  const { otp } = req.body;
  const meta = await getAppMetadata(req.client.id);
  const pending = meta.phone_otp;

  if (!pending?.hash) {
    return res.status(400).json({ error: "Request a new verification code." });
  }
  if (Date.now() > Number(pending.expiresAt ?? 0)) {
    await setAppMetadata(req.client.id, { phone_otp: null });
    return res.status(400).json({ error: "That code has expired. Request a new one." });
  }
  if (Number(pending.attempts ?? 0) >= PHONE_OTP_MAX_ATTEMPTS) {
    await setAppMetadata(req.client.id, { phone_otp: null });
    return res.status(429).json({ error: "Too many incorrect attempts. Request a new code." });
  }

  const candidate = Buffer.from(hashOtp(otp, pending.phone));
  const expected = Buffer.from(String(pending.hash));
  const matches =
    candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);

  if (!matches) {
    await setAppMetadata(req.client.id, {
      phone_otp: { ...pending, attempts: Number(pending.attempts ?? 0) + 1 },
    });
    const left = PHONE_OTP_MAX_ATTEMPTS - (Number(pending.attempts ?? 0) + 1);
    return res.status(400).json({
      error: left > 0 ? `Incorrect code. ${left} attempt(s) left.` : "Incorrect code. Request a new one.",
    });
  }

  await setAppMetadata(req.client.id, {
    phone_verified: true,
    phone_verified_at: new Date().toISOString(),
    phone_verified_number: pending.phone,
    phone_otp: null,
  });
  await auditAuth(req.client.id, "phone_verified", "Mobile number verified", {
    phone: pending.phone,
  });

  const client = await findClientById(req.client.id);
  return res.json({
    ok: true,
    message: "Your mobile number is verified.",
    client: toSafeClient(client),
  });
}

// Public, pre-login: re-sends the confirmation email. Reuses the same
// `sendVerificationEmail` helper as signup so the link format the frontend
// redeems is identical. Always returns a generic success so it can't be used to
// probe which emails are registered.
export async function resendVerification(req, res) {
  const { email } = req.body;
  try {
    const client = await findClientByEmail(email);
    // Nothing to do for unknown or already-verified addresses — the generic
    // response below hides which case it was.
    if (client && !client.emailVerified) {
      await sendVerificationEmail({ email, fullName: client.fullName });
    }
  } catch (error) {
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
  await insertAdminNotification({
    title: "Client login",
    description: `${client.fullName || client.email} signed in with Google.`,
    userName: client.fullName || client.email,
    relatedModule: "auth",
    type: "info",
    actionUrl: "/admin/clients",
  });

  return res.json({ ok: true, accessToken, client: toSafeClient(client) });
}
