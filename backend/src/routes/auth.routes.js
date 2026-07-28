import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as c from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const r = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

r.post("/register", authLimiter, validate(c.registerSchema), asyncHandler(c.register));
r.post("/login", authLimiter, validate(c.loginSchema), asyncHandler(c.login));
r.post("/logout", asyncHandler(c.logout));
r.post("/refresh", asyncHandler(c.refresh));
r.get("/me", asyncHandler(requireAuth), asyncHandler(c.me));

r.post("/verify-email", authLimiter, validate(c.verifyEmailSchema), asyncHandler(c.verifyEmail));
r.post("/forgot-password", authLimiter, validate(c.emailOnly), asyncHandler(c.forgotPassword));
r.post("/reset-password", authLimiter, validate(c.resetPasswordSchema), asyncHandler(c.resetPassword));
r.post(
  "/change-password",
  asyncHandler(requireAuth),
  validate(c.changePasswordSchema),
  asyncHandler(c.changePassword),
);

r.post("/send-otp", asyncHandler(requireAuth), authLimiter, asyncHandler(c.sendOtp));
r.post("/verify-otp", asyncHandler(requireAuth), validate(c.otpSchema), asyncHandler(c.verifyOtp));

export default r;
