import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Calculator, UserCircle2, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";
import { openEstimator } from "@/components/cost-estimator-modal";
import { useClientAuth, useRequireClientAuth } from "@/hooks/use-client-auth";

export function Navbar() {
  const { location } = useRouterState();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const settings = useSiteSettings();
  const navItems = settings.nav.filter((n) => n.enabled);
  const { user: clientUser, logout } = useClientAuth();
  const requireAuth = useRequireClientAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" aria-label={settings.brand.name} className="shrink-0">
            <Logo />
          </Link>

          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
            {navItems.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button size="sm" className="hidden md:inline-flex" onClick={() => openEstimator()}>
              <Calculator className="h-4 w-4" /> Free Estimate
            </Button>
            {clientUser ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/client">
                    <UserCircle2 className="h-4 w-4" />
                    {clientUser.fullName?.split(" ")[0] || "Portal"}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex text-muted-foreground"
                  aria-label="Sign out"
                  onClick={async () => {
                    await logout();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
              >
                <Link to="/client/login">Client Login</Link>
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
            >
              <Link to="/admin">Admin</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden pb-4"
            >
              <div
                className="rounded-xl border border-border bg-card p-2 shadow-xl"
                style={{ maxHeight: "calc(100vh - 6rem)" }}
              >
                <nav aria-label="Mobile navigation" className="space-y-1 overflow-y-auto">
                  {navItems.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      {n.label}
                    </Link>
                  ))}
                  <Link
                    to={clientUser ? "/client" : "/client/login"}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                  >
                    {clientUser ? "Client Portal" : "Client Login"}
                  </Link>
                  <Link
                    to="/admin"
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
                  >
                    Admin
                  </Link>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

