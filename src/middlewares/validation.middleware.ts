import {  Response, NextFunction } from "express";
import {param,validationResult} from "express-validator"
import { PopulatedRequest } from "@/types/request";
import { ValidationError } from "@/utils/error";

const usernamePattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
function handleValidationError(req:PopulatedRequest,_:Response,next:NextFunction){
  const errors = validationResult(req);
  if(!errors.isEmpty()) return next(new ValidationError(`${errors.array().map((e) => e.msg).toLocaleString()}`))
  next();
}
export const validateUsername = [
  param('username')
  .trim()
  .notEmpty()
  .withMessage("Username is required")
  .matches(usernamePattern)
  .withMessage('Invalid Github username format.')
  ,handleValidationError
]

