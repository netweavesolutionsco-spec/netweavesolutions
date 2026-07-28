import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, SlidersHorizontal, PlusCircle, FolderKanban, Calendar, IndianRupee } from "lucide-react";
import { useState } from "react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import {
  PortalEmpty,
  PortalError,
  PortalProgress,
  PortalSkeleton,
  PortalStatus,
} from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatMoney, humanize, useProjects } from "@/lib/portal-api";

export const Route = createFileRoute("/client/projects")({
  head: () => ({
    meta: [
      { title: "My Projects — Netweavesolutions Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});

const STATUSES = ["", "submitted", "planning", "running", "review", "completed", "on_hold"] as const;

function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const projects = useProjects({ search, status });

  return (
    <ClientPortalShell title="My Projects">
      <div className="space-y-5">
        <section className="rounded-xl border border-border/70 bg-card/80 p-4 shadow-soft">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects by name or category"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="flex h-11 w-full rounded-md border border-input bg-background px-9 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {STATUSES.map((item) => (
                  <option key={item || "all"} value={item}>
                    {item ? humanize(item) : "All statuses"}
                  </option>
                ))}
              </select>
            </div>
            <Button asChild>
              <Link to="/client/projects/new">
                <PlusCircle className="h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>
        </section>

        {projects.isLoading && <PortalSkeleton rows={4} />}
        {projects.isError && <PortalError message={(projects.error as Error).message} />}
        {projects.data && projects.data.data.length === 0 && (
          <PortalEmpty
            title="No projects found"
            description="Create a project brief and it will appear here with timeline, files, tasks, messages, invoices, quotation, and activity."
            to="/client/projects/new"
            actionLabel="Create New Project"
          />
        )}
        {projects.data && projects.data.data.length > 0 && (
          <div className="grid gap-4">
            {projects.data.data.map((project) => (
              <Link
                key={project.id}
                to="/client/projects/$projectId"
                params={{ projectId: project.id }}
                className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{project.projectCode}</span>
                      <PortalStatus value={project.status} />
                      <PortalStatus value={project.priority} />
                    </div>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">{project.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {project.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.technologyStack.slice(0, 5).map((tech) => (
                        <span key={tech} className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3 lg:w-[460px]">
                    <div className="rounded-lg bg-background/45 p-3">
                      <FolderKanban className="mb-2 h-4 w-4 text-primary" />
                      <div className="font-medium text-foreground">{project.category}</div>
                      <div className="text-xs">Category</div>
                    </div>
                    <div className="rounded-lg bg-background/45 p-3">
                      <Calendar className="mb-2 h-4 w-4 text-primary" />
                      <div className="font-medium text-foreground">{formatDate(project.deadline)}</div>
                      <div className="text-xs">Deadline</div>
                    </div>
                    <div className="rounded-lg bg-background/45 p-3">
                      <IndianRupee className="mb-2 h-4 w-4 text-primary" />
                      <div className="font-medium text-foreground">
                        {formatMoney(project.budget ?? project.expectedBudget, project.currency)}
                      </div>
                      <div className="text-xs">Budget</div>
                    </div>
                    <div className="sm:col-span-3">
                      <PortalProgress value={project.progress} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ClientPortalShell>
  );
}
