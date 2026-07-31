import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/admin/components/PageHeader";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mail,
  Plus,
  Loader2,
  MoreHorizontal,
  Send,
  X,
  RotateCcw,
  Trash2,
  UserCog,
  UserX,
  UserCheck,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { Navigate } from "@tanstack/react-router";
import {
  adminApi,
  AdminApiError,
  type TeamInvitation,
  type TeamMember,
} from "@/lib/admin-api";

// Six display roles offered in the invite modal (richer than the app_role enum).
const DISPLAY_ROLES = [
  "Super Admin",
  "Admin",
  "Manager",
  "Editor",
  "Content Manager",
  "Support",
] as const;

// The app_role values a member can be reassigned to (member "Edit Role").
const APP_ROLES: { value: TeamMember["role"]; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const APP_ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  editor: "Editor",
  viewer: "Viewer",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  expired: "Expired",
  cancelled: "Cancelled",
  active: "Active",
  suspended: "Suspended",
};

function initials(name: string, fallback: string) {
  const src = (name || fallback || "?").trim();
  return (
    src
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function errMessage(e: unknown, fallback: string) {
  if (e instanceof AdminApiError) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

export function TeamPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleDialog, setRoleDialog] = useState<TeamMember | null>(null);
  const [pendingRole, setPendingRole] = useState<TeamMember["role"]>("editor");

  const membersQuery = useQuery({
    queryKey: ["team", "members"],
    queryFn: () => adminApi.get<{ members: TeamMember[] }>("/team/members"),
    enabled: !!isAdmin,
  });
  const invitesQuery = useQuery({
    queryKey: ["team", "invitations"],
    queryFn: () => adminApi.get<{ invitations: TeamInvitation[] }>("/team/invitations"),
    enabled: !!isAdmin,
  });

  const members = membersQuery.data?.members ?? [];
  const invitations = invitesQuery.data?.invitations ?? [];
  const pendingCount = useMemo(
    () => invitations.filter((i) => i.status === "pending").length,
    [invitations],
  );

  const refreshMembers = () => queryClient.invalidateQueries({ queryKey: ["team", "members"] });
  const refreshInvites = () => queryClient.invalidateQueries({ queryKey: ["team", "invitations"] });

  // ---- Invitation actions ----
  const resendInvite = async (inv: TeamInvitation) => {
    try {
      const res = await adminApi.post<{ emailDelivered: boolean }>(
        `/team/invitations/${inv.id}/resend`,
      );
      toast.success(
        res.emailDelivered
          ? `Invitation resent to ${inv.email}.`
          : `Invitation refreshed. Email could not be delivered — check mail settings.`,
      );
      refreshInvites();
    } catch (e) {
      toast.error(errMessage(e, "Could not resend invitation"));
    }
  };

  const cancelInvite = async (inv: TeamInvitation) => {
    try {
      await adminApi.post(`/team/invitations/${inv.id}/cancel`);
      toast.success(`Invitation to ${inv.email} cancelled.`);
      refreshInvites();
    } catch (e) {
      toast.error(errMessage(e, "Could not cancel invitation"));
    }
  };

  // ---- Member actions ----
  const setMemberStatus = async (member: TeamMember, status: "active" | "suspended") => {
    try {
      await adminApi.patch(`/team/members/${member.id}/status`, { status });
      toast.success(
        status === "suspended"
          ? `${member.fullName || member.email} deactivated.`
          : `${member.fullName || member.email} reactivated.`,
      );
      refreshMembers();
    } catch (e) {
      toast.error(errMessage(e, "Could not update member"));
    }
  };

  const removeMember = async (member: TeamMember) => {
    if (
      !window.confirm(
        `Remove ${member.fullName || member.email}? This permanently deletes their account and access.`,
      )
    )
      return;
    try {
      await adminApi.del(`/team/members/${member.id}`);
      toast.success(`${member.fullName || member.email} removed.`);
      refreshMembers();
    } catch (e) {
      toast.error(errMessage(e, "Could not remove member"));
    }
  };

  const saveRole = async () => {
    if (!roleDialog) return;
    try {
      await adminApi.patch(`/team/members/${roleDialog.id}/role`, { appRole: pendingRole });
      toast.success(`Role updated to ${APP_ROLE_LABEL[pendingRole]}.`);
      setRoleDialog(null);
      refreshMembers();
    } catch (e) {
      toast.error(errMessage(e, "Could not update role"));
    }
  };

  if (authLoading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin" />;

  const loading = membersQuery.isLoading || invitesQuery.isLoading;

  return (
    <div>
      <PageHeader
        title="Team"
        description="People with access to Netweavesolutions, and pending invitations."
        actions={
          <Button
            size="sm"
            className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white"
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Invite Member
          </Button>
        }
      />

      {loading ? (
        <div className="grid h-48 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Members */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((m) => (
              <div
                key={m.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-[var(--brand)]/20">
                    <AvatarImage src={m.avatarUrl} />
                    <AvatarFallback>{initials(m.fullName, m.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {m.fullName || "Team member"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {APP_ROLE_LABEL[m.role] ?? m.role}
                    </div>
                  </div>
                  <StatusBadge status={STATUS_LABEL[m.status] ?? m.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setPendingRole(m.role);
                          setRoleDialog(m);
                        }}
                      >
                        <UserCog className="mr-2 h-4 w-4" /> Edit role
                      </DropdownMenuItem>
                      {m.status === "suspended" ? (
                        <DropdownMenuItem onClick={() => setMemberStatus(m, "active")}>
                          <UserCheck className="mr-2 h-4 w-4" /> Reactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => setMemberStatus(m, "suspended")}>
                          <UserX className="mr-2 h-4 w-4" /> Deactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-rose-600 focus:text-rose-600"
                        onClick={() => removeMember(m)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                No team members yet. Invite someone to get started.
              </div>
            )}
          </div>

          {/* Invitations */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold">Invitations</h2>
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" /> {pendingCount} pending
                </span>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
              {invitations.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No invitations sent yet.
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {invitations.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{inv.fullName}</span>
                          <StatusBadge status={STATUS_LABEL[inv.status] ?? inv.status} />
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {inv.email} · {inv.role}
                          {inv.department ? ` · ${inv.department}` : ""}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {inv.status === "accepted"
                            ? `Accepted ${formatDate(inv.acceptedAt)}`
                            : inv.status === "pending"
                              ? `Expires ${formatDate(inv.expiresAt)}`
                              : `Sent ${formatDate(inv.createdAt)}`}
                          {inv.invitedByName ? ` · by ${inv.invitedByName}` : ""}
                        </div>
                      </div>
                      {inv.status !== "accepted" && (
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendInvite(inv)}
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Resend
                          </Button>
                          {inv.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-600"
                              onClick={() => cancelInvite(inv)}
                            >
                              <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSent={() => {
          refreshInvites();
        }}
      />

      {/* Edit role dialog */}
      <Dialog open={!!roleDialog} onOpenChange={(o) => !o && setRoleDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>
              Change the access level for {roleDialog?.fullName || roleDialog?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="member-role">Role</Label>
            <Select
              value={pendingRole}
              onValueChange={(v) => setPendingRole(v as TeamMember["role"])}
            >
              <SelectTrigger id="member-role" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APP_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(null)}>
              Cancel
            </Button>
            <Button
              className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white"
              onClick={saveRole}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invite Member dialog
// ---------------------------------------------------------------------------

function InviteDialog({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof DISPLAY_ROLES)[number] | "">("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFullName("");
    setEmail("");
    setRole("");
    setDepartment("");
    setMessage("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Please enter the member's full name.");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!role) {
      toast.error("Please select a role.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await adminApi.post<{ emailDelivered: boolean }>("/team/invitations", {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        department: department.trim(),
        message: message.trim(),
      });
      toast.success(
        res.emailDelivered
          ? `Invitation sent to ${email.trim()}.`
          : `Invitation created, but the email could not be delivered — check mail settings.`,
      );
      reset();
      onOpenChange(false);
      onSent();
    } catch (err) {
      toast.error(errMessage(err, "Could not send invitation"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!submitting) onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            Send a branded invitation with a secure link to join Netweavesolutions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="inv-name">Full name</Label>
              <Input
                id="inv-name"
                className="mt-1.5"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="inv-email">Email address</Label>
              <Input
                id="inv-email"
                type="email"
                className="mt-1.5"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="inv-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger id="inv-role" className="mt-1.5">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {DISPLAY_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inv-dept">
                Department <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="inv-dept"
                className="mt-1.5"
                placeholder="Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="inv-message">
              Message <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="inv-message"
              className="mt-1.5"
              rows={3}
              placeholder="Add a personal note to the invitation email…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-linear-to-r from-[var(--brand)] to-[var(--brand-3)] text-white"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
