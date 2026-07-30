import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import * as controller from "../controllers/portal.controller.js";

const router = Router();

const uuid = z.string().uuid();
const attachment = z.object({
  name: z.string().trim().min(1).max(220),
  url: z.string().trim().min(1).max(4000),
  mimeType: z.string().trim().max(120).optional(),
  fileSize: z.number().int().nonnegative().optional(),
});

const projectSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(5000),
  industry: z.string().trim().max(120).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  expectedBudget: z.number().nonnegative().optional(),
  budget: z.number().nonnegative().optional(),
  currency: z.string().trim().min(3).max(3).default("INR"),
  deadline: z.string().date().optional(),
  requirements: z.string().trim().max(20000).optional(),
  referenceWebsites: z.array(z.string().trim().url().max(4000)).default([]),
  referenceFiles: z.array(attachment).default([]),
  attachments: z.array(attachment).default([]),
  technologyStack: z.array(z.string().trim().min(1).max(80)).default([]),
});

const taskSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  status: z.enum(["todo", "in_progress", "review", "completed"]).default("todo"),
  assignedTo: z.string().trim().max(160).optional(),
  deadline: z.string().date().optional(),
  progress: z.number().int().min(0).max(100).default(0),
  checklist: z.array(z.object({ label: z.string().trim().min(1).max(200), done: z.boolean().default(false) })).default([]),
  attachments: z.array(attachment).default([]),
  comments: z.array(z.object({ body: z.string().trim().min(1).max(2000), createdAt: z.string().optional() })).default([]),
});

const taskUpdateSchema = taskSchema.partial();

const messageSchema = z.object({
  projectId: uuid.optional(),
  subject: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1).max(6000),
  attachments: z.array(attachment).default([]),
  pinned: z.boolean().optional(),
});

const messageUpdateSchema = z.object({
  pinned: z.boolean().optional(),
  seen: z.boolean().optional(),
});

const fileUploadSchema = z.object({
  projectId: uuid.optional(),
  folder: z.enum([
    "documents",
    "images",
    "videos",
    "contracts",
    "invoices",
    "designs",
    "source_code",
    "requirements",
    "support",
  ]),
  name: z.string().trim().min(1).max(220),
  mimeType: z.string().trim().min(1).max(120),
  fileSize: z.number().int().nonnegative().max(52_428_800),
  dataUrl: z.string().min(20),
});

const fileUpdateSchema = z.object({
  projectId: uuid.nullable().optional(),
  folder: fileUploadSchema.shape.folder.optional(),
  name: z.string().trim().min(1).max(220).optional(),
});

const quotationResponseSchema = z.object({
  status: z.enum(["accepted", "rejected", "revision_requested"]),
  revisionNote: z.string().trim().max(3000).optional(),
});

const meetingSchema = z.object({
  projectId: uuid.optional(),
  title: z.string().trim().min(2).max(180),
  agenda: z.string().trim().max(5000).optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).default(30),
  platform: z.enum(["google_meet", "microsoft_teams", "zoom", "other"]).optional(),
  googleMeetUrl: z.string().trim().url().optional(),
  zoomUrl: z.string().trim().url().optional(),
  notes: z.string().trim().max(5000).optional(),
});

const meetingUpdateSchema = meetingSchema
  .extend({ status: z.enum(["scheduled", "completed", "cancelled", "rescheduled"]).optional() })
  .partial();

const supportSchema = z.object({
  projectId: uuid.optional(),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(6000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

router.use(requireAuth);

router.get("/dashboard", asyncHandler(controller.dashboard));
router.get("/projects", asyncHandler(controller.listProjects));
router.post("/projects", validate(projectSchema), asyncHandler(controller.createProject));
router.get("/projects/:projectId", asyncHandler(controller.getProject));
router.patch("/projects/:projectId", validate(projectSchema.partial()), asyncHandler(controller.updateProject));
router.get("/projects/:projectId/tasks", asyncHandler(controller.listTasks));
router.post("/projects/:projectId/tasks", validate(taskSchema), asyncHandler(controller.createTask));
router.patch("/tasks/:taskId", validate(taskUpdateSchema), asyncHandler(controller.updateTask));

router.get("/:collection(files|messages|quotations|invoices|payments|meetings|support|notifications|activity)", asyncHandler(controller.listCollection));
router.post("/messages", validate(messageSchema), asyncHandler(controller.createMessage));
router.patch("/messages/:messageId", validate(messageUpdateSchema), asyncHandler(controller.updateMessage));
router.post("/support", validate(supportSchema), asyncHandler(controller.createSupportRequest));
router.post("/files/upload", validate(fileUploadSchema), asyncHandler(controller.uploadFile));
router.patch("/files/:fileId", validate(fileUpdateSchema), asyncHandler(controller.updateFile));
router.delete("/files/:fileId", asyncHandler(controller.deleteFile));
router.patch("/quotations/:quotationId/respond", validate(quotationResponseSchema), asyncHandler(controller.respondToQuotation));
router.post("/meetings", validate(meetingSchema), asyncHandler(controller.createMeeting));
router.patch("/meetings/:meetingId", validate(meetingUpdateSchema), asyncHandler(controller.updateMeeting));
router.patch("/notifications/read-all", asyncHandler(controller.markAllNotificationsRead));
router.patch("/notifications/:notificationId/read", asyncHandler(controller.markNotificationRead));

export default router;
