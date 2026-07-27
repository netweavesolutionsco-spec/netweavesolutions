import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { Section } from "@/components/section";
import { projects as fallback, type Project } from "@/data/portfolio";
import { ProjectCaseStudyDialog } from "@/components/project-case-study-dialog";

export function PortfolioGrid() {
  const list = useCollection<Project>("portfolio");
  const projects = (list && list.length > 0 ? list : fallback) as Project[];
  const [active, setActive] = useState<Project | null>(null);

  return (
    <Section
      eyebrow="Recent Work"
      title={<>Portfolio & Case Studies</>}
      subtitle="A cross-section of live client work — click any card to read the case study."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <motion.button
            key={p.slug}
            type="button"
            onClick={() => setActive(p)}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
            className="group text-left flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/70 backdrop-blur transition-all hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_30px_80px_-30px_rgba(6,182,212,0.35)]"
          >
            <div className="relative aspect-16/10 overflow-hidden">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.title}
                  loading="lazy"
                  width={800}
                  height={500}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className={`h-full w-full bg-linear-to-br ${p.gradient}`} />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
              {p.isLive && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur text-slate-950 text-[11px] font-bold px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-pulse" /> LIVE
                </span>
              )}
              <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-cyan-500/90 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                {p.categoryLabel ?? p.category}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-lg font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed line-clamp-2">{p.summary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tech.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="text-[11px] rounded-md bg-white/5 border border-white/10 text-white/70 px-2 py-0.5"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                <span className="font-semibold text-cyan-300 group-hover:text-cyan-200">
                  Read Case Study
                </span>
                <ArrowRight className="h-4 w-4 text-cyan-300 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <ProjectCaseStudyDialog
        project={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </Section>
  );
}
