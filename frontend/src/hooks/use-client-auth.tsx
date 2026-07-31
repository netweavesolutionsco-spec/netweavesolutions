import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  api,
  isApiConfigured,
  setAccessToken,
  subscribeSessionExpired,
  type ClientUser,
} from "@/lib/client-api";
import { supabase } from "@/integrations/supabase/client";

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  countryCode?: string;
  whatsapp?: string;
  companyName?: string;
  website?: string;
  industry?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  gstNumber?: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
  acceptTerms: true;
  newsletter?: boolean;
}

interface AuthState {
  user: ClientUser | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (
    payload: RegisterPayload,
  ) => Promise<{ message: string; requiresEmailVerification: boolean; emailSent: boolean }>;
  loginWithGoogle: () => Promise<void>;
  completeOAuth: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  /** Requests a mobile OTP for the signed-in client's own number. */
  sendPhoneOtp: (
    phone?: string,
    countryCode?: string,
  ) => Promise<{ channel: string; phone: string; message: string }>;
  /** Redeems a mobile OTP and refreshes the cached client record. */
  verifyPhoneOtp: (otp: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<ClientUser>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updatePassword: (password: string, token?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

/**
 * Best-effort check of whether a Supabase OAuth provider is enabled, using the
 * project's public `/auth/v1/settings` endpoint (no auth required). Returns:
 *   - `true`  provider is enabled
 *   - `false` provider is explicitly disabled
 *   - `null`  couldn't determine (network error, unexpected shape) — callers
 *             should treat this as "don't block", letting Supabase be the
 *             authority so we never falsely refuse a working provider.
 */
async function isOAuthProviderEnabled(provider: string): Promise<boolean | null> {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!base) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: key ? { apikey: key } : undefined,
    });
    if (!res.ok) return null;
    const settings = (await res.json()) as { external?: Record<string, boolean> };
    const external = settings?.external;
    if (!external || typeof external[provider] !== "boolean") return null;
    return external[provider];
  } catch {
    return null;
  }
}

function normalizeClientUser(raw: Partial<ClientUser> | null | undefined): ClientUser | null {
  if (!raw) return null;
  return {
    _id: raw._id ?? raw.id ?? "",
    id: raw.id ?? raw._id ?? "",
    email: raw.email ?? "",
    fullName: raw.fullName ?? "",
    phone: raw.phone ?? "",
    companyName: raw.companyName ?? "",
    country: raw.country ?? "",
    countryCode: raw.countryCode ?? "",
    whatsapp: raw.whatsapp ?? "",
    // Default to false, not true: the backend derives these from Supabase, and
    // an optimistic `true` would render an unverified account as verified.
    emailVerified: raw.emailVerified ?? false,
    phoneVerified: raw.phoneVerified ?? false,
    profilePhotoUrl: raw.profilePhotoUrl ?? "",
    companyLogoUrl: raw.companyLogoUrl ?? "",
    industry: raw.industry ?? "",
    gstNumber: raw.gstNumber ?? "",
    address: raw.address ?? "",
    city: raw.city ?? "",
    state: raw.state ?? "",
    pincode: raw.pincode ?? "",
    website: raw.website ?? "",
    linkedin: raw.linkedin ?? "",
    timezone: raw.timezone ?? "",
    createdAt: raw.createdAt ?? "",
    lastLoginAt: raw.lastLoginAt ?? "",
  };
}

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isApiConfigured();

  // Monotonic guard so a slow, in-flight auth probe can't overwrite the result
  // of a newer, explicit auth action. The initial mount runs refreshUser() to
  // restore an existing session; meanwhile the OAuth callback runs completeOAuth().
  // Whichever is invoked LAST is authoritative — an older refreshUser resolving
  // late must not clobber the user completeOAuth just established (the bug that
  // bounced freshly signed-in Google users back to /client/login).
  const authSeq = useRef(0);

  const refreshUser = useCallback(async () => {
    const seq = ++authSeq.current;
    try {
      const data = await api.get<{ client?: Partial<ClientUser> }>("/auth/me");
      if (seq !== authSeq.current) return; // superseded by a newer auth action
      setUser(normalizeClientUser(data.client ?? null));
    } catch (error) {
      if (seq !== authSeq.current) return; // superseded — don't clear a newer session
      console.warn("Client session refresh failed:", error);
      setUser(null);
      setAccessToken(null);
    } finally {
      if (seq === authSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // On the OAuth callback route the session is established by completeOAuth().
    // Running the normal /auth/me probe here would fire a spurious
    // "session expired" (no cookie yet) that clears the user completeOAuth is
    // about to set — leaving the user stranded on the login page. Defer to
    // completeOAuth on that route; `loading` stays true until it resolves.
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/client/oauth-callback")
    ) {
      return;
    }
    void refreshUser();
  }, [refreshUser]);

  // When a refresh attempt fails the session is over. Dropping the user here
  // lets ClientPortalShell perform its normal redirect to /client/login with a
  // `redirect` param, rather than leaving a token error rendered in the page.
  useEffect(() => {
    return subscribeSessionExpired(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    const seq = ++authSeq.current;
    const data = await api.post<{ accessToken?: string; client?: Partial<ClientUser> }>(
      "/auth/login",
      {
        email,
        password,
        rememberMe,
      },
    );
    if (seq !== authSeq.current) return; // superseded by a newer auth action
    setAccessToken(data.accessToken ?? null);
    setUser(normalizeClientUser(data.client ?? null));
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await api.post<{
      message?: string;
      requiresEmailVerification?: boolean;
      emailSent?: boolean;
    }>("/auth/register", {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        countryCode: payload.countryCode,
        whatsapp: payload.whatsapp,
        companyName: payload.companyName,
        website: payload.website,
        industry: payload.industry,
        country: payload.country,
        state: payload.state,
        city: payload.city,
        address: payload.address,
        gstNumber: payload.gstNumber,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        referralCode: payload.referralCode,
        acceptTerms: payload.acceptTerms,
        newsletter: payload.newsletter ?? false,
      },
    );

    setAccessToken(null);
    setUser(null);

    return {
      message:
        data.message ??
        "Account created. Check your inbox for the verification link — you can sign in once your email is verified.",
      requiresEmailVerification: data.requiresEmailVerification ?? true,
      emailSent: data.emailSent ?? false,
    };
  }, []);

  // Kicks off the Google OAuth redirect via Supabase. On return the browser
  // lands on /client/oauth-callback, which calls completeOAuth() below.
  //
  // Before redirecting we ask Supabase whether the Google provider is actually
  // enabled (its public /auth/v1/settings endpoint). Without this check a
  // disabled provider sends the browser to an authorize URL that just renders
  // raw `{"error_code":"validation_failed","msg":"...provider is not enabled"}`
  // JSON — a dead end. Detecting it up front lets us show a friendly message and
  // keep the user on the page.
  const loginWithGoogle = useCallback(async () => {
    const enabled = await isOAuthProviderEnabled("google");
    if (enabled === false) {
      throw new Error(
        "Google sign-in isn't enabled yet. Please sign in with your email and password, or contact support.",
      );
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/client/oauth-callback` : undefined;
    console.log("[OAuth] Starting Google sign-in, redirectTo:", redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      // Normalise Supabase's "provider is not enabled" into the same friendly
      // copy as the pre-flight check above.
      if (/provider is not enabled|not enabled/i.test(error.message)) {
        throw new Error(
          "Google sign-in isn't enabled yet. Please sign in with your email and password, or contact support.",
        );
      }
      throw new Error(error.message);
    }
  }, []);

  // Runs on /client/oauth-callback after Supabase completes the OAuth redirect.
  // Hands the Supabase session tokens to our backend, which provisions the
  // client record (reusing the same profiles/user_roles model) and returns our
  // own access token. No second auth system — same portal session as password.
  const completeOAuth = useCallback(async () => {
    console.log("[OAuth] Callback received, completing sign-in");
    // Supabase reports OAuth failures (denied consent, disabled provider,
    // expired code) back on the callback URL as `error` / `error_description`
    // params — in either the query string or the hash fragment. Surface those
    // instead of the generic "did not complete" below.
    if (typeof window !== "undefined") {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const errCode = query.get("error_code") ?? hash.get("error_code") ?? "";
      const errDesc =
        query.get("error_description") ??
        hash.get("error_description") ??
        query.get("error") ??
        hash.get("error") ??
        "";
      if (errCode || errDesc) {
        const readable = errDesc.replace(/\+/g, " ");
        if (/provider is not enabled|not enabled/i.test(readable)) {
          throw new Error(
            "Google sign-in isn't enabled yet. Please sign in with your email and password, or contact support.",
          );
        }
        throw new Error(readable || "Google sign-in was cancelled or failed.");
      }
    }

    // Claim the latest auth sequence up front so an in-flight mount-time
    // refreshUser() cannot overwrite the user we're about to set below.
    const seq = ++authSeq.current;

    // Supabase persists the session from the redirect (hash tokens or PKCE code)
    // asynchronously. Poll getSession() until it exists rather than reading it
    // once — reading too early returns null and dead-ends the sign-in.
    const waitForSession = async () => {
      for (let attempt = 0; attempt < 20; attempt++) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw new Error(error.message);
        if (data.session) return data.session;
        await new Promise((r) => setTimeout(r, 150));
      }
      return null;
    };

    // Restore the Supabase session, retrying once before giving up.
    let session = await waitForSession();
    if (!session) {
      console.warn("[OAuth] Session not restored on first pass, retrying once");
      session = await waitForSession();
    }
    if (!session) {
      console.error("[OAuth] Session restoration failed after retry");
      throw new Error("Google sign-in did not complete. Please try again.");
    }
    console.log("[OAuth] Session restored");

    // Hand the Supabase tokens to our backend, which fetches the authenticated
    // user, checks/creates the client profile, verifies status, and returns our
    // own portal session. Profile-creation failures surface as an API error
    // here rather than silently leaving the user unauthenticated.
    let synced: { accessToken?: string; client?: Partial<ClientUser> };
    try {
      synced = await api.post<{ accessToken?: string; client?: Partial<ClientUser> }>(
        "/auth/oauth/sync",
        {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        },
      );
    } catch (error) {
      console.error("[OAuth] Backend profile sync failed:", error);
      throw new Error(
        error instanceof Error && error.message
          ? `Could not finish sign-in: ${error.message}`
          : "Could not create your client profile. Please try again or contact support.",
      );
    }
    console.log("[OAuth] User loaded, profile loaded");

    // Clear the client-side Supabase session; the portal session now lives in
    // our own in-memory access token + httpOnly refresh cookie.
    await supabase.auth.signOut().catch(() => {});

    // Only publish if this is still the newest auth action (guards against a
    // late refreshUser() resolving after us).
    if (seq === authSeq.current) {
      setAccessToken(synced.accessToken ?? null);
      setUser(normalizeClientUser(synced.client ?? null));
      setLoading(false);
    }
    console.log("[OAuth] Redirecting to dashboard");
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    await api.post("/auth/resend-verification", { email });
  }, []);

  // Mobile verification. The backend binds the challenge to the signed-in
  // client's own record, so no identifier is trusted from the browser beyond an
  // optional number to save first. Delivery falls back from WhatsApp to email
  // when WhatsApp is not configured — `channel` says which was used.
  const sendPhoneOtp = useCallback(async (phone?: string, countryCode?: string) => {
    const data = await api.post<{ channel?: string; phone?: string; message?: string }>(
      "/auth/phone-otp",
      { phone, countryCode },
    );
    return {
      channel: data.channel ?? "whatsapp",
      phone: data.phone ?? "",
      message: data.message ?? "We sent you a 6-digit verification code.",
    };
  }, []);

  const verifyPhoneOtp = useCallback(
    async (otp: string) => {
      const data = await api.post<{ message?: string; client?: Partial<ClientUser> }>(
        "/auth/verify-phone-otp",
        { otp },
      );
      // The controller returns the refreshed record; fall back to /auth/me so
      // the verified badge updates either way.
      if (data.client) setUser(normalizeClientUser(data.client));
      else await refreshUser();
      return { message: data.message ?? "Your mobile number is verified." };
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    ++authSeq.current; // supersede any in-flight probe/login
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors and clear local session state.
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<ClientUser>) => {
      const payload = {
        fullName: updates.fullName,
        phone: updates.phone,
        companyName: updates.companyName,
        industry: updates.industry,
        gstNumber: updates.gstNumber,
        address: updates.address,
        city: updates.city,
        state: updates.state,
        country: updates.country,
        pincode: updates.pincode,
        website: updates.website,
        linkedin: updates.linkedin,
        timezone: updates.timezone,
        profilePhotoUrl: updates.profilePhotoUrl,
        companyLogoUrl: updates.companyLogoUrl,
      };

      await api.put("/profile", payload);
      await refreshUser();
    },
    [refreshUser],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await api.post("/auth/forgot-password", { email });
  }, []);

  const updatePassword = useCallback(async (password: string, token?: string) => {
    if (!token) throw new Error("A reset token is required.");
    await api.post("/auth/reset-password", { token, password });
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured,
      login,
      register,
      loginWithGoogle,
      completeOAuth,
      resendVerification,
      sendPhoneOtp,
      verifyPhoneOtp,
      logout,
      refreshUser,
      updateProfile,
      forgotPassword,
      updatePassword,
      changePassword,
    }),
    [
      user,
      loading,
      configured,
      login,
      register,
      loginWithGoogle,
      completeOAuth,
      resendVerification,
      sendPhoneOtp,
      verifyPhoneOtp,
      logout,
      refreshUser,
      updateProfile,
      forgotPassword,
      updatePassword,
      changePassword,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useClientAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useClientAuth must be used inside <ClientAuthProvider>");
  return ctx;
}

export function useRequireClientAuth() {
  const { user, loading } = useClientAuth();
  const navigate = useNavigate();
  return useCallback(
    (onAuthed?: () => void) => {
      if (loading) return false;
      if (!user) {
        toast.info("Please login or create an account to continue.");
        const redirect =
          typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
        navigate({ to: "/client/login", search: { redirect } as never });
        return false;
      }
      onAuthed?.();
      return true;
    },
    [user, loading, navigate],
  );
}
