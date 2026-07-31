import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// media_assets isn't in the generated Database types yet.
type Loose = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  storage: { from: (b: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type MediaAsset = {
  id: string;
  bucket: string;
  path: string;
  url: string;
  type: "image" | "video" | "pdf" | "svg" | "doc" | "other";
  folder: string;
  tags: string[];
  alt: string;
  title: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
};

function mapRow(r: Record<string, unknown>): MediaAsset {
  return {
    id: String(r.id),
    bucket: String(r.bucket ?? "site-media"),
    path: String(r.path ?? ""),
    url: String(r.url ?? ""),
    type: (r.type as MediaAsset["type"]) ?? "other",
    folder: String(r.folder ?? ""),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    alt: String(r.alt ?? ""),
    title: String(r.title ?? ""),
    width: r.width != null ? Number(r.width) : null,
    height: r.height != null ? Number(r.height) : null,
    size_bytes: r.size_bytes != null ? Number(r.size_bytes) : null,
    created_at: String(r.created_at ?? ""),
  };
}

async function isStaff(sb: Loose, userId: string): Promise<{ ok: boolean; admin: boolean }> {
  const { data } = await sb.from("user_roles").select("role").eq("user_id", userId);
  const roles: string[] = Array.isArray(data) ? data.map((r: { role: string }) => r.role) : [];
  return { ok: roles.includes("admin") || roles.includes("editor"), admin: roles.includes("admin") };
}

export const listMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ folder: z.string().optional(), search: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<MediaAsset[]> => {
    const sb = context.supabase as unknown as Loose;
    let q = sb
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data.folder) q = q.eq("folder", data.folder);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map(mapRow);
  });

const insertSchema = z.object({
  path: z.string().min(1),
  url: z.string().min(1),
  type: z.enum(["image", "video", "pdf", "svg", "doc", "other"]).default("image"),
  folder: z.string().default(""),
  alt: z.string().default(""),
  title: z.string().default(""),
  tags: z.array(z.string()).default([]),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  size_bytes: z.number().nullable().optional(),
  bucket: z.string().default("site-media"),
});

/** Record metadata for a file the client already uploaded to storage. */
export const insertMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => insertSchema.parse(input))
  .handler(async ({ data, context }): Promise<MediaAsset> => {
    const sb = context.supabase as unknown as Loose;
    if (!(await isStaff(sb, context.userId)).ok) {
      throw new Error("Not authorized to add media.");
    }
    const { data: rows, error } = await sb
      .from("media_assets")
      .upsert(
        {
          bucket: data.bucket,
          path: data.path,
          url: data.url,
          type: data.type,
          folder: data.folder,
          alt: data.alt,
          title: data.title,
          tags: data.tags,
          width: data.width ?? null,
          height: data.height ?? null,
          size_bytes: data.size_bytes ?? null,
          created_by: context.userId,
        },
        { onConflict: "bucket,path" },
      )
      .select("*");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) throw new Error("Media not saved. Check permissions.");
    return mapRow(rows[0]);
  });

export const updateMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string(),
        alt: z.string().optional(),
        title: z.string().optional(),
        folder: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    if (!(await isStaff(sb, context.userId)).ok) {
      throw new Error("Not authorized to edit media.");
    }
    const patch: Record<string, unknown> = {};
    if (data.alt !== undefined) patch.alt = data.alt;
    if (data.title !== undefined) patch.title = data.title;
    if (data.folder !== undefined) patch.folder = data.folder;
    if (data.tags !== undefined) patch.tags = data.tags;
    const { data: rows, error } = await sb
      .from("media_assets")
      .update(patch)
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) throw new Error("Update failed. Check permissions.");
    return { ok: true };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as Loose;
    if (!(await isStaff(sb, context.userId)).admin) {
      throw new Error("Only an admin can delete media.");
    }
    const { data: row } = await sb
      .from("media_assets")
      .select("bucket, path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.path) {
      // Remove the underlying storage object; ignore storage errors so a
      // missing object can't block clearing the metadata row.
      try {
        await sb.storage.from(String(row.bucket || "site-media")).remove([String(row.path)]);
      } catch (err) {
        console.error("[media] storage remove failed:", err);
      }
    }
    const { error } = await sb.from("media_assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
