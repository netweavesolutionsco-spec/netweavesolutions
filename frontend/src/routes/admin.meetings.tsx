import { createFileRoute } from "@tanstack/react-router";
import { MeetingRequestsPage } from "@/admin/pages/MeetingRequestsPage";
export const Route = createFileRoute("/admin/meetings")({ component: MeetingRequestsPage });
