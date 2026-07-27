import bcrypt from "bcryptjs";
import { z } from "zod";
import { Client } from "../models/Client.js";
import { env } from "../config/env.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
  newOpaqueToken,
  newJti,
  newOtp,
  refreshCookieOptions,
  REFRESH_COOKIE,
} from "../utils/tokens.js";
import { sendMail, emailTemplates } from "../utils/mailer.js";

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
async function issueSession(res, client) {
  const jti = newJti();
  client.refreshTokenJti = jti;
  client.lastLoginAt = new Date();
  await client.save();
  const accessToken = signAccessToken(client);
  const refreshToken = signRefreshToken(client, jti);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return accessToken;
}

// --- Handlers ---
export async function register(req, res) {
  const { fullName, email, phone, companyName, country, password, referralCode } = req.body;

  const existing = await Client.findOne({ email });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 12);
  const approvalToken = newOpaqueToken();
  const approvalExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const client = await Client.create({
    fullName,
    email,
    phone,
    companyName,
    country,
    referralCode,
    passwordHash,
    acceptedTerms: true,
    emailVerified: false,
    emailVerifyToken: approvalToken,
    emailVerifyExpires: approvalExpires,
  });

  const approvalLink = `${env.FRONTEND_PRIMARY}/client/verify-email?token=${approvalToken}`;
  const tpl = emailTemplates.verifyEmail(client.fullName, approvalLink);
  sendMail({ to: env.APPROVAL_EMAIL, ...tpl }).catch((e) => console.error("[mail]", e));

  return res.status(201).json({
    ok: true,
    message: "Account created successfully. Please wait for the company to approve your account.",
    client: client.toSafeJSON(),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const client = await Client.findOne({ email });
  if (!client) return res.status(401).json({ error: "Invalid credentials" });
  if (client.status !== "active") return res.status(403).json({ error: "Account suspended" });
  if (!client.emailVerified) {
    return res.status(403).json({ error: "Account pending approval. Please wait for company verification." });
  }
  const ok = await bcrypt.compare(password, client.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  client.lastLoginIp = req.ip;
  const accessToken = await issueSession(res, client);
  return res.json({ ok: true, accessToken, client: client.toSafeJSON() });
}

export async function logout(req, res) {
  const rt = req.cookies?.[REFRESH_COOKIE];
  if (rt) {
    try {
      const payload = verifyRefresh(rt);
      await Client.updateOne({ _id: payload.sub }, { $unset: { refreshTokenJti: 1 } });
    } catch {}
  }
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: 0 });
  return res.json({ ok: true });
}

export async function refresh(req, res) {
  const rt = req.cookies?.[REFRESH_COOKIE];
  if (!rt) return res.status(401).json({ error: "No refresh token" });
  let payload;
  try {
    payload = verifyRefresh(rt);
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
  const client = await Client.findById(payload.sub);
  if (!client || client.refreshTokenJti !== payload.jti || client.status !== "active") {
    return res.status(401).json({ error: "Session revoked" });
  }
  const accessToken = await issueSession(res, client);
  return res.json({ ok: true, accessToken, client: client.toSafeJSON() });
}

export async function me(req, res) {
  return res.json({ client: req.client.toSafeJSON() });
}

export async function verifyEmail(req, res) {
  const { token } = req.body;
  const client = await Client.findOne({
    emailVerifyToken: token,
    emailVerifyExpires: { $gt: new Date() },
  });
  if (!client) return res.status(400).json({ error: "Invalid or expired token" });
  client.emailVerified = true;
  client.emailVerifyToken = undefined;
  client.emailVerifyExpires = undefined;
  await client.save();
  return res.json({ ok: true });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const client = await Client.findOne({ email });
  // Always return ok to avoid user enumeration
  if (client) {
    const token = newOpaqueToken();
    client.passwordResetToken = token;
    client.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await client.save();
    const link = `${env.FRONTEND_PRIMARY}/client/reset-password?token=${token}`;
    const tpl = emailTemplates.resetPassword(client.fullName, link);
    sendMail({ to: email, ...tpl }).catch((e) => console.error("[mail]", e));
  }
  return res.json({ ok: true, message: "If that email exists, a reset link was sent." });
}

export async function resetPassword(req, res) {
  const { token, password } = req.body;
  const client = await Client.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!client) return res.status(400).json({ error: "Invalid or expired token" });
  client.passwordHash = await bcrypt.hash(password, 12);
  client.passwordResetToken = undefined;
  client.passwordResetExpires = undefined;
  client.refreshTokenJti = undefined; // invalidate other sessions
  await client.save();
  return res.json({ ok: true });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const ok = await bcrypt.compare(currentPassword, req.client.passwordHash);
  if (!ok) return res.status(400).json({ error: "Current password is incorrect" });
  req.client.passwordHash = await bcrypt.hash(newPassword, 12);
  await req.client.save();
  return res.json({ ok: true });
}

export async function sendOtp(req, res) {
  const code = newOtp();
  req.client.otpCode = code;
  req.client.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await req.client.save();
  const tpl = emailTemplates.otp(req.client.fullName, code);
  sendMail({ to: req.client.email, ...tpl }).catch((e) => console.error("[mail]", e));
  return res.json({ ok: true });
}

export async function verifyOtp(req, res) {
  const { otp } = req.body;
  if (
    !req.client.otpCode ||
    !req.client.otpExpires ||
    req.client.otpExpires < new Date() ||
    req.client.otpCode !== otp
  ) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }
  req.client.otpCode = undefined;
  req.client.otpExpires = undefined;
  await req.client.save();
  return res.json({ ok: true });
}
