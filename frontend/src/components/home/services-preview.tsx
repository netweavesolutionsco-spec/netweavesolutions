import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { ArrowUpRight, ArrowRight, Sparkles } from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import type { Service } from "@/data/services";
import { cn } from "@/lib/utils";

/**
 * Presentational-only tech chips derived from a service's category/slug.
 * Purely frontend — no data/backend change. Falls back to the service's own
 * `items` list when a category isn't mapped, so CMS-added services still render.
 */
const TECH_BY_CATEGORY: Record<string, string[]> = {
  Web: ["React", "Next.js", "TypeScript", "Tailwind"],
  Software: ["Node.js", "PostgreSQL", "Supabase", "TypeScript"],
  Mobile: ["Flutter", "React Native", "Swift", "Kotlin"],
  Design: ["Figma", "Framer", "Motion"],
  AI: ["Python", "OpenAI", "LangChain", "Vectors"],
  Cloud: ["AWS", "Docker", "CI/CD", "Kubernetes"],
  DevOps: ["AWS", "Docker", "Terraform", "CI/CD"],
  API: ["REST", "GraphQL", "Node.js", "tRPC"],
};

function techTagsFor(service: { category?: string; slug?: string; items?: string[] }): string[] {
  const byCat = service.category && TECH_BY_CATEGORY[service.category];
  if (byCat) return byCat;
  const slug = (service.slug ?? "").toLowerCase();
  const key = Object.keys(TECH_BY_CATEGORY).find((k) => slug.includes(k.toLowerCase()));
  if (key) return TECH_BY_CATEGORY[key];
  return (service.items ?? []).slice(0, 4);
}

// Fixed positions (no Math.random → SSR-safe, no hydration mismatch).
const PARTICLES = [
  { left: "6%", top: "24%", size: 4, delay: 0, duration: 7 },
  { left: "22%", top: "72%", size: 3, delay: 1.2, duration: 8 },
  { left: "48%", top: "16%", size: 5, delay: 0.6, duration: 9 },
  { left: "68%", top: "60%", size: 3, delay: 1.8, duration: 7.5 },
  { left: "84%", top: "30%", size: 4, delay: 0.9, duration: 8.5 },
  { left: "92%", top: "78%", size: 3, delay: 2.1, duration: 9.5 },
];

const BRAND_GRADIENT =
  "linear-gradient(135deg, var(--brand) 0%, var(--brand-3) 55%, var(--brand-2) 100%)";

export function ServicesPreview() {
  const services = useCollection<Service>("services");

  return (
    <section id="services" className="relative overflow-hidden py-16 md:py-24">
      {/* ---------- Ambient background ---------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* subtle radial gradients */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 12% 0%, color-mix(in oklab, var(--brand) 16%, transparent), transparent 70%), radial-gradient(55% 45% at 100% 8%, color-mix(in oklab, var(--brand-2) 12%, transparent), transparent 72%)",
          }}
        />
        {/* very light grid pattern, faded toward the edges */}
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 75% 60% at 50% 40%, #000 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 60% at 50% 40%, #000 40%, transparent 100%)",
          }}
        />
        {/* blurred blue blobs */}
        <div
          className="absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "color-mix(in oklab, var(--brand) 22%, transparent)" }}
        />
        <div
          className="absolute -right-20 bottom-0 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "color-mix(in oklab, var(--brand-2) 18%, transparent)" }}
        />
        {/* tiny floating particles */}
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              background: "color-mix(in oklab, var(--brand) 60%, white)",
              boxShadow: "0 0 8px color-mix(in oklab, var(--brand) 60%, transparent)",
            }}
            animate={{ y: [0, -14, 0], opacity: [0.25, 0.7, 0.25] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-6">
        {/* ---------- Header ---------- */}
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border glass-card px-3.5 py-1.5 text-xs font-medium text-foreground/80"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="uppercase tracking-[0.14em]">Our Expertise</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6 text-4xl md:text-5xl lg:text-[3.4rem] font-semibold leading-[1.05] tracking-tight text-foreground"
          >
            End-to-end product engineering, <span className="text-gradient">under one roof.</span>
          </motion.h2>

          {/* animated accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="mt-6 h-[3px] w-24 origin-left rounded-full"
            style={{ background: BRAND_GRADIENT }}
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground leading-relaxed"
          >
            From first sketch to production traffic — design, build and grow with a team that treats
            your product like theirs.
          </motion.p>
        </div>

        {/* ---------- Services grid ---------- */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon =
              (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
                s.icon
              ] ?? Icons.Sparkles;
            const tags = techTagsFor(s);

            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.3), ease: "easeOut" }}
                className="group relative h-full"
              >
                {/* expanding background glow */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-2 -z-10 rounded-[28px] opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-100 group-hover:-inset-3"
                  style={{
                    background:
                      "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--brand) 45%, transparent), transparent 75%)",
                  }}
                />

                <Link
                  to="/services"
                  hash={s.slug}
                  aria-label={`${s.title} — learn more`}
                  className={cn(
                    "relative flex h-full flex-col rounded-[22px] border border-border glass-card p-7",
                    "transition-all duration-300 ease-out will-change-transform",
                    "hover:-translate-y-1.5 hover:border-transparent",
                    "hover:shadow-[0_20px_50px_-12px_color-mix(in_oklab,var(--brand)_55%,transparent)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  {/* gradient border on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[22px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: BRAND_GRADIENT,
                      padding: "1px",
                      WebkitMask:
                        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                  />

                  {/* top row: icon + arrow button */}
                  <div className="flex items-start justify-between">
                    <div
                      className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105"
                      style={{
                        background:
                          "linear-gradient(140deg, color-mix(in oklab, var(--brand) 20%, transparent), color-mix(in oklab, var(--brand-2) 12%, transparent))",
                      }}
                    >
                      <Icon className="h-7 w-7 text-primary" />
                    </div>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/40 text-muted-foreground transition-all duration-300 group-hover:border-transparent group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>

                  {/* title + description */}
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>

                  {/* tech chips */}
                  {tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-border bg-background/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-300 group-hover:border-primary/30 group-hover:text-foreground/80"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* footer: Learn More (pinned to bottom for equal height) */}
                  <div className="mt-auto flex items-center gap-1.5 pt-7 text-sm font-medium text-primary">
                    Learn More
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
