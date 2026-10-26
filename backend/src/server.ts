import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
import resumeRoutes from "./routes/resume.js";
import analyticsRoutes from "./routes/analytics.js";
import savedJobRoutes from "./routes/savedJobs.js";
import recommendationRoutes from "./routes/recommendations.js";
import {
  errorHandler,
  notFound
} from "./middleware/errors.js";

const app = express();

const port = Number(process.env.PORT || 5000);
const frontendUrl = process.env.FRONTEND_URL;
const isProduction = process.env.NODE_ENV === "production";

if (!frontendUrl) {
  throw new Error("FRONTEND_URL must be configured");
}

if (
  isProduction &&
  (!process.env.JWT_SECRET ||
    Buffer.byteLength(process.env.JWT_SECRET) < 32)
) {
  throw new Error("A secure JWT_SECRET is required in production");
}

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

app.use("/api", apiLimiter);

app.use("/api/auth", (req, res, next) => {
  if (["POST"].includes(req.method) &&
      ["/login", "/register"].includes(req.path)) {
    return authLimiter(req, res, next);
  }

  next();
});

// Additional browser Origin check for cookie-authenticated mutations.
app.use("/api", (req, res, next) => {
  const changesState = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const origin = req.get("origin");

  if (changesState && origin && origin !== frontendUrl) {
    res.status(403).json({
      error: "ORIGIN_NOT_ALLOWED",
      message: "Request origin is not allowed"
    });
    return;
  }

  next();
});

app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    service: "HireFlow API",
    database: databaseConnected ? "connected" : "disconnected"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use(errorHandler);

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`HireFlow API running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start HireFlow API:", error);
  process.exit(1);
});