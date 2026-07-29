import { z } from "zod";
import { createLeadRecord, DuplicateLeadError } from "../services/leads.service.js";
import { emailTemplates, sendMail } from "../utils/mailer.js";
import { sendLeadWhatsApp } from "../utils/whatsapp.js";
import { env } from "../config/env.js";

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

export const leadCreateSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(160),
  phone: optionalText(30),
  company: optionalText(120),
  service: optionalText(120),
  budget: optionalText(60),
  message: z.string().trim().min(10, "Tell us a bit more about your project").max(2000),
  source: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => v || "website"),
  // Honeypot: bots fill hidden fields, humans never see it.
  botField: z.string().max(0).optional().or(z.literal("")),
});

export async function createLead(req, res) {
  const { botField, ...lead } = req.body;

  // Silently accept and drop obvious bot submissions so scrapers get no signal.
  if (botField) {
    console.warn("[leads] honeypot triggered, dropping submission");
    return res.status(201).json({ ok: true, message: "Enquiry submitted successfully" });
  }

  let data;
  try {
    data = await createLeadRecord(lead);
  } catch (err) {
    if (err instanceof DuplicateLeadError) {
      return res.status(409).json({ ok: false, error: err.message });
    }
    console.error("[leads] insert failed:", err.cause ?? err);
    return res
      .status(500)
      .json({ ok: false, error: "Could not save your enquiry. Please try again." });
  }

  // Notifications must never block or fail the submission — the lead is already
  // safely persisted, so we fire and forget and only log failures.
  void notify(lead);

  return res.status(201).json({
    ok: true,
    message: "Enquiry submitted successfully",
    id: data.id,
    createdAt: data.created_at,
  });
}

async function notify(lead) {
  const adminMail = emailTemplates.newLead(lead);
  const clientMail = emailTemplates.leadThankYou(lead);

  const results = await Promise.allSettled([
    sendMail({
      to: env.LEAD_NOTIFY_EMAIL,
      subject: adminMail.subject,
      html: adminMail.html,
      text: adminMail.text,
    }),
    sendMail({
      to: lead.email,
      subject: clientMail.subject,
      html: clientMail.html,
      text: clientMail.text,
    }),
    sendLeadWhatsApp(lead),
  ]);

  const labels = ["admin email", "client auto-reply", "whatsapp"];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[leads] ${labels[i]} failed:`, r.reason?.message ?? r.reason);
    }
  });
}
