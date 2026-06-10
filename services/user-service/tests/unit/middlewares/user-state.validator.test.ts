import type { NextFunction, Request } from "express";
import { describe, expect, it, vi } from "vitest";

import {
  validateCreateUserState,
  validateUpdateUserState,
  validateUserStateParams,
} from "../../../src/middlewares/user-state.validator";
import { createMockResponse } from "../../utils/mock-response";

describe("user-state.validator", () => {
  it("validateCreateUserState trims the payload and calls next", () => {
    const req = {
      body: {
        id_user: " user-1 ",
        role: "USER",
        statuts: "ACTIVE",
      },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    validateCreateUserState(req, res, next);

    expect(req.body).toEqual({
      id_user: "user-1",
      role: "USER",
      statuts: "ACTIVE",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("validateCreateUserState returns 400 for invalid input", () => {
    const req = {
      body: {
        id_user: "",
        role: "OWNER",
      },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    validateCreateUserState(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Invalid request data",
      errors: expect.arrayContaining([
        {
          path: "id_user",
          message: "id_user is required",
        },
        expect.objectContaining({
          path: "role",
        }),
      ]),
    });
  });

  it("validateUpdateUserState accepts partial updates", () => {
    const req = {
      body: {
        statuts: "INACTIVE",
      },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    validateUpdateUserState(req, res, next);

    expect(req.body).toEqual({
      statuts: "INACTIVE",
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("validateUpdateUserState rejects empty payloads", () => {
    const req = {
      body: {},
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    validateUpdateUserState(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Invalid request data",
      errors: [
        {
          path: "body",
          message: "At least one field must be provided",
        },
      ],
    });
  });

  it("validateUserStateParams trims route params", () => {
    const req = {
      params: {
        id_user: " user-42 ",
      },
    } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    validateUserStateParams(req, res, next);

    expect(req.params).toEqual({
      id_user: "user-42",
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
