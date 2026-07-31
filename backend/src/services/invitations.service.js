import crypto from "node:crypto";
import { supabaseAdmin } from "../config/supabase.js";
import { env } from "../config/env.js";
import { sendMail, emailTemplates, isMailConfigured } from "../utils/mailer.js";
import { insertAdminNotification } from "./portal.service.js";

/**
 * Team Management service.
 *
 * Backs the Admin Panel "Invite Member" flow and member administration. All
 * writes go through the Supabase service role (RLS-bypassing) because the
 * operations here — creating auth users, granting roles, suspending accounts —
 * are privileged and must never be exposed to the browser directly.
 *
 * The six display roles offered in the invite modal are richer than the
 * app_role enum (admin | editor | viewer | customer | manager), so we persist
 * the human label AND the mapped enum. See team_invitations migration.
 */

const INVITE_TTL_DAYS = 7;

const DISPLAY_ROLES = [
  "Super Admin",
  "Admin",
  "Manager",
  "Editor",
  "Content Manager",
  "Support",
];

/** Map a human display role to the app_role enum granted on accept. */
export function mapDisplayRoleToAppRole(displayRole) {
  switch (String(displayRole || "").trim().toLowerCase()) {
    case "super admin":
    case "admin":
      return "admin";
    case "manager":
      return "manager";
    case "editor":
    case "content manager":
      return "editor";
    case "support":
      return "viewer";
    default:
      return "viewer";
  }
}

export function isValidDisplayRole(displayRole) {
  return DISPLAY_ROLES.some(
    (r) => r.toLowerCase() === String(displayRole || "").trim().toLowerCase(),
  );
}

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function generateToken() {
  // 48 bytes of CSPRNG entropy, URL-safe. Single-use secret embedded in the link.
  return crypto.randomBytes(48).toString("base64url");
}

function acceptUrl(token) {
  return `${env.SITE_URL}/accept-invite?token=${encodeURIComponent(token)}`;
}

function formatExpiry(expiresAt) {
  try {
    return new Date(expiresAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

/** Public-safe shape (no token) for the Admin Panel list. */
function toInvitationDto(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.display_role,
    appRole: row.app_role,
    department: row.department,
    message: row.message,
    status: row.status,
    invitedByName: row.invited_by_name,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

/**
 * Lazily flips still-`pending` invitations whose expiry has passed to `expired`.
 * Best-effort — a failure here must not break listing.
 */
async function expireStale() {
  try {
    await supabaseAdmin
      .from("team_invitations")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());
  } catch (err) {
    console.warn("[invitations] expireStale failed:", err?.message ?? err);
  }
}

async function findExistingMember(email) {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data?.users?.find((u) => u.email?.toLowerCase() === normalized) ?? null;
}

/**
 * Creates (or refreshes) an invitation and emails the invitee. Throws a tagged
 * error (err.statusCode) for expected conflicts so the controller can map them
 * to 4xx responses.
 */
export async function createInvitation({
  email,
  fullName,
  displayRole,
  department,
  message,
  invitedBy,
  invitedByName,
}) {
  const normalized = normalizeEmail(email);
  if (!isValidDisplayRole(displayRole)) {
    const e = new Error("Invalid role");
    e.statusCode = 400;
    throw e;
  }

  // Already a member? Block — use member management instead.
  const existing = await findExistingMember(normalized);
  if (existing) {
    const e = new Error("A user with this email already exists.");
    e.statusCode = 409;
    throw e;
  }

  await expireStale();

  // Duplicate pending invitation? Block (the partial unique index also guards this).
  const { data: pending } = await supabaseAdmin
    .from("team_invitations")
    .select("id")
    .eq("status", "pending")
    .ilike("email", normalized)
    .maybeSingle();
  if (pending) {
    const e = new Error("An invitation for this email is already pending. Resend or cancel it instead.");
    e.statusCode = 409;
    throw e;
  }

  const token = generateToken();
  const appRole = mapDisplayRoleToAppRole(displayRole);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("team_invitations")
    .insert({
      email: normalized,
      full_name: fullName.trim(),
      display_role: displayRole,
      app_role: appRole,
      department: department?.trim() || null,
      message: message?.trim() || null,
      token,
      status: "pending",
      invited_by: invitedBy || null,
      invited_by_name: invitedByName || null,
      expires_at: expiresAt,
    })
    .select("*")
    .single();
  if (error) throw error;

  const emailResult = await sendInvitationEmail(data);

  await insertAdminNotification({
    title: "Team invitation sent",
    description: `${fullName} (${normalized}) was invited as ${displayRole}.`,
    userName: invitedByName || null,
    relatedModule: "team",
    type: "info",
    actionUrl: "/admin/team",
  });

  return { invitation: toInvitationDto(data), emailDelivered: emailResult.delivered };
}

/** Sends the branded invitation email. Never throws — returns delivery status. */
async function sendInvitationEmail(row) {
  try {
    const tpl = emailTemplates.teamInvitation({
      fullName: row.full_name,
      inviterName: row.invited_by_name,
      role: row.display_role,
      department: row.department,
      message: row.message,
      acceptUrl: acceptUrl(row.token),
      expiresLabel: formatExpiry(row.expires_at),
    });
    const res = await sendMail({ to: row.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    return { delivered: Boolean(res?.delivered) };
  } catch (err) {
    console.error("[invitations] invitation email failed:", err?.message ?? err);
    return { delivered: false };
  }
}

export async function listInvitations() {
  await expireStale();
  const { data, error } = await supabaseAdmin
    .from("team_invitations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map(toInvitationDto);
}

export async function resendInvitation(id, { invitedByName } = {}) {
  const { data: row, error: findErr } = await supabaseAdmin
    .from("team_invitations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!row) {
    const e = new Error("Invitation not found");
    e.statusCode = 404;
    throw e;
  }
  if (row.status === "accepted") {
    const e = new Error("This invitation was already accepted.");
    e.statusCode = 409;
    throw e;
  }

  // Fresh token + expiry, and re-open it as pending (covers expired/cancelled).
  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString();
  const { data: updated, error: updErr } = await supabaseAdmin
    .from("team_invitations")
    .update({
      token,
      status: "pending",
      expires_at: expiresAt,
      invited_by_name: invitedByName || row.invited_by_name,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (updErr) throw updErr;

  const emailResult = await sendInvitationEmail(updated);
  return { invitation: toInvitationDto(updated), emailDelivered: emailResult.delivered };
}

export async function cancelInvitation(id) {
  const { data, error } = await supabaseAdmin
    .from("team_invitations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .neq("status", "accepted")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const e = new Error("Invitation not found or already accepted.");
    e.statusCode = 404;
    throw e;
  }
  return toInvitationDto(data);
}

/** Public: look up an invitation by token for the accept page. No secrets returned. */
export async function getInvitationForAccept(token) {
  await expireStale();
  const { data: row, error } = await supabaseAdmin
    .from("team_invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  if (!row) return { valid: false, reason: "not_found" };

  if (row.status === "accepted") return { valid: false, reason: "accepted" };
  if (row.status === "cancelled") return { valid: false, reason: "cancelled" };
  if (row.status === "expired" || new Date(row.expires_at) < new Date()) {
    return { valid: false, reason: "expired" };
  }

  return {
    valid: true,
    invitation: {
      email: row.email,
      fullName: row.full_name,
      role: row.display_role,
      department: row.department,
      invitedByName: row.invited_by_name,
      expiresAt: row.expires_at,
    },
  };
}

/**
 * Public: completes an invitation — creates the auth user, grants the mapped
 * role, marks the invitation accepted. Idempotency: a second accept with the
 * same token fails cleanly because the invitation is no longer pending.
 */
export async function acceptInvitation({ token, password, fullName }) {
  const { data: row, error } = await supabaseAdmin
    .from("team_invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  if (!row) {
    const e = new Error("Invitation not found.");
    e.statusCode = 404;
    throw e;
  }
  if (row.status !== "pending" || new Date(row.expires_at) < new Date()) {
    const e = new Error("This invitation is no longer valid.");
    e.statusCode = 410;
    throw e;
  }

  // Guard against a race where the user was created between invite and accept.
  const existing = await findExistingMember(row.email);
  if (existing) {
    const e = new Error("An account already exists for this email. Try signing in.");
    e.statusCode = 409;
    throw e;
  }

  const displayName = (fullName || row.full_name || "").trim();

  const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: row.email,
    password,
    email_confirm: true, // invited members are pre-verified via the emailed link
    user_metadata: {
      display_name: displayName,
      full_name: displayName,
    },
  });
  if (authErr) throw authErr;
  const authUser = created?.user;
  if (!authUser) throw new Error("Could not create the account.");

  // Ensure a profile row (handle_new_user may also create one; upsert is safe).
  await supabaseAdmin
    .from("profiles")
    .upsert(
      { id: authUser.id, display_name: displayName, email: row.email, status: "active" },
      { onConflict: "id" },
    );

  // Grant the mapped role. handle_new_user seeds a default role for non-first
  // users (viewer); replace it with the invited role so permissions are correct.
  await supabaseAdmin.from("user_roles").delete().eq("user_id", authUser.id);
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: authUser.id, role: row.app_role });
  if (roleErr) throw roleErr;

  const { error: markErr } = await supabaseAdmin
    .from("team_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_user_id: authUser.id,
    })
    .eq("id", row.id);
  if (markErr) throw markErr;

  await insertAdminNotification({
    title: "Team invitation accepted",
    description: `${displayName || row.email} accepted their invitation and joined as ${row.display_role}.`,
    userName: displayName || null,
    relatedModule: "team",
    type: "success",
    actionUrl: "/admin/team",
  });

  return { ok: true, email: row.email };
}

// ---------------------------------------------------------------------------
// Member management
// ---------------------------------------------------------------------------

/** Members = users holding a staff role (admin | editor | manager | viewer). */
const STAFF_ROLES = ["admin", "editor", "manager", "viewer"];

export async function listMembers() {
  const { data: roleRows, error: rolesErr } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role")
    .in("role", STAFF_ROLES);
  if (rolesErr) throw rolesErr;

  // Collapse to one entry per user, keeping the highest-privilege role.
  const priority = { admin: 4, manager: 3, editor: 2, viewer: 1 };
  const byUser = new Map();
  for (const r of roleRows ?? []) {
    const prev = byUser.get(r.user_id);
    if (!prev || (priority[r.role] ?? 0) > (priority[prev] ?? 0)) {
      byUser.set(r.user_id, r.role);
    }
  }
  const ids = [...byUser.keys()];
  if (!ids.length) return [];

  const { data: profiles, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, email, avatar_url, status, last_login, created_at")
    .in("id", ids);
  if (profErr) throw profErr;

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  return ids.map((id) => {
    const p = profileById.get(id) ?? {};
    return {
      id,
      role: byUser.get(id),
      fullName: p.display_name ?? "",
      email: p.email ?? "",
      avatarUrl: p.avatar_url ?? "",
      status: p.status ?? "active",
      lastLogin: p.last_login ?? null,
      createdAt: p.created_at ?? null,
    };
  });
}

export async function updateMemberRole(userId, appRole) {
  if (!STAFF_ROLES.includes(appRole)) {
    const e = new Error("Invalid role");
    e.statusCode = 400;
    throw e;
  }
  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  const { error } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: appRole });
  if (error) throw error;
  return { ok: true };
}

export async function setMemberStatus(userId, status) {
  if (!["active", "suspended"].includes(status)) {
    const e = new Error("Invalid status");
    e.statusCode = 400;
    throw e;
  }
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ status })
    .eq("id", userId);
  if (error) throw error;

  // A suspended member must not be able to sign in. Supabase supports banning
  // an auth user for a duration; use a long ban for suspend, clear it on reactivate.
  try {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: status === "suspended" ? "876000h" : "none",
    });
  } catch (err) {
    console.warn("[invitations] ban toggle failed:", err?.message ?? err);
  }
  return { ok: true };
}

export async function removeMember(userId, { actorId } = {}) {
  if (actorId && actorId === userId) {
    const e = new Error("You cannot remove your own account.");
    e.statusCode = 400;
    throw e;
  }
  // Deleting the auth user cascades to profiles + user_roles (ON DELETE CASCADE).
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw error;
  return { ok: true };
}
