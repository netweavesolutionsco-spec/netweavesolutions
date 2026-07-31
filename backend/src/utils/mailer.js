import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

/**
 * Whether a real SMTP transport is configured. Callers that must GUARANTEE
 * delivery (e.g. email verification) check this so they can fall back to
 * another channel instead of trusting a silent no-op send.
 */
export function isMailConfigured() {
  return Boolean(env.SMTP.host);
}

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
    // No SMTP configured: log for local development and signal to the caller
    // (via the return value) that nothing was actually delivered. Previously
    // this returned undefined, which callers read as success.
    console.log("[mail:dev]", { to, subject, text: text || html });
    return { delivered: false };
  }
  await t.sendMail({ from: env.SMTP.from, to, subject, html, text });
  return { delivered: true };
}

export const emailTemplates = {
  /**
   * Sent to a newly registered client. Their account stays inactive until this
   * link is opened, so this is the only thing standing between signup and a
   * usable login — keep it short and make the button impossible to miss.
   */
  verifyEmail: (name, link) => ({
    subject: "Verify your email — Netweavesolutions",
    text:
      `Hi ${name || "there"},\n\n` +
      `Thanks for creating a Netweavesolutions account. Confirm your email address to activate it:\n\n${link}\n\n` +
      `You won't be able to sign in until your email is verified. This link expires in 24 hours.\n\n` +
      `If you didn't create this account, you can safely ignore this email.\n\n— Team Netweavesolutions`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
      <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:30px 26px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:22px">Confirm your email</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:26px;background:#fff;font-size:15px;line-height:1.65">
        <p style="margin:0 0 14px">Hi <b>${esc(name || "there")}</b>,</p>
        <p style="margin:0 0 20px">
          Thanks for creating a Netweavesolutions account. Confirm your email address to activate it —
          you won't be able to sign in until you do.
        </p>
        <p style="margin:0 0 20px;text-align:center">
          <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600">Verify my email</a>
        </p>
        <p style="margin:0 0 14px;font-size:13px;color:#64748b">
          If the button doesn't work, paste this link into your browser:<br/>
          <span style="word-break:break-all;color:#4f46e5">${link}</span>
        </p>
        <p style="margin:0 0 14px;font-size:13px;color:#64748b">This link expires in 24 hours.</p>
        <p style="margin:22px 0 0;color:#475569">
          Didn't create this account? You can safely ignore this email.<br/>
          <b style="color:#0f172a">Team Netweavesolutions</b>
        </p>
      </div>
    </div>`,
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
    text:
      `Hi ${name || "there"},\n\n` +
      `Your one-time verification code is ${code}. It expires in 10 minutes.\n\n` +
      `If you didn't request this code, ignore this email.\n\n— Team Netweavesolutions`,
    html: `<p>Hi ${esc(name || "there")},</p>
      <p>Your one-time code is <b style="font-size:20px">${esc(code)}</b>. It expires in 10 minutes.</p>
      <p style="font-size:13px;color:#64748b">If you didn't request this code, ignore this email.</p>`,
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

  /** Internal alert sent to the team when a client schedules a meeting. */
  newMeeting: (meeting) => {
    const row = (label, value) =>
      value
        ? `<tr>
             <td style="padding:8px 14px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap">${label}</td>
             <td style="padding:8px 14px;border:1px solid #e2e8f0">${esc(value)}</td>
           </tr>`
        : "";

    return {
      subject: `New meeting request — ${meeting.clientName || meeting.clientEmail} (${meeting.platformLabel})`,
      text:
        `New meeting request\n\n` +
        `Client: ${meeting.clientName || "-"}\nEmail: ${meeting.clientEmail || "-"}\n` +
        `Platform: ${meeting.platformLabel}\nDate: ${meeting.date}\nTime: ${meeting.time}\n` +
        `Topic: ${meeting.title}\n\nDescription:\n${meeting.agenda || "-"}\n`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
        <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:22px 26px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;color:#fff;font-size:19px">📅 New meeting request</h2>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px">Scheduled from the client portal</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:22px 26px;background:#fff">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${row("Client Name", meeting.clientName)}
            ${row("Client Email", meeting.clientEmail)}
            ${row("Platform", meeting.platformLabel)}
            ${row("Date", meeting.date)}
            ${row("Time", meeting.time)}
            ${row("Topic", meeting.title)}
          </table>
          <h3 style="margin:22px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#64748b">Description</h3>
          <div style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(meeting.agenda || "-")}</div>
          <p style="margin:22px 0 0;font-size:12px;color:#94a3b8">Manage this request in the admin panel under <b>Meeting Requests</b>.</p>
        </div>
      </div>`,
    };
  },

  /**
   * Confirmation sent to the client who scheduled a meeting. Includes the
   * platform, date, time, topic and the meeting link so they have everything
   * they need in one place.
   */
  meetingConfirmation: (meeting) => {
    const row = (label, value) =>
      value
        ? `<tr>
             <td style="padding:8px 14px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap">${label}</td>
             <td style="padding:8px 14px;border:1px solid #e2e8f0">${esc(value)}</td>
           </tr>`
        : "";

    const linkButton = meeting.meetingLink
      ? `<p style="margin:22px 0 0;text-align:center">
           <a href="${esc(meeting.meetingLink)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600">Join meeting</a>
         </p>`
      : "";

    return {
      subject: `Meeting request received — ${meeting.title}`,
      text:
        `Hi ${meeting.clientName || "there"},\n\n` +
        `We've received your meeting request. Here are the details:\n\n` +
        `Platform: ${meeting.platformLabel}\nDate: ${meeting.date}\nTime: ${meeting.time}\n` +
        `Topic: ${meeting.title}\n` +
        `Meeting Link: ${meeting.meetingLink || "-"}\n\n` +
        `Your request is currently pending — we'll confirm shortly.\n\n— Team Netweavesolutions`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
        <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:26px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:21px">📅 Meeting request received</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px 26px;background:#fff;font-size:15px;line-height:1.65">
          <p style="margin:0 0 16px">Hi <b>${esc(meeting.clientName || "there")}</b>,</p>
          <p style="margin:0 0 18px">Thanks — we've received your meeting request. Here's a summary of what you scheduled:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${row("Platform", meeting.platformLabel)}
            ${row("Date", meeting.date)}
            ${row("Time", meeting.time)}
            ${row("Topic", meeting.title)}
            ${row("Meeting Link", meeting.meetingLink)}
          </table>
          ${linkButton}
          <p style="margin:22px 0 0;color:#475569;font-size:14px">
            Your request is currently <b>pending</b>. We'll review it and confirm shortly.<br/>
            <b style="color:#0f172a">Team Netweavesolutions</b>
          </p>
        </div>
      </div>`,
    };
  },

  /**
   * Sent to the client when the team updates their meeting (status change,
   * rescheduled time, or edited details).
   */
  meetingUpdated: (meeting) => {
    const row = (label, value) =>
      value
        ? `<tr>
             <td style="padding:8px 14px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap">${label}</td>
             <td style="padding:8px 14px;border:1px solid #e2e8f0">${esc(value)}</td>
           </tr>`
        : "";

    const linkButton = meeting.meetingLink
      ? `<p style="margin:22px 0 0;text-align:center">
           <a href="${esc(meeting.meetingLink)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600">Join meeting</a>
         </p>`
      : "";

    return {
      subject: `Your meeting has been updated — ${meeting.title}`,
      text:
        `Hi ${meeting.clientName || "there"},\n\n` +
        `Your meeting has been updated. Here are the latest details:\n\n` +
        `Status: ${meeting.statusLabel}\nPlatform: ${meeting.platformLabel}\n` +
        `Date: ${meeting.date}\nTime: ${meeting.time}\nTopic: ${meeting.title}\n` +
        `Meeting Link: ${meeting.meetingLink || "-"}\n\n— Team Netweavesolutions`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
        <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:26px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:21px">🔄 Your meeting has been updated</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px 26px;background:#fff;font-size:15px;line-height:1.65">
          <p style="margin:0 0 16px">Hi <b>${esc(meeting.clientName || "there")}</b>,</p>
          <p style="margin:0 0 18px">Your meeting has been updated. Here are the latest details:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${row("Status", meeting.statusLabel)}
            ${row("Platform", meeting.platformLabel)}
            ${row("Date", meeting.date)}
            ${row("Time", meeting.time)}
            ${row("Topic", meeting.title)}
            ${row("Meeting Link", meeting.meetingLink)}
          </table>
          ${linkButton}
          <p style="margin:22px 0 0;color:#475569;font-size:14px"><b style="color:#0f172a">Team Netweavesolutions</b></p>
        </div>
      </div>`,
    };
  },

  /** Internal alert sent to the team when a client submits a support request. */
  newSupportRequest: (ticket) => {
    const row = (label, value) =>
      value
        ? `<tr>
             <td style="padding:8px 14px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap">${label}</td>
             <td style="padding:8px 14px;border:1px solid #e2e8f0">${esc(value)}</td>
           </tr>`
        : "";

    return {
      subject: `New support request — ${ticket.subject} (${ticket.priority})`,
      text:
        `New support request\n\n` +
        `Client: ${ticket.clientName || "-"}\nEmail: ${ticket.clientEmail || "-"}\n` +
        `Subject: ${ticket.subject}\nPriority: ${ticket.priority}\n\nMessage:\n${ticket.message || "-"}\n`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
        <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:22px 26px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;color:#fff;font-size:19px">🛟 New support request</h2>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px">Submitted from the client portal</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:22px 26px;background:#fff">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${row("Client Name", ticket.clientName)}
            ${row("Client Email", ticket.clientEmail)}
            ${row("Subject", ticket.subject)}
            ${row("Priority", ticket.priority)}
          </table>
          <h3 style="margin:22px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#64748b">Message</h3>
          <div style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(ticket.message || "-")}</div>
          <p style="margin:22px 0 0;font-size:12px;color:#94a3b8">Manage this request in the admin panel under <b>Support Requests</b>.</p>
        </div>
      </div>`,
    };
  },

  /**
   * Company notification for a project brief submitted from the Contact page
   * by a signed-in client. Mirrors newSupportRequest so both admin alerts read
   * the same way in the inbox.
   */
  newProjectRequirement: (requirement) => {
    const row = (label, value) =>
      value
        ? `<tr>
             <td style="padding:8px 14px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap">${label}</td>
             <td style="padding:8px 14px;border:1px solid #e2e8f0">${esc(value)}</td>
           </tr>`
        : "";

    return {
      subject: `New project requirement — ${requirement.clientName || requirement.clientEmail}`,
      text:
        `New project requirement\n\n` +
        `Client: ${requirement.clientName || "-"}\nEmail: ${requirement.clientEmail || "-"}\n` +
        `Phone: ${requirement.phone || "-"}\nCompany: ${requirement.company || "-"}\n` +
        `Service: ${requirement.service || "-"}\nBudget: ${requirement.budget || "-"}\n` +
        `Timeline: ${requirement.timeline || "-"}\n\nRequirement:\n${requirement.requirement || "-"}\n`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
        <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:22px 26px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;color:#fff;font-size:19px">📋 New project requirement</h2>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px">Submitted from the contact page by a verified client</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:22px 26px;background:#fff">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${row("Client Name", requirement.clientName)}
            ${row("Client Email", requirement.clientEmail)}
            ${row("Phone", requirement.phone)}
            ${row("Company", requirement.company)}
            ${row("Service", requirement.service)}
            ${row("Budget", requirement.budget)}
            ${row("Timeline", requirement.timeline)}
          </table>
          <h3 style="margin:22px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#64748b">Requirement</h3>
          <div style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(requirement.requirement || "-")}</div>
          <p style="margin:22px 0 0;font-size:12px;color:#94a3b8">Manage this brief in the admin panel under <b>Project Requirements</b>.</p>
        </div>
      </div>`,
    };
  },

  /**
   * Sent to a prospective team member when an admin invites them from the Admin
   * Panel. Company-branded, names the inviter and the assigned role, and carries
   * a single primary "Accept Invitation" button pointing at the tokenised setup
   * link. Kept visually consistent with the client-facing templates above.
   */
  teamInvitation: ({ fullName, inviterName, role, department, message, acceptUrl, expiresLabel }) => ({
    subject: `You're invited to join the Netweavesolutions team`,
    text:
      `Hi ${fullName || "there"},\n\n` +
      `${inviterName || "An administrator"} has invited you to join the Netweavesolutions team` +
      `${role ? ` as ${role}` : ""}${department ? ` (${department})` : ""}.\n\n` +
      (message ? `Message from ${inviterName || "the team"}:\n${message}\n\n` : "") +
      `Accept your invitation and set up your account here:\n${acceptUrl}\n\n` +
      `This invitation${expiresLabel ? ` expires ${expiresLabel}` : " will expire"}. ` +
      `If you weren't expecting this, you can safely ignore this email.\n\n— Team Netweavesolutions`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
      <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4);padding:30px 26px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:22px">You're invited 🎉</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px">Join the Netweavesolutions team</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:26px;background:#fff;font-size:15px;line-height:1.65">
        <p style="margin:0 0 14px">Hi <b>${esc(fullName || "there")}</b>,</p>
        <p style="margin:0 0 18px">
          <b>${esc(inviterName || "An administrator")}</b> has invited you to join the
          <b>Netweavesolutions</b> team${role ? ` as <b>${esc(role)}</b>` : ""}${department ? ` in <b>${esc(department)}</b>` : ""}.
        </p>
        ${
          message
            ? `<div style="margin:0 0 20px;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap;color:#334155">${esc(message)}</div>`
            : ""
        }
        <p style="margin:0 0 20px;text-align:center">
          <a href="${esc(acceptUrl)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600">Accept Invitation</a>
        </p>
        <p style="margin:0 0 14px;font-size:13px;color:#64748b">
          If the button doesn't work, paste this link into your browser:<br/>
          <span style="word-break:break-all;color:#4f46e5">${esc(acceptUrl)}</span>
        </p>
        <p style="margin:0 0 14px;font-size:13px;color:#64748b">This invitation${expiresLabel ? ` expires ${esc(expiresLabel)}` : " will expire"}.</p>
        <p style="margin:22px 0 0;color:#475569">
          Weren't expecting this? You can safely ignore this email.<br/>
          <b style="color:#0f172a">Team Netweavesolutions</b>
        </p>
      </div>
    </div>`,
  }),

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

