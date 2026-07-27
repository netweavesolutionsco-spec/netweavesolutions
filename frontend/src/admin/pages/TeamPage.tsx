import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/admin/components/PageHeader";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { Navigate } from "@tanstack/react-router";

export function TeamPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    async function loadTeam() {
      try {
        // Fetch all roles
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role");
        if (rolesError) throw rolesError;

        // Get admin user IDs
        const adminIds = roles.filter((r) => r.role === "admin").map((r) => r.user_id);

        if (adminIds.length === 0) {
          setMembers([]);
          return;
        }

        // Fetch profiles of admin users
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", adminIds);
        if (profilesError) throw profilesError;

        // Map profiles to team structure
        const mapped = profiles.map((p) => ({
          id: p.id,
          name: p.display_name || "Admin User",
          email: p.email || "",
          role: "Admin",
          status: "Active",
          avatar: p.avatar_url || "",
        }));

        setMembers(mapped);
      } catch (e: any) {
        console.error("Error loading team:", e);
        toast.error(e?.message ?? "Failed to load team members");
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [isAdmin]);

  const copyInviteLink = () => {
    const link = `${window.location.origin}/auth`;
    navigator.clipboard.writeText(link);
    toast.success("Admin registration link copied to clipboard!");
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
        title="Team"
        description="People with admin access to Netweavesolutions."
        actions={
          <Button
            size="sm"
            className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white"
            onClick={copyInviteLink}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Invite Member
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((m) => (
          <div
            key={m.id}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-[var(--brand)]/20">
                <AvatarImage src={m.avatar} />
                <AvatarFallback>
                  {m.name
                    .split(" ")
                    .map((s: string) => s[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{m.name}</div>
                <div className="truncate text-xs text-muted-foreground">{m.role}</div>
              </div>
              <StatusBadge status={m.status} />
            </div>
            {m.email && (
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                <a
                  href={`mailto:${m.email}`}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" /> {m.email}
                </a>
              </div>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No admin users found.
          </div>
        )}
      </div>
    </div>
  );
}

