import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { supabaseAdmin } from "../config/supabase.js";

const PAGE_SIZE = 20;
const FILE_BUCKET = "client-files";

function clean(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function camelizeKey(key) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function camelize(value) {
  if (Array.isArray(value)) return value.map(camelize);
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  return Object.fromEntries(Object.entries(value).map(([key, val]) => [camelizeKey(key), camelize(val)]));
}

function pagination(query) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? PAGE_SIZE), 1), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

async function requireProject(clientId, projectId) {
  const { data, error } = await supabaseAdmin
    .from("client_projects")
    .select("id, client_id")
    .eq("id", projectId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const notFound = new Error("Project not found");
    notFound.status = 404;
    throw notFound;
  }
  return data;
}

export async function recordActivity(clientId, actorId, action, description, metadata = {}, projectId = null) {
  await supabaseAdmin.from("client_activity_logs").insert({
    client_id: clientId,
    actor_id: actorId,
    project_id: projectId,
    action,
    description,
    metadata,
  });
}

async function insertNotification(clientId, type, title, body, actionUrl = null) {
  await supabaseAdmin.from("client_notifications").insert({
    client_id: clientId,
    type,
    title,
    body,
    action_url: actionUrl,
  });
}

function projectPayload(input, clientId) {
  return clean({
    client_id: clientId,
    name: input.name,
    category: input.category,
    description: input.description,
    industry: input.industry,
    priority: input.priority,
    expected_budget: input.expectedBudget,
    budget: input.budget,
    currency: input.currency,
    deadline: input.deadline,
    requirements: input.requirements,
    reference_websites: input.referenceWebsites,
    reference_files: input.referenceFiles,
    attachments: input.attachments,
    technology_stack: input.technologyStack,
  });
}

async function withSignedFileUrls(files) {
  return Promise.all(
    (files ?? []).map(async (file) => {
      const { data } = await supabaseAdmin.storage
        .from(FILE_BUCKET)
        .createSignedUrl(file.file_url, 60 * 10, { download: file.name });
      return { ...file, file_url: data?.signedUrl ?? file.file_url };
    }),
  );
}

export async function getDashboard(client) {
  const clientId = client.id;
  const [
    projects,
    pendingQuotations,
    invoices,
    unreadMessages,
    upcomingMeetings,
    activity,
    notifications,
  ] = await Promise.all([
    supabaseAdmin.from("client_projects").select("id, status, progress, created_at").eq("client_id", clientId),
    supabaseAdmin
      .from("project_quotations")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "pending"),
    supabaseAdmin
      .from("project_invoices")
      .select("id, amount, status", { count: "exact" })
      .eq("client_id", clientId)
      .in("status", ["sent", "partially_paid", "overdue"]),
    supabaseAdmin
      .from("project_messages")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .is("seen_at", null),
    supabaseAdmin
      .from("project_meetings")
      .select("*")
      .eq("client_id", clientId)
      .gte("scheduled_at", new Date().toISOString())
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabaseAdmin
      .from("client_activity_logs")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("client_notifications")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  for (const result of [
    projects,
    pendingQuotations,
    invoices,
    unreadMessages,
    upcomingMeetings,
    activity,
    notifications,
  ]) {
    if (result.error) throw result.error;
  }

  const projectRows = projects.data ?? [];
  const totalProjects = projectRows.length;
  const completedProjects = projectRows.filter((project) => project.status === "completed").length;
  const runningProjects = projectRows.filter((project) =>
    ["planning", "running", "review"].includes(project.status),
  ).length;
  const completion =
    totalProjects === 0
      ? 0
      : Math.round(projectRows.reduce((sum, project) => sum + Number(project.progress ?? 0), 0) / totalProjects);
  const outstandingBalance = (invoices.data ?? [])
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0);

  return {
    client: camelize(client),
    summary: {
      totalProjects,
      completedProjects,
      runningProjects,
      pendingQuotations: pendingQuotations.count ?? 0,
      invoices: invoices.count ?? 0,
      unreadMessages: unreadMessages.count ?? 0,
      upcomingMeetings: upcomingMeetings.data?.length ?? 0,
      projectCompletion: completion,
      outstandingBalance,
      currentPlan: "Client",
      memberSince: client.createdAt,
    },
    upcomingMeetings: camelize(upcomingMeetings.data ?? []),
    activity: camelize(activity.data ?? []),
    notifications: camelize(notifications.data ?? []),
  };
}

export async function listProjects(clientId, query) {
  const { page, pageSize, from, to } = pagination(query);
  let request = supabaseAdmin
    .from("client_projects")
    .select("*", { count: "exact" })
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (query.status) request = request.eq("status", query.status);
  if (query.search) request = request.or(`name.ilike.%${query.search}%,category.ilike.%${query.search}%`);

  const { data, error, count } = await request;
  if (error) throw error;
  return { data: camelize(data ?? []), page, pageSize, total: count ?? 0 };
}

export async function createProject(client, input) {
  const { data, error } = await supabaseAdmin
    .from("client_projects")
    .insert(projectPayload(input, client.id))
    .select("*")
    .single();
  if (error) throw error;

  await recordActivity(client.id, client.id, "project_created", `Project created: ${data.name}`, {}, data.id);
  await insertNotification(
    client.id,
    "project_created",
    "Project request submitted",
    `${data.name} has been sent to the Netweavesolutions team.`,
    `/client/projects/${data.id}`,
  );

  return camelize(data);
}

export async function getProject(clientId, projectId) {
  await requireProject(clientId, projectId);
  const [project, tasks, files, messages, invoices, quotations, activity] = await Promise.all([
    supabaseAdmin.from("client_projects").select("*").eq("id", projectId).eq("client_id", clientId).single(),
    supabaseAdmin.from("project_tasks").select("*").eq("project_id", projectId).eq("client_id", clientId),
    supabaseAdmin.from("project_files").select("*").eq("project_id", projectId).eq("client_id", clientId),
    supabaseAdmin
      .from("project_messages")
      .select("*")
      .eq("project_id", projectId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: true }),
    supabaseAdmin.from("project_invoices").select("*").eq("project_id", projectId).eq("client_id", clientId),
    supabaseAdmin.from("project_quotations").select("*").eq("project_id", projectId).eq("client_id", clientId),
    supabaseAdmin
      .from("client_activity_logs")
      .select("*")
      .eq("project_id", projectId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);

  for (const result of [project, tasks, files, messages, invoices, quotations, activity]) {
    if (result.error) throw result.error;
  }

  return {
    project: camelize(project.data),
    tasks: camelize(tasks.data ?? []),
    files: camelize(await withSignedFileUrls(files.data ?? [])),
    messages: camelize(messages.data ?? []),
    invoices: camelize(invoices.data ?? []),
    quotations: camelize(quotations.data ?? []),
    activity: camelize(activity.data ?? []),
  };
}

export async function updateProject(client, projectId, input) {
  await requireProject(client.id, projectId);
  const { data, error } = await supabaseAdmin
    .from("client_projects")
    .update(projectPayload(input, client.id))
    .eq("id", projectId)
    .eq("client_id", client.id)
    .select("*")
    .single();
  if (error) throw error;
  await recordActivity(client.id, client.id, "project_updated", `Project updated: ${data.name}`, {}, projectId);
  return camelize(data);
}

export async function listRows(table, clientId, query = {}) {
  const { page, pageSize, from, to } = pagination(query);
  let request = supabaseAdmin
    .from(table)
    .select("*", { count: "exact" })
    .eq("client_id", clientId)
    .order(query.orderBy ?? "created_at", { ascending: query.ascending === "true" })
    .range(from, to);

  if (query.projectId) request = request.eq("project_id", query.projectId);
  if (query.status) request = request.eq("status", query.status);
  if (query.folder) request = request.eq("folder", query.folder);

  let { data, error, count } = await request;
  if (error) throw error;
  if (table === "project_files") data = await withSignedFileUrls(data ?? []);
  return { data: camelize(data ?? []), page, pageSize, total: count ?? 0 };
}

export async function createTask(client, projectId, input) {
  await requireProject(client.id, projectId);
  const { data, error } = await supabaseAdmin
    .from("project_tasks")
    .insert({
      project_id: projectId,
      client_id: client.id,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      assigned_to: input.assignedTo,
      deadline: input.deadline,
      progress: input.progress,
      checklist: input.checklist,
      attachments: input.attachments,
      comments: input.comments,
    })
    .select("*")
    .single();
  if (error) throw error;
  await recordActivity(client.id, client.id, "task_created", `Task created: ${data.title}`, {}, projectId);
  return camelize(data);
}

export async function updateTask(client, taskId, input) {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("project_tasks")
    .select("id, project_id")
    .eq("id", taskId)
    .eq("client_id", client.id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!existing) {
    const notFound = new Error("Task not found");
    notFound.status = 404;
    throw notFound;
  }

  const { data, error } = await supabaseAdmin
    .from("project_tasks")
    .update(clean({
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      assigned_to: input.assignedTo,
      deadline: input.deadline,
      progress: input.progress,
      checklist: input.checklist,
      attachments: input.attachments,
      comments: input.comments,
    }))
    .eq("id", taskId)
    .eq("client_id", client.id)
    .select("*")
    .single();
  if (error) throw error;
  await recordActivity(client.id, client.id, "task_updated", `Task updated: ${data.title}`, {}, existing.project_id);
  return camelize(data);
}

export async function createMessage(client, input) {
  if (input.projectId) await requireProject(client.id, input.projectId);
  const { data, error } = await supabaseAdmin
    .from("project_messages")
    .insert({
      project_id: input.projectId ?? null,
      client_id: client.id,
      sender_id: client.id,
      sender_name: client.fullName || client.email,
      body: input.body,
      attachments: input.attachments ?? [],
      pinned: input.pinned ?? false,
      seen_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  await recordActivity(client.id, client.id, "message_sent", "Message sent to the team", {}, input.projectId ?? null);
  return camelize(data);
}

export async function updateMessage(client, messageId, input) {
  const { data, error } = await supabaseAdmin
    .from("project_messages")
    .update(clean({ pinned: input.pinned, seen_at: input.seen ? new Date().toISOString() : undefined }))
    .eq("id", messageId)
    .eq("client_id", client.id)
    .select("*")
    .single();
  if (error) throw error;
  return camelize(data);
}

export async function uploadFile(client, input) {
  if (input.projectId) await requireProject(client.id, input.projectId);
  const base64 = input.dataUrl.includes(",") ? input.dataUrl.split(",").pop() : input.dataUrl;
  const buffer = Buffer.from(base64, "base64");
  const safeName = input.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `${client.id}/${input.projectId ?? "general"}/${randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(FILE_BUCKET)
    .upload(path, buffer, { contentType: input.mimeType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabaseAdmin
    .from("project_files")
    .insert({
      project_id: input.projectId ?? null,
      client_id: client.id,
      folder: input.folder,
      name: input.name,
      file_url: path,
      mime_type: input.mimeType,
      file_size: input.fileSize,
      uploaded_by: client.id,
      metadata: { storageBucket: FILE_BUCKET },
    })
    .select("*")
    .single();
  if (error) throw error;
  await recordActivity(client.id, client.id, "file_uploaded", `File uploaded: ${input.name}`, {}, input.projectId ?? null);
  return camelize((await withSignedFileUrls([data]))[0]);
}

export async function updateFile(client, fileId, input) {
  const { data, error } = await supabaseAdmin
    .from("project_files")
    .update(clean({ name: input.name, folder: input.folder, project_id: input.projectId }))
    .eq("id", fileId)
    .eq("client_id", client.id)
    .select("*")
    .single();
  if (error) throw error;
  await recordActivity(client.id, client.id, "file_updated", `File updated: ${data.name}`, {}, data.project_id);
  return camelize((await withSignedFileUrls([data]))[0]);
}

export async function deleteFile(client, fileId) {
  const { data: file, error: lookupError } = await supabaseAdmin
    .from("project_files")
    .select("*")
    .eq("id", fileId)
    .eq("client_id", client.id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!file) {
    const notFound = new Error("File not found");
    notFound.status = 404;
    throw notFound;
  }
  await supabaseAdmin.storage.from(FILE_BUCKET).remove([file.file_url]);
  const { error } = await supabaseAdmin.from("project_files").delete().eq("id", fileId).eq("client_id", client.id);
  if (error) throw error;
  await recordActivity(client.id, client.id, "file_deleted", `File deleted: ${file.name}`, {}, file.project_id);
  return { ok: true };
}

export async function respondToQuotation(client, quotationId, input) {
  const { data, error } = await supabaseAdmin
    .from("project_quotations")
    .update({
      status: input.status,
      revision_note: input.revisionNote,
      responded_at: new Date().toISOString(),
    })
    .eq("id", quotationId)
    .eq("client_id", client.id)
    .select("*")
    .single();
  if (error) throw error;
  await recordActivity(client.id, client.id, `quotation_${input.status}`, `Quotation ${input.status}`, {}, data.project_id);
  return camelize(data);
}

export async function createMeeting(client, input) {
  if (input.projectId) await requireProject(client.id, input.projectId);
  const { data, error } = await supabaseAdmin
    .from("project_meetings")
    .insert({
      project_id: input.projectId ?? null,
      client_id: client.id,
      title: input.title,
      agenda: input.agenda,
      scheduled_at: input.scheduledAt,
      duration_minutes: input.durationMinutes,
      google_meet_url: input.googleMeetUrl,
      zoom_url: input.zoomUrl,
      notes: input.notes,
    })
    .select("*")
    .single();
  if (error) throw error;
  await recordActivity(client.id, client.id, "meeting_requested", `Meeting requested: ${data.title}`, {}, input.projectId ?? null);
  await insertNotification(client.id, "meeting_scheduled", "Meeting request received", data.title, "/client/meetings");
  return camelize(data);
}

export async function updateMeeting(client, meetingId, input) {
  const { data, error } = await supabaseAdmin
    .from("project_meetings")
    .update(clean({
      title: input.title,
      agenda: input.agenda,
      scheduled_at: input.scheduledAt,
      duration_minutes: input.durationMinutes,
      status: input.status,
      notes: input.notes,
    }))
    .eq("id", meetingId)
    .eq("client_id", client.id)
    .select("*")
    .single();
  if (error) throw error;
  await recordActivity(client.id, client.id, "meeting_updated", `Meeting updated: ${data.title}`, {}, data.project_id);
  return camelize(data);
}

export async function markNotificationRead(clientId, notificationId) {
  const { data, error } = await supabaseAdmin
    .from("client_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("client_id", clientId)
    .select("*")
    .single();
  if (error) throw error;
  return camelize(data);
}

export async function markAllNotificationsRead(clientId) {
  const { error } = await supabaseAdmin
    .from("client_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .is("read_at", null);
  if (error) throw error;
  return { ok: true };
}
