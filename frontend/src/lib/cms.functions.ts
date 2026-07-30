import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultSettings, mergeSettings, type SiteSettings } from "@/data/defaultSettings";

// site_content / user_roles tables aren't in the generated Database types yet,
// so we use a loosely-typed client for these calls.
type LooseSupabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPublicSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    try {
      const sb = serverPublicClient() as unknown as LooseSupabase;
      const { data, error } = await sb
        .from("site_content")
        .select("published_data")
        .eq("id", "main")
        .maybeSingle();
      if (error || !data) return defaultSettings;
      return mergeSettings(data.published_data);
    } catch {
      return defaultSettings;
    }
  },
);

export const getDraftSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ settings: SiteSettings; isAdmin: boolean }> => {
    const sb = context.supabase as unknown as LooseSupabase;
    const { data: roleRow } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;
    if (!isAdmin) return { settings: defaultSettings, isAdmin: false };
    const { data } = await sb.from("site_content").select("data").eq("id", "main").maybeSingle();
    return { settings: mergeSettings(data?.data), isAdmin: true };
  });

const settingsSchema = z.record(z.string(), z.unknown());

export const saveDraftSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as LooseSupabase;
    // Upsert (not update): if the singleton row is missing the write must
    // create it, otherwise `.update().eq()` silently affects 0 rows and the
    // draft is lost on reload. `.select()` lets us confirm a row was written.
    const { data: rows, error } = await sb
      .from("site_content")
      .upsert({ id: "main", data, updated_by: context.userId }, { onConflict: "id" })
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("Draft not saved: no row was written. Check admin permissions.");
    }
    return { ok: true };
  });

export const publishSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as LooseSupabase;
    // Upsert both draft + published copies so a missing singleton row is
    // created and the write can't silently no-op. Verify via `.select()`.
    const { data: rows, error } = await sb
      .from("site_content")
      .upsert(
        { id: "main", data, published_data: data, updated_by: context.userId },
        { onConflict: "id" },
      )
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("Publish failed: no row was written. Check admin permissions.");
    }
    return { ok: true };
  });
