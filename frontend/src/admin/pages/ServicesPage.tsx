import { PageHeader } from "@/admin/components/PageHeader";
import { DataTable, type Column } from "@/admin/components/DataTable";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCollection } from "@/hooks/useCollection";
import { Plus, Pencil } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface Service {
  name: string;
  category?: string;
  price?: string;
  description?: string;
}

const columns: Column<Service>[] = [
  { key: "name", header: "Service", render: (r) => <div className="font-medium">{r.name}</div> },
  { key: "category", header: "Category", render: (r) => <span>{r.category || "General"}</span> },
  { key: "price", header: "Price", render: (r) => <span>{r.price || "N/A"}</span> },
  { key: "description", header: "Description", className: "max-w-xs truncate", render: (r) => <span>{r.description || ""}</span> },
  {
    key: "status",
    header: "Status",
    render: () => <StatusBadge status="Published" />,
  },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: () => (
      <div className="flex justify-end gap-1">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to="/admin/collections" search={{ tab: "services" }}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    ),
  },
];

export function ServicesPage() {
  const services = useCollection<Service>("services");

  return (
    <div>
      <PageHeader
        title="Services"
        description="Offerings and packages showcased on your public site."
        actions={
          <Button asChild size="sm" className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white">
            <Link to="/admin/collections" search={{ tab: "services" }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Edit Services
            </Link>
          </Button>
        }
      />
      <DataTable rows={services} columns={columns} searchKeys={["name", "category"]} />
    </div>
  );
}
