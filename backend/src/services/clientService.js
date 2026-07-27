import { supabaseAdmin } from "../config/supabase.js";

const CLIENT_COLUMNS = `
  id,
  email,
  password_hash,
  email_verified,
  email_verify_token,
  email_verify_expires,
  otp_code,
  otp_expires,
  password_reset_token,
  password_reset_expires,
  refresh_token_jti,
  full_name,
  phone,
  company_name,
  country,
  referral_code,
  accepted_terms,
  profile_photo_url,
  company_logo_url,
  industry,
  gst_number,
  address,
  city,
  state,
  pincode,
  website,
  linkedin,
  timezone,
  last_login_at,
  last_login_ip,
  status,
  created_at,
  updated_at
`;

function parseDate(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value : new Date(value);
}

function normalizeClientRecord(record) {
  if (!record) return null;
  return {
    id: record.id,
    email: record.email,
    passwordHash: record.password_hash,
    emailVerified: record.email_verified,
    emailVerifyToken: record.email_verify_token,
    emailVerifyExpires: parseDate(record.email_verify_expires),
    otpCode: record.otp_code,
    otpExpires: parseDate(record.otp_expires),
    passwordResetToken: record.password_reset_token,
    passwordResetExpires: parseDate(record.password_reset_expires),
    refreshTokenJti: record.refresh_token_jti,
    fullName: record.full_name,
    phone: record.phone,
    companyName: record.company_name,
    country: record.country,
    referralCode: record.referral_code,
    acceptedTerms: record.accepted_terms,
    profilePhotoUrl: record.profile_photo_url,
    companyLogoUrl: record.company_logo_url,
    industry: record.industry,
    gstNumber: record.gst_number,
    address: record.address,
    city: record.city,
    state: record.state,
    pincode: record.pincode,
    website: record.website,
    linkedin: record.linkedin,
    timezone: record.timezone,
    lastLoginAt: parseDate(record.last_login_at),
    lastLoginIp: record.last_login_ip,
    status: record.status,
    createdAt: parseDate(record.created_at),
    updatedAt: parseDate(record.updated_at),
  };
}

export function toSafeClient(client) {
  if (!client) return null;
  const {
    passwordHash,
    emailVerifyToken,
    emailVerifyExpires,
    otpCode,
    otpExpires,
    passwordResetToken,
    passwordResetExpires,
    refreshTokenJti,
    ...safe
  } = client;
  return safe;
}

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

async function fetchClient(query) {
  const { data, error } = await supabaseAdmin.from("client_accounts").select(CLIENT_COLUMNS).match(query).single();
  if (error) {
    if (error.code === "PGRST116" || error.message?.includes("rows not found")) {
      return null;
    }
    throw error;
  }
  return normalizeClientRecord(data);
}

export async function findClientByEmail(email) {
  return fetchClient({ email: email.toLowerCase().trim() });
}

export async function findClientById(id) {
  return fetchClient({ id });
}

export async function findClientByVerifyToken(token) {
  return fetchClient({ email_verify_token: token });
}

export async function findClientByResetToken(token) {
  return fetchClient({ password_reset_token: token });
}

export async function findClientByOtpCode(code) {
  return fetchClient({ otp_code: code });
}

export async function createClient(data) {
  const payload = cleanPayload({
    email: data.email.toLowerCase().trim(),
    password_hash: data.passwordHash,
    email_verified: data.emailVerified ?? false,
    email_verify_token: data.emailVerifyToken,
    email_verify_expires: data.emailVerifyExpires,
    otp_code: data.otpCode,
    otp_expires: data.otpExpires,
    password_reset_token: data.passwordResetToken,
    password_reset_expires: data.passwordResetExpires,
    refresh_token_jti: data.refreshTokenJti,
    full_name: data.fullName,
    phone: data.phone,
    company_name: data.companyName,
    country: data.country,
    referral_code: data.referralCode,
    accepted_terms: data.acceptedTerms,
    profile_photo_url: data.profilePhotoUrl,
    company_logo_url: data.companyLogoUrl,
    industry: data.industry,
    gst_number: data.gstNumber,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    website: data.website,
    linkedin: data.linkedin,
    timezone: data.timezone,
    last_login_at: data.lastLoginAt,
    last_login_ip: data.lastLoginIp,
    status: data.status ?? "active",
  });

  const { data, error } = await supabaseAdmin.from("client_accounts").insert(payload).select(CLIENT_COLUMNS).single();
  if (error) {
    throw error;
  }
  return normalizeClientRecord(data);
}

export async function updateClient(id, updates) {
  const payload = cleanPayload({
    email: updates.email?.toLowerCase().trim(),
    password_hash: updates.passwordHash,
    email_verified: updates.emailVerified,
    email_verify_token: updates.emailVerifyToken,
    email_verify_expires: updates.emailVerifyExpires,
    otp_code: updates.otpCode,
    otp_expires: updates.otpExpires,
    password_reset_token: updates.passwordResetToken,
    password_reset_expires: updates.passwordResetExpires,
    refresh_token_jti: updates.refreshTokenJti,
    full_name: updates.fullName,
    phone: updates.phone,
    company_name: updates.companyName,
    country: updates.country,
    referral_code: updates.referralCode,
    accepted_terms: updates.acceptedTerms,
    profile_photo_url: updates.profilePhotoUrl,
    company_logo_url: updates.companyLogoUrl,
    industry: updates.industry,
    gst_number: updates.gstNumber,
    address: updates.address,
    city: updates.city,
    state: updates.state,
    pincode: updates.pincode,
    website: updates.website,
    linkedin: updates.linkedin,
    timezone: updates.timezone,
    last_login_at: updates.lastLoginAt,
    last_login_ip: updates.lastLoginIp,
    status: updates.status,
  });

  const { data, error } = await supabaseAdmin
    .from("client_accounts")
    .update(payload)
    .eq("id", id)
    .select(CLIENT_COLUMNS)
    .single();
  if (error) {
    throw error;
  }
  return normalizeClientRecord(data);
}
