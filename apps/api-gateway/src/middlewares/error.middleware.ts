import type { ErrorRequestHandler, RequestHandler } from "express";

import { env } from "../config/env";
import { ServiceError } from "../utils/http-client";

type AppError = Error & {
  status?: number;
  statusCode?: number;
  payload?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const notFoundMiddleware: RequestHandler = (_req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
};

export const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ServiceError) {
    if (isRecord(error.payload)) {
      res.status(error.statusCode).json(error.payload);
      return;
    }

    res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  const appError = error as AppError;
  const statusCode =
    typeof appError.statusCode === "number"
      ? appError.statusCode
      : typeof appError.status === "number"
        ? appError.status
        : 500;

  if (statusCode !== 500) {
    if (isRecord(appError.payload)) {
      res.status(statusCode).json(appError.payload);
      return;
    }

    res.status(statusCode).json({
      status: "error",
      message: appError.message,
    });
    return;
  }

  res.status(500).json({
    status: "error",
    message: "Internal server error",
    ...(env.nodeEnv === "development" && appError.message
      ? {
          details: appError.message,
        }
      : {}),
  });
};
