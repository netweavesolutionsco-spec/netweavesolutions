import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Calendar, CheckCircle2, FileText, FolderKanban, UploadCloud } from "lucide-react";
import { ClientPortalShell } from "@/components/client/client-portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type FileFolder, useCreateProject, useUploadFile } from "@/lib/portal-api";

export const Route = createFileRoute("/client/projects/new")({
  head: () => ({
    meta: [
      { title: "Create New Project - Netweavesolutions Client Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateProjectPage,
});

const STEPS = ["Basic Information", "Requirements", "Review"];
const CATEGORIES = ["Website development", "Web application", "Mobile app", "UI/UX design", "Automation", "Maintenance"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

interface WizardState {
  name: string;
  category: string;
  description: string;
  industry: string;
  priority: "low" | "normal" | "high" | "urgent";
  expectedBudget: string;
  currency: string;
  deadline: string;
  requirements: string;
  referenceWebsites: string;
  technologyStack: string;
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FilePicker({
  label,
  files,
  onChange,
  accept,
}: {
  label: string;
  files: File[];
  accept: string;
  onChange: (files: File[]) => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-background/45 p-4">
      <Label className="flex cursor-pointer items-center gap-3">
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <UploadCloud className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-xs text-muted-foreground">
            {files.length ? `${files.length} selected` : "Choose files from your device"}
          </span>
        </span>
        <Input
          className="sr-only"
          type="file"
          accept={accept}
          multiple
          onChange={(event) => onChange(Array.from(event.target.files ?? []))}
        />
      </Label>
    </div>
  );
}

function CreateProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const uploadFile = useUploadFile();
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [pdfs, setPdfs] = useState<File[]>([]);
  const [form, setForm] = useState<WizardState>({
    name: "",
    category: CATEGORIES[0],
    description: "",
    industry: "",
    priority: "normal",
    expectedBudget: "",
    currency: "INR",
    deadline: "",
    requirements: "",
    referenceWebsites: "",
    technologyStack: "",
  });

  const canContinue = useMemo(() => {
    if (step === 0) return form.name.length >= 2 && form.description.length >= 10 && form.deadline;
    if (step === 1) return form.requirements.length >= 20;
    return true;
  }, [form, step]);

  const setField = (key: keyof WizardState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const uploadSelectedFiles = async (projectId: string) => {
    const groups: Array<{ folder: FileFolder; files: File[] }> = [
      { folder: "images", files: images },
      { folder: "documents", files: documents },
      { folder: "requirements", files: pdfs },
    ];
    for (const group of groups) {
      for (const file of group.files) {
        await uploadFile.mutateAsync({
          projectId,
          folder: group.folder,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          dataUrl: await readFile(file),
        });
      }
    }
  };

  const submit = async () => {
    try {
      const response = await createProject.mutateAsync({
        name: form.name,
        category: form.category,
        description: form.description,
        industry: form.industry || undefined,
        priority: form.priority,
        expectedBudget: form.expectedBudget ? Number(form.expectedBudget) : undefined,
        currency: form.currency,
        deadline: form.deadline,
        requirements: form.requirements,
        referenceWebsites: form.referenceWebsites
          .split(/[\n,]/)
          .map((item) => item.trim())
          .filter(Boolean),
        technologyStack: form.technologyStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      await uploadSelectedFiles(response.project.id);
      toast.success("Project created");
      navigate({ to: "/client/projects/$projectId", params: { projectId: response.project.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Project could not be created");
    }
  };

  return (
    <ClientPortalShell title="Create New Project">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft sm:p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <FolderKanban className="h-4 w-4" />
                Project intake
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">{STEPS[step]}</h1>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/client/projects">
                <ArrowLeft className="h-4 w-4" />
                My Projects
              </Link>
            </Button>
          </div>

          <div className="mb-6 grid gap-2 sm:grid-cols-3">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => index <= step && setStep(index)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm",
                  index === step ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-background/45",
                )}
              >
                <span className="block text-xs text-muted-foreground">Step {index + 1}</span>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Project name">
                  <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
                </Field>
                <Field label="Category">
                  <select className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(event) => setField("category", event.target.value)}>
                    {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <Textarea rows={4} value={form.description} onChange={(event) => setField("description", event.target.value)} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Industry">
                  <Input value={form.industry} onChange={(event) => setField("industry", event.target.value)} />
                </Field>
                <Field label="Priority">
                  <select className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.priority} onChange={(event) => setField("priority", event.target.value)}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </Field>
                <Field label="Expected budget">
                  <Input min="0" type="number" value={form.expectedBudget} onChange={(event) => setField("expectedBudget", event.target.value)} />
                </Field>
                <Field label="Currency">
                  <select className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.currency} onChange={(event) => setField("currency", event.target.value)}>
                    {CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}
                  </select>
                </Field>
                <Field label="Deadline">
                  <Input type="date" value={form.deadline} onChange={(event) => setField("deadline", event.target.value)} />
                </Field>
                <Field label="Technology stack">
                  <Input value={form.technologyStack} onChange={(event) => setField("technologyStack", event.target.value)} placeholder="React, Node.js, Supabase" />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <Field label="Long requirement editor">
                <Textarea rows={10} value={form.requirements} onChange={(event) => setField("requirements", event.target.value)} />
              </Field>
              <Field label="Reference websites">
                <Textarea rows={3} value={form.referenceWebsites} onChange={(event) => setField("referenceWebsites", event.target.value)} placeholder="One URL per line" />
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                <FilePicker label="Upload images" accept="image/*" files={images} onChange={setImages} />
                <FilePicker label="Upload documents" accept=".doc,.docx,.xls,.xlsx,.txt,.csv,.zip" files={documents} onChange={setDocuments} />
                <FilePicker label="Upload PDFs" accept="application/pdf" files={pdfs} onChange={setPdfs} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {[
                ["Project", form.name],
                ["Category", form.category],
                ["Priority", form.priority],
                ["Budget", `${form.currency} ${form.expectedBudget || "0"}`],
                ["Deadline", form.deadline],
                ["Reference files", `${images.length + documents.length + pdfs.length} selected`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border/70 bg-background/45 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 font-medium">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border/70 pt-5 sm:flex-row sm:justify-between">
            <Button variant="outline" type="button" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
            {step < 2 ? (
              <Button type="button" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
                Continue
              </Button>
            ) : (
              <Button type="button" disabled={createProject.isPending || uploadFile.isPending} onClick={submit}>
                <FileText className="h-4 w-4" />
                {createProject.isPending || uploadFile.isPending ? "Submitting..." : "Submit Project"}
              </Button>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Intake checklist
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Clear scope, budget, references, and files help the team prepare a useful quotation quickly.</p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Deadlines are used for planning and can be adjusted during review.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </ClientPortalShell>
  );
}
