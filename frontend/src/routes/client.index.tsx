import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  CreditCard,
  FileText,
  FolderKanban,
  MessageSquare,
  PlusCircle,
  Receipt,
  Users,
} from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import {
  PortalEmpty,
  PortalError,
  PortalPanel,
  PortalProgress,
  PortalSkeleton,
} from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate, formatMoney, humanize, usePortalDashboard } from "@/lib/portal-api";

export const Route = createFileRoute("/client/")({
  head: () => ({
    meta: [
      { title: "Client Dashboard - Netweavesolutions" },
      {
        name: "description",
        content: "Manage your projects, invoices, meetings, and messages with Netweavesolutions.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientDashboard,
});

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border/70 bg-card/80 p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{helper}</div>
        </div>
        <span className="rounded-md bg-primary/10 p-2 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Link>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  description,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/45 p-3 transition hover:border-primary/50 hover:bg-accent"
    >
      <span className="rounded-md bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function ClientDashboard() {
  const dashboard = usePortalDashboard();

  return (
    <ClientPortalShell>
      {dashboard.isLoading && <PortalSkeleton rows={5} />}
      {dashboard.isError && <PortalError message={(dashboard.error as Error).message} />}
      {dashboard.data && (
        <div className="space-y-6">
          <section className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
              <div>
                <div className="text-sm font-medium text-primary">Client workspace</div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Welcome back, {dashboard.data.client.fullName?.split(" ")[0] || "there"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {dashboard.data.client.companyName || "Your company"} has a live command center
                  for projects, billing, files, messages, and meetings.
                </p>
              </div>

              <div className="grid gap-2 rounded-lg border border-border/70 bg-background/45 p-3">
                <div className="flex items-center justify-between gap-3 rounded-md bg-card/70 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Member since</span>
                  <span className="text-sm font-medium">
                    {formatDate(dashboard.data.summary.memberSince)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md bg-card/70 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Current plan</span>
                  <span className="text-sm font-medium">{dashboard.data.summary.currentPlan}</span>
                </div>
                <PortalProgress value={dashboard.data.summary.projectCompletion} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/client/projects/new">
                  <PlusCircle className="h-4 w-4" />
                  Create New Project
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/client/messages">
                  <MessageSquare className="h-4 w-4" />
                  Contact Team
                </Link>
              </Button>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={FolderKanban}
              label="Total Projects"
              value={String(dashboard.data.summary.totalProjects)}
              helper={`${dashboard.data.summary.runningProjects} running`}
              to="/client/projects"
            />
            <StatCard
              icon={Users}
              label="Completed"
              value={String(dashboard.data.summary.completedProjects)}
              helper="Delivered projects"
              to="/client/projects"
            />
            <StatCard
              icon={Receipt}
              label="Invoices"
              value={String(dashboard.data.summary.invoices)}
              helper={`${formatMoney(dashboard.data.summary.outstandingBalance)} outstanding`}
              to="/client/invoices"
            />
            <StatCard
              icon={MessageSquare}
              label="Unread Messages"
              value={String(dashboard.data.summary.unreadMessages)}
              helper="Waiting in conversations"
              to="/client/messages"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <PortalPanel
              icon={Activity}
              title="Latest Activity Timeline"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/client/notifications">View all</Link>
                </Button>
              }
            >
              {dashboard.data.activity.length ? (
                <div className="space-y-3">
                  {dashboard.data.activity.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border/70 bg-background/45 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{item.description}</p>
                        <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{humanize(item.action)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <PortalEmpty
                  title="No activity yet"
                  description="Project, task, file, payment, quotation, and meeting updates will appear here as soon as work begins."
                />
              )}
            </PortalPanel>

            <PortalPanel icon={PlusCircle} title="Quick Actions">
              <div className="grid gap-3">
                <QuickAction
                  to="/client/projects/new"
                  icon={PlusCircle}
                  label="Create New Project"
                  description="Submit a complete project brief"
                />
                <QuickAction
                  to="/client/messages"
                  icon={MessageSquare}
                  label="Contact Team"
                  description="Send a message or support request"
                />
                <QuickAction
                  to="/client/invoices"
                  icon={Receipt}
                  label="Download Invoice"
                  description="Open invoice and receipt history"
                />
                <QuickAction
                  to="/client/meetings"
                  icon={Calendar}
                  label="Request Meeting"
                  description="Schedule a planning or review call"
                />
                <QuickAction
                  to="/client/requirements"
                  icon={FileText}
                  label="View Quotations"
                  description="Review proposals and revisions"
                />
              </div>
            </PortalPanel>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <PortalPanel icon={Calendar} title="Upcoming Meetings">
              {dashboard.data.upcomingMeetings.length ? (
                <div className="space-y-3">
                  {dashboard.data.upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="rounded-lg bg-background/45 p-4">
                      <p className="text-sm font-medium">{meeting.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(meeting.scheduledAt)} · {meeting.durationMinutes} min
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <PortalEmpty
                  title="No meetings scheduled"
                  description="Book a kickoff, review, or support call from the meetings module."
                  to="/client/meetings"
                  actionLabel="Request Meeting"
                />
              )}
            </PortalPanel>

            <PortalPanel icon={Bell} title="Notifications">
              {dashboard.data.notifications.length ? (
                <div className="space-y-3">
                  {dashboard.data.notifications.slice(0, 4).map((notification) => (
                    <Link
                      key={notification.id}
                      to={notification.actionUrl || "/client/notifications"}
                      className={cn(
                        "block rounded-lg border border-border/70 bg-background/45 p-3 transition hover:border-primary/50",
                        !notification.readAt && "border-primary/40",
                      )}
                    >
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {notification.body}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <PortalEmpty
                  title="No notifications"
                  description="Important project, quotation, payment, message, and meeting alerts will show up here."
                />
              )}
            </PortalPanel>

            <PortalPanel icon={CreditCard} title="Financial Snapshot">
              <div className="space-y-3">
                <div className="rounded-lg bg-background/45 p-4">
                  <p className="text-xs text-muted-foreground">Pending quotations</p>
                  <p className="mt-1 text-2xl font-semibold">{dashboard.data.summary.pendingQuotations}</p>
                </div>
                <div className="rounded-lg bg-background/45 p-4">
                  <p className="text-xs text-muted-foreground">Outstanding balance</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatMoney(dashboard.data.summary.outstandingBalance)}
                  </p>
                </div>
              </div>
            </PortalPanel>
          </div>
        </div>
      )}
    </ClientPortalShell>
  );
}
