import { supabaseAdmin } from "../config/supabase.js";

const PROFILE_COLUMNS = `
  id,
  display_name,
  avatar_url,
  phone,
  whatsapp,
  country_code,
  company_name,
  country,
  email,
  industry,
  gst_number,
  address,
  city,
  state,
  pincode,
  website,
  linkedin,
  timezone,
  company_logo_url,
  newsletter_opt_in,
  status,
  login_count,
  last_login,
  created_at,
  updated_at
`;

function parseDate(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value : new Date(value);
}

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

function normalizeClientRecord(authUser, profile, roles = []) {
  if (!authUser && !profile) return null;

  const role = roles.find((entry) => entry?.role)?.role ?? null;
  return {
    id: authUser?.id ?? profile?.id,
    email: authUser?.email ?? profile?.email ?? "",
    emailVerified: Boolean(authUser?.email_confirmed_at),
    // Mobile verification lives in Supabase `app_metadata` (service-role only,
    // never writable by the client) so it needs no extra profiles column.
    phoneVerified: Boolean(authUser?.app_metadata?.phone_verified),
    fullName: profile?.display_name ?? "",
    phone: profile?.phone ?? "",
    whatsapp: profile?.whatsapp ?? "",
    countryCode: profile?.country_code ?? "",
    companyName: profile?.company_name ?? "",
    country: profile?.country ?? "",
    profilePhotoUrl: profile?.avatar_url ?? "",
    companyLogoUrl: profile?.company_logo_url ?? "",
    industry: profile?.industry ?? "",
    gstNumber: profile?.gst_number ?? "",
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    pincode: profile?.pincode ?? "",
    website: profile?.website ?? "",
    linkedin: profile?.linkedin ?? "",
    timezone: profile?.timezone ?? "",
    newsletterOptIn: Boolean(profile?.newsletter_opt_in),
    loginCount: profile?.login_count ?? 0,
    lastLogin: parseDate(profile?.last_login),
    role,
    status: profile?.status ?? "active",
    createdAt: parseDate(profile?.created_at ?? authUser?.created_at),
    updatedAt: parseDate(profile?.updated_at ?? authUser?.updated_at),
  };
}

export function toSafeClient(client) {
  if (!client) return null;
  const { passwordHash, password, ...safe } = client;
  return safe;
}

async function fetchAuthUserByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw error;
  }

  return data?.users?.find((user) => user.email?.toLowerCase() === normalizedEmail) ?? null;
}

async function fetchAuthUserById(id) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

  if (error) {
    if (error.status === 404 || error.message?.includes("not found")) {
      return null;
    }
    throw error;
  }

  return data?.user ?? null;
}

async function fetchProfileById(id) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116" || error.message?.includes("rows not found")) {
      return null;
    }
    throw error;
  }

  return data;
}

async function fetchRolesByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    if (error.code === "PGRST116" || error.message?.includes("rows not found")) {
      return [];
    }
    throw error;
  }

  return data ?? [];
}

async function fetchClientByUserId(id) {
  const [authUser, profile, roles] = await Promise.all([
    fetchAuthUserById(id),
    fetchProfileById(id),
    fetchRolesByUserId(id),
  ]);

  return normalizeClientRecord(authUser, profile, roles);
}

export async function findClientByEmail(email) {
  const authUser = await fetchAuthUserByEmail(email);
  if (!authUser) return null;
  return fetchClientByUserId(authUser.id);
}

export async function findClientById(id) {
  return fetchClientByUserId(id);
}

export async function createClient(clientData) {
  const email = clientData.email.toLowerCase().trim();
  const { data: createdAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: clientData.password,
    email_confirm: clientData.emailVerified ?? false,
    user_metadata: {
      display_name: clientData.fullName,
      full_name: clientData.fullName,
      phone: clientData.phone ?? "",
      whatsapp: clientData.whatsapp ?? "",
      country_code: clientData.countryCode ?? "",
      company_name: clientData.companyName ?? "",
      country: clientData.country ?? "",
      avatar_url: clientData.profilePhotoUrl ?? "",
      referral_code: clientData.referralCode ?? "",
      accepted_terms: clientData.acceptedTerms ?? false,
    },
  });

  if (authError) {
    throw authError;
  }

  const authUser = createdAuthUser?.user;
  if (!authUser) {
    throw new Error("Supabase user could not be created");
  }

  const profilePayload = cleanPayload({
    id: authUser.id,
    display_name: clientData.fullName,
    avatar_url: clientData.profilePhotoUrl,
    phone: clientData.phone,
    whatsapp: clientData.whatsapp,
    country_code: clientData.countryCode,
    company_name: clientData.companyName,
    country: clientData.country,
    email,
    industry: clientData.industry,
    gst_number: clientData.gstNumber,
    address: clientData.address,
    city: clientData.city,
    state: clientData.state,
    pincode: clientData.pincode,
    website: clientData.website,
    linkedin: clientData.linkedin,
    timezone: clientData.timezone,
    newsletter_opt_in: clientData.newsletterOptIn,
  });

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });
  if (profileError) {
    throw profileError;
  }

  const { data: existingRoles, error: roleLookupError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", authUser.id)
    .limit(1);
  if (roleLookupError) {
    throw roleLookupError;
  }

  if (!existingRoles?.length) {
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authUser.id, role: clientData.role ?? "viewer" });
    if (roleError) {
      throw roleError;
    }
  }

  return fetchClientByUserId(authUser.id);
}

export async function updateClient(id, updates) {
  const profilePayload = cleanPayload({
    display_name: updates.fullName,
    phone: updates.phone,
    whatsapp: updates.whatsapp,
    country_code: updates.countryCode,
    company_name: updates.companyName,
    country: updates.country,
    email: updates.email?.toLowerCase().trim(),
    industry: updates.industry,
    gst_number: updates.gstNumber,
    address: updates.address,
    city: updates.city,
    state: updates.state,
    pincode: updates.pincode,
    website: updates.website,
    linkedin: updates.linkedin,
    timezone: updates.timezone,
    avatar_url: updates.profilePhotoUrl,
    company_logo_url: updates.companyLogoUrl,
    newsletter_opt_in: updates.newsletterOptIn,
    status: updates.status,
  });

  if (Object.keys(profilePayload).length) {
    const { error } = await supabaseAdmin.from("profiles").update(profilePayload).eq("id", id);
    if (error) {
      throw error;
    }
  }

  const authPayload = cleanPayload({
    email: updates.email?.toLowerCase().trim(),
    password: updates.password,
    email_confirm: updates.emailVerified,
  });

  if (Object.keys(authPayload).length) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, authPayload);
    if (error) {
      throw error;
    }
  }

  return fetchClientByUserId(id);
}

/**
 * Reads the Supabase `app_metadata` bag for a user.
 *
 * Mobile verification state (and the pending OTP challenge) lives here rather
 * than in `profiles` because `app_metadata` is writable only with the service
 * role key — a signed-in client can never mark its own number as verified.
 */
export async function getAppMetadata(id) {
  const authUser = await fetchAuthUserById(id);
  return authUser?.app_metadata ?? {};
}

/**
 * Merges keys into a user's `app_metadata`. Pass `null` for a key to clear it.
 */
export async function setAppMetadata(id, patch) {
  const current = await getAppMetadata(id);
  const next = { ...current, ...patch };
  Object.keys(patch).forEach((key) => {
    if (patch[key] === null) delete next[key];
  });

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { app_metadata: next });
  if (error) {
    throw error;
  }
  return next;
}

/**
 * Increments the login counter and stamps `last_login` for a client.
 *
 * Best-effort — never throws, so it can't block a valid sign-in.
 */
export async function recordLogin(id) {
  try {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("login_count")
      .eq("id", id)
      .maybeSingle();
    const next = (data?.login_count ?? 0) + 1;
    await supabaseAdmin
      .from("profiles")
      .update({ login_count: next, last_login: new Date().toISOString() })
      .eq("id", id);
  } catch (error) {
    console.warn("[clientService] recordLogin failed:", error?.message ?? error);
  }
}

/**
 * Ensures a `profiles` row and a `user_roles` row exist for an already
 * authenticated Supabase user (used by the Google OAuth sync flow). Reuses
 * the same profile/role model as password signup — it does NOT create a
 * second identity system. Safe to call repeatedly (idempotent upsert).
 */
export async function ensureClientForAuthUser(authUser, { role = "customer" } = {}) {
  if (!authUser?.id) throw new Error("Missing auth user");

  const meta = authUser.user_metadata ?? {};
  const profilePayload = cleanPayload({
    id: authUser.id,
    email: authUser.email?.toLowerCase().trim(),
    display_name: meta.full_name || meta.name || meta.display_name || authUser.email,
    avatar_url: meta.avatar_url || meta.picture,
  });

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });
  if (profileError) throw profileError;

  const { data: existingRoles } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", authUser.id)
    .limit(1);
  if (!existingRoles?.length) {
    await supabaseAdmin.from("user_roles").insert({ user_id: authUser.id, role });
  }

  return fetchClientByUserId(authUser.id);
}
