import type { ErrorRequestHandler, RequestHandler } from "express";

import { env } from "../config/env";

type ApiError = Error & {
  status?: number;
  statusCode?: number;
};

export const notFoundMiddleware: RequestHandler = (_req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
};

export const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const apiError = error as ApiError;
  const statusCode =
    typeof apiError.statusCode === "number"
      ? apiError.statusCode
      : typeof apiError.status === "number"
        ? apiError.status
        : 500;

  if (statusCode !== 500) {
    res.status(statusCode).json({
      status: "error",
      message: apiError.message,
    });
    return;
  }

  res.status(500).json({
    status: "error",
    message: "Internal server error",
    ...(env.NODE_ENV === "development"
      ? {
          details: apiError.message,
        }
      : {}),
  });
};
