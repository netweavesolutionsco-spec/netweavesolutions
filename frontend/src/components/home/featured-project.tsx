import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ExternalLink,
  Bell,
  RefreshCw,
  Monitor,
  Laptop,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { projects as fallback, type Project } from "@/data/portfolio";
import { useCollection } from "@/hooks/useCollection";
import { ProjectCaseStudyDialog } from "@/components/project-case-study-dialog";
import { cn } from "@/lib/utils";

type Device = "desktop" | "laptop" | "mobile";

export function FeaturedProject() {
  const list = useCollection<Project>("portfolio");
  const featured = (list && list.length > 0 ? list : fallback)[0] as Project;
  const localFeatured = fallback.find((project) => project.slug === featured.slug) ?? fallback[0];
  const [device, setDevice] = useState<Device>("desktop");
  const [open, setOpen] = useState(false);
  const previewHeight = device === "desktop" ? 520 : device === "laptop" ? 620 : 780;
  const iframeStyle = useMemo(
    () => ({
      width: device === "mobile" ? 390 : device === "laptop" ? 1024 : 1280,
      height: previewHeight,
      transform: device === "desktop" ? "scale(0.95)" : "scale(1)",
      transformOrigin: "top left" as const,
    }),
    [device, previewHeight],
  );

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Live Client Case Study
            </div>
            <h2 className="mt-5 text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-foreground">
              Featured Client Project
            </h2>
          </div>
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            View All Portfolio Items <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Outer browser frame */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl shadow-[0_40px_120px_-40px_rgba(59,130,246,0.35)] overflow-hidden"
        >
          {/* Top bar */}
          <div className="flex items-center gap-4 border-b border-white/10 px-5 py-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
            </div>
            <span className="text-sm text-white/70 truncate">
              {featured.title} —{" "}
              {featured.categoryLabel === "WEB"
                ? "Shorthand Dictation Portal"
                : featured.summary.slice(0, 40)}
            </span>
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> HTTPS /
                LIVE
              </span>
              <span className="text-xs text-white/70 truncate max-w-70">
                {featured.liveUrl}
              </span>
            </div>
            <a
              href={featured.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm px-4 py-2 transition-colors"
            >
              Visit Live Website <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Body */}
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left copy */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 font-semibold uppercase tracking-wider text-emerald-300">
                  Client Project
                </span>
                <span className="text-white/60">• {featured.industry}</span>
              </div>
              <h3 className="mt-5 text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">
                {featured.title}
              </h3>
              <p className="mt-4 text-white/70 leading-relaxed">{featured.description}</p>

              <div className="mt-7 grid grid-cols-3 gap-3">
                {featured.stats?.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-white/3 px-4 py-3"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      {s.label}
                    </div>
                    <div className="mt-1 text-lg font-bold text-white">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-full bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400"
                >
                  <a href={featured.liveUrl} target="_blank" rel="noopener noreferrer">
                    Launch {featured.title.split(" ")[0]} Website{" "}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/5"
                  onClick={() => setOpen(true)}
                >
                  View Case Study
                </Button>
              </div>
            </div>

            {/* Right browser mock */}
            <div className="p-4 md:p-6 bg-linear-to-br from-slate-950/50 to-slate-900/50 border-t lg:border-t-0 lg:border-l border-white/10">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-black/40">
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs text-white/70 truncate">
                    {featured.title} — Live Sho...
                  </span>
                  <div className="flex-1" />
                  <div className="hidden sm:flex items-center gap-1 rounded-full bg-white/5 p-0.5">
                    {[
                      { k: "desktop" as const, Icon: Monitor, label: "Desktop" },
                      { k: "laptop" as const, Icon: Laptop, label: "Laptop" },
                      { k: "mobile" as const, Icon: Smartphone, label: "Mobile" },
                    ].map(({ k, Icon, label }) => (
                      <button
                        key={k}
                        onClick={() => setDevice(k)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                          device === k
                            ? "bg-indigo-500 text-white"
                            : "text-white/70 hover:text-white",
                        )}
                      >
                        <Icon className="h-3 w-3" /> {label}
                      </button>
                    ))}
                  </div>
                  <RefreshCw className="h-3.5 w-3.5 text-white/50" />
                  <a
                    href={featured.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-[11px] px-2.5 py-1"
                  >
                    Visit Site <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div
                  className={cn(
                    "relative bg-white transition-all duration-500",
                    device === "mobile" ? "max-w-97.5 mx-auto" : "w-full",
                  )}
                >
                  {/* Notice bar */}
                  <div className="flex items-center gap-2 bg-red-600 text-white text-[11px] px-3 py-1.5">
                    <span className="rounded bg-amber-300 text-red-800 font-bold px-1.5 py-0.5 text-[10px]">
                      NOTICE
                    </span>
                    <span className="truncate">
                      रोजाना रात 8:00 बजे SSC, High Court एवं अन्य Stenographer परीक्षाओं के लिए
                      निःशुल्क Live Dictation क्लास होती है। क्लास से जुड़ने के लिए WhatsApp पर
                      संपर्क करें।
                    </span>
                    <Bell className="ml-auto h-3.5 w-3.5 shrink-0" />
                  </div>
                  <div className="relative h-130 overflow-hidden bg-slate-950">
                    <iframe
                      src={localFeatured.liveUrl}
                      title={`${featured.title} live website preview`}
                      className={cn(
                        "border-0 bg-white",
                        device === "mobile" ? "mx-auto h-full" : "h-full w-full",
                      )}
                      style={iframeStyle}
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/85 via-slate-950/25 to-transparent px-4 py-3">
                      <div className="flex items-center justify-between text-[11px] text-white/70">
                        <span>Scroll inside to browse the live site</span>
                        <span>{device === "mobile" ? "Mobile" : device === "laptop" ? "Laptop" : "Desktop"} preview</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-950 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
                      {featured.liveUrl}
                    </span>
                    <span className="text-white/60">
                      {device === "desktop"
                        ? "DESKTOP (1280px)"
                        : device === "laptop"
                          ? "LAPTOP (1024px)"
                          : "MOBILE (390px)"}{" "}
                      • Scaled to fit
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ProjectCaseStudyDialog project={featured} open={open} onOpenChange={setOpen} />
    </section>
  );
}
