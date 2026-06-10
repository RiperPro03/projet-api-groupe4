import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";

import {
  USER_STATE_ROLES,
  USER_STATE_STATUSES,
} from "../models/user.model";

const userStateParamsSchema = z.object({
  id_user: z.string().trim().min(1, "id_user is required"),
});

const createUserStateSchema = z.object({
  id_user: z.string().trim().min(1, "id_user is required"),
  role: z.enum(USER_STATE_ROLES).optional(),
  statuts: z.enum(USER_STATE_STATUSES).optional(),
});

const updateUserStateSchema = z
  .object({
    role: z.enum(USER_STATE_ROLES).optional(),
    statuts: z.enum(USER_STATE_STATUSES).optional(),
  })
  .refine((data) => data.role !== undefined || data.statuts !== undefined, {
    message: "At least one field must be provided",
  });

const formatZodError = (error: z.ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join(".") || "body",
    message: issue.message,
  }));

const sendValidationError = (res: Response, error: z.ZodError) => {
  return res.status(400).json({
    status: "error",
    message: "Invalid request data",
    errors: formatZodError(error),
  });
};

const validateBody =
  <T>(schema: z.ZodType<T>): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    req.body = result.data;
    next();
  };

const validateParams =
  <T>(schema: z.ZodType<T>): RequestHandler =>
  (req: Request, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return sendValidationError(res, result.error);
    }

    req.params = result.data as Request["params"];
    next();
  };

export const validateCreateUserState = validateBody(createUserStateSchema);
export const validateUpdateUserState = validateBody(updateUserStateSchema);
export const validateUserStateParams = validateParams(userStateParamsSchema);

export {
  createUserStateSchema,
  updateUserStateSchema,
  userStateParamsSchema,
};
