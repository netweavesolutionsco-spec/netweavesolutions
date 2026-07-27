import { createFileRoute } from "@tanstack/react-router";
import { WebsitePage } from "@/admin/pages/WebsitePage";

export const Route = createFileRoute("/admin/website")({
  component: WebsitePage,
});
