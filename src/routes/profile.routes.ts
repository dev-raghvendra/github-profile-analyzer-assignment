/**
 * Profile routes configuration.
 * Defines all endpoints for GitHub profile analysis, retrieval, and deletion.
 */
import { Router } from "express";
import {
  analyzeGithubProfile,
  getGithubProfile,
  deleteGithubProfile,
  listGithubProfiles,
} from "@/controllers/profile.controller";
import { validatePaginationProps, validateUsername } from "@/middlewares/validation.middleware";

export const profileRouter = Router();

/**
 * GET /analyze/:username - Analyze and cache a GitHub profile
 */
profileRouter.get("/analyze/:username", validateUsername, analyzeGithubProfile);

/**
 * GET /list - List paginated cached profiles
 */
profileRouter.get("/list", validatePaginationProps, listGithubProfiles);

/**
 * GET /:username - Retrieve a cached GitHub profile
 */
profileRouter.get("/:username", validateUsername, getGithubProfile);

/**
 * DELETE /:username - Delete a cached GitHub profile
 */
profileRouter.delete("/:username", validateUsername, deleteGithubProfile);
