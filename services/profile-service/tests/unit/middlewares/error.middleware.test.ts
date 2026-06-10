import type { NextFunction, Request } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AppError,
  errorHandler,
  notFoundHandler,
} from "../../../src/middlewares/error.middleware";
import { createMockResponse } from "../../utils/mock-response";

describe("error.middleware", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("notFoundHandler forwards a 404 AppError", () => {
    const next = vi.fn() as NextFunction;

    notFoundHandler({} as Request, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "AppError",
        statusCode: 404,
        message: "Route not found",
      }),
    );
  });

  it("errorHandler maps ZodError to a 400 response", () => {
    const parseResult = z.object({
      id_user: z.string().min(1),
    }).safeParse({
      id_user: "",
    });

    if (parseResult.success) {
      throw new Error("Expected validation to fail");
    }

    const res = createMockResponse();

    errorHandler(parseResult.error, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Invalid request",
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: "id_user",
        }),
      ]),
    });
  });

  it("errorHandler returns the status and message from AppError", () => {
    const res = createMockResponse();

    errorHandler(
      new AppError(404, "Profile not found"),
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Profile not found",
    });
  });

  it("errorHandler maps mongoose validation errors to 400", () => {
    const validationError = new mongoose.Error.ValidationError();

    validationError.addError(
      "username",
      new mongoose.Error.ValidatorError({
        path: "username",
        message: "username is required",
      }),
    );

    const res = createMockResponse();

    errorHandler(
      validationError,
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: validationError.message,
    });
  });

  it("errorHandler maps duplicate Mongo keys to 409", () => {
    const duplicateError = Object.assign(new Error("duplicate key"), {
      code: 11000,
      keyPattern: { username: 1 },
    });

    Object.setPrototypeOf(
      duplicateError,
      mongoose.mongo.MongoServerError.prototype,
    );

    const res = createMockResponse();

    errorHandler(
      duplicateError,
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "username already exists",
    });
  });

  it("errorHandler returns 500 for unknown errors", () => {
    const res = createMockResponse();
    const error = new Error("unexpected");

    errorHandler(error, {} as Request, res, vi.fn() as NextFunction);

    expect(console.error).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal server error",
    });
  });
});
