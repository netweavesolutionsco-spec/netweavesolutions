import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PageData, PageRecord } from "@/builder/types";
import { emptyPageData } from "@/builder/types";
import { defaultPages } from "@/builder/defaultPages";

// cms_pages / cms_page_versions / user_roles aren't in the generated Database
// types yet, so we use a loosely-typed client for these calls.
type Loose = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const normalizeSlug = (raw: string): string => {
  let s = (raw || "").trim().toLowerCase();
  if (!s.startsWith("/")) s = `/${s}`;
  s = s.replace(/\s+/g, "-").replace(/[^a-z0-9/_-]/g, "");
  if (s.length > 1) s = s.replace(/\/+$/g, "");
  return s || "/";
};

/** Coerce arbitrary JSON into a valid PageData shape. */
function toPageData(v: unknown): PageData {
  const base = emptyPageData();
  if (!v || typeof v !== "object") return base;
  const o = v as Record<string, unknown>;
  return {
    sections: Array.isArray(o.sections) ? (o.sections as PageData["sections"]) : base.sections,
    seo: (o.seo && typeof o.seo === "object" ? o.seo : base.seo) as PageData["seo"],
    og: (o.og && typeof o.og === "object" ? o.og : base.og) as PageData["og"],
  };
}

// ---- roles ---------------------------------------------------------------

async function getRole(sb: Loose, userId: string): Promise<"admin" | "editor" | "viewer" | null> {
  const { data } = await sb.from("user_roles").select("role").eq("user_id", userId);
  const roles: string[] = Array.isArray(data) ? data.map((r: { role: string }) => r.role) : [];
  if (roles.includes("admin")) return "admin";
  if (roles.includes("editor")) return "editor";
  if (roles.includes("viewer")) return "viewer";
  return null;
}

const canEdit = (role: string | null) => role === "admin" || role === "editor";

/** The caller's effective role, for gating builder UI controls. */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ role: "admin" | "editor" | "viewer" | null }> => {
    const sb = context.supabase as unknown as Loose;
    return { role: await getRole(sb, context.userId) };
  });

/** Best-effort admin notification. Never throws. */
async function notify(sb: Loose, title: string, description: string) {
  try {
    await sb.from("admin_notifications").insert({
      title,
      description,
      related_module: "cms",
      type: "success",
      action_url: "/admin/builder",
    });
  } catch (err) {
    console.error("[notifications] pages notify failed:", err);
  }
}

// ---- public read ---------------------------------------------------------

export const getPublicPage = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }): Promise<PageData> => {
    const slug = normalizeSlug(data.slug);
    const fallback = defaultPages[slug] ?? null;
    try {
      const sb = serverPublicClient() as unknown as Loose;
      const { data: row, error } = await sb
        .from("cms_pages")
        .select("published_data, status")
        .eq("slug", slug)
        .maybeSingle();
      if (error || !row || row.status !== "published" || !row.published_data) {
        return fallback ?? emptyPageData();
      }
      return toPageData(row.published_data);
    } catch {
      return fallback ?? emptyPageData();
    }
  });

// ---- admin: list / get ---------------------------------------------------

export const listPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ pages: PageRecord[]; role: string | null }> => {
    const sb = context.supabase as unknown as Loose;
    const role = await getRole(sb, context.userId);
    const { data, error } = await sb
      .from("cms_pages")
      .select("id, slug, title, status, data, is_system, sort, updated_at")
      .order("sort", { ascending: true })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const pages: PageRecord[] = (data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title ?? ""),
      status: (r.status === "published" ? "published" : "draft") as PageRecord["status"],
      data: toPageData(r.data),
      is_system: !!r.is_system,
      sort: Number(r.sort) || 0,
      updated_at: r.updated_at ? String(r.updated_at) : undefined,
    }));
    return { pages, role };
  });

export const getDraftPage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }): Promise<PageRecord | null> => {
    const sb = context.supabase as unknown as Loose;
    const { data: r } = await sb
      .from("cms_pages")
      .select("id, slug, title, status, data, is_system, sort, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (!r) return null;
    return {
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title ?? ""),
      status: (r.status === "published" ? "published" : "draft") as PageRecord["status"],
      data: toPageData(r.data),
      is_system: !!r.is_system,
      sort: Number(r.sort) || 0,
      updated_at: r.updated_at ? String(r.updated_at) : undefined,
    };
  });

// ---- admin: create / duplicate / rename / delete -------------------------

const pageDataSchema = z.object({
  sections: z.array(z.record(z.string(), z.unknown())),
  seo: z.record(z.string(), z.unknown()),
  og: z.record(z.string(), z.unknown()),
});

export const createPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ title: z.string().min(1), slug: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    if (!canEdit(await getRole(sb, context.userId))) {
      throw new Error("Not authorized to create pages.");
    }
    const slug = normalizeSlug(data.slug);
    const { data: existing } = await sb.from("cms_pages").select("id").eq("slug", slug).maybeSingle();
    if (existing) throw new Error(`A page with slug "${slug}" already exists.`);
    const payload = { ...emptyPageData(), seo: { title: data.title, description: "" } };
    const { data: rows, error } = await sb
      .from("cms_pages")
      .insert({
        slug,
        title: data.title,
        status: "draft",
        data: payload,
        is_system: false,
        updated_by: context.userId,
      })
      .select("id");
    if (error) throw new Error(error.message);
    return { ok: true, id: rows?.[0]?.id as string | undefined };
  });

export const duplicatePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    if (!canEdit(await getRole(sb, context.userId))) {
      throw new Error("Not authorized to duplicate pages.");
    }
    const { data: src } = await sb
      .from("cms_pages")
      .select("slug, title, data")
      .eq("id", data.id)
      .maybeSingle();
    if (!src) throw new Error("Page not found.");
    // Find a free slug: /about → /about-copy → /about-copy-2 …
    const baseSlug = normalizeSlug(`${src.slug}-copy`);
    let slug = baseSlug;
    for (let n = 2; n < 100; n++) {
      const { data: clash } = await sb.from("cms_pages").select("id").eq("slug", slug).maybeSingle();
      if (!clash) break;
      slug = `${baseSlug}-${n}`;
    }
    const { data: rows, error } = await sb
      .from("cms_pages")
      .insert({
        slug,
        title: `${src.title} (copy)`,
        status: "draft",
        data: src.data,
        is_system: false,
        updated_by: context.userId,
      })
      .select("id");
    if (error) throw new Error(error.message);
    return { ok: true, id: rows?.[0]?.id as string | undefined, slug };
  });

export const renamePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string(), title: z.string().min(1), slug: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    const role = await getRole(sb, context.userId);
    if (!canEdit(role)) throw new Error("Not authorized to edit pages.");
    const patch: Record<string, unknown> = { title: data.title, updated_by: context.userId };
    if (data.slug) {
      // Only admins may change a system page's slug (route safety).
      const { data: cur } = await sb
        .from("cms_pages")
        .select("is_system, slug")
        .eq("id", data.id)
        .maybeSingle();
      const nextSlug = normalizeSlug(data.slug);
      if (cur?.is_system && role !== "admin" && nextSlug !== cur.slug) {
        throw new Error("Only an admin can change a system page's URL.");
      }
      if (nextSlug !== cur?.slug) {
        const { data: clash } = await sb
          .from("cms_pages")
          .select("id")
          .eq("slug", nextSlug)
          .maybeSingle();
        if (clash) throw new Error(`A page with slug "${nextSlug}" already exists.`);
        patch.slug = nextSlug;
      }
    }
    const { error } = await sb.from("cms_pages").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    // Delete is admin-only (RLS enforces too; we fail fast with a clear message).
    if ((await getRole(sb, context.userId)) !== "admin") {
      throw new Error("Only an admin can delete pages.");
    }
    const { data: cur } = await sb
      .from("cms_pages")
      .select("is_system, title")
      .eq("id", data.id)
      .maybeSingle();
    if (cur?.is_system) throw new Error("System pages cannot be deleted.");
    const { error } = await sb.from("cms_pages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await notify(sb, "Page deleted", `Page "${cur?.title ?? ""}" was deleted.`);
    return { ok: true };
  });

// ---- admin: draft / publish ----------------------------------------------

export const saveDraftPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string(), data: pageDataSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    if (!canEdit(await getRole(sb, context.userId))) {
      throw new Error("Not authorized to edit pages.");
    }
    // `.select()` confirms a row was actually written (RLS could silently
    // filter the update to 0 rows otherwise).
    const { data: rows, error } = await sb
      .from("cms_pages")
      .update({ data: data.data, updated_by: context.userId })
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("Draft not saved: no row was written. Check permissions.");
    }
    return { ok: true };
  });

export const publishPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string(), data: pageDataSchema, label: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    // Publishing (going live) is admin-only.
    if ((await getRole(sb, context.userId)) !== "admin") {
      throw new Error("Only an admin can publish pages.");
    }
    const { data: rows, error } = await sb
      .from("cms_pages")
      .update({
        data: data.data,
        published_data: data.data,
        status: "published",
        updated_by: context.userId,
      })
      .eq("id", data.id)
      .select("id, slug, title");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("Publish failed: no row was written. Check permissions.");
    }
    // Snapshot every publish into version history.
    try {
      await sb.from("cms_page_versions").insert({
        page_id: data.id,
        snapshot: data.data,
        label: data.label ?? null,
        published_by: context.userId,
      });
    } catch (err) {
      console.error("[versions] snapshot insert failed:", err);
    }
    await notify(sb, "Page published", `Page "${rows[0]?.title ?? ""}" is now live.`);
    return { ok: true };
  });

export const unpublishPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    if ((await getRole(sb, context.userId)) !== "admin") {
      throw new Error("Only an admin can unpublish pages.");
    }
    const { error } = await sb
      .from("cms_pages")
      .update({ status: "draft", updated_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- admin: version history ----------------------------------------------

export type PageVersion = {
  id: string;
  label: string | null;
  created_at: string;
  snapshot: PageData;
};

export const listVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ pageId: z.string() }).parse(input))
  .handler(async ({ data, context }): Promise<PageVersion[]> => {
    const sb = context.supabase as unknown as Loose;
    const { data: rows, error } = await sb
      .from("cms_page_versions")
      .select("id, label, created_at, snapshot")
      .eq("page_id", data.pageId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      label: r.label ? String(r.label) : null,
      created_at: String(r.created_at),
      snapshot: toPageData(r.snapshot),
    }));
  });

export const restoreVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ pageId: z.string(), versionId: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    // Restore republishes a past snapshot — admin-only.
    if ((await getRole(sb, context.userId)) !== "admin") {
      throw new Error("Only an admin can restore versions.");
    }
    const { data: ver } = await sb
      .from("cms_page_versions")
      .select("snapshot")
      .eq("id", data.versionId)
      .eq("page_id", data.pageId)
      .maybeSingle();
    if (!ver) throw new Error("Version not found.");
    const snapshot = toPageData(ver.snapshot);
    const { error } = await sb
      .from("cms_pages")
      .update({
        data: snapshot,
        published_data: snapshot,
        status: "published",
        updated_by: context.userId,
      })
      .eq("id", data.pageId);
    if (error) throw new Error(error.message);
    // Record the restore itself as a new version for a clean audit trail.
    try {
      await sb.from("cms_page_versions").insert({
        page_id: data.pageId,
        snapshot,
        label: "Restored",
        published_by: context.userId,
      });
    } catch (err) {
      console.error("[versions] restore snapshot insert failed:", err);
    }
    await notify(sb, "Version restored", "A previous page version was restored and published.");
    return { ok: true };
  });
