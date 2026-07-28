import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  IndianRupee,
  ListChecks,
  Mail,
  UploadCloud,
} from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/client/projects/new")({
  head: () => ({
    meta: [
      { title: "Create New Project - Netweavesolutions Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateProjectPage,
});

function Field({
  label,
  children,
  helper,
}: {
  label: string;
  children: ReactNode;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {helper && <p className="text-xs leading-5 text-muted-foreground">{helper}</p>}
    </div>
  );
}

function StepItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border/70 bg-background/45 p-3">
      <span className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function CreateProjectPage() {
  return (
    <ClientPortalShell title="Create New Project">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft sm:p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <FolderKanban className="h-4 w-4" />
                Project intake
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tell us what to build</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Fill the brief below so the team can prepare scope, timeline, and estimate.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/client/projects">
                <ArrowLeft className="h-4 w-4" />
                My Projects
              </Link>
            </Button>
          </div>

          <form className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Project name">
                <Input placeholder="Example: Ecommerce website redesign" />
              </Field>

              <Field label="Project type">
                <select className="flex min-h-[44px] h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring">
                  <option>Website development</option>
                  <option>Mobile app</option>
                  <option>Web application</option>
                  <option>UI/UX design</option>
                  <option>Maintenance or support</option>
                </select>
              </Field>
            </div>

            <Field
              label="Project goal"
              helper="Write the main business outcome you want from this project."
            >
              <Textarea
                rows={4}
                placeholder="Describe your idea, target users, must-have pages/features, and any reference sites."
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Budget range">
                <div className="relative">
                  <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="25,000 - 75,000" />
                </div>
              </Field>

              <Field label="Target launch">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" type="date" />
                </div>
              </Field>

              <Field label="Priority">
                <select className="flex min-h-[44px] h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring">
                  <option>Normal</option>
                  <option>Urgent</option>
                  <option>Flexible timeline</option>
                </select>
              </Field>
            </div>

            <Field label="Reference links or existing website">
              <Input placeholder="https://example.com, Google Drive folder, Figma link..." />
            </Field>

            <Field label="Extra notes">
              <Textarea
                rows={3}
                placeholder="Share login details, brand notes, competitor links, integrations, or anything important."
              />
            </Field>

            <div className="rounded-lg border border-dashed border-border/80 bg-background/45 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="rounded-md bg-primary/10 p-2 text-primary">
                    <UploadCloud className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Project files</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Upload feature lists, logos, screenshots, PDFs, or brand assets after creating
                      the project.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/client/files">Open Files</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:justify-end">
              <Button asChild variant="outline">
                <Link to="/client">Cancel</Link>
              </Button>
              <Button type="button">
                <FileText className="h-4 w-4" />
                Save Project Brief
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="h-4 w-4 text-primary" />
              What happens next
            </div>
            <div className="space-y-3">
              <StepItem
                icon={CheckCircle2}
                title="Brief review"
                description="We review your requirements and clarify missing details."
              />
              <StepItem
                icon={Clock3}
                title="Estimate"
                description="You receive scope, pricing, and delivery timeline."
              />
              <StepItem
                icon={Mail}
                title="Kickoff"
                description="Once approved, we create milestones and start delivery."
              />
            </div>
          </section>

          <section className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft">
            <p className="text-sm font-semibold">Need help filling this?</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Send a quick message to the team and we will help convert your idea into a clear
              project brief.
            </p>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/client/messages">Message Team</Link>
            </Button>
          </section>
        </aside>
      </div>
    </ClientPortalShell>
  );
}
