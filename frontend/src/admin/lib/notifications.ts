import { supabase } from "@/integrations/supabase/client";

type SupabaseLoose = {
  from: (table: string) => {
    insert: (values: unknown) => Promise<{ error: { message?: string } | null }>;
  };
};

const db = supabase as unknown as SupabaseLoose;

type AdminNotificationType = "info" | "success" | "warning" | "lead";

export async function createAdminNotification(payload: {
  title: string;
  description?: string;
  userName?: string | null;
  relatedModule: string;
  type?: AdminNotificationType;
  actionUrl?: string;
}) {
  const { error } = await db.from("admin_notifications").insert({
    title: payload.title,
    description: payload.description ?? "",
    user_name: payload.userName ?? null,
    related_module: payload.relatedModule,
    type: payload.type ?? "info",
    action_url: payload.actionUrl ?? null,
  });

  if (error) {
    console.warn("Admin notification was not saved:", error.message);
  }
}

export async function createClientNotification(
  clientId: string | null | undefined,
  payload: {
    type: string;
    title: string;
    body: string;
    actionUrl?: string;
  },
) {
  if (!clientId) return;

  const { error } = await db.from("client_notifications").insert({
    client_id: clientId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    action_url: payload.actionUrl ?? null,
  });

  if (error) {
    console.warn("Client notification was not saved:", error.message);
  }
}
