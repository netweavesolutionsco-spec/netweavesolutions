import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import type { Project } from "@/data/portfolio";

export function ProjectCaseStudyDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  if (!project) return null;
  const p = project;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-[#0b1220] border-white/10">
        <div className="relative aspect-[16/8] overflow-hidden">
          {p.image ? (
            <img
              src={p.image}
              alt={p.title}
              className="h-full w-full object-cover"
              width={800}
              height={400}
            />
          ) : (
            <div className={`h-full w-full bg-linear-to-br ${p.gradient}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/40 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-cyan-500/90 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                {p.categoryLabel ?? p.category}
              </span>
              <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-white">{p.title}</h2>
            </div>
            {p.isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 text-slate-950 text-[11px] font-bold px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-pulse" /> LIVE
              </span>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="sr-only">
            <DialogTitle>{p.title}</DialogTitle>
            <DialogDescription>{p.summary}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {p.client && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Client
                </div>
                <div className="mt-0.5 text-white">{p.client}</div>
              </div>
            )}
            {p.industry && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Industry
                </div>
                <div className="mt-0.5 text-white">{p.industry}</div>
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                Outcome
              </div>
              <div className="mt-0.5 text-white">{p.metric}</div>
            </div>
            {p.liveUrl && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Website
                </div>
                <a
                  href={p.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 text-cyan-300 hover:text-cyan-200 truncate block"
                >
                  {p.liveUrl.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>

          {p.problem && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                The Problem
              </h3>
              <p className="mt-2 text-white/80 leading-relaxed">{p.problem}</p>
            </section>
          )}
          {p.solution && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                Our Solution
              </h3>
              <p className="mt-2 text-white/80 leading-relaxed">{p.solution}</p>
            </section>
          )}
          {p.outcomes && p.outcomes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                Outcomes
              </h3>
              <ul className="mt-2 space-y-2">
                {p.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-white/80">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
              Tech Stack
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tech.map((t) => (
                <span
                  key={t}
                  className="text-xs rounded-full border border-white/15 bg-white/5 text-white/80 px-3 py-1"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          {p.stats && p.stats.length > 0 && (
            <section className="grid grid-cols-3 gap-3">
              {p.stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center"
                >
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    {s.label}
                  </div>
                </div>
              ))}
            </section>
          )}

          {p.liveUrl && (
            <div className="pt-2">
              <Button
                asChild
                className="rounded-full bg-linear-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400"
              >
                <a href={p.liveUrl} target="_blank" rel="noopener noreferrer">
                  Visit Live Website <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
