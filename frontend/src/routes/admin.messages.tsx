import { createFileRoute } from "@tanstack/react-router";
import { ClientMessagesPage } from "@/admin/pages/ClientMessagesPage";
export const Route = createFileRoute("/admin/messages")({ component: ClientMessagesPage });
