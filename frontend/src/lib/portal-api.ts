import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/client-api";

export type ProjectStatus =
  | "submitted"
  | "planning"
  | "running"
  | "review"
  | "completed"
  | "on_hold"
  | "cancelled";
export type Priority = "low" | "normal" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "review" | "completed";
export type FileFolder =
  | "documents"
  | "images"
  | "videos"
  | "contracts"
  | "invoices"
  | "designs"
  | "source_code"
  | "requirements"
  | "support";

export interface PortalAttachment {
  name: string;
  url: string;
  mimeType?: string;
  fileSize?: number;
}

export interface ClientProject {
  id: string;
  projectCode: string;
  name: string;
  category: string;
  description: string;
  industry?: string;
  technologyStack: string[];
  priority: Priority;
  status: ProjectStatus;
  progress: number;
  deadline?: string;
  expectedBudget?: number;
  budget?: number;
  currency: string;
  assignedTeam: Array<{ name: string; role: string; avatarUrl?: string }>;
  requirements?: string;
  referenceWebsites: string[];
  referenceFiles: PortalAttachment[];
  attachments: PortalAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  assignedTo?: string;
  deadline?: string;
  progress: number;
  checklist: Array<{ label: string; done: boolean }>;
  attachments: PortalAttachment[];
  comments: Array<{ body: string; createdAt?: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId?: string | null;
  folder: FileFolder;
  name: string;
  fileUrl: string;
  mimeType?: string;
  fileSize: number;
  version: number;
  versionHistory: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMessage {
  id: string;
  projectId?: string | null;
  senderName: string;
  body: string;
  attachments: PortalAttachment[];
  pinned: boolean;
  seenAt?: string | null;
  createdAt: string;
}

export interface Quotation {
  id: string;
  projectId?: string | null;
  quotationNumber: string;
  title: string;
  scope: unknown[];
  amount: number;
  currency: string;
  status: "pending" | "accepted" | "rejected" | "revision_requested" | "expired";
  expiresAt?: string;
  pdfUrl?: string;
  revisionNote?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  projectId?: string | null;
  invoiceNumber: string;
  title: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "void";
  dueAt?: string;
  paidAt?: string;
  pdfUrl?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId?: string | null;
  projectId?: string | null;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "paid" | "failed" | "refunded";
  provider: "stripe" | string;
  providerPaymentId?: string;
  receiptUrl?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  projectId?: string | null;
  title: string;
  agenda?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  googleMeetUrl?: string;
  zoomUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId?: string | null;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardData {
  client: {
    fullName: string;
    companyName?: string;
    createdAt?: string;
  };
  summary: {
    totalProjects: number;
    completedProjects: number;
    runningProjects: number;
    pendingQuotations: number;
    invoices: number;
    unreadMessages: number;
    upcomingMeetings: number;
    projectCompletion: number;
    outstandingBalance: number;
    currentPlan: string;
    memberSince?: string;
  };
  upcomingMeetings: Meeting[];
  activity: ActivityLog[];
  notifications: ClientNotification[];
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ProjectDetail {
  project: ClientProject;
  tasks: ProjectTask[];
  files: ProjectFile[];
  messages: ProjectMessage[];
  invoices: Invoice[];
  quotations: Quotation[];
  activity: ActivityLog[];
}

export type CreateProjectInput = Pick<
  ClientProject,
  "name" | "category" | "description" | "priority" | "currency"
> & {
  industry?: string;
  expectedBudget?: number;
  deadline?: string;
  requirements?: string;
  referenceWebsites?: string[];
  referenceFiles?: PortalAttachment[];
  attachments?: PortalAttachment[];
  technologyStack?: string[];
};

export const portalKeys = {
  dashboard: ["portal", "dashboard"] as const,
  projects: (filters?: Record<string, unknown>) => ["portal", "projects", filters ?? {}] as const,
  project: (id: string) => ["portal", "projects", id] as const,
  collection: (name: string, filters?: Record<string, unknown>) =>
    ["portal", name, filters ?? {}] as const,
};

function qs(params?: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function usePortalDashboard() {
  return useQuery({ queryKey: portalKeys.dashboard, queryFn: () => api.get<DashboardData>("/portal/dashboard") });
}

export function useProjects(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: portalKeys.projects(filters),
    queryFn: () => api.get<Paginated<ClientProject>>(`/portal/projects${qs(filters)}`),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: portalKeys.project(projectId),
    queryFn: () => api.get<ProjectDetail>(`/portal/projects/${projectId}`),
    enabled: Boolean(projectId),
  });
}

export function usePortalCollection<T>(name: string, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: portalKeys.collection(name, filters),
    queryFn: () => api.get<Paginated<T>>(`/portal/${name}${qs(filters)}`),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => api.post<{ project: ClientProject }>("/portal/projects", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portalKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["portal", "projects"] });
    },
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId?: string; body: string; attachments?: PortalAttachment[] }) =>
      api.post<{ message: ProjectMessage }>("/portal/messages", input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: portalKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["portal", "messages"] });
      if (input.projectId) void queryClient.invalidateQueries({ queryKey: portalKeys.project(input.projectId) });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      projectId?: string;
      folder: FileFolder;
      name: string;
      mimeType: string;
      fileSize: number;
      dataUrl: string;
    }) => api.post<{ file: ProjectFile }>("/portal/files/upload", input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: ["portal", "files"] });
      if (input.projectId) void queryClient.invalidateQueries({ queryKey: portalKeys.project(input.projectId) });
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name?: string; folder?: FileFolder; projectId?: string | null }) =>
      api.patch<{ file: ProjectFile }>(`/portal/files/${input.id}`, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["portal", "files"] }),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/portal/files/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["portal", "files"] }),
  });
}

export function useRespondQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: "accepted" | "rejected" | "revision_requested"; revisionNote?: string }) =>
      api.patch<{ quotation: Quotation }>(`/portal/quotations/${input.id}/respond`, {
        status: input.status,
        revisionNote: input.revisionNote,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portalKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["portal", "quotations"] });
    },
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      projectId?: string;
      title: string;
      agenda?: string;
      scheduledAt: string;
      durationMinutes: number;
    }) => api.post<{ meeting: Meeting }>("/portal/meetings", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portalKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["portal", "meetings"] });
    },
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) =>
      id
        ? api.patch<{ notification: ClientNotification }>(`/portal/notifications/${id}/read`, {})
        : api.patch<{ ok: boolean }>("/portal/notifications/read-all", {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portalKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["portal", "notifications"] });
    },
  });
}

export function formatMoney(amount?: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    Number(amount ?? 0),
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
