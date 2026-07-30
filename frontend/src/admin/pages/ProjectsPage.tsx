import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/admin/components/PageHeader";
import { DataTable, type Column } from "@/admin/components/DataTable";
import { StatusBadge } from "@/admin/components/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useAuthUser";
import { Navigate, useSearch } from "@tanstack/react-router";

type ProjectStatus =
  | "submitted"
  | "planning"
  | "running"
  | "review"
  | "completed"
  | "on_hold"
  | "cancelled";
type ProjectPriority = "low" | "normal" | "high" | "urgent";

interface ProjectRow {
  id: string;
  projectCode: string;
  name: string;
  category: string;
  clientId: string;
  clientName: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  deadline: string | null;
  createdAt: string;
}

interface ClientOption {
  id: string;
  label: string;
}

const STATUSES: ProjectStatus[] = [
  "submitted",
  "planning",
  "running",
  "review",
  "completed",
  "on_hold",
  "cancelled",
];
const PRIORITIES: ProjectPriority[] = ["low", "normal", "high", "urgent"];

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  planning: "Planning",
  running: "Running",
  review: "Review",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

const label = (value: string) =>
  STATUS_LABELS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

interface FormState {
  clientId: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: string;
  expectedBudget: string;
  requirements: string;
}

const EMPTY_FORM: FormState = {
  clientId: "",
  name: "",
  category: "",
  description: "",
  status: "submitted",
  priority: "normal",
  deadline: "",
  expectedBudget: "",
  requirements: "",
};

export function ProjectsPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const search = useSearch({ from: "/admin/projects" });
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  // The topbar "New Project" quick action lands here with ?new=1, which opens
  // the create dialog straight away.
  const [open, setOpen] = useState(search.new === "1");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  // Guards against a second insert from a double click / Enter key repeat while
  // the first request is still in flight.
  const submitting = useRef(false);

  const load = async () => {
    const [projectsRes, clientsRes] = await Promise.all([
      supabase
        .from("client_projects")
        .select(
          "id, project_code, name, category, client_id, status, priority, progress, deadline, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, display_name").order("display_name"),
    ]);

    if (projectsRes.error) throw projectsRes.error;
    if (clientsRes.error) throw clientsRes.error;

    const clientList = (clientsRes.data ?? []).map((c) => ({
      id: c.id as string,
      label: (c.display_name as string) || (c.email as string) || "Unnamed client",
    }));
    const nameById = new Map(clientList.map((c) => [c.id, c.label]));

    setClients(clientList);
    setRows(
      (projectsRes.data ?? []).map((p) => ({
        id: p.id as string,
        projectCode: (p.project_code as string) ?? "",
        name: (p.name as string) ?? "",
        category: (p.category as string) ?? "",
        clientId: (p.client_id as string) ?? "",
        clientName: nameById.get(p.client_id as string) ?? "—",
        status: (p.status as ProjectStatus) ?? "submitted",
        priority: (p.priority as ProjectPriority) ?? "normal",
        progress: (p.progress as number) ?? 0,
        deadline: (p.deadline as string) ?? null,
        createdAt: (p.created_at as string) ?? "",
      })),
    );
  };

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    (async () => {
      try {
        await load();
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Projects could not be loaded");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const validate = (state: FormState) => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!state.clientId) next.clientId = "Select the client this project belongs to";
    if (state.name.trim().length < 2) next.name = "Enter a project name";
    if (!state.category.trim()) next.category = "Enter a category";
    if (state.description.trim().length < 10) next.description = "Add at least 10 characters";
    if (state.expectedBudget && Number.isNaN(Number(state.expectedBudget))) {
      next.expectedBudget = "Budget must be a number";
    }
    return next;
  };

  const createProject = async () => {
    if (submitting.current) return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    submitting.current = true;
    setSaving(true);
    try {
      const { error } = await supabase.from("client_projects").insert({
        client_id: form.clientId,
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        deadline: form.deadline || null,
        expected_budget: form.expectedBudget ? Number(form.expectedBudget) : null,
        requirements: form.requirements.trim() || null,
      });
      if (error) throw error;

      toast.success("Project created");
      setOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Project could not be created");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const columns = useMemo<Column<ProjectRow>[]>(
    () => [
      {
        key: "name",
        header: "Project",
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.projectCode}</p>
          </div>
        ),
      },
      { key: "clientName", header: "Client" },
      { key: "category", header: "Category" },
      {
        key: "priority",
        header: "Priority",
        render: (row) => <StatusBadge status={label(row.priority)} />,
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={label(row.status)} />,
      },
      {
        key: "progress",
        header: "Progress",
        render: (row) => <span className="text-sm">{row.progress}%</span>,
      },
      {
        key: "deadline",
        header: "Deadline",
        render: (row) => <span className="text-sm">{formatDate(row.deadline)}</span>,
      },
    ],
    [],
  );

  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin" />;

  const field = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={`${rows.length} project${rows.length === 1 ? "" : "s"} in the workspace.`}
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create Project
          </Button>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={["name", "projectCode", "clientName", "category"]}
        emptyMessage="No projects yet. Use Create Project to add the first one."
      />

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (saving) return;
          setOpen(next);
          if (!next) setErrors({});
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Add a project for an existing client. It appears in their portal immediately.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void createProject();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="project-client">Client *</Label>
                <select
                  id="project-client"
                  value={form.clientId}
                  onChange={(event) => field("clientId", event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select a client…</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.label}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="mt-1 text-xs text-destructive">{errors.clientId}</p>
                )}
              </div>
              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={form.name}
                  onChange={(event) => field("name", event.target.value)}
                  placeholder="Hospital ERP Phase 2"
                  className="mt-1.5"
                />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="project-category">Category *</Label>
                <Input
                  id="project-category"
                  value={form.category}
                  onChange={(event) => field("category", event.target.value)}
                  placeholder="Web Development"
                  className="mt-1.5"
                />
                {errors.category && (
                  <p className="mt-1 text-xs text-destructive">{errors.category}</p>
                )}
              </div>
              <div>
                <Label htmlFor="project-deadline">Deadline</Label>
                <Input
                  id="project-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(event) => field("deadline", event.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="project-status">Status</Label>
                <select
                  id="project-status"
                  value={form.status}
                  onChange={(event) => field("status", event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {label(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="project-priority">Priority</Label>
                <select
                  id="project-priority"
                  value={form.priority}
                  onChange={(event) => field("priority", event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {label(priority)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="project-budget">Expected Budget (INR)</Label>
                <Input
                  id="project-budget"
                  value={form.expectedBudget}
                  onChange={(event) => field("expectedBudget", event.target.value)}
                  placeholder="150000"
                  inputMode="decimal"
                  className="mt-1.5"
                />
                {errors.expectedBudget && (
                  <p className="mt-1 text-xs text-destructive">{errors.expectedBudget}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="project-description">Description *</Label>
              <Textarea
                id="project-description"
                rows={3}
                value={form.description}
                onChange={(event) => field("description", event.target.value)}
                placeholder="Scope, goals and deliverables…"
                className="mt-1.5"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="project-requirements">Requirements</Label>
              <Textarea
                id="project-requirements"
                rows={3}
                value={form.requirements}
                onChange={(event) => field("requirements", event.target.value)}
                placeholder="Integrations, constraints, technical notes…"
                className="mt-1.5"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
