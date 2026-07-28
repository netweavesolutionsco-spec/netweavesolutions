import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  MessageSquare,
  Receipt,
} from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import {
  PortalEmpty,
  PortalError,
  PortalPanel,
  PortalProgress,
  PortalSkeleton,
  PortalStatus,
} from "@/components/client/portal-ui";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatMoney, humanize, useProject } from "@/lib/portal-api";

export const Route = createFileRoute("/client/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Workspace — Netweavesolutions Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const detail = useProject(projectId);

  return (
    <ClientPortalShell>
      {detail.isLoading && <PortalSkeleton rows={5} />}
      {detail.isError && <PortalError message={(detail.error as Error).message} />}
      {detail.data && (
        <div className="space-y-5">
          <section className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {detail.data.project.projectCode}
                  </span>
                  <PortalStatus value={detail.data.project.status} />
                  <PortalStatus value={detail.data.project.priority} />
                </div>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{detail.data.project.name}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {detail.data.project.description}
                </p>
              </div>
              <div className="w-full rounded-lg bg-background/45 p-4 lg:max-w-xs">
                <PortalProgress value={detail.data.project.progress} />
              </div>
            </div>
          </section>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex h-auto flex-wrap justify-start">
              {[
                ["overview", "Overview"],
                ["timeline", "Timeline"],
                ["files", "Files"],
                ["messages", "Messages"],
                ["tasks", "Tasks"],
                ["invoices", "Invoices"],
                ["quotation", "Quotation"],
                ["activity", "Activity"],
              ].map(([value, label]) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  ["Category", detail.data.project.category],
                  ["Industry", detail.data.project.industry || "Not set"],
                  ["Deadline", formatDate(detail.data.project.deadline)],
                  ["Budget", formatMoney(detail.data.project.budget ?? detail.data.project.expectedBudget, detail.data.project.currency)],
                  ["Created", formatDate(detail.data.project.createdAt)],
                  ["Updated", formatDate(detail.data.project.updatedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border/70 bg-card/80 p-4 shadow-soft">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <PortalPanel icon={FolderKanban} title="Technology Stack" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {detail.data.project.technologyStack.length ? (
                    detail.data.project.technologyStack.map((item) => (
                      <span key={item} className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No technology stack has been assigned yet.</p>
                  )}
                </div>
              </PortalPanel>
            </TabsContent>

            <TabsContent value="timeline">
              <PortalPanel icon={Calendar} title="Timeline">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-background/45 p-4">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="mt-1 font-medium">{formatDate(detail.data.project.createdAt)}</p>
                  </div>
                  <div className="rounded-lg bg-background/45 p-4">
                    <p className="text-xs text-muted-foreground">Updated</p>
                    <p className="mt-1 font-medium">{formatDate(detail.data.project.updatedAt)}</p>
                  </div>
                  <div className="rounded-lg bg-background/45 p-4">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="mt-1 font-medium">{formatDate(detail.data.project.deadline)}</p>
                  </div>
                </div>
              </PortalPanel>
            </TabsContent>

            <TabsContent value="files">
              <PortalPanel icon={FileText} title="Files">
                {detail.data.files.length ? (
                  <div className="grid gap-3">
                    {detail.data.files.map((file) => (
                      <a key={file.id} href={file.fileUrl} className="rounded-lg border border-border/70 bg-background/45 p-3">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{humanize(file.folder)} · v{file.version}</p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <PortalEmpty title="No files" description="Uploaded requirements, images, documents, PDFs, invoices, contracts, and source archives will appear here." to="/client/files" actionLabel="Open File Manager" />
                )}
              </PortalPanel>
            </TabsContent>

            <TabsContent value="messages">
              <PortalPanel icon={MessageSquare} title="Messages">
                {detail.data.messages.length ? (
                  <div className="space-y-3">
                    {detail.data.messages.map((message) => (
                      <div key={message.id} className="rounded-lg bg-background/45 p-3">
                        <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                          <span>{message.senderName}</span>
                          <span>{formatDate(message.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6">{message.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <PortalEmpty title="No messages" description="Project-specific team messages will stay attached to this workspace." to="/client/messages" actionLabel="Message Team" />
                )}
              </PortalPanel>
            </TabsContent>

            <TabsContent value="tasks">
              <PortalPanel icon={CheckSquare} title="Tasks">
                {detail.data.tasks.length ? (
                  <div className="grid gap-3">
                    {detail.data.tasks.map((task) => (
                      <div key={task.id} className="rounded-lg border border-border/70 bg-background/45 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{task.title}</p>
                          <PortalStatus value={task.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                        <div className="mt-3">
                          <PortalProgress value={task.progress} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <PortalEmpty title="No tasks" description="Todo, in-progress, review, and completed tasks will appear here once your delivery plan is prepared." />
                )}
              </PortalPanel>
            </TabsContent>

            <TabsContent value="invoices">
              <PortalPanel icon={Receipt} title="Invoices">
                {detail.data.invoices.length ? (
                  <div className="grid gap-3">
                    {detail.data.invoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-lg border border-border/70 bg-background/45 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <PortalStatus value={invoice.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{invoice.title}</p>
                        <p className="mt-2 font-medium">{formatMoney(invoice.amount, invoice.currency)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <PortalEmpty title="No invoices" description="Invoices and receipt download links will appear here when billing starts." />
                )}
              </PortalPanel>
            </TabsContent>

            <TabsContent value="quotation">
              <PortalPanel icon={FileText} title="Quotation">
                {detail.data.quotations.length ? (
                  <div className="grid gap-3">
                    {detail.data.quotations.map((quotation) => (
                      <div key={quotation.id} className="rounded-lg border border-border/70 bg-background/45 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{quotation.quotationNumber}</p>
                          <PortalStatus value={quotation.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{quotation.title}</p>
                        <p className="mt-2 font-medium">{formatMoney(quotation.amount, quotation.currency)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <PortalEmpty title="No quotation yet" description="Accepted, rejected, expired, and revision-requested quotation records will show here." />
                )}
              </PortalPanel>
            </TabsContent>

            <TabsContent value="activity">
              <PortalPanel icon={Activity} title="Activity Log">
                {detail.data.activity.length ? (
                  <div className="space-y-3">
                    {detail.data.activity.map((item) => (
                      <div key={item.id} className="rounded-lg bg-background/45 p-3">
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <PortalEmpty title="No activity" description="Every project action will be recorded here." />
                )}
              </PortalPanel>
            </TabsContent>
          </Tabs>

          <Button asChild variant="outline">
            <Link to="/client/projects">Back to Projects</Link>
          </Button>
        </div>
      )}
    </ClientPortalShell>
  );
}
