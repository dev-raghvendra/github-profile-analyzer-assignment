import express from "express";
import {rateLimit} from "express-rate-limit"
import morgan from "morgan"
import cors from 'cors'
import { profileRouter } from "@/routes/profile.routes";
import { errorHandler,routeNotFoundHandler } from "@/middlewares/error.middleware";
import { ServerError } from "@/utils/error";
import { CONFIG } from "@/config/config";

const app = express();

app.set('trust proxy',1)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 200,
  standardHeaders:'draft-8',
  legacyHeaders:false,
  handler:(_,res,next)=>{
    next(new ServerError(
        `Ratelimit exceeded , please try after ${res.getHeader('Retry-After') ?? "some time"}`,
        429
    ))
  }
});


app.use(express.json());
app.use(cors())
app.use(morgan(CONFIG.ENV === "dev" ? "dev" : "combined"))
app.get("/",(_, res) => {
  res.json({
    name: 'GitHub Profile Analyzer API',
    status: 'running',
    docs: {
      analyze: 'GET /api/v1/profiles/analyze/:username',
      getOne: 'GET /api/v1/profiles/:username',
      delete: 'DELETE /api/v1/profiles/:username',
    },
  });
})
app.get("/health",(_,res)=>{
  res.status(200).json({
    code:200,
    message:"running",
    source:"gateway",
    uptime:process.uptime()
  })
})
app.use("/api/v1/profiles/",apiLimiter, profileRouter);
app.use(errorHandler);
app.use(routeNotFoundHandler)

export default app
