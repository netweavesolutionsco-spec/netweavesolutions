import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon,
  className,
  gradient,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  icon?: ReactNode;
  className?: string;
  gradient?: boolean;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
    >
      {gradient && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-brand)" }}
        />
      )}
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</div>
          {delta !== undefined && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                positive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(delta)}% vs last month
            </div>
          )}
        </div>
        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-[color-mix(in_oklab,var(--brand)_25%,transparent)] to-[color-mix(in_oklab,var(--brand-3)_20%,transparent)] text-[var(--brand)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
