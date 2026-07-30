import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are the friendly, expert AI Solutions Architect for Netweavesolutions, a top-tier Software Development Agency.

Tagline: Transforming Ideas Into Powerful Digital Solutions.

Services: Website Development, Custom ERPs (School/Hospital), Mobile Apps (Flutter / React Native), Custom Software, and UI/UX Design.

Pricing Tiers (INR):
- Starter — ₹15,000: up to 5-page responsive website.
- Professional — ₹49,000: complex website, web app, CMS dashboard, ERP/CRM base module, or mobile app scope.
- Enterprise — ₹1,49,000: multi-module ERP, SaaS, mobile apps, custom software, and dedicated engineering team.

Typical timelines: Landing site 1–2 wks · Web app 6–10 wks · Mobile app 8–12 wks · ERP 10–16 wks.
Tech stack: React 19, Next.js 15, TypeScript, Tailwind v4, Flutter, React Native, Node/Express, PostgreSQL and MongoDB.

Rules:
- Keep replies short, friendly and useful (2–4 short paragraphs or bullets max).
- Use markdown for lists/bold.
  - If asked for a precise quote, suggest the Cost Estimator and to share requirements at netweavesolutions.co@gmail.com.
- Never invent features or prices outside the list above.
- If off-topic, gently steer back to Netweavesolutions services.`;

/**
 * Provider resolution. Keys are read from server-side env only — they are never
 * bundled into the browser (this handler runs on the server), so no key is ever
 * exposed to the frontend.
 *
 * The first configured provider wins, so an existing Lovable deployment keeps
 * working untouched while self-hosted deploys can use Gemini or any
 * OpenAI-compatible endpoint instead.
 */
type Provider = {
  name: string;
  url: string;
  key: string;
  model: string;
};

function resolveProvider(): Provider | null {
  const lovable = process.env.LOVABLE_API_KEY;
  if (lovable) {
    return {
      name: "lovable",
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: lovable,
      model: process.env.AI_MODEL || "google/gemini-2.5-flash",
    };
  }

  const gemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (gemini) {
    // Google exposes an OpenAI-compatible surface, so the request/response
    // shape below stays identical across every provider.
    return {
      name: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: gemini,
      model: process.env.AI_MODEL || "gemini-2.0-flash",
    };
  }

  const openai = process.env.OPENAI_API_KEY;
  if (openai) {
    return {
      name: "openai",
      url: process.env.OPENAI_BASE_URL
        ? `${process.env.OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`
        : "https://api.openai.com/v1/chat/completions",
      key: openai,
      model: process.env.AI_MODEL || "gpt-4o-mini",
    };
  }

  return null;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provider = resolveProvider();
        if (!provider) {
          console.error(
            "[ai-chat] No AI provider configured. Set GEMINI_API_KEY, OPENAI_API_KEY or LOVABLE_API_KEY.",
          );
          return new Response(
            JSON.stringify({
              error:
                "The AI assistant isn't available right now. Please email netweavesolutions.co@gmail.com and our team will help you directly.",
            }),
            { status: 503, headers: { "content-type": "application/json" } },
          );
        }

        let payload: { messages?: Array<{ role: string; content: string }>; message?: string };
        try {
          payload = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
        }

        const history = Array.isArray(payload.messages) ? payload.messages : [];
        if (payload.message && typeof payload.message === "string") {
          history.push({ role: "user", content: payload.message });
        }

        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.slice(-20).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content ?? ""),
          })),
        ];

        let res: Response;
        try {
          res = await fetch(provider.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${provider.key}`,
            },
            body: JSON.stringify({
              model: provider.model,
              messages,
            }),
          });
        } catch (error) {
          console.error(`[ai-chat] ${provider.name} request failed`, error);
          return new Response(
            JSON.stringify({
              error: "Sorry, I couldn't reach the AI service. Please try again in a moment.",
            }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          const status = res.status === 429 || res.status === 402 ? res.status : 502;
          const msg =
            res.status === 429
              ? "I'm getting a lot of questions right now — please try again in a moment."
              : res.status === 402
                ? "AI credits exhausted. Please contact netweavesolutions.co@gmail.com."
                : res.status === 401 || res.status === 403
                  ? "The AI assistant isn't configured correctly. Please contact netweavesolutions.co@gmail.com."
                  : "Sorry, I couldn't reach the AI service. Please try again.";
          console.error(`[ai-chat] ${provider.name} error`, res.status, text);
          return new Response(JSON.stringify({ error: msg }), {
            status,
            headers: { "content-type": "application/json" },
          });
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = data.choices?.[0]?.message?.content ?? "";
        if (!reply) {
          return new Response(
            JSON.stringify({
              error: "I didn't get a reply that time — could you rephrase your question?",
            }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ reply }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
