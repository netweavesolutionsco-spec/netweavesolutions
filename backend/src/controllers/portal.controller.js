import * as portal from "../services/portal.service.js";
import { emailTemplates, sendMail } from "../utils/mailer.js";
import { env } from "../config/env.js";

const TABLES = {
  files: "project_files",
  messages: "project_messages",
  quotations: "project_quotations",
  invoices: "project_invoices",
  payments: "project_payments",
  meetings: "project_meetings",
  support: "support_requests",
  notifications: "client_notifications",
  activity: "client_activity_logs",
};

const PLATFORM_LABELS = {
  google_meet: "Google Meet",
  microsoft_teams: "Microsoft Teams",
  zoom: "Zoom",
  google_calendar: "Google Calendar",
  phone_call: "Phone Call",
  other: "Other",
};

/** Notifications must never block or fail the request — fire and forget. */
function notifyCompany(mail) {
  void sendMail({
    to: env.LEAD_NOTIFY_EMAIL,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  }).catch((err) => console.error("[portal] company notification failed:", err?.message ?? err));
}

export async function dashboard(req, res) {
  res.json(await portal.getDashboard(req.client));
}

export async function listProjects(req, res) {
  res.json(await portal.listProjects(req.client.id, req.query));
}

export async function createProject(req, res) {
  res.status(201).json({ project: await portal.createProject(req.client, req.body) });
}

export async function getProject(req, res) {
  res.json(await portal.getProject(req.client.id, req.params.projectId));
}

export async function updateProject(req, res) {
  res.json({ project: await portal.updateProject(req.client, req.params.projectId, req.body) });
}

export async function listTasks(req, res) {
  res.json(await portal.listRows("project_tasks", req.client.id, { ...req.query, projectId: req.params.projectId }));
}

export async function createTask(req, res) {
  res.status(201).json({ task: await portal.createTask(req.client, req.params.projectId, req.body) });
}

export async function updateTask(req, res) {
  res.json({ task: await portal.updateTask(req.client, req.params.taskId, req.body) });
}

export async function listCollection(req, res) {
  const table = TABLES[req.params.collection];
  if (!table) return res.status(404).json({ error: "Unknown collection" });
  res.json(await portal.listRows(table, req.client.id, req.query));
}

export async function createMessage(req, res) {
  res.status(201).json({ message: await portal.createMessage(req.client, req.body) });
}

export async function updateMessage(req, res) {
  res.json({ message: await portal.updateMessage(req.client, req.params.messageId, req.body) });
}

export async function uploadFile(req, res) {
  res.status(201).json({ file: await portal.uploadFile(req.client, req.body) });
}

export async function updateFile(req, res) {
  res.json({ file: await portal.updateFile(req.client, req.params.fileId, req.body) });
}

export async function deleteFile(req, res) {
  res.json(await portal.deleteFile(req.client, req.params.fileId));
}

export async function respondToQuotation(req, res) {
  res.json({
    quotation: await portal.respondToQuotation(req.client, req.params.quotationId, req.body),
  });
}

export async function createMeeting(req, res) {
  const meeting = await portal.createMeeting(req.client, req.body);
  const scheduled = new Date(meeting.scheduledAt);
  const date = scheduled.toLocaleDateString("en-IN", { dateStyle: "medium" });
  const time = scheduled.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const platformLabel = PLATFORM_LABELS[meeting.platform] ?? "Meeting";

  // Internal alert to the team.
  notifyCompany(
    emailTemplates.newMeeting({
      clientName: meeting.clientName,
      clientEmail: meeting.clientEmail,
      platformLabel,
      date,
      time,
      title: meeting.title,
      agenda: meeting.agenda,
    }),
  );

  // Confirmation email to the client who scheduled it.
  if (meeting.clientEmail) {
    void sendMail({
      to: meeting.clientEmail,
      ...emailTemplates.meetingConfirmation({
        clientName: meeting.clientName,
        platformLabel,
        date,
        time,
        title: meeting.title,
        meetingLink: meeting.meetingLink,
      }),
    }).catch((err) => console.error("[portal] meeting confirmation email failed:", err?.message ?? err));
  }

  res.status(201).json({ meeting });
}

export async function createSupportRequest(req, res) {
  const ticket = await portal.createSupportRequest(req.client, req.body);
  notifyCompany(
    emailTemplates.newSupportRequest({
      clientName: ticket.clientName,
      clientEmail: ticket.clientEmail,
      subject: ticket.subject,
      priority: ticket.priority,
      message: ticket.message,
    }),
  );
  res.status(201).json({ supportRequest: ticket });
}

export async function createProjectRequirement(req, res) {
  const { requirement, duplicate } = await portal.createProjectRequirement(req.client, req.body);
  // A duplicate is a double submit of a brief we already stored and already
  // emailed about — acknowledge it without sending the company a second copy.
  if (!duplicate) {
    notifyCompany(emailTemplates.newProjectRequirement(requirement));
  }
  res.status(201).json({ requirement });
}

export async function updateMeeting(req, res) {
  res.json({ meeting: await portal.updateMeeting(req.client, req.params.meetingId, req.body) });
}

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  completed: "Completed",
  scheduled: "Scheduled",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

export async function adminUpdateMeeting(req, res) {
  const meeting = await portal.adminUpdateMeeting(req.admin, req.params.meetingId, req.body);
  const scheduled = new Date(meeting.scheduledAt);
  const date = scheduled.toLocaleDateString("en-IN", { dateStyle: "medium" });
  const time = scheduled.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // Automatically email the client that their meeting was updated.
  if (meeting.clientEmail) {
    void sendMail({
      to: meeting.clientEmail,
      ...emailTemplates.meetingUpdated({
        clientName: meeting.clientName,
        statusLabel: STATUS_LABELS[meeting.status] ?? meeting.status,
        platformLabel: PLATFORM_LABELS[meeting.platform] ?? "Meeting",
        date,
        time,
        title: meeting.title,
        meetingLink: meeting.meetingLink,
      }),
    }).catch((err) => console.error("[portal] meeting update email failed:", err?.message ?? err));
  }

  res.json({ meeting });
}

export async function markNotificationRead(req, res) {
  res.json({ notification: await portal.markNotificationRead(req.client.id, req.params.notificationId) });
}

export async function markAllNotificationsRead(req, res) {
  res.json(await portal.markAllNotificationsRead(req.client.id));
}

export async function deleteNotification(req, res) {
  res.json(await portal.deleteNotification(req.client.id, req.params.notificationId));
}

export async function clearAllNotifications(req, res) {
  res.json(await portal.clearAllNotifications(req.client.id));
}
