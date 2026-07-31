import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Upload, Trash2, Search, X, Loader2, Check, FileText, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listMedia, insertMedia, deleteMedia, type MediaAsset } from "@/lib/media.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BUCKET = "site-media";

function extToType(name: string): MediaAsset["type"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif", "avif"].includes(ext)) return "image";
  if (ext === "svg") return "svg";
  if (["mp4", "webm"].includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "txt"].includes(ext)) return "doc";
  return "other";
}

/** Slugify a filename and prefix with a counter for uniqueness (SSR-safe: no Math.random). */
function safePath(name: string, seq: number): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "bin";
  return `${base || "file"}-${seq}.${ext}`;
}

/**
 * Media Library. Grid of media_assets with upload (drag/drop or click),
 * search, and delete. When `onPick` is provided it runs as a modal picker —
 * clicking a tile returns its URL and closes.
 */
export function MediaLibrary({
  onPick,
  onClose,
  asModal = false,
}: {
  onPick?: (url: string) => void;
  onClose?: () => void;
  asModal?: boolean;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["media", search],
    queryFn: () => listMedia({ data: { search: search || undefined } }),
    staleTime: 30_000,
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteMedia({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      setUploading(true);
      try {
        for (let i = 0; i < list.length; i++) {
          const file = list[i];
          const path = safePath(file.name, Date.now() + i);
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { cacheControl: "3600", upsert: false });
          if (upErr) {
            toast.error(`Upload failed: ${upErr.message}`);
            continue;
          }
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          await insertMedia({
            data: {
              path,
              url: pub.publicUrl,
              type: extToType(file.name),
              folder: "",
              alt: "",
              title: file.name,
              tags: [],
              size_bytes: file.size,
              bucket: BUCKET,
            },
          });
        }
        queryClient.invalidateQueries({ queryKey: ["media"] });
        toast.success(list.length === 1 ? "Uploaded" : `Uploaded ${list.length} files`);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [queryClient],
  );

  const body = (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search media…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        <Button
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-linear-to-r from-indigo-500 to-cyan-500 text-white"
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-3.5 w-3.5" />
          )}
          Upload
        </Button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto rounded-xl border border-dashed p-3 transition",
          dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-border/70",
        )}
      >
        {isLoading ? (
          <div className="grid h-40 place-items-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="grid h-40 place-items-center text-center text-sm text-muted-foreground">
            Drag &amp; drop files here, or use Upload.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {assets.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-sm",
                  onPick && "cursor-pointer hover:border-indigo-500/60",
                )}
                onClick={() => onPick?.(m.url)}
              >
                <div className="relative aspect-square bg-muted">
                  {m.type === "image" || m.type === "svg" ? (
                    <img
                      src={m.url}
                      alt={m.alt || m.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      {m.type === "video" ? (
                        <Video className="h-8 w-8" />
                      ) : (
                        <FileText className="h-8 w-8" />
                      )}
                    </div>
                  )}
                  {onPick ? (
                    <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-black">
                        <Check className="h-3.5 w-3.5" /> Insert
                      </span>
                    </div>
                  ) : (
                    <button
                      className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        del.mutate(m.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="p-2">
                  <div className="truncate text-xs font-medium">{m.title || m.path}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">{m.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!asModal) return body;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border bg-card p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Media Library</div>
          <button
            className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {body}
      </div>
    </div>
  );
}
