import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  FolderKanban,
  LifeBuoy,
  ListChecks,
  MessageSquare,
  PlusCircle,
  Receipt,
  UploadCloud,
} from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { useClientAuth } from "@/hooks/use-client-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  icon: typeof FolderKanban;
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

function Panel({
  icon: Icon,
  title,
  action,
  children,
  className,
}: {
  icon: typeof Activity;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft", className)}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  description,
}: {
  to: string;
  icon: typeof PlusCircle;
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
  const { user } = useClientAuth();
  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <ClientPortalShell>
      <div className="space-y-6">
        <section className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
            <div>
              <div className="text-sm font-medium text-primary">Client workspace</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome back, {firstName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Track project progress, share files, review invoices, and stay connected with the
                delivery team from one clean dashboard.
              </p>
            </div>

            <div className="grid gap-2 rounded-lg border border-border/70 bg-background/45 p-3">
              <div className="flex items-center justify-between gap-3 rounded-md bg-card/70 px-3 py-2">
                <span className="text-xs text-muted-foreground">Account</span>
                <span className="text-sm font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md bg-card/70 px-3 py-2">
                <span className="text-xs text-muted-foreground">Next step</span>
                <span className="text-sm font-medium">Create project</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/client/projects/new">
                <PlusCircle className="h-4 w-4" />
                Start New Project
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/client/messages">
                <MessageSquare className="h-4 w-4" />
                Message Team
              </Link>
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FolderKanban}
            label="Active Projects"
            value="0"
            helper="No active build yet"
            to="/client/projects"
          />
          <StatCard
            icon={Receipt}
            label="Open Invoices"
            value="0"
            helper="Nothing pending"
            to="/client/invoices"
          />
          <StatCard
            icon={CreditCard}
            label="Payments"
            value="₹0"
            helper="Paid this cycle"
            to="/client/payments"
          />
          <StatCard
            icon={LifeBuoy}
            label="Support Tickets"
            value="0"
            helper="All clear"
            to="/client/support"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel
            icon={FolderKanban}
            title="Project Overview"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/client/projects">View all</Link>
              </Button>
            }
          >
            <div className="rounded-lg border border-dashed border-border/80 bg-background/45 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Ready to begin your first project</h2>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                    Submit requirements and the team will prepare milestones, estimates, and a
                    delivery plan.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to="/client/projects/new">Create Project</Link>
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Requirements", icon: CheckCircle2, state: "Pending" },
                  { label: "Proposal", icon: Clock3, state: "After review" },
                  { label: "Kickoff", icon: Calendar, state: "Scheduled later" },
                ].map(({ label, icon: Icon, state }) => (
                  <div key={label} className="rounded-md bg-card/80 p-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <div className="mt-2 text-sm font-medium">{label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{state}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel icon={PlusCircle} title="Quick Actions">
            <div className="grid gap-3">
              <QuickAction
                to="/client/projects/new"
                icon={PlusCircle}
                label="New project"
                description="Share goals and budget"
              />
              <QuickAction
                to="/client/requirements"
                icon={ListChecks}
                label="Requirements"
                description="Add project details"
              />
              <QuickAction
                to="/client/files"
                icon={UploadCloud}
                label="Upload files"
                description="Send assets securely"
              />
              <QuickAction
                to="/client/support"
                icon={LifeBuoy}
                label="Get support"
                description="Raise a ticket"
              />
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Panel icon={Activity} title="Recent Activity">
            <div className="rounded-lg bg-background/45 p-4">
              <p className="text-sm font-medium">No activity yet</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Updates from proposals, milestones, files, and invoices will appear here.
              </p>
            </div>
          </Panel>

          <Panel icon={Calendar} title="Upcoming Meetings">
            <div className="rounded-lg bg-background/45 p-4">
              <p className="text-sm font-medium">Nothing scheduled</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Meeting links and agenda notes will be shown here.
              </p>
            </div>
          </Panel>

          <Panel icon={Bell} title="Notifications">
            <div className="rounded-lg bg-background/45 p-4">
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Important project and billing alerts will arrive here.
              </p>
            </div>
          </Panel>
        </div>

        <Panel
          icon={FileText}
          title="Files and Messages"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/client/files">Open files</Link>
            </Button>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Link
              to="/client/files"
              className="rounded-lg border border-border/70 bg-background/45 p-4 transition hover:border-primary/50 hover:bg-accent"
            >
              <FileText className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm font-medium">Shared documents</div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Contracts, brand assets, deliverables, and approvals stay organized here.
              </p>
            </Link>
            <Link
              to="/client/messages"
              className="rounded-lg border border-border/70 bg-background/45 p-4 transition hover:border-primary/50 hover:bg-accent"
            >
              <MessageSquare className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm font-medium">Team conversations</div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Message the delivery team and keep project communication in one place.
              </p>
            </Link>
          </div>
        </Panel>
      </div>
    </ClientPortalShell>
  );
}
