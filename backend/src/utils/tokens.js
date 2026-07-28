import { env } from "../config/env.js";

const refreshMaxAgeMs = () => {
  const v = env.JWT_REFRESH_TTL;
  if (/^\d+$/.test(v)) return Number(v) * 1000;
  const m = /^(\d+)([smhd])$/.exec(v);
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2]];
  return n * mult;
};

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? "none" : "lax",
    domain: env.COOKIE_DOMAIN,
    path: "/auth",
    maxAge: refreshMaxAgeMs(),
  };
}
export const REFRESH_COOKIE = "cn_rt";
