/**
 * Extended Express Request interface with GitHub profile-specific properties.
 * Includes typed params and query parameters for profile operations.
 */
import { Request } from "express";

export interface PopulatedRequest extends Request {
  params: {
    username: string;
  };
  query: {
    force?: string;
    per_page?: string;
    page?: string;
  };
}