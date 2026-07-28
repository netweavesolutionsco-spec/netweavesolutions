import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  ListChecks,
  FileText,
  Receipt,
  CreditCard,
  Calendar,
  LifeBuoy,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useClientAuth } from "@/hooks/use-client-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV: ReadonlyArray<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/client", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/client/projects", label: "My Projects", icon: FolderKanban, exact: true },
  { to: "/client/projects/new", label: "Create New Project", icon: PlusCircle, exact: true },
  { to: "/client/requirements", label: "My Requirements", icon: ListChecks },
  { to: "/client/files", label: "Files", icon: FileText },
  { to: "/client/invoices", label: "Invoices", icon: Receipt },
  { to: "/client/payments", label: "Payments", icon: CreditCard },
  { to: "/client/meetings", label: "Meetings", icon: Calendar },
  { to: "/client/support", label: "Support", icon: LifeBuoy },
  { to: "/client/messages", label: "Messages", icon: MessageSquare },
  { to: "/client/notifications", label: "Notifications", icon: Bell },
  { to: "/client/profile", label: "Profile", icon: User },
  { to: "/client/settings", label: "Settings", icon: Settings },
];

export function ClientPortalShell({ children, title }: { children: ReactNode; title?: string }) {
  const { user, loading, configured, logout } = useClientAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!configured) return;
    if (!user) {
      const redirect = pathname;
      navigate({ to: "/client/login", search: { redirect } as never, replace: true });
    }
  }, [user, loading, configured, navigate, pathname]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Client Portal not configured</h1>
        <p className="mt-3 text-muted-foreground">
          Set <code className="rounded bg-muted px-1.5 py-0.5">VITE_CLIENT_API_URL</code> in the
          project's environment variables to your deployed Client API URL, then reload.
        </p>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-64 lg:shrink-0">
          <div className="flex h-full flex-col rounded-xl border border-border/70 bg-card/80 shadow-soft backdrop-blur">
            <div className="border-b border-border/70 p-4">
              <div className="truncate text-sm font-semibold">{user.fullName}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</div>
            </div>

            <nav className="flex gap-1 overflow-x-auto p-2 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto">
              {NAV.map(({ to, label, icon: Icon, exact }) => {
                const active = exact
                  ? pathname === to
                  : pathname === to || pathname.startsWith(to + "/");
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors lg:w-full",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap lg:whitespace-normal">{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border/70 p-2">
              <Button asChild variant="ghost" size="sm" className="mb-1 w-full justify-start">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to website
                </Link>
              </Button>
              <button
                onClick={async () => {
                  await logout();
                  navigate({ to: "/client/login" });
                }}
                className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {title && (
            <header className="mb-5 rounded-xl border border-border/70 bg-card/80 px-5 py-4 shadow-soft">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            </header>
          )}
          {children}
        </section>
      </div>
    </main>
  );
}

export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This module ships in Phase 2. Your Client API already has the schema for it.
      </p>
      <div className="mt-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/client">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
