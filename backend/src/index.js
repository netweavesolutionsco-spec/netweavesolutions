import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

app.set("trust proxy", 1);

// -------------------- Helmet --------------------
app.use(helmet());

// -------------------- CORS --------------------
const allowedOrigins = [
  "https://netweavesolutions.tech",
  "https://www.netweavesolutions.tech",
  "https://netweavesolutions.vercel.app", // agar Vercel domain use karte ho
  "http://localhost:8080",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Postman / server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("[CORS BLOCKED]", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

// Handle preflight requests
app.options("*", cors());

// -------------------- Body Parser --------------------
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// -------------------- Rate Limiter --------------------
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// -------------------- Health --------------------
app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    ts: Date.now(),
  });
});

// -------------------- Routes --------------------
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);

// -------------------- Error Handling --------------------
app.use(notFound);
app.use(errorHandler);

// -------------------- Server --------------------
const port = env.PORT || 4000;

process.on("uncaughtException", (err) => {
  console.error("[startup] Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[startup] Unhandled rejection:", reason);
  process.exit(1);
});

console.log("[API] Allowed Origins:", allowedOrigins);

app.listen(port, () => {
  console.log(`[api] listening on :${port}`);
  console.log(`[api] environment: ${env.NODE_ENV}`);
  console.log("[api] server started successfully");
});