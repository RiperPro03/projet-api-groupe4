import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";

const contentReportParamsSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
});

const reportTargetSchema = {
  postId: z.string().trim().min(1, "postId is required").optional(),
  reportedUserId: z
    .string()
    .trim()
    .min(1, "reportedUserId is required")
    .optional(),
} as const;

const hasExactlyOneReportTarget = (data: {
  postId?: string;
  reportedUserId?: string;
}) =>
  [data.postId, data.reportedUserId].filter((value) => value !== undefined)
    .length === 1;

const createContentReportSchema = z
  .object({
    message: z.string().trim().min(1, "message is required"),
    ...reportTargetSchema,
  })
  .refine(hasExactlyOneReportTarget, {
    message: "Exactly one of postId or reportedUserId must be provided",
  });

const updateContentReportSchema = z
  .object({
    message: z.string().trim().min(1, "message is required").optional(),
    ...reportTargetSchema,
  })
  .refine(
    (data) =>
      data.message !== undefined ||
      data.postId !== undefined ||
      data.reportedUserId !== undefined,
    {
      message: "At least one field must be provided",
    },
  )
  .refine(
    (data) =>
      data.postId === undefined || data.reportedUserId === undefined,
    {
      message: "Only one of postId or reportedUserId can be provided",
    },
  );

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

export const validateCreateContentReport = validateBody(
  createContentReportSchema,
);
export const validateUpdateContentReport = validateBody(
  updateContentReportSchema,
);
export const validateContentReportParams = validateParams(
  contentReportParamsSchema,
);

export {
  contentReportParamsSchema,
  createContentReportSchema,
  updateContentReportSchema,
};
