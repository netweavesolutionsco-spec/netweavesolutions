import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { Section } from "@/components/section";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  period: string;
  monthlyPrice?: string;
  monthlyPeriod?: string;
  tagline: string;
  featured?: boolean;
  features: string[];
  cta: string;
};

export function PricingSection({ compact = false }: { compact?: boolean }) {
  const plans = useCollection<Plan>("pricing");
  const [billing, setBilling] = useState<"one-time" | "monthly">("one-time");

  return (
    <Section center>
      <div className="mx-auto max-w-3xl text-center mb-10 -mt-4">
        <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Transparent Pricing
        </span>
        <h2 className="mt-5 text-3xl md:text-5xl font-bold tracking-[-0.025em] text-foreground">
          Simple, Predictable Development Plans
        </h2>
      </div>

      {/* Toggle */}
      <div className="mb-12 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-border bg-card/60 p-1 backdrop-blur">
          {(["one-time", "monthly"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setBilling(mode)}
              className={cn(
                "relative rounded-full px-5 py-2 text-sm font-medium transition-colors",
                billing === mode
                  ? "text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.65)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {billing === mode && (
                <motion.span
                  layoutId="billing-pill"
                  className="absolute inset-0 rounded-full bg-linear-to-r from-indigo-600 to-violet-600"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                {mode === "one-time" ? "One-Time Project" : "Monthly Retainer"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((p, i) => {
          const isMonthly = billing === "monthly" && p.monthlyPrice;
          const price = isMonthly ? p.monthlyPrice! : p.price;
          const period = isMonthly ? p.monthlyPeriod! : p.period;
          return (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "relative rounded-2xl border p-8 flex flex-col bg-card/80 backdrop-blur",
                p.featured
                  ? "border-primary/50 shadow-[0_20px_60px_-20px_rgba(79,70,229,0.55)]"
                  : "border-border",
              )}
            >
              {p.featured && (
                <>
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-indigo-500 to-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                    Most Popular
                  </div>
                </>
              )}
              <div className="relative">
                <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.tagline}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">{price}</span>
                  <span className="text-sm text-muted-foreground">
                    {isMonthly ? `/${period}` : ` ${period}`}
                  </span>
                </div>
                <ul className="mt-6 space-y-3 text-sm flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-foreground/90">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className={cn(
                    "mt-8 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all",
                    p.featured
                      ? "bg-linear-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.75)] hover:shadow-[0_14px_38px_-10px_rgba(79,70,229,0.9)]"
                      : "bg-secondary text-foreground hover:bg-secondary/80 border border-border",
                  )}
                >
                  {p.cta}
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-10 text-center text-sm text-muted-foreground">
          Need something bespoke?{" "}
          <Link to="/contact" className="text-primary underline underline-offset-4">
            Request a custom quote
          </Link>
          .
        </div>
      )}
    </Section>
  );
}
