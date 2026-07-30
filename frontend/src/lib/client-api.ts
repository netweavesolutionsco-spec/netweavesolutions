/**
 * Fetch client for the standalone Node.js Client API (server/).
 * The production browser client uses same-origin API routes. Those routes proxy
 * to the deployed backend so the browser never depends on cross-origin CORS.
 *
 * Access token is held in memory; refresh token is a httpOnly cookie
 * set by the API on the API's origin. On 401 we transparently refresh once.
 */

const DEFAULT_DEV_API_BASE_URL = "http://localhost:4000";

function normalizeApiBaseUrl(value?: string): string {
  const trimmed = value?.trim();

  if (!trimmed) return "";

  // Remove trailing slashes for consistency
  return trimmed.replace(/\/$/, "");
}

const resolvedEnvUrl = import.meta.env.VITE_CLIENT_API_URL as string | undefined;
const API_URL: string = import.meta.env.PROD
  ? ""
  : normalizeApiBaseUrl(resolvedEnvUrl) || DEFAULT_DEV_API_BASE_URL;

// Log the resolved API URL (both in dev and in browser console for debugging)
const logMessage = `[client-api] API URL: ${
  API_URL || "same-origin"
} (env: ${import.meta.env.PROD ? "ignored in production" : resolvedEnvUrl || "NOT SET"})`;
if (import.meta.env.DEV) {
  console.debug(logMessage);
} else {
  // Always log in production to help debug issues
  console.info(logMessage);
}

export function getApiBaseUrl(): string {
  return API_URL;
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

let accessToken: string | null = null;
type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function setAccessToken(token: string | null) {
  accessToken = token;
  listeners.forEach((l) => l(token));
}
export function getAccessToken() {
  return accessToken;
}
export function subscribeAccessToken(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Fired when a request came back 401 and the refresh token could not renew the
 * session — i.e. the login has truly expired. ClientAuthProvider subscribes so
 * it can drop the user and let the portal shell redirect to the login page,
 * instead of leaving a raw "Invalid or expired token" error on screen.
 */
type ExpiredListener = () => void;
const expiredListeners = new Set<ExpiredListener>();

export function subscribeSessionExpired(l: ExpiredListener) {
  expiredListeners.add(l);
  return () => expiredListeners.delete(l);
}

function notifySessionExpired() {
  accessToken = null;
  expiredListeners.forEach((l) => l());
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function isApiConfigured() {
  return true;
}

async function raw(path: string, init: RequestInit = {}): Promise<Response> {
  const targetUrl = buildApiUrl(path);
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  try {
    return await fetch(targetUrl, { ...init, headers, credentials: "include" });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(
        0,
        `Unable to reach backend API at ${API_URL || "this site"}${path}. Check that the client API proxy and backend are running. (${error.message})`,
        null,
      );
    }
    throw error;
  }
}

async function parse(res: Response) {
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    let message = res.statusText || "Request failed";
    if (data && typeof data === "object" && "error" in data) {
      message = String((data as { error: unknown }).error);
    }
    throw new ApiError(res.status, message, data);
  }

  return data;
}

let refreshInFlight: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await raw("/auth/refresh", { method: "POST" });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken?: string };
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  // /auth/me deliberately participates in the refresh retry: on a hard reload
  // the access token is gone from memory, and that first 401 -> refresh -> retry
  // is exactly how the session is restored from the httpOnly refresh cookie.
  const isAuthEndpoint =
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/register");

  let res = await raw(path, init);
  if (res.status === 401 && !isAuthEndpoint) {
    const ok = await tryRefresh();
    if (ok) {
      res = await raw(path, init);
    } else {
      // The refresh token is gone or rejected — the login has truly expired.
      notifySessionExpired();
    }
  }
  return (await parse(res)) as T;
}

export const api = {
  get: <T = unknown>(p: string) => apiFetch<T>(p, { method: "GET" }),
  post: <T = unknown>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T = unknown>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T = unknown>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T = unknown>(p: string) => apiFetch<T>(p, { method: "DELETE" }),
};

export interface ClientUser {
  _id: string;
  id?: string;
  email: string;
  fullName: string;
  phone?: string;
  companyName?: string;
  country?: string;
  countryCode?: string;
  whatsapp?: string;
  emailVerified?: boolean;
  /** Derived from Supabase `app_metadata.phone_verified` (service-role only). */
  phoneVerified?: boolean;
  profilePhotoUrl?: string;
  companyLogoUrl?: string;
  industry?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
  linkedin?: string;
  timezone?: string;
  createdAt?: string;
  lastLoginAt?: string;
}
