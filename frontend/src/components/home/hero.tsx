import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Bot, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/counter";
import { openEstimator } from "@/components/cost-estimator-modal";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCollection } from "@/hooks/useCollection";

export function Hero() {
  const settings = useSiteSettings();
  const projects = useCollection("portfolio");
  const projectsDelivered = projects.length;

  const renderTitle = (title: string) => {
    const target = "Powerful Digital Solutions";
    if (title.endsWith(target)) {
      const main = title.slice(0, -target.length);
      return (
        <>
          {main}
          <span className="text-gradient">{target}</span>
        </>
      );
    }
    return title;
  };

  return (
    <section className="relative overflow-hidden">
      {/* Ambient glows + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 10%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 65%), radial-gradient(50% 45% at 90% 20%, color-mix(in oklab, var(--brand-2) 22%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.25] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 85%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 pt-0 pb-6 md:pt-1 md:pb-8 grid gap-12 lg:grid-cols-2 items-center">
        {/* LEFT */}
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1.5 text-xs font-medium text-foreground/80"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {settings.hero.eyebrow}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-[clamp(2.8rem,4.5vw,4.6rem)] md:text-[clamp(3.4rem,4vw,5.6rem)] font-semibold tracking-[-0.03em] leading-[1.02] text-foreground"
          >
            {renderTitle(settings.hero.title)}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-6 max-w-xl text-[clamp(1rem,2.2vw,1.15rem)] text-muted-foreground leading-relaxed"
          >
            {settings.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-9 flex flex-col sm:flex-row gap-3"
          >
            {settings.hero.ctaPrimary.to === "/contact" ? (
              <Button
                size="lg"
                className="rounded-full h-12 px-6 shadow-glow"
                onClick={openEstimator}
              >
                <Sparkles className="h-4 w-4" />
                {settings.hero.ctaPrimary.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="rounded-full h-12 px-6 shadow-glow"
              >
                <Link to={settings.hero.ctaPrimary.to}>
                  <Sparkles className="h-4 w-4" />
                  {settings.hero.ctaPrimary.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6 glass">
              <Link to={settings.hero.ctaSecondary.to}>{settings.hero.ctaSecondary.label}</Link>
            </Button>
          </motion.div>

          {/* Trust metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-lg"
          >
            {[
              { v: projectsDelivered, s: "+", l: "Projects Delivered" },
              { v: 99, s: "%", l: "Client Satisfaction" },
              { v: 24, s: "/7", l: "Dedicated SLA Support" },
            ].map((m) => (
              <div
                key={m.l}
                className="rounded-2xl border border-border bg-card/50 backdrop-blur px-4 py-3"
              >
                <div className="text-2xl font-bold text-gradient">
                  <Counter to={m.v} suffix={m.s} />
                </div>
                <div className="mt-1 text-[11px] font-medium text-muted-foreground leading-tight">
                  {m.l}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — code window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          {/* Floating badges */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -left-4 top-8 z-20 hidden md:flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/80 backdrop-blur px-3 py-2 text-xs font-medium text-white shadow-glow"
          >
            <Bot className="h-4 w-4 text-cyan-400" />
            AI Integrated <span className="text-white/60">(Gemini Models)</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 }}
            className="absolute -right-2 bottom-10 z-20 hidden md:flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/80 backdrop-blur px-3 py-2 text-xs font-medium text-white shadow-glow"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            100% IP Rights <span className="text-white/60">(Source Transfer)</span>
          </motion.div>

          {/* Code window */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_40px_120px_-40px_rgba(79,70,229,0.5)] overflow-hidden">
            <div
            className="flex items-center gap-3 border-b border-white/10 px-4 py-3"
            style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
          >
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs text-white/60 font-mono">codenest_app.ts</span>
            </div>
            <pre className="text-[13px] leading-relaxed font-mono p-6 text-white/90 overflow-x-auto">
              {`import { NetweavesolutionsStudio } from '@codenest/agency';
import { Gemini } from '@google/genai';

const studio = new `}
              <span className="text-cyan-400">NetweavesolutionsStudio</span>
              {`({
  stack: [`}
              <span className="text-emerald-400">'next15'</span>
              {`, `}
              <span className="text-emerald-400">'react19'</span>
              {`, `}
              <span className="text-emerald-400">'flutter'</span>
              {`],
  ai: `}
              <span className="text-violet-400">Gemini</span>
              {`.pro({ mode: `}
              <span className="text-emerald-400">'reasoning'</span>
              {` }),
  delivery: { sla: `}
              <span className="text-amber-300">'24/7'</span>
              {`, ip: `}
              <span className="text-emerald-400">'client'</span>
              {` },
});

`}
              <span className="text-white/40">// ship enterprise apps in 2–4 weeks</span>
              {`
await studio.`}
              <span className="text-cyan-400">launch</span>
              {`({
  product: `}
              <span className="text-emerald-400">'SchoolERP'</span>
              {`,
  scale: `}
              <span className="text-emerald-400">'50k+ users'</span>
              {`,
});`}
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
