import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { type AdminNotification } from "@/admin/data/dummy";

type AdminUIContextValue = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
  quickOpen: boolean;
  setQuickOpen: (v: boolean) => void;
  notifications: AdminNotification[];
  unreadCount: number;
  loadingNotifications: boolean;
  refreshNotifications: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
};

const AdminUIContext = createContext<AdminUIContextValue | null>(null);

type NotificationRow = {
  id: string;
  title: string;
  description: string | null;
  user_name: string | null;
  related_module: string | null;
  type: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

const VALID_TYPES: AdminNotification["type"][] = ["info", "success", "warning", "lead"];

function mapRow(row: NotificationRow): AdminNotification {
  const type = (VALID_TYPES as string[]).includes(row.type ?? "")
    ? (row.type as AdminNotification["type"])
    : "info";
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    userName: row.user_name,
    relatedModule: row.related_module,
    type,
    actionUrl: row.action_url,
    read: row.read_at != null,
    createdAt: row.created_at,
  };
}

export function AdminUIProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const { isAdmin } = useIsAdmin();
  const canRead = isAdmin === true;
  const cancelledRef = useRef(false);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);

  const fetchNotifications = useCallback(async () => {
    if (!canRead) {
      setNotifications([]);
      return;
    }
    setLoadingNotifications(true);
    const { data, error } = await supabase
      .from("admin_notifications")
      .select(
        "id, title, description, user_name, related_module, type, action_url, read_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (cancelledRef.current) return;
    if (!error && data) {
      setNotifications((data as NotificationRow[]).map(mapRow));
    }
    setLoadingNotifications(false);
  }, [canRead]);

  // Initial load + realtime auto-update whenever admin_notifications changes.
  useEffect(() => {
    cancelledRef.current = false;
    if (!canRead) {
      setNotifications([]);
      return;
    }
    void fetchNotifications();

    const channel = supabase
      .channel("admin_notifications_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_notifications" },
        () => {
          void fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      cancelledRef.current = true;
      supabase.removeChannel(channel);
    };
  }, [canRead, fetchNotifications]);

  const markRead = useCallback(
    async (id: string) => {
      const prev = notifications;
      setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
      const { error } = await supabase
        .from("admin_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .is("read_at", null);
      if (error) setNotifications(prev);
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    const prev = notifications;
    const now = new Date().toISOString();
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    const { error } = await supabase
      .from("admin_notifications")
      .update({ read_at: now })
      .is("read_at", null);
    if (error) setNotifications(prev);
  }, [notifications]);

  const removeNotification = useCallback(
    async (id: string) => {
      const prev = notifications;
      setNotifications((list) => list.filter((n) => n.id !== id));
      const { error } = await supabase.from("admin_notifications").delete().eq("id", id);
      if (error) setNotifications(prev);
    },
    [notifications],
  );

  const clearNotifications = useCallback(async () => {
    const prev = notifications;
    setNotifications([]);
    // Bulk delete. Supabase requires a filter on delete, so we match every row
    // whose id differs from the all-zero UUID (i.e. all real rows).
    const { error } = await supabase
      .from("admin_notifications")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) setNotifications(prev);
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AdminUIContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        mobileOpen,
        setMobileOpen,
        notifOpen,
        setNotifOpen,
        quickOpen,
        setQuickOpen,
        notifications,
        unreadCount,
        loadingNotifications,
        refreshNotifications: fetchNotifications,
        markRead,
        markAllRead,
        clearNotifications,
        removeNotification,
      }}
    >
      {children}
    </AdminUIContext.Provider>
  );
}

export function useAdminUI() {
  const ctx = useContext(AdminUIContext);
  if (!ctx) throw new Error("useAdminUI must be used inside AdminUIProvider");
  return ctx;
}
