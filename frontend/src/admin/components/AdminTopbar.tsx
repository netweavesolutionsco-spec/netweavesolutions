import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  Sun,
  Moon,
  Command as CommandIcon,
  LogOut,
  Settings as SettingsIcon,
  UserCircle,
  ScanSearch,
} from "lucide-react";
import { openSeoDrawer } from "@/components/seo-audit-drawer";
import { useAdminUI } from "@/admin/context/AdminUIContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@tanstack/react-router";
import { useAuthUser, useIsAdmin } from "@/hooks/useAuthUser";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function AdminTopbar() {
  const { setMobileOpen, setNotifOpen, unreadCount } = useAdminUI();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const { user } = useAuthUser();
  const { isAdmin } = useIsAdmin();
  const [profile, setProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? null));
  }, [user]);

  const name =
    profile?.display_name ||
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "User";
  const avatar =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const role = isAdmin ? "Admin" : "Member";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-3 sm:px-5">
        <button
          className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything…"
            className="h-10 rounded-xl border-border/60 bg-muted/40 pl-9 pr-16 focus-visible:ring-1"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline-flex">
            <CommandIcon className="h-3 w-3" /> K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 rounded-xl md:inline-flex"
            onClick={openSeoDrawer}
          >
            <ScanSearch className="h-4 w-4" /> SEO Audit
          </Button>

          <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Messages">
            <MessageSquare className="h-4 w-4" />
          </Button>

          <button
            className="relative rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => setNotifOpen(true)}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-(--brand) px-1 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 py-1 pl-1 pr-2 hover:bg-accent">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={avatar} />
                  <AvatarFallback>{initials || "U"}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <div className="text-xs font-semibold leading-tight">{name}</div>
                  <div className="text-[10px] leading-tight text-muted-foreground">{role}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/settings">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => supabase.auth.signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {unreadCount > 0 && (
        <div className="flex items-center justify-center border-t border-dashed border-border/40 bg-muted/20 py-1 text-[11px] text-muted-foreground md:hidden">
          <Badge variant="secondary" className="mr-1">
            {unreadCount}
          </Badge>{" "}
          new notifications
        </div>
      )}
    </header>
  );
}
