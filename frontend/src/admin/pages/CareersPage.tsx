import { PageHeader } from "@/admin/components/PageHeader";
import { DataTable, type Column } from "@/admin/components/DataTable";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/hooks/useCollection";
import { Plus, Pencil } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface Job {
  title: string;
  department: string;
  location: string;
  type: string;
}

const columns: Column<Job>[] = [
  {
    key: "title",
    header: "Role",
    render: (r) => (
      <div>
        <div className="font-medium">{r.title}</div>
        <div className="text-xs text-muted-foreground">
          {r.department} · {r.location}
        </div>
      </div>
    ),
  },
  { key: "type", header: "Type" },
  { key: "status", header: "Status", render: () => <StatusBadge status="Active" /> },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: () => (
      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
        <Link to="/admin/collections" search={{ tab: "jobs" }}>
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      </Button>
    ),
  },
];

export function CareersPage() {
  const jobs = useCollection<Job>("jobs");

  return (
    <div>
      <PageHeader
        title="Careers"
        description="Open roles and job postings showcased on your public site."
        actions={
          <Button asChild size="sm" className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white">
            <Link to="/admin/collections" search={{ tab: "jobs" }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Edit Careers
            </Link>
          </Button>
        }
      />
      <DataTable rows={jobs} columns={columns} searchKeys={["title", "department", "location"]} />
    </div>
  );
}
