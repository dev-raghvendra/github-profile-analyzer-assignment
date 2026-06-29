/**
 * Express application configuration and middleware setup.
 * Configures CORS, rate limiting, logging, and all API routes.
 */
import express from "express";
import { rateLimit } from "express-rate-limit";
import morgan from "morgan";
import cors from "cors";
import { profileRouter } from "@/routes/profile.routes";
import { errorHandler, routeNotFoundHandler } from "@/middlewares/error.middleware";
import { ServerError } from "@/utils/error";
import { CONFIG } from "@/config/config";

const app = express();

app.set("trust proxy", 1);

/**
 * Rate limiter middleware: 200 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_, res, next) => {
    next(
      new ServerError(
        `Rate limit exceeded, please try after ${res.getHeader("Retry-After") ?? "some time"}`,
        429
      )
    );
  },
});

app.use(express.json());
app.use(cors());
app.use(morgan(CONFIG.ENV === "dev" ? "dev" : "combined"));
app.get("/",()=>console.log("REQ_RECEIVED"))

/**
 * Health check and API documentation endpoint
 */
app.get("/", (_, res) => {
  res.json({
    name: "GitHub Profile Analyzer API",
    status: "running",
    docs: {
      analyze: "GET /api/v1/profiles/analyze/:username",
      list: "GET /api/v1/profiles/list",
      getOne: "GET /api/v1/profiles/:username",
      delete: "DELETE /api/v1/profiles/:username",
    },
  });
});

/**
 * Service health check endpoint
 */
app.get("/health", (_, res) => {
  res.status(200).json({
    code: 200,
    message: "running",
    source: "gateway",
    uptime: process.uptime(),
  });
});

app.use("/api/v1/profiles/", apiLimiter, profileRouter);
app.use(errorHandler);
app.use(routeNotFoundHandler);

export default app;
