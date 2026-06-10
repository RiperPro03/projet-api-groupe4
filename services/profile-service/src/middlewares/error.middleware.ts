import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(404, "Route not found"));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Invalid request",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }

  if (
    error instanceof mongoose.mongo.MongoServerError &&
    error.code === 11000
  ) {
    const duplicateField = Object.keys(error.keyPattern ?? {})[0] ?? "field";

    return res.status(409).json({
      status: "error",
      message: `${duplicateField} already exists`,
    });
  }

  console.error(error);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
