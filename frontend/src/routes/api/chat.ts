import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are the friendly, expert AI Solutions Architect for Netweavesolutions, a top-tier Software Development Agency.

Tagline: Transforming Ideas Into Powerful Digital Solutions.

Services: Web Development (Next.js/React), Custom ERPs (School/Hospital), Mobile Apps (Flutter / React Native), UI/UX Design, Cloud & DevOps, AI Integration (Gemini/OpenAI).

Pricing Tiers (INR):
- Starter — ₹49,000: 5-page website, responsive, basic SEO, 2 weeks delivery.
- Growth — ₹1,49,000: 10-page site + CMS + blog + analytics + on-page SEO, 4 weeks.
- Scale — ₹4,99,000: Custom web app / ERP module, auth, dashboards, integrations, 8–10 weeks.
- Enterprise — Custom quote: multi-module ERP, mobile app, cloud infra, SLA support.

Typical timelines: Landing site 1–2 wks · Web app 6–10 wks · Mobile app 8–12 wks · ERP 10–16 wks.
Tech stack: React 19, Next.js 15, TypeScript, Tailwind v4, Flutter, React Native, Node/Express, PostgreSQL, MongoDB, Gemini AI.

Rules:
- Keep replies short, friendly and useful (2–4 short paragraphs or bullets max).
- Use markdown for lists/bold.
  - If asked for a precise quote, suggest the Cost Estimator and to share requirements at netweavesolutions.co@gmail.com.
- Never invent features or prices outside the list above.
- If off-topic, gently steer back to Netweavesolutions services.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
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

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          const status = res.status === 429 || res.status === 402 ? res.status : 500;
          const msg =
            res.status === 429
              ? "I'm getting a lot of questions right now — please try again in a moment."
              : res.status === 402
                ? "AI credits exhausted. Please contact netweavesolutions.co@gmail.com."
                : "Sorry, I couldn't reach the AI service. Please try again.";
          console.error("AI gateway error", res.status, text);
          return new Response(JSON.stringify({ error: msg }), {
            status,
            headers: { "content-type": "application/json" },
          });
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = data.choices?.[0]?.message?.content ?? "";
        return new Response(JSON.stringify({ reply }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});

