import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ExternalLink, ArrowRight, Sparkles, SearchX } from "lucide-react";
import { Section } from "@/components/section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/hooks/useCollection";
import { projects as fallback, type Project } from "@/data/portfolio";
import { brand } from "@/data/brand";
import { cn } from "@/lib/utils";
import { ProjectCaseStudyDialog } from "@/components/project-case-study-dialog";
import { openEstimator } from "@/components/cost-estimator-modal";

const CATS = ["All", "Web", "Mobile App", "Software/ERP", "UI/UX", "AI & Cloud"] as const;
type Cat = (typeof CATS)[number];

function matchCat(p: Project, c: Cat) {
  if (c === "All") return true;
  const label = (p.categoryLabel ?? p.category).toUpperCase();
  const map: Record<Cat, string[]> = {
    All: [],
    Web: ["WEB"],
    "Mobile App": ["MOBILE APP", "MOBILE"],
    "Software/ERP": ["SOFTWARE/ERP", "SOFTWARE", "ERP"],
    "UI/UX": ["UI/UX", "DESIGN"],
    "AI & Cloud": ["AI & CLOUD", "AI"],
  };
  return map[c].some((m) => label.includes(m));
}

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: `Engineering Portfolio — ${brand.name}` },
      {
        name: "description",
        content:
          "Featured case studies: high-concurrency SaaS, ERP platforms, mobile apps and AI bots engineered by Netweavesolutions.",
      },
      { property: "og:title", content: `Engineering Portfolio — ${brand.name}` },
      { property: "og:description", content: "Real-world case studies from Netweavesolutions." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/portfolio" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/portfolio" }],
  }),
  component: Portfolio,
});

function Portfolio() {
  const list = useCollection<Project>("portfolio");
  const projects = (list && list.length > 0 ? list : fallback) as Project[];
  const [cat, setCat] = useState<Cat>("All");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (!matchCat(p, cat)) return false;
      if (!query) return true;
      const hay = [p.title, p.summary, p.description, p.client, ...(p.tech ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [projects, cat, q]);

  return (
    <>
      <Section className="pt-20 md:pt-28">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            Client Success Stories
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-[-0.03em] text-foreground">
            Featured{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Engineering Portfolio
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Explore real-world case studies demonstrating our ability to engineer high-concurrency
            SaaS applications, ERP platforms, mobile apps, and AI bots.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all border",
                  cat === c
                    ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border-transparent shadow-[0_10px_30px_-10px_rgba(99,102,241,0.6)]"
                    : "border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:text-white",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search projects, tech, clients…"
              className="pl-9 rounded-full bg-white/5 border-white/10"
            />
          </div>
        </div>

        <motion.div layout className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.button
                key={p.slug}
                layout
                type="button"
                onClick={() => setActive(p)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, delay: (i % 3) * 0.05 }}
                className="group text-left flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/70 backdrop-blur transition-all hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_30px_80px_-30px_rgba(6,182,212,0.35)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      width={800}
                      height={500}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${p.gradient}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {p.isLive ? (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur text-slate-950 text-[11px] font-bold px-2.5 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-pulse" /> LIVE
                      SITE
                      {p.liveUrl && <ExternalLink className="h-3 w-3" />}
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-white/10 backdrop-blur text-white text-[11px] font-semibold px-2.5 py-1">
                      2025
                    </span>
                  )}
                  <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-cyan-500/90 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                    {p.categoryLabel ?? p.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  {p.client && (
                    <div className="text-xs text-cyan-300/80 font-medium">Client: {p.client}</div>
                  )}
                  <h3 className="mt-1 text-lg font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed line-clamp-3">
                    {p.summary}
                  </p>

                  {p.stats && p.stats.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {p.stats.slice(0, 2).map((s) => (
                        <div
                          key={s.label}
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                        >
                          <div className="text-[10px] uppercase tracking-wider text-white/50">
                            {s.label}
                          </div>
                          <div className="text-sm font-bold text-white">{s.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-5 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="font-semibold text-cyan-300 group-hover:text-cyan-200">
                      Popup Case Study
                    </span>
                    <ArrowRight className="h-4 w-4 text-cyan-300 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <SearchX className="h-7 w-7 text-white/60" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              No projects found matching "{q}"
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different keyword or reset your filters.
            </p>
            <div className="mt-5 flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setQ("")} className="rounded-full">
                Clear search
              </Button>
              <Button variant="outline" onClick={() => setCat("All")} className="rounded-full">
                Show all categories
              </Button>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900 p-8 md:p-14 text-center">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(6,182,212,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(139,92,246,0.4) 0%, transparent 50%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-[-0.02em]">
              Have a Project in Mind?
            </h2>
            <p className="mt-3 text-white/80 max-w-2xl mx-auto">
              Let's discuss how we can build a similar high-performance digital product for your
              business.
            </p>
            <Button
              onClick={openEstimator}
              size="lg"
              className="mt-6 rounded-full bg-white text-slate-900 hover:bg-white/90"
            >
              <Sparkles className="h-4 w-4" /> Get Free Custom Proposal
            </Button>
          </div>
        </div>
      </Section>

      <ProjectCaseStudyDialog
        project={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </>
  );
}

