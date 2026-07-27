/**
 * Fetch client for the standalone Node.js Client API (server/).
 * The API URL is configured via VITE_CLIENT_API_URL.
 *
 * Access token is held in memory; refresh token is a httpOnly cookie
 * set by the API on the API's origin. On 401 we transparently refresh once.
 */

const DEFAULT_API_BASE_URL = "https://netweavesolutions.onrender.com";

function normalizeApiBaseUrl(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    // Always fall back to production URL if env var is missing, empty, or whitespace
    return DEFAULT_API_BASE_URL;
  }
  // Remove trailing slashes for consistency
  return trimmed.replace(/\/$/, "");
}

// Resolve API URL with explicit fallback
const resolvedEnvUrl = import.meta.env.VITE_CLIENT_API_URL as string | undefined;
const API_URL: string = normalizeApiBaseUrl(resolvedEnvUrl) || DEFAULT_API_BASE_URL;

// Log the resolved API URL in development
if (import.meta.env.DEV) {
  console.debug(
    `[client-api] Resolved API URL to: ${API_URL} (env: ${resolvedEnvUrl || "NOT SET"})`
  );
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
  return Boolean(API_URL);
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
        `Unable to reach backend API at ${API_URL}${path}. Check that VITE_CLIENT_API_URL is set to your deployed API and that the backend is running. (${error.message})`,
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
  let res = await raw(path, init);
  if (res.status === 401 && !path.startsWith("/auth/refresh") && !path.startsWith("/auth/login")) {
    const ok = await tryRefresh();
    if (ok) res = await raw(path, init);
  }
  return (await parse(res)) as T;
}

export const api = {
  get: <T = unknown>(p: string) => apiFetch<T>(p, { method: "GET" }),
  post: <T = unknown>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T = unknown>(p: string, body?: unknown) =>
    apiFetch<T>(p, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T = unknown>(p: string) => apiFetch<T>(p, { method: "DELETE" }),
};

export interface ClientUser {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  companyName?: string;
  country?: string;
  emailVerified?: boolean;
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
