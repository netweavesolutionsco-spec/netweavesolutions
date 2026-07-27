import { PageHeader } from "@/admin/components/PageHeader";
import { DataTable, type Column } from "@/admin/components/DataTable";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/hooks/useCollection";
import { Plus, Pencil } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Project } from "@/data/portfolio";

const columns: Column<Project>[] = [
  {
    key: "title",
    header: "Project",
    render: (r) => (
      <div>
        <div className="font-medium">{r.title}</div>
        <div className="text-xs text-muted-foreground">{r.client || "Self"}</div>
      </div>
    ),
  },
  { key: "category", header: "Category" },
  { key: "metric", header: "Impact / Metric" },
  { key: "status", header: "Status", render: () => <StatusBadge status="Published" /> },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: () => (
      <div className="flex justify-end gap-1">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to="/admin/collections" search={{ tab: "portfolio" }}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    ),
  },
];

export function PortfolioPage() {
  const projects = useCollection<Project>("portfolio");

  return (
    <div>
      <PageHeader
        title="Portfolio"
        description="Manage the case studies displayed on your public site."
        actions={
          <Button asChild size="sm" className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white">
            <Link to="/admin/collections" search={{ tab: "portfolio" }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Edit Portfolio
            </Link>
          </Button>
        }
      />
      <DataTable rows={projects} columns={columns} searchKeys={["title", "client", "category"]} />
    </div>
  );
}
