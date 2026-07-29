import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as c from "../controllers/leads.controller.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const r = Router();

// This endpoint is public and unauthenticated, so it gets a much tighter limit
// than the global one. 5 enquiries per IP per 15 minutes is generous for a
// human and hostile to spam scripts.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again in a little while." },
});

r.post("/", submitLimiter, validate(c.leadCreateSchema), asyncHandler(c.createLead));

export default r;
