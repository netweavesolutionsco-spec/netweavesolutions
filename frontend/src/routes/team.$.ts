import { createFileRoute } from "@tanstack/react-router";
import { proxyClientApiRequest } from "@/lib/client-api-proxy.server";

// Proxies the Team Management API (/team/invitations, /team/members, and the
// public /team/invitations/accept flow) to the backend, same-origin, so the
// browser never crosses CORS. The invite-accept PAGE lives at /accept-invite
// (a separate top-level route) to avoid colliding with this API namespace.
const handler = ({ request }: { request: Request }) => proxyClientApiRequest(request);

export const Route = createFileRoute("/team/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
    },
  },
});
