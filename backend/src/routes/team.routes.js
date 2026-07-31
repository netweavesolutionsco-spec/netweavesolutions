import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as c from "../controllers/team.controller.js";

const router = Router();

// Strong password mirrors the client register rule so invited staff accounts
// are held to the same standard.
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200)
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[0-9]/, "Password needs a number")
  .regex(/[^A-Za-z0-9]/, "Password needs a special character");

const inviteSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  role: z.enum(["Super Admin", "Admin", "Manager", "Editor", "Content Manager", "Support"]),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

const roleUpdateSchema = z.object({
  appRole: z.enum(["admin", "editor", "manager", "viewer"]),
});

const statusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

const acceptSchema = z.object({
  token: z.string().trim().min(10).max(200),
  fullName: z.string().trim().min(2).max(120).optional(),
  password: strongPassword,
});

// Tight limiter on the public accept endpoints (token guessing / abuse).
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Public: invite accept flow (token-validated in the service) ---
router.get("/invitations/lookup", publicLimiter, asyncHandler(c.getInvitation));
router.post("/invitations/accept", publicLimiter, validate(acceptSchema), asyncHandler(c.acceptInvitation));

// --- Admin-gated ---
router.use(asyncHandler(requireAdmin));

router.get("/invitations", asyncHandler(c.listInvitations));
router.post("/invitations", validate(inviteSchema), asyncHandler(c.createInvitation));
router.post("/invitations/:id/resend", asyncHandler(c.resendInvitation));
router.post("/invitations/:id/cancel", asyncHandler(c.cancelInvitation));

router.get("/members", asyncHandler(c.listMembers));
router.patch("/members/:id/role", validate(roleUpdateSchema), asyncHandler(c.updateMemberRole));
router.patch("/members/:id/status", validate(statusSchema), asyncHandler(c.setMemberStatus));
router.delete("/members/:id", asyncHandler(c.removeMember));

export default router;
