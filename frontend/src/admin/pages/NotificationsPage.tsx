import { PageHeader } from "@/admin/components/PageHeader";
import { useAdminUI } from "@/admin/context/AdminUIContext";
import { Button } from "@/components/ui/button";
import { CheckCheck, Check, Trash2, Circle, Info, TriangleAlert, CheckCircle2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/admin/lib/format-time";
import type { AdminNotification } from "@/admin/data/dummy";

const typeIcon: Record<AdminNotification["type"], typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  lead: Inbox,
};
const typeColor: Record<AdminNotification["type"], string> = {
  info: "text-sky-500 bg-sky-500/10",
  success: "text-emerald-500 bg-emerald-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  lead: "text-[var(--brand)] bg-[color-mix(in_oklab,var(--brand)_15%,transparent)]",
};

export function NotificationsPage() {
  const { notifications, markRead, markAllRead, clearNotifications, removeNotification } =
    useAdminUI();
  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Everything that needs your attention."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark all read
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={clearNotifications}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear all
            </Button>
          </>
        }
      />
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
        {notifications.length === 0 ? (
          <div className="grid place-items-center p-16 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-muted">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-base font-semibold">Nothing to see here</div>
            <p className="text-sm text-muted-foreground">New activity will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {notifications.map((n) => {
              const Icon = typeIcon[n.type];
              return (
                <li
                  key={n.id}
                  className={cn(
                    "group flex items-center gap-4 px-5 py-4",
                    !n.read && "bg-accent/20",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl",
                      typeColor[n.type],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{n.title}</div>
                      {!n.read && (
                        <Circle className="h-1.5 w-1.5 fill-[var(--brand)] text-[var(--brand)]" />
                      )}
                    </div>
                    {n.description && (
                      <div className="text-xs text-muted-foreground">{n.description}</div>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      <span>{formatRelativeTime(n.createdAt)}</span>
                      {n.userName && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="truncate">{n.userName}</span>
                        </>
                      )}
                      {n.relatedModule && (
                        <span className="rounded bg-muted px-1.5 py-0.5 capitalize">
                          {n.relatedModule}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markRead(n.id)}
                        aria-label="Mark read"
                        title="Mark read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeNotification(n.id)}
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
