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
r.post(
  "/resend-verification",
  authLimiter,
  validate(c.emailOnly),
  asyncHandler(c.resendVerification),
);
r.post("/oauth/sync", authLimiter, validate(c.oauthSyncSchema), asyncHandler(c.oauthSync));
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

// Mobile verification. Signed-in only: the challenge is bound to the caller's
// own profile, so the number can never be verified on someone else's behalf.
r.post(
  "/phone-otp",
  asyncHandler(requireAuth),
  authLimiter,
  validate(c.phoneOtpRequestSchema),
  asyncHandler(c.sendPhoneOtp),
);
r.post(
  "/verify-phone-otp",
  asyncHandler(requireAuth),
  authLimiter,
  validate(c.phoneOtpVerifySchema),
  asyncHandler(c.verifyPhoneOtp),
);

export default r;
