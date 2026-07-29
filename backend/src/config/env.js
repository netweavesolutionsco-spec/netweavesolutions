const requiredEnv = (keys) => {
  const value = keys
    .map((key) => process.env[key])
    .find((v) => v !== undefined && v !== "");

  if (!value) {
    throw new Error(
      `Missing required env var. Set one of: ${keys.join(", ")}. ` +
        "For Render, add the variable to your service environment settings; for local development, copy backend/.env.example to backend/.env."
    );
  }

  return value;
};

const origins = (process.env.FRONTEND_ORIGIN || "https://netlite.tech,https://netweavesolutions.tech")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  SUPABASE_URL: requiredEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]),
  SUPABASE_SERVICE_ROLE_KEY: requiredEnv([
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY",
    "SUPABASE_SECRET_KEY",
  ]),
  JWT_ACCESS_SECRET: requiredEnv(["JWT_ACCESS_SECRET", "JWT_SECRET"]),
  JWT_REFRESH_SECRET: requiredEnv(["JWT_REFRESH_SECRET", "JWT_REFRESH_TOKEN_SECRET"]),
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || "15m",
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL || "30d",
  API_PUBLIC_URL: process.env.API_PUBLIC_URL || "",
  FRONTEND_ORIGIN: origins,
  FRONTEND_PRIMARY: origins[0],
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? "true") !== "false",
  SMTP: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || "Netweavesolutions <noreply@example.com>",
  },
  APPROVAL_EMAIL: process.env.APPROVAL_EMAIL || "netweavesolutions.co@gmail.com",
  // Where new website enquiries are emailed. Falls back to the approval inbox.
  LEAD_NOTIFY_EMAIL:
    process.env.LEAD_NOTIFY_EMAIL ||
    process.env.APPROVAL_EMAIL ||
    "netweavesolutions.co@gmail.com",
  WHATSAPP: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    // Comma-separated list of recipients in E.164 without '+', e.g. 918434554873
    to: (process.env.WHATSAPP_TO || "")
      .split(",")
      .map((s) => s.trim().replace(/^\+/, ""))
      .filter(Boolean),
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || "new_lead_alert",
    templateLang: process.env.WHATSAPP_TEMPLATE_LANG || "en",
    useText: process.env.WHATSAPP_USE_TEXT === "true",
  },
};
