import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { humanize } from "@/lib/portal-api";

const STATUS_STYLES: Record<string, string> = {
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  running: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  review: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  overdue: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

export function PortalPanel({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-primary" />}
          <span className="truncate">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PortalStatus({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", STATUS_STYLES[value] ?? "")}>
      {humanize(value)}
    </Badge>
  );
}

export function PortalProgress({ value }: { value: number }) {
  return (
    <div className="min-w-32">
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

export function PortalSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

export function PortalEmpty({
  title,
  description,
  to,
  actionLabel,
}: {
  title: string;
  description: string;
  to?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-background/45 p-8 text-center">
      <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {to && actionLabel && (
        <Button asChild className="mt-5">
          <Link to={to}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

export function PortalError({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" />
        Unable to load this section
      </div>
      {message && <p className="mt-2 leading-6">{message}</p>}
    </div>
  );
}
