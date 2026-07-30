import { createFileRoute } from "@tanstack/react-router";
import { RequirementsPage } from "@/admin/pages/RequirementsPage";

export const Route = createFileRoute("/admin/requirements")({
  component: RequirementsPage,
});
