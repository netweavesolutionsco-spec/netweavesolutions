/**
 * Website knowledge base for the AI assistant.
 *
 * This is the single source of truth the chatbot is "trained" on. It is built
 * from the same data files the website renders from (services, pricing, FAQs,
 * portfolio, brand), so the assistant always reflects the live site — update a
 * service or a project and the assistant knows about it automatically.
 *
 * Two consumers:
 *  - `buildKnowledgeContext()` → a compact text block injected into every LLM
 *    request so the model answers strictly from real site content.
 *  - `answerFromKnowledge()`   → a deterministic, no-API answer engine used both
 *    as the primary responder when no AI provider is configured and as the
 *    graceful fallback when the provider fails. It understands follow-up
 *    questions using the recent conversation.
 *
 * Nothing here is browser-only; the module is imported by the server route.
 */
import { services } from "@/data/services";
import { plans, comparison } from "@/data/pricing";
import { faqs } from "@/data/faqs";
import { projects } from "@/data/portfolio";
import { brand } from "@/data/brand";

export const NAV = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Pricing", path: "/pricing" },
  { label: "Blog", path: "/blog" },
  { label: "Careers", path: "/careers" },
  { label: "Contact", path: "/contact" },
];

export const COMPANY = {
  name: brand.name,
  tagline: brand.tagline,
  description: brand.description,
  email: brand.email,
  phone: brand.phone,
  whatsapp: brand.whatsapp,
  location: brand.address,
  // Derived positioning statements (kept factual, drawn from site copy).
  about:
    "Netweavesolutions is a premium software development agency. We design, build and scale " +
    "websites, mobile apps, custom software and ERPs for startups and established teams alike. " +
    "Senior engineers own the work end-to-end, we ship in tight weekly loops, and clients keep " +
    "100% of the source code and IP.",
  process: [
    "Discovery call — we learn your goals, scope and constraints, then share a detailed plan.",
    "Design — research-led UI/UX, systemised and reviewed with you.",
    "Build — small senior team, weekly demos on staging so you always see progress.",
    "Launch — deploy to production with monitoring and a smooth handover.",
    "Support — 30-day warranty plus optional monthly care plans.",
  ],
  international:
    "Yes — we work with clients internationally and collaborate remotely across time zones.",
};

export const TECH = [
  "React 19",
  "Next.js 15",
  "TypeScript",
  "Tailwind CSS v4",
  "Node.js / Express",
  "PostgreSQL",
  "MongoDB",
  "React Native",
  "Flutter",
  "Supabase",
  "Cloud deployment (AWS, Vercel, Render)",
];

const money = (s: string) => s;

/** A compact plain-text digest of everything the assistant knows. */
export function buildKnowledgeContext(currentPage?: string): string {
  const lines: string[] = [];

  lines.push(`COMPANY: ${COMPANY.name} — ${COMPANY.tagline}`);
  lines.push(COMPANY.description);
  lines.push(
    `Contact: email ${COMPANY.email}, phone ${COMPANY.phone}, WhatsApp ${COMPANY.whatsapp}, based in ${COMPANY.location}. Works internationally.`,
  );

  lines.push("\nSERVICES:");
  for (const s of services) {
    lines.push(`- ${s.title} (${s.category}): ${s.description}`);
    if (s.items?.length) lines.push(`  Includes: ${s.items.join(", ")}.`);
  }
  lines.push(
    "- AI Solutions: Gemini/LLM-powered assistants, RAG chatbots and automation (see CogniBot in portfolio).",
  );

  lines.push("\nPRICING (INR, one-time; monthly options available):");
  for (const p of plans) {
    lines.push(
      `- ${p.name}: ${money(p.price)} ${p.period}${
        p.monthlyPrice ? ` (or ${p.monthlyPrice}/${p.monthlyPeriod})` : ""
      } — ${p.tagline} Features: ${p.features.join("; ")}.`,
    );
  }
  lines.push(
    `Plan comparison: ${comparison
      .map(
        (c) =>
          `${c.feature} → Starter: ${fmt(c.starter)}, Pro: ${fmt(c.pro)}, Enterprise: ${fmt(
            c.enterprise,
          )}`,
      )
      .join(" | ")}.`,
  );

  lines.push("\nTECH STACK: " + TECH.join(", ") + ".");

  lines.push("\nDEVELOPMENT PROCESS: " + COMPANY.process.join(" → "));

  lines.push("\nPORTFOLIO / PROJECTS:");
  for (const p of projects) {
    lines.push(
      `- ${p.title} (${p.categoryLabel ?? p.category}): ${p.summary} ${p.description}` +
        `${p.tech?.length ? ` Tech: ${p.tech.join(", ")}.` : ""}` +
        `${p.isLive && p.liveUrl ? ` Live: ${p.liveUrl}.` : ""}`,
    );
  }

  lines.push("\nFAQs:");
  for (const f of faqs) lines.push(`- Q: ${f.q}\n  A: ${f.a}`);

  lines.push("\nNAVIGATION: " + NAV.map((n) => `${n.label} (${n.path})`).join(", ") + ".");

  if (currentPage) lines.push(`\nThe visitor is currently on: ${currentPage}`);

  return lines.join("\n");
}

function fmt(v: string | boolean): string {
  if (v === true) return "Yes";
  if (v === false) return "—";
  return v;
}

/* --------------------------------------------------------------------------
 * Deterministic answer engine (no API required)
 * ------------------------------------------------------------------------ */

type ChatMsg = { role: string; content: string };

const CONTACT_LINE = `📧 **[${COMPANY.email}](mailto:${COMPANY.email})** · 📱 WhatsApp **+${COMPANY.whatsapp}**`;

/** Topics we can resolve locally; used for follow-up detection. */
type Topic =
  | "services"
  | "pricing"
  | "timeline"
  | "mobile"
  | "web"
  | "erp"
  | "saas"
  | "ai"
  | "design"
  | "dashboard"
  | "cloud"
  | "tech"
  | "portfolio"
  | "maintenance"
  | "contact"
  | "process"
  | "start"
  | "international"
  | "about"
  | null;

function detectTopic(text: string): Topic {
  const t = text.toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));

  // Specific project lookups are handled separately (projectMatch).
  if (has("price", "cost", "pricing", "quote", "charge", "budget", "how much", "rate"))
    return "pricing";
  if (has("how long", "timeline", "time to", "duration", "how much time", "delivery time"))
    return "timeline";
  if (has("maintenance", "support", "warranty", "care plan", "after launch")) return "maintenance";
  if (has("contact", "email", "phone", "whatsapp", "reach", "talk to", "get in touch"))
    return "contact";
  if (has("start", "begin", "kick off", "get started", "onboard")) return "start";
  if (has("process", "workflow", "how do you work", "steps", "methodology")) return "process";
  if (has("international", "worldwide", "global", "outside india", "other countries", "abroad"))
    return "international";
  if (has("about", "who are you", "company", "your team", "tell me about netweave")) return "about";
  if (has("mobile", "app", "android", "ios", "flutter", "react native")) return "mobile";
  if (has("erp", "crm", "school management", "hospital", "inventory", "hr system", "attendance"))
    return "erp";
  if (has("saas", "multi-tenant", "subscription platform", "platform")) return "saas";
  if (has("ai ", "a.i", "chatbot", "llm", "gemini", "machine learning", "artificial intelligence"))
    return "ai";
  if (has("ui", "ux", "design", "figma", "branding", "logo")) return "design";
  if (has("dashboard", "admin panel", "analytics panel", "reporting")) return "dashboard";
  if (has("cloud", "deploy", "hosting", "devops", "aws", "vercel", "render")) return "cloud";
  if (has("tech", "stack", "framework", "language", "technolog")) return "tech";
  if (
    has("portfolio", "projects", "case study", "case studies", "work you", "your work", "examples")
  )
    return "portfolio";
  if (has("website", "web app", "web development", "landing", "web site")) return "web";
  if (has("service", "offer", "provide", "do you build", "do you do", "can you build", "help with"))
    return "services";
  return null;
}

/** Find a specific portfolio project mentioned by name. */
function projectMatch(text: string) {
  const t = text.toLowerCase();
  return projects.find((p) => {
    const title = p.title.toLowerCase();
    if (t.includes(title)) return true;
    // Match distinctive keywords from the title (skip generic words).
    const keywords = title
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !["mobile", "app", "the", "enterprise"].includes(w));
    return keywords.some((k) => t.includes(k));
  });
}

function servicesAnswer(): string {
  const list = services.map((s) => `- **${s.title}** — ${s.description}`).join("\n");
  return (
    `### What we do\n\nWe're an end-to-end software agency. Our core services:\n\n${list}\n` +
    `- **AI Solutions** — Gemini/LLM assistants, RAG chatbots and workflow automation.\n\n` +
    `Want details or a quote? Tell me your project and I'll point you the right way. ` +
    `You can also browse [Services](/services) or [Pricing](/pricing).`
  );
}

function pricingAnswer(topicHint?: Topic): string {
  const rows = plans
    .map(
      (p) =>
        `- **${p.name}** — ${p.price} ${p.period}` +
        `${p.monthlyPrice ? ` _(or ${p.monthlyPrice}/${p.monthlyPeriod})_` : ""}\n  ${p.tagline}`,
    )
    .join("\n");
  const hint =
    topicHint === "web"
      ? "\n\nA typical **5-page website** fits the **Starter Plan (₹15,000)**; a larger custom site or web app is **Professional (₹49,000)**."
      : topicHint === "mobile"
        ? "\n\nA single mobile app (iOS or Android, Flutter) is covered by the **Professional Plan (₹49,000)**; dual native apps sit in **Enterprise**."
        : topicHint === "erp" || topicHint === "saas"
          ? "\n\nERP / SaaS platforms are **Enterprise (₹1,49,000)** — multi-module, multi-tenant, with a dedicated engineering team."
          : "";
  return (
    `### Pricing\n\nTransparent, one-time pricing (monthly options too):\n\n${rows}${hint}\n\n` +
    `For an exact figure, use our **Cost Calculator** (chip below) or share requirements at ${CONTACT_LINE}. ` +
    `Full breakdown on the [Pricing page](/pricing).`
  );
}

function timelineAnswer(): string {
  return (
    `### Typical timelines\n\n` +
    `- **Marketing / landing site:** 2–4 weeks\n` +
    `- **Web app or custom software:** 8–16 weeks\n` +
    `- **Mobile app:** 8–12 weeks\n` +
    `- **ERP / multi-module platform:** 10–16 weeks\n\n` +
    `Timelines depend on scope — we share a **detailed plan after a discovery call**. Want to book one? ${CONTACT_LINE}`
  );
}

function projectAnswer(p: (typeof projects)[number]): string {
  const tech = p.tech?.length ? `\n\n**Tech:** ${p.tech.join(", ")}` : "";
  const live =
    p.isLive && p.liveUrl
      ? `\n\n🔗 **Live:** [${p.liveUrl.replace(/^https?:\/\//, "")}](${p.liveUrl})`
      : "";
  const outcomes = p.outcomes?.length
    ? `\n\n**Highlights:**\n${p.outcomes.map((o) => `- ${o}`).join("\n")}`
    : "";
  return `### ${p.title}\n\n_${p.summary}_\n\n${p.description}${tech}${outcomes}${live}\n\nSee more in our [Portfolio](/portfolio).`;
}

function portfolioAnswer(): string {
  const list = projects
    .map(
      (p) =>
        `- **${p.title}** (${p.categoryLabel ?? p.category}) — ${p.summary}` +
        `${p.isLive && p.liveUrl ? ` · [live](${p.liveUrl})` : ""}`,
    )
    .join("\n");
  return (
    `### Selected work\n\n${list}\n\n` +
    `Ask me about any project — e.g. _"Tell me about Properties Professor CRM"_ or _"Tell me about InspectX"_. ` +
    `Full case studies on the [Portfolio page](/portfolio).`
  );
}

function techAnswer(): string {
  return (
    `### Our tech stack\n\nWe favour proven, modern tools:\n\n` +
    TECH.map((t) => `- ${t}`).join("\n") +
    `\n\nWe pick the boring, reliable stack unless there's a real reason not to.`
  );
}

function maintenanceAnswer(): string {
  return (
    `### Maintenance & support\n\n` +
    `- Every project ships with a **30-day warranty**.\n` +
    `- Optional **monthly care plans** cover updates, monitoring, backups and priority support.\n` +
    `- Professional plan includes **3 months** free priority maintenance; Enterprise includes **12 months**.\n\n` +
    `You also keep **100% of the source code and IP**. Questions? ${CONTACT_LINE}`
  );
}

function contactAnswer(): string {
  return (
    `### Let's talk\n\nThe fastest ways to reach us:\n\n` +
    `- 📧 Email: **[${COMPANY.email}](mailto:${COMPANY.email})**\n` +
    `- 📱 WhatsApp / Phone: **+${COMPANY.whatsapp}**\n` +
    `- 🌐 [Contact page](/contact)\n\n` +
    `Tell us a bit about your project and we'll respond quickly.`
  );
}

function startAnswer(): string {
  return (
    `### How to start your project\n\n` +
    `1. **Tell us your idea** — a short brief or even a rough goal is enough.\n` +
    `2. **Discovery call** — we align on scope, timeline and budget.\n` +
    `3. **Proposal & plan** — clear deliverables and pricing.\n` +
    `4. **We build** — weekly demos on staging until launch.\n\n` +
    `Ready when you are: ${CONTACT_LINE} — or try the **Cost Calculator** below for a quick estimate.`
  );
}

function processAnswer(): string {
  return (
    `### How we work\n\n` +
    COMPANY.process.map((s, i) => `${i + 1}. ${s}`).join("\n") +
    `\n\nSmall senior teams, tight loops, full transparency.`
  );
}

function designAnswer(): string {
  const d = services.find((s) => s.category === "Design");
  return (
    `### UI/UX Design\n\n${d?.description ?? "Research-led, systemised interface design."}\n\n` +
    `- Dashboard & product design\n- Design systems\n- Logo & brand identity\n\n` +
    `Design is included across our plans, or we can take on design-only engagements. More on [Services](/services).`
  );
}

function dashboardAnswer(): string {
  return (
    `### Dashboards & admin panels\n\nYes — dashboards are core to what we build:\n\n` +
    `- Admin CMS & role-based dashboards\n- Analytics & reporting views\n- ERP/CRM operational dashboards\n\n` +
    `You can see real examples like **Properties Professor CRM** and **Zenith School ERP** in our [Portfolio](/portfolio).`
  );
}

function cloudAnswer(): string {
  return (
    `### Cloud & deployment\n\nYes — we handle deployment and DevOps end-to-end:\n\n` +
    `- Cloud hosting on **AWS, Vercel and Render**\n- CI/CD pipelines\n- Secure cloud storage & managed databases\n- Monitoring and backups\n\n` +
    `We deploy to production and hand everything over cleanly.`
  );
}

function mobileAnswer(): string {
  const m = services.find((s) => s.category === "Mobile");
  return (
    `### Mobile apps\n\nAbsolutely. ${m?.description ?? "Native and cross-platform mobile apps."}\n\n` +
    `- **iOS & Android** via **Flutter** or **React Native**\n- Offline-first architecture\n- App Store & Play Store deployment\n\n` +
    `See **InspectX** in our [Portfolio](/portfolio) for a live example.`
  );
}

function webAnswer(): string {
  const w = services.find((s) => s.category === "Web");
  return (
    `### Website & web app development\n\n${w?.description ?? "Fast, conversion-focused websites and web apps."}\n\n` +
    `From marketing sites to complex portals and full web apps. A 5-page site starts at **₹15,000** (Starter). ` +
    `More on [Services](/services) and [Pricing](/pricing).`
  );
}

function erpAnswer(): string {
  return (
    `### ERP & custom software\n\nYes — building ERPs and business software is a core strength:\n\n` +
    `- **School ERP, Hospital Management, CRM, Inventory, HR/Attendance**\n- Custom business software & internal tools\n- Multi-module, role-based, cloud-based\n\n` +
    `Real examples: **Zenith EduTech School ERP** and **Properties Professor CRM** in our [Portfolio](/portfolio). ` +
    `ERP projects typically fit the **Enterprise plan**.`
  );
}

function saasAnswer(): string {
  return (
    `### SaaS platforms\n\nYes — we build full-stack, multi-tenant SaaS products:\n\n` +
    `- Multi-tenant database architecture\n- Subscription & role-based access\n- Scalable cloud deployment\n\n` +
    `SaaS builds sit in our **Enterprise plan (₹1,49,000)** with a dedicated engineering team. Let's scope it: ${CONTACT_LINE}`
  );
}

function aiAnswer(): string {
  return (
    `### AI solutions\n\nWe build practical, production-grade AI:\n\n` +
    `- **AI assistants & chatbots** (like this one) grounded in your own content\n` +
    `- **RAG** over knowledge bases, tickets and documents\n` +
    `- **Workflow automation** with LLMs and tool use\n\n` +
    `See **CogniBot Enterprise AI Assistant** in our [Portfolio](/portfolio) — it auto-resolves 78% of support queries.`
  );
}

function aboutAnswer(): string {
  return (
    `### About ${COMPANY.name}\n\n${COMPANY.about}\n\n` +
    `_${COMPANY.tagline}_\n\nMore on our [About page](/about).`
  );
}

function internationalAnswer(): string {
  return (
    `### Do we work internationally?\n\n${COMPANY.international}\n\n` +
    `We're based in ${COMPANY.location} and collaborate over calls, email and WhatsApp. Reach us anytime: ${CONTACT_LINE}`
  );
}

/**
 * Resolve a user message to an answer using only website knowledge.
 * Returns `null` when the question can't be confidently answered from the site,
 * so the caller can return the "couldn't find that" response.
 *
 * `history` supplies follow-up context (e.g. "how much will it cost?" after a
 * CRM question resolves to CRM pricing).
 */
export function answerFromKnowledge(message: string, history: ChatMsg[] = []): string | null {
  const text = message.trim();
  if (!text) return null;

  // Greetings / thanks — keep it human.
  const low = text.toLowerCase();
  if (/^(hi|hello|hey|yo|namaste|good (morning|afternoon|evening))\b/.test(low)) {
    return `Hello! 👋 I'm the **${COMPANY.name}** assistant. Ask me about our **services**, **pricing**, **portfolio**, **tech stack** or how to **start a project**.`;
  }
  if (/(thank|thanks|thx|great|awesome|cool)\b/.test(low) && text.length < 40) {
    return `You're welcome! 🙌 Anything else you'd like to know — pricing, timelines, or a specific project?`;
  }

  let topic = detectTopic(text);

  // Specific project by name (works as a follow-up too), but only when the
  // question is really *about that project* — an intent like pricing, timeline
  // or maintenance takes precedence (e.g. "price for a School ERP" is pricing,
  // not the Zenith School ERP case study).
  const projectIntentOverride =
    topic === "pricing" || topic === "timeline" || topic === "maintenance" || topic === "contact";
  const proj = projectMatch(text);
  if (proj && !projectIntentOverride && /(tell|about|explain|what is|show|detail|info)/.test(low)) {
    return projectAnswer(proj);
  }

  // Follow-up resolution: short/pronoun-y questions inherit the prior topic.
  const isFollowUp =
    text.length < 40 ||
    /\b(it|that|this|them|those|the same|and|also|what about|how about)\b/.test(low);
  if (!topic && isFollowUp) {
    const prevUser = [...history].reverse().find((m) => m.role === "user");
    if (prevUser) {
      const prevProj = projectMatch(prevUser.content);
      if (prevProj && /(price|cost|how much|quote|time|long|maintenance)/.test(low)) {
        // e.g. "how much will it cost?" after asking about a CRM project.
        if (/(price|cost|how much|quote)/.test(low)) {
          return (
            `### ${prevProj.title} — pricing\n\n` +
            `A build like **${prevProj.title}** typically fits our **Professional (₹49,000)** or **Enterprise (₹1,49,000)** plan, ` +
            `depending on modules and scale.\n\nFor an exact quote, share your requirements at ${CONTACT_LINE} or use the **Cost Calculator** below.`
          );
        }
        if (/(time|long)/.test(low)) return timelineAnswer();
        if (/maintenance/.test(low)) return maintenanceAnswer();
      }
      topic = detectTopic(prevUser.content);
    }
  }

  switch (topic) {
    case "services":
      return servicesAnswer();
    case "pricing": {
      // Blend with prior topic for a targeted pricing hint.
      const prev = [...history].reverse().find((m) => m.role === "user");
      const hint = prev ? detectTopic(prev.content) : null;
      return pricingAnswer(hint ?? undefined);
    }
    case "timeline":
      return timelineAnswer();
    case "mobile":
      return mobileAnswer();
    case "web":
      return webAnswer();
    case "erp":
      return erpAnswer();
    case "saas":
      return saasAnswer();
    case "ai":
      return aiAnswer();
    case "design":
      return designAnswer();
    case "dashboard":
      return dashboardAnswer();
    case "cloud":
      return cloudAnswer();
    case "tech":
      return techAnswer();
    case "portfolio":
      return portfolioAnswer();
    case "maintenance":
      return maintenanceAnswer();
    case "contact":
      return contactAnswer();
    case "start":
      return startAnswer();
    case "process":
      return processAnswer();
    case "international":
      return internationalAnswer();
    case "about":
      return aboutAnswer();
    default:
      return null;
  }
}

/** The "I couldn't find that" response (info genuinely not on the site). */
export function notFoundReply(): string {
  return (
    `I couldn't find that specific information on our website. 🤔\n\n` +
    `If you'd like, I can connect you with our team or help you find the right service:\n\n` +
    `- 📧 **[${COMPANY.email}](mailto:${COMPANY.email})**\n` +
    `- 📱 WhatsApp **+${COMPANY.whatsapp}**\n\n` +
    `Or ask me about our **services**, **pricing**, **portfolio** or **process** — happy to help!`
  );
}

/** Hard fallback — only when the AI service itself fails / times out. */
export function serviceFailureReply(): string {
  return (
    `I'm having trouble accessing additional information at the moment.\n\n` +
    `You can still browse our website or contact our team at:\n\n` +
    `**[${COMPANY.email}](mailto:${COMPANY.email})**\n\n` +
    `We'll be happy to help.`
  );
}
