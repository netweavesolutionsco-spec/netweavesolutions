import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/client-api";
import { useClientAuth } from "@/hooks/use-client-auth";

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
  senderEmail?: string | null;
  subject?: string | null;
  body: string;
  attachments: PortalAttachment[];
  pinned: boolean;
  seenAt?: string | null;
  adminReadAt?: string | null;
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

export type MeetingPlatform = "google_meet" | "microsoft_teams" | "zoom" | "other";
export type MeetingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "scheduled"
  | "cancelled"
  | "rescheduled";

export interface Meeting {
  id: string;
  projectId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  title: string;
  agenda?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: MeetingStatus;
  platform?: MeetingPlatform | null;
  googleMeetUrl?: string;
  zoomUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  projectId?: string | null;
  clientName: string;
  clientEmail: string;
  subject: string;
  message: string;
  priority: Priority;
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
}

export interface ProjectRequirement {
  id: string;
  projectId?: string | null;
  clientName: string;
  clientEmail: string;
  phone?: string | null;
  company?: string | null;
  service?: string | null;
  budget?: string | null;
  timeline?: string | null;
  requirement: string;
  source: string;
  status: "new" | "in_review" | "quoted" | "accepted" | "rejected" | "closed";
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

/**
 * Portal reads must never fire before the session is restored. On a hard reload
 * the access token lives only in memory, so a query that runs while
 * ClientAuthProvider is still bootstrapping hits the API with no Authorization
 * header and surfaces a raw 401 ("Invalid or expired token") in the UI. Gating
 * on the resolved session — and letting the shell handle redirects — keeps the
 * portal quiet while the token is being refreshed.
 */
export function usePortalSessionReady(): boolean {
  const { user, loading } = useClientAuth();
  return !loading && Boolean(user);
}

/** Auth failures are terminal: client-api already retried once after a refresh. */
function retryPortal(failureCount: number, error: unknown) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
  return failureCount < 2;
}

export function usePortalDashboard() {
  const ready = usePortalSessionReady();
  return useQuery({
    queryKey: portalKeys.dashboard,
    queryFn: () => api.get<DashboardData>("/portal/dashboard"),
    enabled: ready,
    retry: retryPortal,
  });
}

export function useProjects(filters?: { status?: string; search?: string }) {
  const ready = usePortalSessionReady();
  return useQuery({
    queryKey: portalKeys.projects(filters),
    queryFn: () => api.get<Paginated<ClientProject>>(`/portal/projects${qs(filters)}`),
    enabled: ready,
    retry: retryPortal,
  });
}

export function useProject(projectId: string) {
  const ready = usePortalSessionReady();
  return useQuery({
    queryKey: portalKeys.project(projectId),
    queryFn: () => api.get<ProjectDetail>(`/portal/projects/${projectId}`),
    enabled: ready && Boolean(projectId),
    retry: retryPortal,
  });
}

export function usePortalCollection<T>(name: string, filters?: Record<string, unknown>) {
  const ready = usePortalSessionReady();
  return useQuery({
    queryKey: portalKeys.collection(name, filters),
    queryFn: () => api.get<Paginated<T>>(`/portal/${name}${qs(filters)}`),
    enabled: ready,
    retry: retryPortal,
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
    mutationFn: (input: { projectId?: string; subject?: string; body: string; attachments?: PortalAttachment[] }) =>
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
      platform?: MeetingPlatform;
    }) => api.post<{ meeting: Meeting }>("/portal/meetings", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portalKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["portal", "meetings"] });
    },
  });
}

export function useCreateSupport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId?: string; subject: string; message: string; priority: Priority }) =>
      api.post<{ supportRequest: SupportRequest }>("/portal/support", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portalKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["portal", "support"] });
    },
  });
}

/**
 * Submits a project brief from the Contact page. Requires a signed-in client:
 * the backend derives the client identity from the session, so the brief is
 * always attributable in the admin "Project Requirements" section.
 */
export function useCreateRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name?: string;
      phone?: string;
      company?: string;
      service?: string;
      budget?: string;
      timeline?: string;
      requirement: string;
      source?: string;
    }) => api.post<{ requirement: ProjectRequirement }>("/portal/requirements", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: portalKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["portal", "notifications"] });
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
