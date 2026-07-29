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

const STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"] as const;

interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budget: string;
  message: string;
  status: string;
  source: string;
  createdAt: string;
}

/** DB stored lowercase 'new' historically; StatusBadge keys are Capitalized. */
function normalizeStatus(value: string | null): string {
  if (!value) return "New";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function LeadsPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<LeadRow | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    async function loadLeads() {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (cancelled) return;

        setLeads(
          (data ?? []).map((l) => ({
            id: l.id,
            name: l.name,
            email: l.email,
            phone: l.phone || "",
            company: l.company || "",
            service: l.service || "",
            budget: l.budget || "",
            message: l.message || "",
            status: normalizeStatus(l.status),
            source: l.source || "website",
            createdAt: l.created_at || new Date().toISOString(),
          })),
        );
      } catch (e) {
        console.error("Error loading leads:", e);
        toast.error(e instanceof Error ? e.message : "Failed to load leads");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLeads();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const updateStatus = async (id: string, status: string) => {
    const previous = leads;
    setSavingId(id);
    setLeads((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    setSavingId(null);
    if (error) {
      setLeads(previous);
      toast.error(error.message || "Could not update status");
      return;
    }
    toast.success(`Marked as ${status}`);
  };

  const columns: Column<LeadRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Contact",
        render: (r) => (
          <div className="min-w-40">
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">{r.email}</div>
            {r.phone && <div className="text-xs text-muted-foreground">{r.phone}</div>}
          </div>
        ),
      },
      {
        key: "company",
        header: "Company",
        render: (r) => r.company || <span className="text-muted-foreground">—</span>,
      },
      {
        key: "service",
        header: "Service",
        render: (r) => r.service || <span className="text-muted-foreground">—</span>,
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
        key: "status",
        header: "Status",
        render: (r) => (
          <div className="flex items-center gap-1.5">
            <select
              value={r.status}
              disabled={savingId === r.id}
              onChange={(e) => updateStatus(r.id, e.target.value)}
              className="h-7 rounded-md border border-border bg-background px-1.5 text-xs disabled:opacity-50"
              aria-label={`Status for ${r.name}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {savingId === r.id && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Received",
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
              title="View full enquiry"
              onClick={() => setActive(r)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Reply by email">
              <a href={`mailto:${r.email}`}>
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
    [savingId, leads],
  );

  const exportLeads = () => {
    if (leads.length === 0) return toast.info("No leads to export");
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Company",
      "Service",
      "Budget",
      "Message",
      "Status",
      "Source",
      "Created At",
    ];
    const rows = leads.map((l) => [
      l.id,
      l.name,
      l.email,
      l.phone,
      l.company,
      l.service,
      l.budget,
      l.message,
      l.status,
      l.source,
      l.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded successfully!");
  };

  const newCount = leads.filter((l) => l.status === "New").length;

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
        title="Leads"
        description={
          leads.length
            ? `${leads.length} enquir${leads.length === 1 ? "y" : "ies"} · ${newCount} awaiting first response.`
            : "Inbound contact requests and form submissions from your website."
        }
        actions={
          <Button variant="outline" size="sm" onClick={exportLeads}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
        }
      />
      <DataTable
        rows={leads}
        columns={columns}
        searchKeys={["name", "email", "phone", "company", "service", "budget", "message"]}
        emptyMessage="No leads yet"
      />

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-[min(95vw,38rem)]">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5">
                  {active.name}
                  <StatusBadge status={active.status} />
                </DialogTitle>
                <DialogDescription>
                  Received {new Date(active.createdAt).toLocaleString()} · via {active.source}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                {(
                  [
                    ["Email", active.email],
                    ["Phone", active.phone],
                    ["Company", active.company],
                    ["Service", active.service],
                    ["Budget", active.budget],
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
                  Message
                </div>
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3.5 text-sm leading-relaxed">
                  {active.message || "—"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm">
                  <a href={`mailto:${active.email}`}>
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
