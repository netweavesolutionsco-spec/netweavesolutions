import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  MessageSquare,
  FolderKanban,
  CreditCard,
  CalendarClock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatDate,
  humanize,
  type ClientNotification,
  useClientNotifications,
  useClearAllNotifications,
  useDeleteNotification,
  useMarkNotificationsRead,
} from "@/lib/portal-api";

export const Route = createFileRoute("/client/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Netweavesolutions Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

// Category icon derived from the notification type/keywords, so each row carries
// a recognisable glyph without changing the existing layout or colours.
function iconFor(notification: ClientNotification): LucideIcon {
  const t = `${notification.type} ${notification.title}`.toLowerCase();
  if (notification.type === "success") return CheckCircle2;
  if (notification.type === "warning") return AlertTriangle;
  if (t.includes("message") || t.includes("reply")) return MessageSquare;
  if (t.includes("project") || t.includes("task")) return FolderKanban;
  if (t.includes("invoice") || t.includes("payment")) return CreditCard;
  if (t.includes("meeting")) return CalendarClock;
  return Info;
}

function NotificationsPage() {
  const notifications = useClientNotifications({ pageSize: 100 });
  const markRead = useMarkNotificationsRead();
  const deleteOne = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const rows = notifications.data?.data ?? [];
  const hasAny = rows.length > 0;

  return (
    <ClientPortalShell title="Notifications">
      <PortalPanel
        icon={Bell}
        title="Notification Center"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={markRead.isPending || !hasAny}
              onClick={() => markRead.mutate(undefined)}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={clearAll.isPending || !hasAny}
              onClick={() => clearAll.mutate()}
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          </div>
        }
      >
        {notifications.isLoading && <PortalSkeleton rows={4} />}
        {notifications.isError && <PortalError message={(notifications.error as Error).message} />}
        {notifications.data && rows.length === 0 && (
          <PortalEmpty title="No notifications" description="Project updates, assigned tasks, payments, quotations, meetings, and messages will appear here." />
        )}
        <div className="space-y-3">
          {rows.map((notification) => {
            const Icon = iconFor(notification);
            return (
              <div key={notification.id} className={cn("rounded-lg border border-border/70 bg-background/45 p-4", !notification.readAt && "border-primary/40 bg-primary/5")}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{humanize(notification.type)} · {formatDate(notification.createdAt)}</p>
                      <h2 className="mt-1 font-semibold">{notification.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.body}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {notification.actionUrl && (
                      <Button asChild variant="outline" size="sm">
                        <Link to={notification.actionUrl}>Open</Link>
                      </Button>
                    )}
                    {!notification.readAt && (
                      <Button variant="outline" size="sm" onClick={() => markRead.mutate(notification.id)}>
                        Mark read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleteOne.isPending}
                      onClick={() => deleteOne.mutate(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PortalPanel>
    </ClientPortalShell>
  );
}
