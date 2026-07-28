import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, humanize, type ClientNotification, useMarkNotificationsRead, usePortalCollection } from "@/lib/portal-api";

export const Route = createFileRoute("/client/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Netweavesolutions Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const notifications = usePortalCollection<ClientNotification>("notifications", { pageSize: 100 });
  const markRead = useMarkNotificationsRead();

  return (
    <ClientPortalShell title="Notifications">
      <PortalPanel
        icon={Bell}
        title="Notification Center"
        action={
          <Button variant="outline" size="sm" disabled={markRead.isPending} onClick={() => markRead.mutate(undefined)}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        }
      >
        {notifications.isLoading && <PortalSkeleton rows={4} />}
        {notifications.isError && <PortalError message={(notifications.error as Error).message} />}
        {notifications.data && notifications.data.data.length === 0 && (
          <PortalEmpty title="No notifications" description="Project updates, assigned tasks, payments, quotations, meetings, and messages will appear here." />
        )}
        <div className="space-y-3">
          {notifications.data?.data.map((notification) => (
            <div key={notification.id} className={cn("rounded-lg border border-border/70 bg-background/45 p-4", !notification.readAt && "border-primary/40 bg-primary/5")}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{humanize(notification.type)} · {formatDate(notification.createdAt)}</p>
                  <h2 className="mt-1 font-semibold">{notification.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.body}</p>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </PortalPanel>
    </ClientPortalShell>
  );
}
