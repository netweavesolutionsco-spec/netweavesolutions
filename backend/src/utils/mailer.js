import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;
function getTransport() {
  if (transporter) return transporter;
  if (!env.SMTP.host) {
    console.warn("[mail] SMTP not configured — emails will be logged only");
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP.host,
    port: env.SMTP.port,
    secure: env.SMTP.port === 465,
    auth: env.SMTP.user ? { user: env.SMTP.user, pass: env.SMTP.pass } : undefined,
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransport();
  if (!t) {
    console.log("[mail:dev]", { to, subject, text: text || html });
    return;
  }
  await t.sendMail({ from: env.SMTP.from, to, subject, html, text });
}

export const emailTemplates = {
  verifyEmail: (name, link) => ({
    subject: "New client account awaiting approval",
    html: `<p>Hi team,</p>
      <p>A new client account for ${name || "a new user"} is waiting for approval.</p>
      <p>Use the button below to approve the account:</p>
      <p><a href="${link}">Approve account</a></p>
      <p>Link expires in 24 hours.</p>`,
  }),
  resetPassword: (name, link) => ({
    subject: "Reset your Netweavesolutions password",
    html: `<p>Hi ${name || "there"},</p>
      <p>Click below to reset your password. If you didn't request this, ignore this email.</p>
      <p><a href="${link}">Reset password</a></p>
      <p>Link expires in 1 hour.</p>`,
  }),
  otp: (name, code) => ({
    subject: `Your Netweavesolutions verification code: ${code}`,
    html: `<p>Hi ${name || "there"},</p>
      <p>Your one-time code is <b style="font-size:20px">${code}</b>. It expires in 10 minutes.</p>`,
  }),
};

