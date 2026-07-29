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

  /** Internal alert sent to the team when a website enquiry arrives. */
  newLead: (lead) => {
    const row = (label, value) =>
      value
        ? `<tr>
             <td style="padding:8px 14px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap">${label}</td>
             <td style="padding:8px 14px;border:1px solid #e2e8f0">${esc(value)}</td>
           </tr>`
        : "";

    return {
      subject: `New project enquiry — ${lead.name}${lead.service ? ` (${lead.service})` : ""}`,
      text:
        `New project enquiry\n\n` +
        `Name: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || "-"}\n` +
        `Company: ${lead.company || "-"}\nService: ${lead.service || "-"}\n` +
        `Budget: ${lead.budget || "-"}\nSource: ${lead.source || "-"}\n\n` +
        `Message:\n${lead.message || "-"}\n`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
        <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:22px 26px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;color:#fff;font-size:19px">🔔 New project enquiry</h2>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px">Submitted via the website enquiry form</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:22px 26px;background:#fff">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${row("Name", lead.name)}
            ${row("Email", lead.email)}
            ${row("Phone", lead.phone)}
            ${row("Company", lead.company)}
            ${row("Service", lead.service)}
            ${row("Budget", lead.budget)}
            ${row("Source", lead.source)}
          </table>
          <h3 style="margin:22px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#64748b">Message</h3>
          <div style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(lead.message || "-")}</div>
          <div style="margin-top:24px">
            <a href="mailto:${encodeURIComponent(lead.email)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600">Reply to ${esc(lead.name)}</a>
            ${
              lead.phone
                ? `<a href="https://wa.me/${String(lead.phone).replace(/[^\d]/g, "")}" style="display:inline-block;margin-left:8px;background:#25d366;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600">WhatsApp</a>`
                : ""
            }
          </div>
          <p style="margin:22px 0 0;font-size:12px;color:#94a3b8">This lead is also saved in the admin panel under <b>Leads</b>.</p>
        </div>
      </div>`,
    };
  },

  /** Auto-reply confirmation sent to the person who filled in the form. */
  leadThankYou: (lead) => ({
    subject: "We've received your project enquiry — Netweavesolutions",
    text:
      `Hi ${lead.name},\n\n` +
      `Thanks for reaching out to Netweavesolutions. We've received your enquiry and a member of our team will get back to you within 24 hours.\n\n` +
      `Here's a copy of what you sent us:\n` +
      `Service: ${lead.service || "-"}\nBudget: ${lead.budget || "-"}\n\n${lead.message || "-"}\n\n` +
      `If it's urgent, reply to this email or message us on WhatsApp.\n\n— Team Netweavesolutions`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
      <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:30px 26px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:22px">Thanks for reaching out! 🎉</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:26px;background:#fff;font-size:15px;line-height:1.65">
        <p style="margin:0 0 14px">Hi <b>${esc(lead.name)}</b>,</p>
        <p style="margin:0 0 14px">
          We've received your project enquiry and it's now with our team. Someone will review the
          details and get back to you <b>within 24 hours</b> with next steps.
        </p>
        <div style="margin:22px 0;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
          <p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;font-weight:700">Your submission</p>
          ${lead.service ? `<p style="margin:0 0 6px;font-size:14px"><b>Service:</b> ${esc(lead.service)}</p>` : ""}
          ${lead.budget ? `<p style="margin:0 0 6px;font-size:14px"><b>Budget:</b> ${esc(lead.budget)}</p>` : ""}
          <p style="margin:10px 0 0;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#334155">${esc(lead.message || "")}</p>
        </div>
        <p style="margin:0 0 14px">
          In the meantime, feel free to reply to this email with anything else you'd like us to know —
          designs, references, deadlines, all of it helps.
        </p>
        <p style="margin:24px 0 0;color:#475569">Warm regards,<br/><b style="color:#0f172a">Team Netweavesolutions</b></p>
      </div>
      <p style="text-align:center;margin:16px 0 0;font-size:12px;color:#94a3b8">
        You're receiving this because you submitted an enquiry on our website.
      </p>
    </div>`,
  }),
};

/** Minimal HTML escaping so user-supplied text can't inject markup into emails. */
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

