import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { formatDate, humanize, type ActivityLog, usePortalCollection } from "@/lib/portal-api";

export const Route = createFileRoute("/client/activity")({
  head: () => ({
    meta: [{ title: "Activity Log — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const activity = usePortalCollection<ActivityLog>("activity", { pageSize: 100 });

  return (
    <ClientPortalShell title="Activity Log">
      <PortalPanel icon={Activity} title="Recorded Actions">
        {activity.isLoading && <PortalSkeleton rows={5} />}
        {activity.isError && <PortalError message={(activity.error as Error).message} />}
        {activity.data && activity.data.data.length === 0 && (
          <PortalEmpty title="No activity recorded" description="Login, logout, project, task, file, payment, quotation, and meeting events will appear here as the portal is used." />
        )}
        <div className="space-y-3">
          {activity.data?.data.map((item) => (
            <div key={item.id} className="rounded-lg border border-border/70 bg-background/45 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{humanize(item.action)}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
              </div>
              {item.projectId && (
                <Button asChild variant="ghost" size="sm" className="mt-2">
                  <Link to="/client/projects/$projectId" params={{ projectId: item.projectId }}>Open Project</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </PortalPanel>
    </ClientPortalShell>
  );
}
