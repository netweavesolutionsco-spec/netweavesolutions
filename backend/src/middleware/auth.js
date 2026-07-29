import { supabaseAdmin } from "../config/supabase.js";
import { findClientById } from "../services/clientService.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const client = await findClientById(data.user.id);
    if (!client || client.status !== "active") {
      return res.status(401).json({ error: "Invalid session" });
    }
    req.client = client;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Role gate. Use AFTER requireAuth, e.g. router.post(..., requireAuth,
 * requireRole("admin", "manager"), handler). Kept separate and unused by
 * existing routes so it changes no current behavior; it's here for gating
 * future staff-only endpoints.
 */
export function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.client?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
