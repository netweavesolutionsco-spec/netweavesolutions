import { PageHeader } from "@/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { media } from "@/admin/data/dummy";
import { Upload, FileText, Video, Image as ImageIcon, Trash2 } from "lucide-react";

const typeIcon = { image: ImageIcon, video: Video, doc: FileText } as const;

export function MediaPage() {
  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Images, videos and documents used across the site."
        actions={
          <Button
            size="sm"
            className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-3)] text-white"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
          </Button>
        }
      />
      {media.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-12 text-center text-sm text-muted-foreground">
          No media files yet. Upload your first asset when you’re ready.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {media.map((m) => {
            const Icon = typeIcon[m.type];
            return (
              <div
                key={m.id}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl"
              >
                <div className="relative aspect-square bg-muted">
                  {m.type === "image" ? (
                    <img
                      src={m.url}
                      alt={m.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      <Icon className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <button className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-2">
                  <div className="truncate text-xs font-medium">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground">{m.size}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
