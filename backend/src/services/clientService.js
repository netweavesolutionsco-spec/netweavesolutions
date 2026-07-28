import { supabaseAdmin } from "../config/supabase.js";

const PROFILE_COLUMNS = `
  id,
  display_name,
  avatar_url,
  phone,
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
  created_at,
  updated_at
`;

const AUTH_COLUMNS = `
  id,
  email,
  email_confirmed_at,
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
    fullName: profile?.display_name ?? "",
    phone: profile?.phone ?? "",
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
    role,
    status: "active",
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
  const { data, error } = await supabaseAdmin
    .from("auth.users")
    .select(AUTH_COLUMNS)
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116" || error.message?.includes("rows not found")) {
      return null;
    }
    throw error;
  }

  return data;
}

async function fetchAuthUserById(id) {
  const { data, error } = await supabaseAdmin
    .from("auth.users")
    .select(AUTH_COLUMNS)
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
