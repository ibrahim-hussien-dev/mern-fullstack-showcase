import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import tasksRouter from "./routes/tasks.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || env.CORS_ORIGINS.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
    message: { error: { message: "Too many requests, try again later.", code: "RATE_LIMITED" } },
  })
);

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/tasks", tasksRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
