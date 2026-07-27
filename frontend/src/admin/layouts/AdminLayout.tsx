import { type ReactNode } from "react";
import { Outlet } from "@tanstack/react-router";
import { AdminUIProvider } from "@/admin/context/AdminUIContext";
import { AdminSidebar } from "@/admin/components/AdminSidebar";
import { AdminTopbar } from "@/admin/components/AdminTopbar";
import { NotificationDrawer } from "@/admin/components/NotificationDrawer";

export function AdminLayout({ children }: { children?: ReactNode }) {
  return (
    <AdminUIProvider>
      <div className="flex min-h-screen w-full bg-linear-to-br from-background via-background to-[color-mix(in_oklab,var(--brand)_4%,transparent)]">
        <AdminSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children ?? <Outlet />}</main>
          <footer className="border-t border-border/60 px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
            © {new Date().getFullYear()} Netweavesolutions — Admin Console v1.0
          </footer>
        </div>
        <NotificationDrawer />
      </div>
    </AdminUIProvider>
  );
}

