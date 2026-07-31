import { PageHeader } from "@/admin/components/PageHeader";
import { MediaLibrary } from "@/builder/MediaLibrary";

export function MediaPage() {
  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col">
      <PageHeader
        title="Media Library"
        description="Images, videos and documents used across the site."
      />
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border bg-card/60 p-4 backdrop-blur">
        <MediaLibrary />
      </div>
    </div>
  );
}
