import { Router } from "express";
import * as c from "../controllers/profile.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const r = Router();
r.use(asyncHandler(requireAuth));
r.get("/", asyncHandler(c.getProfile));
r.put("/", validate(c.profileUpdateSchema), asyncHandler(c.updateProfile));

export default r;
