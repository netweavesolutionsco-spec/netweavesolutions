import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/admin/components/PageHeader";
import { DataTable, type Column } from "@/admin/components/DataTable";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { Navigate } from "@tanstack/react-router";

interface ClientRow {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  country: string;
  role: string;
  status: string;
  lastActive: string;
}

const columns: Column<ClientRow>[] = [
  {
    key: "name",
    header: "User",
    render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name)}`}
          />
          <AvatarFallback>{r.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-sm leading-none mb-1">{r.name}</div>
          <div className="text-xs text-muted-foreground">{r.email}</div>
        </div>
      </div>
    ),
  },
  { key: "company", header: "Company" },
  { key: "phone", header: "Phone" },
  { key: "country", header: "Country" },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  {
    key: "lastActive",
    header: "Updated",
    render: (r) => <span className="text-muted-foreground">{r.lastActive}</span>,
  },
];

export function UsersPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    async function loadClients() {
      try {
        // Fetch all roles
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role");
        if (rolesError) throw rolesError;

        // Get admin user IDs to exclude them from the client list
        const adminIds = roles.filter((r) => r.role === "admin").map((r) => r.user_id);

        let query = supabase.from("profiles").select("*");
        if (adminIds.length > 0) {
          query = query.not("id", "in", `(${adminIds.join(",")})`);
        }

        const { data: profiles, error: profilesError } = await query;
        if (profilesError) throw profilesError;

        const mapped: ClientRow[] = profiles.map((p) => ({
          id: p.id,
          name: p.display_name || "Client User",
          email: p.email || "",
          company: p.company_name || "N/A",
          phone: p.phone || "N/A",
          country: p.country || "N/A",
          role: "Client",
          status: p.company_name ? "Onboarded" : "Registered",
          lastActive: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "Never",
        }));

        setClients(mapped);
      } catch (e: any) {
        console.error("Error loading clients:", e);
        toast.error(e?.message ?? "Failed to load clients");
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, [isAdmin]);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/client/register`;
    navigator.clipboard.writeText(link);
    toast.success("Client portal signup link copied to clipboard!");
  };

  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin" />;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Registered client portal profiles and billing entities."
        actions={
          <Button
            size="sm"
            className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white"
            onClick={copyInviteLink}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Invite Client
          </Button>
        }
      />
      <DataTable rows={clients} columns={columns} searchKeys={["name", "email", "company", "country"]} />
    </div>
  );
}
