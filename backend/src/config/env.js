const required = (key) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
};

const origins = (process.env.FRONTEND_ORIGIN || "http://localhost:8080")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
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
};
