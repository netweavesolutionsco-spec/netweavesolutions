import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  New: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  Contacted: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Qualified: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  Won: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Lost: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  Published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Draft: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Archived: "bg-muted text-muted-foreground border-border",
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "On Leave": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Open: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Closed: "bg-muted text-muted-foreground border-border",
  Invited: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  Suspended: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  Owner: "bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white border-transparent",
  Admin: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Editor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  Viewer: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-medium", map[status] ?? "")}
    >
      {status}
    </Badge>
  );
}
