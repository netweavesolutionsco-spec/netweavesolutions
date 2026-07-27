import {
  CheckCheck,
  Trash2,
  X,
  Circle,
  Info,
  TriangleAlert,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import { useAdminUI } from "@/admin/context/AdminUIContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

export function NotificationDrawer() {
  const {
    notifOpen,
    setNotifOpen,
    notifications,
    markAllRead,
    clearNotifications,
    removeNotification,
  } = useAdminUI();

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        notifOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity",
          notifOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={() => setNotifOpen(false)}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border/60 bg-card shadow-2xl transition-transform",
          notifOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">{notifications.length} total</div>
          </div>
          <button
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            onClick={() => setNotifOpen(false)}
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-border/60 px-5 py-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-destructive hover:text-destructive"
            onClick={clearNotifications}
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear all
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted">
                  <Inbox className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">You're all caught up</div>
                <div className="text-xs text-muted-foreground">No notifications yet.</div>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {notifications.map((n) => {
                const Icon = typeIcon[n.type];
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "group relative flex gap-3 px-5 py-4 transition-colors hover:bg-accent/50",
                      !n.read && "bg-accent/20",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        typeColor[n.type],
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        {!n.read && (
                          <Circle className="h-1.5 w-1.5 fill-(--brand) text-(--brand)" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{n.description}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{n.time}</p>
                    </div>
                    <button
                      className="rounded p-1 text-muted-foreground opacity-0 hover:bg-background group-hover:opacity-100"
                      onClick={() => removeNotification(n.id)}
                      aria-label="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
