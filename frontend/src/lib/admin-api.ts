import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch helper for admin-only backend endpoints (Team Management).
 *
 * Unlike the client portal (which holds its own in-memory access token), the
 * Admin Panel authenticates directly against Supabase. So admin → backend calls
 * carry the admin's Supabase access token as a Bearer, which the backend's
 * `requireAdmin` middleware verifies and role-checks.
 *
 * Requests are same-origin: in production the TanStack `/team/$` server route
 * proxies them to the backend, so the browser never crosses CORS. In dev the
 * proxy forwards to the local backend the same way.
 */

// In dev, Vite serves the app and the TanStack server routes on the same origin,
// so an empty base (same-origin) works in both dev and prod.
const BASE = "";

export class AdminApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const auth = await authHeader();
  for (const [k, v] of Object.entries(auth)) headers.set(k, v);

  const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
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
    throw new AdminApiError(res.status, message, data);
  }
  return data as T;
}

export const adminApi = {
  get: <T = unknown>(p: string) => request<T>(p, { method: "GET" }),
  post: <T = unknown>(p: string, body?: unknown) =>
    request<T>(p, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T = unknown>(p: string, body?: unknown) =>
    request<T>(p, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T = unknown>(p: string) => request<T>(p, { method: "DELETE" }),
};

// ---- Shared types for the Team Management UI ----

export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export interface TeamInvitation {
  id: string;
  email: string;
  fullName: string;
  role: string;
  appRole: string;
  department: string | null;
  message: string | null;
  status: InvitationStatus;
  invitedByName: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  role: "admin" | "editor" | "manager" | "viewer";
  fullName: string;
  email: string;
  avatarUrl: string;
  status: "active" | "suspended" | "pending";
  lastLogin: string | null;
  createdAt: string | null;
}
