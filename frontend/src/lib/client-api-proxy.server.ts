const DEFAULT_BACKEND_API_URL = "https://netweavesolutions.onrender.com";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function normalizeBackendUrl(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_BACKEND_API_URL;
  return trimmed.replace(/\/$/, "");
}

function getBackendApiUrl(): string {
  return normalizeBackendUrl(
    process.env.CLIENT_API_URL ||
      process.env.VITE_CLIENT_API_URL ||
      process.env.API_PUBLIC_URL ||
      DEFAULT_BACKEND_API_URL,
  );
}

function createForwardHeaders(request: Request): Headers {
  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP_HEADERS) {
    headers.delete(name);
  }
  headers.delete("host");
  return headers;
}

function copyResponseHeaders(response: Response): Headers {
  const headers = new Headers(response.headers);
  for (const name of HOP_BY_HOP_HEADERS) {
    headers.delete(name);
  }
  headers.delete("access-control-allow-credentials");
  headers.delete("access-control-allow-origin");
  return headers;
}

function stripCookieDomain(setCookie: string): string {
  return setCookie
    .split(";")
    .filter((part) => !part.trim().toLowerCase().startsWith("domain="))
    .join(";");
}

function appendSetCookies(headers: Headers, responseHeaders: Headers) {
  const getSetCookie = (responseHeaders as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;
  const fallbackSetCookie = responseHeaders.get("set-cookie");
  const setCookies =
    getSetCookie?.call(responseHeaders) ?? (fallbackSetCookie ? [fallbackSetCookie] : []);

  if (!setCookies.length) return;

  headers.delete("set-cookie");
  for (const setCookie of setCookies) {
    headers.append("set-cookie", stripCookieDomain(setCookie));
  }
}

export async function proxyClientApiRequest(request: Request): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(`${getBackendApiUrl()}${incomingUrl.pathname}${incomingUrl.search}`);
  const method = request.method.toUpperCase();

  try {
    const backendResponse = await fetch(backendUrl, {
      method,
      headers: createForwardHeaders(request),
      body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
    });

    const headers = copyResponseHeaders(backendResponse);
    appendSetCookies(headers, backendResponse.headers);

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers,
    });
  } catch (error) {
    console.error("[client-api-proxy] Backend request failed", error);
    return new Response(JSON.stringify({ error: "Client API is temporarily unavailable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
