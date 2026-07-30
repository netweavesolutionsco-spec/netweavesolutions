import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/admin/pages/DashboardPage";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Dashboard — Netweavesolutions Admin" }],
  }),
  component: AdminIndex,
});

function AdminIndex() {
  return <DashboardPage />;
}

