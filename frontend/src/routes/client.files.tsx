import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Eye, FileText, Pencil, Trash2, Upload } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { PortalEmpty, PortalError, PortalPanel, PortalSkeleton } from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type FileFolder,
  type ProjectFile,
  formatDate,
  humanize,
  useDeleteFile,
  usePortalCollection,
  useUpdateFile,
  useUploadFile,
} from "@/lib/portal-api";

export const Route = createFileRoute("/client/files")({
  head: () => ({
    meta: [{ title: "Files — Netweavesolutions Client Portal" }, { name: "robots", content: "noindex" }],
  }),
  component: FilesPage,
});

const FOLDERS: FileFolder[] = ["documents", "images", "videos", "contracts", "invoices", "designs", "source_code", "requirements", "support"];

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function sizeLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function FilesPage() {
  const [folder, setFolder] = useState<FileFolder>("documents");
  const [search, setSearch] = useState("");
  const files = usePortalCollection<ProjectFile>("files", { folder, pageSize: 100 });
  const upload = useUploadFile();
  const update = useUpdateFile();
  const remove = useDeleteFile();
  const visibleFiles = useMemo(
    () => (files.data?.data ?? []).filter((file) => file.name.toLowerCase().includes(search.toLowerCase())),
    [files.data, search],
  );

  const onUpload = async (selected: FileList | null) => {
    const file = selected?.[0];
    if (!file) return;
    try {
      await upload.mutateAsync({
        folder,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        dataUrl: await readFile(file),
      });
      toast.success("File uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "File could not be uploaded");
    }
  };

  const rename = async (file: ProjectFile) => {
    const nextName = window.prompt("New file name", file.name);
    if (!nextName || nextName === file.name) return;
    await update.mutateAsync({ id: file.id, name: nextName });
    toast.success("File renamed");
  };

  const move = async (file: ProjectFile, nextFolder: FileFolder) => {
    await update.mutateAsync({ id: file.id, folder: nextFolder });
    toast.success("File moved");
  };

  const deleteFile = async (file: ProjectFile) => {
    if (!window.confirm(`Delete ${file.name}?`)) return;
    await remove.mutateAsync(file.id);
    toast.success("File deleted");
  };

  return (
    <ClientPortalShell title="Files">
      <div className="space-y-5">
        <PortalPanel icon={Upload} title="Upload">
          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
            <select className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={folder} onChange={(event) => setFolder(event.target.value as FileFolder)}>
              {FOLDERS.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
            </select>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search current folder" />
            <LabelButton disabled={upload.isPending} onChange={onUpload} />
          </div>
        </PortalPanel>

        {files.isLoading && <PortalSkeleton rows={4} />}
        {files.isError && <PortalError message={(files.error as Error).message} />}
        {files.data && visibleFiles.length === 0 && (
          <PortalEmpty title="No files in this folder" description="Upload documents, images, videos, contracts, invoices, designs, source code, requirements, or support attachments." />
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleFiles.map((file) => (
            <div key={file.id} className="rounded-xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="mt-3 truncate font-semibold">{file.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sizeLabel(file.fileSize)} · v{file.version} · {formatDate(file.createdAt)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={file.fileUrl} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                    Preview
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={file.fileUrl} download>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => rename(file)}>
                  <Pencil className="h-4 w-4" />
                  Rename
                </Button>
                <select className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={file.folder} onChange={(event) => move(file, event.target.value as FileFolder)}>
                  {FOLDERS.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={() => deleteFile(file)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ClientPortalShell>
  );
}

function LabelButton({ disabled, onChange }: { disabled: boolean; onChange: (files: FileList | null) => void }) {
  return (
    <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90">
      <Upload className="h-4 w-4" />
      {disabled ? "Uploading..." : "Upload"}
      <input className="sr-only" type="file" onChange={(event) => onChange(event.target.files)} disabled={disabled} />
    </label>
  );
}
