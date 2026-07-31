import { createFileRoute } from "@tanstack/react-router";
import {
  buildKnowledgeContext,
  answerFromKnowledge,
  notFoundReply,
  serviceFailureReply,
} from "@/lib/site-knowledge";

/**
 * Production-ready AI chatbot endpoint.
 *
 * Architecture:
 *  - PRIMARY: Local knowledge-base engine answers common questions directly from
 *    website data (services, pricing, portfolio, FAQs, tech, company info).
 *    Works instantly, requires no API key, understands follow-up context.
 *  - ENHANCEMENT: When an AI provider key is configured, the LLM gets the full
 *    knowledge base injected as context and can handle nuanced/complex questions.
 *    Gracefully falls back to the local engine on failure/timeout.
 *  - FAILURE MODES:
 *    • Info genuinely not on the site → "I couldn't find that... connect with team"
 *    • AI service unreachable / times out → "I'm having trouble... contact team"
 *
 * The assistant always works, regardless of whether an API key is set. The LLM
 * is an accelerator, not a requirement.
 */

type Provider = {
  name: string;
  url: string;
  key: string;
  model: string;
};

/**
 * Resolve the AI provider from server-side env vars. Keys are never bundled to
 * the browser (this handler runs on the server). First configured provider wins.
 */
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

/**
 * Call the AI provider with the knowledge base injected. Returns the reply or
 * null on failure (timeout, network error, rate limit, etc).
 */
async function callAI(
  provider: Provider,
  history: Array<{ role: string; content: string }>,
  currentPage?: string,
): Promise<string | null> {
  const systemPrompt = `You are the friendly, expert assistant for **Netweavesolutions**, a premium software development agency.

**Your role:** Help visitors understand our services, pricing, portfolio, tech stack, and process. Answer naturally, keep replies short (2–4 paragraphs or bullets max), use markdown for lists/bold, and always ground answers in the knowledge base below — never invent features or prices.

If asked for an exact quote, suggest the Cost Calculator or to email ${buildKnowledgeContext().match(/email ([^\s,]+)/)?.[1] ?? "netweavesolutions.co@gmail.com"}. If off-topic, gently steer back to Netweavesolutions services.

---

# WEBSITE KNOWLEDGE BASE

${buildKnowledgeContext(currentPage)}
`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-20).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? ""),
    })),
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify({ model: provider.model, messages }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(
        `[ai-chat] ${provider.name} HTTP ${res.status}`,
        await res.text().catch(() => ""),
      );
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content ?? "";
    return reply || null;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.warn(`[ai-chat] ${provider.name} request timed out`);
    } else {
      console.error(`[ai-chat] ${provider.name} request failed`, error);
    }
    return null;
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: {
          messages?: Array<{ role: string; content: string }>;
          message?: string;
          currentPage?: string;
        };
        try {
          payload = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
        }

        const history = Array.isArray(payload.messages) ? payload.messages : [];
        if (payload.message && typeof payload.message === "string") {
          history.push({ role: "user", content: payload.message });
        }

        if (history.length === 0) {
          return new Response(JSON.stringify({ error: "No message provided" }), { status: 400 });
        }

        const userMessage = history[history.length - 1].content;
        const currentPage = payload.currentPage;

        // PRIMARY PATH: Try local knowledge-base engine first (instant, no API required).
        const localReply = answerFromKnowledge(userMessage, history.slice(0, -1));
        if (localReply) {
          return new Response(JSON.stringify({ reply: localReply }), {
            headers: { "content-type": "application/json" },
          });
        }

        // ENHANCEMENT PATH: If a provider is configured, try the LLM with full context.
        const provider = resolveProvider();
        if (provider) {
          // Attempt 1
          let aiReply = await callAI(provider, history, currentPage);

          // Retry once on failure
          if (!aiReply) {
            console.log(`[ai-chat] Retrying ${provider.name} after first failure`);
            aiReply = await callAI(provider, history, currentPage);
          }

          if (aiReply) {
            return new Response(JSON.stringify({ reply: aiReply }), {
              headers: { "content-type": "application/json" },
            });
          }

          // LLM failed twice — fall through to "service failure" message below.
          console.error(`[ai-chat] ${provider.name} failed after retry`);
        }

        // DECISION POINT:
        //  - If the local engine returned null, the question wasn't answerable from
        //    the knowledge base → "couldn't find that" response.
        //  - If a provider exists but failed, that's a genuine service failure →
        //    "having trouble accessing" response.
        //  - If no provider exists and the local engine couldn't answer, treat it as
        //    "couldn't find that" (not a service failure — the service works, we just
        //    don't have the info).

        if (provider) {
          // LLM was available but failed → service-failure message.
          return new Response(JSON.stringify({ reply: serviceFailureReply() }), {
            headers: { "content-type": "application/json" },
          });
        } else {
          // No LLM, local engine couldn't answer → not-found message.
          return new Response(JSON.stringify({ reply: notFoundReply() }), {
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
