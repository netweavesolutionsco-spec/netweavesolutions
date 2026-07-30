import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminLayout } from "@/admin/layouts/AdminLayout";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Netweavesolutions" },
      {
        name: "description",
        content: "Manage your Netweavesolutions website, content and operations.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRoot,
});

function AdminRoot() {
  const { session, loading } = useAuthUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

