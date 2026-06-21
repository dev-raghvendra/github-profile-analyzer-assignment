import { Router } from "express";
import { analyzeGithubProfile, getGithubProfile, deleteGithubProfile } from "@/controllers/profile.controller";
import { validateUsername } from "@/middlewares/validation.middleware";

export const profileRouter = Router();

profileRouter.get("/analyze/:username", validateUsername, analyzeGithubProfile);
profileRouter.get("/:username", validateUsername, getGithubProfile);
profileRouter.delete("/:username", validateUsername, deleteGithubProfile);
