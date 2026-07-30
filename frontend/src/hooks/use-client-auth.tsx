import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  ) => Promise<{ message: string; requiresEmailVerification: boolean }>;
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

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ client?: Partial<ClientUser> }>("/auth/me");
      setUser(normalizeClientUser(data.client ?? null));
    } catch (error) {
      console.warn("Client session refresh failed:", error);
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
    const data = await api.post<{ accessToken?: string; client?: Partial<ClientUser> }>(
      "/auth/login",
      {
        email,
        password,
        rememberMe,
      },
    );
    setAccessToken(data.accessToken ?? null);
    setUser(normalizeClientUser(data.client ?? null));
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await api.post<{ message?: string; requiresEmailVerification?: boolean }>(
      "/auth/register",
      {
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
    };
  }, []);

  // Kicks off the Google OAuth redirect via Supabase. On return the browser
  // lands on /client/oauth-callback, which calls completeOAuth() below.
  const loginWithGoogle = useCallback(async () => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/client/oauth-callback` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
  }, []);

  // Runs on /client/oauth-callback after Supabase completes the OAuth redirect.
  // Hands the Supabase session tokens to our backend, which provisions the
  // client record (reusing the same profiles/user_roles model) and returns our
  // own access token. No second auth system — same portal session as password.
  const completeOAuth = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw new Error(error?.message ?? "Google sign-in did not complete.");
    }
    const synced = await api.post<{ accessToken?: string; client?: Partial<ClientUser> }>(
      "/auth/oauth/sync",
      {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    );
    // Clear the client-side Supabase session; the portal session now lives in
    // our own in-memory access token + httpOnly refresh cookie.
    await supabase.auth.signOut().catch(() => {});
    setAccessToken(synced.accessToken ?? null);
    setUser(normalizeClientUser(synced.client ?? null));
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
