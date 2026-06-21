/**
 * Request validation middleware for GitHub profile operations.
 * Handles username validation and pagination parameter validation.
 */
import { Response, NextFunction } from "express";
import { param, query, validationResult } from "express-validator";
import { PopulatedRequest } from "@/types/request";
import { ValidationError } from "@/utils/error";

/**
 * GitHub username pattern: 1-39 characters, alphanumeric and hyphens
 * Must start and end with alphanumeric, no consecutive hyphens
 */
const usernamePattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

/**
 * Centralized validation error handler
 */
function handleValidationError(
  req: PopulatedRequest,
  _: Response,
  next: NextFunction
) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ValidationError(`${errors.array().map((e) => e.msg).join(", ")}`)
    );
  }
  next();
}

/**
 * Username parameter validation middleware
 * Validates GitHub username format
 */
export const validateUsername = [
  param("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .matches(usernamePattern)
    .withMessage("Invalid GitHub username format"),
  handleValidationError,
];

/**
 * Pagination query parameters validation middleware
 * Validates page and per_page query parameters with defaults
 */
export const validatePaginationProps = [
  query("per_page")
    .default(5)
    .isInt({ min: 5 })
    .withMessage("Enter a valid numeric 'per_page' query value (minimum 5)")
    .toInt(),
  query("page")
    .default(1)
    .isInt({ min: 1 })
    .withMessage("Enter a valid numeric 'page' query value (minimum 1)")
    .toInt(),
  handleValidationError,
];