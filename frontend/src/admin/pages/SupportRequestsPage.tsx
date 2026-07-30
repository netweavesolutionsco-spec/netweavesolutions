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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Eye, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { Navigate } from "@tanstack/react-router";

type SupportStatus = "open" | "in_progress" | "resolved" | "closed";

interface SupportRow {
  id: string;
  clientName: string;
  clientEmail: string;
  subject: string;
  message: string;
  priority: string;
  status: SupportStatus;
  createdAt: string;
}

const STATUS_FLOW: SupportStatus[] = ["open", "in_progress", "resolved", "closed"];

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityLabel = (p: string) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : "Normal");

export function SupportRequestsPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const [rows, setRows] = useState<SupportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<SupportRow | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    async function load() {
      try {
        const { data, error } = await supabase
          .from("support_requests")
          .select("id, client_name, client_email, subject, message, priority, status, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (cancelled) return;

        setRows(
          (data ?? []).map((r) => ({
            id: r.id,
            clientName: r.client_name || "—",
            clientEmail: r.client_email || "",
            subject: r.subject || "",
            message: r.message || "",
            priority: r.priority || "normal",
            status: (r.status || "open") as SupportStatus,
            createdAt: r.created_at || new Date().toISOString(),
          })),
        );
      } catch (e) {
        console.error("Error loading support requests:", e);
        toast.error(e instanceof Error ? e.message : "Failed to load support requests");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const updateStatus = async (row: SupportRow, status: SupportStatus) => {
    if (row.status === status) return;
    const previous = row.status;
    setRows((all) => all.map((r) => (r.id === row.id ? { ...r, status } : r)));
    setActive((a) => (a && a.id === row.id ? { ...a, status } : a));

    const { error } = await supabase.from("support_requests").update({ status }).eq("id", row.id);
    if (error) {
      setRows((all) => all.map((r) => (r.id === row.id ? { ...r, status: previous } : r)));
      setActive((a) => (a && a.id === row.id ? { ...a, status: previous } : a));
      toast.error(error.message || "Could not update status");
    } else {
      toast.success(`Marked ${STATUS_LABELS[status]}`);
    }
  };

  const columns: Column<SupportRow>[] = useMemo(
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
        key: "subject",
        header: "Subject",
        render: (r) => r.subject || <span className="text-muted-foreground">—</span>,
      },
      {
        key: "priority",
        header: "Priority",
        render: (r) => <StatusBadge status={priorityLabel(r.priority)} />,
      },
      {
        key: "message",
        header: "Message",
        render: (r) => <span className="line-clamp-2 block max-w-64 text-muted-foreground">{r.message}</span>,
      },
      {
        key: "status",
        header: "Status",
        render: (r) => <StatusBadge status={STATUS_LABELS[r.status] ?? r.status} />,
      },
      {
        key: "createdAt",
        header: "Submitted",
        render: (r) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {new Date(r.createdAt).toLocaleDateString()}{" "}
            {new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
              title="View request"
              onClick={() => setActive(r)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  Status <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STATUS_FLOW.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    disabled={r.status === s}
                    onClick={() => updateStatus(r, s)}
                  >
                    {STATUS_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        className: "text-right",
      },
    ],
    [rows],
  );

  const openCount = rows.filter((r) => r.status === "open").length;

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
        title="Support Requests"
        description={
          rows.length
            ? `${rows.length} request${rows.length === 1 ? "" : "s"} · ${openCount} open.`
            : "Support requests submitted by clients from the client portal."
        }
      />
      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={["clientName", "clientEmail", "subject", "message"]}
        emptyMessage="No support requests yet"
      />

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-[min(95vw,38rem)]">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2.5">
                  {active.subject || "Support request"}
                  <StatusBadge status={STATUS_LABELS[active.status] ?? active.status} />
                  <StatusBadge status={priorityLabel(active.priority)} />
                </DialogTitle>
                <DialogDescription>
                  From {active.clientName} · {new Date(active.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid gap-2.5 text-sm">
                {(
                  [
                    ["Name", active.clientName],
                    ["Email", active.clientEmail],
                    ["Priority", priorityLabel(active.priority)],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[6rem_1fr] gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-words font-medium">
                      {value || <span className="font-normal text-muted-foreground">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>

              <div>
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Message
                </div>
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3.5 text-sm leading-relaxed">
                  {active.message || "—"}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {STATUS_FLOW.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={active.status === s ? "default" : "outline"}
                    disabled={active.status === s}
                    onClick={() => updateStatus(active, s)}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
                <Button asChild size="sm" variant="ghost" className="ml-auto">
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
