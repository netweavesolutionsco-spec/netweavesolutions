import { createFileRoute } from "@tanstack/react-router";
import { proxyClientApiRequest } from "@/lib/client-api-proxy.server";

const handler = ({ request }: { request: Request }) => proxyClientApiRequest(request);

export const Route = createFileRoute("/leads")({
  server: {
    handlers: {
      POST: handler,
    },
  },
});
