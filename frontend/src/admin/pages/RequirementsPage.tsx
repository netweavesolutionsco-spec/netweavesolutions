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
import { Download, Mail, Loader2, Eye, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { Navigate } from "@tanstack/react-router";

/** Mirrors the check constraint on public.project_requirements.status. */
const STATUSES = ["new", "in_review", "quoted", "accepted", "rejected", "closed"] as const;
type RequirementStatus = (typeof STATUSES)[number];

const STATUS_LABELS: Record<RequirementStatus, string> = {
  new: "New",
  in_review: "In Review",
  quoted: "Quoted",
  accepted: "Accepted",
  rejected: "Rejected",
  closed: "Closed",
};

interface RequirementRow {
  id: string;
  clientName: string;
  clientEmail: string;
  phone: string;
  company: string;
  service: string;
  budget: string;
  timeline: string;
  requirement: string;
  status: RequirementStatus;
  source: string;
  createdAt: string;
}

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function RequirementsPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const [rows, setRows] = useState<RequirementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<RequirementRow | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("project_requirements")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (cancelled) return;

        setRows(
          (data ?? []).map((r) => ({
            id: r.id as string,
            clientName: (r.client_name as string) || "",
            clientEmail: (r.client_email as string) || "",
            phone: (r.phone as string) || "",
            company: (r.company as string) || "",
            service: (r.service as string) || "",
            budget: (r.budget as string) || "",
            timeline: (r.timeline as string) || "",
            requirement: (r.requirement as string) || "",
            status: ((r.status as RequirementStatus) || "new") as RequirementStatus,
            source: (r.source as string) || "contact-page",
            createdAt: (r.created_at as string) || new Date().toISOString(),
          })),
        );
      } catch (error) {
        console.error("Error loading project requirements:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load project requirements",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const updateStatus = async (id: string, status: RequirementStatus) => {
    const previous = rows;
    setSavingId(id);
    setRows((current) => current.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase
      .from("project_requirements")
      .update({ status })
      .eq("id", id);
    setSavingId(null);
    if (error) {
      setRows(previous);
      toast.error(error.message || "Could not update status");
      return;
    }
    setActive((current) => (current && current.id === id ? { ...current, status } : current));
    toast.success(`Marked as ${STATUS_LABELS[status]}`);
  };

  const columns: Column<RequirementRow>[] = useMemo(
    () => [
      {
        key: "clientName",
        header: "Client",
        render: (r) => (
          <div className="min-w-40">
            <div className="font-medium">{r.clientName}</div>
            <div className="text-xs text-muted-foreground">{r.clientEmail}</div>
            {r.phone && <div className="text-xs text-muted-foreground">{r.phone}</div>}
          </div>
        ),
      },
      {
        key: "requirement",
        header: "Requirement",
        render: (r) => (
          <div className="max-w-sm">
            <p className="line-clamp-2 text-sm">{r.requirement}</p>
            {r.service && <p className="mt-0.5 text-xs text-muted-foreground">{r.service}</p>}
          </div>
        ),
      },
      {
        key: "budget",
        header: "Budget",
        render: (r) => (
          <span className="whitespace-nowrap">
            {r.budget || <span className="text-muted-foreground">—</span>}
          </span>
        ),
      },
      {
        key: "timeline",
        header: "Timeline",
        render: (r) => (
          <span className="whitespace-nowrap">
            {r.timeline || <span className="text-muted-foreground">—</span>}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: "Submitted",
        render: (r) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDateTime(r.createdAt)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (r) => (
          <div className="flex items-center gap-1.5">
            <select
              value={r.status}
              disabled={savingId === r.id}
              onChange={(event) => updateStatus(r.id, event.target.value as RequirementStatus)}
              className="h-7 rounded-md border border-border bg-background px-1.5 text-xs disabled:opacity-50"
              aria-label={`Status for ${r.clientName}`}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            {savingId === r.id && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
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
              title="View full requirement"
              onClick={() => setActive(r)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Reply by email">
              <a href={`mailto:${r.clientEmail}`}>
                <Mail className="h-3.5 w-3.5" />
              </a>
            </Button>
            {r.phone && (
              <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="WhatsApp">
                <a
                  href={`https://wa.me/${digitsOnly(r.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        ),
        className: "text-right",
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savingId, rows],
  );

  const exportCsv = () => {
    if (rows.length === 0) return toast.info("No requirements to export");
    const headers = [
      "ID",
      "Client Name",
      "Client Email",
      "Phone",
      "Company",
      "Service",
      "Budget",
      "Timeline",
      "Requirement",
      "Status",
      "Source",
      "Submitted At",
    ];
    const body = rows.map((r) => [
      r.id,
      r.clientName,
      r.clientEmail,
      r.phone,
      r.company,
      r.service,
      r.budget,
      r.timeline,
      r.requirement,
      STATUS_LABELS[r.status],
      r.source,
      r.createdAt,
    ]);
    const csv = [headers, ...body]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `project_requirements_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded successfully!");
  };

  const newCount = rows.filter((r) => r.status === "new").length;

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
        title="Project Requirements"
        description={
          rows.length
            ? `${rows.length} brief${rows.length === 1 ? "" : "s"} · ${newCount} awaiting first response.`
            : "Project briefs submitted by signed-in clients from the contact page."
        }
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
        }
      />
      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={[
          "clientName",
          "clientEmail",
          "phone",
          "company",
          "service",
          "budget",
          "timeline",
          "requirement",
        ]}
        emptyMessage="No project requirements yet"
      />

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-[min(95vw,38rem)]">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5">
                  {active.clientName}
                  <StatusBadge status={STATUS_LABELS[active.status]} />
                </DialogTitle>
                <DialogDescription>
                  Submitted {new Date(active.createdAt).toLocaleString()} · via {active.source}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                {(
                  [
                    ["Email", active.clientEmail],
                    ["Phone", active.phone],
                    ["Company", active.company],
                    ["Service", active.service],
                    ["Budget", active.budget],
                    ["Timeline", active.timeline],
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
                  Requirement
                </div>
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3.5 text-sm leading-relaxed">
                  {active.requirement || "—"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm">
                  <a href={`mailto:${active.clientEmail}`}>
                    <Mail className="h-3.5 w-3.5" /> Reply by email
                  </a>
                </Button>
                {active.phone && (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={`https://wa.me/${digitsOnly(active.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${active.phone}`}>
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
