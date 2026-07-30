import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/admin/components/PageHeader";
import { DataTable, type Column } from "@/admin/components/DataTable";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Eye, Loader2, Mail, X, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { Navigate } from "@tanstack/react-router";

const PLATFORM_LABELS: Record<string, string> = {
  google_meet: "Google Meet",
  microsoft_teams: "Microsoft Teams",
  zoom: "Zoom",
  other: "Other",
};

interface MeetingRow {
  id: string;
  clientName: string;
  clientEmail: string;
  platform: string;
  scheduledAt: string;
  title: string;
  agenda: string;
  status: string;
  createdAt: string;
}

/** DB stores lowercase status; StatusBadge keys are Capitalized words. */
function badgeLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function MeetingRequestsPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<MeetingRow | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    async function load() {
      try {
        const { data, error } = await supabase
          .from("project_meetings")
          .select(
            "id, client_name, client_email, platform, scheduled_at, title, agenda, status, created_at",
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (cancelled) return;

        setMeetings(
          (data ?? []).map((m) => ({
            id: m.id,
            clientName: m.client_name || "—",
            clientEmail: m.client_email || "",
            platform: m.platform || "",
            scheduledAt: m.scheduled_at,
            title: m.title || "",
            agenda: m.agenda || "",
            status: m.status || "pending",
            createdAt: m.created_at || new Date().toISOString(),
          })),
        );
      } catch (e) {
        console.error("Error loading meeting requests:", e);
        toast.error(e instanceof Error ? e.message : "Failed to load meeting requests");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const updateStatus = async (id: string, status: string) => {
    const previous = meetings;
    setSavingId(id);
    setMeetings((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from("project_meetings").update({ status }).eq("id", id);
    setSavingId(null);
    if (error) {
      setMeetings(previous);
      toast.error(error.message || "Could not update status");
      return;
    }
    setActive((current) => (current && current.id === id ? { ...current, status } : current));
    toast.success(`Meeting ${badgeLabel(status)}`);
  };

  const columns: Column<MeetingRow>[] = useMemo(
    () => [
      {
        key: "clientName",
        header: "Client",
        render: (r) => (
          <div className="min-w-40">
            <div className="font-medium">{r.clientName}</div>
            <div className="text-xs text-muted-foreground">{r.clientEmail}</div>
          </div>
        ),
      },
      {
        key: "platform",
        header: "Platform",
        render: (r) =>
          PLATFORM_LABELS[r.platform] || <span className="text-muted-foreground">—</span>,
      },
      {
        key: "scheduledAt",
        header: "Date & Time",
        render: (r) => (
          <span className="whitespace-nowrap text-xs">
            {new Date(r.scheduledAt).toLocaleDateString()}{" "}
            {new Date(r.scheduledAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        key: "title",
        header: "Topic",
        render: (r) => <span className="line-clamp-2 max-w-56">{r.title}</span>,
      },
      {
        key: "status",
        header: "Status",
        render: (r) => <StatusBadge status={badgeLabel(r.status)} />,
      },
      {
        key: "createdAt",
        header: "Created",
        render: (r) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {new Date(r.createdAt).toLocaleDateString()}{" "}
            {new Date(r.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (r) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="View details"
              onClick={() => setActive(r)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {savingId === r.id ? (
              <span className="grid h-8 w-8 place-items-center">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </span>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-emerald-600"
                  title="Accept"
                  disabled={r.status === "accepted"}
                  onClick={() => updateStatus(r.id, "accepted")}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-600"
                  title="Reject"
                  disabled={r.status === "rejected"}
                  onClick={() => updateStatus(r.id, "rejected")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sky-600"
                  title="Mark completed"
                  disabled={r.status === "completed"}
                  onClick={() => updateStatus(r.id, "completed")}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ),
        className: "text-right",
      },
    ],
    [savingId, meetings],
  );

  const pendingCount = meetings.filter((m) => m.status === "pending").length;

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
        title="Meeting Requests"
        description={
          meetings.length
            ? `${meetings.length} request${meetings.length === 1 ? "" : "s"} · ${pendingCount} pending.`
            : "Meetings scheduled by clients from the client portal."
        }
      />
      <DataTable
        rows={meetings}
        columns={columns}
        searchKeys={["clientName", "clientEmail", "title", "platform"]}
        emptyMessage="No meeting requests yet"
      />

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-[min(95vw,38rem)]">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5">
                  {active.title}
                  <StatusBadge status={badgeLabel(active.status)} />
                </DialogTitle>
                <DialogDescription>
                  Requested {new Date(active.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                {(
                  [
                    ["Client", active.clientName],
                    ["Email", active.clientEmail],
                    ["Platform", PLATFORM_LABELS[active.platform] || active.platform],
                    ["Date", new Date(active.scheduledAt).toLocaleDateString()],
                    ["Time", new Date(active.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="col-span-2 grid grid-cols-[6rem_1fr] gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-words font-medium">
                      {value || <span className="font-normal text-muted-foreground">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>

              <div>
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Description
                </div>
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3.5 text-sm leading-relaxed">
                  {active.agenda || "—"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" className="text-emerald-50" onClick={() => updateStatus(active.id, "accepted")} disabled={savingId === active.id || active.status === "accepted"}>
                  <Check className="h-3.5 w-3.5" /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(active.id, "rejected")} disabled={savingId === active.id || active.status === "rejected"}>
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(active.id, "completed")} disabled={savingId === active.id || active.status === "completed"}>
                  <CheckCheck className="h-3.5 w-3.5" /> Mark completed
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${active.clientEmail}`}>
                    <Mail className="h-3.5 w-3.5" /> Email client
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
