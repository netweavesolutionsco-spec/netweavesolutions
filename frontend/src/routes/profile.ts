import { createFileRoute } from "@tanstack/react-router";
import { proxyClientApiRequest } from "@/lib/client-api-proxy.server";

const handler = ({ request }: { request: Request }) => proxyClientApiRequest(request);

export const Route = createFileRoute("/profile")({
  server: {
    handlers: {
      GET: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
    },
  },
});
