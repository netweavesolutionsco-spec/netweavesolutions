import { PageHeader } from "@/admin/components/PageHeader";
import { DataTable, type Column } from "@/admin/components/DataTable";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/hooks/useCollection";
import { Plus, Pencil } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Post } from "@/data/blog";

const columns: Column<Post>[] = [
  {
    key: "title",
    header: "Post",
    render: (r) => (
      <div>
        <div className="font-medium">{r.title}</div>
        <div className="text-xs text-muted-foreground">by {r.author}</div>
      </div>
    ),
  },
  { key: "category", header: "Category" },
  { key: "readTime", header: "Read Time" },
  { key: "status", header: "Status", render: () => <StatusBadge status="Published" /> },
  {
    key: "date",
    header: "Date",
    render: (r) => <span>{r.date}</span>,
  },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: () => (
      <div className="flex justify-end gap-1">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to="/admin/collections" search={{ tab: "blog" }}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    ),
  },
];

export function BlogPage() {
  const posts = useCollection<Post>("blog");

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Author, review and publish blog articles."
        actions={
          <Button asChild size="sm" className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white">
            <Link to="/admin/collections" search={{ tab: "blog" }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Edit Blog Posts
            </Link>
          </Button>
        }
      />
      <DataTable rows={posts} columns={columns} searchKeys={["title", "author", "category"]} />
    </div>
  );
}
