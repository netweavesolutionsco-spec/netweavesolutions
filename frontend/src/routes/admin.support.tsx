import { createFileRoute } from "@tanstack/react-router";
import { SupportRequestsPage } from "@/admin/pages/SupportRequestsPage";
export const Route = createFileRoute("/admin/support")({ component: SupportRequestsPage });
