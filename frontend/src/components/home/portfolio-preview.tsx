import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { useCollection } from "@/hooks/useCollection";
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PortfolioPreview() {
  const projects = useCollection<any>("portfolio");
  const featured = projects.slice(0, 4);
  return (
    <Section
      eyebrow="Selected work"
      title={<>Work we're proud to put our name on.</>}
      subtitle="A cross-section of recent projects across web, mobile and custom software."
    >
      <div className="grid gap-8 md:grid-cols-2">
        {featured.map((p, i) => (
          <motion.article
            key={p.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="group"
          >
            <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
              <div className={cn("relative aspect-16/10 bg-linear-to-br", p.gradient)}>
                <div
                  className="absolute inset-0 mix-blend-overlay opacity-40"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 30% 20%, white 0%, transparent 45%)",
                  }}
                />
                <div className="absolute top-4 left-4 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase text-foreground">
                  {p.category}
                </div>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                <span className="shrink-0 text-xs text-muted-foreground">{p.metric}</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.summary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tech.map((t: any) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
      <div className="mt-14 text-center">
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/portfolio">
            See all projects <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
