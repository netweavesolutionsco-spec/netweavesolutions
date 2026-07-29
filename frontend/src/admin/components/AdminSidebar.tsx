import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Globe,
  Briefcase,
  FolderKanban,
  Newspaper,
  Tag,
  MessageSquareQuote,
  Users2,
  UserRoundSearch,
  Inbox,
  Image as ImageIcon,
  BarChart3,
  Shield,
  Bell,
  Settings,
  UserCircle,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";
import { useAdminUI } from "@/admin/context/AdminUIContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

const nav = [
  {
    group: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    group: "Content",
    items: [
      { to: "/admin/cms", label: "CMS (Live Content)", icon: Sparkles },
      { to: "/admin/collections", label: "Collections", icon: Sparkles },
      { to: "/admin/builder", label: "Website Builder", icon: Wand2 },
      { to: "/admin/website", label: "Website", icon: Globe },
      { to: "/admin/services", label: "Services", icon: Briefcase },
      { to: "/admin/portfolio", label: "Portfolio", icon: FolderKanban },
      { to: "/admin/blog", label: "Blog", icon: Newspaper },
      { to: "/admin/pricing", label: "Pricing", icon: Tag },
      { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
      { to: "/admin/media", label: "Media", icon: ImageIcon },
    ],
  },
  {
    group: "People",
    items: [
      { to: "/admin/team", label: "Team", icon: Users2 },
      { to: "/admin/careers", label: "Careers", icon: UserRoundSearch },
      { to: "/admin/leads", label: "Leads", icon: Inbox },
      { to: "/admin/users", label: "Users", icon: Shield },
    ],
  },
  {
    group: "Account",
    items: [
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/profile", label: "Profile", icon: UserCircle },
    ],
  },
] as const;

export function AdminSidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useAdminUI();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const content = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-5",
          sidebarCollapsed && "justify-center px-2",
        )}
      >
        <LogoMark className="md:h-9" />
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Netweavesolutions</div>
            <div className="truncate text-xs text-muted-foreground">Admin Console</div>
          </div>
        )}
        <button
          className="ml-auto hidden rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground lg:inline-flex"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
        <button
          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {nav.map((section) => (
          <div key={section.group} className="mt-2">
            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.group}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, (item as { exact?: boolean }).exact);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                        active
                          ? "bg-linear-to-r from-[color-mix(in_oklab,var(--brand)_18%,transparent)] to-transparent text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        sidebarCollapsed && "justify-center px-2",
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "text-(--brand)")} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      {!sidebarCollapsed && active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-(--brand)" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3">
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            "w-full justify-start gap-2 text-muted-foreground",
            sidebarCollapsed && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4" />
          {!sidebarCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/60 bg-card/60 backdrop-blur-xl transition-[width] duration-300 lg:block",
          sidebarCollapsed ? "w-19" : "w-64",
        )}
      >
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {/* Mobile */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-72 max-w-[90vw] border-r border-border/60 bg-card shadow-2xl transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {content}
        </aside>
      </div>
    </>
  );
}

