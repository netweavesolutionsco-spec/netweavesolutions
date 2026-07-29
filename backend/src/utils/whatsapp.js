import { env } from "../config/env.js";

const GRAPH_VERSION = "v21.0";

function isConfigured() {
  return Boolean(
    env.WHATSAPP.phoneNumberId && env.WHATSAPP.accessToken && env.WHATSAPP.to.length > 0,
  );
}

async function postToGraph(payload) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${env.WHATSAPP.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.error?.message || res.statusText;
    throw new Error(`WhatsApp API ${res.status}: ${detail}`);
  }
  return body;
}

/**
 * Sends the new-lead alert to every number in WHATSAPP_TO.
 *
 * Meta only allows free-form text to a user within 24h of their last message
 * to the business. Since nobody messages us first here, we send an approved
 * *template* by default (WHATSAPP_TEMPLATE_NAME). The template must have a body
 * with the placeholders {{1}}..{{4}} — name, service, phone, message.
 *
 * Set WHATSAPP_USE_TEXT=true to send a plain text message instead, which only
 * works if the recipient number has messaged the business in the last 24h.
 *
 * Never throws — a WhatsApp outage must not fail the lead submission.
 */
export async function sendLeadWhatsApp(lead) {
  if (!isConfigured()) {
    console.warn("[whatsapp] not configured — skipping notification");
    return { sent: false, reason: "not_configured" };
  }

  const shortMessage = String(lead.message || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);

  const params = [
    lead.name || "Unknown",
    lead.service || "Not specified",
    lead.phone || "Not provided",
    shortMessage || "No details provided",
  ];

  const plainText =
    `🔔 *New project enquiry*\n\n` +
    `*Name:* ${lead.name}\n` +
    `*Email:* ${lead.email}\n` +
    `*Phone:* ${lead.phone || "—"}\n` +
    `*Company:* ${lead.company || "—"}\n` +
    `*Service:* ${lead.service || "—"}\n` +
    `*Budget:* ${lead.budget || "—"}\n\n` +
    `*Message:*\n${shortMessage}`;

  const results = await Promise.allSettled(
    env.WHATSAPP.to.map((to) =>
      postToGraph(
        env.WHATSAPP.useText
          ? {
              messaging_product: "whatsapp",
              to,
              type: "text",
              text: { preview_url: false, body: plainText },
            }
          : {
              messaging_product: "whatsapp",
              to,
              type: "template",
              template: {
                name: env.WHATSAPP.templateName,
                language: { code: env.WHATSAPP.templateLang },
                components: [
                  {
                    type: "body",
                    parameters: params.map((text) => ({ type: "text", text })),
                  },
                ],
              },
            },
      ),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected");
  failed.forEach((r) => console.error("[whatsapp] send failed:", r.reason?.message ?? r.reason));

  return { sent: failed.length < results.length, failed: failed.length, total: results.length };
}
