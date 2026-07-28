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
import { api, isApiConfigured, setAccessToken, type ClientUser } from "@/lib/client-api";

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  country?: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
  acceptTerms: true;
}

interface AuthState {
  user: ClientUser | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ message: string }>;
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
    emailVerified: raw.emailVerified ?? true,
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
      const data = await api.get<{ client?: Partial<ClientUser> }>('/auth/me');
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

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<{ accessToken?: string; client?: Partial<ClientUser> }>('/auth/login', {
        email,
        password,
        rememberMe: true,
      });
      setAccessToken(data.accessToken ?? null);
      setUser(normalizeClientUser(data.client ?? null));
    },
    [],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await api.post<{ message?: string }>('/auth/register', {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      companyName: payload.companyName,
      country: payload.country,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      referralCode: payload.referralCode,
      acceptTerms: payload.acceptTerms,
    });

    setAccessToken(null);
    setUser(null);

    return {
      message: data.message ?? 'Account created successfully. You can sign in now.',
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
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

      await api.put('/profile', payload);
      await refreshUser();
    },
    [refreshUser],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await api.post('/auth/forgot-password', { email });
  }, []);

  const updatePassword = useCallback(async (password: string, token?: string) => {
    if (!token) throw new Error('A reset token is required.');
    await api.post('/auth/reset-password', { token, password });
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured,
      login,
      register,
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
